# Smart Building Energy Management System - Backend API

A production-ready Node.js + Express backend API for managing and optimizing building energy consumption with real-time monitoring, IoT device integration, and predictive analytics.

## Features

- **RESTful API** - Complete REST API with JWT authentication
- **Real-time Updates** - WebSocket (Socket.IO) for live data streaming
- **IoT Integration** - MQTT, BACnet, and Modbus protocol support
- **Time-Series Data** - PostgreSQL + TimescaleDB for efficient energy data storage
- **Caching Layer** - Redis for high-performance data caching
- **Background Workers** - Automated data collection, alerts, and optimization
- **Predictive Analytics** - Energy forecasting and optimization algorithms
- **Alert System** - Configurable alerts with multi-channel notifications
- **Security** - JWT authentication, rate limiting, input validation
- **Logging** - Comprehensive logging with Winston
- **Docker Support** - Full Docker Compose setup for easy deployment

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express 4.x
- **Database**: PostgreSQL 15 + TimescaleDB 2.x
- **Cache**: Redis 7.x
- **Real-time**: Socket.IO
- **IoT**: MQTT.js, node-bacnet, modbus-serial
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi
- **ORM**: Sequelize
- **Logging**: Winston
- **Job Scheduling**: node-cron

## Quick Start

### Using Docker (Recommended)

```bash
# Clone and navigate to backend directory
cd /home/facilis/workspace/storage/UZ2CcrTd13NrEAm81F1qLWHyAiD2/projects/smart-building-energy-mgmt/backend

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start all services with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f api

# Access API at http://localhost:8000
```

### Manual Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure your .env file
nano .env

# Make sure PostgreSQL, Redis, and MQTT broker are running

# Run database migrations (if any)
npm run migrate

# Seed database with sample data
npm run seed

# Start development server
npm run dev

# Or start production server
npm start
```

## Project Structure

```
backend/
├── server.js                 # Application entry point
├── package.json             # Dependencies and scripts
├── Dockerfile              # Docker configuration
├── docker-compose.yml      # Multi-container setup
├── .env.example           # Environment variables template
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.js  # PostgreSQL/TimescaleDB config
│   │   ├── redis.js     # Redis client setup
│   │   ├── mqtt.js      # MQTT broker configuration
│   │   └── websocket.js # Socket.IO setup
│   ├── middleware/       # Express middleware
│   │   ├── auth.js      # JWT authentication
│   │   ├── errorHandler.js # Global error handling
│   │   ├── validator.js    # Request validation
│   │   └── rateLimit.js    # Rate limiting
│   ├── models/          # Sequelize models
│   │   ├── User.js
│   │   ├── Building.js
│   │   ├── Zone.js
│   │   ├── Equipment.js
│   │   ├── Sensor.js
│   │   ├── EnergyReading.js
│   │   ├── Alert.js
│   │   └── Schedule.js
│   ├── routes/          # API routes
│   │   ├── auth.routes.js
│   │   ├── energy.routes.js
│   │   ├── zones.routes.js
│   │   ├── equipment.routes.js
│   │   ├── analytics.routes.js
│   │   ├── alerts.routes.js
│   │   └── settings.routes.js
│   ├── controllers/     # Request handlers
│   │   ├── auth.controller.js
│   │   ├── energy.controller.js
│   │   └── ...
│   ├── services/        # Business logic
│   │   ├── bacnet.service.js
│   │   ├── modbus.service.js
│   │   └── mqtt.service.js
│   ├── workers/         # Background jobs
│   │   ├── dataCollector.js
│   │   ├── alertMonitor.js
│   │   └── optimizer.js
│   ├── utils/          # Utility functions
│   │   ├── logger.js
│   │   ├── calculations.js
│   │   └── validators.js
│   └── db/            # Database migrations and seeds
│       ├── migrations/
│       └── seeds/
└── tests/            # Test files
    ├── unit/
    └── integration/
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update user profile

### Energy
- `GET /api/energy/current` - Current energy consumption
- `GET /api/energy/historical` - Historical energy data
- `GET /api/energy/zones` - Energy by zones
- `GET /api/energy/peak-demand` - Peak demand analysis
- `GET /api/energy/forecast` - Energy forecast
- `GET /api/energy/summary` - Energy summary

### Zones
- `GET /api/zones` - List all zones
- `GET /api/zones/:id` - Get zone details
- `PUT /api/zones/:id` - Update zone
- `PUT /api/zones/:id/setpoint` - Update temperature setpoint
- `GET /api/zones/:id/schedule` - Get zone schedule
- `PUT /api/zones/:id/schedule` - Update zone schedule

### Equipment
- `GET /api/equipment` - List all equipment
- `GET /api/equipment/:id` - Get equipment details
- `POST /api/equipment/:id/control` - Control equipment (start/stop)
- `GET /api/equipment/:id/maintenance` - Get maintenance history
- `PUT /api/equipment/:id/maintenance` - Update maintenance

### Analytics
- `GET /api/analytics/consumption` - Consumption analytics
- `GET /api/analytics/savings` - Energy savings analysis
- `GET /api/analytics/efficiency` - Efficiency metrics
- `GET /api/analytics/trends` - Trend analysis
- `POST /api/analytics/report` - Generate custom report

