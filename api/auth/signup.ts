import { storage } from "../_lib/storage";
import { hashPassword } from "../_lib/auth";
import { insertUserSchema } from "../../shared/schema";
import { z } from "zod";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const validatedData = insertUserSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const passwordHash = await hashPassword(validatedData.password);
    const user = await storage.createUser({
      name: validatedData.name,
      email: validatedData.email,
      discordId: validatedData.discordId,
      passwordHash,
    });

    res.json({ user: { id: user.id, name: user.name, email: user.email, discordId: user.discordId } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}