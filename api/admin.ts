import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDatabase } from './_lib/db';

// Initialize database on first request
let dbInitialized = false;

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized();

    return NextResponse.json({ 
      message: "Admin functionality is currently under maintenance." 
    }, { status: 503 });
  } catch (error) {
    console.error("Admin error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureDbInitialized();

    return NextResponse.json({ isAdmin: false });
  } catch (error) {
    console.error("Admin GET error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}