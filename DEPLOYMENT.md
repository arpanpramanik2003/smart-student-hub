# 🚀 Complete Deployment Guide
## Smart Student Hub - Render + Supabase + Google Drive

Step-by-step guide to deploy your application with production-grade infrastructure.

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Step 1: Supabase Setup](#step-1-supabase-postgresql-setup)
4. [Step 2: Google Drive Setup](#step-2-google-drive-setup)
5. [Step 3: Deploy Backend (Render)](#step-3-deploy-backend-to-render)
6. [Step 4: Deploy Frontend (Vercel)](#step-4-deploy-frontend-to-vercel)
7. [Step 5: Testing](#step-5-post-deployment-testing)
8. [Troubleshooting](#troubleshooting)
9. [Cost & Monitoring](#cost--monitoring)

---

## 📝 Prerequisites

✅ GitHub account with repository pushed  
✅ Vercel account (sign up at vercel.com)  
✅ Render account (sign up at render.com)  
✅ Supabase account (sign up at supabase.com)  
✅ Google account with Drive access  

**Estimated Time:** 45 minutes  
**Total Cost:** $0/month (all free tiers)

---

## 🏗️ Architecture Overview

```
┌─────────────────────┐
│   Frontend (Vercel) │  → React + Vite
│   react-app.vercel  │  → Free Hosting
└──────────┬──────────┘
           │ HTTPS
           ↓
┌──────────────────────┐
│   Backend (Render)   │  → Node.js + Express
│   api.onrender.com   │  → Free Hosting
└────┬────────────┬────┘
     │            │
     ↓            ↓
┌──────────┐  ┌────────────┐
│ Supabase │  │   Google   │
│PostgreSQL│  │   Drive    │
│ 500MB    │  │   2TB      │
└──────────┘  └────────────┘
```

---

## 📝 Step 1: Supabase PostgreSQL Setup

### 1.1 Create Supabase Project

1. **Go to Supabase**
   - Visit: https://supabase.com
   - Click "New Project"

2. **Configure Project**
   ```
   Name: smart-student-hub
   Database Password: [Generate strong password and SAVE IT!]
   Region: [Choose closest to your users]
   Pricing Plan: Free (500MB)
   ```

3. **Wait for Project Creation** (~2 minutes)

### 1.2 Get Database Connection String

1. **Navigate to Settings**
   - Left sidebar → Project Settings → Database

2. **Find Connection String**
   - Scroll to "Connection String" section
   - Select **"URI"** tab (NOT "Transaction" or "Session")

3. **Copy Connection String**
   ```
   Format:
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   
   Replace [YOUR-PASSWORD] with your actual password
   ```

4. **✅ Save this - you'll need it for Render**

### 1.3 Verify Connection (Optional)

```bash
# In Supabase dashboard > SQL Editor
SELECT version();
# Should return PostgreSQL version
```

---

## 📁 Step 2: Google Drive Setup

### 2.1 Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com
   - Click "New Project"
   - Name: `smart-student-hub`
   - Click "Create" (wait 30 seconds)

2. **Enable Google Drive API**
   - Search: "Google Drive API"
   - Click "Enable"
   - Wait for activation (~1 minute)

### 2.2 Create Service Account

1. **Navigate to Service Accounts**
   - Left menu → IAM & Admin → Service Accounts
   - Click "+ Create Service Account"

2. **Create Account**
   ```
   Name: drive-uploader
   Description: Service account for file uploads
   
   Click "Create and Continue"
   Skip role assignment → Click "Continue"
   Skip user access → Click "Done"
   ```

3. **Create JSON Key**
   - Click on the service account you created
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Select: **JSON**
   - Click "Create"
   - **File downloads automatically - SAVE IT!**

4. **Copy Service Account Email**
   ```
   Format: drive-uploader@smart-student-hub-xxxxx.iam.gserviceaccount.com
   ✅ You'll need this in next step!
   ```

### 2.3 Create Google Drive Folder

1. **Go to Google Drive**
   - Visit: https://drive.google.com
   - Click "+ New" → "Folder"
   - Name: `SmartStudentHub-Uploads`
   - Click "Create"

2. **Get Folder ID**
   ```
   Open folder → Look at URL:
   https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ
   
   Copy the part after /folders/
   Example: 1aBcDeFgHiJkLmNoPqRsTuVwXyZ
   
   ✅ This is your GOOGLE_DRIVE_FOLDER_ID
   ```

3. **Share Folder with Service Account**
   ```
   Right-click folder → "Share"
   Paste service account email from Step 2.2.4
   Role: Editor
   Uncheck "Notify people"
   Click "Share"
   
   ✅ This allows the service account to upload files!
   ```

### 2.4 Prepare Credentials JSON

1. **Open downloaded JSON file**
2. **Copy entire contents** (starts with `{` ends with `}`)
3. **✅ Keep ready for Render environment variables**

---

## 🖥️ Step 3: Deploy Backend to Render

### 3.1 Create Web Service

1. **Go to Render Dashboard**
   - Visit: https://render.com
   - Click "New +" → "Web Service"

2. **Connect GitHub**
   - Connect your GitHub account
   - Select: `smart-student-hub` repository
   - Click "Connect"

3. **Configure Service**
   ```
   Name: smart-student-hub-api
   Region: [Choose closest to users]
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```

### 3.2 Add Environment Variables

Click "Advanced" → Scroll to "Environment Variables" → Add these:

| Key | Value | Example |
|-----|-------|---------|
| `NODE_ENV` | `production` | - |
| `PORT` | `5000` | - |
| `JWT_SECRET` | Generate new secret* | See command below |
| `JWT_EXPIRES_IN` | `24h` | - |
| `DATABASE_URL` | Your Supabase connection string | From Step 1.2 |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app` | Update after frontend deploy |
| `GOOGLE_DRIVE_FOLDER_ID` | Your folder ID | From Step 2.3.2 |
| `GOOGLE_DRIVE_CREDENTIALS` | Entire JSON from service account | From Step 2.4 |

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Note:** For `GOOGLE_DRIVE_CREDENTIALS`, paste the entire JSON content. Render accepts multi-line JSON.

### 3.3 Deploy

1. **Click "Create Web Service"**
2. **Wait for deployment** (5-10 minutes)
3. **Your backend URL:** `https://smart-student-hub-api.onrender.com`

### 3.4 Create Admin Account

1. **Go to Shell**
   - Render Dashboard → Your service → "Shell" tab

2. **Run Admin Script**
   ```bash
   npm run create-admin
   ```

3. **Follow Prompts**
   ```
   Name: Your Name
   Email: admin@yourdomain.com
   Password: [8+ chars, uppercase, lowercase, number, special char]
   ```

### 3.5 Test Backend

```bash
# Visit in browser:
https://smart-student-hub-api.onrender.com/api/health

# Should return:
{
  "status": "ok",
  "timestamp": "2025-11-16T...",
  "database": "connected",
  "storage": "google-drive"
}
```

---

## 🎨 Step 4: Deploy Frontend to Vercel

### 4.1 Deploy via Vercel Dashboard

1. **Go to Vercel**
   - Visit: https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository

2. **Configure Project**
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

3. **Add Environment Variables**
   
   Click "Environment Variables" → Add these:
   
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://smart-student-hub-api.onrender.com/api` |
   | `VITE_APP_NAME` | `Smart Student Hub` |
   | `VITE_APP_VERSION` | `1.0.0` |

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - **Your frontend URL:** `https://smart-student-hub.vercel.app`

### 4.2 Update Backend CORS

1. **Go back to Render**
   - Dashboard → Your backend service → Environment

2. **Update `ALLOWED_ORIGINS`**
   ```
   Old: https://your-app.vercel.app
   New: https://smart-student-hub.vercel.app
   ```

3. **Click "Save Changes"** (service auto-redeploys)

---

## ✅ Step 5: Post-Deployment Testing

### 5.1 Test Backend Health

```bash
# Open in browser:
https://smart-student-hub-api.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-16T12:00:00.000Z",
  "database": "connected",
  "storage": "google-drive"
}
```

### 5.2 Test Frontend

1. **Visit your frontend URL**
2. **You should see:** Login page with test credentials banner

3. **Test Login - Admin**
   ```
   Email: admin@smartstudenthub.com
   Password: Admin@123
   ```

4. **Test Login - Student**
   ```
   Email: pramanikarpan089@gmail.com
   Password: Arpan@123
   ```

5. **Test Login - Faculty**
   ```
   Email: faculty@smartstudenthub.com
   Password: Faculty@123
   ```

### 5.3 Test File Upload

1. **Login as student**
2. **Go to Profile**
3. **Upload avatar image**
4. **Check Google Drive folder** - file should appear

### 5.4 Test Database

1. **Login and create an activity**
2. **Go to Supabase Dashboard**
   - Table Editor → Activities table
3. **Verify data is saved**

---

## 🚨 Troubleshooting

### Database Connection Failed

**Error:** `connect ECONNREFUSED`

**Solutions:**
```bash
✅ Verify DATABASE_URL is correct
✅ Check password has no special chars that need escaping
✅ Ensure Supabase project is active (not paused)
✅ Test connection in Supabase SQL Editor: SELECT NOW();
✅ Check SSL is enabled (default in Supabase)
```

### Google Drive Upload Failed

**Error:** `Could not load credentials`

**Solutions:**
```bash
✅ Verify GOOGLE_DRIVE_CREDENTIALS is valid JSON
✅ Check service account has permission (Editor role)
✅ Ensure Google Drive API is enabled
✅ Verify folder is shared with service account email
✅ Check GOOGLE_DRIVE_FOLDER_ID is correct
✅ Wait 5 minutes after sharing for permissions to sync
```

### CORS Error

**Error:** `Access blocked by CORS policy`

**Solutions:**
```bash
✅ Update ALLOWED_ORIGINS in Render
✅ Include https:// protocol
✅ No trailing slash
✅ Match exact Vercel URL
✅ Redeploy backend after change
✅ Clear browser cache
```

### Render Cold Start (First Request Slow)

**Issue:** First request takes 30-60 seconds

**Explanation:**
```
Render free tier "spins down" after 15 minutes of inactivity.
First request wakes it up (cold start).

Solutions:
1. Accept delay (normal for free tier)
2. Upgrade to $7/month for always-on
3. Keep alive with cron job (external service)
```

### File Upload Size Error

**Error:** `File too large`

**Solutions:**
```bash
✅ Check file size:
   - Avatars: Max 2MB
   - Certificates: Max 5MB
✅ Compress images before upload
✅ Increase limits in backend/server.js if needed
```

### Supabase Free Tier Pause

**Issue:** Database paused after 7 days inactivity

**Solutions:**
```bash
✅ Login to Supabase dashboard to wake it
✅ Upgrade to paid tier ($25/month) for always-on
✅ Keep alive with scheduled queries (cron job)
```

---

## 💰 Cost & Monitoring

### Free Tier Limits

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| **Vercel** | 100 GB bandwidth/month | $20/month (1 TB) |
| **Render** | 750 hours/month | $7/month (always-on) |
| **Supabase** | 500 MB database, 2 GB bandwidth | $25/month (8 GB DB) |
| **Google Drive** | 2 TB (your existing quota) | $9.99/month (2 TB) |

**Total for small app:** $0/month  
**Estimated at scale (1000 users):** $50-100/month

### Monitoring

#### Render Dashboard
```
Metrics:
- CPU usage
- Memory usage
- Request count
- Response times
- Error rates

Logs:
- Real-time API logs
- Database queries
- Errors & warnings
```

#### Supabase Dashboard
```
Database:
- Active connections
- Query performance
- Storage usage
- Bandwidth usage

Tools:
- Table Editor (view/edit data)
- SQL Editor (run queries)
- Database backups
```

#### Google Drive
```
Storage:
- View all uploaded files
- Storage usage
- File organization

Management:
- Download files anytime
- Move/organize manually
- Share specific files
```

---

## 🔒 Security Checklist

After deployment, ensure:

- [ ] Strong JWT_SECRET generated (64+ characters)
- [ ] DATABASE_URL uses SSL (Supabase default)
- [ ] Google Drive folder shared only with service account
- [ ] CORS configured with frontend URL only
- [ ] Environment variables not in git (.gitignore verified)
- [ ] Rate limiting enabled (default in code)
- [ ] HTTPS enabled (Render/Vercel default)
- [ ] Test credentials banner removed (before final launch)
- [ ] Admin account created with strong password
- [ ] Backups configured (Supabase paid tier or manual)

---

## 🎉 You're Live!

Your Smart Student Hub is now deployed with:

✅ Scalable PostgreSQL database (Supabase)  
✅ 2TB cloud file storage (Google Drive)  
✅ Production backend (Render)  
✅ Fast frontend (Vercel)  
✅ SSL/HTTPS everywhere  
✅ Complete monitoring & logs  

**Frontend URL:** https://your-app.vercel.app  
**Backend URL:** https://your-api.onrender.com  
**Database:** Supabase PostgreSQL  
**Storage:** Google Drive  

### Next Steps

1. **Remove test credentials** from `frontend/src/pages/LoginPage.jsx`
2. **Setup custom domain** (optional - Vercel/Render both support)
3. **Enable email notifications** (configure SMTP in .env)
4. **Setup backup strategy** (Supabase auto-backups on paid tier)
5. **Monitor usage** (check dashboards weekly)

---

## 📧 Support

Need help? Check:
- **GitHub Issues:** https://github.com/arpanpramanik2003/smart-student-hub/issues
- **Render Docs:** https://render.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs

---

**Congratulations! Your app is live! 🚀🎊**
