# Smart Building Energy Management System - Architecture Documentation

## Overview

This repository contains comprehensive technical architecture and implementation documentation for a production-ready Smart Building Energy Management System (SBEMS). The system integrates with Trane HVAC equipment and Siemens thermostats to provide AI-powered predictive cooling optimization, real-time monitoring, and automated control.

## System Capabilities

- **Real-time Monitoring**: Live energy consumption, temperature, humidity, and occupancy tracking
- **HVAC Integration**: BACnet and Modbus protocol support for Trane equipment
- **Thermostat Control**: Direct integration with Siemens thermostats
- **AI Predictions**: Energy load forecasting and predictive optimization
- **Automated Scheduling**: Zone-based temperature control with occupancy detection
- **Anomaly Detection**: Equipment fault detection and performance monitoring
- **Energy Savings**: Automated calculation and reporting of energy savings
- **Mobile-Responsive**: Web interface optimized for desktop, tablet, and mobile

## Technology Stack

**Frontend:**
- React 18 + Vite (fast build system)
- TailwindCSS (responsive design)
- Recharts (energy visualization)
- Socket.IO client (real-time updates)

**Backend:**
- Node.js 18+ with Express
- WebSocket server (Socket.IO)
- PostgreSQL 15 + TimescaleDB (time-series optimization)
- Redis 7 (caching and sessions)
- MQTT broker (IoT communication)
- TensorFlow.js (ML predictions)

**Integration:**
- BACnet/IP protocol (Trane HVAC)
- Modbus TCP/RTU (various equipment)
- REST API (Siemens thermostats)

**Deployment:**
- Docker + Docker Compose
- Coolify-ready configuration
- Nginx reverse proxy
- Let's Encrypt SSL

## Documentation Structure

### 1. [ARCHITECTURE.md](./ARCHITECTURE.md) - System Architecture Document
**Comprehensive technical architecture covering:**
- System overview and component architecture
- C4 model diagrams (described in text)
- Data flow architecture
- Complete database schema with TimescaleDB optimization
- RESTful API design with all endpoints
- WebSocket API for real-time communication
- Integration architecture (BACnet, Modbus, MQTT)
- Security architecture (authentication, encryption, RBAC)
- Scalability strategy (horizontal scaling, caching, load balancing)
- Deployment architecture (Docker, Coolify)
- Architecture Decision Records (ADRs)

**Key Sections:**
- 10 major sections covering all architectural aspects
- Detailed technology choices with rationale
- Production-ready patterns and best practices
- Security implementation guidelines
- Performance optimization strategies

### 2. [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Implementation Guide
**Phase-by-phase implementation with code examples:**

**Phase 1: Infrastructure Setup (Week 1-2)**
- Development environment setup
- Docker configuration
- Database initialization

**Phase 2: Core Backend (Week 3-5)**
- Repository pattern implementation
- Service layer architecture
- API controllers with error handling
- Authentication and authorization

**Phase 3: Integration Layer (Week 6-8)**
- BACnet client implementation
- Modbus client implementation
- Siemens API integration
- MQTT message handling
- Data collection workers

**Phase 4: ML Prediction Engine (Week 9-10)**
- Energy load prediction models
- Optimization algorithms
- TensorFlow.js implementation
- Model training and inference

**Phase 5: Frontend Development (Week 11-13)**
- React component architecture
- Real-time dashboard
- Control interfaces
- Analytics visualizations

**Key Features:**
- Production-ready code examples
- Complete error handling
- Retry logic and resilience patterns
- WebSocket integration
- MQTT pub/sub implementation

### 3. [DATABASE_MIGRATIONS.sql](./DATABASE_MIGRATIONS.sql) - Database Schema
**Complete database setup with 12 migrations:**

**Core Tables:**
- Buildings, Zones, HVAC Units, Thermostats, Sensors
- Users and access control
- Schedules and alert rules

**Time-Series Tables (TimescaleDB Hypertables):**
- Energy readings with automatic partitioning
- Sensor readings with compression
- HVAC telemetry
- Continuous aggregates for hourly/daily data

**Advanced Features:**
- Row-level security policies
- Automatic data retention policies
- Compression policies (80-90% storage reduction)
- Helper functions for calculations
- Triggers for data integrity
- Materialized views for performance

**Optimization:**
- Strategic indexing (B-tree, BRIN)
- Query optimization patterns
- Partition by building ID and time
- Automated vacuum and analyze

### 4. [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API Reference
**Complete API documentation with examples:**

