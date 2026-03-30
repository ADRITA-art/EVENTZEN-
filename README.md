# EventZen: Full-Stack Event Management Platform

EventZen is a full-stack, role-aware event management platform that combines a Spring Boot core backend, a dedicated budget tracking microservice, and a React frontend.

## 1. 🚀 Project Overview

EventZen solves a common platform problem: operational event workflows (users, venues, vendors, bookings) and financial workflows (budget, expenses, profitability) evolve at different speeds but still need controlled integration.

What EventZen provides:

- End-to-end event operations for Admin and Customer personas
- Booking lifecycle and event availability handling
- Financial tracking through a dedicated budget domain service
- Containerized local execution for full-system testing

High-level system idea:

- Frontend provides all user interactions
- Spring Boot backend is the primary domain and security boundary
- Budget microservice owns finance-specific state and calculations

## 2. 🧠 System Architecture

### Core components

- Frontend (`frontend`): React + Vite client, role-based routing and UI workflows
- Core backend (`eventzen`): Spring Boot API for auth, users, venues, vendors, events, bookings, and budget orchestration
- Budget service (`budget-service`): Node.js + Express service for finance data (`estimatedCost`, `totalBudget`, `actualCost`, `revenue`, expenses)

### Databases

- MySQL: core backend operational data
- PostgreSQL: budget service financial data

### High-level flow

```text
Frontend -> Spring Boot -> MySQL
Frontend -> Spring Boot -> Budget Service -> PostgreSQL
```

### Why this architecture was chosen

- Strong transactional consistency for core operational domain in one backend
- Clear microservice boundary for financial logic and data ownership
- Reduced accidental coupling between booking logic and budget correctness
- Better long-term scalability and team ownership separation

## 3. 🧩 Microservices Design

### Why budget is separate

- Finance has a different change cadence than event operations
- Financial calculations and expense consistency require focused domain ownership
- Isolated failure domain for finance-related operations

### Database-per-service

- Core backend owns MySQL schema
- Budget service owns PostgreSQL schema
- No shared tables between services

### Loose coupling via `eventId`

- Budget service references events by `eventId` from core backend
- No cross-service foreign keys are used
- Integration stays contract-driven instead of DB-coupled

## 4. 🔗 Inter-Service Communication

### Communication model

- REST calls between Spring Boot and Budget Service
- Frontend calls Spring APIs only
- Budget APIs are internal and protected by internal service key middleware

### Why frontend does not call budget service directly

- Prevents exposing internal service authorization semantics to browsers
- Keeps policy and business orchestration centralized in Spring backend
- Simplifies frontend contracts and reduces coupling

### Sync vs async trade-offs

- Current choice: synchronous REST
- Benefit: immediate success/failure feedback and tighter consistency at mutation time
- Trade-off: runtime dependency on budget service availability
- Future path: async messaging for resilience and retry buffering

## 5. 📊 Data Flow (Very Important)

### Operational flow

```text
User -> Frontend -> Spring Boot -> MySQL
```

### Financial flow

```text
Admin action -> Frontend -> Spring Boot -> Budget Service -> PostgreSQL
```

### Responsibility separation

- Frontend: presentation, role-aware UX, input validation
- Spring backend: auth, RBAC, operational rules, orchestration
- Budget service: financial aggregates, expense transactions, profitability outputs

## 6. 🔐 Security Overview

- JWT authentication in Spring backend for user sessions
- RBAC enforcement (Admin vs Customer) via backend authorization rules
- Internal service key required for budget service `/api/*` routes
- Budget service is intentionally protected from direct public/frontend access

Why budget service is protected:

- Preserves internal trust boundary
- Prevents bypass of core backend policy/orchestration logic
- Reduces attack surface on financial mutation endpoints

## 7. ⚙️ Complete Setup Guide

This section is intentionally explicit so onboarding is zero-confusion.

### Step 1: Clone the repository

```bash
git clone <your-github-repository-url>
cd eventzen
```

### Step 2: Environment configuration

Create environment files in the exact locations below.

#### Backend (`.env` in `/eventzen`)

File path: `eventzen/.env`

Recommended Docker Compose-ready example:

```env
# Spring datasource (backend -> MySQL container)
SPRING_DATASOURCE_URL=jdbc:mysql://db:3306/eventzen?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=eventzen
SPRING_DATASOURCE_PASSWORD=YourStrongDBPassword

# JWT
JWT_SECRET=YourLongRandomJWTSecret
JWT_EXPIRATION=86400000

# CORS for frontend origins
APP_CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Backend -> Budget Service integration
BUDGET_SERVICE_BASE_URL=http://budget-service:8081
INTERNAL_SERVICE_KEY=eventzen-internal-service-key-change-me

# Optional password hardening salt in backend
PASSWORD_SALT=change-me-for-non-dev

# Used by docker-compose MySQL service
MYSQL_ROOT_PASSWORD=YourStrongRootPassword
MYSQL_DATABASE=eventzen
MYSQL_USER=eventzen
MYSQL_PASSWORD=YourStrongDBPassword
```

What each backend variable means:

- `SPRING_DATASOURCE_URL`: JDBC URL for backend database connection
- `SPRING_DATASOURCE_USERNAME` / `SPRING_DATASOURCE_PASSWORD`: backend DB credentials
- `JWT_SECRET`: signing key for JWT tokens
- `JWT_EXPIRATION`: token expiry in milliseconds
- `APP_CORS_ALLOWED_ORIGINS`: allowed frontend origins for browser requests
- `BUDGET_SERVICE_BASE_URL`: internal URL Spring uses to call budget service
- `INTERNAL_SERVICE_KEY`: shared key sent from Spring to budget service
- `PASSWORD_SALT`: extra app-level salt used in backend password handling
- `MYSQL_*`: initialization values consumed by MySQL container

