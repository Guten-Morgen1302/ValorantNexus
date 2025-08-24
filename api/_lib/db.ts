
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users, teams, admins, settings } from '../../shared/schema';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);

let initialized = false;

export async function initializeDatabase() {
  if (initialized) return;
  
  try {
    // Check if admin exists
    const existingAdmin = await db.select().from(admins).limit(1);
    
    if (existingAdmin.length === 0) {
      // Create default admin
      const passwordHash = await bcrypt.hash('admin123!', 10);
      await db.insert(admins).values({
        email: 'admin@tournament.com',
        passwordHash,
      });
      console.log('✓ Default admin created');
    }

    // Create default settings
    const existingSettings = await db.select().from(settings).where(eq(settings.key, 'registration_open')).limit(1);
    if (existingSettings.length === 0) {
      await db.insert(settings).values({
        key: 'registration_open',
        value: 'true',
      });
    }

    initialized = true;
    console.log('✓ Database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}