**Authentication:**
- JWT-based auth with refresh tokens
- Login, logout, register endpoints
- Token refresh mechanism

**Core Endpoints:**
- Buildings (CRUD + overview)
- Zones (CRUD + status)
- HVAC Units (control + telemetry)
- Thermostats (control + status)
- Sensors (readings + configuration)

**Analytics Endpoints:**
- Energy consumption with aggregation
- Temperature history
- Savings calculations
- Performance metrics
- Data export (CSV, Excel, JSON)

**Predictions:**
- Load forecasting (1-72 hours)
- Temperature predictions
- Optimization recommendations

**WebSocket API:**
- Real-time energy updates
- Temperature streaming
- Live alerts
- Status changes

**Features:**
- Request/response examples
- Query parameters documented
- Error codes and handling
- Rate limiting details
- Pagination support

### 5. [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Deployment Guide
**Production deployment checklist covering:**

**Pre-Deployment:**
- Infrastructure setup (Database, Redis, MQTT)
- Environment variable configuration
- Security hardening
- Docker optimization
- Coolify configuration
- Domain and SSL setup

**Deployment Steps:**
1. Pre-deployment verification
2. Database migration
3. Coolify deployment
4. Post-deployment verification
5. Integration testing
6. User acceptance testing
7. Performance monitoring

**Operations:**
- Backup and disaster recovery procedures
- Monitoring setup (Prometheus, Grafana)
- Logging configuration (structured JSON logs)
- Alert configuration
- Performance optimization
- Security testing

**Maintenance:**
- Daily, weekly, monthly, quarterly tasks
- Emergency procedures
- Rollback procedures
- Incident response
- Success metrics

## Quick Start

### 1. Review Architecture
```bash
# Read the architecture document first
cat ARCHITECTURE.md
```

### 2. Setup Development Environment
```bash
# Follow Phase 1 in the implementation guide
cat IMPLEMENTATION_GUIDE.md

# Create project structure
mkdir -p sbems/{backend,frontend,integration,deployment}

# Initialize backend
cd sbems/backend
npm init -y
npm install express pg redis socket.io mqtt jsonwebtoken
```

### 3. Initialize Database
```bash
# Run migrations
psql -U postgres -f DATABASE_MIGRATIONS.sql
```

### 4. Deploy with Coolify
```bash
# Follow deployment checklist
cat DEPLOYMENT_CHECKLIST.md

# Configure environment variables
cp .env.example .env
# Edit .env with your values

# Deploy via Coolify dashboard
# Or use docker-compose
docker-compose up -d
```

## Architecture Highlights

### Scalability
- **Horizontal scaling** at every layer
- **Stateless API servers** with load balancing
- **Read replicas** for database scaling
- **Redis pub/sub** for WebSocket scaling
- **MQTT clustering** for IoT device scaling
- **TimescaleDB partitioning** for time-series data

### Security
- **JWT authentication** with refresh tokens
- **Role-based access control** (RBAC)
- **Row-level security** in PostgreSQL
- **TLS/SSL encryption** everywhere
- **API rate limiting** (100 req/min/user)
- **Input validation** and sanitization
- **Audit logging** for compliance

### Reliability
- **Health checks** at every layer
- **Automatic retry logic** for integrations
- **Circuit breakers** for external services
- **Graceful degradation**
- **Database replication** (RPO: 15 min)
- **Daily backups** with off-site storage
- **Disaster recovery** plan (RTO: 1 hour)

### Performance
- **Multi-layer caching** (Browser, CDN, Redis, DB)
- **Database query optimization** (indexes, materialized views)
- **TimescaleDB compression** (80-90% reduction)
- **Connection pooling** (min 10, max 100)
- **WebSocket for real-time** (no polling)
- **MQTT QoS levels** for reliability

### Integration
- **BACnet/IP protocol** for Trane HVAC
- **Modbus TCP/RTU** for various equipment
- **REST API** for Siemens thermostats
- **MQTT broker** for IoT devices
- **Protocol adapters** with error handling
- **Automatic device discovery**

## Key Design Decisions

### Why TimescaleDB?
- Combines PostgreSQL reliability with time-series optimization
- Automatic partitioning by time
- Built-in compression (80-90% storage savings)
- Continuous aggregates for fast queries
- No separate database to manage

### Why MQTT?
- Lightweight protocol for IoT devices
- Publish-subscribe pattern for efficiency
- QoS levels for reliability guarantees
- Industry standard for building automation
- Scales to thousands of devices

