import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { pgTable, varchar, text, serial, timestamp, integer, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import ws from "ws";

// Schema definitions
const users = pgTable("users", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
  name: varchar("name").notNull(),
  email: varchar("email").notNull().unique(),
  discordId: varchar("discord_id").notNull(),
  passwordHash: varchar("password_hash").notNull()
});

const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  passwordHash: true
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters")
});

// Database setup
neonConfig.webSocketConstructor = ws;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check environment variables
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL not set");
    }

    // Initialize database connection
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool });

    const validatedData = insertUserSchema.parse(req.body);
    
    // Check if user already exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, validatedData.email));
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 10);
    
    // Create user
    const [user] = await db
      .insert(users)
      .values({
        name: validatedData.name,
        email: validatedData.email,
        discordId: validatedData.discordId,
        passwordHash,
      })
      .returning();

    res.json({ user: { id: user.id, name: user.name, email: user.email, discordId: user.discordId } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error", error: String(error) });
  }
}