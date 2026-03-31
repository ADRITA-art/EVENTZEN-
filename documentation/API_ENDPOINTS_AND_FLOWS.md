# Eventzen API Endpoints and User Flows

This document lists:
- All exposed endpoints
- Access level (Public, Admin, Customer, or Authenticated Both)
- Request body (if applicable)
- Response body
- User flow and endpoint flow

## Base URL
- Event Service (existing): `http://localhost:8080`
- Budget Service (internal Docker network only): `http://budget-service:8081`

## Auth and Access Rules
- Public endpoints:
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /readiness`
- Budget service endpoints are internal-only and require service authorization header:
  - `Authorization: Internal-Service-Key <INTERNAL_SERVICE_KEY>`
- All other Event Service endpoints require JWT (`Authorization: Bearer <token>`).
- Method-level role restrictions:
  - Admin-only: endpoints with `@PreAuthorize("hasRole('ADMIN')")`
  - Customer-only: endpoints with `@PreAuthorize("hasRole('CUSTOMER')")`
  - Authenticated both (Admin + Customer): authenticated endpoints without method role restriction

## Role Summary (Quick Matrix)

| Endpoint | Method | Access |
|---|---|---|
| `/auth/register` | POST | Public |
| `/auth/login` | POST | Public |
| `/readiness` | GET | Public |
| `/auth/me` | GET | Authenticated Both |
| `/auth/change-password` | PUT | Authenticated Both |
| `/users/me` | PUT | Authenticated Both |
| `/users/{id}` | GET | Admin Only |
| `/users/{id}` | DELETE | Admin Only |
| `/admin/users` | GET | Admin Only |
| `/venues` | POST | Admin Only |
| `/venues/{id}` | PUT | Admin Only |
| `/venues/{id}` | DELETE | Admin Only |
| `/venues` | GET | Authenticated Both |
| `/venues/{id}` | GET | Authenticated Both |
| `/venues/search` | GET | Authenticated Both |
| `/events` | POST | Admin Only |
| `/events/{id}` | PUT | Admin Only |
| `/events/{id}` | DELETE | Admin Only |
| `/events` | GET | Authenticated Both |
| `/events/{id}` | GET | Authenticated Both |
| `/events/venue/{venueId}` | GET | Authenticated Both |
| `/events/search` | GET | Authenticated Both |
| `/events/upcoming` | GET | Authenticated Both |
| `/bookings` | POST | Customer Only |
| `/bookings/my` | GET | Customer Only |
| `/bookings/{id}` | DELETE | Customer Only |
| `/bookings` | GET | Admin Only |
| `/bookings/event/{eventId}` | GET | Admin Only |
| `/bookings/{id}/status` | PUT | Admin Only |
| `/bookings/event/{eventId}/summary` | GET | Admin Only |
| `/api/budget/estimate` | POST | Internal Service Only |
| `/api/budget/set` | POST | Internal Service Only |
| `/api/budget/revenue/{eventId}` | PUT | Internal Service Only |
| `/api/budget/{eventId}` | GET | Internal Service Only |
| `/api/expense` | POST | Internal Service Only |
| `/api/expense/event/{eventId}` | GET | Internal Service Only |
| `/api/expense/{id}` | DELETE | Internal Service Only |
| `/admin/budget/event/{eventId}` | GET | Admin Only |
| `/admin/budget/set` | POST | Admin Only |
| `/admin/budget/expense/event/{eventId}` | GET | Admin Only |
| `/admin/budget/expense` | POST | Admin Only |
| `/admin/budget/expense/{id}` | DELETE | Admin Only |

---

## 1) Authentication Endpoints

### 1.1 Register
- Method: `POST`
- Path: `/auth/register`
- Access: Public
- Request Body (`RegisterRequest`):
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secret123",
  "role": "CUSTOMER"
}
```
- Response Body (`String`):
```json
"User registered successfully"
```
- Endpoint Flow:
1. Validate fields (`name`, valid `email`, `password` min length 6, `role`).
2. Create user.
3. Return success string.

### 1.2 Login
- Method: `POST`
- Path: `/auth/login`
- Access: Public
- Request Body (`LoginRequest`):
```json
{
  "email": "alice@example.com",
  "password": "secret123"
}
```
- Response Body (`AuthResponse`):
```json
{
  "token": "<jwt-token>",
  "role": "CUSTOMER"
}
```
- Endpoint Flow:
1. Validate credentials.
2. Resolve user.
3. Generate JWT using email.
4. Return token + role.

