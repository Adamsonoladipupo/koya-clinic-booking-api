# Koya Clinic Booking API

A full-stack clinic appointment booking system built for the Koya Academy Cohort 4 assessment. Python/FastAPI powers the JSON API, React/TypeScript provides a patient-facing interface, and PostgreSQL stores slots and bookings persistently.

> **Status:** Architecture and documentation phase. The API and frontend have not yet been implemented or deployed. Do not treat the proposed behavior below as already delivered.

## Assessment goals

| Level | Deliverable |
|---|---|
| 1 | Reset/list slots, create booking, retrieve booking |
| 2 | Require `X-API-Key`, validate booking fields and start times |
| 3 | Prevent simultaneous double-bookings; cancel and release slots |
| 4 | Idempotent booking creation; cursor-paginated booking history |
| 5 | Per-email rate limit (5 booking attempts/minute, including failures) |

## Stack

- **API:** Python, FastAPI, Pydantic, SQLAlchemy 2, Alembic
- **Web:** React, TypeScript, Vite
- **Database:** PostgreSQL hosted on Supabase
- **Hosting:** Render (API), Vercel (web and optional secure server-side proxy)
- **Testing:** pytest, HTTPX, PostgreSQL integration tests
- **Source control:** GitHub monorepo

## Architecture

```mermaid
flowchart TD
  Patient[Patient browser] --> Web[React app on Vercel]
  Web --> Proxy[Server-side API proxy on Vercel]
  Proxy --> API[FastAPI on Render]
  Client[External API client / evaluator] --> API
  API --> Auth[API key authentication]
  Auth --> Booking[Booking and slot services]
  Booking --> DB[(Supabase PostgreSQL)]
```

The server-side proxy protects the API key from browser JavaScript. The public evaluator accesses the FastAPI URL directly using `X-API-Key`. The proxy is a proposed implementation choice, not an assessment endpoint.

## Required API endpoints

| Method | Path | Level |
|---|---|---|
| POST | `/reset` | 1 |
| GET | `/slots` | 1 |
| POST | `/bookings` | 1–5 |
| GET | `/bookings` | 4 |
| GET | `/bookings/{id}` | 1 |
| DELETE | `/bookings/{id}` | 3 |

All requests require `X-API-Key` (level 2). All responses are JSON; errors have the shape `{"error":"message"}`. See [API contract](docs/API_CONTRACT.md).

## Local development (planned)

The application scaffold does not exist yet. Once implemented, it will expose environment variables through `.env.example`, database migrations through Alembic, and repeatable backend/frontend commands. No executable setup instructions are claimed at this stage.

Expected configuration:

```dotenv
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:5432/DB
API_KEY=replace-with-a-strong-secret
```

Never commit real secrets. Render should receive the backend variables via its environment settings; a Vercel server-side proxy should receive its own private variables. Browser-exposed `VITE_*` variables must not contain the API key.

## Repository layout

```text
backend/              # FastAPI implementation (to be created)
frontend/             # React app (to be created)
docs/                 # Design and engineering documentation
  adr/                # Architecture decision records
README.md
.gitignore
```

## Engineering documentation

- [Requirements](docs/REQUIREMENTS.md)
- [API contract](docs/API_CONTRACT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database design](docs/DATABASE_DESIGN.md)
- [Security](docs/SECURITY.md)
- [Testing strategy](docs/TESTING_STRATEGY.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [UML diagrams](docs/UML_DIAGRAMS.md)
- [ERD](docs/ERD.md)
- [Architecture decision record](docs/adr/0001-technology-decisions.md)

## Submission checklist

- [ ] HTTPS API base URL
- [ ] API key supplied privately to assessors
- [ ] HTTPS web app URL
- [ ] Public GitHub repository or access granted to `quadri40`
- [ ] Loom walkthrough, at most 5 minutes
- [ ] Production behavior verified against the assessment contract
- [ ] Deployed service remains available and unchanged after submission until contacted

## Source of truth

The user-provided Koya Academy Task 1 OpenAPI specification is authoritative. Documentation identifies areas not fully specified; implementation must not invent mandatory response fields or alternate endpoint shapes.
