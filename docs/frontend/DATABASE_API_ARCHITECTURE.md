# Database and API Architecture

## Table of Contents
- System Overview
- Service Boundaries
- Runtime Request Flow
- Backend API Surface
- Data Model and Relationships
- Migration and Schema Lifecycle
- Security Architecture
- Observability Architecture
- File Storage Architecture
- Configuration Model
- Error Model
- Deployment and Validation Checklist

## System Overview

Smart Student Hub follows a split-service architecture:

- frontend service: Next.js application in frontend
- backend service: Express API in backend
- persistence service: SQLite for local and PostgreSQL for production

This separation keeps browser-facing concerns isolated from server-side secrets and data operations.

## Service Boundaries

Frontend responsibilities:

- rendering role-specific UI
- managing client session state
- calling backend API via NEXT_PUBLIC_API_URL
- route gating via middleware and cookie presence

Backend responsibilities:

- authentication and authorization
- business logic and validation
- ORM and migrations
- upload and file serving
- metrics, tracing, and logs

## Runtime Request Flow

```text
Browser
  -> Next.js frontend pages
  -> API calls to Express backend /api/*
  -> Express middleware stack (security, logging, tracing, metrics, limiter)
  -> route handlers
  -> Sequelize model operations
  -> SQLite/PostgreSQL
```

High-level backend middleware order:

1. request logger
2. tracing middleware
3. metrics middleware
4. auth rate limiter
5. CORS and security headers
6. request body parser
7. static local uploads (optional)
8. health/metrics/root and dynamic API routes

## Backend API Surface

Route files are loaded from backend/routes and mounted under /api.

Authentication:

- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/profile
- POST /api/auth/admin-password-reset

Student routes:

- GET /api/students/profile
- PUT /api/students/profile
- POST /api/students/upload-avatar
- GET /api/students/activities
- POST /api/students/activities
- PUT /api/students/activities/:activityId
- DELETE /api/students/activities/:activityId
- GET /api/students/activities/stats
- GET /api/students/browse

Faculty routes:

- GET /api/faculty/stats
- GET /api/faculty/activities/pending
- GET /api/faculty/activities
- PUT /api/faculty/activities/:activityId
- GET /api/faculty/students

Admin routes:

- GET /api/admin/stats
- GET /api/admin/users
- POST /api/admin/users
- PUT /api/admin/users/:id
- DELETE /api/admin/users/:id
- GET /api/admin/reports

File routes:

- GET /api/files/view?url=...
- GET /api/files/download?url=...

Operational routes:

- GET /
- GET /healthz/live
- GET /healthz/ready
- GET /metrics

## Data Model and Relationships

Primary entities:

- User
- Activity

Relationship model:

- one student user can submit many activities
- one activity belongs to one student
- one activity can optionally reference an approver user

Common activity state transitions:

- pending -> approved
- pending -> rejected

Key invariants:

- finalized records should remain auditable
- role checks must be enforced before state changes

## Migration and Schema Lifecycle

Migration system components:

- runner: backend/lib/migrations.js
- script: npm --prefix backend run migrate
- history table: SequelizeMeta

Runtime schema behavior is controlled by DB_SYNC_STRATEGY:

- none
- safe
- alter

Recommended production mode:

- DB_SYNC_STRATEGY=none
- schema changes via migrations only

## Security Architecture

Authentication and authorization:

- JWT bearer token on protected routes
- role-based policy checks
- production guardrail for weak JWT secrets

Request protection:

- strict origin filtering via CORS_ORIGIN
- security response headers
- HSTS in production

Abuse mitigation:

- auth rate limiting with pluggable backend (memory, redis, upstash)
- auto mode fallback to memory if distributed store unavailable

## Observability Architecture

Logging:

- structured JSON logs via Pino
- request metadata includes request id and trace id

Metrics:

- prom-client default process metrics
- per-route request totals and latency histograms
- served via METRICS_PATH (default /metrics)

Tracing:

- OpenTelemetry spans per HTTP request
- exporters: console, otlp, none
- trace id returned to clients as response header

## File Storage Architecture

Storage modes:

- cloud mode: Cloudinary when valid credentials are present
- local fallback: backend/public/uploads

Serving behavior:

- optional local static exposure under /uploads
- controlled by EXPOSE_LOCAL_UPLOADS and cache-control settings

File route behavior:

- view endpoint for inline consumption
- download endpoint for attachment-style retrieval

## Configuration Model

Backend configuration is centralized and validated in backend/lib/config.js.

Key groups:

- runtime: node env, port, trust proxy, body/timeouts
- network: CORS origins and local upload exposure
- security: jwt and rate limiter backend
- database: db path/url and sync strategy
- observability: logs, metrics, tracing

Frontend only consumes public-safe values:

- NEXT_PUBLIC_API_URL
- NEXT_PUBLIC_APP_NAME
- NEXT_PUBLIC_APP_VERSION

## Error Model

Typical API statuses:

- 400 validation issues
- 401 authentication failure
- 403 authorization or CORS policy denial
- 404 missing resource
- 409 unique constraint conflicts
- 429 rate limit exceeded
- 500 internal server error
- 503 readiness or dependency unavailable

Production behavior minimizes sensitive internal detail in response payloads.

## Deployment and Validation Checklist

Pre-deploy:

- lint frontend and backend
- build frontend
- apply migrations
- confirm env var completeness

Post-deploy:

- check /healthz/live
- check /healthz/ready
- check /metrics
- run auth and role smoke tests
- run create/delete activity smoke path

Last Updated: April 2026
