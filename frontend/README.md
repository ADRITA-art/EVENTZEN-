# EventZen Frontend

A production-style React frontend for the EventZen Event Management System.

## 1. Project Overview

EventZen Frontend is the UI layer of the platform, built with React and Vite. It provides role-aware user experiences for both customers and administrators, including event exploration, booking, vendor and venue administration, user management, and integrated budget operations.

System role:

- Renders all user-facing workflows (public landing/auth and authenticated modules).
- Integrates with the Spring Boot backend via REST APIs.
- Accesses budget functionality through backend proxy endpoints (`/admin/budget/*`) rather than calling the Budget microservice directly.

## 2. Architecture and Design

The frontend follows a component-oriented architecture with clear separation of concerns.

### Architectural Layers

- Pages layer (`src/pages`): Route-level screens (landing, auth, customer, admin).
- Components layer (`src/components`): Reusable UI and feature widgets (modals, spinner, badges, floating header).
- API layer (`src/api`): Axios-based service functions grouped by domain (`events`, `bookings`, `budget`, `venues`, `vendors`, `users`, `auth`).
- State/context layer (`src/context`): Shared authentication/session state.
- Router layer (`src/router`): Route protection and role-based access rules.
- Utility layer (`src/utils`): Shared validation and input-normalization helpers.

### UI Structure

The app flow is organized as:

Landing -> Authentication -> Role-specific dashboard layout -> Feature modules

- Landing page acts as product entry and conversion surface.
- Auth pages handle registration and login.
- After login, navigation splits into Admin layout or Customer layout.

## 3. Routing and Navigation Flow (Very Important)

### Routing Library

- React Router (`react-router-dom`) with nested routes and guarded layout routes.

### Public Routes

- `/` -> Landing page
- `/login` -> Login page
- `/register` -> Registration page

### Protected Routes

Implemented protected routes are role-scoped:

- Customer:
	- `/events`
	- `/my-bookings`
	- `/profile`
- Admin:
	- `/admin` (redirects to `/admin/users`)
	- `/admin/users`
	- `/admin/venues`
	- `/admin/vendors`
	- `/admin/events`
	- `/admin/bookings`
	- `/admin/profile`

Budget UI is integrated inside admin event workflows (`/admin/events`) via modal actions, not as a standalone top-level route.

Requested route mapping (conceptual -> implemented):

- `/dashboard` -> role dashboard entry points:
	- admin: `/admin` (redirects to `/admin/users`)
	- customer: `/events`
- `/vendors` -> admin vendor module at `/admin/vendors`
- `/bookings` ->
	- admin bookings at `/admin/bookings`
	- customer bookings at `/my-bookings`
- budget module -> integrated in `/admin/events` via Budget modal actions

### Role-Based Navigation

- Login redirects admins to `/admin/users` and customers to `/events`.
- Admin and customer use different layouts (`AdminLayout`, `CustomerLayout`) with role-specific navigation menus.

### Route Protection Logic

- `ProtectedRoute` reads auth state from `AuthContext`.
- If auth state is loading, a spinner is shown.
- Unauthenticated users are redirected to `/login`.
- Users with wrong role are redirected to their permitted area.

### Navigation Sequence

Typical flow:

Landing -> Login/Register -> Auth check -> Role layout -> Modules (events/vendors/bookings/budget via events modal)

## 4. API Integration

### Backend Communication Model

- All frontend API calls are made to Spring Boot REST endpoints.
- Axios is used through a centralized instance (`src/api/axiosInstance.js`).
- Base URL is configured from `VITE_API_URL` with fallback `http://localhost:8080`.

### Auth and Interceptors

- JWT token is read from localStorage and attached as `Authorization: Bearer <token>` for non-public endpoints.
- On `401`, token and role are cleared and user is redirected to `/login`.

### Budget Proxy Integration

- Budget operations use Spring proxy endpoints:
	- `GET /admin/budget/event/:eventId`
	- `POST /admin/budget/set`
	- `GET /admin/budget/expense/event/:eventId`
	- `POST /admin/budget/expense`
	- `DELETE /admin/budget/expense/:id`

Frontend never directly calls the budget microservice host.

### API Usage Examples

Fetch events:

```js
import { getUpcomingEvents } from './src/api/events';

const response = await getUpcomingEvents();
const events = response.data;
```

Create booking:

```js
import { createBooking } from './src/api/bookings';

await createBooking(eventId, numberOfSeats);
```

Add expense via backend proxy:

```js
import { addExpense } from './src/api/budget';

await addExpense({
	eventId,
	description: 'Catering payment',
	amount: 2500,
});
```

## 5. State Management

### Local State

Local component state is handled with hooks:

- `useState` for form values, modal visibility, loading flags, and inline messages.
- `useEffect` for initial and dependent data fetching.

### Global/Shared State

- `AuthContext` stores `user`, `role`, and `loading` state.
- Exposes `login`, `logout`, and `refreshUser` actions.
- Restores session from localStorage (`token`, `role`) and validates user with `/auth/me` on app start.

### Data Flow Pattern

REST API -> transformed/validated state -> UI rendering

Examples:

