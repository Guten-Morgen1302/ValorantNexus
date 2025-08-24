
import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { db, initializeDatabase } from './_lib/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Initialize database on first request
let dbInitialized = false;

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  discordId: z.string().min(1, "Discord ID is required"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required")
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await ensureDbInitialized();
    
    const { action } = req.query;
    
    if (req.method === 'POST') {
      if (action === 'signup') {
        const validatedData = signupSchema.parse(req.body);
        
        // Check if user already exists
        const existingUser = await db.select().from(users).where(eq(users.email, validatedData.email)).limit(1);
        
        if (existingUser.length > 0) {
          return res.status(400).json({ message: "User already exists with this email" });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(validatedData.password, 10);
        
        // Create user
        const [newUser] = await db.insert(users).values({
          name: validatedData.name,
          email: validatedData.email,
          discordId: validatedData.discordId,
          passwordHash,
        }).returning();

        return res.status(200).json({ 
          user: { 
            id: newUser.id, 
            name: newUser.name, 
            email: newUser.email, 
            discordId: newUser.discordId 
          } 
        });
      }
      
      if (action === 'login') {
        const { email, password } = loginSchema.parse(req.body);
        
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        
        if (!user) {
          return res.status(401).json({ message: "Invalid email or password" });
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
          return res.status(401).json({ message: "Invalid email or password" });
        }

        return res.status(200).json({ 
          user: { 
            id: user.id, 
            name: user.name, 
            email: user.email, 
            discordId: user.discordId 
          } 
        });
      }

      return res.status(400).json({ message: "Invalid action" });
    }

    if (req.method === 'GET') {
      if (action === 'user') {
        // For now, return a basic response since we don't have session management in serverless
        return res.status(200).json({ user: null });
      }

      return res.status(400).json({ message: "Invalid action" });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Auth error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
}
