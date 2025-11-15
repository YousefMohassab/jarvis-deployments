# SMT Process Dashboard

A real-time monitoring dashboard for Surface Mount Technology (SMT) processes in PCB assembly lines. Track key performance indicators (KPIs), identify quality issues, and optimize production efficiency.

## Features

- **Real-time KPI Monitoring**: Track First Pass Yield, OEE, DPMO, Cycle Time, Throughput, and Machine Uptime
- **Interactive Charts**: Visualize trends and historical data with customizable time periods
- **Alert System**: Automatic notifications for threshold violations
- **Defect Analysis**: Track and analyze defect distribution by type
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Configurable Thresholds**: Customize KPI targets and warning levels
- **Data Persistence**: Configuration saved locally in browser

## Quick Start

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Python 3 (for local development server) or any HTTP server

### Installation

1. Clone or download the repository:
```bash
cd /home/yousef/workspace/storage/UZ2CcrTd13NrEAm81F1qLWHyAiD2/projects/smt-dashboard
```

2. Start the development server:
```bash
# Using Python 3
python3 -m http.server 8080

# Or using npm (if package.json scripts are configured)
npm run dev
```

3. Open your browser and navigate to:
```
http://localhost:8080
```

The dashboard will automatically start monitoring and displaying simulated SMT process data.

## Usage

### Dashboard Overview

The dashboard is organized into several sections:

1. **Primary KPIs**: Six main performance indicators displayed as cards
2. **Trend Charts**: Historical data visualization for FPY and OEE components
3. **Secondary Metrics**: Additional process metrics
4. **Defect Distribution**: Bar chart showing defect types

### Keyboard Shortcuts

- `Ctrl/Cmd + R`: Refresh dashboard data
- `Escape`: Close modal windows

### Configuration

Click the **Settings** button to customize:

- KPI target values
- Warning and critical thresholds
- Data refresh interval (1-60 seconds)

Configuration is automatically saved to your browser's local storage.

### Chart Controls

Use the time period buttons (1H, 8H, 24H) to view different historical ranges.

## KPI Definitions

### First Pass Yield (FPY)
Percentage of products that pass quality inspection without rework on the first attempt.
- **Target**: 98%
- **Formula**: (Passed Units / Total Units) × 100

### Overall Equipment Effectiveness (OEE)
Comprehensive metric combining availability, performance, and quality.
- **Target**: 85%
- **Formula**: Availability × Performance × Quality

### Defects Per Million Opportunities (DPMO)
Number of defects per million opportunities for defects.
- **Target**: < 500
- **Formula**: (Total Defects / Total Opportunities) × 1,000,000

### Cycle Time
Average time to complete one board through the SMT process.
- **Target**: < 45 seconds

### Throughput
Number of boards processed per hour.
- **Target**: 80 boards/hour

### Machine Uptime
Percentage of time machines are operational.
- **Target**: 95%

## Architecture

### Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: CSS3 with custom properties
- **Charts**: HTML5 Canvas
- **Data Storage**: LocalStorage API

### Module Structure

```
src/
├── js/
│   ├── utils/
│   │   └── helpers.js          # Utility functions
│   ├── modules/
│   │   ├── config.js           # Configuration management
│   │   ├── dataSimulator.js    # Data simulation engine
│   │   ├── kpiCalculator.js    # KPI calculations
│   │   ├── chartManager.js     # Chart rendering
│   │   ├── alertManager.js     # Alert notifications
│   │   └── dashboardController.js  # Main controller
│   └── app.js                  # Application entry point
└── css/
    ├── main.css                # Base styles
    ├── layouts/
    │   └── dashboard.css       # Dashboard layout
    └── components/
        ├── kpi-card.css        # KPI card styles
        ├── chart.css           # Chart styles
        └── alert.css           # Alert styles
```

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Testing

### Run All Tests

```bash
node tests/run-tests.js
```

### Run Unit Tests Only

```bash
node tests/unit/kpi-calculator.test.js
```

### Run Integration Tests Only

```bash
node tests/integration/dashboard.test.js
```

## Debug Console

The dashboard exposes a debug API in the browser console:

```javascript
// Refresh dashboard
SMTDashboard.refresh()

// Export current data
SMTDashboard.exportData()

// Trigger quality event
SMTDashboard.triggerEvent('improvement')  // or 'degradation', 'machine_issue'

// Get configuration
SMTDashboard.getConfig()

// Show custom alert
SMTDashboard.showAlert('info', 'Title', 'Message')

// Display help
SMTDashboard.help()
```

## Customization

### Adding New KPIs

1. Add KPI configuration in `src/js/modules/config.js`
2. Update data simulator in `src/js/modules/dataSimulator.js`
3. Add HTML card in `index.html`
4. Update KPI calculator in `src/js/modules/kpiCalculator.js`

### Styling

Customize colors and fonts in `src/css/main.css`:

```css
:root {
    --primary-blue: #2563eb;
    --success: #10b981;
    --warning: #f59e0b;
    --error: #ef4444;
    /* ... more variables */
}
```

## Performance

The dashboard is optimized for performance:

- Lightweight (no external dependencies)
- Efficient canvas rendering
- Throttled updates
- Minimal DOM manipulation
- LocalStorage for configuration

## Security

- No external API calls (standalone application)
- No data transmission to servers
- XSS protection on user inputs
- CSP-compatible code

## Troubleshooting

### Dashboard Not Loading

1. Check browser console for errors
2. Ensure JavaScript is enabled
3. Try clearing browser cache
4. Verify HTTP server is running

### Data Not Updating

1. Check refresh interval in settings
2. Look for errors in browser console
3. Verify browser is not in power-saving mode

### Configuration Not Saving

1. Check if LocalStorage is enabled
2. Ensure not in private/incognito mode
3. Check browser storage quota

## Production Deployment

### Static Hosting

The dashboard can be deployed to any static hosting service:

- GitHub Pages
- Netlify
- Vercel
- AWS S3 + CloudFront
- Azure Static Web Apps

### Build for Production

No build step required - the application runs directly in the browser.

Simply copy all files to your web server:

```bash
cp -r /home/yousef/workspace/storage/UZ2CcrTd13NrEAm81F1qLWHyAiD2/projects/smt-dashboard/* /var/www/html/
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation in `/docs`
- Review troubleshooting section above

## Version History

### v1.0.0 (Current)
- Initial release
- Real-time KPI monitoring
- Interactive charts
- Alert system
- Responsive design
- Configuration management

## Acknowledgments

- Designed for PCB assembly manufacturing environments
- Built with modern web standards
- Inspired by lean manufacturing principles

---

**Note**: This dashboard uses simulated data for demonstration purposes. For production use with real equipment, integrate with your manufacturing execution system (MES) or data acquisition system.
