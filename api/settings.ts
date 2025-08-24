
import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDatabase } from './_lib/db';
import { settings } from '../../shared/schema';
import { eq } from 'drizzle-orm';

// Initialize database on first request
let dbInitialized = false;

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureDbInitialized();
    
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    if (action === 'registration-open') {
      const [setting] = await db.select().from(settings).where(eq(settings.key, 'registration_open')).limit(1);
      const registrationOpen = setting?.value === 'true';
      
      return NextResponse.json({ registrationOpen });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Settings error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
