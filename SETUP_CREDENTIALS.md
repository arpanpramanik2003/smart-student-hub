# 🚀 Quick Setup Guide
## Get Your Google Cloud & Supabase Credentials

This guide helps you quickly get all necessary credentials for deployment.

---

## 📝 Step 1: Supabase Setup (5 minutes)

### 1. Create Account & Project
```
1. Go to: https://supabase.com
2. Sign up/Login with GitHub
3. Click "New Project"
4. Fill in:
   - Name: smart-student-hub
   - Database Password: [Generate strong password - SAVE IT!]
   - Region: [Choose closest to your users]
5. Click "Create new project" (takes 2-3 minutes)
```

### 2. Get Connection String
```
1. Once project is ready, click "Connect" button
2. Select "URI" tab
3. Copy the connection string:
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
4. Replace [YOUR-PASSWORD] with your actual password
5. Save this - you'll need it for Render deployment
```

### 3. Quick Test (Optional)
```
1. Go to SQL Editor in Supabase dashboard
2. Run: SELECT version();
3. Should return PostgreSQL version
```

---

## ☁️ Step 2: Google Cloud Storage Setup (10 minutes)

### 1. Create Project
```
1. Go to: https://console.cloud.google.com
2. Click dropdown at top > "New Project"
3. Name: smart-student-hub
4. Click "Create" (takes 30 seconds)
5. Select your project from dropdown
```

### 2. Enable Cloud Storage API
```
1. Search "Cloud Storage API" in search bar
2. Click first result
3. Click "Enable"
```

### 3. Create Storage Bucket
```
1. Left menu > Cloud Storage > Buckets
2. Click "Create"
3. Fill in:
   - Name: smart-student-hub-files-[your-name] (must be globally unique!)
   - Location: Multi-region > US (or your region)
   - Storage class: Standard
   - Access control: Fine-grained
   - Protection tools: None
4. Click "Create"
```

### 4. Make Bucket Public
```
1. Click on your bucket name
2. Go to "Permissions" tab
3. Click "+ Grant Access"
4. Fill in:
   - New principals: allUsers
   - Role: Storage Object Viewer
5. Click "Save" > "Allow Public Access"
```

### 5. Create Service Account
```
1. Left menu > IAM & Admin > Service Accounts
2. Click "+ Create Service Account"
3. Fill in:
   - Name: storage-uploader
   - Description: For uploading files to bucket
4. Click "Create and Continue"
5. Role: Storage Admin
6. Click "Continue" > "Done"
```

### 6. Generate JSON Key
```
1. Click on service account you just created
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Select: JSON
5. Click "Create"
6. JSON file downloads automatically - SAVE IT SECURELY!
```

### 7. Prepare JSON for Environment Variable
```
1. Open downloaded JSON file in text editor
2. Copy ENTIRE contents
3. It should look like:
   {
     "type": "service_account",
     "project_id": "smart-student-hub-xxxxx",
     "private_key_id": "abc123...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...",
     "client_email": "storage-uploader@...",
     ...
   }
4. Keep this ready for Render deployment
```

---

## 🎯 Step 3: Get Your Project Info

Before deploying to Render, gather these values:

### Supabase
```
✅ DATABASE_URL: postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

### Google Cloud
```
✅ GCS_PROJECT_ID: smart-student-hub-xxxxx (from JSON file or GCP console)
✅ GCS_BUCKET_NAME: smart-student-hub-files-[your-name]
✅ GCS_CREDENTIALS: {entire JSON content from downloaded file}
```

### Security
```
✅ JWT_SECRET: Generate with:
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📋 Environment Variables Checklist

For **Render Backend**, you'll need:

| Variable | Where to get it |
|----------|----------------|
| `NODE_ENV` | Set to: `production` |
| `PORT` | Set to: `5000` |
| `JWT_SECRET` | Generate with node command above |
| `JWT_EXPIRES_IN` | Set to: `24h` |
| `DATABASE_URL` | From Supabase step 2 |
| `ALLOWED_ORIGINS` | Your Vercel frontend URL |
| `GCS_PROJECT_ID` | From JSON file: `project_id` field |
| `GCS_BUCKET_NAME` | Your bucket name |
| `GCS_CREDENTIALS` | Entire JSON from downloaded file |

For **Vercel Frontend**, you'll need:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your Render backend URL + `/api` |
| `VITE_APP_NAME` | `Smart Student Hub` |
| `VITE_APP_VERSION` | `1.0.0` |

---

## 🔍 Verify Your Setup

### Test Supabase Connection
```bash
# Use any PostgreSQL client or Supabase SQL Editor
# Run: SELECT NOW();
# Should return current timestamp
```

### Test Google Cloud Storage
```bash
# In GCP console > Cloud Storage > Your bucket
# Click "Upload files"
# Upload a test image
# Verify it appears in bucket
# Try accessing via:
# https://storage.googleapis.com/[BUCKET-NAME]/[FILE-NAME]
```

---

## ⚠️ Common Issues

### Supabase: "Connection refused"
- Check password is correct (no typos)
- Ensure SSL is enabled in connection string
- Verify project is not paused (free tier pauses after 7 days inactivity)

### GCS: "Credentials not valid"
- Verify JSON is complete (starts with `{` and ends with `}`)
- Check service account has Storage Admin role
- Ensure Cloud Storage API is enabled

### GCS: "Bucket not found"
- Verify bucket name is correct (lowercase, no spaces)
- Check bucket exists in console
- Ensure you selected correct project

---

## 🎉 Ready to Deploy!

Once you have all credentials:
1. Go to Render and create Web Service
2. Add all environment variables
3. Deploy backend
4. Get backend URL
5. Deploy frontend to Vercel with backend URL
6. Update ALLOWED_ORIGINS in Render
7. Test everything!

See **DEPLOYMENT_RENDER_SUPABASE.md** for detailed deployment steps.

---

## 💡 Tips

- **Save all credentials securely** - use password manager
- **Don't commit .env files** - they're already in .gitignore
- **Test locally first** - add DATABASE_URL to local .env to test Supabase
- **Monitor usage** - check free tier limits in each service
- **Backup strategy** - Supabase has automatic daily backups on paid tier

---

## 📞 Need Help?

- **Supabase Docs:** https://supabase.com/docs/guides/database
- **Google Cloud Docs:** https://cloud.google.com/storage/docs/quickstart-console
- **Render Docs:** https://render.com/docs
- **Our Deployment Guide:** See DEPLOYMENT_RENDER_SUPABASE.md

Good luck! 🚀
