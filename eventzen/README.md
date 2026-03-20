# Eventzen API Documentation

This document lists all currently available APIs in the project.

## Base URL

- Local: `http://localhost:8080`

## Authentication

- JWT-based authentication using `Authorization: Bearer <token>`.
- Public endpoints:
  - `POST /auth/register`
  - `POST /auth/login`
- All other endpoints require a valid JWT.
- Admin-only endpoints use role check: `ADMIN`.
- Event management endpoints (`POST/PUT/DELETE /events`) are admin-only.
- Event view endpoints (`GET /events...`) are accessible to authenticated users (admin and customer).

## Roles

- `ADMIN`
- `CUSTOMER`

## API Endpoints

### 1) Register

- **Method:** `POST`
- **Path:** `/auth/register`
- **Auth:** Public

Request body:

```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secret123",
  "role": "CUSTOMER"
}
```

Success response:

```json
"User registered successfully"
```

Notes:
- `email` must be valid.
- `password` minimum length is 6.

### 2) Login

- **Method:** `POST`
- **Path:** `/auth/login`
- **Auth:** Public

Request body:

```json
{
  "email": "alice@example.com",
  "password": "secret123"
}
```

Success response:

```json
{
  "token": "<jwt-token>",
  "role": "CUSTOMER"
}
```

### 3) Get My Profile

- **Method:** `GET`
- **Path:** `/auth/me`
- **Auth:** JWT required

Success response:

```json
{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com",
  "role": "CUSTOMER"
}
```

### 4) Change Password

- **Method:** `PUT`
- **Path:** `/auth/change-password`
- **Auth:** JWT required

Request body:

```json
{
  "oldPassword": "1234",
  "newPassword": "abcd"
}
```

Logic:
- User is resolved from JWT.
- `oldPassword` is verified against stored encoded password.
- Password is updated using encoded `newPassword`.

Success response:

```json
"Password updated successfully"
```

### 5) Update My Profile

- **Method:** `PUT`
- **Path:** `/users/me`
- **Auth:** JWT required

Request body:

```json
{
  "name": "New Name"
}
```

Success response:

```json
{
  "id": 1,
  "name": "New Name",
  "email": "alice@example.com",
  "role": "CUSTOMER"
}
```

### 6) Get All Users (Admin)

- **Method:** `GET`
- **Path:** `/admin/users`
- **Auth:** JWT required + `ADMIN`

Success response:

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

### 7) Get User by ID (Admin)

- **Method:** `GET`
- **Path:** `/users/{id}`
- **Auth:** JWT required + `ADMIN`

Example:
- `GET /users/2`

Success response:

```json
{
  "id": 2,
  "name": "Customer User",
  "email": "customer@example.com",
  "role": "CUSTOMER"
}
```

### 8) Delete User by ID (Admin)

- **Method:** `DELETE`
- **Path:** `/users/{id}`
- **Auth:** JWT required + `ADMIN`

Example:
- `DELETE /users/2`

Success response:

```json
"User deleted successfully"
```

### 9) Create Venue (Admin)

- **Method:** `POST`
- **Path:** `/venues`
- **Auth:** JWT required + `ADMIN`

Request body:

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

Success response:
- Returns created venue object.

### 10) Update Venue (Admin)

- **Method:** `PUT`
- **Path:** `/venues/{id}`
- **Auth:** JWT required + `ADMIN`

Request body:
- Same shape as create request.

Success response:
- Returns updated venue object.

### 11) Delete Venue (Admin)

- **Method:** `DELETE`
- **Path:** `/venues/{id}`
- **Auth:** JWT required + `ADMIN`

Success response:

```json
"Venue deleted successfully"
```

### 12) List Venues

- **Method:** `GET`
- **Path:** `/venues`
- **Auth:** JWT required

Success response:
- Returns list of active venues.

### 13) Get Venue by ID

- **Method:** `GET`
- **Path:** `/venues/{id}`
- **Auth:** JWT required

Success response:
- Returns venue details (active venues).

### 14) Search Venues (Optional)

- **Method:** `GET`
- **Path:** `/venues/search?location=...&capacity=...`
- **Auth:** JWT required

Query params:
- `location` (optional): matches city/state/country
- `capacity` (optional): minimum capacity

Success response:
- Returns list of active venues matching filters.

### Venue Type Values

- `HALL`
- `OUTDOOR`
- `CONFERENCE_ROOM`
- `BANQUET`

### 15) Create Event (Admin)

- **Method:** `POST`
- **Path:** `/events`
- **Auth:** JWT required + `ADMIN`

Request body:

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

Business rules:
- `startTime` must be before `endTime`.
- Venue must exist.
- `ticketPrice` is taken from request body.
- Event `venueCost` is auto-calculated as `venue.pricePerHour * durationHours`.
- No overlapping active event at same venue and date.

Overlap logic used:

