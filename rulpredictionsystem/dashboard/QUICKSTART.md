# Quick Start Guide

Get your RUL Prediction Dashboard up and running in 5 minutes!

## Prerequisites Check

Before starting, ensure you have:

- [ ] Node.js v16 or higher installed
- [ ] npm or yarn package manager
- [ ] Backend API running at `http://localhost:8000`

Check your Node.js version:
```bash
node --version
# Should output v16.x.x or higher
```

## Installation Steps

### 1. Navigate to Dashboard Directory

```bash
cd /home/yousef/workspace/storage/UZ2CcrTd13NrEAm81F1qLWHyAiD2/projects/rul-prediction-system/dashboard
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- React 18.2.0
- React Router 6.20.0
- Recharts 2.10.3
- React Scripts 5.0.1
- And other required dependencies

Wait for installation to complete (may take 2-3 minutes).

### 3. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` if needed:
```env
REACT_APP_API_URL=http://localhost:8000
```

### 4. Start the Dashboard

**Option A: Using the start script**
```bash
./start.sh
```

**Option B: Using npm directly**
```bash
npm start
```

The dashboard will automatically open at `http://localhost:3000`

## Verification

### Check if Everything Works

1. **Dashboard Loads**: Browser opens to `http://localhost:3000`
2. **Connection Status**: Green indicator shows "Connected"
3. **Data Appears**: Bearings list shows available bearings
4. **Backend Connected**: No error messages about connection

### If You See Errors

#### "Unable to connect to server"
**Problem**: Backend is not running

**Solution**:
```bash
# In a new terminal, start the backend
cd ../backend
python -m uvicorn main:app --reload
```

#### "Module not found"
**Problem**: Dependencies not installed

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

#### Port 3000 already in use
**Problem**: Another app is using port 3000

**Solution**:
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm start
```

## Next Steps

### 1. Explore the Dashboard

- **Bearing List**: Click on different bearings to see their predictions
- **Charts**: View RUL predictions and trends
- **Alerts**: Check active alerts in the sidebar
- **Feature Importance**: See which features impact predictions

### 2. Test Real-time Updates

The dashboard automatically updates when:
- New predictions are generated
- Bearing status changes
- New alerts are created

### 3. Customize (Optional)

Edit configuration in `.env`:
```env
# Change API endpoint
REACT_APP_API_URL=http://your-backend-url:8000

# Enable debug mode
REACT_APP_DEBUG=true
```

## Common Tasks

### Stop the Dashboard
Press `Ctrl+C` in the terminal

### Restart the Dashboard
```bash
npm start
```

### Build for Production
```bash
npm run build
```

Output will be in `build/` directory

### Run Tests
```bash
npm test
```

### Update Dependencies
```bash
npm update
```

## File Structure Overview

```
dashboard/
├── public/
│   └── index.html          # HTML entry point
├── src/
│   ├── components/
│   │   ├── Dashboard.js    # Main dashboard
│   │   ├── BearingList.js  # Bearing list
│   │   ├── PredictionChart.js # RUL chart
│   │   ├── AlertPanel.js   # Alerts
│   │   └── FeatureImportance.js # Feature chart
│   ├── services/
│   │   ├── api.js          # REST API client
│   │   └── websocket.js    # WebSocket client
│   ├── App.js              # Main app component
│   ├── App.css             # Global styles
│   └── index.js            # React entry point
├── package.json            # Dependencies
├── README.md               # Full documentation
└── .env                    # Configuration
```

## Troubleshooting

### Dashboard is blank
1. Check browser console (F12) for errors
2. Verify backend is running: `curl http://localhost:8000/health`
3. Clear browser cache and reload

### WebSocket not connecting
1. Check backend supports WebSocket at `/ws`
2. Verify firewall allows WebSocket connections
3. Check browser console for WebSocket errors

### Charts not displaying
1. Verify data format matches expected structure
2. Check browser console for Recharts errors
3. Ensure predictions exist for selected bearing

### Slow performance
1. Clear browser cache
2. Check network tab for slow API calls
3. Reduce number of predictions fetched (default: 50)

## Getting Help

1. **Check Documentation**: See `README.md` for detailed info
2. **Check Features**: See `FEATURES.md` for feature details
3. **Check Console**: Browser console (F12) shows errors
4. **Check Network**: Network tab shows API requests

## Development Tips

### Enable React DevTools
Install React Developer Tools browser extension for debugging

### Watch for Changes
Dashboard auto-reloads when you edit files

### Debug WebSocket
Open browser console to see WebSocket messages

### API Calls
Check Network tab to see all API requests and responses

## Production Deployment

### Build Optimized Version
```bash
npm run build
```

### Serve with nginx
```bash
# Copy build files to nginx
sudo cp -r build/* /var/www/html/

# Configure nginx
sudo nano /etc/nginx/sites-available/default
```

### Deploy to Cloud
- **Netlify**: `netlify deploy --prod`
- **Vercel**: `vercel --prod`
- **AWS S3**: Upload `build/` to S3 bucket

## Next Features to Explore

1. **Real-time Monitoring**: Watch live updates as predictions come in
2. **Alert Management**: Monitor critical bearing conditions
3. **Feature Analysis**: Understand what drives predictions
4. **Historical Trends**: View bearing health over time
5. **Export Data**: Export charts and reports (coming soon)

## Success!

If you see the dashboard with bearings listed and charts displaying, you're all set!

The dashboard is now monitoring your bearing health in real-time.

For more information, see:
- `README.md` - Complete documentation
- `FEATURES.md` - Feature details
- Backend API docs - `http://localhost:8000/docs`
