from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_roles
from ..database import get_db
from ..models import Expense, Vehicle, Role, User, ExpenseCategory
from ..schemas import ExpenseCreate, ExpenseOut

router = APIRouter(prefix="/api/expenses", tags=["expenses"])
manage = require_roles(Role.FINANCIAL_ANALYST, Role.FLEET_MANAGER)


def _out(db: Session, e: Expense) -> ExpenseOut:
    o = ExpenseOut.model_validate(e)
    v = db.query(Vehicle).get(e.vehicle_id) if e.vehicle_id else None
    o.vehicle_name = v.registration_number if v else None
    return o


@router.get("", response_model=list[ExpenseOut])
def list_expenses(vehicle_id: int | None = Query(None), category: str | None = Query(None),
                  db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    q = db.query(Expense)
    if vehicle_id:
        q = q.filter(Expense.vehicle_id == vehicle_id)
    if category:
        q = q.filter(Expense.category == category)
    return [_out(db, e) for e in q.order_by(Expense.id.desc()).all()]


@router.post("", response_model=ExpenseOut)
def create_expense(body: ExpenseCreate, db: Session = Depends(get_db), _: User = Depends(manage)):
    if body.amount <= 0:
        raise HTTPException(400, "Amount must be greater than zero.")
    if body.category not in ExpenseCategory.ALL:
        raise HTTPException(400, f"Category must be one of {ExpenseCategory.ALL}.")
    e = Expense(
        vehicle_id=body.vehicle_id, trip_id=body.trip_id, category=body.category,
        amount=body.amount, description=body.description, notes=body.notes,
        expense_date=body.expense_date or date.today(),
    )
    db.add(e)
    db.commit()
    db.refresh(e)
    return _out(db, e)


@router.delete("/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db), _: User = Depends(manage)):
    e = db.query(Expense).get(expense_id)
    if not e:
        raise HTTPException(404, "Expense not found.")
    db.delete(e)
    db.commit()
    return {"detail": "Expense deleted."}
