import { storage } from "./_lib/storage";

export default async function handler(req: any, res: any) {
  const { action } = req.query;
  
  try {
    switch (action) {
      case 'registration-open':
        if (req.method !== 'GET') {
          return res.status(405).json({ message: 'Method not allowed' });
        }
        
        const registrationOpen = await storage.getSetting("registration_open");
        return res.json({ registrationOpen: registrationOpen === "true" });
        
      default:
        return res.status(404).json({ message: 'Action not found' });
    }
  } catch (error) {
    console.error("Settings error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}