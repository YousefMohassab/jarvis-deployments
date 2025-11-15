# Dashboard Features Overview

## Core Features

### 1. Real-Time Monitoring
- **WebSocket Integration**: Live updates from backend without page refresh
- **Automatic Reconnection**: Intelligent reconnection with exponential backoff
- **Connection Status Indicator**: Visual indicator showing connection state
- **Live Data Streaming**: Real-time RUL predictions and alerts

### 2. Bearing Health Monitoring

#### Bearing List Component
- **Multi-Bearing Display**: Monitor multiple bearings simultaneously
- **Status Badges**: Color-coded status indicators (Healthy, Warning, Critical)
- **Health Bars**: Visual representation of remaining useful life
- **Key Metrics Display**:
  - Predicted RUL (Remaining Useful Life)
  - Confidence score
  - Last update timestamp
- **Interactive Selection**: Click to view detailed predictions
- **Responsive Grid Layout**: Adapts to screen size

### 3. RUL Prediction Visualization

#### Prediction Chart Component
- **Interactive Line Charts**: Powered by Recharts library
- **Dual Y-Axis**:
  - Primary: RUL in hours
  - Secondary: Confidence percentage
- **Critical Threshold Line**: Visual indicator at 100 hours
- **Real-time Statistics**:
  - Current RUL
  - Average RUL
  - Trend direction (increasing/decreasing)
  - Min/Max values
  - Average confidence
- **Custom Tooltips**: Detailed information on hover
- **Time-based X-Axis**: Shows prediction timestamps
- **Historical Data**: Display up to 50 recent predictions

### 4. Alert System

#### Alert Panel Component
- **Severity-Based Sorting**: Critical alerts appear first
- **Color-Coded Alerts**:
  - Red: Critical alerts
  - Orange: Warning alerts
  - Blue: Informational alerts
- **Alert Details**:
  - Bearing ID
  - Severity level
  - Message and details
  - Associated RUL value
  - Relative timestamp (e.g., "5m ago")
- **Alert Summary**: Count of alerts by severity
- **Real-time Updates**: New alerts appear instantly via WebSocket
- **Scrollable List**: View up to 20 recent alerts

### 5. Feature Importance Analysis

#### Feature Importance Component
- **Horizontal Bar Chart**: Easy-to-read importance visualization
- **Top 10 Features**: Most influential features for predictions
- **Color-Coded Bars**:
  - Red: High impact (>15%)
  - Orange: Medium impact (10-15%)
  - Blue: Low-medium impact (5-10%)
  - Green: Low impact (<5%)
- **Feature Name Formatting**: Readable feature names
- **Model Information**: Display model type and accuracy
- **Interactive Tooltips**: Detailed importance percentages

### 6. User Interface

#### Design System
- **Dark Theme**: Professional dark theme optimized for monitoring
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Card-Based Layout**: Modular, organized information display
- **Smooth Animations**: Polished transitions and hover effects
- **Custom Scrollbars**: Styled scrollbars matching theme

#### Color Palette
- **Primary**: #4fc3f7 (Cyan blue - for highlights and key info)
- **Success**: #4caf50 (Green - for healthy status)
- **Warning**: #ff9800 (Orange - for warnings)
- **Critical**: #f44336 (Red - for critical alerts)
- **Background**: #0a0e27 (Dark blue - main background)
- **Cards**: #151932 (Slightly lighter blue - card background)
- **Borders**: #2a2f4a (Subtle borders)
- **Text**: #e0e0e0 (Light gray - primary text)
- **Secondary Text**: #b0bec5 (Muted gray - labels and metadata)

### 7. State Management

#### Dashboard State
- **Centralized State**: Single source of truth in Dashboard component
- **Efficient Updates**: Optimized re-renders with React hooks
- **Data Caching**: Minimize unnecessary API calls
- **Error Handling**: Graceful error states with retry options
- **Loading States**: Loading indicators during data fetches

### 8. API Integration

#### REST API Client
- **Comprehensive Coverage**: All backend endpoints supported
- **Error Handling**: User-friendly error messages
- **Request/Response Logging**: Debug information in console
- **Configurable Base URL**: Easy backend URL configuration
- **Type Safety**: Consistent data structures

#### Supported Endpoints
- Bearings: List, get details, predictions
- Alerts: List all, filter by bearing, acknowledgment
- Feature Importance: Get model feature importance
- Health Check: Backend status verification
- Statistics: System-wide statistics
- Data Upload: CSV/file upload support
- Model Training: Trigger training jobs
- Export: Data export in various formats

### 9. Real-Time Data Flow

#### WebSocket Features
- **Automatic Connection**: Connects on dashboard load
- **Reconnection Strategy**: Exponential backoff with max attempts
- **Message Types**:
  - `prediction`: New RUL predictions
  - `alert`: New alerts
  - `status`: Bearing status updates
