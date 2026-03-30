# EventZen Core Backend (Spring Boot)

This document describes the **core Spring Boot service** of EventZen as a production-style backend system.

## 1. 🚀 Project Overview

EventZen solves a common operational gap in event platforms: business operations (events, venues, vendors, bookings) are often tightly coupled with finance logic, making evolution and scaling difficult.

The Spring Boot backend acts as the **central domain service** for EventZen and is responsible for:

- Identity and access control (Admin/Customer)
- Event lifecycle management
- Venue and vendor management
- Booking lifecycle and seat inventory control
- Integration orchestration with the external Budget microservice

Scope of this service:

- Owns operational workflows and access policies
- Exposes role-aware REST APIs consumed by the frontend
- Delegates financial state to Budget Service through controlled internal integration

Primary goals:

- Deliver secure role-based event operations for Admin and Customer personas
- Preserve domain consistency for scheduling, booking, and seat inventory
- Integrate financial tracking without coupling finance state into the core database
- Maintain a backend structure that is easy to extend, test, and operate in production

## 2. 🧠 System Architecture

### Why this architecture was chosen

The backend uses a **layered monolith architecture** because the core domain (events/bookings/users/venues/vendors) has tight transactional and policy coupling. This minimizes complexity while keeping boundaries explicit.

At the same time, finance is separated into a microservice due to different change velocity and fault domains.

In implementation terms, this is a **classic layered architecture** with strict separation of transport, domain logic, persistence, and external integration boundaries.

### Layered Architecture

- Controller layer:
  - HTTP contract, request validation trigger points (`@Valid`), endpoint role policy hooks (`@PreAuthorize`)
- Service layer:
  - Domain logic, invariants, orchestration, integration calls
- Repository layer:
  - JPA query abstraction and persistence access

### Microservice Interaction: Event Service ↔ Budget Service

The Spring backend integrates with Budget Service via REST (`BudgetClient`), including:

- estimated cost upsert
- total budget set
- expenses fetch/add/delete
- revenue sync

Communication pattern:

- Synchronous request-response for current implementation
- Spring is the integration boundary exposed to frontend
- Budget Service is treated as an internal dependency

### Why Finance is a Separate Microservice

- Different rate of change: budgeting and expense logic evolves independently from event operations
- Financial data isolation: finance workflows can be constrained and audited separately
- Independent scaling and failure boundaries for finance-heavy use cases
- Prevents accidental coupling of financial rules into booking and event lifecycle code

## 3. 🧩 Core Features

### Identity and Access

- Register and login with JWT issuance
- Role model: `ADMIN`, `CUSTOMER`
- Profile retrieval/update and password change

### Event Operations

- Create/update/cancel events
- Search/list/upcoming events
- Venue-scoped event retrieval
- Event status visibility management (`ACTIVE`, `SOLD_OUT` for read APIs)

### Resource Management

- Venue CRUD and search
- Vendor CRUD with soft-deactivation behavior
- Event-vendor mapping management (attach/list/remove)

### Booking Operations

- Customer booking creation and cancellation
- Admin booking oversight and status updates
- Per-event booking summary (capacity/booked/remaining)

### Financial Integration via Proxy APIs

- Admin budget endpoints under `/admin/budget/*`
- Internal delegation to Budget Service
- Real-time synchronization hooks on event, vendor, and booking lifecycle changes

### Operational and Platform Features

- Readiness endpoint (`/readiness`) includes budget dependency health signal
- Soft-delete semantics:
  - events are cancelled by status transition instead of hard delete
  - vendors are deactivated (`is_active=false`) instead of hard delete
- Deterministic status transitions for event availability (`ACTIVE` <-> `SOLD_OUT`)
- Centralized exception translation to consistent HTTP status behavior

## 4. 🔐 Security Design

### Authentication and Authorization

- Stateless authentication using JWT
- JWT filter (`OncePerRequestFilter`) validates token and populates security context
- Public routes: `/auth/register`, `/auth/login`, `/readiness`
- Route-level and method-level authorization with `@PreAuthorize`
- Admin operations restricted to `hasRole('ADMIN')`
- Customer booking operations restricted to `hasRole('CUSTOMER')`
- All non-public endpoints require authentication

### JWT Authentication

- Stateless authentication model
- JWT filter (`OncePerRequestFilter`) validates token and sets security context
- Public endpoints constrained to auth and readiness

Why JWT:

- Horizontal scalability without server-side session affinity
- Standardized API auth model for SPA frontend

### RBAC (Role-Based Access Control)

