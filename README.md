# 🎓 Smart Student Hub

<p align="center">
  <strong>Next-Generation Co-Curricular Governance, Credit Banking & NAAC/NIRF Accreditation Platform</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/React-19.0-blue?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Node.js-20.x-green?style=for-the-badge&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Deploy-Vercel%20%2B%20Render-000000?style=for-the-badge&logo=vercel" alt="Vercel & Render" />
  <img src="https://img.shields.io/badge/Observability-OpenTelemetry-orange?style=for-the-badge&logo=opentelemetry" alt="OpenTelemetry" />
</p>

---

## 🌟 Executive Summary

**Smart Student Hub** is a multi-tier, enterprise-grade co-curricular activity verification, institutional credit banking, and NAAC/NIRF accreditation compliance management system. Designed for higher education institutions, it streamlines student achievement submissions through a **two-stage verification pipeline** (Faculty Advisor verification followed by Institutional Admin sign-off), automates credit assignment via a dynamic **Credit Policy Engine**, and generates compliance audit trails and NAAC/NIRF reports.

---

## 🚀 Key Features & Capabilities

### 🎓 Student Experience
- **Co-Curricular Submission Hub**: Upload certificates, specify activity category, achievement level, organizer, and event dates.
- **Real-Time Verification Tracking**: Track submissions through Stage 1 (Faculty Advisor) and Stage 2 (Institutional Admin).
- **Digital Credit Portfolio**: Dynamic credit ledger calculating total earned points mapped against academic degree requirements.
- **Public Record Verification**: Instantly generate tamper-proof digital certificates backed by unique verification tokens (`vref_...`).

### 👨‍🏫 Faculty Advisor Console
- **Stage 1 Review Queue**: Filter and review student submissions, verify certificate authenticity, and provide feedback remarks.
- **Mentee Management**: Direct access to assigned student portfolios, academic history, and credit progression metrics.
- **Bulk Verification**: Approve or request clarification on student submissions with single-click actions.

### 🏛️ Institutional Admin Console
- **Stage 2 Final Sign-Off**: Official institutional authorization and credit ledger lock.
- **Credit Policy Engine**: Configure weight matrices (`Activity Type × Achievement Level`) and map to NAAC Criteria 1–7.
- **Faculty Mentor Assignment**: Perform single or bulk mentor-mentee assignments by department, program, or academic year.
- **Grievance & Appeal Resolution**: Formal grievance resolution console for student appeal reviews with full audit trails.
- **User Management & Bulk Onboarding**: Full user directory management with CSV bulk onboarding for thousands of students and faculty.
- **Institutional Analytics & NAAC Reporting**: Real-time analytics dashboards, NAAC compliance targets, and 1-click official CSV report exports.

### 🛡️ Public Credential Verification
- **Cryptographic Verification Page**: Public-facing `/verify/[verificationId]` endpoint enabling third-party employers and academic bodies to authenticate issued student achievements.

---

## 🏗️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 15 (App Router)** | Client UI, server-side rendering, dynamic routing, static page optimization |
| **UI & Styling** | **Vanilla CSS + Tailwind CSS** | Premium responsive layout design, dark mode, custom visual charts |
| **Backend API** | **Node.js + Express / Next.js API Routes** | RESTful endpoints, multi-stage approval logic, authentication middleware |
| **Database & ORM** | **Supabase PostgreSQL / Sequelize** | Relational persistence, ENUMs, schema migrations, grouped SQL aggregations |
| **Media Storage** | **Cloudinary API** | Secure cloud image/document upload and certificate evidence storage |
| **Rate Limiting** | **Upstash Redis** | Sliding-window auth rate limiting with memory fallback |
| **Observability** | **Pino + OpenTelemetry + Prometheus** | Enterprise JSON logging, distributed tracing (`prom-client`), health checks |
| **Hosting Platform** | **Vercel (Frontend) + Render (Backend)** | High-availability cloud deployment with automatic CI/CD |

---

## 📐 System Architecture

```mermaid
graph TD
    User["🌐 User Browser (Student / Faculty / Admin / Public)"] --> Frontend["⚡ Next.js 15 Frontend (Vercel)"]
    Frontend -->|REST API Requests / Bearer Token| Backend["⚙️ Express Backend (Render)"]
    Backend -->|Sequelize ORM| DB[("🐘 PostgreSQL Database (Supabase)")]
    Backend -->|Cloud Uploads| Cloudinary["☁️ Cloudinary Storage"]
    Backend -->|Rate Limit Store| Redis["🔴 Upstash Redis"]
    Backend -->|Logging & Metrics| Pino["📊 Pino Logger + OpenTelemetry"]
```

