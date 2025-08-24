import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Initialize database with settings and default admin
export async function initializeDatabase() {
  try {
    // Insert default settings
    await db.insert(schema.settings).values({
      key: "registration_open",
      value: "true"
    }).onConflictDoNothing();
    
    // Create default admin if not exists
    const bcrypt = await import('bcrypt');
    const defaultAdminHash = await bcrypt.hash('admin123!', 10);
    
    await db.insert(schema.admins).values({
      email: 'admin@tournament.com',
      passwordHash: defaultAdminHash
    }).onConflictDoNothing();
    
    console.log('✓ Database initialized with default admin (admin@tournament.com / admin123!)');
  } catch (error) {
    console.log("Database already initialized");
  }
}
