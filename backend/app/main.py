from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import expenses, auth
from app.db.session import create_db_and_tables

try:
    create_db_and_tables()
except Exception as e:
    print(f"DB Initialization Warning: {e}")

app = FastAPI(title="Money Tracker API")

# FIX: Removed allow_credentials=True to allow allow_origins=["*"]
# This is the standard fix for the "Credential is not allowed for Origin *" error.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(expenses.router, prefix="/api/expenses", tags=["expenses"])

@app.get("/api/health")
def health():
    return {"status": "ok"}
