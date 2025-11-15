# SMT Dashboard Deployment Guide

## Overview

This guide covers deployment options for the SMT Dashboard, from local development to production environments.

## Table of Contents

1. [Local Development](#local-development)
2. [Static Hosting](#static-hosting)
3. [Docker Deployment](#docker-deployment)
4. [Cloud Platforms](#cloud-platforms)
5. [Production Considerations](#production-considerations)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)

## Local Development

### Quick Start

**Option 1: Python HTTP Server**
```bash
cd /home/yousef/workspace/storage/UZ2CcrTd13NrEAm81F1qLWHyAiD2/projects/smt-dashboard
python3 -m http.server 8080
```

**Option 2: Node.js HTTP Server**
```bash
npx http-server -p 8080
```

**Option 3: PHP Built-in Server**
```bash
php -S localhost:8080
```

Access the dashboard at: `http://localhost:8080`

### Development Environment Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd smt-dashboard
```

2. **No build step required**
   - The application runs directly in the browser
   - No compilation or transpilation needed

3. **Testing**
```bash
node tests/run-tests.js
```

## Static Hosting

### GitHub Pages

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Enable GitHub Pages**
   - Go to repository Settings
   - Navigate to Pages section
   - Select source branch (main)
   - Select root folder
   - Save

3. **Access**
   - URL: `https://username.github.io/smt-dashboard`

### Netlify

1. **Connect Repository**
   - Login to Netlify
   - Click "New site from Git"
   - Connect to GitHub/GitLab
   - Select repository

2. **Build Settings**
   ```
   Build command: (leave empty)
   Publish directory: /
   ```

3. **Deploy**
   - Click "Deploy site"
   - Automatic deployments on push

4. **Custom Domain** (Optional)
   - Add custom domain in site settings
   - Configure DNS records

### Vercel

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
cd smt-dashboard
vercel
```

3. **Production Deployment**
```bash
vercel --prod
```

### AWS S3 + CloudFront

1. **Create S3 Bucket**
```bash
aws s3 mb s3://smt-dashboard-prod
```

2. **Configure Bucket for Static Website**
```bash
aws s3 website s3://smt-dashboard-prod \
  --index-document index.html \
  --error-document index.html
```

3. **Upload Files**
```bash
aws s3 sync . s3://smt-dashboard-prod \
  --exclude ".git/*" \
  --exclude "tests/*" \
  --exclude "*.md"
```

4. **Create CloudFront Distribution**
```bash
aws cloudfront create-distribution \
  --origin-domain-name smt-dashboard-prod.s3.amazonaws.com \
  --default-root-object index.html
```

5. **Set Bucket Policy**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::smt-dashboard-prod/*"
    }
  ]
}
```

## Docker Deployment

### Dockerfile

Create `Dockerfile`:
```dockerfile
FROM nginx:alpine

# Copy application files
COPY . /usr/share/nginx/html

# Configure nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

Create `nginx.conf`:
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json;
    gzip_min_length 1000;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Build and Run

```bash
# Build image
docker build -t smt-dashboard:latest .

# Run container
docker run -d -p 8080:80 --name smt-dashboard smt-dashboard:latest

# Access
open http://localhost:8080
```

### Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

Run with:
```bash
docker-compose up -d
```

## Cloud Platforms

### Azure Static Web Apps

1. **Create Resource**
```bash
az staticwebapp create \
  --name smt-dashboard \
  --resource-group production \
  --source https://github.com/username/smt-dashboard \
  --location eastus2 \
  --branch main \
  --app-location "/" \
  --output-location "/"
```

2. **Configure**
   - Add `staticwebapp.config.json`:
```json
{
  "navigationFallback": {
    "rewrite": "/index.html"
  },
  "responseOverrides": {
    "404": {
      "rewrite": "/index.html"
    }
  }
}
```

### Google Cloud Storage

1. **Create Bucket**
```bash
gsutil mb gs://smt-dashboard-prod
```

2. **Upload Files**
```bash
gsutil -m rsync -r . gs://smt-dashboard-prod
```

3. **Make Public**
```bash
gsutil iam ch allUsers:objectViewer gs://smt-dashboard-prod
```

4. **Configure Website**
```bash
gsutil web set -m index.html -e index.html gs://smt-dashboard-prod
```

### DigitalOcean App Platform

1. **Create App**
   - Connect GitHub repository
   - Select "Static Site"
   - Configure:
     ```
     Name: smt-dashboard
     Branch: main
     Build Command: (none)
     Output Directory: /
     ```

2. **Deploy**
   - Automatic on push

## Production Considerations

### Performance Optimization

1. **Enable Compression**
   - Gzip/Brotli compression for text files
   - Reduce file sizes by 70-90%

2. **CDN Integration**
   - Serve static assets from CDN
   - Reduce latency globally
   - Example: Cloudflare, AWS CloudFront

3. **Caching Strategy**
```nginx
# HTML - no cache
location ~* \.html$ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}

# CSS, JS - long cache
location ~* \.(css|js)$ {
    add_header Cache-Control "public, max-age=31536000, immutable";
}
```

4. **Minification**
```bash
# Install minification tools
npm install -g terser clean-css-cli html-minifier

# Minify JavaScript
terser src/js/**/*.js -o dist/app.min.js

# Minify CSS
cleancss -o dist/styles.min.css src/css/**/*.css

# Minify HTML
html-minifier --collapse-whitespace --remove-comments \
  index.html -o dist/index.html
```

### Security

1. **Content Security Policy**

Add to HTML `<head>`:
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' 'unsafe-inline';
               style-src 'self' 'unsafe-inline';">
```

Or via HTTP header:
```nginx
add_header Content-Security-Policy "default-src 'self';" always;
```

2. **HTTPS Enforcement**
```nginx
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
}
```

3. **Security Headers**
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

### Monitoring

1. **Uptime Monitoring**
   - UptimeRobot
   - Pingdom
   - AWS CloudWatch

2. **Performance Monitoring**
   - Google Analytics
   - New Relic Browser
   - Datadog RUM

3. **Error Tracking**
   - Sentry
   - Rollbar
   - Bugsnag

Example Sentry integration:
```javascript
// Add to app.js
if (PRODUCTION) {
    Sentry.init({
        dsn: 'YOUR_SENTRY_DSN',
        environment: 'production'
    });
}
```

### Backup and Recovery

1. **Automated Backups**
```bash
# Cron job for S3 backup
0 2 * * * aws s3 sync s3://smt-dashboard-prod s3://smt-dashboard-backup/$(date +\%Y-\%m-\%d)/
```

2. **Version Control**
   - Tag releases: `git tag -a v1.0.0 -m "Release 1.0.0"`
   - Maintain changelog
   - Document rollback procedures

### Load Testing

```bash
# Install Apache Bench
apt-get install apache2-utils

# Run load test
ab -n 1000 -c 100 http://your-domain.com/

# Install and use Artillery
npm install -g artillery
artillery quick --count 100 --num 10 http://your-domain.com/
```

## Environment Configuration

### Production Environment Variables

Create `.env.production`:
```bash
NODE_ENV=production
API_URL=https://api.production.com
REFRESH_INTERVAL=5000
ENABLE_ANALYTICS=true
```

### Configuration Management

```javascript
const CONFIG = {
    production: {
        apiUrl: 'https://api.production.com',
        refreshInterval: 5000,
        enableAnalytics: true
    },
    staging: {
        apiUrl: 'https://api.staging.com',
        refreshInterval: 10000,
        enableAnalytics: false
    },
    development: {
        apiUrl: 'http://localhost:3000',
        refreshInterval: 5000,
        enableAnalytics: false
    }
};

const env = process.env.NODE_ENV || 'development';
const config = CONFIG[env];
```

## Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2

    - name: Run tests
      run: node tests/run-tests.js

    - name: Deploy to S3
      uses: jakejarvis/s3-sync-action@master
      with:
        args: --delete
      env:
        AWS_S3_BUCKET: ${{ secrets.AWS_S3_BUCKET }}
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

    - name: Invalidate CloudFront
      uses: chetan/invalidate-cloudfront-action@v2
      env:
        DISTRIBUTION: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}
        PATHS: '/*'
        AWS_REGION: 'us-east-1'
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## Troubleshooting

### Common Issues

**Issue: 404 Errors on Refresh**
- **Cause**: Server not configured for SPA routing
- **Solution**: Configure server to serve index.html for all routes

**Issue: CORS Errors**
- **Cause**: API calls from different origin
- **Solution**: Configure CORS headers on API server

**Issue: LocalStorage Not Working**
- **Cause**: Private/incognito mode or storage quota exceeded
- **Solution**: Handle errors gracefully, inform user

**Issue: Performance Degradation**
- **Cause**: Too much historical data
- **Solution**: Implement data pruning, limit retention

### Debug Mode

Enable debug logging:
```javascript
// Add to app.js
const DEBUG = true;

if (DEBUG) {
    console.log('Debug mode enabled');
    window.DEBUG = true;
}
```

### Health Check Endpoint

Create `health.html`:
```html
<!DOCTYPE html>
<html>
<head><title>Health Check</title></head>
<body>
    <h1>OK</h1>
    <script>
        document.write('Timestamp: ' + new Date().toISOString());
    </script>
</body>
</html>
```

## Rollback Procedures

1. **Identify Issue**
   - Check monitoring alerts
   - Review error logs
   - Verify user reports

2. **Rollback Steps**
```bash
# AWS S3 + CloudFront
aws s3 sync s3://smt-dashboard-backup/2024-01-01/ s3://smt-dashboard-prod/
aws cloudfront create-invalidation --distribution-id DIST_ID --paths "/*"

# Docker
docker pull smt-dashboard:v1.0.0
docker stop smt-dashboard
docker rm smt-dashboard
docker run -d -p 8080:80 --name smt-dashboard smt-dashboard:v1.0.0

# Git-based platforms
git revert HEAD
git push origin main
```

3. **Verify Rollback**
   - Check application functionality
   - Monitor error rates
   - Confirm with stakeholders

## Conclusion

The SMT Dashboard is designed for easy deployment across various platforms. Choose the deployment method that best fits your infrastructure and requirements.

For production environments:
- Use HTTPS
- Enable caching and compression
- Implement monitoring
- Plan for backup and recovery
- Test thoroughly before deployment
