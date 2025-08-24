import express, { type Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

// Extend session interface to include our custom properties
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    adminId?: number;
  }
}
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { initializeDatabase } from "./db";
import { userAuth, adminAuth, hashPassword, comparePassword } from "./middleware/auth";
import { upload } from "./middleware/upload";
import { insertUserSchema, loginSchema, insertTeamSchema } from "@shared/schema";
import { z } from "zod";
import path from "path";
import fs from "fs";

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { message: "Too many registration attempts, please try again later" }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Trust proxy for rate limiting
  app.set('trust proxy', 1);
  
  // Initialize database
  await initializeDatabase();

  // Session middleware with PostgreSQL store
  const PostgreSqlStore = connectPgSimple(session);
  
  app.use(session({
    store: new PostgreSqlStore({
      conString: process.env.DATABASE_URL,
      tableName: 'sessions',
      createTableIfMissing: false // We already have the table
    }),
    name: 'tournament-session',
    secret: process.env.SESSION_SECRET || 'fallback-secret-for-dev-only',
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiry on activity
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      httpOnly: true, // Prevent XSS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax' // CSRF protection
    }
  }));

  // Serve uploaded files - allow team leaders and admins to view payment proofs
  app.use('/uploads', async (req, res, next) => {
    try {
      const isAdmin = req.session?.adminId;
      const userId = req.session?.userId;
      
      if (!isAdmin && !userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // If not admin, check if user owns the file they're trying to access
      if (!isAdmin && userId) {
        const filename = req.url.split('/').pop();
        const team = await storage.getTeamByLeaderId(userId);
        
        if (!team || team.paymentProofPath !== filename) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      next();
    } catch (error) {
      console.error('File access error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app.use('/uploads', express.static(path.join(process.cwd(), 'server', 'uploads')));

  // Auth routes
  app.post('/api/auth/signup', registerLimiter, async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      const passwordHash = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        name: validatedData.name,
        email: validatedData.email,
        discordId: validatedData.discordId,
        passwordHash,
      });

      req.session.userId = user.id;
      res.json({ user: { id: user.id, name: user.name, email: user.email, discordId: user.discordId } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Signup error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isValidPassword = await comparePassword(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.session.userId = user.id;
      res.json({ user: { id: user.id, name: user.name, email: user.email, discordId: user.discordId } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) console.error('Session destroy error:', err);
    });
    res.json({ message: "Logged out successfully" });
  });

  app.get('/api/auth/user', userAuth, (req, res) => {
    res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email, discordId: req.user.discordId } });
  });

  // Team routes
  app.post('/api/teams/register', userAuth, upload.single('paymentProof'), async (req, res) => {
    try {

      // Check if registration is open
      const registrationOpen = await storage.getSetting("registration_open");
      if (registrationOpen !== "true") {
        return res.status(400).json({ message: "Registration is currently closed" });
      }

      // Check if user already has a team
      const existingTeam = await storage.getTeamByLeaderId(req.userId!);
      if (existingTeam && existingTeam.status !== "rejected") {
        return res.status(400).json({ message: "You have already registered a team" });
      }

      // Basic validation instead of strict schema
      const teamName = req.body.teamName;
      const membersString = req.body.members;
      
      if (!teamName || teamName.trim() === "") {
        return res.status(400).json({ message: "Team name is required" });
      }

      let members = [];
      try {
        members = JSON.parse(membersString || '[]');
      } catch (e) {
        return res.status(400).json({ message: "Invalid member data format" });
      }

      if (!Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ message: "At least one team member is required" });
      }

      // Validate each member has an IGN
      for (let i = 0; i < members.length; i++) {
        const member = members[i];
        if (!member.ign || member.ign.trim() === "") {
          return res.status(400).json({ message: `IGN is required for member ${i + 1}` });
        }
      }

      let team;
      if (existingTeam && existingTeam.status === "rejected") {
        // Update existing rejected team with new submission
        await storage.updateTeam(existingTeam.id, {
          teamName: teamName.trim(),
          membersJson: JSON.stringify(members),
          paymentProofPath: req.file?.filename || null,
          status: "pending",
          rejectionReason: null,
        });
        team = await storage.getTeamByLeaderId(req.userId!);
      } else {
        // Create new team
        team = await storage.createTeam({
          teamName: teamName.trim(),
          leaderId: req.userId!,
          membersJson: JSON.stringify(members),
          paymentProofPath: req.file?.filename || null,
          status: "pending",
          rejectionReason: null,
        });
      }

      const message = existingTeam && existingTeam.status === "rejected" 
        ? "Team resubmitted successfully! Awaiting payment approval." 
        : "Team registered successfully! Awaiting payment approval.";
      
      res.json({ team, message });
    } catch (error) {
      console.error("Team registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/teams/my-team', userAuth, async (req, res) => {
    try {
      const team = await storage.getTeamByLeaderId(req.userId!);
      if (!team) {
        return res.status(404).json({ message: "No team found" });
      }

      res.json({
        ...team,
        members: JSON.parse(team.membersJson),
      });
    } catch (error) {
      console.error("Get team error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/settings/registration-open', async (req, res) => {
    try {
      const registrationOpen = await storage.getSetting("registration_open");
      res.json({ registrationOpen: registrationOpen === "true" });
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin routes - secure admin authentication
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Treat username as email for admin login
      const admin = await storage.getAdminByEmail(username);
      if (!admin) {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }

      const isValidPassword = await comparePassword(password, admin.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }

      req.session.adminId = admin.id;
      res.json({ message: "Admin logged in successfully", admin: { id: admin.id, email: admin.email } });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/admin/logout', (req, res) => {
    if (req.session.adminId) {
      delete req.session.adminId;
    }
    res.json({ message: "Admin logged out successfully" });
  });

  app.get('/api/admin/check', adminAuth, (req, res) => {
    res.json({ isAdmin: true });
  });

  app.get('/api/admin/teams', adminAuth, async (req, res) => {
    try {
      const teams = await storage.getAllTeams();
      res.json({ teams });
    } catch (error) {
      console.error("Get admin teams error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/admin/teams/:id/approve', adminAuth, async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      await storage.updateTeamStatus(teamId, "approved");
      res.json({ message: "Team approved successfully" });
    } catch (error) {
      console.error("Approve team error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/admin/teams/:id/reject', adminAuth, async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const { reason } = req.body;
      await storage.updateTeamStatus(teamId, "rejected", reason);
      res.json({ message: "Team rejected successfully" });
    } catch (error) {
      console.error("Reject team error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/admin/settings/registration-toggle', adminAuth, async (req, res) => {
    try {
      const { registrationOpen } = req.body;
      await storage.setSetting("registration_open", registrationOpen ? "true" : "false");
      res.json({ message: "Registration status updated", registrationOpen });
    } catch (error) {
      console.error("Toggle registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete('/api/admin/teams/:id', adminAuth, async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      if (isNaN(teamId)) {
        return res.status(400).json({ message: "Invalid team ID" });
      }
      
      await storage.deleteTeam(teamId);
      res.json({ message: "Team deleted successfully" });
    } catch (error) {
      console.error("Delete team error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
