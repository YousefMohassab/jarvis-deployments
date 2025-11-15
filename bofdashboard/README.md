# BOF KPI Dashboard

A production-ready, industrial-grade dashboard for Basic Oxygen Furnace (BOF) monitoring built with Next.js 14, TypeScript, and shadcn/ui components.

## Features

### Core Functionality
- **Real-time KPI Monitoring**: Track 3 critical metrics with live updates
  - Bath Temperature (1600-1700°C)
  - Lance Pressure (8.5-15.0 bar)
  - O₂ Flow Rate (600-1200 Nm³/h)

- **Visual Components**:
  - Custom Canvas-based Gauge Charts with multi-zone displays
  - Recharts-powered trend charts with historical data
  - KPI summary cards with status indicators
  - Real-time alert panel with acknowledgment system

- **Interactive Settings**:
  - Adjustable refresh intervals (1-10 seconds)
  - Customizable threshold configurations
  - Display toggle controls for components
  - Persistent settings management

### Technical Highlights
- **Next.js 14** with App Router architecture
- **TypeScript** with strict type checking
- **shadcn/ui** component library integration
- **Tailwind CSS** for responsive styling
- **Recharts** for data visualization
- **Real-time data simulation** with WebSocket-ready architecture

## Project Structure

```
bof-kpi-dashboard-shadcn/
├── app/
│   ├── layout.tsx           # Root layout with metadata
│   ├── page.tsx             # Main dashboard page
│   └── globals.css          # Global styles with shadcn theme
├── components/
│   ├── ui/                  # shadcn components
│   │   ├── alert.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── slider.tsx
│   │   ├── switch.tsx
│   │   └── tabs.tsx
│   ├── dashboard/
│   │   ├── GaugeChart.tsx   # Canvas-based gauge visualization
│   │   ├── TrendChart.tsx   # Historical trend line chart
│   │   ├── AlertPanel.tsx   # Real-time alert management
│   │   ├── KPICard.tsx      # Metric summary cards
│   │   └── SettingsDialog.tsx # Configuration interface
│   └── DashboardLayout.tsx  # Main layout orchestration
├── lib/
│   ├── utils.ts             # Utility functions
│   └── data-generator.ts    # Real-time data simulation
├── types/
│   └── index.ts             # TypeScript type definitions
├── hooks/
│   └── useKPIData.ts        # Custom hook for data management
└── Configuration Files
    ├── components.json      # shadcn configuration
    ├── tailwind.config.ts   # Tailwind setup
    ├── tsconfig.json        # TypeScript config
    ├── next.config.js       # Next.js config
    └── package.json         # Dependencies & scripts
```

## Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Install Dependencies
```bash
npm install
```

### Development Server
```bash
npm run dev
```
The dashboard will be available at `http://localhost:7801` (or the port specified by $PORT environment variable)

### Production Build
```bash
npm run build
npm start
```

### Custom Port
```bash
PORT=3000 npm run dev
```

## Usage Guide

### Dashboard Views

#### Overview Tab
- Displays all KPI cards with current values
- Shows gauge charts for visual monitoring
- Includes alert panel for system notifications
- Features trend charts for historical analysis

#### Gauges Tab
- Dedicated view for gauge visualizations
- Large format displays for control room use
- Real-time needle animations with smooth transitions

#### Trends Tab
- Focused historical data analysis
- Color-coded status indicators
- Threshold reference lines

### Alert System
- **Automatic Generation**: Alerts trigger when metrics exceed thresholds
- **Severity Levels**: Info, Warning, Critical
- **Acknowledgment**: Mark alerts as acknowledged without dismissing
- **Dismissal**: Remove alerts from the panel
- **History**: View acknowledged alerts separately

### Settings Configuration

#### Refresh Interval
- Adjust update frequency from 1-10 seconds
- Slider control with real-time preview

#### Display Options
- Toggle gauge chart visibility
- Toggle trend chart visibility
- Toggle alert panel visibility

#### Threshold Configuration
- Select KPI from dropdown
- Set warning threshold value
- Set critical threshold value
- Validation ensures proper range

## Component Documentation

### GaugeChart
Canvas-based semicircular gauge with:
- Multi-zone color coding (green/yellow/red)
- Animated needle with easing
- Threshold markers
- Scale indicators
- Status-based visual effects
- Center value display

### TrendChart
Recharts line chart featuring:
- 20-point rolling history
- Color-coded by status
- Reference lines for thresholds
- Custom tooltip with formatting
- Responsive design

### KPICard
Compact metric display with:
- Current value and unit
- Status badge
- Trend indicator
- Range percentage
- Min/max range display

### AlertPanel
Real-time notification system:
- Severity-based styling
- Icon indicators
- Timestamp display
- Acknowledge/dismiss actions
- Acknowledged alerts section

### SettingsDialog
Configuration interface with:
- Refresh interval slider
- Display toggle switches
- KPI selection dropdown
- Threshold input fields
- Save/cancel actions

## Data Management

### useKPIData Hook
Custom React hook providing:
- Metrics state management
- Alert state management
- Settings state management
- Real-time update orchestration
- Action handlers for user interactions

### Data Generator
Simulates industrial sensor data:
- Realistic value fluctuations
- Status determination logic
- Alert generation on threshold crossing
- Historical data maintenance

## Styling & Theming

### shadcn/ui Theme Variables
Configured via CSS custom properties in `globals.css`:
- Light and dark mode support
- Customizable color palette
- Consistent border radius
- Accessible color contrast

### Responsive Design
Mobile-first approach with breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1400px

## Performance Optimizations

- **React Memoization**: Prevents unnecessary re-renders
- **Canvas Rendering**: Efficient gauge chart drawing
- **Interval Management**: Proper cleanup of timers
- **Lazy Loading**: Components load on demand
- **Code Splitting**: Optimized bundle sizes

## Accessibility

- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader friendly alerts
- High contrast color schemes
- Focus indicators on controls

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

- WebSocket integration for real-time data
- Historical data export (CSV/Excel)
- Custom alert rules engine
- Multi-user authentication
- Role-based access control
- Advanced analytics and reporting
- Mobile app companion

## License

Proprietary - Industrial Monitoring System

## Support

For technical support or questions, please contact the development team.

---

**Built with Next.js 14, TypeScript, and shadcn/ui**
