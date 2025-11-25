# Smart Building Energy Management - Frontend

Production-ready React frontend for real-time building energy monitoring and management.

## Features

### Core Functionality
- **Real-time Energy Dashboard** - Live power consumption monitoring with interactive charts
- **Analytics & Reporting** - Historical data analysis, trends, and cost breakdowns
- **Zone Management** - Complete CRUD operations for building zones
- **Equipment Control** - Monitor and control building equipment with real-time status
- **Alert System** - Real-time alerts with acknowledgment and resolution workflows
- **Settings Management** - User profiles, notifications, and energy targets

### Technical Features
- **Authentication** - JWT-based auth with protected routes
- **Dark Mode** - System preference + manual toggle
- **Responsive Design** - Mobile-first design with Tailwind CSS
- **Real-time Updates** - Auto-refresh with configurable intervals
- **Form Validation** - React Hook Form + Zod schemas
- **State Management** - Zustand for global state
- **API Integration** - Axios with React Query for data fetching
- **Error Boundaries** - Graceful error handling
- **Loading States** - Skeleton screens and spinners
- **Toast Notifications** - User feedback for all actions

## Tech Stack

- **React 18** - UI framework
- **Vite 5** - Build tool
- **React Router 6** - Routing
- **TailwindCSS 3** - Styling
- **React Query** - Server state management
- **Zustand** - Client state management
- **Recharts** - Data visualization
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Axios** - HTTP client
- **Framer Motion** - Animations
- **Hero Icons** - Icon library

## Quick Start

### Prerequisites
- Node.js 18+
- Backend API running on port 8000

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access the application
# Frontend: http://localhost:3001
# Backend API: http://localhost:8000
```

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── main.jsx                 # Entry point
│   ├── App.jsx                  # Root component with routing
│   ├── index.css                # Global styles & Tailwind
│   ├── components/              # Shared components
│   │   ├── ErrorBoundary.jsx    # Error boundary wrapper
│   │   ├── LoadingSpinner.jsx   # Loading states
│   │   ├── ProtectedRoute.jsx   # Auth guard
│   │   └── Layout.jsx           # Main layout with nav
│   ├── pages/                   # Route pages
│   │   ├── Login.jsx            # Login page
│   │   ├── Register.jsx         # Registration page
│   │   ├── Dashboard.jsx        # Main dashboard
│   │   ├── Analytics.jsx        # Analytics & reports
│   │   ├── Zones.jsx            # Zone management
│   │   ├── Equipment.jsx        # Equipment control
│   │   ├── Alerts.jsx           # Alert management
│   │   └── Settings.jsx         # Settings page
│   ├── services/                # API services
│   │   ├── api.js               # Axios instance
│   │   ├── authService.js       # Auth API
│   │   ├── energyService.js     # Energy data API
│   │   ├── zoneService.js       # Zone API
│   │   ├── equipmentService.js  # Equipment API
│   │   ├── analyticsService.js  # Analytics API
│   │   ├── alertService.js      # Alert API
│   │   └── settingsService.js   # Settings API
│   └── store/                   # State management
│       ├── authStore.js         # Auth state
│       └── themeStore.js        # Theme state
├── Dockerfile                   # Production Docker image
├── nginx.conf                   # Nginx configuration
├── vite.config.js               # Vite configuration
├── tailwind.config.js           # Tailwind configuration
├── postcss.config.js            # PostCSS configuration
└── package.json                 # Dependencies

Total: 40+ files, 15+ directories
```

## Available Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | Login | User authentication |
| `/register` | Register | User registration |
| `/` | Dashboard | Main dashboard with real-time data |
| `/analytics` | Analytics | Historical data and reports |
| `/zones` | Zones | Zone management interface |
| `/equipment` | Equipment | Equipment monitoring and control |
| `/alerts` | Alerts | Alert management system |
| `/settings` | Settings | User and system settings |

## Configuration

### Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:8000/api
VITE_NODE_ENV=production
```

### Vite Configuration

The `vite.config.js` includes:
- **Base path**: `'./'` for relative asset paths (required for deployment)
- **Proxy**: API requests to `/api` forwarded to backend
- **Code splitting**: Vendor, charts, and UI libraries split into separate chunks
- **Source maps**: Enabled for debugging

## Deployment

### Docker Deployment

The project includes production-ready Docker configuration:

```bash
# Build Docker image
docker build -t smart-building-frontend .

# Run container
docker run -p 80:80 smart-building-frontend
```

**IMPORTANT**: The Dockerfile and nginx.conf are REQUIRED for proper deployment:
- `Dockerfile` - Multi-stage build with nginx serving
- `nginx.conf` - Proper MIME types for JavaScript modules, SPA routing, caching

Without these files, deployment may result in blank pages with console error:
```
Failed to load module script: Expected a JavaScript module script
but the server responded with a MIME type of ""
```

### Coolify Deployment

1. Create new service in Coolify
2. Point to this directory
3. Coolify will automatically detect Dockerfile
4. Set environment variables in Coolify UI
5. Deploy

### Build Validation

Before deploying, validate the build locally:

```bash
# 1. Build the project
npm run build

# 2. Verify dist folder
ls -la dist/

# 3. Check asset paths (should be relative)
cat dist/index.html | grep "script"
# Should show: <script type="module" crossorigin src="./assets/index-*.js">
# NOT: <script type="module" crossorigin src="/assets/index-*.js">
```

## API Integration

The frontend connects to the backend API running on port 8000:

- **Base URL**: `http://localhost:8000/api`
- **Auth**: JWT tokens stored in localStorage via Zustand
- **Interceptors**: Automatic token injection and 401 handling
- **Proxy**: Vite dev server proxies `/api` to backend

## Development

### Running Both Frontend and Backend

```bash
# Terminal 1 - Backend (already running)
cd /home/facilis/workspace/storage/UZ2CcrTd13NrEAm81F1qLWHyAiD2/projects/smart-building-energy-management/backend
npm start

# Terminal 2 - Frontend
cd /home/facilis/workspace/storage/UZ2CcrTd13NrEAm81F1qLWHyAiD2/projects/smart-building-energy-management/frontend
npm run dev
```

### Demo Credentials

```
Email: admin@example.com
Password: admin123
```

(Note: Backend needs to seed this user)

## Performance

### Bundle Sizes
- **Vendor**: 345 KB (107 KB gzipped)
- **Charts**: 435 KB (117 KB gzipped)
- **UI**: 12.5 KB (5 KB gzipped)
- **App**: 465 KB (89 KB gzipped)
- **CSS**: 20.4 KB (4.6 KB gzipped)

### Optimizations
- Code splitting by route and library
- Lazy loading for heavy components
- React Query caching (5-minute stale time)
- Gzip compression in nginx
- Static asset caching (1 year)
- No caching for HTML files

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Troubleshooting

### Blank Page After Deployment

**Symptom**: App works locally but shows blank page in production with console error about MIME types.

**Solution**: Ensure `base: './'` is set in `vite.config.js` and rebuild:
```bash
npm run build
cat dist/index.html | grep "src="
# Verify paths start with "./"
```

### API Connection Errors

**Symptom**: 404 or CORS errors when calling API.

**Solutions**:
1. Verify backend is running on port 8000
2. Check VITE_API_URL in .env
3. Verify proxy configuration in vite.config.js
4. Check CORS settings in backend

### Build Fails

**Common issues**:
1. Missing dependencies - run `npm install`
2. Node version - ensure Node 18+
3. Tailwind configuration - verify tailwind.config.js exists
4. TypeScript errors - check imports and types

## License

MIT

## Support

For issues or questions, contact the development team.
