# Vercel Deployment Instructions

Your project is now ready for Vercel deployment! 🎉

## Changes Made:
- ✅ **Reduced API functions from 16 → 4** (well under Vercel's 12 limit)
- ✅ **Consolidated endpoints**: `/api/auth`, `/api/admin`, `/api/teams`, `/api/settings`
- ✅ **Added proper vercel.json** configuration
- ✅ **Updated all frontend code** to use new API endpoints

## Before Deploying:

1. **Set Environment Variables in Vercel:**
   - `DATABASE_URL` = Your Neon database URL
   - `SESSION_SECRET` = Your session secret

2. **Deploy Command:**
   - Push your code to GitHub
   - Import project to Vercel
   - Vercel will automatically use the `vercel.json` configuration

## API Endpoints (Consolidated):
- **Auth**: `/api/auth?action=login|signup|logout|user`
- **Admin**: `/api/admin?action=login|teams|settings|logout|check`
- **Teams**: `/api/teams?action=register|my-team`
- **Settings**: `/api/settings?action=registration-open`

Your deployment should now work without the "too many functions" error!