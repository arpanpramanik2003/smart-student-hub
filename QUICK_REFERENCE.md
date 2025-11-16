# 🚀 Quick Deployment Reference Card

## Test Credentials (Currently Visible on Login Page)

### 👑 Admin
- Email: `admin@smartstudenthub.com`
- Password: `Admin@123`

### 👨‍🎓 Student
- Email: `pramanikarpan089@gmail.com`
- Password: `Arpan@123`

### 👨‍🏫 Faculty
- Email: `faculty@smartstudenthub.com`
- Password: `Faculty@123`

---

## Environment Variables Quick Copy

### Frontend (.env)
```env
VITE_API_URL=https://your-backend-url.railway.app/api
VITE_APP_NAME=Smart Student Hub
VITE_APP_VERSION=1.0.0
```

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=<paste-generated-secret-here>
JWT_EXPIRES_IN=24h
DB_NAME=smart_student_hub.db
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

---

## Quick Commands

### Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Create Admin (Production)
```bash
npm run create-admin
```

### Test Backend Health
```bash
curl https://your-backend.railway.app/api/health
```

---

## Deployment URLs

### Vercel (Frontend)
- Dashboard: https://vercel.com/dashboard
- Add Project → Import Git Repository
- Root: `frontend`
- Build: `npm run build`
- Output: `dist`

### Railway (Backend - Recommended)
- Dashboard: https://railway.app/dashboard
- New Project → Deploy from GitHub
- Root: `backend`
- Auto-detects Node.js
- Add environment variables

### Alternative: Render
- Dashboard: https://render.com/dashboard
- New → Web Service
- Root: `backend`
- Build: `npm install`
- Start: `npm start`

---

## Critical Steps

1. **Deploy Backend First**
   - Get backend URL (e.g., `https://xxx.railway.app`)
   
2. **Update Frontend .env**
   - Set `VITE_API_URL=https://xxx.railway.app/api`
   
3. **Deploy Frontend**
   - Get frontend URL (e.g., `https://xxx.vercel.app`)
   
4. **Update Backend .env**
   - Set `ALLOWED_ORIGINS=https://xxx.vercel.app`
   
5. **Create Admin**
   - SSH to backend → `npm run create-admin`

6. **Test Everything**
   - Visit frontend URL
   - Use test credentials to login
   - Test all features

---

## Remove Before Final Production

**File:** `frontend/src/pages/LoginPage.jsx`

Search for and delete this section:
```jsx
{/* Test Credentials Banner */}
<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
  <div className="bg-gradient-to-r from-amber-50 to-orange-50...
  ...
  </div>
</div>
```

---

## Troubleshooting

### CORS Error
✅ Update `ALLOWED_ORIGINS` in backend .env with frontend URL

### 401 Unauthorized
✅ Check JWT_SECRET is set  
✅ Verify backend is running

### Build Failed
✅ Check Node version (18+)  
✅ Verify package.json scripts  
✅ Review build logs

### Can't Login
✅ Test backend: `/api/health`  
✅ Check API URL in frontend  
✅ Verify credentials

---

**Need Help?** Check `DEPLOYMENT.md` for detailed instructions!
