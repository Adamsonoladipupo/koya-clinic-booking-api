# ADR 0001: Modular monolith with FastAPI, React and PostgreSQL

- **Status:** Proposed / accepted for initial implementation planning
- **Date:** 2026-11-08

## Context

The assessment requires six HTTP endpoints, a small web UI, persistent storage, strict error contracts, concurrent booking exclusivity, idempotency, cursor pagination and per-email throttling. The system should be deployable on inexpensive or free hosting and explainable during a short review.

## Decision

Use a modular-monolith Python/FastAPI backend, React/TypeScript/Vite frontend, SQLAlchemy + Alembic, Supabase-managed PostgreSQL, Render backend hosting, Vercel frontend hosting and a server-side proxy for browser API calls.

## Rationale

- FastAPI supports typed request models, straightforward route handling and OpenAPI docs.
- PostgreSQL's partial unique indexes and transactions directly enforce the central concurrency invariant.
- A monolith avoids service discovery, distributed transactions and unnecessary deployment complexity.
- React provides a simple, testable patient workflow.
- A server-side proxy avoids leaking the shared API key in frontend JavaScript.

## Alternatives considered

- **Django/DRF:** mature but more framework surface than needed for six endpoints.
- **SQLite:** excellent for local prototypes, but PostgreSQL is a clearer choice for concurrent writes and managed persistence.
- **Microservices:** unnecessary operational complexity for the assessment scope.
- **Frontend calling API with embedded key:** rejected because browser code exposes secrets.
- **In-memory rate limiter:** rejected because multiple workers/restarts make counters inconsistent.

## Consequences

- Must manage database migrations and PostgreSQL connection configuration.
- The proxy adds an extra network hop and deployment surface.
- Shared-key authentication is not real patient identity verification.
- Provider free-tier limits and sleep behavior must be checked at deployment time.
- The architecture remains intentionally simple enough to implement and explain end to end.
