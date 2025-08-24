import { storage } from "./_lib/storage";
import { comparePassword } from "./_lib/auth";

export default async function handler(req: any, res: any) {
  const { action } = req.query;
  
  try {
    switch (action) {
      case 'login':
        if (req.method !== 'POST') {
          return res.status(405).json({ message: 'Method not allowed' });
        }
        
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

        return res.json({ message: "Admin logged in successfully", admin: { id: admin.id, email: admin.email } });
        
      case 'teams':
        if (req.method === 'GET') {
          const teams = await storage.getAllTeams();
          return res.json({ teams });
        }
        
        if (req.method === 'POST') {
          const { teamId, status, reason } = req.body;
          if (status === 'approved') {
            await storage.updateTeamStatus(teamId, "approved");
            return res.json({ message: "Team approved successfully" });
          } else if (status === 'rejected') {
            await storage.updateTeamStatus(teamId, "rejected", reason);
            return res.json({ message: "Team rejected successfully" });
          }
        }
        
        if (req.method === 'DELETE') {
          const { teamId } = req.body;
          await storage.deleteTeam(teamId);
          return res.json({ message: "Team deleted successfully" });
        }
        
        return res.status(405).json({ message: 'Method not allowed' });
        
      case 'logout':
        if (req.method !== 'POST') {
          return res.status(405).json({ message: 'Method not allowed' });
        }
        return res.json({ message: "Admin logged out successfully" });
        
      case 'check':
        if (req.method !== 'GET') {
          return res.status(405).json({ message: 'Method not allowed' });
        }
        return res.json({ isAdmin: true });
        
      case 'settings':
        if (req.method !== 'POST') {
          return res.status(405).json({ message: 'Method not allowed' });
        }
        const { registrationOpen } = req.body;
        await storage.setSetting("registration_open", registrationOpen ? "true" : "false");
        return res.json({ message: "Registration status updated", registrationOpen });
        
      default:
        return res.status(404).json({ message: 'Action not found' });
    }
  } catch (error) {
    console.error("Admin error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}