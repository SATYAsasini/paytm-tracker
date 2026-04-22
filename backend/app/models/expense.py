from datetime import datetime
from decimal import Decimal
from typing import Optional
from sqlmodel import Field, SQLModel, create_engine, Session, select
import uuid

class ExpenseBase(SQLModel):
    amount: Decimal = Field(max_digits=12, decimal_places=2)
    category: str
    description: str
    date: datetime

class Expense(ExpenseBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    idempotency_key: Optional[str] = Field(default=None, index=True)

class ExpenseCreate(ExpenseBase):
    idempotency_key: Optional[str] = None

class ExpenseRead(ExpenseBase):
    id: int
    created_at: datetime
