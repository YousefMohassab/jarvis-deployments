# Smart Building Energy Management System - API Documentation

## Overview

Base URL: `https://api.sbems.com/v1`

API Version: 1.0.0

Authentication: JWT Bearer Token

Content-Type: `application/json`

## Table of Contents

1. [Authentication](#authentication)
2. [Buildings](#buildings)
3. [Zones](#zones)
4. [HVAC Units](#hvac-units)
5. [Thermostats](#thermostats)
6. [Sensors](#sensors)
7. [Analytics](#analytics)
8. [Predictions](#predictions)
9. [Schedules](#schedules)
10. [Alerts](#alerts)
11. [Control](#control)
12. [Users](#users)
13. [WebSocket API](#websocket-api)
14. [Error Codes](#error-codes)

---

## Authentication

### Register User

```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response: 201 Created**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "viewer",
    "emailVerified": false
  },
  "metadata": {
    "timestamp": "2025-11-22T10:30:00Z"
  }
}
```

### Login

```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "facility_manager",
      "buildings": ["building_id_1", "building_id_2"]
    }
  }
}
```

### Refresh Token

```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

### Logout

```http
POST /auth/logout
Authorization: Bearer {access_token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Buildings

### List Buildings

```http
GET /buildings
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `page` (integer, default: 1): Page number
- `pageSize` (integer, default: 20): Items per page
- `search` (string): Search by name or address
- `active` (boolean): Filter by active status

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "building_uuid_1",
      "name": "Main Office Building",
      "address": "123 Main St, New York, NY 10001",
      "totalArea": 50000.00,
      "floors": 10,
      "timezone": "America/New_York",
      "activeZones": 45,
      "activeHVAC": 12,
      "currentPower": 245.6,
      "dailyEnergy": 5892.4,
      "active": true,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### Get Building Details

```http
GET /buildings/:id
Authorization: Bearer {access_token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "id": "building_uuid_1",
    "name": "Main Office Building",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "totalArea": 50000.00,
    "floors": 10,
    "timezone": "America/New_York",
    "latitude": 40.7580,
    "longitude": -73.9855,
    "utilityAccount": "ACCT-12345",
    "baselineConsumption": 6000.00,
    "zones": 45,
    "hvacUnits": 12,
    "sensors": 120,
    "active": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-11-22T10:30:00Z"
  }
}
```

### Create Building

```http
POST /buildings
Authorization: Bearer {access_token}
```

**Required Permission:** `admin`

**Request Body:**
```json
{
  "name": "Main Office Building",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "totalArea": 50000.00,
  "floors": 10,
  "timezone": "America/New_York",
  "latitude": 40.7580,
  "longitude": -73.9855,
  "utilityAccount": "ACCT-12345"
}
```

**Response: 201 Created**
```json
{
  "success": true,
  "data": {
    "id": "building_uuid_1",
    "name": "Main Office Building",
    "address": "123 Main St",
    "active": true,
    "createdAt": "2025-11-22T10:30:00Z"
  }
}
```

### Get Building Overview

```http
GET /buildings/:id/overview
Authorization: Bearer {access_token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "buildingId": "building_uuid_1",
    "buildingName": "Main Office Building",
    "currentMetrics": {
      "totalPower": 245.6,
      "averageTemperature": 22.5,
      "totalOccupancy": 325,
      "activeAlerts": 2,
      "hvacUnitsOnline": 12,
      "hvacUnitsOffline": 0
    },
    "todayStats": {
      "energyConsumption": 5892.4,
      "peakPower": 312.5,
      "averagePower": 245.5,
      "estimatedCost": 1178.48,
      "co2Emissions": 2474.81
    },
    "zones": [
      {
        "id": "zone_uuid_1",
        "name": "Floor 1 - North",
        "temperature": 22.3,
        "targetTemperature": 23.0,
        "occupancy": 35,
        "hvacStatus": "cooling"
      }
    ],
    "recentAlerts": [
      {
        "id": "alert_uuid_1",
        "severity": "warning",
        "title": "High temperature in Zone 3",
        "createdAt": "2025-11-22T10:25:00Z"
      }
    ]
  }
}
```

---

## Zones

### List Zones

```http
GET /buildings/:buildingId/zones
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `floor` (integer): Filter by floor
- `type` (string): Filter by zone type
- `active` (boolean): Filter by active status

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "zone_uuid_1",
      "name": "Floor 1 - North",
      "floor": 1,
      "area": 2500.00,
      "zoneType": "office",
      "targetTempMin": 20.0,
      "targetTempMax": 24.0,
      "occupancyCapacity": 50,
      "currentTemperature": 22.3,
      "currentHumidity": 45.2,
      "currentOccupancy": 35,
      "hvacStatus": "cooling",
      "active": true
    }
  ]
}
```

### Get Zone Details

```http
GET /zones/:id
Authorization: Bearer {access_token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "id": "zone_uuid_1",
    "buildingId": "building_uuid_1",
    "name": "Floor 1 - North",
    "floor": 1,
    "area": 2500.00,
    "zoneType": "office",
    "targetTempMin": 20.0,
    "targetTempMax": 24.0,
    "targetHumidityMin": 30.0,
    "targetHumidityMax": 60.0,
    "occupancyCapacity": 50,
    "occupancyEnabled": true,
    "hvacEnabled": true,
    "currentMetrics": {
      "temperature": 22.3,
      "humidity": 45.2,
      "occupancy": 35,
      "co2": 450
    },
    "hvacUnits": [
      {
        "id": "hvac_uuid_1",
        "name": "RTU-01",
        "status": "active",
        "mode": "cooling"
      }
    ],
    "thermostats": [
      {
        "id": "thermostat_uuid_1",
        "name": "Thermostat Zone 1",
        "currentTemp": 22.3,
        "targetTemp": 23.0
      }
    ],
    "activeSchedules": 2,
    "active": true
  }
}
```

### Create Zone

```http
POST /buildings/:buildingId/zones
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "name": "Floor 1 - North",
  "floor": 1,
  "area": 2500.00,
  "zoneType": "office",
  "targetTempMin": 20.0,
  "targetTempMax": 24.0,
  "occupancyCapacity": 50
}
```

**Response: 201 Created**

### Set Zone Setpoint

```http
POST /zones/:id/setpoint
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "targetTemp": 23.0,
  "mode": "cool",
  "duration": 120,
  "reason": "Manual adjustment"
}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "commandId": "cmd_uuid_1",
    "status": "pending",
    "targetTemp": 23.0,
    "mode": "cool",
    "expiresAt": "2025-11-22T12:30:00Z"
  }
}
```

---

## HVAC Units

### List HVAC Units

```http
GET /buildings/:buildingId/hvac-units
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `status` (string): active, inactive, maintenance, fault
- `zone` (uuid): Filter by zone ID
- `manufacturer` (string): Filter by manufacturer

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "hvac_uuid_1",
      "name": "RTU-01",
      "manufacturer": "Trane",
      "model": "Voyager",
      "capacityTons": 10.0,
      "protocol": "bacnet",
      "status": "active",
      "currentMode": "cooling",
      "zoneName": "Floor 1 - North",
      "currentMetrics": {
        "supplyTemp": 15.5,
        "returnTemp": 24.2,
        "power": 45.6,
        "compressorSpeed": 75.0,
        "fanSpeed": 60.0
      },
      "lastSeen": "2025-11-22T10:30:00Z"
    }
  ]
}
```

### Get HVAC Unit Details

```http
GET /hvac-units/:id
Authorization: Bearer {access_token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "id": "hvac_uuid_1",
    "buildingId": "building_uuid_1",
    "zoneId": "zone_uuid_1",
    "name": "RTU-01",
    "manufacturer": "Trane",
    "model": "Voyager",
    "serialNumber": "TRN-12345",
    "capacityTons": 10.0,
    "capacityKW": 35.17,
    "protocol": "bacnet",
    "connectionConfig": {
      "ipAddress": "192.168.1.100",
      "port": 47808,
      "deviceId": 123
    },
    "status": "active",
    "currentMode": "cooling",
    "installedDate": "2023-01-15",
    "lastMaintenance": "2025-10-01",
    "nextMaintenance": "2026-04-01",
    "efficiencyRating": 14.5,
    "currentMetrics": {
      "supplyTemp": 15.5,
      "returnTemp": 24.2,
      "outdoorTemp": 30.5,
      "flowRate": 2500.0,
      "pressureDischarge": 250.0,
      "pressureSuction": 70.0,
      "compressorSpeed": 75.0,
      "fanSpeed": 60.0,
      "valvePosition": 45.0,
      "power": 45.6
    },
    "faultCodes": [],
    "metadata": {},
    "createdAt": "2023-01-15T00:00:00Z",
    "updatedAt": "2025-11-22T10:30:00Z"
  }
}
```

### Get HVAC Unit Status

```http
GET /hvac-units/:id/status
Authorization: Bearer {access_token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "hvacUnitId": "hvac_uuid_1",
    "status": "active",
    "mode": "cooling",
    "online": true,
    "supplyTemp": 15.5,
    "returnTemp": 24.2,
    "power": 45.6,
    "compressorSpeed": 75.0,
    "fanSpeed": 60.0,
    "faultCodes": [],
    "lastUpdate": "2025-11-22T10:30:00Z"
  }
}
```

### Get HVAC Telemetry

```http
GET /hvac-units/:id/telemetry
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `startDate` (ISO 8601 timestamp): Start of time range
- `endDate` (ISO 8601 timestamp): End of time range
- `interval` (string): 1min, 5min, 15min, 1hour (default: 5min)

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "hvacUnitId": "hvac_uuid_1",
    "interval": "5min",
    "dataPoints": [
      {
        "timestamp": "2025-11-22T10:00:00Z",
        "supplyTemp": 15.5,
        "returnTemp": 24.2,
        "outdoorTemp": 30.5,
        "power": 45.6,
        "compressorSpeed": 75.0,
        "fanSpeed": 60.0,
        "mode": "cooling",
        "status": "running"
      }
    ]
  }
}
```

### Send Control Command

```http
POST /hvac-units/:id/control
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "action": "set_temperature",
  "parameters": {
    "value": 15.0,
    "priority": 8
  },
  "reason": "Manual adjustment"
}
```

**Valid Actions:**
- `set_temperature`: Set supply temperature
- `set_mode`: Change operating mode
- `set_fan_speed`: Set fan speed percentage
- `power`: Turn on/off

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "commandId": "cmd_uuid_1",
    "status": "sent",
    "sentAt": "2025-11-22T10:30:00Z"
  }
}
```