### Why TensorFlow.js?
- Run ML models in Node.js (same runtime)
- No Python/Node.js bridge needed
- Can also run in browser
- Sufficient for regression and forecasting
- Simpler deployment

### Why Docker Compose?
- Simple deployment (vs Kubernetes complexity)
- Native Coolify support
- Good for single-server or small clusters
- Easy local development
- Can migrate to K8s later if needed

## System Requirements

### Minimum Server Specifications
**For single building (<50 zones):**
- CPU: 4 cores
- RAM: 8 GB
- Storage: 100 GB SSD
- Network: 100 Mbps

**For multiple buildings (50-200 zones):**
- CPU: 8 cores
- RAM: 16 GB
- Storage: 500 GB SSD
- Network: 1 Gbps

### Software Requirements
- Docker 24+
- Docker Compose 2.20+
- PostgreSQL 15+
- Redis 7+
- Node.js 18+ LTS
- MQTT broker (Mosquitto 2+ or EMQX 5+)

## Performance Benchmarks

### Expected Performance
- **API Response Time**: <200ms (p95)
- **Database Query Time**: <100ms (p95)
- **WebSocket Latency**: <50ms
- **MQTT Message Delivery**: >99.9%
- **System Uptime**: >99.9%
- **Concurrent Users**: 500+
- **Devices Supported**: 1000+ per instance

### Data Throughput
- **Sensor Readings**: 10,000+ readings/minute
- **Energy Data Points**: 1,000+ points/minute
- **Control Commands**: 100+ commands/minute
- **WebSocket Messages**: 10,000+ messages/minute

## Cost Estimates

### Infrastructure Costs (Monthly)
- **Server (8 core, 16GB)**: $80-120
- **Database backup (500GB)**: $20-30
- **SSL certificates**: Free (Let's Encrypt)
- **Domain name**: $12/year
- **Monitoring (optional)**: $0-50

**Total**: ~$100-150/month for single building

### Scaling Costs
- Additional buildings: +$20-30/month per building
- High availability setup: 2-3x infrastructure cost
- Premium monitoring: +$50-200/month

## Energy Savings Potential

### Expected Results
- **5-15% energy reduction** through optimization
- **10-20% peak demand reduction** through pre-cooling
- **ROI period**: 6-18 months (depending on building size)
- **Payback**: $0.10-0.30 per square foot per year

### Optimization Strategies
1. **Pre-cooling**: Cool during off-peak rates
2. **Occupancy-based**: Adjust based on occupancy
3. **Weather prediction**: Pre-adjust for weather changes
4. **Load shifting**: Move consumption to off-peak hours
5. **Equipment optimization**: Run equipment at optimal efficiency

## Support and Resources

### Documentation
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Implementation**: [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
- **Database**: [DATABASE_MIGRATIONS.sql](./DATABASE_MIGRATIONS.sql)
- **API**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Deployment**: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

### External Resources
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **TimescaleDB Docs**: https://docs.timescale.com/
- **BACnet Protocol**: https://bacnet.org/
- **Modbus Protocol**: https://modbus.org/
- **MQTT Protocol**: https://mqtt.org/
- **TensorFlow.js**: https://www.tensorflow.org/js

### Community
- **Issue Tracking**: GitHub Issues
- **Feature Requests**: Product Board
- **Security Issues**: security@sbems.com
- **General Support**: support@sbems.com

## License

This architecture documentation is provided as-is for implementation reference.

## Contributing

For questions or suggestions about the architecture:
1. Review existing documentation
2. Check Architecture Decision Records (ADRs)
3. Open an issue for discussion
4. Propose changes with rationale

## Authors

Architecture designed by: Claude (Anthropic)
Date: November 22, 2025
Version: 1.0.0

---

## Next Steps

1. **Review Architecture** - Read ARCHITECTURE.md thoroughly
2. **Plan Implementation** - Follow phases in IMPLEMENTATION_GUIDE.md
3. **Setup Database** - Run DATABASE_MIGRATIONS.sql
4. **Configure Integration** - Setup BACnet/Modbus gateways
5. **Deploy System** - Follow DEPLOYMENT_CHECKLIST.md
6. **Monitor & Optimize** - Setup monitoring and begin optimization

**Estimated Timeline**: 13-16 weeks for full implementation

**Team Size**: 3-5 engineers (1 backend, 1 frontend, 1 integration specialist, 1 DevOps/QA)

---

**Note**: This is a comprehensive architecture designed for production use. Implement incrementally, test thoroughly, and adapt to your specific requirements.
