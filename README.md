# Money Tracker - Minimal Full-Stack Expense Manager

A production-ready, responsive expense tracker built with FastAPI (Python) and React (TypeScript).

## 🚀 Features
- **Idempotent Transactions:** Unique keys prevent duplicate entries during retries.
- **User Authentication:** Secure phone-number + passkey login with salted bcrypt hashing.
- **Precision Money Handling:** Uses `Decimal` types for 100% financial accuracy.
- **Paytm-Inspired UI:** Responsive, professional blue/white palette.

## 🛠️ Architecture & Patterns
- **Singleton Pattern:** The `DatabaseManager` in `backend/app/db/session.py` ensures a single database connection engine is initialized and reused throughout the app lifecycle.
- **Database Abstraction:** The system uses **SQLModel**. The application logic is decoupled from the specific database provider. Swapping between SQLite (local) and PostgreSQL (production) requires only an environment variable change (`DATABASE_URL`).
- **JWT Authentication:** Server-managed session tokens with configurable expiry (default 24h).
- **Idempotency:** Frontend generates UUID v4 per transaction; Backend verifies key + User ID before processing.

## 🚦 Deployment Guide (Vercel + Neon.tech)

### 1. Database (Free Postgres)
1.  Sign up at [Neon.tech](https://neon.tech).
2.  Create a new project and copy the **Connection String** (e.g., `postgresql://user:pass@ep-xxx.neon.tech/neondb`).

### 2. Vercel (Frontend & Backend)
1.  Connect your GitHub repository to Vercel.
2.  Add these **Environment Variables** in the Vercel Dashboard:
    - `DATABASE_URL`: Your Neon connection string.
    - `SECRET_KEY`: A random string for JWT signing.
    - `ACCESS_TOKEN_EXPIRE_MINUTES`: `1440` (for 24 hours).
3.  Vercel will detect the `vercel.json` and deploy the backend as Serverless Functions and the frontend as a Static Site.

## 🐳 Docker (Dual-Process)
To run locally in a single container with both ports exposed:
```bash
docker build -t money-tracker .
docker run -p 5173:5173 -p 8000:8000 money-tracker
```
- **UI:** `http://localhost:5173`
- **API:** `http://localhost:8000`
