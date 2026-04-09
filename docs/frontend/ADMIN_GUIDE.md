# Admin and Deployment Guide

## Table of Contents
- Platform Layout
- Admin Bootstrap and Recovery
- Admin Operating Responsibilities
- User and Role Administration
- Security Controls and Hardening
- Deployment Models
- Environment Variables (Detailed)
- Post-Deployment Validation
- Monitoring and Incident Response
- Troubleshooting

## Platform Layout

Smart Student Hub operates in a split architecture:

- frontend service: Next.js app in frontend
- backend service: Express API in backend
- shared logical data model: Sequelize user/activity entities

This guide focuses on admin and operations concerns for the full stack.

## Admin Bootstrap and Recovery

No default admin account is shipped.

Bootstrap process:

1. define ADMIN_RESET_CODE in backend secret environment
2. call backend admin-password-reset endpoint to create admin account

Example:

```powershell
Invoke-RestMethod `
   -Uri "http://localhost:5001/api/auth/admin-password-reset" `
   -Method POST `
   -Headers @{"Content-Type"="application/json"} `
   -Body '{"confirmCode":"YOUR_ADMIN_RESET_CODE","newUsername":"admin@yourdomain.com","newPassword":"YourSecurePassword123!"}'
```

Recovery usage:

- same endpoint can reset admin credentials when account exists
- rotate ADMIN_RESET_CODE after emergency recovery

### Screenshot Placeholders

- `docs/assets/admin/01-admin-login.png` (Admin login)
- `docs/assets/admin/02-admin-dashboard.png` (Admin dashboard)

## Admin Operating Responsibilities

Daily/weekly operations:

- monitor user onboarding and account health
- review suspicious auth patterns and high rejection trends
- ensure faculty coverage for pending review backlog
- validate report generation and data quality

Monthly operations:

- rotate critical secrets (planned windows)
- inspect metrics and latency distributions
- verify backup and restore pathway for selected DB mode

## User and Role Administration

Admin user management supports:

- create/update/delete users
- role assignment
- account activation/deactivation
- report generation

Core endpoints:

- GET /api/admin/stats
- GET /api/admin/users
- POST /api/admin/users
- PUT /api/admin/users/:id
- DELETE /api/admin/users/:id
- GET /api/admin/reports

### Screenshot Placeholders

- `docs/assets/admin/03-user-management-table.png` (User list)
- `docs/assets/admin/04-user-create-form.png` (Create user modal/form)
- `docs/assets/admin/05-user-edit-form.png` (Edit user modal/form)
- `docs/assets/admin/06-report-export-panel.png` (Reports export options)

Role principles:

- student: submits and manages own activity lifecycle
- faculty: reviews and decides pending submissions
- admin: system-wide governance and provisioning

## Security Controls and Hardening

Backend currently enforces:

- JWT auth and role authorization
- strict CORS allow-list
- security headers
- HSTS in production
- auth route rate limiting
- graceful shutdown with error trapping
- reduced internal error exposure in production responses

Operational recommendations:

- keep frontend and backend on trusted origins only
- avoid wildcard CORS in production
- use distributed rate-limit backend for multi-instance deployments
- audit admin actions periodically

## Deployment Models

Typical production topology:

```text
Browser -> Frontend Host (Next.js)
          -> Backend Host (Express)
          -> PostgreSQL
          -> Optional Cloudinary
```

Local development topology:

```text
http://localhost:3000 (frontend)
http://localhost:5001 (backend)
SQLite or configured external DB
```

## Environment Variables (Detailed)

### Backend mandatory set

- NODE_ENV
- PORT
- CORS_ORIGIN
- JWT_SECRET
- JWT_EXPIRES_IN
- ADMIN_RESET_CODE
- DB_PATH or DB_NAME or DATABASE_URL
- DB_SYNC_STRATEGY

### Backend recommended set

- AUTH_RATE_LIMIT_WINDOW_MS
- AUTH_RATE_LIMIT_MAX
- AUTH_RATE_LIMIT_BACKEND
- REDIS_URL or UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
- METRICS_ENABLED and METRICS_PATH
- TRACING_ENABLED and TRACING_EXPORTER
- LOG_LEVEL

