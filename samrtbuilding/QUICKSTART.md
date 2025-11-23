# Quick Start Guide
## Smart Building Energy Management System

Get up and running in 5 minutes!

---

## 🚀 Fastest Way (Docker Compose)

```bash
# Navigate to project
cd /home/facilis/workspace/storage/UZ2CcrTd13NrEAm81F1qLWHyAiD2/projects/smart-building-energy-mgmt

# Start backend services (API + Database + Redis + MQTT)
cd backend
docker-compose up -d

# Wait 30 seconds for services to start
sleep 30

# In a new terminal, start frontend
cd ../frontend
npm install
npm run dev
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Health: http://localhost:8000/health

**Default credentials:**
- Email: `admin@example.com`
- Password: `any password` (mock auth enabled)

---

## 📱 What You'll See

### Dashboard (Default Landing Page)
- **6 Metric Cards:**
  - Current Power (kW)
  - Daily Consumption (kWh)
  - Daily Cost ($)
  - Daily Savings ($)
  - Carbon Offset (lbs CO₂)
  - System Efficiency (%)

- **Real-Time Graph:**
  - 24-hour energy consumption
  - Power usage trends
  - Updates every 30 seconds

### Navigation (Left Sidebar)
- 🏠 Dashboard - Main metrics and graphs
- 📍 Zones - Temperature control (4 zones)
- 🔧 Equipment - HVAC management (6 units)
- 📊 Analytics - Historical trends
- 📄 Reports - Energy savings & ROI
- ⚙️ Settings - System configuration

### Top Bar
- 🌙 Theme toggle (light/dark mode)
- 🔔 Notifications (4 mock alerts)
- 👤 User profile (admin)
- 🚪 Logout

---

## 🎯 Try These Features

### 1. View Real-Time Metrics
The dashboard updates automatically with:
- Live power consumption
- Current costs
- Energy savings percentage
- System efficiency

### 2. Toggle Dark Mode
Click the moon icon in the top right to switch between light and dark themes.

### 3. Check Alerts
Click the bell icon to see:
- High temperature warning
- Maintenance due notification
- Peak demand alert
- Equipment fault

### 4. Explore Zones
Click "Zones" in the sidebar to see:
- 4 building zones (North, South, East, West)
- Current temperature vs. setpoint
- Occupancy status
- Equipment assignments

### 5. View Equipment
Click "Equipment" to see:
- 6 HVAC units with status
- Runtime hours
- Efficiency ratings
- Maintenance schedules

---

## 📡 Backend API Testing

### Health Check
```bash
curl http://localhost:8000/health
```

### Login (Get JWT Token)
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### Get Current Energy Metrics
```bash
curl http://localhost:8000/api/energy/current \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get All Zones
```bash
curl http://localhost:8000/api/zones \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Equipment List
```bash
curl http://localhost:8000/api/equipment \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔧 Configuration

### Frontend Environment
Edit `frontend/.env`:
```bash
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000
VITE_ENABLE_MOCK_DATA=true
```

### Backend Environment
Edit `backend/.env`:
```bash
NODE_ENV=development
PORT=8000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_building
DB_USER=postgres
DB_PASSWORD=postgres

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-secret-key-change-in-production
ENABLE_MOCK_DEVICES=true
```

---

## 🐛 Troubleshooting

### Frontend won't start
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend won't start
```bash
cd backend
docker-compose down
docker-compose up -d
# Wait 30 seconds
docker-compose logs -f api
```

### Database connection errors
```bash
cd backend
docker-compose restart postgres
sleep 10
docker-compose restart api
```

### Port already in use
```bash
# Frontend (port 3000)
lsof -ti:3000 | xargs kill -9

# Backend (port 8000)
lsof -ti:8000 | xargs kill -9
```

---

## 📊 Mock Data Overview

The system comes with realistic mock data:

**Buildings:** 1 (Main Building)
**Zones:** 4 (North, South, East, West Wings)
**Equipment:** 6 (4 RTUs, 1 Chiller, 1 AHU)
**Sensors:** 12+ (Temperature, Humidity, Occupancy)
**Alerts:** 4 (Temperature, Maintenance, Energy, Equipment)
**Historical Data:** 24 hours of energy readings

---

## 🎓 Next Steps

1. **Explore the Dashboard**
   - Check metrics and graphs
   - Toggle dark mode
   - View alerts

2. **Test Zone Control**
   - Navigate to Zones page
   - Review temperature settings
   - Check occupancy status

3. **Review Equipment**
   - View HVAC unit statuses
   - Check maintenance schedules
   - Review efficiency ratings

4. **Check Analytics**
   - View historical consumption
   - Compare trends
   - Analyze peak demand

5. **Read Documentation**
   - Architecture: `ARCHITECTURE.md`
   - API Reference: `backend/API.md`
   - Deployment: `frontend/DEPLOYMENT_GUIDE.md`

---

## 🚀 Production Deployment

### Option 1: Coolify (Recommended)
1. Push to Git repository
2. Connect in Coolify
3. Deploy automatically

### Option 2: Docker
```bash
# Build frontend
cd frontend
docker build -t smart-building-frontend .
docker run -p 80:80 smart-building-frontend

# Backend already has docker-compose
cd backend
docker-compose -f docker-compose.yml up -d
```

### Option 3: Manual
See `frontend/DEPLOYMENT_GUIDE.md` for detailed instructions.

---

## 📞 Support

**Issues?**
- Check `/frontend/README.md` for frontend issues
- Check `/backend/README.md` for backend issues
- Review `PROJECT_COMPLETE.md` for full documentation

**Questions?**
- Architecture: Read `ARCHITECTURE.md`
- API Endpoints: Read `backend/API.md`
- System Flows: Read `SYSTEM_FLOWS.md`

---

## ✅ Verification Checklist

After starting the system, verify:

- [ ] Frontend loads at http://localhost:3000
- [ ] Backend health check returns 200: http://localhost:8000/health
- [ ] Can login with demo credentials
- [ ] Dashboard shows 6 metric cards
- [ ] Real-time graph displays data
- [ ] Can toggle dark mode
- [ ] Notification bell shows unread count
- [ ] Sidebar navigation works
- [ ] No console errors in browser
- [ ] API returns mock data

---

## 🎉 You're Ready!

The Smart Building Energy Management System is now running locally with:
- ✅ Complete frontend dashboard
- ✅ Fully functional backend API
- ✅ Mock IoT devices generating data
- ✅ Real-time updates via WebSocket
- ✅ 4 building zones
- ✅ 6 HVAC equipment units
- ✅ Energy analytics and forecasting
- ✅ Alert monitoring

**Enjoy exploring the system!**

For production deployment, refer to:
- `frontend/DEPLOYMENT_GUIDE.md`
- `backend/DEPLOYMENT_READY.md`
- `PROJECT_COMPLETE.md`
