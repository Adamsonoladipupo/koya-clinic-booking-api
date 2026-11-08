# Requirements and acceptance criteria

## Scope

Build a JSON clinic booking API and a small web UI to list available slots, book one, and display confirmation. Deploy both over HTTPS with persistent PostgreSQL storage. Implement assessment levels sequentially.

## Functional requirements

### Level 1
- `POST /reset`: delete all bookings and replace the entire slots dataset, including past slots; respond 200.
- `GET /slots`: list all slots in ascending `start` order; optional `provider` query uses exact matching; include `available` boolean.
- `POST /bookings`: create a booking with `status: confirmed`, respond 201.
- `GET /bookings/{id}`: return booking or 404.

### Level 2
- All endpoints require `X-API-Key`; missing/incorrect key yields 401.
- Reject missing/empty `slot_id`, `name`, `email` and invalid email with 400.
- Trim `name` and `email`; lowercase stored email.
- Missing slot yields 404; already-started slot yields 400.
- Every error response must be `{"error":"<message>"}`.

### Level 3
- At most one confirmed booking per slot, even under simultaneous requests; return 409 on conflict.
- `DELETE /bookings/{id}` changes `confirmed` to `cancelled`, frees slot and returns updated booking; nonexistent booking 404; already cancelled 409.

### Level 4
- Optional `Idempotency-Key` for `POST /bookings`: same key and same body returns identical status and booking ID; same key with different body returns 422.
- `GET /bookings?email=...&limit=...&cursor=...`: case-insensitive email, oldest-first order, default limit 10, accepted limit 1–50, otherwise 400; `next_cursor: null` on final page.

### Level 5
- At most five `POST /bookings` attempts per normalized email per rolling minute, including failed attempts; sixth returns 429 with integer-seconds `Retry-After`. Limits are independent between emails.

## Non-functional requirements

- Persistent data across requests and restarts.
- Transactional safety for resets, booking, cancellation and idempotency.
- No API key in browser-delivered JavaScript or committed code.
- Repeatable tests including true concurrent requests.
- Explicit UTC timestamp handling and stable JSON serialization.
- Publicly accessible HTTPS deployments; keep deployed version unchanged after submission.

## Open questions to verify against original OpenAPI JSON

1. Exact `/reset` 200 response body (not specified in pasted excerpt).
2. Exact error message text (examples show the same placeholder even for unrelated errors).
3. Exact semantics of comparing idempotency bodies (raw versus normalized) and how retries interact with rate limits.
4. Whether idempotency keys are globally scoped or scoped to a caller; retention window.
5. Invalid pagination cursor behavior and required validation for the `email` query parameter.
6. Whether reset clears idempotency and rate-limit records; sensible design is to clear them for deterministic assessment isolation, but confirm first.
7. Validation rules for slot payloads (`end > start`, unique IDs, missing fields), which were not detailed in the excerpt.

Do not silently treat design assumptions as mandated contract behavior.
