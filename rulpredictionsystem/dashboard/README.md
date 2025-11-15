# RUL Prediction System - Dashboard

A professional, real-time React dashboard for monitoring bearing health and Remaining Useful Life (RUL) predictions.

## Features

- **Real-time Monitoring**: WebSocket integration for live updates
- **Interactive Charts**: RUL predictions and trends visualization using Recharts
- **Feature Importance**: Visual analysis of model features
- **Alert System**: Real-time alerts for critical bearing conditions
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark Theme**: Professional dark theme optimized for monitoring environments
- **Health Indicators**: Visual status badges and health bars for quick assessment

## Technology Stack

- **React 18**: Modern React with hooks
- **React Router**: Client-side routing
- **Recharts**: Beautiful, composable charts
- **WebSocket**: Real-time data streaming
- **CSS3**: Custom styling with dark theme
- **Fetch API**: REST API communication

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- RUL Prediction System backend running on `http://localhost:8000`

## Installation

1. **Navigate to the dashboard directory**:
   ```bash
   cd /home/yousef/workspace/storage/UZ2CcrTd13NrEAm81F1qLWHyAiD2/projects/rul-prediction-system/dashboard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

   Or with yarn:
   ```bash
   yarn install
   ```

## Configuration

The dashboard can be configured using environment variables. Create a `.env` file in the dashboard directory:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:8000

# WebSocket Configuration
REACT_APP_WS_URL=ws://localhost:8000/ws

# Optional: Development settings
REACT_APP_DEBUG=false
```

## Running the Dashboard

### Development Mode

Start the development server with hot reloading:

```bash
npm start
```

The dashboard will open automatically at `http://localhost:3000`.

### Production Build

Create an optimized production build:

```bash
npm run build
```

The build artifacts will be stored in the `build/` directory.

### Serve Production Build

To serve the production build locally:

```bash
npm install -g serve
serve -s build -p 3000
```

## Project Structure

```
dashboard/
├── public/
│   └── index.html              # HTML entry point
├── src/
│   ├── components/
│   │   ├── Dashboard.js        # Main dashboard component
│   │   ├── Dashboard.css       # Dashboard styles
│   │   ├── BearingList.js      # Bearing list component
│   │   ├── BearingList.css     # Bearing list styles
│   │   ├── PredictionChart.js  # RUL chart component
│   │   ├── PredictionChart.css # Chart styles
│   │   ├── AlertPanel.js       # Alerts component
│   │   ├── AlertPanel.css      # Alert styles
│   │   ├── FeatureImportance.js # Feature importance chart
│   │   └── FeatureImportance.css # Feature chart styles
│   ├── services/
│   │   ├── api.js              # REST API client
│   │   └── websocket.js        # WebSocket client
│   ├── App.js                  # Main app component
│   ├── App.css                 # Global styles
│   └── index.js                # React entry point
├── package.json                # Dependencies and scripts
└── README.md                   # This file
```

## Components Overview

### Dashboard
Main container component that orchestrates all other components and manages state.

**Features**:
- Fetches initial data from API
- Manages WebSocket connection
- Handles real-time updates
- Coordinates component communication

### BearingList
Displays all monitored bearings with their current status.

**Features**:
- Status badges (Healthy, Warning, Critical)
- RUL display
- Confidence metrics
- Health bar visualization
- Selection for detailed view

### PredictionChart
Interactive line chart showing RUL predictions over time.

**Features**:
- Dual Y-axis (RUL and Confidence)
- Reference line for critical threshold
- Statistics (current, average, min, max, trend)
- Custom tooltips
- Responsive design

### AlertPanel
Real-time alert display with severity indicators.

**Features**:
- Severity-based sorting
- Color-coded alerts (Critical, Warning, Info)
- Relative timestamps
- Alert count summary
- Scrollable list

### FeatureImportance
Horizontal bar chart showing feature importance scores.

**Features**:
- Top 10 features
- Color-coded by importance level
- Custom tooltips
- Model information display

## API Integration

The dashboard communicates with the FastAPI backend through:

### REST API Endpoints

