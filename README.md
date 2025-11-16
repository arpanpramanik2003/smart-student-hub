# 🎓 Smart Student Hub

A comprehensive platform for managing student academic activities, portfolios, and achievements. Built for educational institutions to track and showcase student accomplishments.

![Status](https://img.shields.io/badge/status-production--ready-green)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-orange)

---

## 📋 Overview

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

### 👑 Admin Portal
- User management (create, edit, delete, deactivate)
- Generate detailed reports (JSON/CSV)
- View system-wide analytics
- Department-wise breakdowns
- Top student rankings
- Activity type statistics

---

## 🛠️ Tech Stack

### Frontend
- **React 19** with Vite
- **Tailwind CSS** for styling
- **Axios** for API calls
- Modern ES6+ JavaScript

### Backend
- **Node.js** with Express
- **SQLite** database (via Sequelize ORM)
- **JWT** authentication
- **Multer** for file uploads
- **Helmet** & **CORS** for security
- **Rate limiting** for API protection

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/smart-student-hub.git
   cd smart-student-hub
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   npm run create-admin  # Create admin account
   npm run dev          # Start backend on port 5000
   ```

3. **Setup Frontend** (in new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev          # Start frontend on port 5173
   ```

4. **Access Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api
   - API Health: http://localhost:5000/api/health

---

## 🌐 Deployment

### Quick Deploy Guide

1. **Deploy Backend** (Railway/Render/DigitalOcean)
   - Push to GitHub
   - Connect repository
   - Set environment variables
   - Deploy!

2. **Deploy Frontend** (Vercel/Netlify)
   - Push to GitHub
   - Connect repository
   - Update `VITE_API_URL` with backend URL
   - Deploy!

**Detailed Instructions:** See [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 🔐 Test Credentials

These credentials are currently visible on the login page for testing:

### Admin
- Email: `admin@smartstudenthub.com`
- Password: `Admin@123`

### Student
- Email: `pramanikarpan089@gmail.com`
- Password: `Arpan@123`

### Faculty
- Email: `faculty@smartstudenthub.com`
- Password: `Faculty@123`

⚠️ **Note:** Remove test credentials banner from `LoginPage.jsx` before final production!

---

## 📂 Project Structure

```
smart-student-hub/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth & validation
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   └── utils/          # Helper functions
│   ├── scripts/            # Admin creation script
│   ├── uploads/            # File storage
│   ├── .env                # Environment variables
│   └── server.js           # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── admin/     # Admin components
│   │   │   ├── auth/      # Login/Register
│   │   │   ├── faculty/   # Faculty components
│   │   │   ├── shared/    # Shared components
│   │   │   └── student/   # Student components
│   │   ├── pages/         # Page components
│   │   ├── utils/         # API & constants
│   │   └── App.jsx        # Main component
│   └── .env               # Frontend config
│
├── DEPLOYMENT.md          # Deployment guide
├── DEPLOYMENT_CHECKLIST.md # Pre-deployment checklist
├── QUICK_REFERENCE.md     # Quick reference card
└── SECURITY_AUDIT.md      # Security documentation
```

---

## 🔒 Security Features

- ✅ JWT authentication with secure tokens
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ Strong password policy (8+ chars, mixed case, numbers, special chars)
- ✅ Rate limiting on auth routes (5 attempts/15 min)
- ✅ CORS protection
- ✅ Helmet.js security headers
- ✅ Input validation with Joi
- ✅ XSS prevention
- ✅ Secure file upload validation

**Full Audit:** See [SECURITY_AUDIT.md](backend/SECURITY_AUDIT.md)

---

## 📊 API Documentation

### Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-backend.railway.app/api`

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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

Built by the Smart Student Hub Team for SIH 2025

---

## 📧 Support

For issues, questions, or suggestions:
- Create an issue on GitHub
- Email: support@smartstudenthub.com
- Documentation: [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 🙏 Acknowledgments

- Built with ❤️ for educational institutions
- Designed for NAAC/AICTE compliance
- Inspired by the need for better student portfolio management

---

**Happy Coding! 🚀**