### Alerts
- `GET /api/alerts` - List all alerts
- `GET /api/alerts/:id` - Get alert details
- `PUT /api/alerts/:id/acknowledge` - Acknowledge alert
- `PUT /api/alerts/:id/resolve` - Resolve alert
- `POST /api/alerts/settings` - Update alert settings

### Settings
- `GET /api/settings` - Get system settings
- `PUT /api/settings` - Update system settings (admin only)

## WebSocket Events

### Client → Server
- `join:building` - Join building room for updates
- `join:zone` - Join zone room for updates
- `leave:building` - Leave building room
- `leave:zone` - Leave zone room

### Server → Client
- `energy:update` - Real-time energy data update
- `zone:update` - Zone status/temperature update
- `equipment:status` - Equipment status change
- `alert:new` - New alert notification
- `system:status` - System status update

## MQTT Topics

- `hvac/+/status` - HVAC equipment status
- `sensors/+/temperature` - Temperature sensor readings
- `sensors/+/humidity` - Humidity sensor readings
- `sensors/+/occupancy` - Occupancy sensor data
- `equipment/+/control` - Equipment control commands
- `alerts/+` - Alert notifications

## Environment Variables

See `.env.example` for all available configuration options:

- **NODE_ENV** - Environment (development/production)
- **PORT** - Server port (default: 8000)
- **DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD** - PostgreSQL configuration
- **REDIS_HOST, REDIS_PORT** - Redis configuration
- **JWT_SECRET** - JWT signing secret
- **MQTT_BROKER** - MQTT broker URL
- **ENABLE_MOCK_DEVICES** - Enable mock device simulation
- **ENABLE_WEBSOCKET** - Enable WebSocket server
- **ENABLE_MQTT** - Enable MQTT integration

## Background Workers

### Data Collector
- Runs every 5 minutes (configurable)
- Collects energy readings from equipment
- Updates zone temperatures and humidity
- Emits real-time WebSocket updates

### Alert Monitor
- Runs every 1 minute (configurable)
- Monitors temperature thresholds
- Checks equipment status and load
- Creates and notifies alerts

### Optimizer
- Runs every 15 minutes (configurable)
- Optimizes zone setpoints based on occupancy
- Adjusts equipment load for efficiency
- Implements energy-saving strategies

## Database Seeding

The project includes seed data for testing:

```bash
# Run seeds to create sample data
npm run seed
```

This creates:
- 2 users (admin and manager)
- 1 building (Main Office Building)
- 3 zones (Floors 1-3)
- 3 equipment items (HVAC, AHU, Chiller)
- 3 sensors (Temperature and power sensors)

**Default Credentials:**
- Admin: admin@smartbuilding.com / Admin123!
- Manager: manager@smartbuilding.com / Manager123!

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm run test:watch
```

## Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - Bcrypt for password security
- **Rate Limiting** - Prevents brute force attacks
- **Input Validation** - Joi schema validation
- **SQL Injection Prevention** - Sequelize ORM parameterized queries
- **XSS Protection** - Helmet.js security headers
- **CORS** - Configurable CORS policy

## Logging

Logs are stored in the `./logs` directory:
- `error-YYYY-MM-DD.log` - Error logs
- `combined-YYYY-MM-DD.log` - All logs
- `app-YYYY-MM-DD.log` - Application logs

Logs rotate daily and are kept for 14 days.

## Health Check

Access the health check endpoint:

```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0"
}
```

## Docker Compose Services

- **api** - Main API service (port 8000)
- **timescaledb** - PostgreSQL + TimescaleDB (port 5432)
- **redis** - Redis cache (port 6379)
- **mosquitto** - MQTT broker (ports 1883, 9001)
- **pgadmin** - Database admin tool (port 5050) - optional
- **redis-commander** - Redis admin tool (port 8081) - optional

To start optional services:
```bash
docker-compose --profile tools up -d
```

## Production Deployment

1. Set NODE_ENV=production
2. Configure production database credentials
3. Set strong JWT_SECRET
4. Enable HTTPS
5. Configure proper CORS origins
6. Set up log aggregation
7. Configure monitoring and alerting
8. Set up database backups
9. Use environment-specific .env files
10. Enable SSL for database connections

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps timescaledb

# View database logs
docker-compose logs timescaledb

# Restart database
docker-compose restart timescaledb
```

### Redis Connection Issues
```bash
# Check Redis status
docker-compose ps redis

# Test Redis connection
redis-cli ping
```

### MQTT Connection Issues
```bash
# Check MQTT broker
docker-compose ps mosquitto

# Subscribe to test topic
mosquitto_sub -h localhost -t "test/#"
```

## Performance Optimization

- Redis caching for frequently accessed data
- Database indexing on common queries
- Connection pooling for database
- Rate limiting to prevent abuse
- Compression middleware for responses
- TimescaleDB hypertables for time-series data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [project-issues]
- Email: support@smartbuilding.com
- Documentation: /docs

## Version

Current Version: 1.0.0

## Author

Smart Building Team

---

**Last Updated**: January 2024
