# 🏗️ Database & API Architecture Documentation

## Table of Contents
- [Overview](#overview)
- [Entity-Relationship (ER) Diagram](#entity-relationship-er-diagram)
- [Database Schema](#database-schema)
- [Entity Relationships](#entity-relationships)
- [API Architecture](#api-architecture)
- [API-Database Mapping](#api-database-mapping)

---

## Overview

The Smart Student Hub is a comprehensive student activity management system built with:
- **Backend**: Node.js + Express.js
- **Database**: SQLite (Development) / PostgreSQL (Production - Supabase)
- **ORM**: Sequelize
- **Authentication**: JWT-based token authentication

---

## Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USER ||--o{ ACTIVITY : "submits"
    USER ||--o{ ACTIVITY : "approves"
    
    USER {
        int id PK
        string name
        string email UK
        string password
        enum role "student, faculty, admin"
        string department
        int year
        string studentId UK
        boolean isActive
        string profilePicture
        string phone
        date dateOfBirth
        enum gender
        enum category
        string tenthResult
        string twelfthResult
        text address
        string languages
        string skills
        string hobbies
        text achievements
        text projects
        text certifications
        text otherDetails
        string linkedinUrl
        string githubUrl
        string portfolioUrl
        timestamp createdAt
        timestamp updatedAt
    }
    
    ACTIVITY {
        int id PK
        int studentId FK
        string title
        enum type
        text description
        date date
        string duration
        string organizer
        string filePath
        enum status "pending, approved, rejected"
        int approvedBy FK
        text remarks
        decimal credits
        timestamp createdAt
        timestamp updatedAt
    }
```

---

## Database Schema

### 1. **USER Table** (`users`)

Primary entity storing all user information (students, faculty, and admins).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| `name` | STRING | NOT NULL | User's full name |
| `email` | STRING | NOT NULL, UNIQUE | User's email (used for login) |
| `password` | STRING | NOT NULL | Hashed password (bcrypt) |
| `role` | ENUM | NOT NULL, DEFAULT: 'student' | User role: student/faculty/admin |
| `department` | STRING | NULLABLE | Department/Branch name |
| `year` | INTEGER | NULLABLE | Academic year (for students) |
| `studentId` | STRING | UNIQUE, NULLABLE | University student ID |
| `isActive` | BOOLEAN | DEFAULT: true | Account activation status |
| **Profile Information** |
| `profilePicture` | STRING | NULLABLE | Path to profile image |
| `phone` | STRING | NULLABLE | Contact number |
| `dateOfBirth` | DATE | NULLABLE | Date of birth |
| `gender` | ENUM | NULLABLE | Male/Female/Other |
| `category` | ENUM | NULLABLE | General/OBC/SC/ST |
| **Academic Details** |
| `tenthResult` | STRING | NULLABLE | 10th grade percentage/CGPA |
| `twelfthResult` | STRING | NULLABLE | 12th grade percentage/CGPA |
| `address` | TEXT | NULLABLE | Residential address |
| **Skills & Interests** |
| `languages` | STRING | NULLABLE | Known languages (comma-separated) |
| `skills` | STRING | NULLABLE | Technical/soft skills (comma-separated) |
| `hobbies` | STRING | NULLABLE | Personal hobbies (comma-separated) |
| **Achievements & Projects** |
| `achievements` | TEXT | NULLABLE | Academic/extra-curricular achievements |
| `projects` | TEXT | NULLABLE | Project details |
| `certifications` | TEXT | NULLABLE | Certification details |
| `otherDetails` | TEXT | NULLABLE | Additional information |
| **Social Links** |
| `linkedinUrl` | STRING | NULLABLE, URL | LinkedIn profile |
| `githubUrl` | STRING | NULLABLE, URL | GitHub profile |
| `portfolioUrl` | STRING | NULLABLE, URL | Personal portfolio website |
| **Timestamps** |
| `createdAt` | TIMESTAMP | AUTO | Account creation time |
| `updatedAt` | TIMESTAMP | AUTO | Last update time |

**Indexes:**
- Primary: `id`
- Unique: `email`, `studentId`

---

### 2. **ACTIVITY Table** (`activities`)

Stores extracurricular activities submitted by students.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| `studentId` | INTEGER | NOT NULL, FOREIGN KEY → users(id) | Student who submitted |
| `title` | STRING | NOT NULL | Activity title |
| `type` | ENUM | NOT NULL | Activity category |
| `description` | TEXT | NULLABLE | Detailed description |
| `date` | DATE | NOT NULL | Activity date |
| `duration` | STRING | NULLABLE | Duration (e.g., "3 days") |
| `organizer` | STRING | NULLABLE | Organizing body |
| `filePath` | STRING | NULLABLE | Certificate/proof document path |
| `status` | ENUM | DEFAULT: 'pending' | pending/approved/rejected |
| `approvedBy` | INTEGER | NULLABLE, FOREIGN KEY → users(id) | Faculty/Admin who reviewed |
| `remarks` | TEXT | NULLABLE | Review comments |
| `credits` | DECIMAL(3,1) | DEFAULT: 0 | Activity credits awarded |
| `createdAt` | TIMESTAMP | AUTO | Submission time |
| `updatedAt` | TIMESTAMP | AUTO | Last update time |

**Activity Types:**
- `conference` - Technical conferences
- `workshop` - Workshops and seminars
- `certification` - Professional certifications
- `competition` - Hackathons, contests
- `internship` - Internship experiences
- `leadership` - Leadership roles
- `community_service` - Social service activities
- `club_activity` - College club activities
- `online_course` - Online course completions

**Indexes:**
- Primary: `id`
- Foreign Keys: `studentId`, `approvedBy`

---

## Entity Relationships

### 1. **User ↔ Activity (Submission)**
- **Type**: One-to-Many (1:N)
- **Foreign Key**: `Activity.studentId` → `User.id`
- **Relationship**: One student can submit multiple activities
- **Cascade**: When user is deleted, associated activities should be handled
- **Sequelize Association**:
  ```javascript
  User.hasMany(Activity, { foreignKey: 'studentId', as: 'activities' })
  Activity.belongsTo(User, { foreignKey: 'studentId', as: 'student' })
  ```

### 2. **User ↔ Activity (Approval)**
- **Type**: One-to-Many (1:N)
- **Foreign Key**: `Activity.approvedBy` → `User.id`
- **Relationship**: One faculty/admin can approve multiple activities
- **Nullable**: Yes (pending activities have no approver yet)
- **Sequelize Association**:
  ```javascript
  Activity.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' })
  ```

### Relationship Diagram

```mermaid
graph LR
    A[Student User] -->|submits| B[Activity]
    C[Faculty/Admin User] -->|approves/rejects| B
    B -->|belongs to| A
    B -->|reviewed by| C
```

---

## API Architecture

### API Structure

```
┌─────────────────────────────────────┐
│        Frontend (React)             │
│    http://localhost:5173            │
└──────────────┬──────────────────────┘
               │ HTTP Requests (JWT Token)
               ↓
┌─────────────────────────────────────┐
│     Express.js Backend              │
│    http://localhost:5000/api        │
│                                     │
│  ┌──────────────────────────┐     │
│  │   Middleware Layer       │     │
│  │  - CORS                  │     │
│  │  - Helmet (Security)     │     │
│  │  - Rate Limiting         │     │
│  │  - JWT Authentication    │     │
│  │  - Role Authorization    │     │
│  └──────────────────────────┘     │
│               ↓                     │
│  ┌──────────────────────────┐     │
│  │   Route Layer            │     │
│  │  - /auth                 │     │
│  │  - /student              │     │
│  │  - /faculty              │     │
│  │  - /admin                │     │
│  └──────────────────────────┘     │
│               ↓                     │
│  ┌──────────────────────────┐     │
│  │  Controller Layer        │     │
│  │  (Business Logic)        │     │
│  └──────────────────────────┘     │
│               ↓                     │
│  ┌──────────────────────────┐     │
│  │   Model Layer            │     │
│  │  (Sequelize ORM)         │     │
│  └──────────────────────────┘     │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│   Database (SQLite/PostgreSQL)     │
│   - users table                    │
│   - activities table               │
└─────────────────────────────────────┘
```

---

## API Endpoints

### 🔓 Authentication APIs (`/api/auth`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | User registration |
| POST | `/login` | Public | User login |
| POST | `/admin-password-reset` | Public (with code) | Reset admin credentials |
| GET | `/profile` | 🔒 Authenticated | Get current user profile |

---

### 👨‍🎓 Student APIs (`/api/student`)

**Access**: Authenticated students and admins only

| Method | Endpoint | Description | DB Operation |
|--------|----------|-------------|--------------|
| **Profile Management** |
| GET | `/profile` | Get student profile | SELECT from `users` |
| PUT | `/profile` | Update profile | UPDATE `users` |
| POST | `/upload-avatar` | Upload profile picture | UPDATE `users.profilePicture` |
| **Activity Management** |
| POST | `/activities` | Submit new activity | INSERT into `activities` |
| GET | `/activities` | Get my activities | SELECT from `activities` WHERE `studentId` |
| PUT | `/activities/:activityId` | Update activity | UPDATE `activities` |
| DELETE | `/activities/:activityId` | Delete activity | DELETE from `activities` |
| GET | `/activities/stats` | Get activity statistics | Aggregate query on `activities` |

---

### 👨‍🏫 Faculty APIs (`/api/faculty`)

**Access**: Faculty and admin roles only

| Method | Endpoint | Description | DB Operation |
|--------|----------|-------------|--------------|
| GET | `/stats` | Get faculty dashboard stats | Aggregate queries on `activities`, `users` |
| GET | `/activities/pending` | Get pending activities | SELECT from `activities` WHERE `status='pending'` |
| GET | `/activities` | Get all activities | SELECT from `activities` JOIN `users` |
| PUT | `/activities/:activityId` | Review activity (approve/reject) | UPDATE `activities` SET `status`, `approvedBy`, `credits`, `remarks` || GET | `/students` | Get all students with filters | SELECT from `users` WHERE `role='student'` with search and pagination |

#### `/students` Query Parameters:
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20)
- `search` (string): Search by name, email, or student ID
- `department` (string): Filter by department
- `year` (number): Filter by academic year

**Response includes:**
- Student profile data (all fields including personal, academic, contact info)
- Activity statistics (total, approved, credits earned)
- Pagination metadata

**Example Request:**
```
GET /api/faculty/students?page=1&limit=20&search=john&department=Computer%20Science&year=3
```

**Example Response:**
```json
{
  "students": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "studentId": "CS2021001",
      "department": "Computer Science",
      "year": 3,
      "phone": "+1234567890",
      "profilePicture": "https://...",
      "skills": "Python, React, Node.js",
      "stats": {
        "totalActivities": 15,
        "approvedActivities": 12,
        "totalCredits": 38
      }
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "pages": 8,
    "hasMore": true
  }
}
```
---

### 🔐 Admin APIs (`/api/admin`)

**Access**: Admin role only

| Method | Endpoint | Description | DB Operation |
|--------|----------|-------------|--------------|
| GET | `/stats` | Get system-wide statistics | Aggregate queries on all tables |
| **User Management** |
| GET | `/users` | Get all users | SELECT from `users` |
| POST | `/users` | Create new user | INSERT into `users` |
| PUT | `/users/:id` | Update user | UPDATE `users` |
| DELETE | `/users/:id` | Delete user | DELETE from `users` |
| POST | `/users/:id/toggle-status` | Activate/deactivate user | UPDATE `users.isActive` |
| **Reports** |
| GET | `/reports` | Generate system reports | Complex JOIN queries |

---

## API-Database Mapping

### 1. Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth Controller
    participant DB as Database (users)
    
    C->>A: POST /api/auth/register
    A->>A: Hash password (bcrypt)
    A->>DB: INSERT INTO users
    DB-->>A: User created
    A-->>C: Success response
    
    C->>A: POST /api/auth/login
    A->>DB: SELECT * FROM users WHERE email
    DB-->>A: User data
    A->>A: Compare password
    A->>A: Generate JWT token
    A-->>C: Token + user data
    
    C->>A: GET /api/auth/profile (with token)
    A->>A: Verify JWT
    A->>DB: SELECT * FROM users WHERE id
    DB-->>A: User profile
    A-->>C: Profile data
```

### 2. Student Activity Submission Flow

```mermaid
sequenceDiagram
    participant S as Student
    participant SC as Student Controller
    participant DB as Database
    
    S->>SC: POST /api/student/activities
    SC->>SC: Verify JWT & Role
    SC->>SC: Upload certificate file
    SC->>DB: INSERT INTO activities (status='pending')
    DB-->>SC: Activity created
    SC-->>S: Success response
    
    S->>SC: GET /api/student/activities
    SC->>DB: SELECT * FROM activities WHERE studentId = ?
    DB-->>SC: Activity list
    SC-->>S: Activities with status
```

### 3. Faculty Review Flow

```mermaid
sequenceDiagram
    participant F as Faculty
    participant FC as Faculty Controller
    participant DB as Database
    
    F->>FC: GET /api/faculty/activities/pending
    FC->>FC: Verify JWT & Role
    FC->>DB: SELECT * FROM activities WHERE status='pending' JOIN users
    DB-->>FC: Pending activities with student details
    FC-->>F: Activity list
    
    F->>FC: PUT /api/faculty/activities/:id (approve/reject)
    FC->>FC: Verify JWT & Role
    FC->>DB: UPDATE activities SET status, approvedBy, credits, remarks
    DB-->>FC: Activity updated
    FC-->>F: Success response
```

### 4. Admin User Management Flow

```mermaid
sequenceDiagram
    participant A as Admin
    participant AC as Admin Controller
    participant DB as Database
    
    A->>AC: GET /api/admin/users
    AC->>AC: Verify JWT & Admin Role
    AC->>DB: SELECT * FROM users ORDER BY role, name
    DB-->>AC: All users
    AC-->>A: User list
    
    A->>AC: POST /api/admin/users
    AC->>AC: Validate input
    AC->>DB: INSERT INTO users
    DB-->>AC: User created
    AC-->>A: Success response
    
    A->>AC: POST /api/admin/users/:id/toggle-status
    AC->>DB: UPDATE users SET isActive = !isActive
    DB-->>AC: User updated
    AC-->>A: New status
```

---

## Database Query Patterns

### Common Query Operations

#### 1. **Student Profile with Activities**
```sql
SELECT u.*, 
       COUNT(a.id) as totalActivities,
       SUM(CASE WHEN a.status = 'approved' THEN 1 ELSE 0 END) as approvedCount,
       SUM(a.credits) as totalCredits
FROM users u
LEFT JOIN activities a ON u.id = a.studentId
WHERE u.id = ?
GROUP BY u.id;
```

#### 2. **Pending Activities for Faculty Review**
```sql
SELECT a.*, 
       u.name as studentName,
       u.email as studentEmail,
       u.department as studentDepartment,
       u.year as studentYear
FROM activities a
INNER JOIN users u ON a.studentId = u.id
WHERE a.status = 'pending'
ORDER BY a.createdAt DESC;
```

#### 3. **Activity Statistics by Type**
```sql
SELECT type,
       COUNT(*) as count,
       COUNT(CASE WHEN status = 'approved' THEN 1 END) as approvedCount,
       COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingCount,
       COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejectedCount,
       AVG(credits) as avgCredits
FROM activities
GROUP BY type;
```

#### 4. **Top Students by Credits**
```sql
SELECT u.name,
       u.email,
       u.department,
       u.year,
       COUNT(a.id) as activityCount,
       SUM(a.credits) as totalCredits
FROM users u
INNER JOIN activities a ON u.id = a.studentId
WHERE u.role = 'student' AND a.status = 'approved'
GROUP BY u.id
ORDER BY totalCredits DESC
LIMIT 10;
```

#### 5. **Admin Dashboard Statistics**
```sql
SELECT 
  (SELECT COUNT(*) FROM users WHERE role = 'student') as studentCount,
  (SELECT COUNT(*) FROM users WHERE role = 'faculty') as facultyCount,
  (SELECT COUNT(*) FROM activities WHERE status = 'pending') as pendingActivities,
  (SELECT COUNT(*) FROM activities WHERE status = 'approved') as approvedActivities,
  (SELECT SUM(credits) FROM activities WHERE status = 'approved') as totalCredits;
```

---

## Security & Authorization Matrix

| Endpoint | Student | Faculty | Admin |
|----------|---------|---------|-------|
| **Auth** |
| POST /auth/register | ✅ | ✅ | ✅ |
| POST /auth/login | ✅ | ✅ | ✅ |
| GET /auth/profile | ✅ | ✅ | ✅ |
| **Student** |
| GET /student/profile | ✅ (own) | ❌ | ✅ (all) |
| PUT /student/profile | ✅ (own) | ❌ | ✅ (all) |
| POST /student/activities | ✅ | ❌ | ✅ |
| GET /student/activities | ✅ (own) | ❌ | ✅ (all) |
| PUT /student/activities/:id | ✅ (own) | ❌ | ✅ (all) |
| DELETE /student/activities/:id | ✅ (own) | ❌ | ✅ (all) |
| **Faculty** |
| GET /faculty/activities/pending | ❌ | ✅ | ✅ |
| PUT /faculty/activities/:id | ❌ | ✅ | ✅ |
| GET /faculty/stats | ❌ | ✅ | ✅ |
| **Admin** |
| GET /admin/users | ❌ | ❌ | ✅ |
| POST /admin/users | ❌ | ❌ | ✅ |
| PUT /admin/users/:id | ❌ | ❌ | ✅ |
| DELETE /admin/users/:id | ❌ | ❌ | ✅ |
| GET /admin/stats | ❌ | ❌ | ✅ |

---

## Data Flow Architecture

### Complete Request-Response Cycle

```mermaid
flowchart TD
    A[Client Request] --> B{CORS Check}
    B -->|Pass| C[Rate Limiter]
    B -->|Fail| Z[403 Forbidden]
    C -->|Pass| D[Security Headers - Helmet]
    C -->|Fail| Y[429 Too Many Requests]
    D --> E{JWT Token Present?}
    E -->|No| F{Public Route?}
    E -->|Yes| G[Verify JWT]
    F -->|Yes| H[Process Request]
    F -->|No| Z
    G -->|Valid| I{Check Role Authorization}
    G -->|Invalid| X[401 Unauthorized]
    I -->|Authorized| H
    I -->|Unauthorized| W[403 Forbidden]
    H --> J[Execute Controller Logic]
    J --> K[Database Query via Sequelize]
    K --> L[Process Results]
    L --> M[Send JSON Response]
    M --> N[Client Receives Response]
```

---

## File Upload Flow

### Activity Certificate Upload

```mermaid
sequenceDiagram
    participant C as Client
    participant M as Multer Middleware
    participant S as Server
    participant FS as File System
    participant DB as Database
    
    C->>M: POST /student/activities (with file)
    M->>M: Validate file type & size
    M->>FS: Save to uploads/certificates/
    FS-->>M: File path
    M->>S: Pass file path in req.file
    S->>DB: INSERT INTO activities (filePath)
    DB-->>S: Activity created
    S-->>C: Success response with file URL
```

**Upload Directories:**
- `uploads/profiles/` - User profile pictures
- `uploads/avatars/` - User avatars
- `uploads/certificates/` - Activity certificates/proofs

---

## Environment Configuration

### Required Environment Variables

```env
# Database
NODE_ENV=development|production
DATABASE_URL=postgresql://user:password@host:5432/dbname  # Production only
DB_NAME=smart_student_hub.db  # SQLite for development

# JWT Authentication
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d

# Server
PORT=5000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Admin Reset
ADMIN_RESET_CODE=your_secure_reset_code
```

---

## Database Migration Strategy

### Initial Setup (Development)
```bash
# Tables are auto-created using Sequelize sync
npm run dev
```

### Adding New Columns
The system includes auto-migration capability that adds missing columns on startup:

```javascript
// In database.js
const migrateDatabase = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const tableDescription = await queryInterface.describeTable('users');
  
  // Check and add missing columns
  if (!tableDescription['newColumn']) {
    await queryInterface.addColumn('users', 'newColumn', {
      type: 'VARCHAR(255)',
      allowNull: true
    });
  }
};
```

---

## Performance Considerations

### Database Indexing
- **Primary Keys**: Automatic indexing on `id` columns
- **Unique Constraints**: Indexed on `email`, `studentId`
- **Foreign Keys**: Consider adding indexes on `studentId`, `approvedBy` for faster JOINs

### Query Optimization
1. Use `SELECT` specific columns instead of `SELECT *`
2. Implement pagination for large result sets
3. Use `LIMIT` and `OFFSET` for activity lists
4. Cache frequently accessed statistics

### Connection Pooling
```javascript
pool: {
  max: 5,        // Maximum connections
  min: 0,        // Minimum connections
  acquire: 30000, // Maximum time to acquire connection
  idle: 10000    // Maximum idle time before releasing
}
```

---

## Error Handling

### Database Error Types

| Error | HTTP Status | Description |
|-------|-------------|-------------|
| `SequelizeUniqueConstraintError` | 409 | Duplicate email/studentId |
| `SequelizeForeignKeyConstraintError` | 400 | Invalid foreign key reference |
| `SequelizeValidationError` | 400 | Validation failed |
| `SequelizeConnectionError` | 503 | Database connection failed |
| `SequelizeDatabaseError` | 500 | General database error |

---

## Testing Recommendations

### Database Testing
1. **Unit Tests**: Test model validations and hooks
2. **Integration Tests**: Test associations and queries
3. **Seed Data**: Create test datasets for development

### API Testing
1. **Authentication Tests**: Verify JWT flow
2. **Authorization Tests**: Verify role-based access
3. **CRUD Tests**: Test all endpoint operations
4. **Edge Cases**: Test with invalid/missing data

---

## Future Enhancements

### Potential Database Extensions

1. **Notifications Table**
   - Store activity approval/rejection notifications
   - Email notification queue

2. **Leaderboard Table**
   - Cache student rankings by credits
   - Department-wise rankings

3. **Comments Table**
   - Allow faculty to comment on activities
   - Student-faculty communication

4. **Audit Log Table**
   - Track all database changes
   - User activity history

5. **Batch/Semester Table**
   - Group students by batch
   - Semester-wise activity tracking

---

## Conclusion

This documentation provides a complete overview of the database architecture and API structure for the Smart Student Hub. The system follows a clean architecture with proper separation of concerns, role-based access control, and scalable database design.

For deployment details, refer to [DEPLOYMENT.md](./DEPLOYMENT.md)  
For admin operations, refer to [ADMIN_GUIDE.md](./ADMIN_GUIDE.md)

---

**Last Updated**: February 13, 2026  
**Version**: 1.0  
**Maintained By**: Smart Student Hub Development Team
