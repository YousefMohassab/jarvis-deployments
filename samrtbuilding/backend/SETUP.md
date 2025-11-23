# Smart Building Energy Management - Backend Setup

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Configure your .env file with actual values

4. Start with Docker Compose (recommended):
```bash
docker-compose up -d
```

5. Or run locally:
```bash
npm run dev
```

## Project Structure

- `/src/config` - Configuration files (database, redis, mqtt, websocket)
- `/src/middleware` - Express middleware (auth, error handling, rate limiting)
- `/src/models` - Sequelize database models
- `/src/routes` - API route definitions
- `/src/controllers` - Request handlers
- `/src/services` - Business logic and external integrations
- `/src/workers` - Background job workers
- `/src/utils` - Utility functions
- `/src/db` - Database migrations and seeds

## Features Implemented

- ✓ JWT Authentication
- ✓ PostgreSQL + TimescaleDB
- ✓ Redis Caching
- ✓ WebSocket (Socket.IO)
- ✓ MQTT Integration
- ✓ BACnet Mock Service
- ✓ Modbus Mock Service
- ✓ Background Workers
- ✓ Rate Limiting
- ✓ Error Handling
- ✓ Logging (Winston)
- ✓ Input Validation

## API Endpoints

See docs/API.md for complete API documentation

## Environment Variables

See .env.example for all configuration options