### Get Performance Metrics

```http
GET /hvac-units/:id/performance
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `startDate` (ISO 8601 timestamp)
- `endDate` (ISO 8601 timestamp)

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "hvacUnitId": "hvac_uuid_1",
    "period": {
      "start": "2025-11-01T00:00:00Z",
      "end": "2025-11-22T10:30:00Z"
    },
    "runtime": {
      "totalHours": 504.5,
      "coolingHours": 380.2,
      "heatingHours": 0,
      "fanOnlyHours": 124.3
    },
    "energy": {
      "totalConsumption": 12345.6,
      "averagePower": 24.5,
      "peakPower": 52.3
    },
    "efficiency": {
      "averageEER": 13.8,
      "actualSEER": 14.2
    },
    "maintenance": {
      "lastMaintenance": "2025-10-01",
      "daysSinceMaintenance": 52,
      "nextMaintenance": "2026-04-01",
      "daysUntilMaintenance": 130
    }
  }
}
```

---

## Analytics

### Get Energy Consumption

```http
GET /analytics/energy-consumption
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `buildingId` (uuid, required): Building ID
- `zoneId` (uuid, optional): Zone ID for zone-specific data
- `startDate` (ISO 8601 timestamp, required)
- `endDate` (ISO 8601 timestamp, required)
- `granularity` (string): hour, day, week, month (default: hour)

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "buildingId": "building_uuid_1",
    "period": {
      "start": "2025-11-01T00:00:00Z",
      "end": "2025-11-22T10:30:00Z",
      "granularity": "day"
    },
    "summary": {
      "totalEnergy": 124567.8,
      "averagePower": 238.6,
      "peakPower": 312.5,
      "peakTime": "2025-11-15T14:00:00Z"
    },
    "dataPoints": [
      {
        "timestamp": "2025-11-01T00:00:00Z",
        "energy": 5892.4,
        "avgPower": 245.5,
        "peakPower": 289.3
      }
    ]
  }
}
```

