# Smart Building Energy Management API Documentation

Base URL: `http://localhost:8000/api`

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Login
```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "admin@smartbuilding.com",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "admin@smartbuilding.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Register
```
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "viewer"
}
```

### Logout
```
POST /auth/logout
Headers: Authorization: Bearer <token>
```

### Refresh Token
```
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Energy Endpoints

### Get Current Energy
```
GET /energy/current?buildingId=1
Headers: Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currentPower": 125.5,
    "readings": [...],
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Get Historical Energy
```
GET /energy/historical?buildingId=1&startDate=2024-01-01&endDate=2024-01-15
Headers: Authorization: Bearer <token>
```

### Get Energy by Zones
```
GET /energy/zones?buildingId=1
Headers: Authorization: Bearer <token>
```

### Get Peak Demand
```
GET /energy/peak-demand?buildingId=1&date=2024-01-15
Headers: Authorization: Bearer <token>
```

### Get Energy Forecast
```
GET /energy/forecast?buildingId=1&hours=24
Headers: Authorization: Bearer <token>
```

## Zone Endpoints

### List All Zones
```
GET /zones?buildingId=1
Headers: Authorization: Bearer <token>
```

### Get Zone Details
```
GET /zones/:id
Headers: Authorization: Bearer <token>
```

### Update Zone
```
PUT /zones/:id
Headers: Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Floor 1 - Updated",
  "mode": "cool"
}
```

### Update Zone Setpoint
```
PUT /zones/:id/setpoint
Headers: Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "temperature": 72,
  "mode": "auto"
}
```

## Equipment Endpoints

### List All Equipment
```
GET /equipment?buildingId=1&type=hvac
Headers: Authorization: Bearer <token>
```

### Get Equipment Details
```
GET /equipment/:id
Headers: Authorization: Bearer <token>
```

### Control Equipment
```
POST /equipment/:id/control
Headers: Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "action": "start",
  "value": null
}
```

Actions: `start`, `stop`, `restart`, `setpoint`

### Get Maintenance History
```
GET /equipment/:id/maintenance
Headers: Authorization: Bearer <token>
```

## Analytics Endpoints

### Get Consumption
```
GET /analytics/consumption?buildingId=1&startDate=2024-01-01&endDate=2024-01-15
Headers: Authorization: Bearer <token>
```

### Get Savings
```
GET /analytics/savings?buildingId=1
Headers: Authorization: Bearer <token>
```

### Get Efficiency
```
GET /analytics/efficiency?buildingId=1
Headers: Authorization: Bearer <token>
```

### Get Trends
```
GET /analytics/trends?buildingId=1&period=7d
Headers: Authorization: Bearer <token>
```

### Generate Report
```
POST /analytics/report
Headers: Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "reportType": "consumption",
  "startDate": "2024-01-01",
  "endDate": "2024-01-15",
  "format": "json"
}
```

## Alert Endpoints

### List All Alerts
```
GET /alerts?buildingId=1&status=active&severity=critical
Headers: Authorization: Bearer <token>
```

### Get Alert Details
```
GET /alerts/:id
Headers: Authorization: Bearer <token>
```

### Acknowledge Alert
```
PUT /alerts/:id/acknowledge
Headers: Authorization: Bearer <token>
```

### Resolve Alert
```
PUT /alerts/:id/resolve
Headers: Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "resolution": "Fixed temperature sensor calibration"
}
```

## Settings Endpoints

### Get Settings
```
GET /settings
Headers: Authorization: Bearer <token>
```

### Update Settings
```
PUT /settings
Headers: Authorization: Bearer <token>
Roles: admin, manager
```

**Request Body:**
```json
{
  "energyRate": 0.15,
  "temperatureUnit": "F",
  "alertThresholds": {
    "temperature": {
      "high": 80,
      "low": 65
    }
  }
}
```

## WebSocket Connection

Connect to: `ws://localhost:8000`

**Authentication:**
```javascript
const socket = io('http://localhost:8000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

**Join Rooms:**
```javascript
socket.emit('join:building', buildingId);
socket.emit('join:zone', zoneId);
```

**Listen for Events:**
```javascript
socket.on('energy:update', (data) => {
  console.log('Energy update:', data);
});

socket.on('zone:update', (data) => {
  console.log('Zone update:', data);
});

socket.on('equipment:status', (data) => {
  console.log('Equipment status:', data);
});

socket.on('alert:new', (alert) => {
  console.log('New alert:', alert);
});
```

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/energy/current",
  "method": "GET"
}
```

### Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `503` - Service Unavailable

## Rate Limiting

- General API: 100 requests per 15 minutes
- Authentication: 5 requests per 15 minutes
- Control Actions: 10 requests per minute

Rate limit info is included in response headers:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Pagination

Endpoints that return lists support pagination:

```
GET /zones?page=1&limit=20&sortBy=name&sortOrder=asc
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

## Date Formats

All dates use ISO 8601 format:
```
2024-01-15T10:30:00.000Z
```

## Testing with cURL

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smartbuilding.com","password":"Admin123!"}'

# Get current energy (replace TOKEN with actual token)
curl http://localhost:8000/api/energy/current?buildingId=1 \
  -H "Authorization: Bearer TOKEN"

# Update zone setpoint
curl -X PUT http://localhost:8000/api/zones/1/setpoint \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"temperature":72,"mode":"auto"}'

# Control equipment
curl -X POST http://localhost:8000/api/equipment/1/control \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"start"}'
```

## Postman Collection

Import the Postman collection (coming soon) for easy API testing.

## Support

For API support or questions, contact: support@smartbuilding.com
