# Database design

## Tables (proposed)

### `appointment_slots`
- `id TEXT PRIMARY KEY` — caller-provided ID (e.g., `s1`).
- `provider TEXT NOT NULL`
- `starts_at TIMESTAMPTZ NOT NULL`
- `ends_at TIMESTAMPTZ NOT NULL`

### `bookings`
- `id UUID PRIMARY KEY`
- `slot_id TEXT NOT NULL REFERENCES appointment_slots(id)`
- `name TEXT NOT NULL`
- `email TEXT NOT NULL` — normalized to lowercase
- `status TEXT NOT NULL CHECK (status IN ('confirmed','cancelled'))`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

### `idempotency_records` (Level 4)
- `key TEXT PRIMARY KEY` (or compound caller/key scope if required)
- `request_hash TEXT NOT NULL`
- `response_status INTEGER` and `response_body JSONB` to support replay
- `booking_id UUID NULL REFERENCES bookings(id)` (optional reference)
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

### `booking_attempts` (Level 5, proposed)
- `id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`
- `email TEXT NOT NULL`
- `attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()`

A database-backed rolling window avoids local-process counters; serialize per normalized email using a transaction-level advisory lock or dedicated counter row so concurrent requests cannot exceed the limit.

## Critical indexes

```sql
CREATE UNIQUE INDEX one_confirmed_booking_per_slot
ON bookings (slot_id)
WHERE status = 'confirmed';

CREATE INDEX bookings_by_email_and_age
ON bookings (email, created_at, id);

CREATE INDEX booking_attempts_by_email_time
ON booking_attempts (email, attempted_at);
```

## Atomic operations

- **Reset:** single transaction deleting dependent records and bookings before replacing slots. Reset should not expose an intermediate empty dataset; decide whether to clear idempotency/rate-limit state after confirming spec semantics.
- **Book:** validate existence/time; insert within transaction; unique index guarantees exclusivity; translate integrity violations to 409.
- **Cancel:** lock booking row, ensure currently confirmed, update status, commit; concurrent cancellations must yield one success and one 409.
- **Idempotency:** atomically claim key and record request fingerprint; serialize concurrent identical requests and replay stored status/body.
- **Rate limit:** atomically record each attempt under per-email serialization; calculate Retry-After as positive whole seconds.

## Date/time

Store `TIMESTAMPTZ` in UTC; return ISO 8601 UTC strings. Use database/application clocks consistently for slot-start checks and rolling windows. Add deterministic secondary sorting for equal start times.

## Deletion and history

Cancellation preserves the booking row, enabling retrieval and pagination. Reset deletes booking history by contract. The unique index only applies to confirmed bookings, allowing rebooking after cancellation.

See [ERD](ERD.md) for entity relationships.
