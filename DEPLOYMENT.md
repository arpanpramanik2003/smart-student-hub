# 🚀 Deployment Guide - Smart Student Hub

## 📋 Table of Contents
1. [Frontend Deployment (Vercel)](#frontend-deployment)
2. [Backend Deployment (Railway/DigitalOcean/Render)](#backend-deployment)
3. [Environment Variables](#environment-variables)
4. [Post-Deployment Steps](#post-deployment)
5. [Troubleshooting](#troubleshooting)

---

## 🎨 Frontend Deployment (Vercel)

### Option 1: Deploy via Vercel Dashboard

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Select the `frontend` folder as root directory

3. **Configure Build Settings**
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Add Environment Variables**
   ```
   VITE_API_URL=https://your-backend-url.railway.app/api
   VITE_APP_NAME=Smart Student Hub
   VITE_APP_VERSION=1.0.0
   ```

5. **Deploy!**
   - Click "Deploy"
   - Wait for deployment to complete
   - Get your URL: `https://your-app.vercel.app`

### Option 2: Deploy via CLI

```bash
cd frontend
npm install -g vercel
vercel login
vercel --prod
```

---

## ⚙️ Backend Deployment

### Option A: Railway (Recommended - Free Tier)

1. **Go to Railway Dashboard**
   - Visit [railway.app](https://railway.app)
   - Create new project
   - Choose "Deploy from GitHub repo"

2. **Configure Backend**
   - Select your repository
   - Railway will auto-detect Node.js
   - Set root directory: `backend`

3. **Add Environment Variables**
   ```
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=<generate-new-secret>
   JWT_EXPIRES_IN=24h
   DB_NAME=smart_student_hub.db
   ALLOWED_ORIGINS=https://your-app.vercel.app
   ```

4. **Generate JWT Secret**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

5. **Deploy**
   - Railway auto-deploys on push
   - Get your URL: `https://your-app.railway.app`

6. **Create Admin Account**
   ```bash
   # In Railway terminal
   npm run create-admin
   ```

### Option B: DigitalOcean App Platform

1. **Create New App**
   - Go to DigitalOcean Dashboard
   - Apps → Create App
   - Connect GitHub repository

2. **Configure App**
   - **Source Directory:** `backend`
   - **Build Command:** `npm install`
   - **Run Command:** `npm start`
   - **Port:** 5000

3. **Add Environment Variables** (same as Railway)

4. **Deploy & Create Admin**

### Option C: Render

1. **Create New Web Service**
   - Visit [render.com](https://render.com)
   - New → Web Service
   - Connect repository

2. **Configure**
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

3. **Add Environment Variables** (same as Railway)

---

## 🔐 Environment Variables Reference

### Frontend (.env)
```env
VITE_API_URL=https://your-backend-url.com/api
VITE_APP_NAME=Smart Student Hub
VITE_APP_VERSION=1.0.0
```

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=<your-generated-secret>
JWT_EXPIRES_IN=24h
DB_NAME=smart_student_hub.db
ALLOWED_ORIGINS=https://your-frontend-url.vercel.app
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@smartstudenthub.com
```

---

## ✅ Post-Deployment Checklist

### 1. Create Admin Account
```bash
# SSH into your backend server or use Railway/Render console
npm run create-admin
```

Follow the prompts to create admin credentials.

### 2. Update Frontend API URL

In Vercel dashboard:
- Go to your project
- Settings → Environment Variables
- Update `VITE_API_URL` to your backend URL
- Redeploy

### 3. Test All Features

- [ ] Login with admin credentials
- [ ] Login with test student account
- [ ] Submit an activity (student)
- [ ] Approve activity (faculty/admin)
- [ ] Generate reports (admin)
- [ ] Upload profile picture
- [ ] Check all navigation links

### 4. Security Checks

- [ ] HTTPS enabled on both frontend and backend
- [ ] New JWT secret generated (not default)
- [ ] CORS configured with actual frontend URL
- [ ] Admin creation endpoint removed (✅ already done)
- [ ] Rate limiting active
- [ ] Strong password policy enforced

### 5. Performance Optimization

- [ ] Enable gzip compression
- [ ] Set up CDN for static assets
- [ ] Configure caching headers
- [ ] Monitor response times

---

## 🐛 Troubleshooting

### Issue: CORS Error

**Problem:** Browser shows CORS policy error

**Solution:**
1. Update backend `ALLOWED_ORIGINS` in environment variables
2. Add your Vercel URL: `https://your-app.vercel.app`
3. Redeploy backend

### Issue: 401 Unauthorized

**Problem:** Login fails with 401 error

**Solution:**
1. Check JWT_SECRET is set correctly
2. Verify backend is running
3. Check browser console for API URL
4. Test backend directly: `https://your-backend.railway.app/api/health`

### Issue: Database Not Found

**Problem:** Activities/users not saving

**Solution:**
1. Database file will be created automatically
2. Ensure write permissions on server
3. Check logs for SQLite errors
4. For Railway: database persists in volume

### Issue: File Upload Failed

**Problem:** Profile picture/certificate upload fails

**Solution:**
1. Check file size limits (2MB for avatars, 5MB for certificates)
2. Ensure `uploads/` directory exists
3. Check server disk space
4. Verify multer configuration

### Issue: Build Failed on Vercel

**Problem:** Vercel build fails

**Solution:**
1. Check `package.json` scripts
2. Verify all dependencies installed
3. Check Vite configuration
4. Review build logs
5. Ensure Node version compatibility (18+)

### Issue: Backend Not Starting

**Problem:** Railway/Render shows crashed

**Solution:**
1. Check environment variables
2. Review logs for errors
3. Verify `package.json` start script
4. Check port configuration (use PORT env var)
5. Test locally with production env

---

## 📞 Support

For deployment issues:
1. Check logs in deployment platform
2. Test API endpoints: `/api/health`, `/api/test-db`
3. Review `SECURITY_AUDIT.md` for security best practices
4. Check GitHub issues

---

## 🔄 Continuous Deployment

### Automatic Deployments

Both Vercel and Railway support automatic deployments:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```

2. **Auto-Deploy**
   - Frontend: Vercel auto-deploys on push to `main`
   - Backend: Railway auto-deploys on push to `main`

3. **Monitor Deployments**
   - Vercel: Check deployment status in dashboard
   - Railway: View logs in real-time

---

## 📊 Monitoring & Logs

### Frontend (Vercel)
- Dashboard → Your Project → Deployments
- View build logs and runtime logs
- Monitor performance metrics

### Backend (Railway/Render)
- Dashboard → Your App → Logs
- Real-time log streaming
- Monitor CPU/Memory usage
- Set up alerts

---

## 🎉 Final Notes

1. **Remove Test Credentials** from `LoginPage.jsx` before final production
2. **Backup Database** regularly (download SQLite file)
3. **Monitor Logs** for errors and unusual activity
4. **Update Dependencies** regularly for security patches
5. **Set up Analytics** (Google Analytics, etc.)

---

**Deployment completed!** 🚀

Your app should now be live at:
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-app.railway.app`

Test all features and enjoy! 🎊
