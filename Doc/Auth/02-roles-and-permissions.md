# Auth 02. Role-Based Access Control (RBAC) Permissions Matrix

The **CampusSphere** enforces strict permission boundaries to isolate student data, faculty review queues, and administrative system controls.

---

## 📊 Comprehensive RBAC Permissions Matrix

| Resource / System Action | Student (`student`) | Faculty (`faculty`) | Admin (`admin`) | Public (Unauthenticated) |
| :--- | :---: | :---: | :---: | :---: |
| **Authentication & Profile** |
| Register Account / Log In | **ALLOWED** | **ALLOWED** | **ALLOWED** | **ALLOWED** |
| Update Personal Profile & Avatar | **ALLOWED** (Self) | **ALLOWED** (Self) | **ALLOWED** (Self) | DENIED |
| Reset Private Password | **ALLOWED** (Self) | **ALLOWED** (Self) | **ALLOWED** (Self) | DENIED |
| **Co-Curricular Submissions** |
| Submit New Activity & Proof File | **ALLOWED** | DENIED | DENIED | DENIED |
| View Own Activity History & Progress | **ALLOWED** (Self) | DENIED | DENIED | DENIED |
| Resubmit Rejected Activity Evidence | **ALLOWED** (Self) | DENIED | DENIED | DENIED |
| File Grievance / Appeal Rejection | **ALLOWED** (Self) | DENIED | DENIED | DENIED |
| **Faculty Mentor Evaluation** |
| View Assigned Mentee Roster | DENIED | **ALLOWED** | **ALLOWED** | DENIED |
| Stage 1 Approve/Reject Submissions | DENIED | **ALLOWED** (Mentees) | **ALLOWED** | DENIED |
| View Department Activity Logs | DENIED | **ALLOWED** | **ALLOWED** | DENIED |
| **Administrative Controls** |
| Create / Edit / Toggle Credit Policies | DENIED | DENIED | **ALLOWED** | DENIED |
| Stage 2 Final Approval & Sign-Off | DENIED | DENIED | **ALLOWED** | DENIED |
| Revoke Approved Credentials | DENIED | DENIED | **ALLOWED** | DENIED |
| Execute Bulk CSV User Onboarding | DENIED | DENIED | **ALLOWED** | DENIED |
| Assign / Reassign Faculty Mentors | DENIED | DENIED | **ALLOWED** | DENIED |
| Generate NAAC / NIRF Institutional Reports | DENIED | DENIED | **ALLOWED** | DENIED |
| Resolve Student Grievances & Appeals | DENIED | DENIED | **ALLOWED** | DENIED |
| **Public Credential Verification** |
| Inspect Public Credential by Token | **ALLOWED** | **ALLOWED** | **ALLOWED** | **ALLOWED** (`/verify/[id]`) |
| View Disclosed Student Credential Fields | **ALLOWED** | **ALLOWED** | **ALLOWED** | **ALLOWED** |
| Access Redacted PII (Email/Phone/IDs) | DENIED | **ALLOWED** (Scope) | **ALLOWED** | **DENIED** |

---

## 🚫 Role Permission Boundaries

### 1. Student Role Boundaries (`student`)
- **Cannot** review or approve other students' activity submissions.
- **Cannot** modify credit point values or NAAC criterion assignments.
- **Cannot** access administrative credit policy rules or user management settings.

### 2. Faculty Role Boundaries (`faculty`)
- **Cannot** grant official degree credits or generate cryptographic verification tokens (`vref_...`).
- **Cannot** alter global Credit Policy rules.
- **Cannot** execute bulk CSV onboarding or modify user access roles.

### 3. Administrator Role Boundaries (`admin`)
- **Cannot** submit student activity records as an admin user.
- **Cannot** delete their own active admin account or bypass audit log history.
