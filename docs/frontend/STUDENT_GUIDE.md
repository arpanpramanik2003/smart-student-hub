# Student Guide

## Table of Contents
- Overview
- First Login and Setup
- Registration Walkthrough
- Dashboard Walkthrough
- Activity Submission Guide
- Managing Submitted Activities
- Certificate Viewing and Download
- Profile and CV Details
- Portfolio Usage
- Browse Students Module
- Security and Privacy Notes
- API Reference (Student)
- Troubleshooting

## Overview

Smart Student Hub provides students with a complete academic activity lifecycle:

- submit activities and supporting documents
- track review status
- collect approved credits
- maintain profile and CV data
- present achievements through a portfolio view

Frontend is built in Next.js and all data actions are handled by the Express backend API.

## First Login and Setup

After login, do these steps once:

1. open Profile and complete core details (phone, DOB, academic details)
2. upload a profile avatar (optional but recommended)
3. verify program category, program, specialization, year, and student ID
4. submit one sample activity to verify your file upload and workflow

This prevents review delays caused by incomplete student metadata.

### Screenshot Placeholders

- `docs/assets/student/01-login-page.png` (Login form)
- `docs/assets/student/02-dashboard-overview.png` (Student dashboard cards)
- `docs/assets/student/03-profile-edit.png` (Profile and CV form)

## Registration Walkthrough

Registration requires identity and academic context so activities can be routed correctly.

Required data generally includes:

- full name
- email
- password
- student ID
- department/program information
- academic year

Program path is hierarchical:

1. Program Category
2. Program/Degree
3. Specialization (if available)

Validation behavior:

- email must be unique
- student ID must be unique
- weak passwords are rejected by backend policy

## Dashboard Walkthrough

The student dashboard summarizes your progress and review pipeline:

- total activities submitted
- pending review count
- approved count
- rejected count
- total approved credits

Use this page to quickly detect stale pending items or frequent rejection patterns.

## Activity Submission Guide

Open Submit Activity and complete:

- title
- type
- date
- duration (optional)
- organizer (optional)
- description (optional)
- requested credits
- certificate/proof file (optional)

Tips for higher approval rate:

- keep title specific and verifiable
- match activity type accurately
- include organizer and duration when available
- upload clear proof files with readable text

Common activity states:

- pending: waiting for faculty review
- approved: accepted and credits awarded
- rejected: declined with optional faculty remarks

### Screenshot Placeholders

- `docs/assets/student/04-submit-activity-form.png` (Submission form)
- `docs/assets/student/05-my-activities-list.png` (Activities table/cards)
- `docs/assets/student/06-activity-status-details.png` (Remarks and status)

## Managing Submitted Activities

My Activities page supports:

- filtering by status
- keyword search
- viewing faculty remarks
- edit/delete for pending items only

Editable while pending:

- metadata fields
- attachment replacement

Not editable after review:

- approved or rejected records become locked to preserve auditability

## Certificate Viewing and Download

For activities with attachment:

- View opens file in browser-compatible path
- Download retrieves original proof file

Backend endpoints used:

- GET /api/files/view?url=...
- GET /api/files/download?url=...

These routes support both local storage fallback and Cloudinary-backed files.

## Profile and CV Details

Student profile stores both basic and portfolio-oriented data:

- personal: phone, DOB, gender, category, address
- academic: department/program/specialization/year
- results: 10th/12th
- skills and languages
- projects, achievements, certifications
- social links (LinkedIn, GitHub, portfolio)

Keeping these fields complete improves portfolio quality and report usefulness.

## Portfolio Usage

Portfolio view composes:

- profile summary
- approved activities
- credit highlights
- CV-oriented metadata

Recommended use cases:

- scholarship submissions
- placement pre-screening
- institutional documentation

### Screenshot Placeholders

- `docs/assets/student/07-portfolio-overview.png` (Portfolio summary)
- `docs/assets/student/08-portfolio-achievements.png` (Approved activities)

## Browse Students Module

Students can browse peers by search and filters (program/year/etc.) depending on configured visibility rules.

Use this module for:

- inspiration from peer activity patterns
- discovering achievement formats and standards

### Screenshot Placeholders

- `docs/assets/student/09-browse-students-grid.png` (Students list)
- `docs/assets/student/10-student-profile-modal.png` (Detailed profile modal)

