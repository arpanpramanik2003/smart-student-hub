# 02. Technical Stack Specification

> Clean visual tech-stack summary and detailed architectural dependency breakdown based on package specifications.

---

## 🎨 Visual Tech-Stack Badges

![Next.js](https://img.shields.io/badge/Next.js_15.5.14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js_v20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express_4.21.2-000000?style=for-the-badge&logo=express&logoColor=white)
![Sequelize](https://img.shields.io/badge/Sequelize_6.37.7-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite3_5.1.7-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_pg_8.19.0-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_3.4.17-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry_1.9.1-000000?style=for-the-badge&logo=opentelemetry&logoColor=white)

---

## 🛠️ Detailed Stack Breakdown

### 1. Frontend Architecture (`frontend/`)

| Technology | Package Version | Specific Purpose in Smart Student Hub |
| :--- | :--- | :--- |
| **Next.js** | `^15.5.14` | Framework providing App Router (`/app`), server-side routing, static page generation, and public verification page handling (`/verify/[verificationId]`). |
| **React** | `^18.3.1` | Core UI library for component-based dashboard rendering, modal dialogs, and interactive tables. |
| **Tailwind CSS** | `^3.4.17` | Utility-first CSS engine for dark-mode support (`dark:` classes), monospace data tables, and responsive card layouts. |
| **jsPDF** | `^4.2.1` | Client-side PDF generation engine used in `Portfolio.jsx` to render ATS-friendly academic CVs. **Dynamically imported** to optimize initial bundle size. |
| **qrcode** | `^1.5.4` | Matrix barcode generation library used to embed public verification QR codes into student CV PDFs and interactive modals. **Dynamically imported**. |
| **Framer Motion** | `^12.23.16` | Micro-animation library powering layout transitions and modal view overlays. |
| **js-cookie** | `^3.0.5` | Client-side cookie utility managing JWT session state across browser contexts. |
| **react-hot-toast** | `^2.4.1` | Lightweight alert notification component for immediate user feedback. |
| **@vercel/analytics** | `^1.6.1` | Telemetry tracker monitoring client-side page load metrics. |

---

### 2. Backend Architecture (`backend/`)

| Technology | Package Version | Specific Purpose in Smart Student Hub |
| :--- | :--- | :--- |
| **Express.js** | `^4.21.2` | Core Node.js HTTP server running on port `5000` via `server.js`, hosting all REST API endpoints. |
| **Sequelize** | `^6.37.7` | Promise-based ORM managing database models (`User`, `Activity`, `CreditPolicy`, `Notification`, `ActivityAudit`, `ActivityGrievance`, `UserImport`), database migrations, and SQL aggregate queries. |
| **SQLite3** | `^5.1.7` | Default file-backed database (`smart_student_hub.sqlite`) used for zero-config local development and testing. |
| **pg / pg-hstore** | `^8.19.0` | PostgreSQL client driver enabling seamless production deployment on PostgreSQL databases. |
| **jsonwebtoken** | `^9.0.3` | Cryptographic JWT handler generating and verifying signed authorization tokens (`Bearer <token>`). |
| **bcryptjs** | `^3.0.3` | Password hashing algorithm (10 salt rounds) securing user login credentials. |
| **OpenTelemetry SDK** | `^2.6.1` | Distributed tracing framework capturing API request latency and performance spans. |
| **Pino / Pino-HTTP** | `^10.3.1` | Structured JSON logger formatting request logs with HTTP status codes and response times. |
| **Zod** | `^4.4.3` | Schema validation library ensuring request payload type integrity. |
| **Cloudinary** | `^2.9.0` | Cloud media storage SDK supporting certificate file evidence uploads. |