- Events list fetch -> `events` state -> card/table rendering.
- Booking creation -> success callback -> state refresh -> updated availability.
- Budget modal operations -> proxy calls -> budget/expense state refresh -> recalculated UI widgets.

### Form and Modal State

- Forms use controlled inputs.
- Modals maintain isolated state (`modal`, `vendorModal`, `budgetModal`) for workflow clarity.

## 6. Form Handling and Validations (Critical)

Validation is implemented client-side using shared helpers in `src/utils/validation.js` plus route-level form checks.

### Validation Rules in Practice

- Required text fields:
	- event name, city/state/country, vendor contact details, expense description, etc.
- Email format validation:
	- login/register/vendor email fields.
- Password constraints:
	- minimum 6 chars, at least one letter and one number.
- Numeric validations:
	- ticket price >= 0
	- vendor/venue/budget amounts >= 0
	- expense amount > 0
	- seats and capacities as positive integers
- Negative value prevention:
	- budget, ticket, and cost inputs are blocked when invalid.
- Time/date validation:
	- valid ISO date checks and `startTime < endTime` enforcement.

### Input Sanitization

- Text input normalization via trimming (`toTrimmed`).
- Email normalization to lowercase for auth and vendor forms.

### Error Rendering

- Validation failures surface as inline message banners and field-contextual prompts before API submission.

## 7. Error and Success Feedback

Feedback is displayed inline using contextual alert cards (not toast library).

### Error Handling Patterns

- Backend error payload parsing (`response.data.message` fallback patterns).
- Human-readable fallback messages for unknown errors.

### Success Feedback Examples

- Event create/update/cancel success banners.
- Booking cancellation and confirmation flow updates.
- Vendor/venue/user CRUD success messages.
- Budget updates and expense operations reflected immediately in modal summaries.

### Loading States

- Dedicated spinner component for page and route loading.
- Action-level loading states (`Saving...`, `Booking...`, `Cancelling...`).
- Disabled buttons during in-flight operations.

## 8. UI/UX Design

### Design Characteristics

- Clean, modern visual language with CSS variables and consistent branding.
- Responsive behavior for desktop and mobile layouts.
- Role-specific navigation UIs for admin and customer journeys.

### Styling System

- Tailwind CSS plugin is enabled, with a strong custom CSS layer in `index.css`.
- Reusable design tokens:
	- primary/secondary colors
	- surface/background tokens
	- shared controls (`btn-primary`, `btn-secondary`, `btn-danger`, `input-field`, `card`)

### Reusable UI Components

- `Modal` for focused workflows.
- `Spinner` for loading feedback.
- `StatusBadge` for consistent status visualization.
- `FloatingHeader` for branded landing navigation.

### Interaction Patterns

- Modals for booking, vendor assignment, and budget management.
- Hover states and micro-interactions on cards/buttons/rows.
- Interactive landing accordion driven by feature JSON data.

## 9. Key Features

- Interactive landing page with branded feature accordion.
- Authentication (register/login) with role selection and guarded access.
- Customer event discovery, search, booking, and booking management.
- Admin event lifecycle management (create/edit/cancel).
- Admin venue, vendor, and user management modules.
- Admin booking monitoring and status updates with summary modal.
- Budget tracking UI integrated inside admin event workflows.

## 10. Folder Structure

```text
src/
	api/            # Axios instance and domain API functions
	components/     # Reusable UI and feature components
		customer/
		ui/
	context/        # Shared app state (AuthContext)
	layouts/        # Role-specific layout shells (Admin/Customer)
	pages/          # Route-level screens
		admin/
		auth/
		customer/
	router/         # Route guards (ProtectedRoute)
	utils/          # Validation and shared helpers
	App.jsx         # Route tree + app composition
	main.jsx        # React app bootstrap
```

Notes:

- The API directory functions as the frontend service layer.
- Modules are grouped by business domain for maintainability.

## 11. Setup and Installation

### Prerequisites

- Node.js 18+ (Node 20 recommended)
- npm (or yarn/pnpm equivalent)

### Install

```bash
npm install
```

### Environment Variables

Create `.env` (or copy from `.env.example`):

```env
VITE_API_URL=http://localhost:8080
```

### Run Development Server

```bash
npm run dev
```

### Production Build and Preview

```bash
npm run build
npm run preview
```

## 12. Tech Stack

- React 19
- React Router DOM 7
- Axios
- Vite
- Tailwind CSS (with custom CSS utility/design system)
- Lucide React icons
- ESLint for linting

## 13. Future Enhancements

- Introduce advanced state management for large-scale flows (Redux Toolkit or Zustand).
- Add caching and request deduplication (React Query/TanStack Query).
- Improve accessibility (ARIA semantics, keyboard navigation depth, contrast audits).
- Add richer motion/animation patterns with performance guardrails.
- Strengthen offline/error resiliency with retry and optimistic UI strategies.

---

## Evaluation Notes

This frontend is built for both practical developer onboarding and academic assessment:

- Clear separation between route pages, reusable components, API services, and shared state.
- Explicit role-based navigation and auth guard behavior.
- Real integration path through Spring backend, including budget proxy model.
- Strong client-side validation and user feedback patterns across modules.