### Frontend variables

- NEXT_PUBLIC_API_URL
- NEXT_PUBLIC_APP_NAME
- NEXT_PUBLIC_APP_VERSION

Important rule:

- never place secrets in frontend NEXT_PUBLIC variables

## Post-Deployment Validation

Run health checks:

```bash
curl https://your-backend/healthz/live
curl https://your-backend/healthz/ready
curl https://your-backend/metrics
```

Run auth sanity checks:

- admin login
- profile fetch
- admin stats fetch

Run student smoke checks:

- student login
- stats fetch
- temporary activity create/delete

### Endpoint Examples

#### 1. Admin Login

Request:

```http
POST /api/auth/login
Content-Type: application/json

{
   "email": "arpan@smartstudenthub.com",
   "password": "Arpan@123."
}
```

Success response (example):

```json
{
   "message": "Login successful",
   "token": "<jwt>",
   "user": {
      "id": 1,
      "role": "admin",
      "email": "arpan@smartstudenthub.com"
   }
}
```

#### 2. Admin Stats

Request:

```http
GET /api/admin/stats
Authorization: Bearer <jwt>
```

Success response (example):

```json
{
   "totals": {
      "users": 42,
      "students": 31,
      "faculty": 8,
      "admins": 3
   },
   "activities": {
      "pending": 12,
      "approved": 210,
      "rejected": 19
   }
}
```

#### 3. List Users

Request:

```http
GET /api/admin/users?page=1&limit=20&search=faculty
Authorization: Bearer <jwt>
```

Success response (example):

```json
{
   "users": [
      {
         "id": 4,
         "name": "Faculty User",
         "email": "faculty@gmail.com",
         "role": "faculty",
         "isActive": true
      }
   ],
   "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
   }
}
```

#### 4. Create User

Request:

```http
POST /api/admin/users
Authorization: Bearer <jwt>
Content-Type: application/json

{
   "name": "New Faculty",
   "email": "newfaculty@smartstudenthub.com",
   "password": "NewFaculty@123.",
   "role": "faculty",
   "department": "Computer Science"
}
```

Success response (example):

```json
{
   "message": "User created successfully",
   "user": {
      "id": 45,
      "email": "newfaculty@smartstudenthub.com",
      "role": "faculty"
   }
}
```

#### 5. Update User

Request:

```http
PUT /api/admin/users/45
Authorization: Bearer <jwt>
Content-Type: application/json

{
   "department": "Data Science",
   "isActive": true
}
```

Success response (example):

```json
{
   "message": "User updated successfully",
   "user": {
      "id": 45,
      "department": "Data Science",
      "isActive": true
   }
}
```

#### 6. Delete User

Request:

```http
DELETE /api/admin/users/45
Authorization: Bearer <jwt>
```

Success response (example):

```json
{
   "message": "User deleted successfully"
}
```

#### 7. Reports

Request:

```http
GET /api/admin/reports?format=json&type=activity-summary
Authorization: Bearer <jwt>
```

Success response (example):

```json
{
   "generatedAt": "2026-04-10T10:00:00.000Z",
   "summary": {
      "approved": 210,
      "pending": 12,
      "rejected": 19
   }
}
```

## Monitoring and Incident Response

Monitor continuously:

- auth failures and burst patterns
- readiness failures
- request latency and error-rate metrics
- repeated 429/503 patterns

Incident response basics:

1. confirm health and readiness
2. identify scope (frontend, backend, DB, storage)
3. inspect recent deploy/config changes
4. rollback or hotfix
5. document root cause and prevention action

## Troubleshooting

401 on protected routes:

- expired/missing JWT
- token signing secret mismatch across instances

403 CORS errors:

- frontend origin not present in CORS_ORIGIN allow list

429 spikes:

- expected under attack or misconfigured clients
- tune limits after verifying legitimate load patterns

503 readiness failures:

- DB connection issue
- invalid DB config
- migration/sync mismatch during rollout

Last Updated: April 2026
