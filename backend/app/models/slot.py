from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.booking import Booking


class AppointmentSlot(Base):
    __tablename__ = "appointment_slots"

    id: Mapped[str] = mapped_column(
        String(100),
        primary_key=True,
    )

    provider: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    start: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    end: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    bookings: Mapped[list[Booking]] = relationship(
        back_populates="slot",
    )
