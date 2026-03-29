# EventZen Budget Tracking Microservice

A dedicated financial microservice for EventZen that manages event budgets, expenses, and profitability metrics.

## 1. Service Overview

The Budget Tracking Microservice is an independent backend service responsible for financial tracking in EventZen.

Its purpose is to:

- Store and update budget baselines per event.
- Track real expenses as they occur.
- Keep financial summaries consistent and queryable.
- Compute key outputs such as remaining budget and profit.

Role in the EventZen ecosystem:

- Event and booking operations happen in the Spring Boot core backend.
- Financial state is managed in this service only.
- Spring backend calls this service internally and exposes controlled proxy endpoints to the frontend.

This service is intentionally isolated so financial logic and financial data ownership are not mixed with core event domain logic.

## 2. Architecture

### Service Style

- Standalone Node.js service using Express.
- Persistence layer implemented with Sequelize ORM.
- PostgreSQL-backed storage for financial records.

### Database Separation

This service owns its own database schema and tables:

- No direct foreign keys to Spring core service tables.
- Event IDs are treated as external references (trusted inputs from core backend).

### Communication Pattern

- REST-based service-to-service communication.
- Core Spring Boot backend invokes Budget Service endpoints over internal URLs.
- Budget Service is protected by an internal service key header.

### Database-per-Service Pattern

This microservice follows database-per-service principles:

- Independent deployment and schema evolution.
- No cross-service joins.
- Strong data ownership boundaries for finance domain.

## 3. Core Financial Model (Critical)

Each event has a financial snapshot in EventBudget.

### Definitions

- Total Budget: Admin-defined spending ceiling. It can be null when not set yet.
- Estimated Cost: Planning estimate from event setup (venue plus vendor costs).
- Actual Cost: Source-of-truth expense total derived from expense operations.
- Revenue: External input from booking system via core backend sync.
- Remaining Budget: Unspent budget capacity (if total budget exists).
- Profit: Net outcome from revenue minus actual cost.

### Formulas

- Remaining Budget = totalBudget - actualCost
- Profit = revenue - actualCost

### Important Semantics

- Estimated Cost is advisory and planning-oriented, not a hard constraint.
- Actual Cost is authoritative for realized spending.
- Revenue is externally synchronized input, not computed internally from bookings.

### Example

Assume:

- totalBudget = 10000.00
- estimatedCost = 7200.00
- actualCost = 6400.00
- revenue = 9500.00

Then:

- remainingBudget = 10000.00 - 6400.00 = 3600.00
- profit = 9500.00 - 6400.00 = 3100.00

If totalBudget is not set, remainingBudget is returned as null.

## 4. Features and Capabilities

- Create or update estimated event cost from planning updates.
- Set or update total budget per event.
- Sync revenue values from booking flow.
- Add expenses per event and maintain consistent actualCost.
- List expenses by event, ordered by newest first.
- Delete expense entries and automatically reverse actualCost impact.
- Return summarized finance view per event (budget, costs, revenue, remaining budget, profit).
- Guard all finance APIs behind internal-only authentication.
- Health endpoint for service/container readiness checks.

## 5. API Documentation

Base path for protected APIs: /api

Authentication required on all /api routes:

- Header: Authorization: Internal-Service-Key <key>

Note on endpoint naming:

- In this implementation, budget create/update behavior is split across specific endpoints:
  - /api/budget/estimate for estimated planning cost
  - /api/budget/set for total budget
  - /api/budget/revenue/:eventId for revenue sync

### A. Internal Admin APIs (used via Spring backend proxy)

#### 1) Upsert Estimated Budget Input

- Method: POST
- Endpoint: /api/budget/estimate
- Description: Creates EventBudget when missing or updates estimatedCost when present.

Request body example:

```json
{
  "eventId": 101,
  "estimatedCost": 7200.50
}
```

Response example:

```json
{
  "id": 1,
  "eventId": 101,
  "estimatedCost": "7200.50",
  "totalBudget": null,
  "actualCost": "0.00",
  "revenue": "0.00",
  "createdAt": "2026-03-29T10:10:10.000Z"
}
```

#### 2) Set Total Budget

- Method: POST
- Endpoint: /api/budget/set
- Description: Creates EventBudget when missing or updates totalBudget when present.

Request body example:

