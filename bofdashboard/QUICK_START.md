# Quick Start Guide - BOF KPI Dashboard

## Prerequisites
- Node.js 18 or higher
- npm or yarn package manager

## Installation

Navigate to the project directory:
```bash
cd /home/yousef/workspace/storage/UZ2CcrTd13NrEAm81F1qLWHyAiD2/projects/bof-kpi-dashboard-shadcn
```

Dependencies are already installed. If you need to reinstall:
```bash
npm install
```

## Running the Dashboard

### Development Mode (Recommended for Testing)
```bash
npm run dev
```

The dashboard will start at: **http://localhost:7801**

### Production Mode
```bash
npm run build
npm start
```

### Custom Port
```bash
PORT=3000 npm run dev
```

## What You'll See

### Main Dashboard (Overview Tab)
1. **Three KPI Cards** at the top showing current values:
   - Bath Temperature (1600-1700°C)
   - Lance Pressure (8.5-15.0 bar)
   - O₂ Flow Rate (600-1200 Nm³/h)

2. **Gauge Charts** displaying real-time values with:
   - Color-coded zones (green/yellow/red)
   - Animated needles
   - Status indicators

3. **Alert Panel** on the right showing:
   - Active system alerts
   - Acknowledged alerts
   - Severity badges

4. **Trend Charts** at the bottom showing:
   - 20-point historical data
   - Threshold reference lines
   - Time-based X-axis

### Navigation Tabs
- **Overview**: All components together
- **Gauges**: Full-screen gauge view
- **Trends**: Focused trend analysis

### Settings (Gear Icon)
Click the settings icon in the header to:
- Adjust refresh interval (1-10 seconds)
- Toggle component visibility
- Configure KPI thresholds

## Real-time Updates

The dashboard automatically updates every 2 seconds (configurable) with:
- New sensor readings
- Updated gauge positions
- Trend chart extensions
- Automatic alerts when thresholds are exceeded

## Key Features to Explore

### 1. Gauge Animation
Watch the needles smoothly animate as values change. Colors update based on status:
- Green: Normal operation
- Yellow: Warning level
- Red: Critical level

### 2. Alert System
When a KPI exceeds its threshold:
- An alert appears in the panel
- The gauge shows visual effects (glow/pulse)
- You can acknowledge or dismiss alerts

### 3. Trend Analysis
View historical data to:
- Identify patterns
- Spot anomalies
- Track status changes over time

### 4. Responsive Design
Try resizing your browser or viewing on mobile:
- Layout adapts automatically
- Touch-friendly controls
- Optimized for all screen sizes

## Troubleshooting

### Port Already in Use
If port 7801 is busy:
```bash
PORT=8080 npm run dev
```

### Build Errors
Clear cache and rebuild:
```bash
rm -rf .next
npm run build
```

### Module Not Found
Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Project Files

**Key Files**:
- `/app/page.tsx` - Main dashboard page
- `/components/DashboardLayout.tsx` - Layout orchestration
- `/components/dashboard/*` - Individual dashboard components
- `/hooks/useKPIData.ts` - Data management hook
- `/lib/data-generator.ts` - Real-time data simulation

**Configuration**:
- `/next.config.js` - Next.js settings
- `/tailwind.config.ts` - Tailwind CSS theme
- `/tsconfig.json` - TypeScript configuration

## Next Steps

1. **Explore the UI**: Navigate through all tabs and components
2. **Test Settings**: Adjust refresh rate and thresholds
3. **Monitor Alerts**: Watch how alerts are generated and managed
4. **Check Responsiveness**: Test on different screen sizes
5. **Review Code**: Examine component implementations

## Production Deployment

### Build for Production
```bash
npm run build
```

### Deploy Options
- **Vercel**: `vercel deploy`
- **Netlify**: Connect GitHub repo
- **Docker**: Create Dockerfile
- **Traditional**: Copy `.next` folder to server

## Support

For questions or issues:
- Check `/README.md` for detailed documentation
- Review `/PROJECT_SUMMARY.md` for technical details
- Examine component files for implementation specifics

## License

Proprietary - Industrial Monitoring System

---

**Enjoy monitoring your BOF operations!**
