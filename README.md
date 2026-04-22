# Money Tracker - Minimal Full-Stack Expense Manager

A production-ready, responsive expense tracker built with FastAPI (Python) and React (TypeScript).

## 🚀 Features
- **Idempotent Transactions:** Safely retry submissions without creating duplicates.
- **Precision Money Handling:** Uses `Decimal` types to avoid floating-point errors.
- **Responsive Design:** Clean, Paytm-inspired blue & white UI that works on all devices.
- **Real-time Filtering & Sorting:** Filter by category and sort by date instantly.
- **Automated Tests:** Backend integration tests for core logic.

## 🛠️ Tech Stack
- **Backend:** Python, FastAPI, SQLModel (SQLAlchemy + Pydantic), SQLite.
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide Icons.

## 📦 Project Structure (Monorepo)
- `/backend`: FastAPI application and tests.
- `/frontend`: Vite + React application.

## 🚦 Getting Started

### Backend
1. `cd backend`
2. `poetry install` (or `pip install fastapi uvicorn sqlmodel pytest httpx`)
3. `uvicorn app.main:app --reload`
4. API docs available at `http://localhost:8000/docs`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`
4. UI available at `http://localhost:5173`

## 🧠 Design Decisions & Trade-offs
- **Idempotency:** I implemented an `X-Idempotency-Key` header system. The frontend generates a UUID for each form session, ensuring retries are safe.
- **Database:** Used SQLite for zero-config setup, but the code follows SOLID principles and Repository patterns (via SQLModel) making it easy to swap for PostgreSQL.
- **Caching:** While not implemented in this timebox, a Redis layer could be added in `app.db.session` to cache the `GET /expenses` results, especially for heavy filters.
- **Money Handling:** Chose `Decimal` over `float` to ensure ₹0.1 + ₹0.2 = ₹0.3 exactly, which is critical for finance apps.

## 🚧 Intentional Omissions (Timebox)
- **Authentication:** Currently open for simplicity.
- **Advanced Charts:** Stuck to a clean list and summary total as per requirements.
- **Soft Deletes:** Deletion wasn't a core requirement, so I focused on creation and retrieval correctness.
