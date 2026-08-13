# 07. Production Deployment & Cloud Infrastructure Guide

This guide provides step-by-step instructions for re-deploying the **Smart Student Hub** system to production cloud infrastructure.

---

## 🌐 Production Cloud Architecture

```mermaid
flowchart TD
    Client[Web Browser / Mobile Client] -->|HTTPS Requests| Vercel[Vercel Frontend - Next.js 15]
    Vercel -->|API Calls / HTTPS| Render[Render Web Service - Express Backend]
    
    subgraph Render Backend Services
        Render -->|Sequelize ORM / SSL| Supabase[(Supabase PostgreSQL Database)]
        Render -->|Media Uploads & Sign-Offs| Cloudinary[Cloudinary Cloud File Storage]
        Render -->|Distributed Rate Limiting| Upstash[Upstash Redis Cache]
    end

    Vercel -->|Direct Verification Reads| Render
```

### Infrastructure Summary Table

| Service Component | Cloud Provider | Free Tier Availability | Primary Role in Smart Student Hub |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | **Vercel** | Free Hobby Tier | Next.js 15 App Router, static generation, public verification page (`/verify/[id]`). |
| **Backend API** | **Render** | Free Web Service Tier | Express.js Node.js server (`server.js`), API route loader, JWT auth. |
| **Database** | **Supabase** | Free Tier (500MB PG) | Managed PostgreSQL database hosting Sequelize models & migration history. |
| **Document Storage** | **Cloudinary** | Free Tier (25GB) | Permanent storage for certificate proof files, PDFs, and avatars. |
| **Rate Limiter Cache** | **Upstash Redis** | Free Tier (10k req/day) | Distributed rate limiting across backend server restarts and instances. |

---

## 🔍 Technology Confirmation & Redis Clarification