- Method-level role enforcement with `@PreAuthorize`
- Admin-only mutation endpoints for protected resources
- Customer-only booking actions for own lifecycle

Why RBAC:

- Explicit business authorization boundaries
- Readable policy mapping from endpoint to role intent

### Password Handling

- BCrypt password hashing through Spring `PasswordEncoder`
- Additional application-level salting via `PasswordSecurityService` (`auth.password.salt`)
- Legacy password verification/migration path

Why this choice:

- BCrypt is adaptive and industry-standard for password storage
- Salting increases resistance to precomputed hash attacks and supports controlled migration behavior
- Migration logic supports backwards compatibility without forcing account resets

## 5. ⚙️ Business Logic and Rules

EventZen enforces validation at DTO, service, and persistence levels.

### Input Validation (DTO-level)

- Required fields with `@NotNull` / `@NotBlank`
- Email format validation with `@Email`
- Numeric constraints such as `@Min` and `@DecimalMin`
- Size constraints for description/metadata fields

### Core Business Rules

### Capacity and Scheduling Rules

- Event `startTime` must be before `endTime`
- Event capacity cannot exceed selected venue capacity
- Event capacity cannot be reduced below already confirmed booked seats
- Venue overlap prevention for active events in same time window

### Booking Lifecycle Rules

- Booking allowed only for `ACTIVE` events
- Booking blocked for already-ended events
- Seat availability validated before confirmation
- Confirmed bookings decrement `ticketAvailable`
- Cancellation or status reversal restores availability when applicable
- Event transitions between `ACTIVE` and `SOLD_OUT` based on inventory

### Vendor Constraints

- Duplicate vendor IDs in attach payload rejected
- Duplicate event-vendor mapping rejected
- Only active vendors allowed for attachment
- Vendor mapping stores independent `purpose` + `cost`

### Data Consistency Guarantees

- Seat inventory and event status updated in step with booking mutations
- Estimated cost recomputed/synced after event/vendor changes
- Revenue recomputed/synced after booking state changes
- Controlled exception mapping for invalid/duplicate/missing resources

## 6. 🧮 Core Calculations

### Venue Cost

```text
durationMinutes = endTime - startTime
durationHours = durationMinutes / 60
venueCost = venue.pricePerHour * durationHours
```

Implementation notes:

- decimal arithmetic with controlled rounding
- computed at create/update event boundaries

### Booking Pricing

```text
pricePerTicket = event.ticketPrice
totalPrice = pricePerTicket * numberOfSeats
```

Implementation notes:

- price snapshot captured on booking record
- supports auditability when ticket price changes later

### Planning Cost Aggregation

```text
vendorCost = sum(eventVendor.cost)
totalCost = venueCost + vendorCost
```

- `totalCost` is synchronized as estimated cost to Budget Service

### Revenue Synchronization

```text
revenue = sum(booking.totalPrice where booking.status = CONFIRMED)
```

- recalculated and pushed on booking create/cancel/admin status transitions

## 7. 🔄 End-to-End Flows

### Customer Journey (Summary)

1. Register/login -> receive JWT
2. Browse events/venues/vendors
3. Create booking
4. Track/cancel own bookings
5. Maintain own profile/password

### Admin Journey (Summary)

1. Login as admin
2. Manage users/venues/vendors/events
3. Attach vendors to events
4. Monitor and update bookings
5. Manage budget and expense workflows through Spring proxy APIs

## 8. 🔌 API Design Philosophy

### REST Conventions

- Resource-centric paths (`/events`, `/bookings`, `/venues`, etc.)
- Clear role segregation using endpoint + method security
- Domain operations represented as explicit sub-resources when needed

### Status Code Strategy

- `200/201` success
- `400` validation/business input violations
- `401/403` authentication/authorization failures
- `404` missing resources/routes
- `409` conflicts (duplicates/overlaps)
- `503` downstream budget integration failures

### Idempotency Considerations

- `PUT` update operations are idempotent by intent
- `DELETE` cancel/remove operations are deterministic with guard checks
- Sync-style integration endpoints maintain eventual value overwrite semantics (e.g., revenue sync)

### Why These API Choices

- Why resource-based URLs:
  - Keeps API semantics aligned with domain nouns (`events`, `bookings`, `venues`) for maintainability and discoverability
- Why role-based filtering/security over separate endpoint trees:
  - Avoids duplicated controllers and DTO contracts while keeping authorization explicit at method boundary
