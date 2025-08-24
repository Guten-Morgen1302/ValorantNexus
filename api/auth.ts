
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { db, initializeDatabase } from './_lib/db';
import { users } from '../../shared/schema';
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

export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized();
    
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    if (action === 'signup') {
      const body = await request.json();
      const validatedData = signupSchema.parse(body);
      
      // Check if user already exists
      const existingUser = await db.select().from(users).where(eq(users.email, validatedData.email)).limit(1);
      
      if (existingUser.length > 0) {
        return NextResponse.json({ message: "User already exists with this email" }, { status: 400 });
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

      return NextResponse.json({ 
        user: { 
          id: newUser.id, 
          name: newUser.name, 
          email: newUser.email, 
          discordId: newUser.discordId 
        } 
      });
    }
    
    if (action === 'login') {
      const body = await request.json();
      const { email, password } = loginSchema.parse(body);
      
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      
      if (!user) {
        return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
      }

      return NextResponse.json({ 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          discordId: user.discordId 
        } 
      });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Auth error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureDbInitialized();
    
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    if (action === 'user') {
      // For now, return a basic response since we don't have session management in serverless
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Auth GET error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