### Get Temperature History

```http
GET /analytics/temperature-history
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `zoneId` (uuid, required)
- `startDate` (ISO 8601 timestamp, required)
- `endDate` (ISO 8601 timestamp, required)
- `interval` (string): 5min, 15min, 1hour (default: 15min)

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "zoneId": "zone_uuid_1",
    "zoneName": "Floor 1 - North",
    "period": {
      "start": "2025-11-22T00:00:00Z",
      "end": "2025-11-22T23:59:59Z"
    },
    "statistics": {
      "average": 22.5,
      "min": 20.8,
      "max": 24.3,
      "stdDev": 0.8
    },
    "dataPoints": [
      {
        "timestamp": "2025-11-22T00:00:00Z",
        "temperature": 22.3,
        "humidity": 45.2,
        "setpoint": 23.0
      }
    ]
  }
}
```

### Calculate Savings

```http
GET /analytics/savings
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `buildingId` (uuid, required)
- `period` (string): today, week, month, year, custom
- `startDate` (ISO 8601, required if period=custom)
- `endDate` (ISO 8601, required if period=custom)

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "buildingId": "building_uuid_1",
    "period": {
      "start": "2025-11-01T00:00:00Z",
      "end": "2025-11-22T10:30:00Z",
      "type": "month"
    },
    "baseline": {
      "consumption": 135000.0,
      "method": "historical_average"
    },
    "actual": {
      "consumption": 124567.8
    },
    "savings": {
      "energyKWh": 10432.2,
      "percent": 7.7,
      "costUSD": 2086.44,
      "co2KG": 4381.51
    },
    "breakdown": {
      "hvacOptimization": 6259.3,
      "scheduleOptimization": 3172.9,
      "manualAdjustments": 1000.0
    }
  }
}
```