```json
{
  "eventId": 101,
  "totalBudget": 10000
}
```

Response example:

```json
{
  "id": 1,
  "eventId": 101,
  "estimatedCost": "7200.50",
  "totalBudget": "10000.00",
  "actualCost": "0.00",
  "revenue": "0.00",
  "createdAt": "2026-03-29T10:10:10.000Z"
}
```

#### 3) Sync Revenue

- Method: PUT
- Endpoint: /api/budget/revenue/:eventId
- Description: Sets current revenue for the event (upsert behavior if budget row is missing).

Request body example:

```json
{
  "revenue": 12500.75
}
```

Response example:

```json
{
  "id": 1,
  "eventId": 101,
  "estimatedCost": "7200.50",
  "totalBudget": "10000.00",
  "actualCost": "6400.00",
  "revenue": "12500.75",
  "createdAt": "2026-03-29T10:10:10.000Z"
}
```

#### 4) Get Budget Summary

- Method: GET
- Endpoint: /api/budget/:eventId
- Description: Returns financial summary including derived values.

Response example:

```json
{
  "eventId": 101,
  "totalBudget": "10000.00",
  "estimatedCost": "7200.50",
  "actualCost": "6400.00",
  "revenue": "12500.75",
  "remainingBudget": "3600.00",
  "profit": "6100.75"
}
```

#### 5) Add Expense

- Method: POST
- Endpoint: /api/expense
- Description: Adds an expense row and increments actualCost in one transaction.

Request body example:

```json
{
  "eventId": 101,
  "category": "Catering",
  "amount": 850.25,
  "description": "Lunch for attendees"
}
```

Response example:

```json
{
  "id": 14,
  "eventId": 101,
  "category": "Catering",
  "amount": "850.25",
  "description": "Lunch for attendees",
  "createdAt": "2026-03-29T12:30:00.000Z"
}
```

#### 6) List Expenses by Event

- Method: GET
- Endpoint: /api/expense/event/:eventId
- Description: Returns expense entries for event in descending created time.

Response example:

```json
[
  {
    "id": 14,
    "eventId": 101,
    "category": "Catering",
    "amount": "850.25",
    "description": "Lunch for attendees",
    "createdAt": "2026-03-29T12:30:00.000Z"
  }
]
```

#### 7) Delete Expense

- Method: DELETE
- Endpoint: /api/expense/:id
- Description: Deletes expense and decrements actualCost in one transaction.

Response example:

```json
{
  "message": "Expense deleted successfully",
  "eventId": 101,
  "actualCost": "5550.00"
}
```

### Mapping to Requested API Labels

If using higher-level labels in architecture docs, these conceptual mappings apply:

- POST /api/budget  -> implemented as POST /api/budget/estimate and POST /api/budget/set
- GET /api/budget/{eventId} -> implemented as GET /api/budget/:eventId
- POST /api/expense -> implemented as POST /api/expense
- GET /api/expense/event/{eventId} -> implemented as GET /api/expense/event/:eventId
- DELETE /api/expense/{id} -> implemented as DELETE /api/expense/:id

## 6. Validations and Business Rules (Critical)

### Request Validation

- eventId must be a positive integer.
- estimatedCost, totalBudget, and revenue must be numbers >= 0.
- expense amount must be a number > 0.
- category is required and cannot be blank.

### Business Rules

- Only one budget row per event:
  - Enforced via unique constraint on EventBudget.eventId.
- Prevent duplicate budget creation:
  - Upsert logic checks existing row by eventId before create.
- Handling missing budget scenarios:
  - get budget summary for unknown eventId returns 404.
  - add expense without budget returns 404.
  - revenue or estimate sync can initialize budget record if missing.
- Consistency of actualCost:
  - add expense increases actualCost.
  - delete expense decreases actualCost.
  - actualCost never becomes negative (clamped at 0.00 on delete path).
- Cannot delete non-existing expense:
  - returns 404 with explicit message.
- EventId validity trust model:
  - service validates eventId format/range but trusts business ownership from core backend.

## 7. Integration with Core Backend (Very Important)

### Integration Model

- Frontend does not call Budget Service directly.
- Spring Boot backend acts as integration proxy/orchestrator.
- Calls are made over internal network URLs (for example Docker service hostname).

### Real System Flows

