# Territory Running App - API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### 1. Register User

**Endpoint:** `POST /auth/register`

**Description:** Create a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (Success - 201):**
```json
{
  "message": "User registered successfully.",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

**Response (Error - 409):**
```json
{
  "message": "Email already in use."
}
```

---

### 2. Login User

**Endpoint:** `POST /auth/login`

**Description:** Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (Success - 200):**
```json
{
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

---

### 3. Get User Profile

**Endpoint:** `GET /auth/profile`

**Description:** Get current authenticated user's profile and statistics.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success - 200):**
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "stats": {
    "id": 1,
    "user_id": 1,
    "total_distance": 45000,
    "total_time": 36000,
    "total_calories": 2880,
    "total_territory_area": 2500000,
    "total_running_sessions": 5,
    "updated_at": "2024-01-20T15:45:00Z"
  }
}
```

---

## Running Session Endpoints

### 1. Start Running Session

**Endpoint:** `POST /run/start`

**Description:** Initiate a new running session.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success - 201):**
```json
{
  "message": "Running session started.",
  "sessionId": 42,
  "startTime": "2024-01-20T16:00:00Z"
}
```

---

### 2. Add Coordinate

**Endpoint:** `POST /run/:sessionId/coordinate`

**Description:** Record GPS coordinate during a run (called every 5 seconds).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `sessionId` (required): The running session ID

**Request Body:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Response (Success - 200):**
```json
{
  "message": "Coordinate recorded.",
  "coordinate": {
    "id": 521,
    "running_session_id": 42,
    "latitude": 40.7128,
    "longitude": -74.0060,
    "recorded_at": "2024-01-20T16:00:05Z"
  }
}
```

---

### 3. Pause Session

**Endpoint:** `POST /run/:sessionId/pause`

**Description:** Pause the running session (tracking stops client-side).

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `sessionId` (required): The running session ID

**Response (Success - 200):**
```json
{
  "message": "Session paused."
}
```

---

### 4. Finish Session

**Endpoint:** `POST /run/:sessionId/finish`

**Description:** Complete the running session and calculate statistics.

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `sessionId` (required): The running session ID

**Response (Success - 200):**
```json
{
  "message": "Session finished.",
  "session": {
    "id": 42,
    "user_id": 1,
    "start_time": "2024-01-20T16:00:00Z",
    "end_time": "2024-01-20T16:45:30Z",
    "is_closed_loop": true,
    "total_distance": 5.2,
    "total_time": 2730,
    "estimated_calories": 185
  },
  "stats": {
    "distance": 5.2,
    "calories": 185,
    "time": 2730
  },
  "isClosedLoop": true,
  "territoryId": 15,
  "territoryArea": "2500000.50"
}
```

---

### 5. Get Session Details

**Endpoint:** `GET /run/:sessionId`

**Description:** Retrieve details of a specific running session including route coordinates.

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `sessionId` (required): The running session ID

**Response (Success - 200):**
```json
{
  "session": {
    "id": 42,
    "user_id": 1,
    "start_time": "2024-01-20T16:00:00Z",
    "end_time": "2024-01-20T16:45:30Z",
    "is_closed_loop": true,
    "total_distance": 5.2,
    "total_time": 2730,
    "estimated_calories": 185,
    "created_at": "2024-01-20T16:00:00Z"
  },
  "coordinates": [
    {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    {
      "latitude": 40.7150,
      "longitude": -74.0045
    }
  ]
}
```

---

### 6. Get Run History

**Endpoint:** `GET /run/history/all`

**Description:** Get user's recent running sessions with territory information.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional): Number of sessions to retrieve (default: 20)

**Response (Success - 200):**
```json
{
  "sessions": [
    {
      "id": 42,
      "start_time": "2024-01-20T16:00:00Z",
      "end_time": "2024-01-20T16:45:30Z",
      "is_closed_loop": true,
      "total_distance": 5.2,
      "total_time": 2730,
      "estimated_calories": 185,
      "territory_id": 15,
      "area": 2500000
    }
  ]
}
```

---

## Territory Endpoints

### 1. Get All Territories

**Endpoint:** `GET /territory/all`

**Description:** Retrieve all territories currently in the system.

**Response (Success - 200):**
```json
{
  "territories": [
    {
      "id": 15,
      "user_id": 1,
      "running_session_id": 42,
      "polygon_coords": [
        [40.7128, -74.0060],
        [40.7150, -74.0045],
        [40.7140, -74.0070]
      ],
      "area": 2500000,
      "center_lat": 40.7139,
      "center_lon": -74.0058,
      "username": "johndoe",
      "created_at": "2024-01-20T16:45:30Z"
    }
  ]
}
```

---

### 2. Get Territories in Bounds

**Endpoint:** `GET /territory/bounds`

**Description:** Retrieve territories within a geographic bounding box.

**Query Parameters:**
- `minLat` (required): Minimum latitude
- `maxLat` (required): Maximum latitude
- `minLon` (required): Minimum longitude
- `maxLon` (required): Maximum longitude

**Example:**
```
GET /territory/bounds?minLat=40.70&maxLat=40.72&minLon=-74.01&maxLon=-74.00
```

**Response (Success - 200):**
```json
{
  "territories": [
    {
      "id": 15,
      "user_id": 1,
      "polygon_coords": [...],
      "area": 2500000,
      "username": "johndoe"
    }
  ]
}
```

---

### 3. Get Territory Details

**Endpoint:** `GET /territory/:territoryId`

**Description:** Get detailed information about a specific territory.

**URL Parameters:**
- `territoryId` (required): The territory ID

**Response (Success - 200):**
```json
{
  "territory": {
    "id": 15,
    "user_id": 1,
    "running_session_id": 42,
    "polygon_coords": [...],
    "area": 2500000,
    "center_lat": 40.7139,
    "center_lon": -74.0058,
    "created_at": "2024-01-20T16:45:30Z"
  }
}
```

---

### 4. Get User's Territories

**Endpoint:** `GET /territory/user/territories`

**Description:** Retrieve all territories owned by the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success - 200):**
```json
{
  "territories": [
    {
      "id": 15,
      "user_id": 1,
      "polygon_coords": [...],
      "area": 2500000
    },
    {
      "id": 16,
      "user_id": 1,
      "polygon_coords": [...],
      "area": 1800000
    }
  ]
}
```

---

## Leaderboard Endpoints

### 1. Get Leaderboard by Territory Area

**Endpoint:** `GET /leaderboard/area`

**Description:** Get top users ranked by total territory area captured.

**Query Parameters:**
- `limit` (optional): Number of top users (default: 10)

**Example:**
```
GET /leaderboard/area?limit=15
```

**Response (Success - 200):**
```json
{
  "leaderboard": [
    {
      "id": 1,
      "user_id": 1,
      "total_distance": 45000,
      "total_time": 36000,
      "total_calories": 2880,
      "total_territory_area": 5200000,
      "total_running_sessions": 8,
      "username": "johndoe"
    },
    {
      "id": 2,
      "user_id": 2,
      "total_distance": 32000,
      "total_territory_area": 4800000,
      "username": "janedoe"
    }
  ]
}
```

---

### 2. Get Leaderboard by Distance

**Endpoint:** `GET /leaderboard/distance`

**Description:** Get top users ranked by total running distance.

**Query Parameters:**
- `limit` (optional): Number of top users (default: 10)

**Response (Success - 200):**
```json
{
  "leaderboard": [
    {
      "id": 1,
      "user_id": 3,
      "total_distance": 128500,
      "total_territory_area": 3200000,
      "username": "marathoner"
    }
  ]
}
```

---

### 3. Get User's Rank by Territory Area

**Endpoint:** `GET /leaderboard/rank/area`

**Description:** Get the authenticated user's rank based on territory area.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success - 200):**
```json
{
  "rank": 5
}
```

---

### 4. Get User's Rank by Distance

**Endpoint:** `GET /leaderboard/rank/distance`

**Description:** Get the authenticated user's rank based on total distance.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success - 200):**
```json
{
  "rank": 12
}
```

---

## Error Responses

### 400 - Bad Request
```json
{
  "message": "Username, email, and password are required."
}
```

### 401 - Unauthorized
```json
{
  "message": "Invalid email or password."
}
```

### 404 - Not Found
```json
{
  "message": "Session not found."
}
```

### 409 - Conflict
```json
{
  "message": "Email already in use."
}
```

### 500 - Internal Server Error
```json
{
  "message": "Internal server error."
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production:
- Account creation: 5 requests per hour
- Login attempts: 10 requests per hour
- Coordinate recording: 1000 requests per hour

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Distances are in kilometers
- Areas are in square meters
- All coordinates are in [latitude, longitude] format
- JWT tokens expire after 7 days by default
