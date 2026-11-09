from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.slot import ResetRequest, SlotsResponse
from app.services.slot_service import list_slots, reset_slots

router = APIRouter(tags=["Slots"])

DbSession = Annotated[Session, Depends(get_db)]


@router.post("/reset")
def reset(
    payload: ResetRequest,
    db: DbSession,
):
    reset_slots(db, payload)
    return {"message": "Slots reset successfully"}


@router.get("/slots", response_model=SlotsResponse)
def get_slots(
    db: DbSession,
    provider: str | None = None,
):
    return {"slots": list_slots(db, provider)}
