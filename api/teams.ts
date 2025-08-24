import { storage } from "./_lib/storage";

export default async function handler(req: any, res: any) {
  const { action } = req.query;
  
  try {
    switch (action) {
      case 'register':
        if (req.method !== 'POST') {
          return res.status(405).json({ message: 'Method not allowed' });
        }
        
        // Check if registration is open
        const registrationOpen = await storage.getSetting("registration_open");
        if (registrationOpen !== "true") {
          return res.status(400).json({ message: "Registration is currently closed" });
        }

        // Basic validation instead of strict schema
        const teamName = req.body.teamName;
        const membersString = req.body.members;
        
        if (!teamName || teamName.trim() === "") {
          return res.status(400).json({ message: "Team name is required" });
        }

        let members = [];
        try {
          members = JSON.parse(membersString || '[]');
        } catch (e) {
          return res.status(400).json({ message: "Invalid member data format" });
        }

        if (!Array.isArray(members) || members.length === 0) {
          return res.status(400).json({ message: "At least one team member is required" });
        }

        // Validate each member has an IGN
        for (let i = 0; i < members.length; i++) {
          const member = members[i] as any;
          if (!member?.ign || member.ign.trim() === "") {
            return res.status(400).json({ message: `IGN is required for member ${i + 1}` });
          }
        }

        // Note: This assumes userId is passed somehow, in real implementation you'd get it from session
        const userId = 1; // This needs proper authentication
        
        // Create new team
        const team = await storage.createTeam({
          teamName: teamName.trim(),
          leaderId: userId,
          membersJson: JSON.stringify(members),
          paymentProofPath: null,
          status: "pending",
          rejectionReason: null,
        });
        
        return res.json({ team, message: "Team registered successfully! Awaiting payment approval." });
        
      case 'my-team':
        if (req.method !== 'GET') {
          return res.status(405).json({ message: 'Method not allowed' });
        }
        
        // Note: This assumes userId is passed somehow, in real implementation you'd get it from session
        const currentUserId = 1; // This needs proper authentication
        
        const userTeam = await storage.getTeamByLeaderId(currentUserId);
        if (!userTeam) {
          return res.status(404).json({ message: "No team found" });
        }

        return res.json({
          ...userTeam,
          members: JSON.parse(userTeam.membersJson),
        });
        
      default:
        return res.status(404).json({ message: 'Action not found' });
    }
  } catch (error) {
    console.error("Teams error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}