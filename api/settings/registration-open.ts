import { storage } from "../_lib/storage";

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const registrationOpen = await storage.getSetting("registration_open");
    res.json({ registrationOpen: registrationOpen === "true" });
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}