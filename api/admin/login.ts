import { storage } from "../_lib/storage";
import { comparePassword } from "../_lib/auth";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    // Treat username as email for admin login
    const admin = await storage.getAdminByEmail(username);
    if (!admin) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const isValidPassword = await comparePassword(password, admin.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    res.json({ message: "Admin logged in successfully", admin: { id: admin.id, email: admin.email } });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}