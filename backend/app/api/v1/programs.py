from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.schemas.program import ProgramCreate, ProgramUpdate, ProgramResponse, ProgramModuleCreate, ProgramModuleResponse
from app.models import Program, ProgramModule

router = APIRouter()


@router.get("/", response_model=List[ProgramResponse])
def list_programs(
    category: Optional[str] = Query(None),
    is_active: bool = True,
    db: Session = Depends(get_db),
):
    query = db.query(Program).filter(Program.is_active == is_active)
    if category:
        query = query.filter(Program.category == category)
    return query.order_by(Program.name).all()


@router.get("/{program_id}", response_model=ProgramResponse)
def get_program(program_id: str, db: Session = Depends(get_db)):
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return program


@router.get("/slug/{slug}", response_model=ProgramResponse)
def get_program_by_slug(slug: str, db: Session = Depends(get_db)):
    program = db.query(Program).filter(Program.slug == slug).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return program


@router.get("/{program_id}/modules", response_model=List[ProgramModuleResponse])
def list_program_modules(program_id: str, db: Session = Depends(get_db)):
    modules = (
        db.query(ProgramModule)
        .filter(ProgramModule.program_id == program_id)
        .order_by(ProgramModule.order_index)
        .all()
    )
    return modules