### 1. Are You Using Redis?
**YES**, Redis is integrated into the backend ([`backend/lib/rateLimiter.js`](file:///d:/Edutation(P)/SIH/smart-student-hub/backend/lib/rateLimiter.js)) for **Distributed Authentication Rate Limiting**.
- **Production Mode**: Configured via `AUTH_RATE_LIMIT_BACKEND=redis` or `auto`.
- **Cloud Setup**: When you provide `REDIS_URL` or `UPSTASH_REDIS_REST_URL` (e.g. from **Upstash Redis** or Redis Labs), rate limiting state is synchronized across instances.
- **Graceful Fallback**: If no Redis URL is configured, the backend automatically falls back to in-memory rate limiting (`AUTH_RATE_LIMIT_BACKEND=memory`) without crashing.

### 2. Other Cloud Services Required
- **Cloudinary**: Essential for Render deployment because Render's filesystem is ephemeral (local uploads in `/uploads` are wiped on server restart). Cloudinary provides persistent HTTPS URLs for student certificate proofs and avatars.

---

## 🔑 Environment Variables Matrix

### 1. Backend Environment Variables (Render)

| Variable Name | Required? | Example / Value | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | Yes | `5000` | Port for Express HTTP server |
| `NODE_ENV` | Yes | `production` | Production mode flag |
| `DATABASE_URL` | **Yes** | `postgresql://postgres:[PASS]@db.[REF].supabase.co:5432/postgres` | Supabase PostgreSQL SSL connection string |
| `JWT_SECRET` | **Yes** | `a_very_long_random_cryptographic_secret_key` | Secret key for signing JWT auth tokens |
| `CORS_ORIGIN` | **Yes** | `https://smart-student-hub.vercel.app` | Allowed Vercel frontend origin |
| `CLOUDINARY_CLOUD_NAME` | **Yes** | `your_cloud_name` | Cloudinary cloud identifier |
| `CLOUDINARY_API_KEY` | **Yes** | `123456789012345` | Cloudinary API access key |
| `CLOUDINARY_API_SECRET` | **Yes** | `your_api_secret` | Cloudinary API secret key |
| `REDIS_URL` | Optional | `redis://default:[PASS]@[HOST].upstash.io:6379` | Upstash Redis connection string |
| `AUTH_RATE_LIMIT_BACKEND` | Optional | `redis` or `auto` | Rate limiting mode (`redis`, `memory`, `auto`) |

### 2. Frontend Environment Variables (Vercel)

| Variable Name | Required? | Example / Value | Description |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | **Yes** | `https://smart-student-hub-backend.onrender.com` | Base URL of deployed Render API server |

---

## 🚀 Step-by-Step Deployment Instructions

### Step 1: Database Setup on Supabase (PostgreSQL)

1. Log in to [Supabase Console](https://supabase.com) and create a new project.
2. Under **Project Settings $\rightarrow$ Database**, copy the **URI Connection String** (Transaction Pooler or Direct Connection).
3. Ensure SSL is enabled (`?sslmode=require`).
4. Run database migrations from your local terminal to create all production tables:

```bash
# In backend/ directory
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
node scripts/migrate.js
```

> Output confirmation: `Applied migration: 20260812_000005_phase5_engagement_and_bulk_onboarding`.

---

### Step 2: Storage Setup on Cloudinary

1. Log in to [Cloudinary Dashboard](https://cloudinary.com).
2. Copy your **Cloud Name**, **API Key**, and **API Secret**.
3. These credentials ensure that student certificate proofs uploaded via `FormData` are permanently saved in Cloudinary storage.

---

### Step 3: Redis Setup on Upstash (Optional but Recommended)

1. Log in to [Upstash Console](https://upstash.com) and create a free **Redis Database**.
2. Copy the **Redis URL** (`redis://default:...@...upstash.io:6379`).
3. Set `REDIS_URL` in your backend environment configuration.

---

### Step 4: Backend Deployment on Render

1. Log in to [Render Dashboard](https://dashboard.render.com) and click **New $\rightarrow$ Web Service**.
2. Connect your Git repository and select the `backend/` directory.
3. Configure service settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start` (Executes `node server.js`)
4. Add all **Backend Environment Variables** under Render's **Environment** tab.
5. Deploy Web Service and copy the live Render URL (e.g. `https://smart-student-hub-backend.onrender.com`).

---

### Step 5: Frontend Deployment on Vercel

1. Log in to [Vercel Dashboard](https://vercel.com) and click **Add New $\rightarrow$ Project**.
2. Import your Git repository and set the Root Directory to `frontend/`.
3. Framework Preset: **Next.js**.
4. Add Environment Variable:
   - `NEXT_PUBLIC_API_BASE_URL` = `https://smart-student-hub-backend.onrender.com`
5. Click **Deploy**. Vercel will compile static pages (`20/20 static routes`) and issue a production URL (e.g. `https://smart-student-hub.vercel.app`).

---

## 🧪 Post-Deployment Verification Checklist

After redeployment, complete these smoke tests:

- [ ] **Auth Check**: Register a test student account and log in. Verify JWT cookie is set.
- [ ] **First-Login Password Reset**: Verify bulk-created accounts with `mustChangePassword = true` trigger forced password change.
- [ ] **Activity Submission & Cloud Storage**: Submit an activity with a PDF certificate proof. Verify file is served from `res.cloudinary.com`.
- [ ] **Two-Stage Approval**: Approve Stage 1 as Faculty (`mentor_approved`) and Stage 2 as Admin (`approved`).
- [ ] **Public Verification QR Code**: Scan or visit `/verify/[verificationId]`. Confirm public page renders green verified banner without requiring login.
- [ ] **Revocation Check**: Revoke an approved credential as Admin. Confirm public page immediately displays red **"CREDENTIAL OFFICIALLY REVOKED"** warning.
- [ ] **NAAC Report Export**: Generate NAAC Criterion report in Admin console. Verify CSV export downloads correctly.
