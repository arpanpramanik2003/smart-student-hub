# Smart Student Hub Documentation Index

Welcome to the official developer and administrative documentation index for the **Smart Student Hub System** — an institutional co-curricular activity tracking, verifiable credential engine, and NAAC/NIRF accreditation reporting platform for Indian higher education institutions.

---

## 📚 Table of Contents

### 🌐 System Core & Technical Foundation
* [01-project-overview.md](./01-project-overview.md) — High-level introduction to system purpose, NAAC/NIRF accreditation goals, user personas, and real-world institutional workflow alignment.
* [02-tech-stack.md](./02-tech-stack.md) — Comprehensive technical stack specification covering Next.js App Router, Express.js backend, Sequelize ORM, SQLite DB, Tailwind CSS, and PDF/QR engines.
* [03-architecture.md](./03-architecture.md) — End-to-end system architecture breakdown, route loader registry, middleware security boundaries, and async notification dispatch.
* [04-database-schema.md](./04-database-schema.md) — Complete relational database schema documentation covering Sequelize data models, foreign key relationships, indexes, and migration audit history.
* [05-security.md](./05-security.md) — Security posture specification including JWT token rotation, password hashing, SQL injection prevention, rate limiting, and RBAC authorization middleware.
* [06-api-reference.md](./06-api-reference.md) — Exhaustive REST API endpoint specification with request payloads, HTTP status codes, query parameters, and JSON response schemas.
* [07-deployment.md](./07-deployment.md) — Step-by-step production deployment guide, environment configuration, database migration commands, and performance optimization checks.

---

### 🛡️ Authentication & Authorization
* [Auth/01-authentication-flow.md](./Auth/01-authentication-flow.md) — Authentication lifecycle covering user registration, login JWT token generation, HTTP headers, and forced first-login password reset.
* [Auth/02-roles-and-permissions.md](./Auth/02-roles-and-permissions.md) — Role-Based Access Control (RBAC) permission matrix across `student`, `faculty`, and `admin` roles.

---

### 🔑 Administrator Documentation
* [Admin/01-functionality-overview.md](./Admin/01-functionality-overview.md) — Administrator console overview, system configuration controls, user directory management, and system health monitoring.
* [Admin/02-credit-policy-engine.md](./Admin/02-credit-policy-engine.md) — Configurable Credit Policy engine specification for mapping activity categories and achievement levels to standardized credit points.
* [Admin/03-approval-workflow.md](./Admin/03-approval-workflow.md) — Stage 2 final institutional sign-off, credit allocation, cryptographic token generation, and credential revocation controls.
* [Admin/04-reporting-analytics.md](./Admin/04-reporting-analytics.md) — NAAC/NIRF query-driven institutional reporting engine, aggregate participation ratio formulas, YoY trends, and CSV/PDF export specs.
* [Admin/05-mentor-management.md](./Admin/05-mentor-management.md) — Faculty mentor allocation workflows, department assignment, and mentee roster management.
* [Admin/06-bulk-import.md](./Admin/06-bulk-import.md) — CSV bulk user onboarding engine, template download, row-level validation, duplicate email detection, and audit logging.
* [Admin/07-grievance-resolution.md](./Admin/07-grievance-resolution.md) — Institutional grievance queue, student appeal resolution, and resubmission evaluation controls.

---

### 🎓 Faculty & Mentor Documentation
* [Faculty/01-functionality-overview.md](./Faculty/01-functionality-overview.md) — Faculty mentor portal overview, mentee activity queue, evaluation metrics, and department summary statistics.
* [Faculty/02-mentee-review-workflow.md](./Faculty/02-mentee-review-workflow.md) — Stage 1 mentor evaluation workflow, evidence verification, approval remarks, and activity rejection feedback.
* [Faculty/03-final-vs-mentor-approval.md](./Faculty/03-final-vs-mentor-approval.md) — Technical separation between Stage 1 mentor verification (`mentor_approved`) and Stage 2 final admin sign-off (`approved`).

---

### 🎒 Student Documentation
* [Student/01-functionality-overview.md](./Student/01-functionality-overview.md) — Student portal overview, dashboard stats, academic activity tracking, and milestone achievements.
* [Student/02-activity-submission.md](./Student/02-activity-submission.md) — Activity submission workflow, automated policy credit lookup, NAAC criterion categorization, and document proof upload.
* [Student/03-portfolio-and-verification.md](./Student/03-portfolio-and-verification.md) — Verified digital portfolio showcase, ATS-formatted PDF resume export, and dynamic QR code generation.
* [Student/04-credit-progress.md](./Student/04-credit-progress.md) — Academic year (July 1 – June 30) credit progress tracking, 20.0 credit annual target bar, NAAC criterion chips, and lifetime cumulative totals.
* [Student/05-notifications-and-appeals.md](./Student/05-notifications-and-appeals.md) — In-app notification bell system, rejection remarks inspection, resubmission workflow, and grievance appeals.

---

### 🔍 Public Verification Portal
* [Public/01-credential-verification.md](./Public/01-credential-verification.md) — Unauthenticated public credential verification portal (`/verify/[verificationId]`), QR verification scanning, privacy guards, and revocation alerts.
