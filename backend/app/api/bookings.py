from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.booking import BookingCreate, BookingResponse, BookingsResponse
from app.services.booking_query_service import list_bookings
from app.services.booking_service import cancel_booking, create_booking, get_booking
from app.services.rate_limit_service import check_booking_rate_limit

router = APIRouter(tags=["Bookings"])

DbSession = Annotated[Session, Depends(get_db)]


@router.post(
    "/bookings",
    response_model=BookingResponse,
    status_code=201,
)
def post_booking(
    payload: BookingCreate,
    db: DbSession,
    idempotency_key: str | None = Header(
        default=None,
        alias="Idempotency-Key",
    ),
):
    if idempotency_key is not None:
        if not idempotency_key.strip():
            raise HTTPException(
                status_code=400,
                detail="Idempotency key cannot be empty",
            )

        if len(idempotency_key) > 255:
            raise HTTPException(
                status_code=400,
                detail="Idempotency key is too long",
            )

    check_booking_rate_limit(str(payload.email))

    return create_booking(
        db,
        payload,
        idempotency_key=idempotency_key,
    )


@router.get(
    "/bookings",
    response_model=BookingsResponse,
)
def get_bookings(
    db: DbSession,
    email: str | None = None,
    limit: int = 10,
    cursor: str | None = None,
):
    if email is None:
        raise HTTPException(
            status_code=400,
            detail="Email is required",
        )

    return list_bookings(
        db,
        email=email,
        limit=limit,
        cursor=cursor,
    )


@router.get(
    "/bookings/{booking_id}",
    response_model=BookingResponse,
)
def retrieve_booking(
    booking_id: str,
    db: DbSession,
):
    return get_booking(db, booking_id)


@router.delete(
    "/bookings/{booking_id}",
    response_model=BookingResponse,
)
def delete_booking(
    booking_id: str,
    db: DbSession,
):
    return cancel_booking(db, booking_id)
