# Vercel Frontend Deployment Guide

## Pre-Deployment Checklist ✅
- ✅ Backend live on Render: `https://smart-student-hub-sj5o.onrender.com`
- ✅ Frontend cleaned (11 unused packages removed)
- ✅ All hardcoded paths converted to aliases
- ✅ Environment variables separated (no backend secrets in frontend)
- ✅ `.env.local` points to live backend

## Vercel Setup Steps

### 1. Connect GitHub Repository
1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your GitHub repo: `smart-student-hub`
4. Select `frontend` directory as root

### 2. Environment Variables
Add in Vercel Dashboard (Settings → Environment Variables):

```
NEXT_PUBLIC_API_URL = https://smart-student-hub-sj5o.onrender.com
```

**Important:** Must have `NEXT_PUBLIC_` prefix (it's a public variable that runs in browser)

### 3. Deploy
Click "Deploy" → Vercel will automatically:
- Detect Next.js 15.5.14
- Install dependencies
- Build the project
- Deploy to edge network

## Post-Deployment

Your frontend will be available at a URL like:
```
https://smart-student-hub-[random].vercel.app
```

Or if you have a custom domain configured, at your domain.

## Testing

After deployment:
1. Open the Vercel URL
2. Login with test credentials
3. Verify API calls work (check browser DevTools → Network tab)
4. All requests should go to `https://smart-student-hub-sj5o.onrender.com`

## API Endpoints Connected

Frontend will automatically call:
- `/auth/login` - User authentication
- `/auth/register` - User registration
- `/auth/profile` - User profile
- `/admin/*` - Admin operations
- `/faculty/*` - Faculty operations
- `/students/*` - Student operations
- `/files/*` - File upload/download

All pointing to your live Render backend ✅
