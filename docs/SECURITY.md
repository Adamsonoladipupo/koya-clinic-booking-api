# Security and validation

## API-key authentication

- Require `X-API-Key` on every route, including `/reset`.
- Store secret in backend environment; do not commit it or print it in logs.
- Return HTTP 401 and `{"error":"..."}` for missing/incorrect keys.
- Compare keys using a constant-time comparison when practical.
- A browser bundle must not contain the private API key. Use a server-side proxy for the demo UI; do not treat CORS as an authentication control.

## Input validation

- Require nonempty `slot_id`, `name`, and `email` for booking creation.
- Strip leading/trailing whitespace from name and email; lowercase email.
- Validate email syntax; reject invalid input with HTTP 400 and standard error body.
- Reject already-started slots with HTTP 400 and unknown slots with HTTP 404.
- Map FastAPI/Pydantic's default request-validation errors to the assessment-required 400 where applicable; preserve explicit 422 only for idempotency key/body mismatch.
- Validate `limit` as integer in [1,50], otherwise 400.

## Rate limiting

- At most 5 booking attempts per normalized email per rolling 60 seconds; include failures.
- Sixth attempt: HTTP 429, JSON error, positive integer `Retry-After` seconds.
- Independent counters by normalized email, with shared persistent state and concurrency-safe updates.
- Define behavior for malformed/missing email and idempotent retries explicitly during implementation because the excerpt does not resolve precedence.

## Threats and mitigations

| Threat | Mitigation |
|---|---|
| API key leakage | Server-only secrets, no client bundle inclusion |
| Double booking | PostgreSQL partial unique index + transactions |
| Duplicate retries | Durable idempotency key and fingerprint |
| Rapid booking spam | Shared per-email limiter with atomic accounting |
| SQL injection | Parameterized SQLAlchemy statements |
| Personal data leakage | Avoid logging full booking bodies or secrets; restrict key access |
| Browser cross-origin errors | Explicit CORS allowlist or same-origin proxy |
| Accidental destructive reset | API key required; isolate production assessment environment |

## Limitations

A single shared API key authenticates the caller, not the individual patient. The assessment permits lookup by booking ID/email, but this is not sufficient access control for a real clinic. Do not add incompatible authorization fields to the assessment API; document this production gap instead.
