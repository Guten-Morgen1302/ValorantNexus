import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, initializeDatabase } from './_lib/db';
import { teams, settings } from '../../shared/schema';
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

export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized();

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'register') {
      // For now, return a simplified response since file upload is complex in serverless
      return NextResponse.json({ 
        message: "Team registration is currently under maintenance. Please try again later." 
      }, { status: 503 });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Teams POST error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureDbInitialized();

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'my-team') {
      // Return null for now since we don't have session management
      return NextResponse.json(null);
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Teams GET error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}