### 1.3 Readiness Check
- Method: `GET`
- Path: `/readiness`
- Access: Public
- Request Body: None
- Response Body:
```json
{
  "status": "UP",
  "budgetService": "UP"
}
```
- Endpoint Flow:
1. Ping Budget Service health endpoint.
2. Return `200 OK` with `UP` when reachable.
3. Return `503 Service Unavailable` with `DOWN` when Budget Service is not reachable.

### 1.4 Get My Profile
- Method: `GET`
- Path: `/auth/me`
- Access: Authenticated Both (Admin/Customer)
- Request Body: None
- Response Body (`UserProfileResponse`):
```json
{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com",
  "role": "CUSTOMER"
}
```
- Endpoint Flow:
1. Read authenticated principal from JWT.
2. Fetch user profile by principal email.
3. Return profile.

### 1.5 Change Password
- Method: `PUT`
- Path: `/auth/change-password`
- Access: Authenticated Both (Admin/Customer)
- Request Body (`ChangePasswordRequest`):
```json
{
  "oldPassword": "oldPass",
  "newPassword": "newPass"
}
```
- Response Body (`String`):
```json
"Password updated successfully"
```
- Endpoint Flow:
1. Read authenticated principal.
2. Verify old password.
3. Update to new password.
4. Return success string.

---

## 2) User Management Endpoints

### 2.1 Update My Profile
- Method: `PUT`
- Path: `/users/me`
- Access: Authenticated Both (Admin/Customer)
- Request Body (`UpdateProfileRequest`):
```json
{
  "name": "New Name"
}
```
- Response Body (`UserProfileResponse`):
```json
{
  "id": 1,
  "name": "New Name",
  "email": "alice@example.com",
  "role": "CUSTOMER"
}
```
- Endpoint Flow:
1. Read authenticated principal.
2. Update own profile fields.
3. Return updated profile.

### 2.2 Get User by ID
- Method: `GET`
- Path: `/users/{id}`
- Access: Admin Only
- Request Body: None
- Response Body (`UserProfileResponse`):
```json
{
  "id": 2,
  "name": "Customer User",
  "email": "customer@example.com",
  "role": "CUSTOMER"
}
```
- Endpoint Flow:
1. Verify caller is admin.
2. Fetch user by id.
3. Return profile.

### 2.3 Delete User by ID
- Method: `DELETE`
- Path: `/users/{id}`
- Access: Admin Only
- Request Body: None
- Response Body (`String`):
```json
"User deleted successfully"
```
- Endpoint Flow:
1. Verify caller is admin.
2. Delete user by id.
3. Return success message.

### 2.4 Get All Users
- Method: `GET`
- Path: `/admin/users`
- Access: Admin Only
- Request Body: None
- Response Body (`List<UserProfileResponse>`):
```json
[
  {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "ADMIN"
  },
  {
    "id": 2,
    "name": "Customer User",
    "email": "customer@example.com",
    "role": "CUSTOMER"
  }
]
```
- Endpoint Flow:
1. Verify caller is admin.
2. Fetch all users.
3. Return user list.

---

## 3) Venue Endpoints

### 3.1 Create Venue
- Method: `POST`
- Path: `/venues`
- Access: Admin Only
- Request Body (`VenueRequest`):
```json
{
  "name": "Grand Hall",
  "state": "Karnataka",
  "city": "Bengaluru",
  "country": "India",
  "pincode": "560001",
  "address": "MG Road",
  "type": "HALL",
  "capacity": 500,
  "description": "Premium indoor venue",
  "amenities": "AC, Parking, WiFi",
  "pricePerHour": 2500.00,
  "rating": 4.5,
  "imageUrl": "https://example.com/venue.jpg",
  "isActive": true
}
```
- Response Body (`VenueResponse`):
```json
{
  "id": 1,
  "name": "Grand Hall",
  "state": "Karnataka",
  "city": "Bengaluru",
  "country": "India",
  "pincode": "560001",
  "address": "MG Road",
  "type": "HALL",
  "capacity": 500,
  "description": "Premium indoor venue",
  "amenities": "AC, Parking, WiFi",
  "pricePerHour": 2500.00,
  "rating": 4.5,
  "imageUrl": "https://example.com/venue.jpg",
  "isActive": true,
  "createdAt": "2026-03-20T10:00:00",
  "updatedAt": "2026-03-20T10:00:00"
}
```
- Endpoint Flow:
1. Verify caller is admin.
2. Validate venue payload.
3. Create venue.
4. Return created venue.

