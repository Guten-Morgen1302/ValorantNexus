import { storage } from "../_lib/storage";

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Note: In serverless, user authentication will need different handling
    res.status(401).json({ message: "Authentication required" });
  } catch (error) {
    console.error("Get team error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}