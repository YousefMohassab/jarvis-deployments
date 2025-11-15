# SMT Dashboard Architecture

## Overview

The SMT Dashboard is a modular, client-side web application built with vanilla JavaScript. It follows the Module Pattern for encapsulation and uses a controller-based architecture for coordination.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface Layer                  │
│  (HTML5 + CSS3 + Responsive Design)                     │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│              Dashboard Controller                        │
│  - Coordinates all modules                              │
│  - Manages update cycle                                 │
│  - Handles user interactions                            │
└───┬───────┬───────┬────────┬──────────┬────────────────┘
    │       │       │        │          │
┌───▼───┐ ┌─▼────┐ ┌▼──────┐ ┌▼────────┐ ┌▼──────────┐
│Config │ │ Data  │ │  KPI  │ │ Chart   │ │  Alert    │
│Module │ │Simula-│ │Calcul-│ │ Manager │ │ Manager   │
│       │ │ tor   │ │ ator  │ │         │ │           │
└───┬───┘ └─┬────┘ └┬──────┘ └┬────────┘ └┬──────────┘
    │       │       │        │          │
┌───▼───────▼───────▼────────▼──────────▼────────────────┐
│              Data Storage Layer                          │
│  - LocalStorage (Configuration)                         │
│  - In-Memory (Real-time Data)                           │
└─────────────────────────────────────────────────────────┘
```

## Core Modules

### 1. Configuration Module (`config.js`)

**Purpose**: Manages application configuration and KPI thresholds

**Responsibilities**:
- Load/save configuration from LocalStorage
- Manage KPI thresholds
- Validate configuration values
- Provide configuration access to other modules

**Key Functions**:
```javascript
Config.init()                           // Initialize configuration
Config.get(key)                        // Get configuration value
Config.set(key, value)                 // Set configuration value
Config.checkThreshold(kpiName, value)  // Check if value meets threshold
```

**Data Structure**:
```javascript
{
  kpiThresholds: {
    fpy: { target: 98, warning: 95, critical: 90 },
    oee: { target: 85, warning: 80, critical: 75 },
    // ... more KPIs
  },
  refreshInterval: 5000,
  enableAlerts: true
}
```

### 2. Data Simulator (`dataSimulator.js`)

**Purpose**: Generates realistic SMT process data for demonstration

**Responsibilities**:
- Simulate production line behavior
- Generate realistic variations in KPI values
- Maintain historical data
- Model shift patterns and quality trends

**Key Functions**:
```javascript
DataSimulator.init()                      // Initialize simulator
DataSimulator.getCurrentData()            // Get current KPI values
DataSimulator.getHistoricalData(metric)   // Get historical data
DataSimulator.triggerEvent(type)          // Trigger quality event
```

**Simulation Features**:
- Shift-based variations (day/evening/night)
- Random quality events
- Machine health degradation/recovery
- Realistic noise and trends

### 3. KPI Calculator (`kpiCalculator.js`)

**Purpose**: Calculate KPI values and trends

**Responsibilities**:
- Update KPI display values
- Calculate trend indicators
- Compute OEE components
- Generate statistics

**Key Functions**:
```javascript
KPICalculator.updateKPI(name, value)     // Update single KPI
KPICalculator.updateAllKPIs(data)        // Update all KPIs
KPICalculator.calculateOEEComponents()   // Calculate OEE breakdown
```

**Trend Calculation**:
- Compare current vs. previous value
- Determine direction (up/down/neutral)
- Apply inverse logic for "lower is better" metrics

### 4. Chart Manager (`chartManager.js`)

**Purpose**: Render and update charts using HTML5 Canvas

**Responsibilities**:
- Create chart instances
- Render line, bar, and horizontal bar charts
- Update charts with new data
- Handle responsive sizing

**Key Functions**:
```javascript
ChartManager.init()                      // Initialize all charts
ChartManager.updateFPYChart(data)        // Update FPY trend chart
ChartManager.updateOEEChart(data)        // Update OEE components
ChartManager.updateDefectChart(data)     // Update defect distribution
```

**Chart Types**:
1. **Line Chart**: FPY trend over time
2. **Bar Chart**: OEE components (Availability, Performance, Quality)
3. **Horizontal Bar Chart**: Defect type distribution

### 5. Alert Manager (`alertManager.js`)

**Purpose**: Display notifications and manage alerts

**Responsibilities**:
- Show alert notifications
- Monitor threshold violations
- Auto-dismiss alerts
- Manage alert queue

**Key Functions**:
```javascript
AlertManager.showAlert(type, title, msg)  // Display alert
AlertManager.checkThresholds(data)        // Check for violations
AlertManager.dismissAlert(id)             // Dismiss specific alert
```

**Alert Types**:
- **Success**: Green, for improvements
- **Warning**: Amber, for approaching thresholds
- **Error**: Red, for critical violations
- **Info**: Blue, for general information

### 6. Dashboard Controller (`dashboardController.js`)

**Purpose**: Coordinate all modules and manage application lifecycle

**Responsibilities**:
- Initialize all modules
- Manage update cycles
- Handle user interactions
- Coordinate data flow between modules

**Key Functions**:
```javascript
DashboardController.init()                // Initialize dashboard
DashboardController.updateDashboard()     // Update all components
DashboardController.startAutoRefresh()    // Start periodic updates
```

**Update Cycle**:
```
1. Get current data from simulator
2. Update KPIs
3. Update charts
4. Check thresholds
5. Show alerts if needed
6. Update timestamp
7. Wait for refresh interval
8. Repeat
```

## Data Flow

### Real-time Update Flow

```
User Opens Dashboard
        │
        ▼
Initialize All Modules
        │
        ▼
Start Auto-Refresh Timer
        │
        ▼
