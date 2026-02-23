# 🔐 Admin & Security Guide

## 📋 Table of Contents
- [Default Admin Setup](#default-admin-setup)
- [How to Reset Admin Credentials](#how-to-reset-admin-credentials)
- [Security Best Practices](#security-best-practices)
- [Files to Remove Before Production](#files-to-remove-before-production)
- [Database Access](#database-access)
- [Environment Variables Security](#environment-variables-security)
- [Deployment Guide](#deployment-guide)

---

## 🎯 Secure Admin Setup

### 🔐 No Default Admin Created

For **maximum security**, this system does **NOT** auto-create a default admin user with hardcoded credentials.

Instead, you must **manually create** the admin account using a secure confirmation code.

### How to Create Admin Account

**Endpoint:** `POST /api/auth/admin-password-reset`

**Method:** Use PowerShell/Terminal with a secret confirmation code

**Required Environment Variable on Render:**
```env
ADMIN_RESET_CODE=your-secret-confirmation-code-here
```

### Step-by-Step Instructions:

#### 1. Add Environment Variable to Render
1. Go to Render Dashboard → Your service
2. Click **Environment** tab
3. Add new variable:
   - **Key:** `ADMIN_RESET_CODE`
   - **Value:** `<your-secure-random-string>` (create a strong random code)
4. Click **Save Changes** (will auto-redeploy)

#### 2. Create Admin via PowerShell
Once deployed, run this command in PowerShell:

```powershell
Invoke-RestMethod -Uri "https://smart-student-hub-sj5o.onrender.com/api/auth/admin-password-reset" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"confirmCode":"YOUR_ADMIN_RESET_CODE","newUsername":"admin@yourdomain.com","newPassword":"YourSecurePassword123!"}'
```

**Parameters:**
- `confirmCode`: Must match `ADMIN_RESET_CODE` from Render (replace YOUR_ADMIN_RESET_CODE)
- `newUsername`: Your admin email
- `newPassword`: Strong password (min 8 characters)

#### 3. Success Response
```json
{
  "message": "Admin user created successfully",
  "username": "admin@yourdomain.com"
}
```

### Security Features:
✅ No hardcoded admin credentials in code  
✅ Confirmation code stored only in environment variables  
✅ Failed attempts are logged  
✅ Password must be at least 8 characters  
✅ Can reset admin password anytime using same endpoint  
✅ Works even if admin already exists (updates credentials)

---

## 🔄 How to Reset Admin Credentials

### Method 1: Using Secure Reset Endpoint (Recommended) ⭐
Run this PowerShell command:

```powershell
Invoke-RestMethod -Uri "https://smart-student-hub-sj5o.onrender.com/api/auth/admin-password-reset" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"confirmCode":"YOUR_ADMIN_RESET_CODE","newUsername":"newemail@domain.com","newPassword":"NewSecurePassword123!"}'
```

**What it does:**
- Updates existing admin username and password
- Creates new admin if none exists
- Validates confirmation code against `ADMIN_RESET_CODE` env variable
- Logs all attempts for security monitoring

**Requirements:**
- Confirmation code must match `ADMIN_RESET_CODE` in Render
- Password must be at least 8 characters

### Method 2: Through Application
1. Login as admin: https://smart-student-hub-inky.vercel.app
2. Go to **Profile** or **Settings**
3. Click **Change Password**
4. Enter new password
5. Save changes

### Method 3: Directly in Supabase Database (Emergency Only)
1. Go to: https://supabase.com/dashboard
2. Select your project: **smart-student-hub**
3. Click **Table Editor** (left sidebar)
4. Find table: `users`
5. Locate admin user (role: 'admin')
6. Click **Edit** on the row
7. Update fields:
   - `email`: Change to your preferred email
   - `name`: Change to your name
   - ⚠️ `password`: **DON'T** edit directly (it's hashed)
8. Save changes
9. Use Method 1 to reset password properly

---

## 🛡️ Security Best Practices

### ✅ DO:
1. **Change default admin credentials immediately**
2. **Use strong passwords** (min 12 characters, mix of upper/lower/numbers/symbols)
3. **Enable 2FA** (if implemented)
4. **Regularly update dependencies**: `npm audit fix`
5. **Monitor Render logs** for suspicious activity
6. **Use environment variables** for all secrets
7. **Keep `.env` files secure** and never commit them
8. **Regular database backups** (Supabase has automatic backups)
9. **Limit admin access** - create separate faculty accounts
10. **Review user permissions** regularly

### ❌ DON'T:
1. **Never share admin credentials**
2. **Don't use `admin123` in production**
3. **Don't commit `.env` files** to Git
4. **Don't expose sensitive data** in logs
5. **Don't give everyone admin access**
6. **Don't skip security updates**
7. **Don't use HTTP** (always use HTTPS)
8. **Don't store passwords in plain text**

---

## 🗑️ Files to Remove Before Production

### 🔴 CRITICAL - Remove These Files:

#### 1. Local Environment Files
```bash
backend/.env
backend/.env.local
backend/.env.development
```
**Reason:** Contains sensitive credentials (DATABASE_URL, JWT_SECRET, Google Drive credentials)

**Action:** These are already in `.gitignore`, but verify they're NOT in your Git repository:
```bash
git ls-files | grep .env
```
If found, remove them:
```bash
git rm --cached backend/.env
git commit -m "Remove .env file from repository"
git push
```

#### 2. Local Database Files
```bash
backend/smart_student_hub.db
backend/smart_student_hub.db-shm
backend/smart_student_hub.db-wal
```
**Reason:** Local SQLite database (used in development only)

**Action:** Delete manually or ensure `.gitignore` blocks them

#### 3. Test/Debug Files
```bash
backend/test.js
backend/debug.log
backend/scripts/createAdmin.js (if exists)
```
**Reason:** May contain hardcoded credentials or debug info

#### 4. Uploaded Files (if committed)
```bash
backend/uploads/*
```
**Reason:** User uploads should be in Google Drive, not Git

**Action:** Add to `.gitignore`:
```
uploads/
!uploads/.gitkeep
```

#### 5. Node Modules (if accidentally committed)
```bash
node_modules/
```
**Reason:** Huge size, security vulnerabilities

**Action:** Should already be in `.gitignore`, but verify

#### 6. IDE/Editor Files
```bash
.vscode/settings.json (if contains secrets)
.idea/
*.swp
.DS_Store
```
**Reason:** May contain local paths or settings

---

## 🗄️ Database Access

### Supabase Dashboard
- **URL:** https://supabase.com/dashboard
- **Project:** smart-student-hub
- **Database:** PostgreSQL

### Connection Details (Stored in Render Env Vars)
```
Host: aws-1-ap-south-1.pooler.supabase.com
Port: 6543
Database: postgres
User: postgres.mjqnougcxzyobauhgkse
Password: Smart@123
```

### How to Access Tables:
1. Supabase Dashboard → Table Editor
2. Available tables:
   - `users` - All user accounts (students, faculty, admin)
   - `activities` - Student activities/certificates

### Backup Database:
1. Supabase Dashboard → Database → Backups
2. Click **Create Backup**
3. Download backup file

### Manual SQL Queries:
1. Supabase Dashboard → SQL Editor
2. Run custom queries:
```sql
-- Find all admins
SELECT id, name, email, role FROM users WHERE role = 'admin';

-- Count users by role
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Recent activities
SELECT * FROM activities ORDER BY "createdAt" DESC LIMIT 10;
```

---

## 🔒 Environment Variables Security

### Required Environment Variables (Render)

These are stored **ONLY** on Render (not in code):

```env
# Server Config
NODE_ENV=production
PORT=5000

# Security
JWT_SECRET=<64-character-random-string>
JWT_EXPIRES_IN=24h
ADMIN_RESET_CODE=<your-secret-confirmation-code>

# Database
DATABASE_URL=postgresql://postgres.mjqnougcxzyobauhgkse:Smart@123@aws-1-ap-south-1.pooler.supabase.com:6543/postgres

# CORS
ALLOWED_ORIGINS=https://smart-student-hub-inky.vercel.app

# Cloudinary (File Storage)
CLOUDINARY_CLOUD_NAME=<your-cloud-name-from-dashboard>
CLOUDINARY_API_KEY=<your-api-key-from-dashboard>
CLOUDINARY_API_SECRET=<click-to-reveal-in-dashboard>
```

**New Variable:** `ADMIN_RESET_CODE`
- **Purpose:** Secret code required to create/reset admin account
- **Example:** Use a secure random string (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- **Usage:** Used with `/api/auth/admin-password-reset` endpoint
- **Security:** Keep this secret! Anyone with this code can reset admin credentials

### How to Rotate Secrets:

#### 1. JWT Secret
```bash
# Generate new secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Update in Render:
# Settings → Environment → Edit JWT_SECRET → Save → Redeploy
```

#### 2. Database Password
```
1. Supabase Dashboard → Settings → Database
2. Click "Reset database password"
3. Update DATABASE_URL in Render
4. Redeploy backend
```

#### 3. Cloudinary Credentials
```
1. Cloudinary Dashboard → Settings → Access Keys
2. Click "Generate New API Secret" (if needed)
3. Update CLOUDINARY_API_SECRET in Render
4. Redeploy backend
5. Test file upload functionality
```

---

## 🚨 Emergency Actions

### If Admin Account is Compromised:
1. **Immediately** change password via Supabase
2. Delete all active sessions (if session management exists)
3. Check activity logs for suspicious actions
4. Rotate JWT_SECRET
5. Review all user accounts for unauthorized changes

### If Database Credentials Leaked:
1. Reset Supabase database password
2. Update DATABASE_URL in Render
3. Redeploy backend
4. Review database logs
5. Check for data breaches

### If Cloudinary Credentials Leaked:
1. Cloudinary Dashboard → Settings → Security
2. Reset API Secret
3. Update CLOUDINARY_API_SECRET in Render
4. Redeploy backend
5. Review uploaded files for malicious content
6. Enable Cloudinary's access control features if needed

---

## 📞 Support & Resources

- **Render Dashboard:** https://dashboard.render.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Google Cloud Console:** https://console.cloud.google.com

---

## 👨‍🏫 Faculty Features Overview

As an admin, you should be aware of all faculty capabilities:

### Faculty Dashboard
- View pending activities count
- See total activities across the system
- Track approved/rejected activities
- Monitor personal review statistics
- Access recent review history

### Activity Review System
Faculty can:
- ✅ Review pending student activity submissions
- ✅ Approve activities with credit assignment (0-10 range)
- ✅ Reject activities with mandatory feedback
- ✅ Filter by department and status
- ✅ View complete activity history
- ✅ Add remarks and feedback for students

### **NEW: All Students Directory** 🆕
Faculty now have access to a comprehensive student information system:

**Features:**
- **Advanced Search**: Search by name, email, or student ID
- **Smart Filters**: Filter by department and academic year
- **Student List View**: Shows essential info (name, ID, department, activities, credits)
- **Detailed Profile View**: Click to see complete student information:
  - Basic info (ID, contact, demographics)
  - Academic records (10th, 12th results)
  - Activity statistics (total, approved, credits)
  - Skills and languages
  - Achievements and projects
  - Social profiles (LinkedIn, GitHub, Portfolio)
  - Contact address
- **Pagination**: 20 students per page
- **Read-Only Access**: Faculty can view but not modify student data

**Use Cases:**
- Academic advising and mentorship
- Performance monitoring
- Department management
- NAAC/AICTE compliance reporting
- Identifying students needing support

**Access:** Navigate to **"All Students"** in faculty navigation bar

### Faculty Best Practices
✅ Review activities within 48 hours  
✅ Provide constructive feedback  
✅ Use consistent credit standards  
✅ Verify certificates before approval  
✅ Maintain student data confidentiality  
✅ Use student directory for academic purposes only  

**Full Faculty Documentation:** See [FACULTY_GUIDE.md](FACULTY_GUIDE.md)

---

## ✅ Production Checklist

Before going live:

- [ ] Added `ADMIN_RESET_CODE` environment variable to Render
- [ ] Created admin account using secure reset endpoint
- [ ] Changed admin password to strong password
- [ ] Verified no `.env` files in Git
- [ ] Tested all user roles (admin, faculty, student)
- [ ] **Verified faculty can access All Students directory**
- [ ] **Tested student search and filtering functionality**
- [ ] Verified file uploads work (Cloudinary)
- [ ] **Confirmed profile pictures load correctly in student list**
- [ ] Tested login/logout functionality
- [ ] Checked all API endpoints work
- [ ] Reviewed database backups are enabled
- [ ] Confirmed CORS settings allow only your frontend
- [ ] Tested on mobile devices
- [ ] Set up monitoring/alerts (optional)
- [ ] Documented all environment variables
- [ ] Secured `ADMIN_RESET_CODE` (don't share publicly!)
- [ ] **Brief faculty members on new student directory feature**

---

## � Deployment Guide

### Architecture Overview

```
Frontend (Vercel) → React + Vite (Free)
Backend (Render)  → Node.js + Express (Free)
Database          → Supabase PostgreSQL 500MB (Free)
Storage           → Cloudinary CDN 25GB (Free)
Total Cost: $0/month
```

---

### Step 1: Supabase PostgreSQL Setup

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Set project name, database password, and region
3. After creation (~2 min), go to **Project Settings → Database**
4. Copy the **Connection String** (URI format):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
5. Save this — you'll need it for Render

---

### Step 2: Cloudinary Setup

1. Sign up at [cloudinary.com](https://cloudinary.com/users/register_free)
2. From the Dashboard, copy these credentials:
   ```
   CLOUDINARY_CLOUD_NAME=<your-cloud-name>
   CLOUDINARY_API_KEY=<your-api-key>
   CLOUDINARY_API_SECRET=<click Reveal to show>
   ```

---

### Step 3: Deploy Backend to Render

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repository (`smart-student-hub`)
3. Configure:
   ```
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```
4. Add **Environment Variables** (click Advanced):

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `JWT_SECRET` | _(generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)_ |
| `JWT_EXPIRES_IN` | `24h` |
| `DATABASE_URL` | Your Supabase connection string |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app` _(update after frontend deploy)_ |
| `CLOUDINARY_CLOUD_NAME` | From Step 2 |
| `CLOUDINARY_API_KEY` | From Step 2 |
| `CLOUDINARY_API_SECRET` | From Step 2 |
| `ADMIN_RESET_CODE` | _(generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)_ |

5. Click **Create Web Service** — wait 5–10 minutes
6. Your backend URL: `https://smart-student-hub-api.onrender.com`
7. After deployment, create the admin account using the secure endpoint (see [Default Admin Setup](#default-admin-setup))

---

### Step 4: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import GitHub repo
2. Configure:
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   ```
3. Add **Environment Variables**:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://smart-student-hub-api.onrender.com/api` |
| `VITE_APP_NAME` | `Smart Student Hub` |
| `VITE_APP_VERSION` | `1.0.0` |

4. Click **Deploy** — wait 2–3 minutes
5. Your frontend URL: `https://smart-student-hub.vercel.app`
6. **Important:** Go back to Render and update `ALLOWED_ORIGINS` with the actual Vercel URL

---

### Step 5: Post-Deployment Testing

**Health check:**
```bash
# Should return: { "status": "ok", "database": "connected" }
GET https://smart-student-hub-api.onrender.com/api/health
```

**Test logins:**
```
Admin:   admin@smartstudenthub.com  /  Admin@123
Student: pramanikarpan089@gmail.com /  Arpan@123
Faculty: faculty@smartstudenthub.com / Faculty@123
```
> ⚠️ Remove test credentials from `frontend/src/pages/LoginPage.jsx` before final production!

**Test file upload:** Log in as a student, submit an activity with a certificate, and verify the file appears in your Cloudinary Media Library.

---

### Deployment Troubleshooting

| Problem | Solution |
|---------|----------|
| Database connection failed | Verify `DATABASE_URL`, check Supabase project is not paused |
| Cloudinary upload failed | Check all 3 Cloudinary env vars; verify API Secret is revealed |
| CORS error | Update `ALLOWED_ORIGINS` in Render to exact Vercel URL (with `https://`, no trailing slash) |
| Render cold start (first request slow) | Normal for free tier — first request wakes the service (30-60s) |
| File too large error | Certificates max 5MB, avatars max 2MB |
| Supabase paused | Free tier pauses after 7 days inactivity — log in to wake it |

---

### Free Tier Limits

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| **Vercel** | 100 GB bandwidth/month | $20/month |
| **Render** | 750 hours/month | $7/month (always-on) |
| **Supabase** | 500 MB database | $25/month |
| **Cloudinary** | 25 GB storage + bandwidth | $99/month |

---

## 📚 Additional Documentation

- 👨‍🎓 [Student Guide](STUDENT_GUIDE.md) - Registration, activities, profile, and API reference for students
- 👨‍🏫 [Faculty Guide](FACULTY_GUIDE.md) - Complete guide for faculty members
- 🔌 [API Documentation](DATABASE_API_ARCHITECTURE.md) - Technical API and database reference
- 📖 [Main README](README.md) - Project overview and quick start

---

**Last Updated:** February 13, 2026  
**Version:** 1.1.0  
**Status:** ✅ Production Ready

**Recent Updates:**
- ✨ Added All Students Directory feature for faculty
- 🖼️ Enhanced profile picture support (Cloudinary CDN)
- 📱 Improved mobile responsive design
- 🔍 Advanced search and filtering capabilities