- Why REST over GraphQL (current phase):
  - Predictable contract surface, simpler operational model, and lower complexity for current bounded domain and team size

### Idempotency Risks and Mitigations

- Revenue sync uses overwrite semantics, making retries safer for the same target state
- Booking mutations are guarded by status/inventory checks to prevent invalid duplicate transitions
- Remaining risk:
  - network retries across service boundaries can still produce repeated intent submissions without caller-side safeguards
- Future hardening:
  - idempotency keys for mutation endpoints and distributed retry scenarios

## 9. 🗄️ Database Design

### Core Entities

- `User`
- `Venue`
- `Vendor`
- `Event`
- `Booking`
- `EventVendor` (mapping entity)

### Relationships

- `Event` -> `Venue` (many-to-one)
- `Booking` -> `User` (many-to-one)
- `Booking` -> `Event` (many-to-one)
- `EventVendor` links `Event` and `Vendor`

### Why `EventVendor` is a join entity (not direct many-to-many)

The mapping carries domain attributes (`purpose`, `cost`) and lifecycle semantics. A plain many-to-many would lose this modeling fidelity.

Benefits:

- Stores per-assignment metadata
- Enforces uniqueness (`event_id`, `vendor_id`)
- Supports cost rollups and budget synchronization logic

## 10. 🧱 System Design Considerations

### Scalability

- Stateless JWT architecture supports horizontal scaling
- Clear domain boundaries allow extraction/evolution toward more services if required

### Consistency

- Core operational domain stays in one transactional backend
- Critical invariants (capacity, overlap, booking status transitions) enforced in service layer

### Fault Tolerance (Budget Service Dependency)

- Readiness endpoint checks budget service reachability
- Integration exceptions are surfaced as `503 Service Unavailable`
- Core service fails fast on financial sync failures to avoid silent divergence

Trade-off:

- Synchronous integration improves immediate consistency but increases runtime dependency coupling

### Failure Handling Strategy

- If Budget Service is unavailable:
  - event and booking operations that require financial synchronization fail with `503`
  - prevents silent financial divergence between core and budget domains
- Trade-off:
  - reduced availability in exchange for stronger cross-service consistency guarantees
- Future improvement:
  - retry queue and/or asynchronous fallback model for controlled degradation

### Consistency Model

- Strong consistency within core service transactions (users/events/bookings/vendors)
- Eventual consistency across service boundaries (core domain ↔ budget domain)
- Current control mechanism:
  - synchronous integration calls to minimize drift windows
- Future direction:
  - asynchronous event-driven synchronization with reconciliation policies

### Architectural Trade-offs

- Synchronous vs asynchronous integration:
  - Chosen: synchronous REST
  - Benefit: immediate visibility of financial sync success/failure
  - Trade-off: tight runtime dependency on Budget Service
- Layered monolith vs full microservices for core domain:
  - Chosen: layered monolith for event/booking/user/venue/vendor core
  - Benefit: stronger transactional consistency and simpler operational overhead
  - Trade-off: reduced independent scalability per sub-domain
- JWT vs session-based authentication:
  - Chosen: JWT
  - Benefit: stateless horizontal scaling and frontend-friendly API auth
  - Trade-off: token invalidation/revocation lifecycle is more complex than server-side sessions

## 11. 🐳 Deployment and Infrastructure

### Containerization

- Backend ships with Dockerfile (multi-stage Maven build)
- Root compose orchestrates full platform stack

### Ports (Default)

- Spring backend: `8080`
- Frontend: `3000`
- MySQL: `3306`
- Budget service internal service port: `8081`

### Inter-Service Communication

- In Docker, backend reaches budget service by service DNS name (e.g., `budget-service`)
- Integration base URL controlled via env/property configuration

## 12. 🛠️ Local Setup Guide

### Prerequisites

- Java 17+
- Maven 3.9+
- MySQL 8+

### Backend Local Run (only Spring service)

1. Navigate to `eventzen/`
2. Create `.env` from `.env.example`
3. Ensure MySQL schema/user credentials exist
4. Run:

```bash
mvn clean install
mvn spring-boot:run
```

### Environment Variables (`.env`) and How They Are Loaded

Recommended local `.env` (in `eventzen/`):

