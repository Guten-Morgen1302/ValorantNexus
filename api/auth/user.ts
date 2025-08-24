import { storage } from "../_lib/storage";

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // In serverless, session management needs to be handled differently
  // For now, return authentication required
  return res.status(401).json({ message: "Authentication required" });
}