import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { storage } from "../storage";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      user?: any;
      adminId?: number;
      admin?: any;
    }
  }
}

export async function userAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.session.userId;
  
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const user = await storage.getUser(userId);
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  req.userId = userId;
  req.user = user;
  next();
}

export async function adminAuth(req: Request, res: Response, next: NextFunction) {
  const adminId = req.session.adminId;
  
  if (!adminId) {
    return res.status(401).json({ message: "Admin authentication required" });
  }

  const admin = await storage.getAdmin(adminId);
  if (!admin) {
    return res.status(401).json({ message: "Admin not found" });
  }

  req.adminId = adminId;
  req.admin = admin;
  next();
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
