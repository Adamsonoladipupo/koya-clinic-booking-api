# Implementation plan

Each phase ends with tests, documentation updates, and a focused Git commit. Do not move to the next level while required behaviors are failing.

## Phase 0 — Repository and contract
- [ ] Create GitHub monorepo and push documentation.
- [ ] Obtain full machine-readable OpenAPI JSON; resolve ambiguous response details.
- [ ] Create Python/React scaffolds and `.env.example`.
- [ ] Configure linting, formatting, test runner and PostgreSQL test environment.

## Phase 1 — Core booking API and web UI
- [ ] SQLAlchemy models, Alembic migration, seed/reset workflow.
- [ ] `POST /reset`, `GET /slots`, `POST /bookings`, `GET /bookings/{id}`.
- [ ] React slot list, booking form and confirmation.
- [ ] Unit and integration tests.

## Phase 2 — Authentication and validation
- [ ] Global `X-API-Key` guard and consistent 401 errors.
- [ ] Normalize/validate booking payloads; exact 400/404 behavior.
- [ ] Common JSON error mapping and test matrix.

## Phase 3 — Concurrency and cancellation
- [ ] PostgreSQL partial unique index for confirmed slot.
- [ ] Transaction-safe booking conflict mapping to 409.
- [ ] `DELETE /bookings/{id}` and availability recalculation.
- [ ] Concurrent request and cancellation tests.

## Phase 4 — Idempotency and pagination
- [ ] Durable idempotency claim/fingerprint/replay mechanism.
- [ ] Stable cursor encoding and validation.
- [ ] `GET /bookings` query and pagination tests.

## Phase 5 — Rate limiting
- [ ] Shared per-email rolling window with atomic updates.
- [ ] Retry-After computation and concurrency tests.
- [ ] Decide documented precedence with idempotency/invalid email.

## Phase 6 — Deploy and submit
- [ ] Deploy PostgreSQL, FastAPI HTTPS, frontend HTTPS and server-side proxy.
- [ ] Verify environment variables and database migrations.
- [ ] Run end-to-end production acceptance tests.
- [ ] Finalize README and record Loom (≤5 min).
- [ ] Submit API URL, API key, frontend URL, GitHub repo, Loom URL.
- [ ] Freeze deployment until assessors contact us.

## Definition of done

Feature matches documented contract, passes automated happy-path and failure tests, preserves data correctly, contains no committed secrets, and can be explained in terms of code, trade-offs, and constraints.