#### Flow A: Event Creation or Update -> Estimated Cost Sync

1. Admin creates or updates event planning in Spring backend.
2. Spring computes planning totals from venue and vendors.
3. Spring calls Budget Service endpoint: POST /api/budget/estimate.
4. Budget Service upserts EventBudget.estimatedCost.

#### Flow B: Expense Addition -> Actual Cost Update

1. Admin adds expense through Spring proxy endpoint.
2. Spring forwards to Budget Service endpoint: POST /api/expense.
3. Budget Service inserts Expense row and updates EventBudget.actualCost in one transaction.
4. Updated summary becomes available through GET /api/budget/:eventId.

#### Flow C: Booking Confirmation Changes -> Revenue Sync

1. Booking totals change in Spring backend.
2. Spring computes confirmed revenue aggregate.
3. Spring calls Budget Service endpoint: PUT /api/budget/revenue/:eventId.
4. Budget Service updates EventBudget.revenue.

### Docker Networking Context

In containerized setup:

- Spring uses internal service name for Budget Service base URL.
- Budget Service and Spring communicate inside Docker network.
- Budget Service is not required to be publicly exposed for frontend usage.

## 8. Security

- Internal service model: budget APIs are protected by internal auth middleware.
- Required header format:
  - Authorization: Internal-Service-Key <INTERNAL_SERVICE_KEY>
- Missing key configuration returns server error (500) to prevent unsecured operation.
- Missing/invalid header returns 401 or 403.
- No direct frontend integration path by design.
- Can be extended with stronger service auth (mTLS, rotating API keys, service identity, gateway policy).

## 9. Database Design

### Table: EventBudget

- id: integer primary key
- eventId: integer, unique, required
- totalBudget: decimal(12,2), nullable
- estimatedCost: decimal(12,2), required, default 0
- actualCost: decimal(12,2), required, default 0
- revenue: decimal(12,2), required, default 0
- createdAt: timestamp

### Table: Expense

- id: integer primary key
- eventId: integer, required
- category: string, required
- amount: decimal(12,2), required
- description: string, nullable
- createdAt: timestamp

### Why No Foreign Keys to Core Service

No cross-service foreign key is used to preserve microservice independence:

- Independent schema lifecycle.
- No runtime coupling to core DB availability.
- Clear ownership boundary for financial data.

## 10. Error Handling

### Response Style

Error responses are JSON with message field:

```json
{
  "message": "Descriptive error message"
}
```

### Common Cases

- 400: invalid payload values (invalid eventId, invalid amount, missing category).
- 401: missing internal authorization header.
- 403: invalid internal service key.
- 404: missing budget or expense not found.
- 500: internal key not configured or unhandled server failure.

### Behavior Notes

- Missing budget for summary endpoint returns graceful 404.
- Transactional paths protect consistency for expense add/delete operations.
- HTTP logging enabled via morgan for debugging and traceability.

## 11. Setup and Installation

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or compatible)
- Docker (optional)

### Environment Variables

Create .env in budget-service directory:

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

### Run Locally

```bash
npm install
npm run dev
```

Or production mode:

```bash
npm start
```

Health check:

- GET /health -> 200 {"status":"ok"}

### Test Commands

```bash
npm test
npm run test:unit
npm run test:integration
```

### Docker Setup

Build and run single service:

```bash
docker build -t eventzen-budget-service .
docker run --env-file .env -p 8081:8081 eventzen-budget-service
```

Run with full EventZen stack from repository root:

```bash
docker compose up --build
```

## 12. Tech Stack

- Node.js (Express)
- Sequelize ORM
- PostgreSQL
- REST APIs
- Docker
- Jest and Supertest for testing

## 13. Future Enhancements

- Async communication via Kafka or RabbitMQ for budget and revenue events.
- Financial analytics features (burn rate, run-rate forecasting, variance trends).
- Alerting for threshold breaches and budget overflow risk.
- Idempotency keys for safer retries in distributed workflows.
- Versioned API contracts for long-term integration stability.
- Richer audit trails and immutable financial event logs.

---

## Quick Summary

This service is the financial source of truth for EventZen event economics:

- Planning input: estimatedCost
- Real spend source of truth: actualCost from expenses
- External income input: revenue from booking sync
- Decision metrics: remainingBudget and profit
