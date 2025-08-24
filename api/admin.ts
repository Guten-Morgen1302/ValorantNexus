
import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { db, initializeDatabase } from './_lib/db';
import { admins, teams, settings } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Initialize database on first request
let dbInitialized = false;

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

const adminLoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required")
});

const updateSettingSchema = z.object({
  key: z.string(),
  value: z.string()
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await ensureDbInitialized();
    
    const { action } = req.query;
    
    if (req.method === 'POST') {
      if (action === 'login') {
        const { email, password } = adminLoginSchema.parse(req.body);
        
        const [admin] = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
        
        if (!admin) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
        if (!isValidPassword) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        return res.status(200).json({ 
          admin: { 
            id: admin.id, 
            email: admin.email 
          } 
        });
      }

      return res.status(400).json({ message: "Invalid action" });
    }

    if (req.method === 'GET') {
      if (action === 'teams') {
        const allTeams = await db.select().from(teams);
        return res.status(200).json(allTeams);
      }

      if (action === 'check') {
        // For now, return a basic response since we don't have session management
        return res.status(200).json({ admin: null });
      }

      return res.status(400).json({ message: "Invalid action" });
    }

    if (req.method === 'PUT') {
      if (action === 'settings') {
        const { key, value } = updateSettingSchema.parse(req.body);
        
        await db.insert(settings).values({ key, value })
          .onConflictDoUpdate({ 
            target: settings.key, 
            set: { value } 
          });

        return res.status(200).json({ message: "Setting updated successfully" });
      }

      return res.status(400).json({ message: "Invalid action" });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Admin error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
}
