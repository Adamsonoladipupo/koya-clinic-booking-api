import math
from datetime import timedelta

from fastapi import HTTPException
from sqlalchemy import func, select

from app.db.session import SessionLocal
from app.models.booking_attempt import BookingAttempt

MAX_ATTEMPTS = 5
WINDOW_SECONDS = 60


def check_booking_rate_limit(email: str) -> None:
    normalized_email = email.strip().lower()

    # Use an independent transaction so that a failed
    # booking does not erase the recorded attempt.
    with SessionLocal() as db:
        # Serialize rate-limit checks for the same email.
        # The advisory lock is released at transaction end.
        db.execute(
            select(
                func.pg_advisory_xact_lock(func.hashtextextended(normalized_email, 0))
            )
        )

        now = db.scalar(select(func.clock_timestamp()))
        window_start = now - timedelta(seconds=WINDOW_SECONDS)

        statement = (
            select(BookingAttempt.attempted_at)
            .where(
                BookingAttempt.email == normalized_email,
                BookingAttempt.attempted_at > window_start,
            )
            .order_by(
                BookingAttempt.attempted_at,
                BookingAttempt.id,
            )
            .limit(MAX_ATTEMPTS)
        )

        attempts = db.scalars(statement).all()

        if len(attempts) >= MAX_ATTEMPTS:
            oldest_attempt = attempts[0]

            seconds_remaining = (
                oldest_attempt + timedelta(seconds=WINDOW_SECONDS) - now
            ).total_seconds()

            retry_after = max(
                1,
                math.ceil(seconds_remaining),
            )

            db.rollback()

            raise HTTPException(
                status_code=429,
                detail="Too many booking attempts. Please try again later.",
                headers={
                    "Retry-After": str(retry_after),
                },
            )

        db.add(
            BookingAttempt(
                email=normalized_email,
            )
        )

        db.commit()
