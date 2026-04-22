import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from app.main import app
from app.db.session import get_session, db_manager
import uuid

client = TestClient(app)

# Test setup
@pytest.fixture(name="session", autouse=True)
def session_fixture():
    # Use the Singleton engine but ensure fresh tables for testing
    SQLModel.metadata.drop_all(db_manager.engine)
    SQLModel.metadata.create_all(db_manager.engine)
    with Session(db_manager.engine) as session:
        yield session

def test_full_auth_and_expense_flow():
    # 1. Register
    reg_payload = {
        "phone_number": "9876543210",
        "name": "Test User",
        "password": "testpassword",
        "confirm_password": "testpassword"
    }
    response = client.post("/auth/register", json=reg_payload)
    assert response.status_code == 200
    assert response.json()["phone_number"] == "9876543210"

    # 2. Login
    login_payload = {
        "phone_number": "9876543210",
        "password": "testpassword"
    }
    response = client.post("/auth/login", json=login_payload)
    assert response.status_code == 200
    token = response.json()["access_token"]
    assert token is not None

    # 3. Create Expense (Authorized)
    headers = {"Authorization": f"Bearer {token}"}
    expense_payload = {
        "amount": "150.50",
        "category": "Food",
        "description": "Lunch with tests",
        "date": "2026-04-22T12:00:00"
    }
    response = client.post("/expenses/", json=expense_payload, headers=headers)
    assert response.status_code == 201
    assert response.json()["amount"] == "150.50"

    # 4. Read Expenses (Authorized)
    response = client.get("/expenses/", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["description"] == "Lunch with tests"

    # 5. Unauthorized Access
    response = client.get("/expenses/")
    assert response.status_code == 401

def test_register_password_mismatch():
    payload = {
        "phone_number": "1234567890",
        "name": "Bad User",
        "password": "p1",
        "confirm_password": "p2"
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "Passwords do not match"
