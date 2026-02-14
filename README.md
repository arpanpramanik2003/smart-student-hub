# 🎓 Smart Student Hub

A comprehensive platform for managing student academic activities, portfolios, and achievements. Built for educational institutions to track and showcase student accomplishments.

![Status](https://img.shields.io/badge/status-production--ready-green)
![Version](https://img.shields.io/badge/version-1.1.1-blue)
![License](https://img.shields.io/badge/license-MIT-orange)

---

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Test Credentials](#test-credentials)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)- [User Guides](#user-guides)- [Security](#security)

---

## 📝 Overview

Smart Student Hub is a full-stack web application that enables:
- **Students** to submit and track academic activities
- **Faculty** to review and approve student submissions
- **Admins** to manage users and generate comprehensive reports

Perfect for NAAC/AICTE compliance and student portfolio management.

---

## ✨ Features

### 👨‍🎓 Student Portal
- Submit academic activities (conferences, workshops, certifications, etc.)
- Track activity status (pending, approved, rejected)
- Build digital portfolio
- Upload certificates and documents
- View personal statistics and credits
- Update profile and avatar

### 👨‍🏫 Faculty Portal
- Review pending student activities
- Approve or reject submissions with remarks
- Filter by department and status
- View comprehensive activity dashboard
- Track department-wise statistics
- **All Students Directory** - Search, filter, and view complete student profiles
  - Advanced search by name, email, or student ID
  - Filter by department and year
  - View student activity statistics
  - Access detailed student information (read-only)
  - Professional academic-style layout with pagination

### 👑 Admin Portal
- User management (create, edit, delete, deactivate)
- Generate detailed reports (JSON/CSV)
- View system-wide analytics
- Department-wise breakdowns
- Top student rankings
- Activity type statistics

### 🎨 UI & Design
- **Dark Mode** - Complete dark theme with automatic system detection
- **Modern Gradients** - Beautiful color schemes throughout
- **Responsive Design** - Works seamlessly on all devices
- **Enhanced Components** - Admin dashboard, portfolio, and CV sections
- **Accessibility** - WCAG compliant color contrasts

---

## 🛠️ Tech Stack

### Frontend
- **React 19** with Vite
- **Tailwind CSS** for styling
- **Dark Mode** - Full theme support with system preference detection
- **Axios** for API calls
- **Vercel** deployment
- Modern ES6+ JavaScript with gradient designs

### Backend
- **Node.js** with Express
- **PostgreSQL** (Supabase) for production
- **SQLite** for local development
- **JWT** authentication
- **Cloudinary** for file storage (25GB with CDN)
- **Multer** for file uploads
- **Helmet** & **CORS** for security
- **Rate limiting** for API protection
- **Render** deployment

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/arpanpramanik2003/smart-student-hub.git
   cd smart-student-hub
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   
   # Copy environment template
   cp .env.example .env
   
   # Create admin account
   npm run create-admin
   
   # Start backend on port 5000
   npm run dev
   ```

3. **Setup Frontend** (in new terminal)
   ```bash
   cd frontend
   npm install
   
   # Copy environment template
   cp .env.example .env
   
   # Start frontend on port 5173
   npm run dev
   ```

4. **Access Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api
   - API Health: http://localhost:5000/api/health

---

## 🌐 Deployment

### Production Stack (Recommended)

```
Frontend → Vercel (Free)
Backend  → Render (Free)
Database → Supabase PostgreSQL (500MB Free)
Storage  → Cloudinary CDN (25GB Free)
```

**Total Cost: $0/month**

### Quick Deploy

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for complete step-by-step instructions including:
- Supabase PostgreSQL setup
- Cloudinary CDN configuration
- Render backend deployment
- Vercel frontend deployment
- Environment variables
- Testing & troubleshooting

---

## 🔐 Environment Variables

### Backend (.env)

```bash
# Server
PORT=5000
NODE_ENV=development

# Security
JWT_SECRET=your-secret-key-generate-new-for-production
JWT_EXPIRES_IN=24h

# Database (Development: SQLite, Production: PostgreSQL)
DB_NAME=smart_student_hub.db
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres

# Cloudinary (Production file storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://your-app.vercel.app
```

### Frontend (.env)

```bash
# API URL
VITE_API_URL=http://localhost:5000/api

# App Info
VITE_APP_NAME=Smart Student Hub
VITE_APP_VERSION=1.0.0
```

---

## 🔑 Test Credentials

These credentials are visible on the login page for testing:

### Admin
- Email: `admin@smartstudenthub.com`
- Password: `Admin@123`

### Student
- Email: `pramanikarpan089@gmail.com`
- Password: `Arpan@123`

### Faculty
- Email: `faculty@smartstudenthub.com`
- Password: `Faculty@123`

⚠️ **Note:** Remove test credentials banner from `pages/LoginPage.jsx` before final production!

---

## 📂 Project Structure

```
smart-student-hub/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── middleware/       # Auth & validation
│   │   ├── models/           # Database models
│   │   ├── routes/           # API routes
│   │   └── utils/            # Helper functions
│   ├── scripts/              # Admin creation script
│   ├── uploads/              # Local file storage
│   ├── .env                  # Environment variables
│   └── server.js             # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── admin/       # Admin components
│   │   │   ├── auth/        # Login/Register
│   │   │   ├── faculty/     # Faculty components
│   │   │   ├── shared/      # Shared components
│   │   │   └── student/     # Student components
│   │   ├── pages/           # Page components
│   │   ├── utils/           # API & constants
│   │   └── App.jsx          # Main component
│   └── .env                 # Frontend config
│
├── README.md                 # This file
└── DEPLOYMENT.md            # Deployment guide
```

---

## 📊 API Documentation

### Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-backend.onrender.com/api`

### Authentication
All protected routes require JWT token in header:
```
Authorization: Bearer <token>
```

### Key Endpoints

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/profile` - Get current user

#### Student
- `GET /students/activities` - Get student activities
- `POST /students/activities` - Submit activity
- `GET /students/activities/stats` - Get statistics
- `PUT /students/profile` - Update profile

#### Faculty
- `GET /faculty/activities/pending` - Get pending reviews
- `PUT /faculty/activities/:id` - Review activity
- `GET /faculty/stats` - Get faculty statistics

#### Admin
- `GET /admin/stats` - System statistics
- `GET /admin/users` - List all users
- `POST /admin/users` - Create user
- `GET /admin/reports` - Generate reports

---

## � User Guides

Comprehensive guides for all user roles:

### 👨‍🏫 [Faculty Guide](FACULTY_GUIDE.md)
Complete guide for faculty members including:
- Dashboard overview and navigation
- Activity review workflow
- Credit assignment guidelines
- **NEW: All Students Directory** - Search, filter, and view complete student profiles
- Best practices and tips
- Troubleshooting common issues

### 👑 [Admin Guide](ADMIN_GUIDE.md)
Administrator documentation covering:
- Secure admin setup and credentials
- User management
- Database access and backups
- Security best practices
- Environment variables
- Production deployment checklist

### 📡 [API Documentation](DATABASE_API_ARCHITECTURE.md)
Technical API reference:
- Database schema and relationships
- All API endpoints with examples
- Request/response formats
- Authentication flows
- SQL queries and optimization

### 🚀 [Deployment Guide](DEPLOYMENT.md)
Step-by-step deployment instructions:
- Supabase PostgreSQL setup
- Cloudinary CDN configuration
- Render backend deployment
- Vercel frontend deployment
- Environment configuration
- Testing and troubleshooting

---

## �🔒 Security Features

- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Password Hashing** - bcrypt with 12 rounds
- ✅ **Strong Password Policy** - 8+ chars, mixed case, numbers, special chars
- ✅ **Rate Limiting** - 5 attempts/15 min on auth routes
- ✅ **CORS Protection** - Only allow frontend domain
- ✅ **SSL/TLS** - HTTPS everywhere (Render + Vercel)
- ✅ **Database SSL** - Encrypted Supabase connection
- ✅ **Input Validation** - Joi schema validation
- ✅ **XSS Prevention** - Helmet.js security headers
- ✅ **SQL Injection** - Sequelize parameterized queries
- ✅ **File Upload Limits** - 5MB certificates, 2MB avatars

**Security Score: 8/10** 🛡️

---

## 🎯 Activity Types

- Conference Participation
- Workshop Attendance
- Certifications
- Competitions
- Internships
- Leadership Roles
- Community Service
- Club Activities
- Online Courses

---

## 📈 Roadmap

- [ ] Email notifications
- [ ] PDF report generation
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Integration with LMS
- [ ] Bulk user import
- [ ] Activity templates
- [ ] Peer reviews

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 👥 Team

Built by the Smart Student Hub Team for SIH 2025

---

## 📧 Support

For issues, questions, or suggestions:
- Create an issue on [GitHub](https://github.com/arpanpramanik2003/smart-student-hub/issues)
- Email: support@smartstudenthub.com

**Documentation:**
- 👨‍🏫 [Faculty Guide](FACULTY_GUIDE.md) - Complete faculty user manual
- 👑 [Admin Guide](ADMIN_GUIDE.md) - Administrator documentation
- 📡 [API Documentation](DATABASE_API_ARCHITECTURE.md) - Technical API reference
- 🚀 [Deployment Guide](DEPLOYMENT.md) - Production deployment steps

---

## 🙏 Acknowledgments

- Built with ❤️ for educational institutions
- Designed for NAAC/AICTE compliance
- Inspired by the need for better student portfolio management

---

**Repository:** https://github.com/arpanpramanik2003/smart-student-hub

**Happy Coding! 🚀**