#### Frontend (`.env` in `/frontend`)

File path: `frontend/.env`

```env
VITE_API_URL=http://localhost:8080
```

Why this is needed:

- It tells the frontend where the Spring API is reachable from the browser
- Keeps API host configurable across local/staging/production environments

#### Budget Service (`.env` in `/budget-service`)

File path: `budget-service/.env`

```env
PORT=8081
DB_HOST=budget-db
DB_PORT=5432
DB_NAME=budget_tracking
DB_USER=postgres
DB_PASSWORD=postgres
INTERNAL_SERVICE_KEY=eventzen-internal-service-key-change-me
DB_RETRY_COUNT=12
DB_RETRY_DELAY_MS=3000
```

What each budget variable means:

- `PORT`: budget service listen port
- `DB_HOST` / `DB_PORT`: PostgreSQL host and port
- `DB_NAME` / `DB_USER` / `DB_PASSWORD`: PostgreSQL connection credentials
- `INTERNAL_SERVICE_KEY`: must match backend key for internal API authorization
- `DB_RETRY_COUNT` / `DB_RETRY_DELAY_MS`: startup DB retry strategy

Important note for Docker Compose:

- `budget-service` values are currently defined in `docker-compose.yml`
- Ensure `INTERNAL_SERVICE_KEY` used by backend and budget service is the same value

### Step 3: Docker setup (critical)

Run from repository root:

```bash
docker compose up --build
```

What happens internally:

- Builds and starts frontend, backend, and budget-service containers
- Starts MySQL (`db`) and PostgreSQL (`budget-db`) containers
- Applies service dependency order and health checks
- Connects services on internal Docker network for inter-service calls

### Step 4: Access the application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

### Step 5: Verify everything works

Use this verification checklist:

1. Open frontend and register/login successfully.
2. As admin, create an event.
3. Open admin event budget modal, set total budget, add an expense.
4. Confirm budget summary updates (actual cost/remaining budget/profit path).
5. Confirm backend readiness endpoint: `GET http://localhost:8080/readiness`.
6. Confirm budget service health from inside compose network:
  - `docker compose exec budget-service wget -qO- http://localhost:8081/health`

If steps 1-6 pass, end-to-end platform integration is working.

## 8. 🐳 Docker Architecture

Services in `docker-compose.yml`:

- `frontend`: React app served by Nginx, host port `3000`
- `backend`: Spring Boot API, host port `8080`
- `db`: MySQL, host port `3306`
- `budget-service`: finance microservice, internal container port `8081`
- `budget-db`: PostgreSQL for budget service

Port mapping summary:

- `3000 -> frontend`
- `8080 -> backend`
- `3306 -> mysql`
- `8081 -> budget-service` (container-internal in current compose; not published to host)

Internal networking:

- Containers communicate by service name (`backend`, `budget-service`, `db`, `budget-db`)
- Backend calls budget service over internal URL (`http://budget-service:8081`)
- Budget service calls PostgreSQL via `budget-db:5432`

## 9. 📁 Project Structure (Root Level)

```text
frontend/         # React UI application (routing, UX, API consumption)
eventzen/         # Spring Boot core backend (auth, RBAC, operational domain, orchestration)
budget-service/   # Node/Express financial microservice (budgets, expenses, profitability)
docker-compose.yml # Multi-container orchestration for local full-stack execution
```

Why this structure is effective:

- Clear service boundaries and ownership lines
- Independent runtime concerns per service
- Easier onboarding and debugging by subsystem

## 10. ⚠️ System Design Considerations

- Consistency vs availability:
  - Current synchronous integration favors financial consistency over partial availability
- Sync vs async:
  - Sync REST keeps flow simple now; async messaging is a future resilience upgrade
- Microservice boundaries:
  - Finance is separated to protect domain ownership and reduce cross-domain coupling

## 11. 📊 Observability (Brief)

Current baseline:

- Container logs via Docker for each service
- Backend readiness endpoint: `/readiness`
- Budget service health endpoint: `/health`

Practical use:

- Monitor startup and integration issues quickly via `docker compose logs`
- Use health/readiness endpoints for basic liveness checks

## 12. 🚧 Limitations

- No async broker-based messaging yet between backend and budget service
- No built-in retry queue at integration boundary
- Budget service auth currently uses shared internal key (not mTLS/service identity)
- Frontend auth token persistence uses localStorage trade-off model
- Limited centralized metrics/tracing in current baseline

## 13. 🚀 Future Improvements

- Introduce async eventing (Kafka/RabbitMQ) for resilient cross-service synchronization
- Add distributed tracing and metrics dashboards (OpenTelemetry + Prometheus/Grafana)
- Add stronger service-to-service auth (mTLS, rotating secrets, gateway policies)
- Add reconciliation jobs for finance/booking drift detection
- Add autoscaling and performance SLO instrumentation per service

---

## Submission Summary

EventZen demonstrates a pragmatic hybrid architecture:

- Role-aware frontend for operational workflows
- Strong Spring backend orchestration for core business rules and security
- Dedicated budget microservice for financial correctness and domain isolation
- Docker-based reproducible setup suitable for evaluation and onboarding
