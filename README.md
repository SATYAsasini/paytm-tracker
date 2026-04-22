# Money Tracker - Minimal Full-Stack Expense Manager

A production-ready, responsive expense tracker built with FastAPI (Python) and React (TypeScript).

## Features
- **Idempotent Transactions:** Safely retry submissions without creating duplicates.
- **Precision Money Handling:** Uses `Decimal` types to avoid floating-point errors.
- **Responsive Design:** Clean, Paytm-inspired blue & white UI that works on all devices.
- **Real-time Filtering & Sorting:** Filter by category and sort by date instantly.
- **Automated Tests:** Backend integration tests for core logic.

## Tech Stack
- **Backend:** Python, FastAPI, SQLModel (SQLAlchemy + Pydantic), SQLite.
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide Icons.

## Project Structure (Monorepo)
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

## Design Decisions & Trade-offs
- **Idempotency:** I implemented an `X-Idempotency-Key` header system. The frontend generates a UUID for each form session, ensuring retries are safe.
- **Database:** Used SQLite for zero-config setup, but the code follows SOLID principles and Repository patterns (via SQLModel) making it easy to swap for PostgreSQL.
- **Caching:** While not implemented in this timebox, a Redis layer could be added in `app.db.session` to cache the `GET /expenses` results, especially for heavy filters.
- **Money Handling:** Chose `Decimal` over `float` to ensure ₹0.1 + ₹0.2 = ₹0.3 exactly, which is critical for finance apps.
- **Singleton Pattern:** The `DatabaseManager` in `backend/app/db/session.py` ensures a single database connection engine is initialized and reused throughout the app lifecycle.
- **Database Abstraction:** The system uses **SQLModel**. The application logic is decoupled from the specific database provider. Swapping between SQLite (local) and PostgreSQL (production) requires only an environment
variable change (`DATABASE_URL`).
- **JWT Authentication:** Server-managed session tokens with configurable expiry (default 24h).

## Intentional Omissions (Timebox)
- **Authentication:** Currently open for simplicity. Also no way for forget passkey scenario. Also no proper way to validate phone numbers, may be we could link upiIds
- **Advanced Charts:** May be we could show a graph just like stock markets so that a user can analyse howhis expenses went up went down in a window time limit may 1D 1W or 1M
- **Soft Deletes:** No user deletion, this seems normal but in prod lets say a will be deleted then out of million of records we have to  delete the users expenses and doint it at once in prod db is very risky and expensive, rather tell the user it may take 10-12 hours to clean data, and at back a cron job kind of thing to check the delete requests stored in a queue and then cleans up without putting pressure on DB
- **Idempotent Key Handling:** Currently the idempotent key is implemented ina very basic way, curretnly we arw keeping that in db, in an prod environment, if each api has to hit the db again and agian just to check wheather to process ahead or not is not at all an ideal solution. Rather i plementing an external cache service will help this in this case, Also we dont need to keep idempotent key in db, rather we could keep the idempotent key in reddis for a specific amount of time.
- 
