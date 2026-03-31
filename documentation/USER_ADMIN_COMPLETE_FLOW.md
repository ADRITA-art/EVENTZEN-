# Eventzen Complete User and Admin Flow

This document explains the full end-to-end flow for both CUSTOMER and ADMIN roles in the Eventzen backend.

## 1) Auth and Access Foundation

1. Register and login are public:
   - `POST /auth/register`
   - `POST /auth/login`
2. Every other endpoint requires JWT (`Authorization: Bearer <token>`).
3. Role enforcement:
   - Admin-only: create/update/delete operations for users, venues, vendors, events, and admin booking control.
   - Customer-only: own booking operations.
   - Shared authenticated access: profile read/update and listing/search endpoints.

## 2) Customer End-to-End Flow

### Step 1: Register
- Endpoint: `POST /auth/register`
- Typical request:
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secret123",
  "role": "CUSTOMER"
}
```

### Step 2: Login and receive JWT
- Endpoint: `POST /auth/login`
- Response returns token used in all next calls.

### Step 3: Profile setup/maintenance
- `GET /auth/me`
- `PUT /users/me`
- `PUT /auth/change-password`

### Step 4: Discover options
- Venue browsing:
  - `GET /venues`
  - `GET /venues/{id}`
  - `GET /venues/search`
- Vendor browsing:
  - `GET /vendors`
  - `GET /vendors/{id}`
- Event browsing:
  - `GET /events`
  - `GET /events/{id}`
  - `GET /events/search`
  - `GET /events/upcoming`
  - `GET /events/{eventId}/vendors`

### Step 5: Book seats
- Endpoint: `POST /bookings`
- Business behavior:
1. Event must be `ACTIVE` and not ended.
2. Seat availability is validated.
3. Booking is saved as `CONFIRMED`.
4. `ticketAvailable` decreases.
5. Event becomes `SOLD_OUT` when availability reaches 0.

### Step 6: Track bookings
- `GET /bookings/my`

### Step 7: Cancel own booking (if required)
- `DELETE /bookings/{id}`
- Behavior:
1. Only own booking can be cancelled.
2. If booking was `CONFIRMED`, event availability is released.
3. Event can move from `SOLD_OUT` to `ACTIVE`.

## 3) Admin End-to-End Flow

### Step 1: Login as Admin
- `POST /auth/login` with admin credentials.

### Step 2: User administration
- `GET /admin/users`
- `GET /users/{id}`
- `DELETE /users/{id}`

### Step 3: Venue administration
- `POST /venues`
- `PUT /venues/{id}`
- `DELETE /venues/{id}`

### Step 4: Vendor administration
- `POST /vendors`
- `GET /vendors`
- `GET /vendors/{id}`
- `PUT /vendors/{id}`
- `DELETE /vendors/{id}`

### Step 5: Event lifecycle management
- `POST /events`
- `PUT /events/{id}`
- `DELETE /events/{id}`
- Business behavior:
1. Timing validated.
2. Capacity cannot exceed venue capacity.
3. Venue overlap protection for active events.
4. Ticket availability initialized from capacity.

### Step 6: Event-vendor assignment (separate from event creation)
- Attach multiple vendors: `POST /events/{eventId}/vendors`
- View mapping: `GET /events/{eventId}/vendors`
- Remove mapping: `DELETE /events/{eventId}/vendors/{vendorId}`
- Business behavior:
1. Event and vendor existence validated.
2. Duplicate mapping prevented.
3. Each mapping stores independent `purpose` and `cost`.
4. Event response reflects `vendors`, `vendorCost`, `totalCost`.

### Step 7: Booking oversight and intervention
- `GET /bookings`
- `GET /bookings/event/{eventId}`
- `PUT /bookings/{id}/status`
- `GET /bookings/event/{eventId}/summary`

## 4) Event Cost Flow

For event read responses:
1. `venueCost` comes from event duration and venue hourly price.
2. `vendorCost` is sum of all mapped event-vendor costs.
3. `totalCost = venueCost + vendorCost`.

## 5) Data Integrity Rules

1. Event-vendor mapping is stored in dedicated table/entity (`event_vendors`), not direct many-to-many.
2. Unique rule on `(event_id, vendor_id)` prevents duplicate assignments.
3. Role checks are enforced by `@PreAuthorize` and JWT authentication.
4. Create/update/delete operations remain role protected and compatible with existing modules.
