# 🚀 Deployment Guide - Smart Student Hub
## Render + Supabase + Google Cloud Storage

Complete step-by-step guide to deploy your Smart Student Hub application with production-grade infrastructure.

---

## 📋 Prerequisites

✅ GitHub account with repository  
✅ Vercel account (frontend hosting)  
✅ Render account (backend hosting)  
✅ Supabase account (PostgreSQL database)  
✅ Google Cloud account (file storage)  
✅ Credit/debit card (for Google Cloud - free tier available)

---

## 🎯 Deployment Architecture

```
┌─────────────────────┐
│   Frontend (Vercel) │
│   React + Vite      │
└──────────┬──────────┘
           │
           ↓ HTTPS API Calls
┌──────────────────────┐
│  Backend (Render)    │
│  Node.js + Express   │
└──────┬───────────────┘
       │
       ├──→ PostgreSQL (Supabase)
       │    • User data
       │    • Activities
       │
       └──→ Google Cloud Storage
            • Avatars
            • Certificates
            • Documents
```

---

## 📝 Step 1: Setup Supabase (PostgreSQL Database)

### 1.1 Create Supabase Project

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com
   - Click "New Project"
   
2. **Configure Project**
   - **Name:** smart-student-hub
   - **Database Password:** Generate strong password (save it!)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free tier (500 MB database)

3. **Get Connection String**
   - Go to: Project Settings > Database
   - Find "Connection String" section
   - Copy the **URI** format (not "Transaction" or "Session")
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`
   - Replace `[YOUR-PASSWORD]` with your actual password

4. **Enable SSL (Already enabled by default)**
   - Supabase requires SSL connections
   - Our backend is already configured for this

### 1.2 Test Connection (Optional)

```bash
# Install psql client or use Supabase SQL Editor
# Go to: SQL Editor in Supabase Dashboard
# Run test query:
SELECT version();
```

---

## ☁️ Step 2: Setup Google Cloud Storage

### 2.1 Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com
   - Click "New Project"
   - **Name:** smart-student-hub
   - Click "Create"

2. **Enable Cloud Storage API**
   - Search for "Cloud Storage API"
   - Click "Enable"

### 2.2 Create Storage Bucket

1. **Go to Cloud Storage**
   - Left menu > Cloud Storage > Buckets
   - Click "Create Bucket"

2. **Configure Bucket**
   - **Name:** `smart-student-hub-files` (must be globally unique)
   - **Location:** Multi-region (choose region closest to users)
   - **Storage class:** Standard
   - **Access control:** Fine-grained (uniform bucket-level access)
   - **Protection tools:** None (for now)
   - Click "Create"

3. **Set Bucket Permissions (Make Public)**
   - Go to bucket > Permissions tab
   - Click "Grant Access"
   - **Add principals:** `allUsers`
   - **Role:** Storage Object Viewer
   - Click "Save"

### 2.3 Create Service Account

1. **Go to IAM & Admin**
   - Left menu > IAM & Admin > Service Accounts
   - Click "Create Service Account"

2. **Configure Service Account**
   - **Name:** `smart-student-hub-storage`
   - **Description:** Service account for file uploads
   - Click "Create and Continue"

3. **Grant Permissions**
   - **Role:** Storage Admin
   - Click "Continue" > "Done"

4. **Create JSON Key**
   - Click on the service account you just created
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - **Key type:** JSON
   - Click "Create"
   - **Save the downloaded JSON file securely!**

### 2.4 Prepare Credentials for Environment Variable

Open the downloaded JSON file and copy its contents. You'll need to paste this as a single line in Render environment variables.

Example JSON (don't use this, use your own!):
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n",
  "client_email": "smart-student-hub-storage@your-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  ...
}
```

---

## 🖥️ Step 3: Deploy Backend to Render

### 3.1 Create Web Service

1. **Go to Render Dashboard**
   - Visit: https://render.com
   - Click "New +" > "Web Service"

2. **Connect Repository**
   - Connect your GitHub account
   - Select: `smart-student-hub` repository
   - Click "Connect"

3. **Configure Service**
   - **Name:** `smart-student-hub-api`
   - **Region:** Choose closest to users
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (or upgrade for better performance)

### 3.2 Add Environment Variables

Click "Advanced" > "Add Environment Variable" and add these:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `JWT_SECRET` | Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_EXPIRES_IN` | `24h` |
| `DATABASE_URL` | Your Supabase connection string |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app` (update after frontend deploy) |
| `GCS_PROJECT_ID` | Your Google Cloud project ID |
| `GCS_BUCKET_NAME` | `smart-student-hub-files` |
| `GCS_CREDENTIALS` | Paste entire JSON from service account key (as single line) |

**Important:** For `GCS_CREDENTIALS`, paste the entire JSON content. Render accepts multi-line JSON.

### 3.3 Deploy

1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Your backend URL: `https://smart-student-hub-api.onrender.com`

### 3.4 Create Admin Account

1. **Go to Shell in Render**
   - Dashboard > Your service > "Shell" tab
   
2. **Run Admin Creation Script**
   ```bash
   npm run create-admin
   ```

