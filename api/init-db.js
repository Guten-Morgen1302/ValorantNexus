import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { pgTable, varchar, text, serial, timestamp, integer, index, jsonb } from "drizzle-orm/pg-core";
import ws from "ws";

// Schema definitions
const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

const users = pgTable("users", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
  name: varchar("name").notNull(),
  email: varchar("email").notNull().unique(),
  discordId: varchar("discord_id").notNull(),
  passwordHash: varchar("password_hash").notNull()
});

const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
  email: varchar("email").notNull().unique(),
  passwordHash: varchar("password_hash").notNull()
});

const settings = pgTable("settings", {
  key: varchar("key").primaryKey(),
  value: varchar("value").notNull()
});

const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
  teamName: varchar("team_name").notNull(),
  leaderId: integer("leader_id").notNull().references(() => users.id),
  membersJson: text("members_json").notNull(),
  paymentProofPath: varchar("payment_proof_path"),
  status: varchar("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason")
});

// Database setup
neonConfig.webSocketConstructor = ws;

export default async function handler(req, res) {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool });

    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions(expire);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT NOW(),
        name VARCHAR NOT NULL,
        email VARCHAR NOT NULL UNIQUE,
        discord_id VARCHAR NOT NULL,
        password_hash VARCHAR NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT NOW(),
        email VARCHAR NOT NULL UNIQUE,
        password_hash VARCHAR NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR PRIMARY KEY,
        value VARCHAR NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT NOW(),
        team_name VARCHAR NOT NULL,
        leader_id INTEGER NOT NULL REFERENCES users(id),
        members_json TEXT NOT NULL,
        payment_proof_path VARCHAR,
        status VARCHAR NOT NULL DEFAULT 'pending',
        rejection_reason TEXT
      );
    `);

    // Insert default settings
    await pool.query(`
      INSERT INTO settings (key, value) VALUES ('registration_open', 'true') 
      ON CONFLICT (key) DO NOTHING;
    `);

    // Create default admin
    const bcrypt = await import('bcrypt');
    const defaultAdminHash = await bcrypt.hash('admin123!', 10);
    
    await pool.query(`
      INSERT INTO admins (email, password_hash) VALUES ($1, $2) 
      ON CONFLICT (email) DO NOTHING;
    `, ['admin@tournament.com', defaultAdminHash]);

    res.json({ 
      success: true, 
      message: "Database initialized successfully",
      tables: ["sessions", "users", "admins", "settings", "teams"]
    });
  } catch (error) {
    console.error("Database initialization error:", error);
    res.status(500).json({ 
      success: false, 
      error: String(error),
      message: "Failed to initialize database"
    });
  }
}