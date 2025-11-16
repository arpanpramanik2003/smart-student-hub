# 🔐 Admin & Security Guide

## 📋 Table of Contents
- [Default Admin Setup](#default-admin-setup)
- [How to Reset Admin Credentials](#how-to-reset-admin-credentials)
- [Security Best Practices](#security-best-practices)
- [Files to Remove Before Production](#files-to-remove-before-production)
- [Database Access](#database-access)
- [Environment Variables Security](#environment-variables-security)

---

## 🎯 Default Admin Setup

### How Admin is Created

The default admin user is **automatically created** when the backend server starts for the first time. This happens in:

**File:** `backend/src/utils/database.js`

**Code Location:** Lines 95-108
```javascript
// Create default admin user if not exists
const adminExists = await User.findOne({ where: { role: 'admin' } });
if (!adminExists) {
  await User.create({
    name: 'Admin User',
    email: 'admin@smartstudenthub.com',
    password: 'admin123',
    role: 'admin',
    department: 'Administration'
  });
  console.log('✅ Default admin user created.');
}
```

### Default Credentials
- **Email:** `admin@smartstudenthub.com`
- **Password:** `admin123`
- **Role:** `admin`
- **Department:** `Administration`

⚠️ **CRITICAL:** Change these credentials immediately after first login!

---

## 🔄 How to Reset Admin Credentials

### Method 1: Through Application (Recommended)
1. Login as admin: https://smart-student-hub-inky.vercel.app
2. Go to **Profile** or **Settings**
3. Click **Change Password**
4. Enter new password
5. Save changes

### Method 2: Directly in Supabase Database
1. Go to: https://supabase.com/dashboard
2. Select your project: **smart-student-hub**
3. Click **Table Editor** (left sidebar)
4. Find table: `users`
5. Locate admin user (email: `admin@smartstudenthub.com`)
6. Click **Edit** on the row
7. Update fields:
   - `email`: Change to your preferred email
   - `name`: Change to your name
   - `password`: **DON'T** edit directly (it's hashed)
8. Save changes

### Method 3: Reset Password via Code
If you need to reset the password programmatically:

1. Open terminal in backend folder
2. Run Node.js interactive shell:
```bash
node
```
3. Execute this code:
```javascript
const bcrypt = require('bcryptjs');
const password = 'YourNewSecurePassword123!';
bcrypt.hash(password, 12).then(hash => console.log(hash));
```
4. Copy the hashed password
5. Update in Supabase database:
   - Table: `users`
   - Column: `password`
   - Paste the hash

### Method 4: Delete and Recreate Admin
1. Go to Supabase Table Editor
2. Delete the existing admin user row
3. Restart your Render backend service
4. The system will auto-create a new admin with default credentials
5. Login and change password immediately

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

# Database
DATABASE_URL=postgresql://postgres.mjqnougcxzyobauhgkse:Smart@123@aws-1-ap-south-1.pooler.supabase.com:6543/postgres

# CORS
ALLOWED_ORIGINS=https://smart-student-hub-inky.vercel.app

# Google Drive
GOOGLE_DRIVE_FOLDER_ID=1GX3oSTyBZ3i3BtugDs1Ha7GijoPEYv5j
GOOGLE_DRIVE_CREDENTIALS={"type":"service_account","project_id":"..."}
```

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

#### 3. Google Drive Credentials
```
1. Google Cloud Console → IAM & Admin → Service Accounts
2. Create new service account
3. Generate new JSON key
4. Update GOOGLE_DRIVE_CREDENTIALS in Render
5. Share folder with new service account
6. Delete old service account
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

### If Google Drive Credentials Leaked:
1. Revoke service account in Google Cloud
2. Create new service account
3. Update credentials in Render
4. Review uploaded files for malicious content

---

## 📞 Support & Resources

- **Render Dashboard:** https://dashboard.render.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Google Cloud Console:** https://console.cloud.google.com

---

## ✅ Production Checklist

Before going live:

- [ ] Changed default admin password
- [ ] Verified no `.env` files in Git
- [ ] Tested all user roles (admin, faculty, student)
- [ ] Verified file uploads work (Google Drive)
- [ ] Tested login/logout functionality
- [ ] Checked all API endpoints work
- [ ] Reviewed database backups are enabled
- [ ] Confirmed CORS settings allow only your frontend
- [ ] Tested on mobile devices
- [ ] Set up monitoring/alerts (optional)
- [ ] Documented all environment variables
- [ ] Created admin guide for team (this file!)

---

**Last Updated:** November 16, 2025  
**Version:** 1.0  
**Status:** ✅ Production Ready