3. **Follow Prompts**
   - Enter admin name, email, password
   - Password must be 8+ chars with uppercase, lowercase, number, special char

---

## 🎨 Step 4: Deploy Frontend to Vercel

### 4.1 Deploy via Vercel Dashboard

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository

2. **Configure Project**
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

3. **Add Environment Variables**
   
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://smart-student-hub-api.onrender.com/api` |
   | `VITE_APP_NAME` | `Smart Student Hub` |
   | `VITE_APP_VERSION` | `1.0.0` |

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment (2-3 minutes)
   - Your frontend URL: `https://smart-student-hub.vercel.app`

### 4.2 Update Backend CORS

1. **Go back to Render**
   - Dashboard > Your backend service
   - Environment tab

2. **Update `ALLOWED_ORIGINS`**
   - Value: `https://smart-student-hub.vercel.app`
   - Click "Save Changes"
   - Service will auto-redeploy

---

## ✅ Step 5: Post-Deployment Testing

### 5.1 Test Backend Health

```bash
curl https://smart-student-hub-api.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-16T...",
  "database": "connected",
  "storage": "google-cloud"
}
```

### 5.2 Test Frontend

1. Visit your frontend URL
2. You should see test credentials banner
3. Test each login:
   - **Admin:** admin@smartstudenthub.com / Admin@123
   - **Student:** pramanikarpan089@gmail.com / Arpan@123
   - **Faculty:** faculty@smartstudenthub.com / Faculty@123

### 5.3 Test File Upload

1. Login as student
2. Try uploading avatar
3. Check Google Cloud Storage bucket for uploaded file

### 5.4 Test Database

1. Login and create an activity
2. Check Supabase dashboard > Table Editor > Activities table
3. Verify data is saved

---

## 🔒 Step 6: Security Checklist

- [ ] Strong JWT_SECRET generated (64+ characters)
- [ ] DATABASE_URL uses SSL (Supabase default)
- [ ] GCS bucket has appropriate permissions
- [ ] CORS configured with frontend URL only
- [ ] Environment variables not committed to git
- [ ] Rate limiting enabled (default in code)
- [ ] HTTPS enabled (Render/Vercel default)

---

## 📊 Step 7: Monitor & Maintain

### Render Monitoring
- Dashboard shows: CPU, Memory, Request count
- View logs: Dashboard > Logs tab
- Set up alerts for downtime

### Supabase Monitoring
- Database Dashboard shows: Connections, Query performance
- Free tier: 500 MB storage, 2 GB bandwidth
- Upgrade when needed

### Google Cloud Monitoring
- Console shows: Storage usage, API calls
- Free tier: 5 GB storage, 5000 operations/day
- Set up billing alerts

---

## 🚨 Troubleshooting

### Database Connection Fails

```
Error: connect ECONNREFUSED
```

**Solution:**
- Verify DATABASE_URL is correct
- Check Supabase project is active
- Ensure password has no special chars that need escaping
- Test connection in Supabase SQL Editor

### Google Cloud Storage Upload Fails

```
Error: Could not load the default credentials
```

**Solution:**
- Verify GCS_CREDENTIALS is valid JSON
- Check service account has Storage Admin role
- Ensure Cloud Storage API is enabled
- Check bucket name matches GCS_BUCKET_NAME

### CORS Errors

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
- Update ALLOWED_ORIGINS in Render with exact frontend URL
- Include protocol (https://)
- No trailing slash
- Redeploy backend after change

### Render Free Tier Slowness

**Issue:** First request after inactivity is slow (cold start)

**Solution:**
- Upgrade to paid tier ($7/month) for always-on
- Or accept 30-60 second cold start on free tier

### File Upload Size Limits

**Issue:** Large files fail to upload

**Solution:**
- Check multer limits in backend (default: 5MB certificates, 2MB avatars)
- Increase if needed in backend/server.js
- Google Cloud free tier: 5 GB total storage

---

## 💰 Cost Breakdown

### Free Tier Limits

| Service | Free Tier | Cost After |
|---------|-----------|------------|
| **Vercel** | 100 GB bandwidth | $20/month |
| **Render** | 750 hours/month | $7/month per service |
| **Supabase** | 500 MB database | $25/month |
| **Google Cloud** | 5 GB storage | $0.020/GB/month |

**Total for small app:** $0/month (stays within free tier)  
**Estimated at scale (1000 users):** ~$50-100/month

---

## 📚 Additional Resources

- **Render Docs:** https://render.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Google Cloud Storage:** https://cloud.google.com/storage/docs
- **Vercel Docs:** https://vercel.com/docs

---

## 🎉 You're Done!

Your Smart Student Hub is now live with:
- ✅ Scalable PostgreSQL database (Supabase)
- ✅ Cloud file storage (Google Cloud)
- ✅ Production backend (Render)
- ✅ Fast frontend (Vercel)
- ✅ SSL/HTTPS everywhere
- ✅ Rate limiting & security

**Remember:** Remove test credentials banner from `LoginPage.jsx` before final production launch!

---

**Questions?** Check QUICK_REFERENCE.md for commands and credentials.