### 3.2 Update Venue
- Method: `PUT`
- Path: `/venues/{id}`
- Access: Admin Only
- Request Body: same as create (`VenueRequest`)
- Response Body: `VenueResponse`
- Endpoint Flow:
1. Verify admin role.
2. Validate payload.
3. Update venue by id.
4. Return updated venue.

### 3.3 Delete Venue
- Method: `DELETE`
- Path: `/venues/{id}`
- Access: Admin Only
- Request Body: None
- Response Body (`String`):
```json
"Venue deleted successfully"
```
- Endpoint Flow:
1. Verify admin role.
2. Delete/soft-delete venue as implemented in service.
3. Return success message.

### 3.4 Get All Venues
- Method: `GET`
- Path: `/venues`
- Access: Authenticated Both (Admin/Customer)
- Request Body: None
- Response Body: `List<VenueResponse>`
- Endpoint Flow:
1. Authenticate JWT.
2. Fetch venues (typically active venues).
3. Return list.

### 3.5 Get Venue by ID
- Method: `GET`
- Path: `/venues/{id}`
- Access: Authenticated Both (Admin/Customer)
- Request Body: None
- Response Body: `VenueResponse`
- Endpoint Flow:
1. Authenticate JWT.
2. Fetch venue by id.
3. Return venue.

### 3.6 Search Venues
- Method: `GET`
- Path: `/venues/search`
- Access: Authenticated Both (Admin/Customer)
- Query Params:
  - `location` (optional)
  - `capacity` (optional)
- Request Body: None
- Response Body: `List<VenueResponse>`
- Endpoint Flow:
1. Authenticate JWT.
2. Apply optional location/capacity filters.
3. Return matching venues.

---

## 4) Event Endpoints

### 4.1 Create Event
- Method: `POST`
- Path: `/events`
- Access: Admin Only
- Request Body (`EventRequest`):
```json
{
  "name": "Tech Fest",
  "description": "Annual event",
  "eventDate": "2026-03-20",
  "startTime": "10:00",
  "endTime": "14:00",
  "venueId": 1,
  "ticketPrice": 1500.00,
  "maxCapacity": 450
}
```
- Response Body (`EventResponse`):
```json
{
  "id": 1,
  "name": "Tech Fest",
  "description": "Annual event",
  "eventDate": "2026-03-20",
  "startTime": "10:00:00",
  "endTime": "14:00:00",
  "venueId": 1,
  "venueName": "Grand Hall",
  "venueCost": 10000.00,
  "ticketPrice": 1500.00,
  "maxCapacity": 450,
  "ticketAvailable": 450,
  "status": "ACTIVE",
  "createdAt": "2026-03-20T10:10:00",
  "updatedAt": "2026-03-20T10:10:00"
}
```
- Endpoint Flow:
1. Verify admin role.
2. Validate timing (`startTime < endTime`).
3. Verify venue exists.
4. Verify `maxCapacity` does not exceed venue capacity.
5. Ensure no overlapping active event in same venue/date/time.
6. Compute `venueCost`, initialize `ticketAvailable`.
7. Set status (`ACTIVE` or `SOLD_OUT` if availability is 0).
8. Save event.
9. Upsert event planning estimate in Budget Service (`estimatedCost = venueCost + vendorCost`).
10. Return event.

### 4.2 Update Event
- Method: `PUT`
- Path: `/events/{id}`
- Access: Admin Only
- Request Body: same as create (`EventRequest`)
- Response Body: `EventResponse`
- Endpoint Flow:
1. Verify admin role.
2. Fetch event and venue.
3. Validate timing and overlap (excluding same event id).
4. Validate capacity against venue.
5. Validate new capacity is not below already confirmed booked seats.
6. Recompute `venueCost` and `ticketAvailable`.
7. Auto-sync status (`ACTIVE` / `SOLD_OUT`, unless already `CANCELLED`/`COMPLETED`).
8. Save event.
9. Upsert latest planning estimate in Budget Service (`estimatedCost`).
10. Return event.

### 4.3 Cancel Event
- Method: `DELETE`
- Path: `/events/{id}`
- Access: Admin Only
- Request Body: None
- Response Body (`String`):
```json
"Event cancelled successfully"
```
- Endpoint Flow:
1. Verify admin role.
2. Set event status to `CANCELLED`.
3. Save and return success message.

