import hashlib
import json
from datetime import UTC, datetime

from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.idempotency import IdempotencyRecord
from app.models.slot import AppointmentSlot
from app.schemas.booking import BookingCreate


def booking_request_hash(payload: BookingCreate) -> str:
    normalized = {
        "slot_id": payload.slot_id,
        "name": payload.name,
        "email": str(payload.email),
    }

    serialized = json.dumps(
        normalized,
        sort_keys=True,
        separators=(",", ":"),
    )

    return hashlib.sha256(serialized.encode()).hexdigest()


def create_booking(
    db: Session,
    payload: BookingCreate,
    idempotency_key: str | None = None,
) -> Booking:
    request_hash = booking_request_hash(payload)

    if idempotency_key is not None:
        # Reserve the key atomically in PostgreSQL.
        statement = (
            pg_insert(IdempotencyRecord)
            .values(
                key=idempotency_key,
                request_hash=request_hash,
            )
            .on_conflict_do_nothing(index_elements=["key"])
            .returning(IdempotencyRecord.key)
        )

        reserved = db.scalar(statement)

        if reserved is None:
            # The key already belongs to another request.
            existing = db.get(
                IdempotencyRecord,
                idempotency_key,
            )

            if existing.request_hash != request_hash:
                db.rollback()
                raise HTTPException(
                    status_code=422,
                    detail=("Idempotency key reused with a different request"),
                )

            if existing.booking_id is None:
                db.rollback()
                raise HTTPException(
                    status_code=409,
                    detail="Booking request is still processing",
                )

            booking = db.get(Booking, existing.booking_id)
            db.rollback()

            if booking is None:
                raise HTTPException(
                    status_code=409,
                    detail="Original booking is unavailable",
                )

            return booking

    slot = db.scalar(
        select(AppointmentSlot).where(AppointmentSlot.id == payload.slot_id)
    )

    if slot is None:
        db.rollback()
        raise HTTPException(
            status_code=404,
            detail="Slot not found",
        )

    if slot.start <= datetime.now(UTC):
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Cannot book a slot that has already started",
        )

    booking = Booking(
        slot_id=payload.slot_id,
        name=payload.name,
        email=str(payload.email),
        status="confirmed",
    )

    db.add(booking)

    try:
        db.flush()

        if idempotency_key is not None:
            record = db.get(
                IdempotencyRecord,
                idempotency_key,
            )
            record.booking_id = booking.id

        db.commit()

    except IntegrityError as exc:
        db.rollback()

        constraint_name = getattr(
            getattr(exc.orig, "diag", None),
            "constraint_name",
            None,
        )

        if constraint_name == "uq_confirmed_booking_per_slot":
            raise HTTPException(
                status_code=409,
                detail="Slot is already booked",
            ) from exc

        raise

    db.refresh(booking)
    return booking


def get_booking(db: Session, booking_id: str) -> Booking:
    booking = db.get(Booking, booking_id)

    if booking is None:
        raise HTTPException(
            status_code=404,
            detail="Booking not found",
        )

    return booking


def cancel_booking(db: Session, booking_id: str) -> Booking:
    statement = (
        update(Booking)
        .where(
            Booking.id == booking_id,
            Booking.status == "confirmed",
        )
        .values(status="cancelled")
        .returning(Booking.id)
    )

    result = db.execute(statement)
    updated_id = result.scalar_one_or_none()

    if updated_id is None:
        db.rollback()

        existing = db.get(Booking, booking_id)

        if existing is None:
            raise HTTPException(
                status_code=404,
                detail="Booking not found",
            )

        raise HTTPException(
            status_code=409,
            detail="Booking is already cancelled",
        )

    db.commit()
    return get_booking(db, booking_id)
