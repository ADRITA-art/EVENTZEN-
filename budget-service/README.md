# EventZen Budget Tracking Microservice

*A finance-focused microservice implementing strict data ownership, transactional consistency, and controlled integration with the EventZen core backend.*

This document describes the Budget Service as a finance-focused microservice in the EventZen platform.

## 1. 🚀 Service Overview

The Budget Service solves a domain ownership problem common in event systems: financial planning and spend tracking should not be tightly coupled to operational event workflows.

What this service is responsible for:

- Budget baselines per event (`estimatedCost`, `totalBudget`)
- Real expense tracking (`Expense` rows)
- Financial outcome values (`remainingBudget`, `profit`)
- Revenue synchronization from the core booking domain

Why this is a separate microservice:

- Finance has a different rate of change than event operations
- Financial data needs stronger domain isolation and clearer ownership
- Separation reduces accidental coupling between booking logic and spending logic
- Independent deployment boundaries reduce blast radius for finance changes

## 2. 🧠 Architecture & Design Rationale

### Why Node.js + Express

- Lightweight runtime and fast API iteration for a focused internal service
- Simple middleware pipeline supports strict internal-auth guard rails
- Low operational overhead for a bounded finance domain

### Why PostgreSQL

- Strong relational semantics for monetary records and constrained updates
- Reliable transaction behavior for expense add/delete and `actualCost` updates
- Mature ecosystem for production operations and backups

### Why Sequelize

- Model-level constraints and validation for financial fields
- Transaction APIs used to keep `Expense` and `EventBudget.actualCost` in sync
- Faster development while retaining explicit table structure and constraints

### Why REST (and not async messaging yet)

- Immediate request/response feedback for finance synchronization success/failure
- Simpler operational model for current team size and scope
- Lower cognitive and infrastructure complexity than introducing broker infrastructure at this stage

Trade-off:

- Synchronous calls increase runtime dependency between services
- Future event-driven async patterns can improve resilience at higher scale

## 3. 🧩 Microservice Design Principles Applied

### Database-per-Service

- Budget Service owns its own PostgreSQL schema and lifecycle
- No shared tables with the core Spring backend

### Loose Coupling via `eventId`

- `eventId` is treated as an external reference key
- Core service owns event lifecycle and identity; Budget Service owns financial state

### No Cross-Service Foreign Keys (and Why It Matters)

- Avoids direct database coupling between services
- Preserves independent deployability and schema evolution
- Prevents runtime failures caused by cross-service database dependencies

## 4. 🔗 Inter-Service Communication

### Integration Model

- Frontend does not call Budget Service directly
- Spring core backend acts as orchestrator/proxy for finance operations
- Budget Service exposes internal APIs under `/api/*`

### Sync vs Async Trade-offs

- Current choice: synchronous REST calls from Spring to Budget Service
- Benefit: immediate consistency feedback for budget/revenue/expense operations
- Trade-off: reduced availability when Budget Service is temporarily unavailable

### Internal Service Authentication

- All `/api/*` routes are guarded by `Authorization: Internal-Service-Key <key>`
- Missing key configuration fails secure (`500`) to prevent unprotected operation
- Missing/invalid header returns `401`/`403`

## 5. 💰 Financial Domain Model (Core)

The core aggregate is `EventBudget` (one row per `eventId`), with `Expense` as a child stream of spend events.

### EventBudget fields

- `eventId`: external event reference, unique within finance domain
- `estimatedCost`: planning projection (venue/vendors and similar planning inputs)
- `totalBudget`: optional budget ceiling set by admin
- `actualCost`: realized spend derived from expense operations
- `revenue`: externally synchronized income from booking domain

### Expense fields

- `eventId`: event reference
- `category`: spend classification
- `amount`: monetary amount
- `description`: optional contextual note

Why `estimatedCost` is not enforced:

- It is a planning signal, not an execution gate
- Enforcing it as a hard cap would block legitimate operational expenses

Why `actualCost` is source of truth:

- `actualCost` is transactionally updated from persisted expense events
- It reflects realized spend, not projection assumptions

## 6. 🧮 Core Calculations & Invariants

Core formulas:

- `remainingBudget = totalBudget - actualCost` (null when `totalBudget` is null)
- `profit = revenue - actualCost`

Domain invariants:

- Exactly one `EventBudget` row per event (`eventId` unique)
- `actualCost` changes only through expense add/delete flows
- Monetary values are non-negative where required by model validation
- Expense delete path clamps `actualCost` to a minimum of `0.00`