### 4.4 Get All Events
- Method: `GET`
- Path: `/events`
- Access: Authenticated Both (Admin/Customer)
- Request Body: None
- Response Body: `List<EventResponse>`
- Endpoint Flow:
1. Authenticate JWT.
2. Return events with status in `[ACTIVE, SOLD_OUT]`.

### 4.5 Get Event by ID
- Method: `GET`
- Path: `/events/{id}`
- Access: Authenticated Both (Admin/Customer)
- Request Body: None
- Response Body: `EventResponse`
- Endpoint Flow:
1. Authenticate JWT.
2. Fetch event by id with status in `[ACTIVE, SOLD_OUT]`.
3. Return event.

### 4.6 Get Events by Venue
- Method: `GET`
- Path: `/events/venue/{venueId}`
- Access: Authenticated Both (Admin/Customer)
- Request Body: None
- Response Body: `List<EventResponse>`
- Endpoint Flow:
1. Authenticate JWT.
2. Fetch venue events with status in `[ACTIVE, SOLD_OUT]`.
3. Return list.

### 4.7 Search Events
- Method: `GET`
- Path: `/events/search`
- Access: Authenticated Both (Admin/Customer)
- Query Params:
  - `date` (optional, format `YYYY-MM-DD`)
  - `location` (optional)
- Request Body: None
- Response Body: `List<EventResponse>`
- Endpoint Flow:
1. Authenticate JWT.
2. Apply optional date/location filters.
3. Return events with status in `[ACTIVE, SOLD_OUT]`.

### 4.8 Upcoming Events
- Method: `GET`
- Path: `/events/upcoming`
- Access: Authenticated Both (Admin/Customer)
- Request Body: None
- Response Body: `List<EventResponse>`
- Endpoint Flow:
1. Authenticate JWT.
2. Fetch events where `eventDate >= current date` with status in `[ACTIVE, SOLD_OUT]`.
3. Return sorted list.

---

## 5) Booking Endpoints

### 5.1 Create Booking
- Method: `POST`
- Path: `/bookings`
- Access: Customer Only
- Request Body (`BookingRequest`):
```json
{
  "eventId": 1,
  "numberOfSeats": 3
}
```
- Response Body (`BookingResponse`):
```json
{
  "id": 10,
  "userId": 2,
  "userName": "Alice",
  "eventId": 1,
  "eventName": "Tech Fest",
  "eventDate": "2026-03-20",
  "startTime": "10:00:00",
  "endTime": "14:00:00",
  "numberOfSeats": 3,
  "pricePerTicket": 1500.00,
  "totalPrice": 4500.00,
  "bookingTime": "2026-03-19T21:30:00",
  "status": "CONFIRMED",
  "createdAt": "2026-03-19T21:30:00",
  "updatedAt": "2026-03-19T21:30:00"
}
```
- Endpoint Flow:
1. Verify customer role.
2. Resolve logged-in user from JWT.
3. Resolve target event (must be `ACTIVE`).
4. Validate event has not ended.
5. Validate seat availability.
6. Create confirmed booking with price snapshot.
7. Decrease event `ticketAvailable`; if reaches 0 mark event `SOLD_OUT`.
8. Save booking.
9. Recompute confirmed booking revenue for that event and sync to Budget Service.
10. Return response.

### 5.2 Get My Bookings
- Method: `GET`
- Path: `/bookings/my`
- Access: Customer Only
- Request Body: None
- Response Body: `List<BookingResponse>`
- Endpoint Flow:
1. Verify customer role.
2. Resolve current user.
3. Fetch bookings for that user.
4. Return list.

### 5.3 Cancel My Booking
- Method: `DELETE`
- Path: `/bookings/{id}`
- Access: Customer Only
- Request Body: None
- Response Body (`String`):
```json
"Booking cancelled successfully"
```
- Endpoint Flow:
1. Verify customer role.
2. Resolve current user.
3. Fetch booking by id and user ownership.
4. If already cancelled, reject.
5. Change booking status to `CANCELLED`.
6. If booking was confirmed, increase event `ticketAvailable`; event can move from `SOLD_OUT` to `ACTIVE`.
7. Save status change.
8. Recompute confirmed booking revenue for that event and sync to Budget Service.
9. Return success message.

### 5.4 Get All Bookings
- Method: `GET`
- Path: `/bookings`
- Access: Admin Only
- Request Body: None
- Response Body: `List<BookingResponse>`
- Endpoint Flow:
1. Verify admin role.
2. Fetch all bookings.
3. Return list.