┌───────────────────┐
│ Get Current Data  │◄─────────────┐
│ (DataSimulator)   │              │
└─────────┬─────────┘              │
          │                        │
          ▼                        │
┌───────────────────┐              │
│ Update KPIs       │              │
│ (KPICalculator)   │              │
└─────────┬─────────┘              │
          │                        │
          ▼                        │
┌───────────────────┐              │
│ Update Charts     │              │
│ (ChartManager)    │              │
└─────────┬─────────┘              │
          │                        │
          ▼                        │
┌───────────────────┐              │
│ Check Thresholds  │              │
│ (AlertManager)    │              │
└─────────┬─────────┘              │
          │                        │
          ▼                        │
┌───────────────────┐              │
│ Update UI         │              │
│ (DOM Manipulation)│              │
└─────────┬─────────┘              │
          │                        │
          ▼                        │
    Wait Interval ──────────────────┘
    (5 seconds)
```

### Configuration Flow

```
User Opens Settings
        │
        ▼
Load Current Config
   (Config.getConfig)
        │
        ▼
Display in Modal
        │
        ▼
User Modifies Values
        │
        ▼
Validate Inputs
        │
        ▼
Save to Config
   (Config.update)
        │
        ▼
Persist to LocalStorage
        │
        ▼
Restart Auto-Refresh
```

## Design Patterns

### 1. Module Pattern

All modules use the Module Pattern for encapsulation:

```javascript
const ModuleName = (function() {
    'use strict';

    // Private variables
    let privateVar = null;

    // Private functions
    function privateFunction() {
        // ...
    }

    // Public API
    return {
        publicFunction: function() {
            // ...
        }
    };
})();
```

**Benefits**:
- Encapsulation of private state
- Clear public API
- Namespace management
- No external dependencies

### 2. Observer Pattern (Event-Driven)

Used for threshold monitoring and alerts:

```javascript
// AlertManager observes KPI changes
AlertManager.checkThresholds(currentData, previousData);

// Alerts triggered on state changes
if (statusChanged) {
    AlertManager.showAlert(...);
}
```

### 3. Strategy Pattern

Used for KPI status determination:

```javascript
// Different strategies for different KPIs
const lowerIsBetter = ['dpmo', 'cycleTime'];

if (lowerIsBetter.includes(kpiName)) {
    // Use inverse logic
} else {
    // Use standard logic
}
```

## Performance Optimizations

### 1. Efficient DOM Updates

- Update only changed elements
- Batch DOM operations
- Use DocumentFragment for multiple additions

### 2. Canvas Rendering

- Clear and redraw only when data changes
- Use requestAnimationFrame for smooth updates
- Optimize drawing operations

### 3. Data Management

- Limit historical data retention (8 hours)
- Use typed arrays for large datasets
- Implement data pruning

### 4. Event Handling

- Event delegation for dynamic elements
- Debounce/throttle frequent events
- Remove event listeners when not needed

## Security Considerations

### 1. XSS Prevention

```javascript
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

### 2. Input Validation

- Validate all user inputs
- Sanitize configuration values
- Type checking for numeric inputs

### 3. LocalStorage Safety

- Try-catch around localStorage operations
- Validate data before parsing
- Handle quota exceeded errors

## Scalability

### Current Design

- **Capacity**: Handles 8 hours of minutely data (480 points)
- **Update Frequency**: Configurable (1-60 seconds)
- **KPI Count**: 6 primary + 6 secondary metrics

### Extension Points

1. **Add New KPIs**: Extend config and data structures
2. **Add New Charts**: Extend ChartManager module
3. **Custom Alerts**: Extend AlertManager rules
4. **Data Sources**: Replace DataSimulator with real data source

## Future Enhancements

### Potential Improvements

1. **WebSocket Integration**: Real-time data from servers
2. **Historical Data Export**: CSV/Excel export functionality
3. **Advanced Analytics**: Trend prediction, anomaly detection
4. **User Management**: Multi-user support with profiles
5. **Mobile App**: Progressive Web App (PWA) conversion
6. **Offline Mode**: Service Worker for offline capability

### Integration Options

1. **MES Integration**: Connect to Manufacturing Execution Systems
2. **Database Backend**: PostgreSQL/MongoDB for data persistence
3. **API Layer**: REST API for multi-client support
4. **Authentication**: OAuth2/JWT for secure access

## Testing Strategy

### Unit Tests

- Test individual module functions
- Mock dependencies
- Validate calculations

### Integration Tests

- Test module interactions
- Verify data flow
- Check state management

### End-to-End Tests

- Simulate user interactions
- Verify complete workflows
- Test error scenarios

## Deployment Architecture

### Static Hosting

```
CDN/Web Server
        │
        ▼
    index.html
        │
        ├── src/css/
        ├── src/js/
        └── assets/
```

### With Backend (Future)

```
┌──────────────┐
│   Browser    │
└──────┬───────┘
       │ HTTPS
┌──────▼───────┐
│  Web Server  │
│  (Nginx)     │
└──────┬───────┘
       │
┌──────▼───────┐      ┌──────────────┐
│  API Server  │◄────►│   Database   │
│  (Node.js)   │      │ (PostgreSQL) │
└──────┬───────┘      └──────────────┘
       │
┌──────▼───────┐
│     MES      │
│  Integration │
└──────────────┘
```

## Conclusion

The SMT Dashboard architecture is designed for:

- **Modularity**: Independent, reusable modules
- **Maintainability**: Clear separation of concerns
- **Extensibility**: Easy to add new features
- **Performance**: Optimized for real-time updates
- **Reliability**: Error handling and fallbacks
- **Usability**: Responsive and intuitive design

The architecture supports both standalone operation and future integration with backend systems and real production equipment.