## 7. 🔄 Data Consistency Strategy

This service maintains consistency without distributed transactions by combining local ACID transactions with explicit service boundaries.

How consistency is preserved:

- Expense creation and `actualCost` increment happen in one DB transaction
- Expense deletion and `actualCost` decrement happen in one DB transaction
- Row-level locking is used during mutation paths to reduce race conditions

Cross-service consistency model:

- Strong consistency inside Budget Service transaction boundaries
- Coordinated consistency with core backend through synchronous orchestration

Partial failure posture:

- If finance sync fails, caller can treat operation as failed and avoid silent divergence
- This favors consistency over availability in current architecture

The system prioritizes **consistency over availability** for financial correctness.

## 8. ⚠️ Failure Handling & Edge Cases

### Budget Service Unavailable

- Upstream orchestration calls fail fast
- This prevents successful operational mutations with missing financial synchronization
- No retry mechanism is implemented at this layer; retry responsibility lies with the calling service.

### Duplicate Requests

- Upsert endpoints (`/budget/estimate`, `/budget/set`, `/budget/revenue/:eventId`) are naturally overwrite-oriented
- Expense create is not idempotent by default and may duplicate spend if retried blindly

### Missing Budget Rows

- Summary endpoint returns `404` when no budget exists for event
- Expense add returns `404` if budget row does not exist
- Revenue and planning updates can initialize a budget row via upsert behavior

### Idempotency Concerns

- Revenue sync is overwrite-based and retry-safe for same target value
- Expense mutation paths need upstream retry discipline
- Recommended next step: idempotency keys for mutation endpoints

## 9. 🔐 Security Model

Current security controls:

- Internal shared-secret header (`Internal-Service-Key`) on all business endpoints
- No public route to mutate/read financial data from browsers
- `/health` remains open for liveness/readiness probing

Why frontend is blocked:

- Prevents exposing internal finance contracts and credentials
- Keeps policy enforcement centralized in core backend

Future hardening:

- mTLS between services
- API gateway policy enforcement
- Key rotation and secret management integration

## 10. 🗄️ Database Design

### `EventBudget` schema intent

- Finance summary aggregate keyed by unique `eventId`
- Stores planning (`estimatedCost`), governance (`totalBudget`), actuals (`actualCost`), and outcome input (`revenue`)

Why unique per event:

- Guarantees a single authoritative financial snapshot per event
- Simplifies upsert logic and summary query behavior

### `Expense` schema intent

- Append-style spend records with category/amount/description
- Enables audit-friendly spend history and ordered retrieval

Why `Expense` is separate from `EventBudget`:

- Preserves event-level financial summary while retaining line-item detail
- Supports recalculation and operational transparency

## 11. ⚙️ API Design Philosophy

### Why split endpoints (`/estimate`, `/set`, `/revenue`)

- Keeps intent explicit per financial operation
- Avoids ambiguous payload contracts in a single polymorphic endpoint
- Easier to validate and audit by action type

### Upsert Behavior Reasoning

- Allows core service orchestration without strict creation ordering
- Reduces integration fragility when lifecycle steps happen in different sequences

### REST Decisions

- Resource-oriented paths and predictable HTTP verbs
- Domain-aligned status code usage (`400/401/403/404/500`)
- Internal-only API surface under `/api` namespace

## 12. 🧱 Scalability & Performance Considerations

Current workload characteristics:

- Read-heavy summaries and expense listings for dashboards
- Write operations concentrated on expense ingestion and sync updates

Performance choices in current implementation:

- `eventId` uniqueness supports direct lookup efficiency
- Expense queries are ordered by `createdAt DESC` for recent-first views
- DB connection retry logic improves startup robustness in container environments

Near-term scaling strategy:

- Add explicit indexes on frequently queried columns (`EventBudget.eventId`, `Expense.eventId`, `Expense.createdAt`)
- Introduce connection pool tuning and query-level observability
- Consider read replicas and async projection when traffic justifies complexity

## 13. 📊 Observability & Monitoring

Current baseline:

- HTTP request logging via `morgan`
- Health endpoint (`GET /health`) for readiness/liveness checks
- Structured JSON error responses with consistent `message` field

Next observability layer:

- Centralized log aggregation (CloudWatch/ELK)
- Metrics collection and dashboards (Prometheus/Grafana)
- Distributed tracing for cross-service latency/failure analysis

## 14. 🐳 Deployment & Infrastructure

Container/runtime model:

- Service runs on Node 20 (Dockerfile based on `node:20-alpine`)
- Default service port: `8081`

Networking model:

