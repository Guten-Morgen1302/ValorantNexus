
import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { db, initializeDatabase } from './_lib/db';
import { teams, settings } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Initialize database on first request
let dbInitialized = false;

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

const teamSchema = z.object({
  teamName: z.string().min(1, "Team name is required"),
  members: z.array(z.object({
    ign: z.string().min(1, "IGN is required"),
    discord: z.string().optional()
  })).min(1, "At least one member is required")
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
      if (action === 'register') {
        // For now, return a simplified response since file upload is complex in serverless
        return res.status(503).json({ 
          message: "Team registration is currently under maintenance. Please try again later." 
        });
      }

      return res.status(400).json({ message: "Invalid action" });
    }

    if (req.method === 'GET') {
      if (action === 'my-team') {
        // Return null for now since we don't have session management
        return res.status(200).json(null);
      }

      return res.status(400).json({ message: "Invalid action" });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Teams error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
