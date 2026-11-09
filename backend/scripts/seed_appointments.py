
"""Generate realistic demo appointment slots without deleting existing data.

Usage (from backend/):
    python -m scripts.seed_appointments
    python -m scripts.seed_appointments --apply
"""

from __future__ import annotations

import argparse
from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert

from app.db.session import SessionLocal
from app.models.slot import AppointmentSlot


LAGOS = ZoneInfo("Africa/Lagos")

# Fictional providers. The database schema stores provider names,
# not specialties, so specialties are descriptive metadata only.
PROVIDERS = [
    ("Dr. Adaeze Okafor", "General Medicine"),
    ("Dr. Tunde Adeyemi", "Cardiology"),
    ("Dr. Zainab Bello", "Pediatrics"),
    ("Dr. Chiamaka Eze", "Dermatology"),
    ("Dr. Ibrahim Musa", "Orthopedics"),
    ("Dr. Funmi Adebayo", "Family Medicine"),
    ("Dr. Emeka Nwosu", "Neurology"),
    ("Dr. Amina Yusuf", "Women's Health"),
]

# Five 30-minute slots per provider each operating day.
APPOINTMENT_TIMES = [
    time(9, 0),
    time(10, 0),
    time(11, 0),
    time(13, 0),
    time(14, 0),
]


def generate_slots(days: int = 14) -> list[dict]:
    """Generate future slots with deterministic, date-based IDs."""
    today = datetime.now(LAGOS).date()
    slots = []

    for offset in range(1, days + 1):
        appointment_date = today + timedelta(days=offset)

        # Sunday = 6. Clinic operates Monday through Saturday.
        if appointment_date.weekday() == 6:
            continue

        for provider_index, (provider, _) in enumerate(PROVIDERS, start=1):
            for appointment_time in APPOINTMENT_TIMES:
                local_start = datetime.combine(
                    appointment_date,
                    appointment_time,
                    tzinfo=LAGOS,
                )

                local_end = local_start + timedelta(minutes=30)

                # Deterministic ID prevents duplicate demo slots.
                slot_id = (
                    f"demo-{appointment_date:%Y%m%d}"
                    f"-p{provider_index:02d}"
                    f"-{appointment_time:%H%M}"
                )

                slots.append(
                    {
                        "id": slot_id,
                        "provider": provider,
                        "start": local_start.astimezone(timezone.utc),
                        "end": local_end.astimezone(timezone.utc),
                    }
                )

    return slots


def print_preview(slots: list[dict]) -> None:
    """Show what will be inserted without exposing credentials."""
    dates = sorted({slot["start"].astimezone(LAGOS).date() for slot in slots})

    print("\nKOYA CLINIC — DEMO APPOINTMENT SEEDER")
    print("=" * 55)
    print(f"Providers:           {len(PROVIDERS)}")
    print(f"Operating days:      {len(dates)}")
    print(f"Slots per provider:  {len(APPOINTMENT_TIMES)} per day")
    print(f"Total generated:     {len(slots)}")
    print("Timezone:            Africa/Lagos (stored as UTC)")
    print("Mode:                Additive, existing IDs skipped")

    if dates:
        print(f"First date:          {dates[0]}")
        print(f"Last date:           {dates[-1]}")

    print("\nPROVIDERS")
    for provider, specialty in PROVIDERS:
        print(f"  {provider} — {specialty}")

    print("\nSAMPLE APPOINTMENTS")
    for slot in slots[:8]:
        local_start = slot["start"].astimezone(LAGOS)
        print(
            f"  {slot['id']} | "
            f"{slot['provider']} | "
            f"{local_start:%Y-%m-%d %I:%M %p}"
        )


def seed(slots: list[dict]) -> None:
    """Insert demo slots, ignoring conflicts on the primary key."""
    if not slots:
        print("No slots generated. Nothing to insert.")
        return

    with SessionLocal() as db:
        try:
            before = db.scalar(
                select(func.count()).select_from(AppointmentSlot)
            ) or 0

            statement = (
                insert(AppointmentSlot)
                .values(slots)
                .on_conflict_do_nothing(
                    index_elements=[AppointmentSlot.id]
                )
            )

            result = db.execute(statement)
            inserted = result.rowcount

            db.commit()

            after = db.scalar(
                select(func.count()).select_from(AppointmentSlot)
            ) or 0

            print("\nSEEDING COMPLETED")
            print("=" * 55)
            print(f"Existing slots before: {before}")
            print(f"Generated slots:      {len(slots)}")
            print(f"New slots inserted:   {inserted}")
            print(f"Existing IDs skipped: {len(slots) - inserted}")
            print(f"Total slots after:    {after}")
            print("\nNo existing bookings were deleted.")

        except Exception:
            db.rollback()
            raise


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Seed Koya Clinic demo appointment slots."
    )
    parser.add_argument(
        "--days",
        type=int,
        default=14,
        help="Number of future calendar days (default: 14)",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Insert slots into the configured database",
    )

    args = parser.parse_args()

    if not 1 <= args.days <= 60:
        parser.error("--days must be between 1 and 60")

    slots = generate_slots(days=args.days)
    print_preview(slots)

    if not args.apply:
        print("\nDRY RUN ONLY — no database changes made.")
        print("To insert, rerun with --apply.")
        return

    print("\nWARNING: This will write to the database")
    print("configured by backend/.env or environment variables.")
    print("Use only a database approved for demo data.")
    print("Do not run against a database with important records.")

    confirmation = input(
        "\nType SEED DEMO DATA to continue: "
    ).strip()

    if confirmation != "SEED DEMO DATA":
        print("Cancelled. No database changes made.")
        return

    seed(slots)


if __name__ == "__main__":
    main()
