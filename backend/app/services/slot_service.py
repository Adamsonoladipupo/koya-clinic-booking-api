from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.booking_attempt import BookingAttempt
from app.models.idempotency import IdempotencyRecord
from app.models.slot import AppointmentSlot
from app.schemas.slot import ResetRequest


def reset_slots(db: Session, payload: ResetRequest) -> None:
    db.execute(delete(BookingAttempt))
    db.execute(delete(IdempotencyRecord))
    db.execute(delete(Booking))
    db.execute(delete(AppointmentSlot))

    for slot in payload.slots:
        db.add(
            AppointmentSlot(
                id=slot.id,
                provider=slot.provider,
                start=slot.start,
                end=slot.end,
            )
        )

    db.commit()


def list_slots(
    db: Session,
    provider: str | None = None,
) -> list[dict]:
    confirmed_booking_exists = (
        select(Booking.id)
        .where(
            Booking.slot_id == AppointmentSlot.id,
            Booking.status == "confirmed",
        )
        .exists()
    )

    statement = select(
        AppointmentSlot,
        (~confirmed_booking_exists).label("available"),
    ).order_by(
        AppointmentSlot.start,
        AppointmentSlot.id,
    )

    if provider is not None:
        statement = statement.where(AppointmentSlot.provider == provider)

    results = db.execute(statement).all()

    return [
        {
            "id": slot.id,
            "provider": slot.provider,
            "start": slot.start,
            "end": slot.end,
            "available": available,
        }
        for slot, available in results
    ]