## Security and Privacy Notes

- all protected student requests require valid JWT
- auth routes are rate-limited to reduce brute-force risk
- CORS and security headers are enforced by backend
- do not share token values or account credentials

## API Reference (Student)

Authentication:

- POST /api/auth/login
- GET /api/auth/profile

Student profile:

- GET /api/students/profile
- PUT /api/students/profile
- POST /api/students/upload-avatar

Activities:

- GET /api/students/activities
- POST /api/students/activities
- PUT /api/students/activities/:activityId
- DELETE /api/students/activities/:activityId
- GET /api/students/activities/stats

Student discovery:

- GET /api/students/browse

Files:

- GET /api/files/view?url=...
- GET /api/files/download?url=...

### Endpoint Examples

#### 1. Login

Request:

```http
POST /api/auth/login
Content-Type: application/json

{
	"email": "student@gmail.com",
	"password": "Student@123."
}
```

Success response (example):

```json
{
	"message": "Login successful",
	"token": "<jwt>",
	"user": {
		"id": 2,
		"name": "Student User",
		"role": "student",
		"email": "student@gmail.com"
	}
}
```

#### 2. Fetch Profile

Request:

```http
GET /api/students/profile
Authorization: Bearer <jwt>
```

Success response (example):

```json
{
	"profile": {
		"id": 2,
		"name": "Student User",
		"email": "student@gmail.com",
		"program": "B.Tech",
		"specialization": "CSE - Data Science",
		"year": 3
	}
}
```

#### 3. Submit Activity

Request (multipart/form-data):

```http
POST /api/students/activities
Authorization: Bearer <jwt>
Content-Type: multipart/form-data

title=Smart Hackathon 2026
type=competition
date=2026-03-21
duration=2 days
organizer=Tech Council
description=National level hackathon participation
credits=4
certificate=<file>
```

Success response (example):

```json
{
	"message": "Activity submitted successfully",
	"activity": {
		"id": 41,
		"title": "Smart Hackathon 2026",
		"status": "pending",
		"credits": 4
	}
}
```

#### 4. List Activities

Request:

```http
GET /api/students/activities?status=pending&page=1&limit=10
Authorization: Bearer <jwt>
```

Success response (example):

```json
{
	"activities": [
		{
			"id": 41,
			"title": "Smart Hackathon 2026",
			"status": "pending",
			"type": "competition"
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

#### 5. Update Pending Activity

Request:

```http
PUT /api/students/activities/41
Authorization: Bearer <jwt>
Content-Type: multipart/form-data

description=Updated description with final event details
credits=5
```

Success response (example):

```json
{
	"message": "Activity updated successfully",
	"activity": {
		"id": 41,
		"status": "pending",
		"credits": 5
	}
}
```

#### 6. Delete Pending Activity

Request:

```http
DELETE /api/students/activities/41
Authorization: Bearer <jwt>
```

Success response (example):

```json
{
	"message": "Activity deleted successfully"
}
```

#### 7. Stats

Request:

```http
GET /api/students/activities/stats
Authorization: Bearer <jwt>
```

Success response (example):

```json
{
	"totalActivities": 12,
	"byStatus": {
		"approved": 8,
		"pending": 2,
		"rejected": 2
	},
	"totalCredits": 31
}
```

#### 8. Browse Students

Request:

```http
GET /api/students/browse?search=arpan&page=1&limit=12
Authorization: Bearer <jwt>
```

Success response (example):

```json
{
	"students": [
		{
			"id": 1,
			"name": "Arpan Pramanik",
			"program": "B.Tech",
			"year": 4
		}
	],
	"pagination": {
		"page": 1,
		"limit": 12,
		"total": 1,
		"pages": 1
	}
}
```

## Troubleshooting

401 Unauthorized:

- token missing or expired
- log out and log in again

403 Forbidden:

- account role mismatch or origin policy issue
- confirm you are using official frontend URL

429 Too Many Requests:

- auth rate limiter triggered
- wait and retry after a short cooldown

503 not-ready:

- backend cannot access database
- contact admin with timestamp and action performed

File upload failure:

- verify file type and size
- retry with a smaller or cleaner copy

Last Updated: April 2026
