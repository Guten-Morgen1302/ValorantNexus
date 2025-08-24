import { users, teams, settings, admins, type User, type InsertUser, type Admin, type Team, type TeamWithUser } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: { name: string; email: string; discordId: string; passwordHash: string }): Promise<User>;
  
  // Admin operations
  getAdmin(id: number): Promise<Admin | undefined>;
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  createAdmin(admin: { email: string; passwordHash: string }): Promise<Admin>;
  
  // Team operations
  createTeam(team: Omit<Team, 'id' | 'createdAt'>): Promise<Team>;
  getTeamByLeaderId(leaderId: number): Promise<Team | undefined>;
  getAllTeams(): Promise<TeamWithUser[]>;
  updateTeamStatus(teamId: number, status: string, rejectionReason?: string): Promise<void>;
  updateTeamPaymentProof(teamId: number, paymentProofPath: string): Promise<void>;
  updateTeam(teamId: number, teamData: Partial<Omit<Team, 'id' | 'createdAt' | 'leaderId'>>): Promise<void>;
  deleteTeam(teamId: number): Promise<void>;
  
  // Settings operations
  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: { name: string; email: string; discordId: string; passwordHash: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        name: userData.name,
        email: userData.email,
        discordId: userData.discordId,
        passwordHash: userData.passwordHash,
      })
      .returning();
    return user;
  }

  async createTeam(teamData: Omit<Team, 'id' | 'createdAt'>): Promise<Team> {
    const [team] = await db
      .insert(teams)
      .values(teamData)
      .returning();
    return team;
  }

  async getTeamByLeaderId(leaderId: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.leaderId, leaderId));
    return team;
  }

  async getAllTeams(): Promise<TeamWithUser[]> {
    const result = await db
      .select({
        team: teams,
        leader: users,
      })
      .from(teams)
      .innerJoin(users, eq(teams.leaderId, users.id))
      .orderBy(desc(teams.createdAt));

    return result.map(({ team, leader }) => ({
      ...team,
      leader,
      members: JSON.parse(team.membersJson),
    }));
  }

  async updateTeamStatus(teamId: number, status: string, rejectionReason?: string): Promise<void> {
    await db
      .update(teams)
      .set({ status, rejectionReason })
      .where(eq(teams.id, teamId));
  }

  async updateTeamPaymentProof(teamId: number, paymentProofPath: string): Promise<void> {
    await db
      .update(teams)
      .set({ paymentProofPath })
      .where(eq(teams.id, teamId));
  }

  async updateTeam(teamId: number, teamData: Partial<Omit<Team, 'id' | 'createdAt' | 'leaderId'>>): Promise<void> {
    await db
      .update(teams)
      .set(teamData)
      .where(eq(teams.id, teamId));
  }

  async getSetting(key: string): Promise<string | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting?.value;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value },
      });
  }

  async getAdmin(id: number): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id));
    return admin;
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.email, email));
    return admin;
  }

  async createAdmin(adminData: { email: string; passwordHash: string }): Promise<Admin> {
    const [admin] = await db
      .insert(admins)
      .values(adminData)
      .returning();
    return admin;
  }

  async deleteTeam(teamId: number): Promise<void> {
    await db.delete(teams).where(eq(teams.id, teamId));
  }
}

export const storage = new DatabaseStorage();
