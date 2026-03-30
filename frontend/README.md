# EventZen Frontend

A production-grade React UI system for EventZen, designed for role-based operations, backend-driven workflows, and maintainable feature evolution.

## 1. 🚀 Project Overview

EventZen Frontend is the presentation and interaction layer of the EventZen platform. It enables customers and administrators to execute end-to-end workflows including event discovery, booking, event operations, venue/vendor administration, user management, and budget management tasks.

What the frontend does:

- Delivers public product entry (`/`), authentication, and protected role-specific modules
- Implements form validation and interaction feedback before backend submission
- Coordinates data fetch, mutation, and refresh cycles for operational dashboards

Its role in the overall system:

- The frontend is the single user-facing client application
- The Spring Boot backend is the authoritative API boundary
- Budget features are consumed indirectly through Spring proxy endpoints, not by direct microservice calls

Why this system role matters:

- Keeps frontend contracts stable even when internal backend topology evolves
- Centralizes security and policy checks in backend services
- Reduces credential exposure and cross-service coupling in the browser

## Application Sreenshots:

<img width="1050" height="499" alt="image" src="https://github.com/user-attachments/assets/934de2ac-c00d-48d2-ba61-114cd7ec8bf2" />

<img width="1050" height="497" alt="image" src="https://github.com/user-attachments/assets/45a1b00d-0010-4563-add7-49d69cabe7eb" />

<img width="1050" height="500" alt="image" src="https://github.com/user-attachments/assets/79b855ba-cb1b-48fd-9edf-d8f8f311865d" />

<img width="1050" height="514" alt="image" src="https://github.com/user-attachments/assets/33cb57c1-5a63-4553-b257-4d68530c33b1" />

<img width="1050" height="497" alt="image" src="https://github.com/user-attachments/assets/9cbf935e-5e82-4f49-aa6d-a6d903db0d9e" />





## 2. 🧠 Frontend Architecture & Design Rationale

### Why React + Vite

- React enables composable, reusable UI primitives across multiple role-based workflows
- Vite provides fast development feedback and lean production builds
- The combination supports rapid iteration without sacrificing modular architecture

### Why component-based architecture

- Shared UI patterns (modal, spinner, status badge, headers) avoid repeated implementation logic
- Feature pages can compose reusable parts while preserving domain-specific behavior
- UI consistency improves as design tokens and shared components converge

### Why no heavy global state library (current design)

- Current cross-cutting state is limited and mostly authentication-centric (`AuthContext`)
- Most data is feature-local and server-sourced, making local state + API calls sufficient
- Avoids over-engineering and boilerplate for current complexity level

Trade-off:

- Context + local state is simpler now, but large future cross-page caching/workflow orchestration may justify Redux Toolkit or Zustand

### Separation of concerns

- Pages: route-level orchestration and screen composition
- Components: reusable UI/feature primitives
- API layer: HTTP contract boundary and endpoint grouping
- Context: session/auth state shared across routes
- Router: access control and role-aware navigation boundaries

## 3. 🧩 Application Structure

Application layers:

- Pages layer (`src/pages`): feature screens for public, auth, customer, and admin workflows
- Components layer (`src/components`): reusable UI units and focused feature widgets
- API layer (`src/api`): centralized Axios instance plus domain-grouped API functions
- Context layer (`src/context`): authentication/session lifecycle and shared role state
- Router layer (`src/router`): route guards and role-based access enforcement
- Utilities layer (`src/utils`): validation and input normalization primitives

Why this structure was chosen:

- Enables clear ownership boundaries per concern
- Improves onboarding by making execution flow predictable
- Keeps HTTP and auth behavior centralized rather than duplicated in pages
- Supports incremental feature growth without deep refactors

## 4. 🔀 Routing & Navigation Design

### Public routes

- `/` -> landing page
- `/login` -> login
- `/register` -> registration

### Protected routes

- Customer routes under `CustomerLayout`:
  - `/events`
  - `/my-bookings`
  - `/profile`
- Admin routes under `AdminLayout`:
  - `/admin` (redirects to `/admin/users`)
  - `/admin/users`
  - `/admin/venues`
  - `/admin/vendors`
  - `/admin/events`
  - `/admin/bookings`
  - `/admin/profile`

