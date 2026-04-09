# Smart Student Hub Workspace

## What This Repository Contains

This monorepo contains the complete Smart Student Hub platform in separated services:

- frontend: Next.js 15 application for UI, routing, and client-side workflows
- backend: Express.js API for authentication, business rules, persistence, and file handling
- docs: role guides, architecture, and operational instructions

## Architecture Summary

High-level request path:

```text
User Browser
	-> Next.js Frontend
	-> Express Backend (/api/*)
	-> SQLite (local) or PostgreSQL (production)
```

Design decisions:

- keep browser-safe configuration only in frontend
- keep secrets and security controls only in backend
- expose all business APIs from backend route modules
- keep migration and schema lifecycle backend-owned

## Major Features

Student workflows:

- registration and login
- profile and CV metadata management
- activity submit/edit/delete (pending only)
- portfolio and stats view

Faculty workflows:

- pending queue review
- approve/reject with remarks and credits
- student profile inspection

Admin workflows:

- user and role administration
- account activation management
- reporting and system-wide stats

## Security Baseline

Implemented backend controls:

- JWT authentication with role-based authorization
- CORS origin allow-list validation
- strict security headers and production HSTS
- auth route rate limiting with pluggable store
- production error redaction
- graceful shutdown and process-level exception handling

Recommended security operations:

- use strong rotating JWT secrets
- keep admin reset code private and rotated
- avoid wildcard CORS in production
- use distributed rate-limiter backend in multi-instance deployments

## Observability Baseline

Backend observability stack:

- structured logging: Pino
- metrics: prom-client at /metrics
- tracing: OpenTelemetry middleware
- readiness/liveness endpoints for orchestration checks

Core operational endpoints:

- GET /healthz/live
- GET /healthz/ready
- GET /metrics

## Environment Setup

1. create frontend env file from template
2. create backend env file from template
3. set NEXT_PUBLIC_API_URL to backend API origin
4. configure backend database source

Backend DB options:

- DB_PATH (absolute SQLite path)
- DB_NAME (relative SQLite path)
- DATABASE_URL (PostgreSQL)

## Development Workflow

Install dependencies:

```bash
npm --prefix frontend install
npm --prefix backend install
```

Run services:

```bash
npm --prefix frontend run dev
npm --prefix backend run dev
```

Lint:

```bash
npm run lint
```

Migrations:

```bash
npm --prefix backend run migrate
```

## Production Guidance

Before production rollout:

- set DB_SYNC_STRATEGY=none
- apply migrations through migration runner
- confirm JWT_SECRET and ADMIN_RESET_CODE are strong
- configure CORS_ORIGIN for actual frontend domains
- configure rate limiter backend (redis/upstash)

After deployment:

- verify health endpoints
- verify login and role-protected endpoints
- verify metrics output
- run smoke create/delete activity flow

## Documentation Index

- central docs index: docs/frontend/README.md
- frontend README: frontend/README.md
- admin guide: docs/frontend/ADMIN_GUIDE.md
- faculty guide: docs/frontend/FACULTY_GUIDE.md
- student guide: docs/frontend/STUDENT_GUIDE.md
- architecture guide: docs/frontend/DATABASE_API_ARCHITECTURE.md

Last Updated: April 2026
