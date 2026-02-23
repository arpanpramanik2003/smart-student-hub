# 👨‍🎓 Student Guide

## 📋 Table of Contents
- [Getting Started](#getting-started)
- [Registration](#registration)
- [Dashboard Overview](#dashboard-overview)
- [Activity Management](#activity-management)
- [Portfolio](#portfolio)
- [Profile Management](#profile-management)
- [Browse Students](#browse-students)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### Logging In
1. Navigate to the Smart Student Hub login page
2. Select **Student** login option
3. Enter your credentials (email and password)
4. Click **Login**

### First Time Setup
After your first login:
1. **Complete Profile**: Add your phone number, date of birth, academic details, and profile picture
2. **Explore Dashboard**: Familiarize yourself with the activity submission flow
3. **Submit First Activity**: Start building your portfolio by submitting an extracurricular activity

---

## 📝 Registration

### Smart Cascading Program Selection

Registration uses a hierarchical selection system for accurate program mapping:

1. **Select Program Category** (e.g., "Engineering & Technology")
2. **Select Program/Degree** (e.g., "B.Tech - Bachelor of Technology (4 years)")
3. **Select Specialization** (if applicable, e.g., "Artificial Intelligence & Machine Learning")
4. **Enter Academic Year** (1st, 2nd, 3rd, or 4th Year)
5. **Enter Student ID** (unique identifier provided by your institution)
6. **Enter Department** (e.g., "Computer Science")
7. Fill in name, email, and password

### Supported Program Categories

| # | Category | Example Programs |
|---|----------|-----------------|
| 1 | Engineering & Technology | B.Tech, M.Tech |
| 2 | Computer Applications | BCA, MCA |
| 3 | Science | B.Sc (Hons.), M.Sc |
| 4 | Agriculture & Fisheries | B.Sc Agriculture, B.F.Sc |
| 5 | Health Sciences & Pharmacy | B.Pharm, M.Pharm, BPT, BMLT |
| 6 | Nursing | B.Sc Nursing, GNM |
| 7 | Maritime Studies | B.Sc Nautical Science, DNS |
| 8 | Management, Commerce & Law | BBA, MBA, B.Com, LL.B |
| 9 | Hospitality & Culinary Arts | B.Sc HHA, B.Sc Culinary Arts |
| 10 | PhD Programs | Ph.D. (All disciplines) |

### UI Behavior
- Dropdowns appear **conditionally** — only when relevant to your selection
- Dependent fields **auto-reset** when you change a parent selection
- Program duration is shown for context
- Specialization is **optional** for some programs

### Field Validation
All fields are validated on both client and server side:
- **Student ID**: Must be unique across the system
- **Email**: Must be a valid email format
- **Password**: Minimum 8 characters, mixed case, numbers, and special characters required
- **Program Category**: Required for all student registrations

---

## 📊 Dashboard Overview

The Student Dashboard provides a personal at-a-glance summary:

### Statistics Cards
- **Total Activities**: All submissions you've made
- **Approved Activities**: Successfully approved submissions
- **Rejected Activities**: Submissions that were declined (with feedback)
- **Total Credits Earned**: Cumulative credits from approved activities

### Quick Actions
- Jump directly to Submit Activity
- View all your activities
- Access your portfolio

### Recent Activities
Timeline of your last 5 submissions showing:
- Activity title and type
- Submission date
- Current status (Pending / Approved / Rejected)

---

## 🎯 Activity Management

### Submitting an Activity

1. Click **"Submit Activity"** from Dashboard or navigation
2. Fill in the activity form:
   - **Activity Type** — Select from 9 types (see below)
   - **Title** — Descriptive name of the activity
   - **Description** — Details about your participation
   - **Date of Activity** — When it took place
   - **Requested Credits** — How many credits you're requesting (0–10)
   - **Certificate/Proof** — Upload PDF or image (max 5MB)
3. Click **Submit**

### Supported Activity Types
1. Conference Participation
2. Workshop Attendance
3. Certifications
4. Competitions
5. Internships
6. Leadership Roles
7. Community Service
8. Club Activities
9. Online Courses

### Credit Guidelines

| Activity Type | Typical Credits | Notes |
|--------------|----------------|-------|
| International Conference | 8–10 | Paper presentation/publication |
| National Conference | 5–8 | Paper presentation |
| Workshop (Week-long) | 4–6 | Active participation |
| Short Workshop (1–3 days) | 2–4 | Participation |
| Certification | 3–5 | Industry-recognized certs |
| Competition (Won) | 5–7 | Prize winners |
| Competition (Participated) | 2–3 | Participation only |
| Internship | 6–8 | Duration-based |
| Leadership Role | 4–6 | Club activities, organizing |
| Community Service | 3–5 | Documented hours |

### Editing & Deleting Activities
- **Edit**: You can modify a submission while it's in **Pending** status
- **Delete**: You can delete **Pending** activities before they are reviewed
- Once **Approved** or **Rejected**, activities cannot be modified

### Tracking Status
Activities move through these statuses:
- `Pending` → Faculty is reviewing
- `Approved` → Accepted with credits assigned
- `Rejected` → Declined with mandatory feedback from faculty

---

## 🖼️ Portfolio

Your digital portfolio auto-generates from your approved activities.

### Features
- **Approved Activities Only** — Only approved submissions appear in the portfolio
- **Credit Summary** — Total credits earned prominently displayed
- **Activity Showcase** — Each activity shown with type, credits, and certificate link
- **Professional Layout** — Academic-style portfolio suitable for NAAC/AICTE

### Accessing Your Portfolio
1. Click **"Portfolio"** in the navigation bar
2. Browse your approved activities by category
3. Download or share your portfolio (shareable link coming soon)

---

## 👤 Profile Management

Keep your profile up to date for accurate student information and better faculty advising.

### Basic Information
- Full name and email
- Phone number
- Date of birth
- Gender and category
- Profile picture (uploaded to Cloudinary CDN, max 2MB)

### Academic Information
- Program category, program, and specialization
- Academic year and department
- 10th standard results
- 12th standard / Diploma results

### Professional Details
- **Technical Skills** — List your skills with tags
- **Languages Known** — Language proficiencies
- **Hobbies & Interests**
- **Notable Achievements**
- **Projects Completed**
- **Certifications Earned**

### Online Presence
- LinkedIn profile URL
- GitHub profile URL
- Personal portfolio website URL

### How to Update Profile
1. Click your avatar or **"Profile"** from the navigation
2. Edit any field
3. Click **"Save Changes"**
4. Profile picture: click the avatar to upload a new image

---

## 🔍 Browse Students

Students can browse other registered students in the system.

### Search Options
- Search by **Name**, **Email**, or **Student ID**
- Real-time results as you type
- Case-insensitive matching

### Filters Available
- **Program Category** — Filter by category (e.g., Engineering & Technology)
- **Program** — Filter by specific degree (e.g., B.Tech)
- **Academic Year** — Filter by year (1st–4th)
- **Reset Button** — Clear all active filters

### Student Card View
Each card shows:
- Profile picture (or placeholder)
- Full name and program
- Specialization (highlighted in blue)
- Academic year and Student ID
- Social profile links (LinkedIn, GitHub, Portfolio)

### Detailed Student Profile (Modal)
Click **"View Profile"** on any card to see:
- Complete program details (category → program → specialization)
- Academic records (10th, 12th results)
- Activity statistics (total, approved, credits)
- Skills, languages, and hobbies
- Achievements and projects
- Contact information

> ⚠️ **Privacy**: View information for academic collaboration purposes only. Do not share student data externally.

---

## 📡 API Endpoints

All student API routes require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new student account |
| `POST` | `/api/auth/login` | Login and receive JWT token |
| `GET` | `/api/auth/profile` | Get current authenticated user |

### Activities
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/students/activities` | Get all your activities |
| `POST` | `/api/students/activities` | Submit a new activity |
| `PUT` | `/api/students/activities/:id` | Edit a pending activity |
| `DELETE` | `/api/students/activities/:id` | Delete a pending activity |
| `GET` | `/api/students/activities/stats` | Get your activity statistics |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| `PUT` | `/api/students/profile` | Update your profile |
| `POST` | `/api/students/profile/avatar` | Upload profile picture |

### Browse Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/students` | Browse all students |

**Query Parameters for Browse:**
```
GET /api/students?search=john&programCategory=ENGINEERING_TECHNOLOGY&program=B.Tech&year=2&page=1&limit=20
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search by name, email, student ID, program, or specialization |
| `programCategory` | string | Filter by program category key (e.g., `ENGINEERING_TECHNOLOGY`) |
| `program` | string | Filter by program name |
| `specialization` | string | Filter by specialization |
| `department` | string | Legacy department filter |
| `year` | number | Filter by academic year (1–4) |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20) |

### Submit Activity — Request Body
```json
POST /api/students/activities
Content-Type: multipart/form-data

{
  "activityType": "workshop",
  "title": "National AI Workshop 2026",
  "description": "Attended a 3-day workshop on AI and Machine Learning",
  "activityDate": "2026-01-15",
  "requestedCredits": 4,
  "certificate": <file>
}
```

### Activity Response Format
```json
{
  "id": 1,
  "studentId": 5,
  "activityType": "workshop",
  "title": "National AI Workshop 2026",
  "description": "Attended a 3-day workshop on AI and Machine Learning",
  "activityDate": "2026-01-15",
  "requestedCredits": 4,
  "approvedCredits": null,
  "status": "pending",
  "certificateUrl": "https://res.cloudinary.com/.../certificate.pdf",
  "remarks": null,
  "createdAt": "2026-02-01T10:00:00.000Z",
  "updatedAt": "2026-02-01T10:00:00.000Z"
}
```

---

## 🔧 Troubleshooting

### Can't Log In
**Solutions:**
- Verify you selected the **Student** login option
- Check your email and password are correct
- Try resetting your password
- Contact admin if account may be deactivated

### Certificate Upload Fails
**Solutions:**
- Ensure file is **PDF or image** (JPG, PNG, WEBP)
- Maximum file size: **5MB** for certificates, **2MB** for profile pictures
- Compress large PDF files before uploading
- Try a different browser if the issue persists

### Activity Not Showing in Portfolio
**Explanation:**
Portfolio only shows **Approved** activities. Pending and rejected submissions do not appear.

### Profile Picture Not Loading
**Solutions:**
- Images are served from Cloudinary CDN
- Check your internet connection
- Refresh the page or clear browser cache
- Re-upload the profile picture if it appears broken

### Search/Filter Not Working
**Solutions:**
- Verify the search term is spelled correctly
- Try a different search field (name vs. email vs. student ID)
- Clear all active filters using the **Reset** button
- Refresh the page and try again

### Activity Shows "Rejected" — What Next?
1. Click **"View Details"** on the rejected activity
2. Read the faculty feedback in the **Remarks** section
3. Improve the submission (or resubmit a new activity)
4. Contact your faculty advisor if the reason is unclear

### Getting Help
- **Technical Support**: support@smartstudenthub.com
- **GitHub Issues**: [Submit Issue](https://github.com/arpanpramanik2003/smart-student-hub/issues)
- **Admin Contact**: Reach out to your institution's system administrator

---

## 📱 Mobile Usage

The application is fully responsive and works on all devices:
- Compatible with Chrome, Safari, Firefox (mobile and desktop)
- **Tips for mobile**: Use landscape mode for better table viewing; pinch to zoom on detailed views

---

## 🔒 Security & Privacy

### Your Responsibilities
- Keep your login credentials secure
- Log out after using shared/public devices
- Do not share your account with others
- Report any suspicious activity to admin

### System Security
- All data is encrypted in transit (HTTPS) and at rest
- JWT token expires after 24 hours
- Session is invalidated on logout
- Password is stored as a bcrypt hash (never in plain text)

---

**Version:** 1.1.1  
**Last Updated:** February 2026  
**Status:** ✅ Production Ready

*Smart Student Hub — Empowering Education Through Technology* 🎓
