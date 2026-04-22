from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Annotated
from sqlmodel import Field, SQLModel, create_engine, Session, select, Relationship
from pydantic import field_validator, StringConstraints

# Strict 10-digit number constraint
PhoneNumber = Annotated[str, StringConstraints(pattern=r"^\d{10}$", min_length=10, max_length=10)]

class UserBase(SQLModel):
    phone_number: PhoneNumber = Field(index=True, unique=True)
    name: str

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expenses: List["Expense"] = Relationship(back_populates="user")

class UserCreate(UserBase):
    password: str
    confirm_password: str

class UserRead(UserBase):
    id: int
    created_at: datetime

class ExpenseBase(SQLModel):
    amount: Decimal = Field(max_digits=12, decimal_places=2)
    category: str
    description: str
    date: datetime

class Expense(ExpenseBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    idempotency_key: Optional[str] = Field(default=None, index=True)
    
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    user: Optional[User] = Relationship(back_populates="expenses")

class ExpenseCreate(ExpenseBase):
    idempotency_key: Optional[str] = None

class ExpenseRead(ExpenseBase):
    id: int
    user_id: int
    created_at: datetime
