# Smart Student Hub Frontend

## Table of Contents
- Overview
- Tech Stack
- How Frontend Connects to Backend
- Environment Variables
- Local Development
- Application Structure
- Auth and Route Protection
- Core UI Modules
- Security Notes
- Build and Release Notes
- Documentation Links

## Overview

This folder contains the complete frontend for Smart Student Hub, built on Next.js 15 App Router.

Important: this frontend is not responsible for business logic or data security decisions. All protected operations are executed by the Express backend API.

## Tech Stack

- Next.js 15 (App Router)
- React 18
- Tailwind CSS
- Client-side state with context providers
- Middleware-based pre-route gating using auth cookie

## How Frontend Connects to Backend

Frontend calls backend API endpoints using a configured base URL.

Local defaults:

- frontend: http://localhost:3000
- backend API: http://localhost:5001/api

Backend API contract is consumed through frontend utility modules (api client wrappers in utils).

## Environment Variables

Create frontend/.env.local with:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_APP_NAME=Smart Student Hub
NEXT_PUBLIC_APP_VERSION=2.0.0
```

Rules:

- only NEXT_PUBLIC variables should be in frontend env
- no JWT secret, DB secrets, or cloud secrets in frontend

## Local Development

From workspace root:

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

Common scripts:

- npm run dev
- npm run build
- npm run start
- npm run lint

Recommended parallel local run:

1. start backend first
2. start frontend
3. login and verify protected page navigation

## Application Structure

```text
frontend/
  app/
    login/
    (protected)/
      dashboard/
      student/
      faculty/
      admin/
  components/
    auth/
    student/
    faculty/
    admin/
    shared/
  contexts/
    AuthContext.jsx
    ThemeContext.jsx
  utils/
    api.js
    auth.js
    constants.js
  middleware.js
```

## Auth and Route Protection

Frontend auth behavior:

- login obtains JWT from backend
- token stored in local storage
- token mirrored to ssh_token cookie for middleware checks
- middleware redirects unauthenticated access to login

Critical note:

- middleware route gating improves UX
- backend authorization is still the source of truth

## Core UI Modules

Student modules:

- dashboard
- submit activity
- activity list and status tracking
- portfolio and profile management
- peer browse

Faculty modules:

- review queue
- all activities
- student directory

Admin modules:

- user management
- reports
- analytics

## Security Notes

- never trust client-only checks for authorization
- always call protected backend routes with bearer token
- avoid exposing internal error traces in UI
- keep frontend dependencies browser-safe only

Recent hardening compatibility:

- frontend works with backend CORS allow-list model
- frontend works with backend rate-limited auth endpoints
- frontend works with backend observability headers (request/trace IDs)

## Build and Release Notes

Current significant upgrades:

- Next.js 15.5.14
- eslint-config-next 15.5.14
- jspdf 4.2.1

Frontend cleanup completed:

- removed backend-only dependencies from frontend package scope
- removed stale Next externals configuration entries tied to server-only packages

## Documentation Links

- docs index: ../docs/frontend/README.md
- workspace overview: ../README.md
- architecture: ../docs/frontend/DATABASE_API_ARCHITECTURE.md
- admin guide: ../docs/frontend/ADMIN_GUIDE.md
- faculty guide: ../docs/frontend/FACULTY_GUIDE.md
- student guide: ../docs/frontend/STUDENT_GUIDE.md

Last Updated: April 2026
