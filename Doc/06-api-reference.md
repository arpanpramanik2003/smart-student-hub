# 06. REST API Reference Specification

This document provides the complete REST API reference for **Smart Student Hub**. All API routes are hosted under the `/api` prefix by the backend Express server (`server.js` on port `5000`).

---

## 🔑 1. Authentication API (`/api/auth`)

### 1.1 `POST /api/auth/login`
Authenticates user credentials and returns a signed JWT token.

- **Authentication**: None (Public)
- **Request Body**:
```json
{
  "email": "student@university.edu",
  "password": "Password#123"
}
```
- **Response `200 OK`**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id": 42,
    "name": "John Doe",
    "email": "student@university.edu",
    "role": "student",
    "mustChangePassword": false
  }
}
```

### 1.2 `POST /api/auth/register`
Registers a new student or faculty account.

- **Authentication**: None (Public)
- **Request Body**:
```json
{
  "name": "Arpan Pramanik",
  "email": "arpan@university.edu",
  "password": "Password#123",
  "role": "student",
  "department": "Computer Science & Engineering",
  "programCategory": "Engineering & Technology",
  "program": "Bachelor of Technology",
  "year": 3,
  "studentId": "STU-2026-042"
}
```
- **Response `201 Created`**: Returns created user object and JWT session token.

### 1.3 `POST /api/auth/change-password`
Updates user password and clears forced first-login reset flag (`mustChangePassword = false`).

- **Authentication**: Required (`student`, `faculty`, `admin`)
- **Request Body**:
```json
{
  "newPassword": "NewSecurePassword#2026"
}
```
- **Response `200 OK`**: `{ "success": true, "message": "Password updated successfully." }`

---

## 🎒 2. Student API (`/api/students`)

### 2.1 `GET /api/students/activities`
Retrieves co-curricular activity submissions logged by the caller.

- **Authentication**: Required (`student`)
- **Query Parameters**: `status` (`pending_mentor` | `mentor_approved` | `approved` | `rejected`), `limit`, `page`
- **Response `200 OK`**:
```json
{
  "activities": [
    {
      "id": 101,
      "title": "Smart India Hackathon 2026 Winner",
      "type": "hackathon",
      "achievementLevel": "national",
      "credits": 6.0,
      "naacCriterion": "Criterion 5",
      "status": "approved",
      "verificationId": "vref_9a8b7c6d5e4f3a2b"
    }
  ]
}
```

### 2.2 `POST /api/students/activities`
Submits a new co-curricular activity entry. Automatically queries credit policy rules.

- **Authentication**: Required (`student`)
- **Request Body**: `FormData` (title, type, achievementLevel, date, organizer, description, certificate file)
- **Response `201 Created`**: Returns created activity object with status `pending_mentor`.

### 2.3 `GET /api/students/activities/progress`
Computes Academic Year (July 1 – June 30) credit progress and lifetime totals.

- **Authentication**: Required (`student`)
- **Response `200 OK`**:
```json
{
  "academicYear": {
    "label": "AY 2025-26",
    "creditsEarned": 14.5,
    "annualTarget": 20.0,
    "progressPercentage": 73,
    "criterionBreakdown": [
      { "criterion": "Criterion 5", "activityCount": 3, "credits": 14.5 }
    ]
  },
  "lifetime": {
    "totalCredits": 32.5,
    "totalApprovedActivities": 9
  }
}
```

### 2.4 `POST /api/students/activities/:id/appeal`
Files a formal grievance appeal against a rejected activity submission.

- **Authentication**: Required (`student`)
- **Request Body**: `{ "reason": "Uploaded clear PDF certificate proof." }`
- **Response `201 Created`**: Returns created grievance record.

---

## 🎓 3. Faculty API (`/api/faculty`)

### 3.1 `GET /api/faculty/review`
Fetches Stage 1 review queue of submissions logged by assigned mentees.

- **Authentication**: Required (`faculty`)
- **Response `200 OK`**: Returns array of activity objects with status `pending_mentor`.

### 3.2 `PUT /api/faculty/activities/:id`
Executes Stage 1 evaluation (`approve` or `reject`).

- **Authentication**: Required (`faculty`)
- **Request Body**: `{ "action": "approve", "remarks": "Evidence verified." }`
- **Response `200 OK`**: Updates status to `mentor_approved` (if approved) or `rejected` (if rejected).

---

## 🔑 4. Admin API (`/api/admin`)

### 4.1 `GET /api/admin/review`
Fetches Stage 2 final approval queue (`status = 'mentor_approved'`) or approved ledger (`status = 'approved'`).

- **Authentication**: Required (`admin`)
- **Query Parameters**: `status` (`mentor_approved` | `approved`)
- **Response `200 OK`**: Array of activity records with student details.

### 4.2 `PUT /api/admin/review/:id`
Executes Stage 2 final approval or credential revocation.

- **Authentication**: Required (`admin`)
- **Request Body**:
```json
{
  "action": "approve",
  "remarks": "Verified against credit policy."
}
```
- **Response `200 OK`**: Grants official credits and issues cryptographic `verificationId`.
- **Revocation Request Body**: `{ "action": "revoke", "remarks": "Evidence invalid." }`

### 4.3 `POST /api/admin/users/bulk-import`
Executes bulk CSV user onboarding with duplicate email detection.

- **Authentication**: Required (`admin`)
- **Request Body**:
```json
{
  "rows": [
    { "name": "John Doe", "email": "john@university.edu", "role": "student", "department": "CSE" }
  ],
  "fileName": "batch_2026.csv"
}
```
- **Response `200 OK`**: Returns `createdList`, `skippedList`, `errorList`, and `importSummary`.

### 4.4 `GET /api/admin/reports`
Computes live, query-driven NAAC Criterion summaries and participation ratios.

- **Authentication**: Required (`admin`)
- **Query Parameters**: `type=naac`, `department`, `academicYear`
- **Response `200 OK`**: Aggregated report metrics filtering **strictly on `status = 'approved'`**.

### 4.5 `GET /api/admin/grievances` & `PUT /api/admin/grievances/:id`
Fetches open student appeals and updates grievance resolution status (`resolved` or `dismissed`).

---

## 🔍 5. Public Verification API (`/api/verify`)

### 5.1 `GET /api/verify/:verificationId`
Public unauthenticated credential verification lookup.

- **Authentication**: None (Public)
- **Response `200 OK` (Active Verified Credential)**:
```json
{
  "status": "approved",
  "studentName": "John Doe",
  "institutionName": "Smart Student Hub College",
  "title": "Smart India Hackathon 2026 Winner",
  "type": "hackathon",
  "achievementLevel": "national",
  "credits": 6.0,
  "naacCriterion": "Criterion 5",
  "date": "2026-03-15",
  "approvalDate": "2026-03-20"
}
```
- **Response `200 OK` (Revoked Credential)**:
```json
{
  "status": "revoked",
  "isRevoked": true,
  "revokedAt": "2026-08-12T11:45:00Z",
  "revocationReason": "Credential revoked due to invalid evidence during audit."
}
```

---

## 🔔 6. Notification API (`/api/notifications`)

### 6.1 `GET /api/notifications`
Fetches in-app notification alerts for the logged-in user.

- **Authentication**: Required (`student`, `faculty`, `admin`)
- **Response `200 OK`**: Array of notification objects (`message`, `isRead`, `createdAt`).

### 6.2 `PATCH /api/notifications`
Marks unread notifications as read.

- **Authentication**: Required (`student`, `faculty`, `admin`)
- **Response `200 OK`**: `{ "success": true }`