### Export Data

```http
GET /analytics/export
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `type` (string, required): energy, temperature, hvac_telemetry, alerts
- `buildingId` (uuid, required)
- `startDate` (ISO 8601 timestamp, required)
- `endDate` (ISO 8601 timestamp, required)
- `format` (string): csv, xlsx, json (default: csv)

**Response: 200 OK**
- Content-Type: text/csv | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | application/json
- Content-Disposition: attachment; filename="export_energy_20251122.csv"

---

## Predictions

### Get Load Forecast

```http
GET /predictions/load-forecast
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `buildingId` (uuid, required)
- `horizon` (integer): Hours to predict (1-72, default: 24)

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "buildingId": "building_uuid_1",
    "predictionTime": "2025-11-22T10:30:00Z",
    "modelVersion": "v1.2.3",
    "horizon": 24,
    "predictions": [
      {
        "timestamp": "2025-11-22T11:00:00Z",
        "predictedLoad": 245.6,
        "confidence": 92.5,
        "upperBound": 268.2,
        "lowerBound": 223.0
      }
    ]
  }
}
```

### Get Optimization Recommendations

```http
GET /predictions/optimization
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `buildingId` (uuid, required)

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "buildingId": "building_uuid_1",
    "generatedAt": "2025-11-22T10:30:00Z",
    "recommendations": [
      {
        "type": "pre_cooling",
        "zone": "zone_uuid_1",
        "action": "Lower setpoint to 21°C",
        "startTime": "2025-11-22T11:00:00Z",
        "duration": 120,
        "estimatedSavings": {
          "costUSD": 45.30,
          "energyKWh": 180.0,
          "co2KG": 75.6
        },
        "confidence": 87.5,
        "reason": "Peak rate period starting at 13:00"
      }
    ],
    "totalPotentialSavings": {
      "costUSD": 135.90,
      "energyKWh": 540.0,
      "co2KG": 226.8
    }
  }
}
```

---

## WebSocket API

### Connection

```javascript
const socket = io('wss://api.sbems.com', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Subscribe to Channel

```javascript
socket.emit('subscribe', {
  channel: 'energy',
  buildingId: 'building_uuid_1'
});
```

### Available Channels

**Energy Channel:**
```javascript
socket.on('energy', (data) => {
  console.log(data);
  // {
  //   buildingId: "uuid",
  //   timestamp: "2025-11-22T10:30:00Z",
  //   powerConsumption: 245.6,
  //   energyTotal: 5892.4
  // }
});
```

**Temperature Channel:**
```javascript
socket.on('temperature', (data) => {
  console.log(data);
  // {
  //   zoneId: "uuid",
  //   timestamp: "2025-11-22T10:30:00Z",
  //   currentTemp: 22.5,
  //   targetTemp: 23.0,
  //   humidity: 45.2
  // }
});
```

**Alerts Channel:**
```javascript
socket.on('alert', (data) => {
  console.log(data);
  // {
  //   id: "uuid",
  //   buildingId: "uuid",
  //   severity: "critical",
  //   title: "HVAC Fault Detected",
  //   description: "Compressor pressure exceeds threshold",
  //   timestamp: "2025-11-22T10:30:00Z"
  // }
});
```

---

## Error Codes

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "targetTemp",
        "message": "Must be between 18 and 26 degrees"
      }
    ]
  },
  "metadata": {
    "timestamp": "2025-11-22T10:30:00Z",
    "requestId": "req_123456"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Request validation failed |
| UNAUTHORIZED | 401 | Missing or invalid authentication |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict (duplicate) |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Internal server error |
| DEVICE_OFFLINE | 503 | Device not responding |
| INTEGRATION_ERROR | 503 | External integration failure |

---

## Rate Limiting

- 100 requests per minute per user
- 1000 requests per hour per user
- 10,000 requests per day per user

Rate limit headers:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

---

## Versioning

API versioning is done via URL path: `/v1/`, `/v2/`, etc.

Current version: `v1`

---

## Support

For API support, contact: api-support@sbems.com

Documentation: https://docs.sbems.com

Status Page: https://status.sbems.com
