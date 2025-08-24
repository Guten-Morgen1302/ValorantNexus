import { storage } from "../_lib/storage";

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Note: In serverless, admin authentication will need different handling
    const teams = await storage.getAllTeams();
    res.json({ teams });
  } catch (error) {
    console.error("Get admin teams error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}