### 5.5 Get Bookings by Event
- Method: `GET`
- Path: `/bookings/event/{eventId}`
- Access: Admin Only
- Request Body: None
- Response Body: `List<BookingResponse>`
- Endpoint Flow:
1. Verify admin role.
2. Validate event exists.
3. Fetch bookings for event.
4. Return list.

### 5.6 Update Booking Status
- Method: `PUT`
- Path: `/bookings/{id}/status`
- Access: Admin Only
- Request Body (`BookingStatusUpdateRequest`):
```json
{
  "status": "CANCELLED"
}
```
- Allowed values: `CONFIRMED`, `CANCELLED`
- Response Body: `BookingResponse`
- Endpoint Flow:
1. Verify admin role.
2. Fetch booking by id.
3. If status changes to `CONFIRMED`, validate event bookability/capacity and decrease `ticketAvailable`.
4. If status changes from `CONFIRMED` to `CANCELLED`, increase `ticketAvailable`.
5. Auto-sync event status (`ACTIVE` / `SOLD_OUT` when applicable).
6. Save status change.
7. Recompute confirmed booking revenue for that event and sync to Budget Service.
8. Return updated booking.

### 5.7 Event Booking Summary
- Method: `GET`
- Path: `/bookings/event/{eventId}/summary`
- Access: Admin Only
- Request Body: None
- Response Body (`EventBookingSummaryResponse`):
```json
{
  "eventId": 1,
  "maxCapacity": 200,
  "totalBookedSeats": 120,
  "remainingSeats": 80
}
```
- Endpoint Flow:
1. Verify admin role.
2. Fetch event.
3. Compute confirmed booked seats.
4. Compute remaining seats.
5. Return summary.

---

## 6) User Flows (Journey View)

### 6.1 Customer Journey
1. Register: `POST /auth/register`
2. Login: `POST /auth/login` and receive JWT
3. View profile: `GET /auth/me`
4. Browse venues/events:
   - `GET /venues`, `GET /venues/search`, `GET /venues/{id}`
   - `GET /events`, `GET /events/search`, `GET /events/upcoming`, `GET /events/{id}`
5. Book tickets: `POST /bookings`
6. View own bookings: `GET /bookings/my`
7. Cancel own booking if needed: `DELETE /bookings/{id}`
8. Manage own account:
   - `PUT /users/me`
   - `PUT /auth/change-password`

### 6.2 Admin Journey
1. Register/Login as admin:
   - `POST /auth/register` (with role `ADMIN`) or existing admin login
   - `POST /auth/login`
2. Manage users:
   - `GET /admin/users`
   - `GET /users/{id}`
   - `DELETE /users/{id}`
3. Manage venues:
   - `POST /venues`
   - `PUT /venues/{id}`
   - `DELETE /venues/{id}`
4. Manage events:
   - `POST /events`
   - `PUT /events/{id}`
   - `DELETE /events/{id}`
5. Monitor and control bookings:
   - `GET /bookings`
   - `GET /bookings/event/{eventId}`
   - `PUT /bookings/{id}/status`
   - `GET /bookings/event/{eventId}/summary`

### 6.3 Shared (Admin + Customer) Authenticated Flow
- After JWT login, both roles can:
  - Access profile (`GET /auth/me`, `PUT /users/me`, `PUT /auth/change-password`)
  - Read venue/event listings (`GET` endpoints without role-specific `@PreAuthorize`)

---

## 7) Common Error Shapes and Codes
- `400 Bad Request`: validation errors / illegal arguments
- `401 Unauthorized`: missing or invalid JWT, invalid credentials
- `403 Forbidden`: authenticated but lacks required role (Admin/Customer restrictions)
- `404 Not Found`: resource not found
- `409 Conflict`: duplicate resource / overlapping event conflict
- `500 Internal Server Error`: unexpected failures
- `503 Service Unavailable`: budget service integration unavailable

---

## 8) Important Domain Notes (Current Code)
- Event statuses currently include: `ACTIVE`, `SOLD_OUT`, `CANCELLED`, `COMPLETED`.
- Customer booking only allows events in `ACTIVE` status.
- Event listing/search currently includes both `ACTIVE` and `SOLD_OUT`.
- Event capacity is validated against venue capacity on create/update.
- Ticket availability is tracked with `ticketAvailable` and updated during booking state transitions.

---

## 9) Budget Tracking Microservice Endpoints

Base URL: `http://budget-service:8081` (internal Docker network)

