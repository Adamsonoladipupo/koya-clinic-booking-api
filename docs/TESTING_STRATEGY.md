# Testing strategy

Use pytest + HTTPX for API tests and a real PostgreSQL test database for concurrency and constraint tests. Mocking alone cannot prove race-condition safety. Every test must assert status, JSON shape, and persistence where relevant.

## Level 1
- Reset replaces all slots and deletes all bookings, including when slots are in the past.
- Slots sorted by `start` ascending; provider exact filter; `available` reflects confirmed booking.
- Booking returns 201, generated ID, normalized expected fields, `confirmed` status and timestamp.
- Booking lookup 200; missing booking 404.

## Level 2
- Missing/wrong API key 401 on every route, including reset.
- Missing, blank and whitespace-only booking fields yield 400.
- Invalid email yields 400; whitespace trimmed; email stored lowercase.
- Unknown slot 404; slot already started 400.
- Error responses use only the contract's `error` shape.

## Level 3
- Concurrent booking burst (e.g., 20–100 simultaneous calls) for one slot: exactly one 201 and all other valid attempts 409; database contains exactly one confirmed booking.
- Cancel returns 200 and `cancelled`; slot becomes available; subsequent booking succeeds.
- Unknown cancellation 404; repeated cancellation 409.
- Concurrent cancellation requests: only one successful transition.

## Level 4
- Same idempotency key/body returns same status and booking ID; only one record created.
- Same key/different body returns 422; concurrent identical retries create one booking.
- Pagination uses oldest-first stable order, default 10, min 1, max 50; `next_cursor` eventually null.
- Email case-insensitive matching; cancelled bookings included in history unless contract says otherwise.
- Invalid limit (0, 51, fractional, nonnumeric) returns 400.

## Level 5
- First 5 attempts per email in 60 seconds accepted for processing (they may otherwise fail); sixth returns 429.
- Count failed attempts, including 400/404/409, subject to finalized validation precedence.
- Other email unaffected; after window expires requests proceed.
- `Retry-After` is positive integer seconds; concurrent burst does not allow excess attempts.

## Frontend

- Lists slots, handles loading/empty/error states, validates booking form, shows confirmation, displays API errors.
- Browser network traffic never reveals a secret API key.
- Mobile layout and keyboard accessibility.

## Production smoke tests

After deployment, verify HTTPS, auth, reset, list, create, retrieve, cancel, pagination, idempotency and limiter. Run destructive reset tests only in an isolated assessment dataset. Freeze production deployment after submission.
