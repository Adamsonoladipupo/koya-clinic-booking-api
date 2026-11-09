# Koya Clinic Booking API

A full-stack clinic appointment booking system developed for the **Koya Academy Cohort 4 assessment**.

The backend provides a REST API for appointment slots, booking creation, cancellation, booking history, idempotency, and rate limiting. A React frontend will provide an interactive interface for testing and managing appointments.

## Project Status

| Component | Status |
|---|---|
| FastAPI backend | Implemented |
| Assessment Levels 1–5 | Implemented |
| PostgreSQL database | Configured using Supabase |
| Alembic migrations | Applied |
| Automated tests | 19 passing |
| Ruff lint and formatting | Passing |
| React frontend | Scaffolded; implementation pending |
| Render backend deployment | Pending |
| Frontend deployment | Pending |

## Technology Stack

**Backend**
- Python 3.12
- FastAPI and Pydantic
- SQLAlchemy 2
- PostgreSQL with psycopg
- Alembic for database migrations
- pytest for automated testing
- Ruff for linting and formatting

**Frontend**
- React 19
- TypeScript
- Vite

**Infrastructure**
- Supabase PostgreSQL
- Render for backend deployment
- GitHub for source control

## Architecture

```text
React / TypeScript frontend
          |
          | HTTPS
          v
FastAPI REST API
          |
          +-- API key authentication
          +-- Request validation
          +-- Appointment slot management
          +-- Booking and cancellation
          +-- Idempotency
          +-- Booking history and pagination
          +-- Per-email rate limiting
          |
          v
SQLAlchemy + psycopg
          |
          v
Supabase PostgreSQL
```

The assessment API uses `X-API-Key` authentication. A publicly deployed frontend must not embed this shared secret in browser-delivered code.

## Assessment Features

### Level 1 — Core Booking API

- Reset and replace appointment slots.
- Retrieve slots in chronological order.
- Filter slots by provider.
- Create and retrieve bookings.

### Level 2 — Authentication and Validation

- Authenticate requests using `X-API-Key`.
- Reject invalid or missing booking information.
- Normalize names and email addresses.
- Prevent bookings for slots that have already started.
- Return consistent JSON error responses.

### Level 3 — Booking Integrity

- Prevent multiple confirmed bookings for the same slot.
- Handle concurrent booking attempts safely.
- Cancel confirmed bookings.
- Release cancelled slots for future bookings.

### Level 4 — Idempotency and Pagination

- Support optional `Idempotency-Key` headers.
- Return the original booking for matching retries.
- Reject conflicting idempotency-key reuse.
- Retrieve bookings by email.
- Support cursor-based pagination.

### Level 5 — Rate Limiting

- Limit booking attempts to five per normalized email within a rolling 60-second window.
- Count failed booking attempts that reach the booking service.
- Return HTTP 429 when the limit is exceeded.
- Include a positive integer `Retry-After` header.
- Coordinate concurrent requests using PostgreSQL advisory locks.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Application health |
| POST | `/reset` | Replace appointment slots and clear booking data |
| GET | `/slots` | List and filter appointment slots |
| POST | `/bookings` | Create a booking |
| GET | `/bookings` | Retrieve paginated booking history |
| GET | `/bookings/{booking_id}` | Retrieve a booking |
| DELETE | `/bookings/{booking_id}` | Cancel a booking |

Protected endpoints require:

```http
X-API-Key: YOUR_API_KEY
```

Errors follow this format:

```json
{
  "error": "Error description"
}
```

For detailed request and response definitions, see [API Contract](docs/API_CONTRACT.md).

## Repository Structure

```text
koya-clinic-booking-api/
├── backend/
│   ├── alembic/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   ├── tests/
│   ├── alembic.ini
│   ├── pyproject.toml
│   └── requirements.txt
├── frontend/
├── docs/
├── .env.example
├── .gitignore
└── README.md
```

## Local Backend Setup

### 1. Clone the repository

```bash
git clone git@github.com:Adamsonoladipupo/koya-clinic-booking-api.git
cd koya-clinic-booking-api/backend
```

### 2. Create a virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
python -m pip install -r requirements.txt
```

### 4. Configure environment variables

Create `backend/.env`:

```dotenv
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:PORT/DATABASE
API_KEY=your-secure-api-key
```

Use the correct Supabase connection details. Never commit actual credentials.

### 5. Apply database migrations

```bash
python -m alembic upgrade head
```

### 6. Start the API

```bash
python -m uvicorn app.main:app --reload
```

The API is available at `http://127.0.0.1:8000`.

Interactive API documentation is available at `/docs`.

## Testing

Run the backend test suite:

```bash
python -m pytest -v
```

Run code-quality checks:

```bash
python -m ruff check .
python -m ruff format --check .
```

**Latest verified result:** 19 tests passed, with one dependency deprecation warning.

**Important:** Tests use the destructive `/reset` endpoint. Configure a dedicated disposable test database before running the test suite. Never execute reset tests against production data.

## Frontend Development

The frontend is located in `frontend/`.

```bash
cd frontend
npm ci
npm run dev
```

To create a production build:

```bash
npm run build
```

The patient-facing booking interface and its backend integration are planned for the next development phase.

## Deployment

The backend is intended to run on Render using Uvicorn and the Supabase PostgreSQL database.

Required backend environment variables:

```dotenv
DATABASE_URL=...
API_KEY=...
```

Deployment configuration, health checks, and production verification will be finalized before publishing the service.

Do not place the backend API key in `VITE_*` variables or frontend source code.

## Engineering Documentation

- [Requirements](docs/REQUIREMENTS.md)
- [API Contract](docs/API_CONTRACT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database Design](docs/DATABASE_DESIGN.md)
- [Security](docs/SECURITY.md)
- [Testing Strategy](docs/TESTING_STRATEGY.md)
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md)
- [UML Diagrams](docs/UML_DIAGRAMS.md)
- [ERD](docs/ERD.md)

## Submission Checklist

- [x] Implement backend assessment Levels 1–5
- [x] Pass existing backend automated tests
- [x] Configure PostgreSQL and migrations
- [x] Pass Ruff lint and formatting checks
- [ ] Complete deployment-readiness verification
- [ ] Deploy backend over HTTPS
- [ ] Implement and deploy frontend
- [ ] Verify end-to-end booking workflows
- [ ] Provide repository access to assessors
- [ ] Record a walkthrough of no more than five minutes
- [ ] Submit deployment URLs and API credentials securely

## Security Notes

- Keep database credentials and API keys in environment variables.
- Never commit `.env` files.
- Do not expose shared API secrets in frontend JavaScript.
- Use a dedicated database for destructive tests.
- Treat `/reset` as a destructive endpoint and restrict its use appropriately outside the assessment environment.

## License

No license has been specified.

---

Developed as part of the Koya Academy Cohort 4 software engineering assessment.