### Role-based routing

- `ProtectedRoute` gates access based on `allowedRoles`
- Unauthenticated users are redirected to `/login`
- Authenticated users with wrong role are redirected to their valid home area

### Layout separation

- `AdminLayout` and `CustomerLayout` isolate navigation, IA, and workflow emphasis per persona
- This prevents role leakage in navigation and keeps mental models focused

### Navigation flow

Landing -> Auth -> Session restore/check -> Role-specific layout -> Feature modules.

Budget actions are embedded inside admin event workflows (`/admin/events`) via modal-driven interactions.

## 5. 🔗 Backend Integration Strategy

### Axios setup

- All HTTP calls use a centralized Axios client (`src/api/axiosInstance.js`)
- Base URL is controlled by `VITE_API_URL` with localhost fallback
- Shared JSON headers and interceptors are applied in one place

### JWT handling

- Token and role are persisted in `localStorage`
- Request interceptor attaches `Authorization: Bearer <token>` to non-public routes
- `AuthContext` rehydrates session and calls `/auth/me` for runtime validation

### Interceptor behavior

- Public auth endpoints are excluded from token injection
- On `401`, session keys are cleared and user is redirected to `/login`

### Why frontend does not call Budget Service directly

- Browser never handles internal service key trust model
- Spring backend is the orchestration and policy boundary
- Frontend stays aligned with stable domain endpoints while backend integration details remain encapsulated

### Error handling strategy

- API errors are surfaced with backend message fallback (`response.data.message`)
- Feature-level handlers map failures to user-readable inline feedback
- Request retries are intentionally conservative in UI to avoid duplicate write side effects

## 6. 🧠 State Management Strategy

### Local state

- `useState` manages form fields, modals, loading flags, and feature messages
- Keeps volatile UI state close to consuming components

### Global/shared state

- `AuthContext` holds `user`, `role`, and `loading`
- Exposes `login`, `logout`, and `refreshUser`
- Provides app-wide auth state without introducing heavy store architecture

### Why Context API here

- Shared auth state is global but low-volume
- Context provides enough capability with low overhead
- Reduces complexity and onboarding cost for current project size

### Trade-offs vs Redux/Zustand

- Context is simpler but has fewer built-in patterns for complex async caching and granular subscriptions
- Redux/Zustand can scale better for very large state graphs, but adds configuration and cognitive overhead

### Data flow model

UI action -> validation -> API call -> state update -> UI re-render.

This explicit, unidirectional flow helps maintain predictability during mutation-heavy admin operations.

## 7. 🧾 Form Handling & Validation Strategy

Validation philosophy:

- Prevent invalid backend calls early at the UI boundary
- Show users actionable feedback before network round-trips

Validation coverage:

- Required text validation for critical fields
- Email and password format checks
- Numeric constraints (`>= 0`, `> 0`, positive integers)
- Date/time sanity checks (`startTime < endTime`)
- Input normalization (`trim`, lowercase email handling)

UX decisions behind validation:

- Inline feedback is preferred over delayed failure after submit
- Guard clauses stop invalid submissions immediately
- Consistent helper utilities keep rules uniform across forms

## 8. ⚠️ Error Handling & UX Feedback

Error handling patterns:

- Per-action try/catch with contextual messages
- Backend error passthrough when available, safe fallback text otherwise
- Guarded data fetching patterns for partial failures in budget workflows

Success feedback patterns:

- Explicit success states after create/update/delete operations
- Immediate refresh of dependent data (for example budget summary after expense mutation)

Loading states:

- Route-level loading indicator for auth-protected routing
- Page-level loading for initial module fetches
- Action-level loading/disabled controls during mutations

Why this improves UX:

- Reduces uncertainty during asynchronous operations
- Prevents duplicate submissions while requests are in-flight
- Makes failure states diagnosable without exposing raw technical errors

## 9. 🎨 UI/UX Design System

Design consistency approach:

- Shared styling tokens and utility classes keep visual language coherent
- Reusable components enforce consistent interaction patterns
- Role-specific layouts maintain contextual focus for admin vs customer journeys

Reusable components with architectural value:

- `Modal`: encapsulates focused workflows without route fragmentation
- `Spinner`: consistent loading affordance across screens
- `StatusBadge`: standardized status semantics
- `FloatingHeader`: reusable branded navigation shell element