- Intended for internal network communication with core backend
- In Docker Compose, service-to-service calls should use container DNS names

Operational startup behavior:

- Startup retries database connectivity (`DB_RETRY_COUNT`, `DB_RETRY_DELAY_MS`)
- Service exits if DB cannot be reached after retry budget

## 15. 🛠️ Local Setup (Step-by-Step)

1. Navigate to `budget-service/`.
2. Create `.env` with required variables:

```env
PORT=8081
DB_HOST=localhost
DB_PORT=5432
DB_NAME=budget_tracking
DB_USER=postgres
DB_PASSWORD=postgres
INTERNAL_SERVICE_KEY=eventzen-internal-service-key-change-me
DB_RETRY_COUNT=10
DB_RETRY_DELAY_MS=3000
```

3. Install dependencies:

```bash
npm install
```

4. Start service in development mode:

```bash
npm run dev
```

5. Verify health:

- `GET /health` should return `200` with `{ "status": "ok" }`

6. Run tests:

```bash
npm test
npm run test:unit
npm run test:integration
```

How environment variables are consumed:

- `dotenv` loads `.env` at startup in `src/app.js`
- Database config reads `DB_*` variables in `src/config/database.js`
- Server startup reads `PORT`, `DB_RETRY_COUNT`, and `DB_RETRY_DELAY_MS` in `src/server.js`
- Auth middleware reads `INTERNAL_SERVICE_KEY` in `src/middleware/internalAuth.js`

## 16. 🚧 Limitations & Assumptions

- `eventId` ownership is trusted from core backend; no direct cross-service referential validation
- Shared key auth is simpler than mutual identity systems and requires secure secret handling
- Expense create is not idempotent without caller coordination/idempotency keys
- Synchronous integration favors consistency but can reduce end-to-end availability
- `sequelize.sync({ alter: true })` is convenient for development but should be replaced by controlled migrations in strict production pipelines

## 17. 🚀 Future Enhancements

- Introduce migration-driven schema lifecycle (Sequelize migrations)
- Add idempotency key support for mutation endpoints
- Add async event-driven integration (outbox + message broker) for resilience
- Add reconciliation jobs between core booking revenue and finance snapshots
- Add mTLS/service identity and automated key rotation
- Expand observability with SLOs, error budgets, and trace-based alerting

## Service Folder Structure and Rationale

```text
budget-service/
	src/
		app.js                  # Express app wiring, middleware registration, route mounting
		server.js               # Bootstrap, DB connect/retry, and HTTP server startup
		config/
			database.js           # Sequelize/PostgreSQL connection configuration
		controllers/
			budget.controller.js  # HTTP handlers for budget endpoints and input validation
			expense.controller.js # HTTP handlers for expense endpoints and input validation
		middleware/
			internalAuth.js       # Internal service key authentication guard
		models/
			eventBudget.model.js  # Event-level finance aggregate model
			expense.model.js      # Expense line-item model
			index.js              # Model exports and Sequelize initialization glue
		routes/
			budget.routes.js      # Budget route definitions
			expense.routes.js     # Expense route definitions
		services/
			budget.service.js     # Core domain logic, transactions, and calculations
	tests/
		unit/                   # Unit tests for controllers, middleware, and services
		integration/            # End-to-end API behavior tests
	coverage/                 # Jest/Istanbul generated coverage reports
	Dockerfile                # Container image definition
	package.json              # Scripts, dependencies, and test config
	.env                      # Local runtime environment variables (not for commit)
```

Why this structure is followed:

- Keeps transport concerns (`routes/`, `controllers/`) separate from domain logic (`services/`).
- Isolates persistence contracts in `models/` and connection concerns in `config/`.
- Centralizes security boundary in `middleware/internalAuth.js` for all `/api` routes.
- Improves testability by mirroring runtime layers in `tests/unit` and `tests/integration`.

Tiny request lifecycle mapping:

- Request enters route in `src/routes/*.routes.js`
- Route dispatches to controller in `src/controllers/*.controller.js`
- Controller validates/parses input and calls service in `src/services/budget.service.js`
- Service executes domain logic and transactions using models in `src/models/*.model.js`
- Response is returned by controller as JSON with domain-appropriate status codes

---

## Quick Architectural Summary

Budget Service is the financial source of truth for EventZen event economics:

- Planning signal: `estimatedCost`
- Budget control: `totalBudget`
- Realized spend truth: `actualCost` from expenses
- Revenue input: synchronized from core booking domain
- Decision outputs: `remainingBudget` and `profit`
