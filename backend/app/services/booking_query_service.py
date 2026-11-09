import base64
import hashlib
import hmac
import json
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.booking import Booking


def encode_cursor(
    created_at: datetime,
    booking_id: str,
    email: str,
) -> str:
    payload = {
        "created_at": created_at.isoformat(),
        "id": booking_id,
        "email": email,
    }

    raw = json.dumps(
        payload,
        sort_keys=True,
        separators=(",", ":"),
    ).encode()

    signature = hmac.new(
        settings.api_key.encode(),
        raw,
        hashlib.sha256,
    ).digest()

    token = base64.urlsafe_b64encode(raw + signature).decode().rstrip("=")

    return token


def decode_cursor(cursor: str, email: str) -> tuple:
    try:
        padded = cursor + "=" * (-len(cursor) % 4)
        data = base64.urlsafe_b64decode(padded)

        if len(data) < 33:
            raise ValueError("Invalid cursor length")

        raw, signature = data[:-32], data[-32:]

        expected = hmac.new(
            settings.api_key.encode(),
            raw,
            hashlib.sha256,
        ).digest()

        if not hmac.compare_digest(signature, expected):
            raise ValueError("Invalid cursor signature")

        payload = json.loads(raw)

        if payload["email"] != email:
            raise ValueError("Cursor belongs to another email")

        return (
            datetime.fromisoformat(payload["created_at"]),
            payload["id"],
        )

    except (ValueError, KeyError, TypeError, UnicodeError) as exc:
        raise HTTPException(
            status_code=400,
            detail="Invalid pagination cursor",
        ) from exc


def list_bookings(
    db: Session,
    email: str,
    limit: int = 10,
    cursor: str | None = None,
) -> dict:
    email = email.strip().lower()

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Email is required",
        )

    if not 1 <= limit <= 50:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 50",
        )

    statement = select(Booking).where(Booking.email == email)

    if cursor is not None:
        created_at, booking_id = decode_cursor(cursor, email)

        statement = statement.where(
            or_(
                Booking.created_at > created_at,
                and_(
                    Booking.created_at == created_at,
                    Booking.id > booking_id,
                ),
            )
        )

    statement = statement.order_by(
        Booking.created_at,
        Booking.id,
    ).limit(limit + 1)

    results = list(db.scalars(statement).all())

    has_more = len(results) > limit
    bookings = results[:limit]

    next_cursor = None

    if has_more:
        last = bookings[-1]

        next_cursor = encode_cursor(
            last.created_at,
            last.id,
            email,
        )

    return {
        "bookings": bookings,
        "next_cursor": next_cursor,
    }
