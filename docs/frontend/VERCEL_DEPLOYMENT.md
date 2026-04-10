# Vercel Frontend Deployment Guide

## Pre-Deployment Requirements

The following conditions must be met before frontend deployment:

| Requirement | Status |
|------------|--------|
| Backend deployed to cloud | ✅ Required |
| Unused packages removed | ✅ Completed |
| Hardcoded file paths converted to aliases | ✅ Completed |
| Environment variables separated | ✅ Completed |
| No backend secrets in frontend config | ✅ Completed |

---

## Deployment Architecture

The Next.js frontend is deployed to Vercel and communicates with the Express backend via environment configuration:

```
Vercel (Frontend)
    ↓
NEXT_PUBLIC_API_URL
    ↓
Remote Backend (Render/Other)
```

---

## Vercel Configuration

### GitHub Repository Connection

1. Visit https://vercel.com/dashboard
2. Create new project
3. Import GitHub repository: `smart-student-hub`
4. Select `frontend` directory as root

### Environment Variables

Set the following in Vercel project settings (Settings → Environment Variables):

```
NEXT_PUBLIC_API_URL=<backend-url>
```

**Configuration:**
- **Key:** `NEXT_PUBLIC_API_URL`
- **Value:** Backend service URL (e.g., `https://api.example.com`)
- **Prefix:** `NEXT_PUBLIC_` is required (variable must be accessible in browser)

### Build Configuration

Vercel automatically detects Next.js framework and applies appropriate build settings:
- **Framework:** Next.js 15.5.14
- **Build Command:** Auto-detected
- **Output Directory:** `.next`

---

## API Integration

The frontend initializes API calls using the `NEXT_PUBLIC_API_URL` environment variable configured during deployment.

### Authentication Endpoints
- `/api/auth/login`
- `/api/auth/register`
- `/api/auth/profile`

### Student Endpoints
- `/api/students/profile`
- `/api/students/activities`
- `/api/students/browse`

### Faculty Endpoints
- `/api/faculty/activities`
- `/api/faculty/students`

### Admin Endpoints
- `/api/admin/users`
- `/api/admin/stats`
- `/api/admin/reports`

### File Operations
- `/api/files/view/:fileId`
- `/api/files/download/:fileId`

---

## Deployment Process

1. **Trigger:** Deployment is automatically triggered on push to main branch
2. **Build:** Vercel builds Next.js project (~45 seconds typical)
3. **Deploy:** Built artifacts are deployed to Vercel CDN
4. **Live:** Service becomes available at Vercel-assigned URL

### Build Output

Successful frontend build includes:
- Optimized JavaScript chunks
- Server-side rendering compiled pages
- Static file optimization
- Middleware compilation

---

## Post-Deployment

### Access

The frontend will be available at a Vercel-assigned URL or custom domain:
- Example: `https://smart-student-hub-*.vercel.app`
- Custom domain: (if configured)

### Verification

Deployment can be verified through:
1. Accessing frontend URL
2. Testing authentication flow
3. Checking DevTools Network tab to confirm API requests reach backend service

### API Connectivity

Successfully deployed frontend will:
- Make requests to backend service via `NEXT_PUBLIC_API_URL`
- Use all configured API endpoints (auth, admin, faculty, student, files)
- Maintain secure communication with backend

---

## Development vs Production Setup

### Local Development
```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

### Production (Vercel)
```env
NEXT_PUBLIC_API_URL=https://<backend-service-url>
```

---

## Automatic Deployments

GitHub Integration:
- Deployments triggered automatically on push to main branch
- Pull request preview deployments available
- Configurable via Vercel project settings

---

## Build Optimization

Production builds include:
- Code splitting and bundling
- CSS preprocessing and optimization  
- Image optimization via Next.js Image component
- Asset caching with versioned filenames
