import { sql } from "drizzle-orm";
import { pgTable, varchar, text, serial, timestamp, integer, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for PostgreSQL
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
  name: varchar("name").notNull(),
  email: varchar("email").notNull().unique(),
  discordId: varchar("discord_id").notNull(),
  passwordHash: varchar("password_hash").notNull(),
});

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
  email: varchar("email").notNull().unique(),
  passwordHash: varchar("password_hash").notNull(),
});

export const settings = pgTable("settings", {
  key: varchar("key").primaryKey(),
  value: varchar("value").notNull(),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
  teamName: varchar("team_name").notNull(),
  leaderId: integer("leader_id").notNull().references(() => users.id),
  membersJson: text("members_json").notNull(),
  paymentProofPath: varchar("payment_proof_path"),
  status: varchar("status").notNull().default("pending"), // pending | approved | rejected
  rejectionReason: text("rejection_reason"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  passwordHash: true,
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  leaderId: true,
  status: true,
  rejectionReason: true,
}).extend({
  members: z.array(z.object({
    ign: z.string().min(1, "IGN is required"),
    discord: z.string().optional(),
  })).min(1, "At least one member is required").max(5, "Maximum 5 members allowed"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Admin = typeof admins.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type LoginData = z.infer<typeof loginSchema>;

export type TeamWithUser = Team & {
  leader: User;
  members: Array<{ ign: string; discord?: string }>;
};
