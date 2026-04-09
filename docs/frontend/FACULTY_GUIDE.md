# Faculty User Guide

## Table of Contents
- Overview
- Access and Roles
- Faculty Dashboard
- Review Queue (Primary Workflow)
- Credits and Remarks Guidelines
- All Activities Module
- Student Directory
- File Review Workflow
- Security and Audit Notes
- API Reference (Faculty)
- Troubleshooting

## Overview

Faculty users are responsible for validating student activity submissions and maintaining academic quality in the approval pipeline.

The user interface is served by Next.js frontend and all authoritative actions are executed via Express backend APIs.

## Access and Roles

- faculty accounts are provisioned by admins
- login is performed from frontend /login page
- backend enforces role checks for review endpoints

If you are logged in but cannot access faculty pages, ask admin to verify account role and active state.

## Faculty Dashboard

Dashboard provides an operational snapshot:

- pending items requiring action
- approved and rejected totals
- recent review activity
- quick links to review queue and student listing

Main stats endpoint:

- GET /api/faculty/stats

### Screenshot Placeholders

- `docs/assets/faculty/01-dashboard-overview.png` (Faculty dashboard)
- `docs/assets/faculty/02-kpi-cards.png` (Stats cards and counters)

## Review Queue (Primary Workflow)

This is the highest-priority faculty area.

Each pending activity shows:

- student details (name, ID, academic context)
- submission metadata (title, type, date, organizer, duration)
- description and requested credits
- proof attachment access

Review actions:

1. verify details and supporting proof
2. set awarded credits
3. add remarks where needed
4. approve or reject

Endpoints:

- GET /api/faculty/activities/pending
- PUT /api/faculty/activities/:activityId

### Screenshot Placeholders

- `docs/assets/faculty/03-review-queue-list.png` (Pending queue)
- `docs/assets/faculty/04-review-details-panel.png` (Activity expanded details)
- `docs/assets/faculty/05-approve-reject-dialog.png` (Final decision UI)

## Credits and Remarks Guidelines

Use consistent standards to keep evaluations fair:

- award credits based on relevance, authenticity, and impact
- use remarks for rejections and major credit adjustments
- avoid one-word remarks; include actionable correction points

Recommended remark style:

- issue detected
- evidence missing or mismatch
- exact correction expected for resubmission

## All Activities Module

All Activities helps in auditing and trend analysis beyond current queue.

Typical usage:

- filter by status and type
- search by student or title
- revisit previously reviewed records

Endpoint:

- GET /api/faculty/activities

## Student Directory

Faculty can browse student records in read-only mode.

Use cases:

- context before review
- understanding academic profile during ambiguous submissions
- checking historical activity patterns

Endpoint:

- GET /api/faculty/students

### Screenshot Placeholders

- `docs/assets/faculty/06-student-directory.png` (Directory list)
- `docs/assets/faculty/07-student-profile-view.png` (Student profile details)

## File Review Workflow

Use backend file routes for preview/download:

- GET /api/files/view?url=...
- GET /api/files/download?url=...

If inline preview fails, use download and verify locally.

## Security and Audit Notes

- every review action is authenticated and role-protected
- request logs include identifiers to support traceability
- do not share credentials or copied bearer tokens
- avoid reviewing from untrusted network/browser sessions

## API Reference (Faculty)

- GET /api/faculty/stats
- GET /api/faculty/activities/pending
- GET /api/faculty/activities
- PUT /api/faculty/activities/:activityId
- GET /api/faculty/students
- GET /api/files/view?url=...
- GET /api/files/download?url=...

### Endpoint Examples

#### 1. Faculty Stats

Request:

```http
GET /api/faculty/stats
Authorization: Bearer <jwt>
```

Success response (example):

```json
{
	"pending": 18,
	"approved": 124,
	"rejected": 16,
	"reviewedByMe": 42
}
```

#### 2. Pending Queue

Request:

```http
GET /api/faculty/activities/pending?page=1&limit=20
Authorization: Bearer <jwt>
```

Success response (example):

```json
{
	"activities": [
		{
			"id": 52,
			"title": "Advanced Cloud Workshop",
			"status": "pending",
			"student": {
				"id": 8,
				"name": "Student User",
				"studentId": "SSH2026-008"
			}
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

#### 3. Approve Activity

Request:

```http
PUT /api/faculty/activities/52
Authorization: Bearer <jwt>
Content-Type: application/json

{
	"status": "approved",
	"credits": 6,
	"remarks": "Verified certificate and organizer details."
}
```

Success response (example):

```json
{
	"message": "Activity reviewed successfully",
	"activity": {
		"id": 52,
		"status": "approved",
		"credits": 6,
		"approvedBy": 4
	}
}
```

#### 4. Reject Activity

Request:

```http
PUT /api/faculty/activities/53
Authorization: Bearer <jwt>
Content-Type: application/json

{
	"status": "rejected",
	"credits": 0,
	"remarks": "Certificate does not include participant name. Please re-upload valid proof."
}
```

Success response (example):

```json
{
	"message": "Activity reviewed successfully",
	"activity": {
		"id": 53,
		"status": "rejected",
		"credits": 0
	}
}
```

#### 5. Faculty Activity Listing

Request:

```http
GET /api/faculty/activities?status=approved&search=workshop
Authorization: Bearer <jwt>
```

Success response (example):

```json
{
	"activities": [
		{
			"id": 12,
			"title": "ML Workshop",
			"status": "approved",
			"credits": 5
		}
	]
}
```

#### 6. Faculty Student Directory

Request:

```http
GET /api/faculty/students?search=data%20science&page=1&limit=10
Authorization: Bearer <jwt>
```

Success response (example):

```json
{
	"students": [
		{
			"id": 8,
			"name": "Student User",
			"program": "B.Tech",
			"specialization": "CSE - Data Science"
		}
	],
	"pagination": {
		"page": 1,
		"limit": 10,
		"total": 1,
		"pages": 1
	}
}
```

## Troubleshooting

Empty review queue:

- no pending submissions in your scope
- or category filters limit visibility

401 Unauthorized:

- session expired
- re-login and retry

403 Forbidden:

- account role mismatch or policy restriction
- request admin verification

429 Too Many Requests:

- auth limiter triggered
- wait and retry

503 from API:

- backend readiness or database issue
- notify admin with approximate request time

Last Updated: April 2026
