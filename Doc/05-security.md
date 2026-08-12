# 05. Security Architecture & Protections

> Documentation of security measures, authentication mechanisms, input validation controls, and privacy safeguards implemented across Smart Student Hub.

---

## 🔒 Core Security Protections

### 1. Authentication & JWT Token Handling
- **JWT Tokens**: Authentication relies on signed JSON Web Tokens (`jsonwebtoken`) containing user identity (`id`, `email`, `role`).
- **Authorization Header**: API requests transmit credentials via the standard `Authorization: Bearer <token>` HTTP header.
- **Password Hashing**: User passwords are never stored in plain text; credentials are encrypted using `bcryptjs` with **10 salt rounds**.
- **Forced Password Reset**: Bulk-created accounts carry `mustChangePassword = true`, forcing users to set a private password before accessing full application features.

---

### 2. Role-Based Access Control (RBAC) Matrix

Authorization middleware ([`backend/lib/auth.js`](file:///d:/Edutation(P)/SIH/smart-student-hub/backend/lib/auth.js)) strictly segregates API endpoint privileges:

```
[Incoming Request] ──> [JWT Extraction] ──> [Signature Verification] ──> [Role Check against Route Policy] ──> [Allow / Reject]
```

| API Route Path | Allowed Roles | Enforced Security Check |
| :--- | :--- | :--- |
| `/api/students/*` | `student` | Validates session token; restricts resource access to caller's `studentId`. |
| `/api/faculty/*` | `faculty` | Restricts mentee queue reviews to faculty assigned to the student's department/program. |
| `/api/admin/*` | `admin` | Restricts credit policy creation, final sign-off, bulk onboarding, and reports to admin users. |
| `/api/verify/*` | **Public (Unauthenticated)** | Read-only public credential verification; redacts sensitive student fields. |

---

### 3. File Security & Path Traversal Safeguards
- **File Upload Restrictions**: Image uploads (e.g., student avatars) validate file extensions and mime types (`image/jpeg`, `image/png`, `image/webp`).
- **Path Traversal Fixes**: Document serve routes use `path.resolve` combined with boundary checks to prevent directory traversal attacks (e.g., `../../etc/passwd`).
- **Static Asset Serving**: Uploaded evidence files are served from designated storage roots with sanitized filenames.

---

### 4. Data Privacy Guards in Public Verification (`/api/verify/[verificationId]`)
The public verification page allows third-party auditors and recruiters to validate credentials without creating an account. To protect student PII (Personally Identifiable Information), the endpoint applies explicit field filtering:

| Disclosed Public Fields (Safe) | Redacted PII Fields (Protected) |
| :--- | :--- |
| ✓ Student Full Name | ✕ Student Email Address |
| ✓ Institution Name | ✕ Student Phone Number |
| ✓ Activity Event Title | ✕ Student ID / Roll Number |
| ✓ Activity Category & Level | ✕ Internal Database Primary Keys |
| ✓ Awarded Credit Points | ✕ Faculty / Admin Reviewer Remarks |
| ✓ NAAC Criterion Category | ✕ Internal Audit Log Trails |
| ✓ Activity Date & Approval Date | ✕ Account Password Hashes |

---

### 5. UI Accessibility & Focus Trapping
- **Modal Focus Trap**: All modal dialogs (e.g. `UserManagement.jsx`) trap keyboard navigation focus (`Tab` / `Shift+Tab`) within the open container, preventing background DOM interaction.
- **Escape Key Handling**: Pressing `Escape` cleanly closes active overlays and restores focus to the invoking element.
- **Screen Reader Support**: Data tables use explicit `aria-sort` attributes and `scope="col"` headers.

---

### 6. Query Security & SQL Injection Prevention
- **Sequelize Parameterized Bind Variables**: All raw aggregate queries use parameterized replacement bindings (`:studentId`, `:ayStartDate`) to prevent SQL injection vulnerabilities:

```javascript
// Secure Query Parameterization
const results = await sequelize.query(`
  SELECT * FROM activities 
  WHERE studentId = :studentId AND status = 'approved'
`, {
  replacements: { studentId },
  type: sequelize.QueryTypes.SELECT,
});
```