Required header for all `/api/*` calls:
`Authorization: Internal-Service-Key <INTERNAL_SERVICE_KEY>`

### 9.1 Upsert Event Estimated Cost
- Method: `POST`
- Path: `/api/budget/estimate`
- Access: Internal Service Only
- Request Body:
```json
{
  "eventId": 101,
  "estimatedCost": 15000
}
```
- Response Body:
```json
{
  "id": 1,
  "eventId": 101,
  "estimatedCost": "15000.00",
  "totalBudget": null,
  "actualCost": "0.00",
  "revenue": "0.00",
  "createdAt": "2026-03-26T11:00:00.000Z"
}
```
- Endpoint Flow:
1. Validate `eventId` and `estimatedCost`.
2. Create budget row when missing, otherwise update existing row.
3. Preserve `totalBudget`, `actualCost`, and `revenue` values.

### 9.2 Get Budget Summary By Event
- Method: `GET`
- Path: `/api/budget/{eventId}`
- Access: Internal Service Only
- Request Body: None
- Response Body:
```json
{
  "eventId": 101,
  "estimatedCost": "15000.00",
  "totalBudget": "18000.00",
  "actualCost": "35000.00",
  "revenue": "50000.00",
  "remainingBudget": "-17000.00",
  "profit": "15000.00"
}
```
- Endpoint Flow:
1. Validate `eventId` path parameter.
2. Fetch `EventBudget` row.
3. Return `estimatedCost`, `totalBudget`, `actualCost`, `revenue`, and computed `remainingBudget` + `profit`.

### 9.3 Set Planned Total Budget
- Method: `POST`
- Path: `/api/budget/set`
- Access: Internal Service Only
- Request Body:
```json
{
  "eventId": 101,
  "totalBudget": 18000
}
```
- Response Body:
```json
{
  "id": 1,
  "eventId": 101,
  "estimatedCost": "15000.00",
  "totalBudget": "18000.00",
  "actualCost": "35000.00",
  "revenue": "50000.00",
  "createdAt": "2026-03-26T11:00:00.000Z"
}
```
- Endpoint Flow:
1. Validate `eventId` and `totalBudget`.
2. Create budget row when missing, otherwise update planned budget.
3. Return updated budget summary values.

### 9.4 Sync Event Revenue
- Method: `PUT`
- Path: `/api/budget/revenue/{eventId}`
- Access: Internal Service Only
- Request Body:
```json
{
  "revenue": 50000
}
```
- Endpoint Flow:
1. Validate `eventId` and `revenue`.
2. Create budget row when missing, otherwise update `revenue`.
3. Keep other financial fields unchanged.

### 9.5 Add Expense
- Method: `POST`
- Path: `/api/expense`
- Access: Internal Service Only
- Request Body:
```json
{
  "eventId": 101,
  "category": "Catering",
  "amount": 25000,
  "description": "Lunch and snacks"
}
```
- Response Body: `Expense`
- Endpoint Flow:
1. Validate payload (`eventId`, `category`, `amount`).
2. Ensure matching event budget exists.
3. Insert expense row.
4. Increment `EventBudget.actualCost` in the same DB transaction.

### 9.6 Get Expenses By Event
- Method: `GET`
- Path: `/api/expense/event/{eventId}`
- Access: Internal Service Only
- Request Body: None
- Response Body: `List<Expense>`
- Endpoint Flow:
1. Validate `eventId`.
2. Fetch all `Expense` rows for that event.
3. Return ordered list (latest first).

### 9.7 Delete Expense
- Method: `DELETE`
- Path: `/api/expense/{id}`
- Access: Internal Service Only
- Request Body: None
- Response Body:
```json
{
  "message": "Expense deleted successfully",
  "eventId": 101,
  "actualCost": "10000.00"
}
```
- Endpoint Flow:
1. Validate expense id.
2. Fetch expense and related event budget.
3. Delete expense.
4. Decrement `EventBudget.actualCost` in the same DB transaction.

### 9.8 Budget Service Business Rules
1. `estimatedCost` is planning cost synced from Event Service (`venueCost + vendor assignments`).
2. `totalBudget` is admin-managed planned/allowed budget.
3. `actualCost` is maintained from expense mutations.
4. `revenue` is synced from confirmed bookings.
5. `remainingBudget = totalBudget - actualCost` (when totalBudget is set).
6. `profit = revenue - actualCost`.
7. Service intentionally uses loose coupling (`eventId`) with no FK constraints to Event service DB.
8. Budget APIs are internal-only and require service-key authorization.
