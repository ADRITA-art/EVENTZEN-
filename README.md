# EventZen: Full-Stack Event Management Platform

EventZen is a full-stack event management platform built with a hybrid architecture: a Spring Boot core backend plus an independent budget tracking microservice, served through a React frontend.

## 1. Project Overview

EventZen is designed to support complete event operations across planning, execution, and financial tracking.

Core system purpose:

- Manage users with role-based access (Admin and Customer)
- Manage venues and vendors
- Create, update, and monitor events
- Handle ticket bookings and booking administration
- Track event budgets, expenses, revenue, and profitability

This is a full-stack application with microservices:

- Frontend: React application for all user interactions
- Core backend: Spring Boot service for primary domain logic
- Budget microservice: separate service for finance and cost tracking

## 2. System Architecture (Very Important)

### Main Components

- Frontend (React + Vite)
  - Provides landing, authentication, customer modules, and admin modules
  - Calls Spring Boot APIs only

- Core Backend (Spring Boot)
  - Handles authentication, authorization, users, venues, vendors, events, bookings
  - Uses layered architecture: Controller -> Service -> Repository
  - Integrates with budget microservice through internal REST calls

- Budget Microservice (Node.js + Express)
  - Handles financial state: budget, estimated cost, actual cost, expenses, revenue
  - Internal-only API protected with an internal service key

### Databases

- MySQL: used by Spring Boot core backend
- PostgreSQL: used by budget microservice

### Architectural Patterns

- Layered architecture in core backend:
  - Controller: API endpoints and request validation boundaries
  - Service: business rules and orchestration
  - Repository: persistence and query access

- Microservice separation:
  - Budget service is independent of the core backend implementation
  - Budget logic is isolated from event/booking domain logic

- Database-per-service pattern:
  - Each service owns its own database
  - No cross-service foreign keys

### High-Level Flow

```text
Frontend -> Spring Boot -> MySQL
Frontend -> Spring Boot -> Budget Service -> PostgreSQL
```

## 3. Microservices Design

EventZen uses a hybrid architecture: modular monolith (Spring Boot core) + focused microservice (Budget Service).

Why this approach is used:

- Separation of concerns:
  - Core backend focuses on operational workflows
  - Budget service focuses on financial tracking and derived metrics
- Scalability:
  - Budget service can scale independently based on financial workload
- Maintainability:
  - Finance-specific logic is contained in a dedicated service boundary
- Deployment flexibility:
  - Services can evolve independently while preserving integration contracts

Budget service responsibilities:

- Upsert estimated event costs
- Set total budget limits
- Record and manage expenses
- Maintain actual cost consistency
- Sync revenue updates from booking outcomes
- Return financial summaries (remaining budget, profit)

## 4. Inter-Service Communication

### Communication Model

- REST-based communication between Spring Boot and budget service
- Frontend does not call budget service directly
- Spring Boot acts as the API gateway/proxy for budget operations

### Core Integration Flows

- Event creation/update:
  - Spring computes planning totals
  - Spring calls budget service to upsert estimated cost

- Vendor assignment updates:
  - Spring recalculates estimated planning cost
  - Budget service receives updated estimate

- Expense addition/removal:
  - Admin action in frontend goes to Spring
  - Spring forwards to budget service
  - Budget service updates expenses and actual cost transactionally

- Booking confirmation/cancellation changes:
  - Spring computes revenue from confirmed bookings
  - Spring syncs revenue into budget service

### Docker Networking Note

In containerized runs, services communicate via Docker service names (internal network DNS), not hardcoded localhost assumptions between containers.

Example internal names in compose:

- `backend`
- `budget-service`
- `db` (MySQL)
- `budget-db` (PostgreSQL)

## 5. Features Overview

### Frontend Features

- Interactive landing page and onboarding flow
- Login/register and role-aware navigation
- Customer modules: browse/search events, book tickets, manage bookings
- Admin modules: users, venues, vendors, events, bookings
- Integrated budget UI inside admin event workflows

### Core Backend Features

- JWT-based auth and role-protected endpoints
- User lifecycle and profile management
- Venue and vendor management
- Event creation/update/cancellation with scheduling/capacity rules
- Booking creation/cancellation and admin booking status controls
- Budget proxy endpoints for admin financial workflows

### Budget Microservice Features

- Event budget setup and updates
- Expense tracking and actual-cost maintenance
- Revenue synchronization from core backend
- Financial summary metrics:
  - totalBudget
  - estimatedCost
  - actualCost
  - remainingBudget
  - profit

## 6. Security

Security is enforced at multiple layers.

- JWT-based authentication in Spring Boot
- Password hashing using BCrypt in core backend
- Role-based access control:
  - Admin and Customer route/API separation
- Protected backend routes with method-level authorization
- Internal service protection for budget microservice:
  - Budget endpoints require internal service authorization key
  - Budget service is not designed for direct public/frontend access

## 7. Data Flow (Important)

### Primary Application Data Flow

```text
User -> Frontend -> Spring Boot -> MySQL
```

### Financial Data Flow

```text
Spring Boot -> Budget Service -> PostgreSQL
```

### Responsibility Separation

- Frontend handles presentation, UX state, and client-side validation
- Spring Boot owns operational domain workflows and access control
- Budget service owns finance calculations and expense consistency

Key design decision:

- No direct frontend -> budget microservice calls

## 8. Docker and Deployment (Critical)

EventZen includes Dockerized services orchestrated by compose.

### Services in docker-compose

- `frontend`: React app served via Nginx, exposed on host `3000`
- `backend`: Spring Boot core API, exposed on host `8080`
- `db`: MySQL for core backend, exposed on host `3306`
- `budget-service`: internal finance microservice (container port `8081`)
- `budget-db`: PostgreSQL for budget service

### Steps to Run

1. Clone repository
2. Navigate to project root
3. Run:

```bash
docker-compose up --build
```

4. Access services:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

### Environment Variables

Core backend (`eventzen/.env`):

- MySQL datasource values
- JWT secret/expiration
- CORS allowed origins
- Internal service key and budget service base URL

Frontend (`frontend/.env`):

- `VITE_API_URL` (typically `http://localhost:8080`)

Budget service env:

- DB host/port/name/user/password
- `INTERNAL_SERVICE_KEY`
- DB retry settings

### Ports and Persistence

Default host ports:

- `3000` -> frontend
- `8080` -> Spring backend
- `3306` -> MySQL
- budget service runs at `8081` inside compose network

Persistent volumes:

- `mysql_data` for MySQL
- `budget_postgres_data` for PostgreSQL

## 9. Tech Stack

### Frontend

- React
- React Router
- Axios
- Tailwind CSS (with custom CSS theming)
- Vite

### Core Backend

- Spring Boot
- Spring Security (JWT)
- Spring Data JPA / Hibernate
- MySQL

### Budget Microservice

- Node.js (Express)
- Sequelize ORM
- PostgreSQL

### Platform and Integration

- REST APIs
- Docker and Docker Compose

---

## System Summary

EventZen is a hybrid full-stack architecture that combines:

- Strong centralized domain orchestration in Spring Boot
- Focused financial microservice isolation for budget correctness
- Role-aware React UI for operational and administrative workflows

This structure is suitable for academic evaluation and practical onboarding because it demonstrates clear boundaries, explicit communication patterns, secure integration, and containerized deployment readiness.
