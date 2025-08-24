import { storage } from "./_lib/storage";
import { hashPassword, comparePassword } from "./_lib/auth";
import { insertUserSchema, loginSchema } from "../shared/schema";
import { z } from "zod";

export default async function handler(req: any, res: any) {
  const { action } = req.query;
  
  try {
    switch (action) {
      case 'login':
        if (req.method !== 'POST') {
          return res.status(405).json({ message: 'Method not allowed' });
        }
        
        const { email, password } = loginSchema.parse(req.body);
        
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return res.status(401).json({ message: "Invalid email or password" });
        }

        const isValidPassword = await comparePassword(password, user.passwordHash);
        if (!isValidPassword) {
          return res.status(401).json({ message: "Invalid email or password" });
        }

        return res.json({ user: { id: user.id, name: user.name, email: user.email, discordId: user.discordId } });
        
      case 'signup':
        if (req.method !== 'POST') {
          return res.status(405).json({ message: 'Method not allowed' });
        }
        
        const validatedData = insertUserSchema.parse(req.body);
        
        // Check if user already exists
        const existingUser = await storage.getUserByEmail(validatedData.email);
        if (existingUser) {
          return res.status(400).json({ message: "User already exists with this email" });
        }

        const passwordHash = await hashPassword(validatedData.password);
        const newUser = await storage.createUser({
          name: validatedData.name,
          email: validatedData.email,
          discordId: validatedData.discordId,
          passwordHash,
        });

        return res.json({ user: { id: newUser.id, name: newUser.name, email: newUser.email, discordId: newUser.discordId } });
        
      case 'logout':
        if (req.method !== 'POST') {
          return res.status(405).json({ message: 'Method not allowed' });
        }
        return res.json({ message: "Logged out successfully" });
        
      case 'user':
        if (req.method !== 'GET') {
          return res.status(405).json({ message: 'Method not allowed' });
        }
        return res.status(401).json({ message: "Authentication required" });
        
      default:
        return res.status(404).json({ message: 'Action not found' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    console.error("Auth error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}