---

## ⚡ Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: `v18.x` or `v20.x`
- **npm**: `v9.x` or `v10.x`
- **PostgreSQL / SQLite**: Local PostgreSQL database or Supabase connection URI

### 2. Installation
Clone the repository and install dependencies for both frontend and backend services:

```bash
# Clone the repository
git clone https://github.com/arpanpramanik2003/smart-student-hub.git
cd smart-student-hub

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key
ADMIN_RESET_CODE=Hub2026AdminReset
DATABASE_URL=postgresql://postgres:password@aws-0-region.pooler.supabase.com:6543/postgres

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Upstash Redis Rate Limiting (Optional)
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 4. Database Migrations

Run database migrations to initialize tables, ENUM types, and indices:

```bash
cd backend
node scripts/migrate.js
```

### 5. Running the Application

Launch backend and frontend dev servers:

```bash
# Terminal 1: Backend Server (Port 5000)
cd backend
npm run dev

# Terminal 2: Frontend App (Port 3000)
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📚 Comprehensive Documentation Index

All project documentation is organized in the root [`Doc/`](file:///d:/Edutation(P)/SIH/smart-student-hub/Doc) directory:

| Document | Description |
| :--- | :--- |
| **[01-project-overview.md](file:///d:/Edutation(P)/SIH/smart-student-hub/Doc/01-project-overview.md)** | Executive vision, system architecture, role matrix, and core capabilities |
| **[02-system-architecture.md](file:///d:/Edutation(P)/SIH/smart-student-hub/Doc/02-system-architecture.md)** | Monorepo structure, request lifecycle, authentication, security controls |
| **[03-database-schema.md](file:///d:/Edutation(P)/SIH/smart-student-hub/Doc/03-database-schema.md)** | ER diagrams, table definitions, ENUM types, indices, migration history |
| **[04-credit-policy-engine.md](file:///d:/Edutation(P)/SIH/smart-student-hub/Doc/04-credit-policy-engine.md)** | Credit weighting rules (`Type × Level`), NAAC Criteria 1–7 mapping |
| **[05-verification-pipeline.md](file:///d:/Edutation(P)/SIH/smart-student-hub/Doc/05-verification-pipeline.md)** | Stage 1 (Faculty) & Stage 2 (Admin) approval workflows, audit trails |
| **[06-api-references.md](file:///d:/Edutation(P)/SIH/smart-student-hub/Doc/06-api-references.md)** | Full REST API documentation for Student, Faculty, Admin, Auth & Public routes |
| **[07-deployment.md](file:///d:/Edutation(P)/SIH/smart-student-hub/Doc/07-deployment.md)** | Production deployment guide for Vercel, Render, Supabase & Cloudinary |

### Role Guides & Sub-folder Docs
- 📘 **[Student Portal Guide](file:///d:/Edutation(P)/SIH/smart-student-hub/Doc/Student/README.md)**
- 📙 **[Faculty Advisor Guide](file:///d:/Edutation(P)/SIH/smart-student-hub/Doc/Faculty/README.md)**
- 📕 **[Institutional Admin Guide](file:///d:/Edutation(P)/SIH/smart-student-hub/Doc/Admin/README.md)**
- 🔒 **[Authentication & Security Guide](file:///d:/Edutation(P)/SIH/smart-student-hub/Doc/Auth/README.md)**
- 🌐 **[Public Verification & API Guide](file:///d:/Edutation(P)/SIH/smart-student-hub/Doc/Public/README.md)**

---

## 🔒 Security & Quality Assurance

- **JWT Authentication & RBAC**: Strict role checks (`student`, `faculty`, `admin`) enforced on all protected endpoints.
- **Pino Structured Logging**: Enterprise JSON logging with sensitive field redaction (passwords, tokens, authorization headers).
- **Rate Limiting**: Sliding-window rate limiting on authentication routes with Upstash Redis and memory fallback.
- **Database Safety**: Prepared statements and raw query replacements to prevent SQL injection vulnerabilities.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

<p align="center">
  Developed for modern educational governance and accreditation excellence.
</p>