```properties
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/eventzen?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=eventzen
SPRING_DATASOURCE_PASSWORD=YourStrongDBPassword

JWT_SECRET=YourLongRandomJWTSecret
JWT_EXPIRATION=86400000

APP_CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Budget integration (recommended to set explicitly)
BUDGET_SERVICE_BASE_URL=http://localhost:4001
INTERNAL_SERVICE_KEY=your-internal-service-key

# Password hardening salt (change for non-dev use)
PASSWORD_SALT=dev-static-salt-change-me

# Optional Hikari tuning
SPRING_TIMEOUT=1

# Used by docker-compose db service
MYSQL_ROOT_PASSWORD=YourStrongRootPassword
MYSQL_DATABASE=eventzen
MYSQL_USER=eventzen
MYSQL_PASSWORD=YourStrongDBPassword
```

How EventZen fetches values from `.env`:

1. `spring.config.import=optional:file:.env[.properties]` in `src/main/resources/application.properties` loads `.env` from the backend working directory.
2. Spring property placeholders map env variables into app properties, for example:
  - `spring.datasource.url=${SPRING_DATASOURCE_URL}`
  - `jwt.secret=${JWT_SECRET}`
  - `budget.service.base-url=${BUDGET_SERVICE_BASE_URL:http://localhost:4001}`
  - `budget.service.internal-key=${INTERNAL_SERVICE_KEY:present-in-env}`
  - `auth.password.salt=${PASSWORD_SALT:dev-static-salt-change-me}`
3. Beans then consume those properties via `@Value(...)`, e.g.:
  - `SecurityConfig` reads CORS origins
  - `JwtService` reads JWT secret and expiration
  - `BudgetClient` reads budget base URL and internal service key
  - `PasswordSecurityService` reads password salt

Important behavior:

- If a variable has a default (`${VAR:default}`), Spring uses the default when missing.
- If no default is defined (for example `jwt.secret`), startup fails when missing.
- Keep secrets out of version control; commit only `.env.example`.

### Running Tests (Unit + Integration)

From `eventzen/`:

```bash
# Run full test suite
mvn test

# Run only unit/controller/service style tests
mvn -Dtest='*Test' test

# Run integration-focused tests
mvn -Dtest='*IntegrationTest' test
```

Windows PowerShell (from repository root):

```powershell
# Run full test suite
Push-Location eventzen; .\mvnw.cmd test; Pop-Location

# Run only unit/controller/service style tests
Push-Location eventzen; .\mvnw.cmd "-Dtest=*Test" test; Pop-Location

# Run integration-focused tests
Push-Location eventzen; .\mvnw.cmd "-Dtest=*IntegrationTest" test; Pop-Location
```

Note:

- Integration test naming follows `*IntegrationTest` pattern in this codebase.
- If using H2-based test profile, ensure test properties align with the documented SQL-init assumptions.

### Full Stack via Docker Compose (recommended)

From repository root:

```bash
docker compose up --build
```

## 13. 📊 Observability and Monitoring

Current observability features:

- Structured logging patterns for request and error traceability
- Readiness endpoint (`/readiness`) includes Budget Service dependency health
- Explicit exception-to-status mapping improves debuggability and operational triage

To be integrated in future iterations:

- Distributed tracing (OpenTelemetry)
- Metrics dashboards (Prometheus/Grafana)
- Centralized logs (ELK/CloudWatch)

## 14. 🚧 Limitations and Assumptions

- Event timing assumes same-date start/end windows
- Synchronous budget calls can increase latency and dependency sensitivity
- No asynchronous compensation workflow for downstream failures yet
- Limited built-in telemetry/metrics in current baseline
- API versioning strategy not yet formalized

## 15. 🚀 Future Improvements

- Async integration events (Kafka/RabbitMQ) for resilient cross-service synchronization
- Distributed tracing and structured metrics dashboards
- Rate limiting, audit trails, and security hardening layers
- Advanced reporting and analytics projections
- Service decomposition only where coupling metrics justify split

---

## Spring Boot Folder Structure and Rationale

```text
src/main/java/com/adrita/eventzen/
  config/        # Security, application-level beans, infrastructure wiring
  controller/    # REST controllers (HTTP boundary)
  dto/           # Request/response contracts and validation models
  entity/        # JPA entities and persistence mapping
  exception/     # Centralized exception model and handlers
  integration/   # External service clients (Budget Service boundary)
  repository/    # Spring Data repositories
  security/      # JWT filter/service and password security helpers
  service/       # Domain/business logic
  EventzenApplication.java

src/main/resources/
  application.properties
  schema.sql
```

Why this structure is followed:

- Enforces clean separation between transport, domain, persistence, and integration concerns
- Improves testability (service logic isolated from controllers)
- Keeps integration side effects explicit (`integration/` boundary)
- Scales better for onboarding and code ownership in multi-developer teams