- `GET /bearings` - Get all bearings
- `GET /bearings/{id}` - Get specific bearing
- `GET /bearings/{id}/predictions` - Get predictions history
- `GET /bearings/{id}/feature-importance` - Get feature importance
- `GET /alerts` - Get all alerts
- `POST /bearings/{id}/predict` - Create new prediction
- `GET /health` - Health check

### WebSocket Connection

- `ws://localhost:8000/ws` - Real-time updates
- Receives prediction updates
- Receives alert notifications
- Automatic reconnection with exponential backoff

## Development

### Code Style

The project uses ESLint and Prettier for code quality:

```bash
# Run linter
npm run lint

# Format code
npm run format
```

### Testing

Run the test suite:

```bash
npm test
```

### Adding New Features

1. **New Component**: Create component file in `src/components/`
2. **New Service**: Create service file in `src/services/`
3. **New Route**: Add route in `src/App.js`
4. **Update State**: Modify `Dashboard.js` state management

## Customization

### Theme Colors

Edit color variables in `src/App.css`:

```css
/* Primary colors */
--primary-color: #4fc3f7;
--secondary-color: #66bb6a;
--danger-color: #f44336;
--warning-color: #ff9800;

/* Background colors */
--bg-primary: #0a0e27;
--bg-secondary: #151932;
--bg-card: #1a1f3a;
```

### Chart Configuration

Modify chart settings in respective component files:
- `PredictionChart.js` - RUL chart settings
- `FeatureImportance.js` - Bar chart settings

### API URL

Change the API URL in `.env` or directly in `src/services/api.js`.

## Troubleshooting

### Cannot connect to backend

**Problem**: Dashboard shows "Unable to connect to server"

**Solutions**:
1. Ensure backend is running on `http://localhost:8000`
2. Check CORS settings in backend
3. Verify `REACT_APP_API_URL` in `.env`

### WebSocket connection fails

**Problem**: Real-time updates not working

**Solutions**:
1. Check WebSocket endpoint is accessible
2. Verify firewall settings
3. Check browser console for errors
4. Ensure backend WebSocket endpoint is running

### Charts not rendering

**Problem**: Charts appear blank or broken

**Solutions**:
1. Check browser console for errors
2. Verify data format from API
3. Ensure Recharts is installed: `npm install recharts`
4. Check component props are correctly passed

### Build fails

**Problem**: `npm run build` fails

**Solutions**:
1. Clear cache: `rm -rf node_modules package-lock.json && npm install`
2. Check Node.js version: `node --version` (should be v16+)
3. Update dependencies: `npm update`

## Performance Optimization

### Production Optimizations

The production build automatically includes:
- Minification of JavaScript and CSS
- Tree shaking to remove unused code
- Code splitting for faster initial load
- Asset optimization and compression

### Best Practices

1. **Lazy Loading**: Use React.lazy() for route-based code splitting
2. **Memoization**: Use useMemo and useCallback for expensive computations
3. **Virtualization**: For large lists, consider react-window
4. **Image Optimization**: Use WebP format and lazy loading
5. **Bundle Analysis**: Use webpack-bundle-analyzer

## Deployment

### Static Hosting

Deploy to services like:
- **Netlify**: `netlify deploy --prod`
- **Vercel**: `vercel --prod`
- **GitHub Pages**: Configure in `package.json`
- **AWS S3**: Upload build folder to S3 bucket

### Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:16-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:

```bash
docker build -t rul-dashboard .
docker run -p 80:80 rul-dashboard
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` to version control
2. **API Keys**: Store sensitive data in environment variables
3. **HTTPS**: Use HTTPS in production
4. **CSP Headers**: Configure Content Security Policy
5. **Dependencies**: Regularly update dependencies for security patches

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is part of the RUL Prediction System. See the main project repository for license information.

## Support

For issues and questions:
- Check the troubleshooting section
- Review the API documentation
- Check browser console for errors
- Contact the development team

## Changelog

### Version 1.0.0 (2024)
- Initial release
- Real-time monitoring dashboard
- WebSocket integration
- Interactive charts with Recharts
- Alert system
- Feature importance visualization
- Responsive design
- Dark theme

## Acknowledgments

- Built with React and Recharts
- Icons from Unicode emoji
- Inspired by modern monitoring dashboards
