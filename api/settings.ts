
import { VercelRequest, VercelResponse } from '@vercel/node';
import { db, initializeDatabase } from './_lib/db';
import { settings } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Initialize database on first request
let dbInitialized = false;

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await ensureDbInitialized();
    
    const { action } = req.query;
    
    if (action === 'registration-open') {
      const [setting] = await db.select().from(settings).where(eq(settings.key, 'registration_open')).limit(1);
      const registrationOpen = setting?.value === 'true';
      
      return res.status(200).json({ registrationOpen });
    }

    return res.status(400).json({ message: "Invalid action" });
  } catch (error) {
    console.error("Settings error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