```text
(newStart < existingEnd) && (newEnd > existingStart)
```

Success response:
- Returns created event object.

### 16) Update Event (Admin)

- **Method:** `PUT`
- **Path:** `/events/{id}`
- **Auth:** JWT required + `ADMIN`

Request body:
- Same shape as create event request.

Behavior:
- Re-checks overlap while excluding the same event ID.
- Re-calculates `venueCost` from updated time window and venue hourly price.
- Uses updated `ticketPrice` from request body.

Success response:
- Returns updated event object.

### 17) Cancel Event (Admin Soft Delete)

- **Method:** `DELETE`
- **Path:** `/events/{id}`
- **Auth:** JWT required + `ADMIN`

Behavior:
- Soft delete using `status = CANCELLED`.

Success response:

```json
"Event cancelled successfully"
```

### 18) Get All Events

- **Method:** `GET`
- **Path:** `/events`
- **Auth:** JWT required (Admin/Customer)

Success response:
- Returns active events.

### 19) Get Event by ID

- **Method:** `GET`
- **Path:** `/events/{id}`
- **Auth:** JWT required (Admin/Customer)

Success response:
- Returns active event details.

### 20) Get Events by Venue

- **Method:** `GET`
- **Path:** `/events/venue/{venueId}`
- **Auth:** JWT required (Admin/Customer)

Success response:
- Returns active events for a venue.

### 21) Search Events

- **Method:** `GET`
- **Path:** `/events/search?date=...&location=...`
- **Auth:** JWT required (Admin/Customer)

Query params:
- `date` (optional): event date (`YYYY-MM-DD`)
- `location` (optional): matches venue city/state/country

Success response:
- Returns active events matching filters.

### 22) Upcoming Events

- **Method:** `GET`
- **Path:** `/events/upcoming`
- **Auth:** JWT required (Admin/Customer)

Logic:
- `eventDate >= current date`

Success response:
- Returns upcoming active events sorted by date/time.

### Event Status Values

- `ACTIVE`
- `CANCELLED`
- `COMPLETED`

### 23) Create Booking (Customer)

- **Method:** `POST`
- **Path:** `/bookings`
- **Auth:** JWT required + `CUSTOMER`

Request body:

```json
{
  "eventId": 1,
  "numberOfSeats": 3
}
```

Business rules:
- User is taken from JWT.
- Event must exist and be `ACTIVE`.
- Event must not be ended (`now <= event end time`).
- Capacity check uses confirmed seats only.
- `pricePerTicket` is snapped from `event.ticketPrice`.
- `totalPrice = pricePerTicket * numberOfSeats`.

Success response:
- Returns created booking with pricing snapshot fields (`pricePerTicket`, `totalPrice`).

### 24) Get My Bookings (Customer)

- **Method:** `GET`
- **Path:** `/bookings/my`
- **Auth:** JWT required + `CUSTOMER`

Success response:
- Returns all bookings for logged-in customer.

### 25) Cancel My Booking (Customer Soft Delete)

- **Method:** `DELETE`
- **Path:** `/bookings/{id}`
- **Auth:** JWT required + `CUSTOMER`

Behavior:
- Cancels only the logged-in user's booking.
- Soft delete by setting `status = CANCELLED`.

Success response:

```json
"Booking cancelled successfully"
```

### 26) Get All Bookings (Admin)

- **Method:** `GET`
- **Path:** `/bookings`
- **Auth:** JWT required + `ADMIN`

Success response:
- Returns all bookings across users/events.

### 27) Get Bookings By Event (Admin)

- **Method:** `GET`
- **Path:** `/bookings/event/{eventId}`
- **Auth:** JWT required + `ADMIN`

Success response:
- Returns bookings for the specified event.

### 28) Update Booking Status (Admin)

- **Method:** `PUT`
- **Path:** `/bookings/{id}/status`
- **Auth:** JWT required + `ADMIN`

Request body:

```json
{
  "status": "CANCELLED"
}
```

Supported status values:
- `CONFIRMED`
- `CANCELLED`

Success response:
- Returns the updated booking.

### 29) Event Booking Summary (Admin)

- **Method:** `GET`
- **Path:** `/bookings/event/{eventId}/summary`
- **Auth:** JWT required + `ADMIN`

Success response:

```json
{
  "eventId": 1,
  "maxCapacity": 200,
  "totalBookedSeats": 120,
  "remainingSeats": 80
}
```

### Booking Response Sample

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

## Common Error Responses

- **400 Bad Request**: validation errors
- **401 Unauthorized**: invalid credentials or invalid token
- **403 Forbidden**: authenticated but not allowed (for admin endpoints)
- **404 Not Found**: user/resource not found
- **409 Conflict**: duplicate resource (for example email already used)
- **500 Internal Server Error**: unexpected server error

For events, `409 Conflict` is returned when overlap is detected at the same venue/time.
