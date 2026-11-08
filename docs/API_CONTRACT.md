# API contract (transcribed from supplied assessment specification)

Base path: root of the deployed API URL. Media type: `application/json`. **Every request** requires `X-API-Key` and an incorrect/missing key yields HTTP 401. Errors always use `{"error":"<message>"}`; exact message strings are not defined in the supplied examples.

## `POST /reset` — Level 1

Request:

```json
{"slots":[{"id":"s1","provider":"Dr Ade","start":"2026-12-10T09:00:00Z","end":"2026-12-10T09:30:00Z"}]}
```

Deletes all bookings and replaces all slots, including past slots. Returns **200**; response body not specified in supplied excerpt.

## `GET /slots` — Level 1

Optional query `provider` (exact match). Return **200** and slots ordered by earliest `start`:

```json
{"slots":[{"id":"s1","provider":"Dr Ade","start":"2026-12-10T09:00:00Z","end":"2026-12-10T09:30:00Z","available":true}]}
```

## `POST /bookings` — Levels 1–5

Headers: `X-API-Key` required; `Idempotency-Key` optional (Level 4).

```json
{"slot_id":"s1","name":"Ada Obi","email":"ada@example.com"}
```

**201** example:

```json
{"id":"generated-id","slot_id":"s1","name":"Ada Obi","email":"ada@example.com","status":"confirmed","created_at":"2026-11-08T16:14:55.140Z"}
```

| Status | Condition |
|---|---|
| 201 | New booking |
| 400 | Missing/empty/invalid booking field or slot already started |
| 404 | Slot does not exist |
| 409 | Slot already has a confirmed booking |
| 422 | Idempotency key reused with different body |
| 429 | More than five attempts for same email in a minute; include `Retry-After` integer seconds |

Trim name and email; store email lowercased. A matching idempotent retry must reproduce the same status and booking ID and not create a second booking.

## `GET /bookings` — Level 4

Required query `email`; optional `limit` (integer 1–50, default 10) and `cursor` (opaque string). Email matching ignores case; results oldest first. Invalid limit returns **400**.

**200** example:

```json
{"bookings":[{"id":"generated-id","slot_id":"s1","name":"Ada Obi","email":"ada@example.com","status":"confirmed","created_at":"2026-11-08T16:14:55.146Z"}],"next_cursor":null}
```

When there is another page, `next_cursor` is a string that the client sends as `cursor` in the next request.

## `GET /bookings/{id}` — Level 1

**200** returns booking object; **404** if booking ID does not exist.

## `DELETE /bookings/{id}` — Level 3

**200** returns updated booking with `status: cancelled`; **404** if booking does not exist; **409** if already cancelled.

## Response model

```text
Slot: id, provider, start, end
SlotWithAvailability: id, provider, start, end, available
NewBooking: slot_id, name, email
Booking: id, slot_id, name, email, status, created_at
Error: error
```

All timestamp fields are ISO 8601. Use UTC consistently. Do not introduce unrequested public response fields. For precise machine-readable validation, compare the final implementation against `/assessment-api/openapi.json`.
