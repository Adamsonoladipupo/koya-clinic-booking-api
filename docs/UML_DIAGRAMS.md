# UML diagrams

These are conceptual designs, not claims about classes already implemented. GitHub renders Mermaid diagrams.

## UML class diagram

```mermaid
classDiagram
  class AppointmentSlot {
    +str id
    +str provider
    +datetime starts_at
    +datetime ends_at
  }
  class Booking {
    +UUID id
    +str slot_id
    +str name
    +str email
    +str status
    +datetime created_at
  }
  class IdempotencyRecord {
    +str key
    +str request_hash
    +int response_status
    +dict response_body
    +datetime created_at
  }
  class BookingAttempt {
    +int id
    +str email
    +datetime attempted_at
  }
  class BookingService {
    +create_booking(payload, key)
    +get_booking(id)
    +list_bookings(email, limit, cursor)
    +cancel_booking(id)
  }
  class SlotService {
    +reset(slots)
    +list_slots(provider)
  }
  class ApiKeyAuth {
    +authenticate(header)
  }
  class RateLimiter {
    +check_and_record(email)
  }
  AppointmentSlot "1" --> "0..*" Booking : has history
  BookingService ..> Booking : manages
  BookingService ..> IdempotencyRecord : replays
  BookingService ..> RateLimiter : checks
  RateLimiter ..> BookingAttempt : records
  SlotService ..> AppointmentSlot : manages
  BookingService ..> ApiKeyAuth : protected by
```

## Component diagram

```mermaid
flowchart TB
  UI[React Web UI] --> Proxy[Vercel API Proxy]
  Proxy --> Router[FastAPI Router]
  External[External API Client] --> Router
  Router --> Auth[API Key Auth]
  Router --> Slots[Slot Service]
  Router --> Bookings[Booking Service]
  Bookings --> Limit[Rate Limiter]
  Slots --> ORM[SQLAlchemy]
  Bookings --> ORM
  Limit --> ORM
  ORM --> DB[(PostgreSQL)]
```

## Sequence: two patients book same slot

```mermaid
sequenceDiagram
  participant A as Patient A
  participant B as Patient B
  participant API as FastAPI
  participant DB as PostgreSQL
  par Request A
    A->>API: POST /bookings (slot s1)
    API->>DB: INSERT confirmed booking
  and Request B
    B->>API: POST /bookings (slot s1)
    API->>DB: INSERT confirmed booking
  end
  DB-->>API: One insert commits; one unique conflict
  API-->>A: 201 if A won, otherwise 409
  API-->>B: 201 if B won, otherwise 409
```

## Sequence: cancellation

```mermaid
sequenceDiagram
  participant C as Client
  participant API as FastAPI
  participant DB as PostgreSQL
  C->>API: DELETE /bookings/{id}
  API->>DB: Lock booking row in transaction
  alt Booking confirmed
    API->>DB: UPDATE status = cancelled
    DB-->>API: Commit
    API-->>C: 200 cancelled booking
  else Already cancelled
    API-->>C: 409 error
  else Not found
    API-->>C: 404 error
  end
```
