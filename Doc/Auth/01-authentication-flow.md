# Auth 01. Authentication Flow & Security Architecture

The **CampusSphere Authentication Architecture** manages identity verification, JWT token issuance, session maintenance, and account credential security across all system roles.

---

## 🔄 Sequence Diagram: Login & Token Generation Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant Frontend as Next.js Client
    participant API as Auth API /api/auth/login
    participant DB as Database (users table)
    participant Crypto as bcryptjs / jsonwebtoken

    User->>Frontend: Enter Email & Password
    Frontend->>API: POST /api/auth/login (email, password)
    API->>DB: Query User by email
    
    alt User Not Found
        DB-->>API: null
        API-->>Frontend: 401 Unauthorized ("Invalid email or password")
    else User Found
        DB-->>API: User Record (hashed password, mustChangePassword)
        API->>Crypto: Compare password with hashed password via bcryptjs.compare()
        
        alt Password Mismatch
            Crypto-->>API: false
            API-->>Frontend: 401 Unauthorized ("Invalid email or password")
        else Password Matched
            Crypto-->>API: true
            API->>Crypto: Sign JWT Token (id, email, role, expiresIn: 7d)
            Crypto-->>API: Signed JWT Token String
            
            API-->>Frontend: 200 OK (token, user profile, mustChangePassword)
            Frontend->>Frontend: Store Token in Cookies / LocalStorage
            
            alt mustChangePassword === true
                Frontend->>User: Redirect to Forced Password Reset Modal
            else Normal Access
                Frontend->>User: Redirect to Role Dashboard (/student, /faculty, /admin)
            end
        end
    end
```

---

## 🔒 Security Safeguards & Credential Management

### 1. JWT Token Specification & Secret Handling
- **Algorithm**: HMAC SHA-256 token signatures generated via `jsonwebtoken`.
- **Payload Claims**: Contains user primary key (`id`), lowercase `email`, system `role`, and token expiration (`exp`).
- **Secret Isolation**: Signed using `JWT_SECRET` stored in environment variables (`.env.local`). Fallback defaults are strictly restricted in production environments.
- **Request Authorization**: Protected endpoints require the header `Authorization: Bearer <token>`.

### 2. Password Encryption Standard
- User passwords are encrypted using `bcryptjs` with **10 salt rounds** before insertion into the `users` table.
- Plaintext passwords are never logged, cached, or returned in API responses.

### 3. Forced First-Login Password Change (`mustChangePassword`)
- Bulk-imported or admin-created accounts receive a temporary password (`Hub#2026@Temp`) and `mustChangePassword = true`.
- Upon successful login, the frontend intercepts the session and prompts the user to submit a private password via `POST /api/auth/change-password`, which sets `mustChangePassword = false`.

### 4. Auth Route Rate Limiting & Admin Protections
- **Rate Limiting**: Authentication endpoints (`/api/auth/login`, `/api/auth/register`) enforce IP-based rate limiting to mitigate brute-force password guessing attacks.
- **Admin Credential Protections**: Admins cannot delete their own active account or modify critical system roles without secondary confirmation.
