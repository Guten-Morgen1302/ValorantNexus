export default async function handler(req, res) {
  try {
    res.json({ 
      message: "Test endpoint working",
      hasDatabase: !!process.env.DATABASE_URL,
      hasSession: !!process.env.SESSION_SECRET,
      nodeEnv: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
}