- **Subscribe/Unsubscribe**: Filter updates by bearing
- **Connection Health**: Monitor connection status
- **Manual Reconnect**: Force reconnection option

### 10. Performance Optimizations

#### React Optimizations
- **useMemo**: Memoize expensive computations
- **useCallback**: Prevent unnecessary function recreations
- **Efficient Re-renders**: Only update components with changed data
- **Code Splitting**: Future-ready for lazy loading routes

#### Data Handling
- **Pagination**: Limit data fetched per request
- **Truncation**: Keep only recent predictions in memory
- **Efficient Updates**: Update only changed bearings
- **Debouncing**: Prevent excessive updates

## Technical Specifications

### Technology Stack
- **React**: v18.2.0 - Modern React with hooks
- **React Router**: v6.20.0 - Client-side routing
- **Recharts**: v2.10.3 - Composable charting library
- **WebSocket API**: Native browser WebSocket
- **Fetch API**: Modern HTTP client
- **CSS3**: Custom styling with advanced features

### Browser Support
- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari, Chrome Mobile

### Performance Targets
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Lighthouse Score**: > 90
- **Bundle Size**: < 500KB (gzipped)

## Accessibility Features

- **Semantic HTML**: Proper HTML5 elements
- **Color Contrast**: WCAG AA compliant
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: ARIA labels where needed
- **Focus Indicators**: Clear focus states

## Security Features

- **Environment Variables**: Sensitive data in .env
- **No Hardcoded Secrets**: All credentials configurable
- **CORS Handling**: Proper CORS configuration
- **Input Validation**: Sanitize user inputs
- **Error Messages**: No sensitive data in error messages

## Future Enhancements

### Planned Features
1. **User Authentication**: Login/logout functionality
2. **User Preferences**: Customizable dashboard layout
3. **Notification System**: Browser notifications for critical alerts
4. **Historical Trends**: Long-term trend analysis
5. **Maintenance Scheduling**: Plan maintenance based on RUL
6. **Export Functionality**: Export charts and reports
7. **Advanced Filtering**: Filter bearings by various criteria
8. **Comparative Analysis**: Compare multiple bearings
9. **Predictive Alerts**: Forecast future alerts
10. **Mobile App**: Native mobile application

### Technical Improvements
1. **TypeScript**: Add static typing
2. **Unit Tests**: Comprehensive test coverage
3. **E2E Tests**: End-to-end testing with Cypress
4. **PWA Support**: Progressive Web App features
5. **Offline Mode**: Work without internet connection
6. **Service Workers**: Background sync and caching
7. **GraphQL**: Alternative to REST API
8. **State Management**: Redux or Zustand for complex state
9. **Internationalization**: Multi-language support
10. **Dark/Light Theme Toggle**: User-selectable themes

## Usage Scenarios

### 1. Operations Manager
- **Goal**: Monitor overall fleet health
- **Usage**: Dashboard overview, alert panel
- **Benefit**: Quick identification of critical issues

### 2. Maintenance Engineer
- **Goal**: Plan maintenance activities
- **Usage**: Bearing details, RUL predictions
- **Benefit**: Optimize maintenance scheduling

### 3. Data Analyst
- **Goal**: Understand prediction factors
- **Usage**: Feature importance, historical trends
- **Benefit**: Insights into model behavior

### 4. System Administrator
- **Goal**: Ensure system health
- **Usage**: Connection status, error monitoring
- **Benefit**: Quick troubleshooting

## Integration Points

### Backend Requirements
- **REST API**: FastAPI backend on port 8000
- **WebSocket**: Real-time endpoint at /ws
- **CORS**: Allow origin http://localhost:3000
- **Data Format**: JSON responses
- **Error Format**: Consistent error structure

### Data Requirements
- **Bearing Data**: ID, status, RUL, confidence
- **Prediction Data**: Timestamp, RUL, confidence, bounds
- **Alert Data**: Severity, message, bearing ID, timestamp
- **Feature Data**: Feature names and importance scores

## Maintenance & Support

### Monitoring
- **Console Logs**: Debug information in browser console
- **Error Tracking**: Log errors for debugging
- **Performance Monitoring**: Track render times
- **Network Monitoring**: Track API response times

### Updates
- **Dependency Updates**: Regular security updates
- **Feature Updates**: New features based on feedback
- **Bug Fixes**: Quick response to issues
- **Documentation**: Keep docs up to date

### Support Channels
- **Documentation**: Comprehensive README and guides
- **Code Comments**: Inline documentation
- **Error Messages**: Helpful error messages
- **Troubleshooting**: Common issues and solutions
