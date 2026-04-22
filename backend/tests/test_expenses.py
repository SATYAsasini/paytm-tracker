import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import engine, create_db_and_tables
from sqlmodel import SQLModel, Session
import uuid

client = TestClient(app)

@pytest.fixture(name="session", autouse=True)
def session_fixture():
    # Use the existing engine but ensure tables are fresh or use in-memory sqlite
    # For simplicity, let's just make sure they are created
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

def test_create_expense_success():
    payload = {
        "amount": "50.75",
        "category": "Food",
        "description": "Pizza night",
        "date": "2026-04-22T10:00:00"
    }
    response = client.post("/expenses/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["amount"] == "50.75"
    assert data["category"] == "Food"

def test_create_expense_idempotency():
    key = str(uuid.uuid4())
    payload = {
        "amount": "100.00",
        "category": "Rent",
        "description": "Monthly rent",
        "date": "2026-05-01T00:00:00"
    }
    headers = {"X-Idempotency-Key": key}
    
    # First request
    response1 = client.post("/expenses/", json=payload, headers=headers)
    assert response1.status_code == 201
    data1 = response1.json()
    
    # Second request (retry)
    response2 = client.post("/expenses/", json=payload, headers=headers)
    assert response2.status_code == 201 # Or could be 200, but often 201 with same resource
    data2 = response2.json()
    
    assert data1["id"] == data2["id"]

def test_get_expenses_sort():
    # Insert two expenses with different dates
    client.post("/expenses/", json={
        "amount": "10.00", "category": "A", "description": "D1", "date": "2026-01-01T00:00:00"
    })
    client.post("/expenses/", json={
        "amount": "20.00", "category": "B", "description": "D2", "date": "2026-02-01T00:00:00"
    })
    
    response = client.get("/expenses/?sort=date_desc")
    assert response.status_code == 200
    data = response.json()
    # Newer date first
    assert data[0]["date"].startswith("2026-02-01")
