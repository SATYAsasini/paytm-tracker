from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlmodel import Session, select, desc
from app.db.session import get_session
from app.models.expense import Expense, ExpenseCreate, ExpenseRead, User
from app.core.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=ExpenseRead, status_code=201)
def create_expense(
    *,
    session: Session = Depends(get_session),
    expense_in: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    x_idempotency_key: Optional[str] = Header(None)
):
    # Check for idempotency if key provided
    key = x_idempotency_key or expense_in.idempotency_key
    if key:
        existing = session.exec(
            select(Expense).where(
                Expense.idempotency_key == key,
                Expense.user_id == current_user.id
            )
        ).first()
        if existing:
            return existing

    # Validate amount
    if expense_in.amount < 0:
        raise HTTPException(status_code=400, detail="Amount cannot be negative")

    db_expense = Expense.model_validate(expense_in)
    db_expense.idempotency_key = key
    db_expense.user_id = current_user.id
    
    session.add(db_expense)
    session.commit()
    session.refresh(db_expense)
    return db_expense

@router.get("/", response_model=List[ExpenseRead])
def read_expenses(
    *,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    category: Optional[str] = None,
    sort: Optional[str] = Query(None, pattern="^date_desc$")
):
    statement = select(Expense).where(Expense.user_id == current_user.id)
    if category:
        statement = statement.where(Expense.category == category)
    
    if sort == "date_desc":
        statement = statement.order_by(desc(Expense.date))

    results = session.exec(statement).all()
    return results
