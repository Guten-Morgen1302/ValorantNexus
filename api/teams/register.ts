import { storage } from "../_lib/storage";

interface TeamMember {
  ign: string;
  rank?: string;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check if registration is open
    const registrationOpen = await storage.getSetting("registration_open");
    if (registrationOpen !== "true") {
      return res.status(400).json({ message: "Registration is currently closed" });
    }

    // Basic validation
    const teamName = req.body.teamName;
    const membersString = req.body.members;
    
    if (!teamName || teamName.trim() === "") {
      return res.status(400).json({ message: "Team name is required" });
    }

    let members: TeamMember[] = [];
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
      const member = members[i];
      if (!member.ign || member.ign.trim() === "") {
        return res.status(400).json({ message: `IGN is required for member ${i + 1}` });
      }
    }

    // Note: In serverless, file upload and user auth will need different handling
    res.status(501).json({ message: "Team registration needs session management implementation" });
  } catch (error) {
    console.error("Team registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}