Tailwind usage

- Tailwind is enabled and complemented with a custom CSS layer for app-level tokens/components
- This hybrid approach balances rapid styling with project-specific UI consistency

Why modals are used:

- Budget and assignment tasks are contextual to parent records (events)
- Modal interactions preserve page context and reduce navigation overhead
- Faster operator workflow for admin-heavy operations

## 10. ⚙️ API Design Consumption Philosophy

How frontend consumes REST APIs:

- API functions are grouped by domain (`events`, `bookings`, `budget`, `users`, `venues`, `vendors`, `auth`)
- Components call semantic API helpers rather than embedding raw endpoint strings

Why centralized API layer:

- One location for transport concerns (base URL, interceptors, headers)
- Lower duplication and easier contract maintenance
- Faster adaptation if backend endpoint patterns evolve

Why domain separation in API modules:

- Aligns frontend boundaries with business capabilities
- Improves discoverability for onboarding developers
- Supports testability and incremental refactoring per domain

## 11. 🧱 Performance & Scalability Considerations

Current performance posture:

- Role/layout partitioning and local state scoping limit unnecessary global updates
- API modules reduce repeated network logic and header setup overhead
- Async handlers refresh only affected slices of data after mutations

Current constraints:

- No route-level code splitting/lazy loading yet
- No dedicated client-side cache layer (for example React Query)

Future scaling path:

- Add lazy loading for larger route bundles
- Introduce memoization/selective rendering for heavy tables and forms
- Add request caching/deduplication for repeated reads
- Introduce background refresh and stale-while-revalidate patterns

## 12. 🔐 Security Considerations

Token storage trade-off:

- Current implementation uses `localStorage` for JWT persistence and simple session restore
- Benefit: implementation simplicity and predictable SPA behavior
- Trade-off: higher XSS exposure risk compared with HttpOnly secure cookies

Route protection:

- Protected routes enforce authentication + role checks at navigation boundary
- Unauthorized users are redirected out of restricted areas

API protection assumptions:

- Frontend assumes backend enforces full authorization checks server-side
- Budget microservice remains inaccessible directly from browser by design
- Frontend-side checks are usability controls, not security substitutes

## 13. 📁 Folder Structure

```text
src/
  api/            # Axios instance + domain API modules
  components/     # Reusable UI components and feature widgets
  context/        # Shared auth/session state
  layouts/        # Admin/Customer layout shells
  pages/          # Route-level screens by role/domain
  router/         # Route guard logic
  utils/          # Validation and small shared helpers
  App.jsx         # Route tree and app composition
  main.jsx        # Application bootstrap
```

Why this structure works well:

- Keeps transport, view composition, and state concerns decoupled
- Makes request flow traceable: route -> page -> API module -> backend
- Improves onboarding by reflecting architectural layers in directory layout
- Scales by domain rather than by file-type sprawl inside single folders

## 14. 🛠️ Setup & Running the App

Prerequisites:

- Node.js 18+ (Node 20 recommended)
- npm

Install dependencies:

```bash
npm install
```

Configure environment:

```env
VITE_API_URL=http://localhost:8080
```

Run development server:

```bash
npm run dev
```

Create production build:

```bash
npm run build
```

Preview production build locally:

```bash
npm run preview
```

## 16. 🚧 Limitations & Assumptions

- Auth persistence currently relies on `localStorage` and assumes strong XSS hygiene
- Frontend does not implement offline mode or optimistic reconciliation for failed writes
- Budget UX is embedded in admin events page, not a standalone analytics workspace
- No route-level lazy loading yet; bundle growth may affect initial load at larger scale
- Advanced client-side caching and request deduplication are not yet implemented

## 17. 🚀 Future Improvements

- Introduce route-based code splitting with lazy loading and suspense boundaries
- Add query caching and invalidation strategy (for example TanStack Query)
- Implement stronger frontend security posture with CSP hardening and token strategy review
- Add accessibility hardening (keyboard flows, ARIA audit, contrast testing)
- Add performance telemetry (web vitals + route timing) and regression thresholds in CI
- Introduce richer budget insights UI if finance workflows expand beyond modal scope
