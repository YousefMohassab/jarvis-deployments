# Quick Test App - Deployment Guide

## Table of Contents
- [Deployment Overview](#deployment-overview)
- [NGINX Configuration](#nginx-configuration)
- [Docker Deployment](#docker-deployment)
- [Step-by-Step Deployment](#step-by-step-deployment)
- [Static Hosting Alternatives](#static-hosting-alternatives)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Performance Optimization](#performance-optimization)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting Guide](#troubleshooting-guide)

---

## Deployment Overview

### Deployment Options

The Quick Test App can be deployed using several methods:

1. **Docker with NGINX** (Recommended)
   - Containerized deployment
   - Easy to scale and manage
   - Consistent across environments

2. **Static Hosting Services**
   - GitHub Pages
   - Netlify
   - Vercel
   - AWS S3 + CloudFront

3. **Traditional NGINX Server**
   - Direct installation on VM/VPS
   - Full control over configuration
   - Suitable for existing infrastructure

### Prerequisites

Before deploying, ensure you have:

- Docker installed (version 20.10 or later) OR
- NGINX installed (version 1.18 or later)
- Basic knowledge of command line operations
- Domain name (optional, for production)
- SSL certificate (recommended for production)

### System Requirements

**Minimum Requirements:**
- CPU: 1 vCPU
- RAM: 512 MB
- Storage: 100 MB
- OS: Linux (Ubuntu 20.04+, Debian 10+, Alpine 3.14+)

**Recommended for Production:**
- CPU: 2+ vCPUs
- RAM: 1 GB+
- Storage: 1 GB+ (for logs and backups)
- OS: Ubuntu 22.04 LTS or Alpine Linux 3.18+

---

## NGINX Configuration

### Complete nginx.conf Example

A production-ready NGINX configuration is provided at `/config/nginx.conf`. Key features include:

```nginx
# Worker processes - set to number of CPU cores
worker_processes auto;

# Maximum number of connections per worker
events {
    worker_connections 1024;
    use epoll;
}

http {
    # MIME types
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log warn;

    # Performance optimizations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;

    # GZIP compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss;

    # Server configuration
    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Main location
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Static assets caching
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Error pages
        error_page 404 /index.html;
        error_page 500 502 503 504 /50x.html;
    }
}
```

### Server Block Configuration

The server block defines how NGINX handles requests:

```nginx
server {
    listen 80;
    listen [::]:80;  # IPv6 support

    server_name example.com www.example.com;

    # Root directory where application files are located
    root /usr/share/nginx/html;

    # Default file to serve
    index index.html;

    # Character set
    charset utf-8;

    # Disable access logging for favicon and robots
    location = /favicon.ico {
        access_log off;
        log_not_found off;
    }

    location = /robots.txt {
        access_log off;
        log_not_found off;
    }
}
```

### Location Blocks

Configure different behaviors for different URL patterns:

```nginx
# Main application routing
location / {
    try_files $uri $uri/ /index.html;
}

# API proxy (if needed)
location /api/ {
    proxy_pass http://backend:3000/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Static assets with aggressive caching
location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
    expires 365d;
    add_header Cache-Control "public, no-transform, immutable";
    access_log off;
}

# JSON and XML files with moderate caching
location ~* \.(json|xml)$ {
    expires 1h;
    add_header Cache-Control "public, must-revalidate";
}

# HTML files - no caching for SPA
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
}
```

### MIME Types

NGINX uses MIME types to set the correct Content-Type header:

```nginx
types {
    # Text
    text/html                             html htm shtml;
    text/css                              css;
    text/xml                              xml;
    text/plain                            txt;

    # Images
    image/gif                             gif;
    image/jpeg                            jpeg jpg;
    image/png                             png;
    image/svg+xml                         svg svgz;
    image/webp                            webp;
    image/x-icon                          ico;

    # JavaScript
    application/javascript                js;
    application/json                      json;

    # Fonts
    font/woff                             woff;
    font/woff2                            woff2;
    application/font-woff                 woff;
    application/vnd.ms-fontobject         eot;
    font/ttf                              ttf;
    font/otf                              otf;
}
```

### Caching Strategies

Implement efficient caching for different asset types:

```nginx
# Level 1: Long-term caching for versioned assets
location ~* \.(css|js)$ {
    expires 365d;
    add_header Cache-Control "public, immutable";
    etag off;
}

# Level 2: Medium-term caching for images
location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
    expires 30d;
    add_header Cache-Control "public";
}

# Level 3: Short-term caching for fonts
location ~* \.(woff|woff2|ttf|eot|otf)$ {
    expires 7d;
    add_header Cache-Control "public";
}

# Level 4: No caching for HTML
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-store, no-cache, must-revalidate";
}
```

### GZIP Compression

Enable compression to reduce bandwidth and improve load times:

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/json
    application/javascript
    application/xml+rss
    application/atom+xml
    image/svg+xml;
gzip_min_length 1000;
gzip_disable "msie6";
```

---

## Docker Deployment

### Dockerfile for NGINX Container

Create a `Dockerfile` in the project root:

```dockerfile
# Use official NGINX Alpine image for smaller size
FROM nginx:1.25-alpine

# Remove default NGINX configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom NGINX configuration
COPY config/nginx.conf /etc/nginx/nginx.conf

# Copy application files
COPY src/ /usr/share/nginx/html/

# Create directory for NGINX cache
RUN mkdir -p /var/cache/nginx/client_temp \
    && mkdir -p /var/log/nginx \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Commands to Build and Run

**Build the Docker image:**

```bash
# Navigate to project directory
cd /path/to/quick-test-app

# Build image with tag
docker build -t quick-test-app:latest .

# Build with specific version
docker build -t quick-test-app:1.0.0 .
```

**Run the container:**

```bash
# Run in detached mode
docker run -d \
  --name quick-test-app \
  -p 8080:80 \
  quick-test-app:latest

# Run with custom configuration
docker run -d \
  --name quick-test-app \
  -p 8080:80 \
  -v $(pwd)/config/nginx.conf:/etc/nginx/nginx.conf:ro \
  -v $(pwd)/src:/usr/share/nginx/html:ro \
  quick-test-app:latest

# Run with environment variables
docker run -d \
  --name quick-test-app \
  -p 8080:80 \
  -e NGINX_WORKER_PROCESSES=2 \
  quick-test-app:latest
```

**Manage the container:**

```bash
# View logs
docker logs quick-test-app

# Follow logs in real-time
docker logs -f quick-test-app

# Stop container
docker stop quick-test-app

# Start container
docker start quick-test-app

# Restart container
docker restart quick-test-app

# Remove container
docker rm -f quick-test-app
```

### docker-compose.yml Example

Create a `docker-compose.yml` file for easier management:

```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    image: quick-test-app:latest
    container_name: quick-test-app
    restart: unless-stopped
    ports:
      - "8080:80"
    volumes:
      - ./src:/usr/share/nginx/html:ro
      - ./config/nginx.conf:/etc/nginx/nginx.conf:ro
      - nginx-logs:/var/log/nginx
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
    networks:
      - app-network
    environment:
      - TZ=UTC

volumes:
  nginx-logs:
    driver: local

networks:
  app-network:
    driver: bridge
```

**Docker Compose commands:**

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Scale the service
docker-compose up -d --scale web=3
```

### Volume Mapping

Volume mapping allows you to modify files without rebuilding the image:

```bash
# Map source files (read-only)
-v $(pwd)/src:/usr/share/nginx/html:ro

# Map configuration (read-only)
-v $(pwd)/config/nginx.conf:/etc/nginx/nginx.conf:ro

# Map logs (read-write)
-v $(pwd)/logs:/var/log/nginx

# Map SSL certificates
-v $(pwd)/certs:/etc/nginx/certs:ro
```

### Port Configuration

Configure port mapping based on your needs:

```bash
# Standard HTTP port
-p 80:80

# Custom port
-p 8080:80

# HTTPS
-p 443:443

# Multiple ports
-p 80:80 -p 443:443
```

---

## Step-by-Step Deployment

### Step 1: Prepare Application Files

```bash
# Clone or navigate to your project
cd /path/to/quick-test-app

# Verify file structure
ls -la src/
# Should contain: index.html, styles.css, script.js

# Verify configuration
ls -la config/
# Should contain: nginx.conf
```

### Step 2: Build Docker Image

```bash
# Build the image
docker build -t quick-test-app:latest .

# Verify the image was created
docker images | grep quick-test-app

# Inspect the image
docker inspect quick-test-app:latest
```

### Step 3: Run Container

```bash
# Run the container
docker run -d \
  --name quick-test-app \
  -p 8080:80 \
  --restart unless-stopped \
  quick-test-app:latest

# Verify container is running
docker ps | grep quick-test-app

# Check container health
docker inspect --format='{{.State.Health.Status}}' quick-test-app
```

### Step 4: Verify Deployment

```bash
# Test with curl
curl -I http://localhost:8080

# Expected response:
# HTTP/1.1 200 OK
# Server: nginx
# Content-Type: text/html

# Test with browser
# Open: http://localhost:8080

# Check NGINX logs
docker logs quick-test-app

# Test compression
curl -H "Accept-Encoding: gzip" -I http://localhost:8080/styles.css

# Test static assets
curl -I http://localhost:8080/styles.css
curl -I http://localhost:8080/script.js
```

### Step 5: Troubleshooting

**Container won't start:**

```bash
# Check container logs
docker logs quick-test-app

# Check NGINX configuration syntax
docker exec quick-test-app nginx -t

# Run container interactively
docker run -it --rm quick-test-app:latest /bin/sh
```

**Port already in use:**

```bash
# Check what's using the port
sudo lsof -i :8080

# Use a different port
docker run -d --name quick-test-app -p 8081:80 quick-test-app:latest
```

**Permission issues:**

```bash
# Check file permissions
ls -la src/

# Fix permissions
chmod -R 755 src/
chmod 644 src/*
```

---

## Static Hosting Alternatives

### GitHub Pages

**Setup Steps:**

1. Create a `gh-pages` branch or use main branch with `/docs` folder
2. Enable GitHub Pages in repository settings
3. Configure custom domain (optional)

**Configuration:**

```bash
# Create .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./src
```

**Pros:**
- Free hosting
- Automatic SSL
- Simple setup
- Git-based deployments

**Cons:**
- Static sites only
- Limited to 1GB storage
- 100GB bandwidth per month
- No server-side processing

### Netlify

**Setup Steps:**

1. Sign up at netlify.com
2. Connect your GitHub repository
3. Configure build settings
4. Deploy

**Configuration:**

Create `netlify.toml`:

```toml
[build]
  publish = "src"
  command = "echo 'No build required'"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

**Pros:**
- Automatic deployments
- Free SSL
- CDN included
- Serverless functions support
- Branch previews

**Cons:**
- Free tier limitations
- Bandwidth limits
- Build minute limits

### Vercel

**Setup Steps:**

1. Sign up at vercel.com
2. Import your GitHub repository
3. Configure project settings
4. Deploy

**Configuration:**

Create `vercel.json`:

```json
{
  "version": 2,
  "public": true,
  "routes": [
    {
      "src": "/static/(.*)",
      "headers": {
        "cache-control": "public, max-age=31536000, immutable"
      },
      "dest": "/static/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

**Pros:**
- Excellent performance
- Global CDN
- Automatic deployments
- Serverless functions
- Preview deployments

**Cons:**
- Free tier limits
- Vendor lock-in
- Configuration complexity

### AWS S3 + CloudFront

**Setup Steps:**

1. Create S3 bucket
2. Upload files to S3
3. Configure bucket for static hosting
4. Create CloudFront distribution
5. Configure DNS

**S3 Bucket Policy:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

**Upload Script:**

```bash
#!/bin/bash

BUCKET_NAME="your-bucket-name"
DISTRIBUTION_ID="your-cloudfront-id"

# Upload files
aws s3 sync ./src s3://$BUCKET_NAME/ \
  --delete \
  --cache-control "max-age=31536000" \
  --exclude "*.html"

# Upload HTML with no-cache
aws s3 sync ./src s3://$BUCKET_NAME/ \
  --cache-control "no-cache" \
  --exclude "*" \
  --include "*.html"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

**Pros:**
- Highly scalable
- Full AWS integration
- Fine-grained control
- Pay-as-you-go pricing

**Cons:**
- Complex setup
- AWS knowledge required
- Cost can increase with traffic
- Manual configuration needed

---

## SSL/TLS Configuration

### HTTPS Setup

**Generate Self-Signed Certificate (Development):**

```bash
# Generate certificate and key
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx-selfsigned.key \
  -out nginx-selfsigned.crt \
  -subj "/C=US/ST=State/L=City/O=Org/CN=localhost"

# Generate Diffie-Hellman parameters
openssl dhparam -out dhparam.pem 2048
```

**NGINX HTTPS Configuration:**

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    server_name example.com www.example.com;

    # SSL certificates
    ssl_certificate /etc/nginx/certs/certificate.crt;
    ssl_certificate_key /etc/nginx/certs/private.key;

    # SSL protocols and ciphers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;

    # SSL session cache
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Diffie-Hellman parameters
    ssl_dhparam /etc/nginx/certs/dhparam.pem;

    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Certificate Installation

**Copy certificates to container:**

```bash
# Create certificates directory
mkdir -p certs

# Copy certificates
cp /path/to/certificate.crt certs/
cp /path/to/private.key certs/

# Update docker-compose.yml to mount certificates
volumes:
  - ./certs:/etc/nginx/certs:ro
```

### Let's Encrypt Integration

**Using Certbot:**

```bash
# Install Certbot
apt-get update
apt-get install certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx -d example.com -d www.example.com

# Auto-renewal
certbot renew --dry-run
```

**Docker with Let's Encrypt:**

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    volumes:
      - ./src:/usr/share/nginx/html:ro
      - ./config/nginx.conf:/etc/nginx/nginx.conf:ro
      - certbot-etc:/etc/letsencrypt
      - certbot-var:/var/lib/letsencrypt
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - certbot

  certbot:
    image: certbot/certbot
    volumes:
      - certbot-etc:/etc/letsencrypt
      - certbot-var:/var/lib/letsencrypt
      - ./src:/usr/share/nginx/html
    command: certonly --webroot --webroot-path=/usr/share/nginx/html --email admin@example.com --agree-tos --no-eff-email -d example.com -d www.example.com

volumes:
  certbot-etc:
  certbot-var:
```

### Redirect HTTP to HTTPS

**NGINX Configuration:**

```nginx
# HTTP server - redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name example.com www.example.com;

    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    server_name example.com www.example.com;

    # SSL configuration
    ssl_certificate /etc/nginx/certs/certificate.crt;
    ssl_certificate_key /etc/nginx/certs/private.key;

    # ... rest of configuration
}
```

---

## Performance Optimization

### Caching Headers

**Browser Caching Strategy:**

```nginx
# Versioned static assets - cache forever
location ~* \.(?:css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}

# Images - cache for 30 days
location ~* \.(?:jpg|jpeg|gif|png|ico|svg|webp)$ {
    expires 30d;
    add_header Cache-Control "public";
    access_log off;
}

# Fonts - cache for 1 year
location ~* \.(?:woff|woff2|ttf|eot|otf)$ {
    expires 1y;
    add_header Cache-Control "public";
    access_log off;
}

# HTML - no caching for SPA
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate";
}

# API responses - short cache
location /api/ {
    expires 5m;
    add_header Cache-Control "public, must-revalidate";
}
```

### Asset Compression

**GZIP Configuration:**

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_buffers 16 8k;
gzip_http_version 1.1;
gzip_min_length 256;
gzip_types
    application/atom+xml
    application/geo+json
    application/javascript
    application/json
    application/ld+json
    application/manifest+json
    application/rdf+xml
    application/rss+xml
    application/vnd.ms-fontobject
    application/wasm
    application/x-font-ttf
    application/x-web-app-manifest+json
    application/xhtml+xml
    application/xml
    font/eot
    font/otf
    font/ttf
    image/bmp
    image/svg+xml
    text/cache-manifest
    text/calendar
    text/css
    text/javascript
    text/markdown
    text/plain
    text/xml;
```

**Brotli Compression (Advanced):**

```nginx
# Requires ngx_brotli module
brotli on;
brotli_comp_level 6;
brotli_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/json
    application/javascript
    application/xml+rss
    image/svg+xml;
```

### CDN Integration

**CloudFlare Setup:**

1. Add site to CloudFlare
2. Update nameservers
3. Configure caching rules
4. Enable Auto Minify
5. Enable Brotli compression

**NGINX Configuration for CDN:**

```nginx
# Add headers for CDN
add_header X-Cache-Status $upstream_cache_status;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;

# Set proper CORS headers for CDN
location ~* \.(woff|woff2|ttf|eot|otf)$ {
    add_header Access-Control-Allow-Origin "*";
    expires 1y;
    access_log off;
}
```

**AWS CloudFront Configuration:**

```json
{
  "DistributionConfig": {
    "Origins": [
      {
        "DomainName": "origin.example.com",
        "CustomHeaders": [
          {
            "HeaderName": "X-Origin-Verify",
            "HeaderValue": "secret-token"
          }
        ]
      }
    ],
    "DefaultCacheBehavior": {
      "Compress": true,
      "ViewerProtocolPolicy": "redirect-to-https",
      "CachePolicyId": "managed-caching-optimized"
    }
  }
}
```

### Resource Optimization

**Preloading Critical Resources:**

```html
<!-- In index.html -->
<link rel="preload" href="/styles.css" as="style">
<link rel="preload" href="/script.js" as="script">
<link rel="dns-prefetch" href="//cdn.example.com">
<link rel="preconnect" href="//api.example.com">
```

**HTTP/2 Server Push:**

```nginx
# Enable HTTP/2
listen 443 ssl http2;

# Server push critical resources
location = /index.html {
    http2_push /styles.css;
    http2_push /script.js;
}
```

**Resource Hints:**

```nginx
# Add Link headers for preloading
add_header Link "</styles.css>; rel=preload; as=style" always;
add_header Link "</script.js>; rel=preload; as=script" always;
```

---

## Monitoring & Maintenance

### Health Checks

**Docker Health Check:**

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
```

**NGINX Status Endpoint:**

```nginx
# Add status location
location /nginx_status {
    stub_status on;
    access_log off;
    allow 127.0.0.1;
    deny all;
}
```

**External Monitoring:**

```bash
# Simple uptime check script
#!/bin/bash

URL="http://localhost:8080"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $URL)

if [ $RESPONSE -eq 200 ]; then
    echo "Site is up"
    exit 0
else
    echo "Site is down - HTTP $RESPONSE"
    exit 1
fi
```

### Log Management

**Log Rotation:**

Create `/etc/logrotate.d/nginx-docker`:

```
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 nginx nginx
    sharedscripts
    postrotate
        docker exec quick-test-app nginx -s reopen
    endscript
}
```

**Access Log Analysis:**

```bash
# Top 10 IP addresses
docker exec quick-test-app cat /var/log/nginx/access.log | \
    awk '{print $1}' | sort | uniq -c | sort -rn | head -10

# Top 10 requested URLs
docker exec quick-test-app cat /var/log/nginx/access.log | \
    awk '{print $7}' | sort | uniq -c | sort -rn | head -10

# Response status codes
docker exec quick-test-app cat /var/log/nginx/access.log | \
    awk '{print $9}' | sort | uniq -c | sort -rn

# Average response time
docker exec quick-test-app cat /var/log/nginx/access.log | \
    awk '{sum+=$NF; count++} END {print sum/count}'
```

**Error Log Monitoring:**

```bash
# Watch error log in real-time
docker exec quick-test-app tail -f /var/log/nginx/error.log

# Count errors by type
docker exec quick-test-app cat /var/log/nginx/error.log | \
    grep -oP '\[error\] \d+#\d+: \*\d+ \K[^,]+' | sort | uniq -c
```

### Updates and Patches

**Update Docker Image:**

```bash
# Pull latest NGINX image
docker pull nginx:alpine

# Rebuild application image
docker build -t quick-test-app:latest .

# Stop and remove old container
docker stop quick-test-app
docker rm quick-test-app

# Start new container
docker run -d --name quick-test-app -p 8080:80 quick-test-app:latest
```

**Zero-Downtime Updates:**

```bash
# Start new container with different name
docker run -d --name quick-test-app-new -p 8081:80 quick-test-app:latest

# Test new container
curl http://localhost:8081

# Update load balancer to point to new container
# Then remove old container
docker stop quick-test-app
docker rm quick-test-app

# Rename new container
docker rename quick-test-app-new quick-test-app
```

### Backup Strategies

**Backup Script:**

```bash
#!/bin/bash

BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="quick-test-app_$DATE.tar.gz"

# Backup application files
tar -czf $BACKUP_DIR/$BACKUP_FILE \
    -C /home/yousef/workspace/JarvisII/storage/UZ2CcrTd13NrEAm81F1qLWHyAiD2/projects/quick-test-app \
    src/ config/

# Backup Docker volumes
docker run --rm \
    -v nginx-logs:/source \
    -v $BACKUP_DIR:/backup \
    alpine tar -czf /backup/logs_$DATE.tar.gz -C /source .

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

**Restore Procedure:**

```bash
#!/bin/bash

BACKUP_FILE=$1

# Extract backup
tar -xzf $BACKUP_FILE -C /tmp/restore

# Stop container
docker stop quick-test-app

# Restore files
cp -r /tmp/restore/src/* /path/to/quick-test-app/src/
cp -r /tmp/restore/config/* /path/to/quick-test-app/config/

# Restart container
docker start quick-test-app

# Cleanup
rm -rf /tmp/restore
```

---

## Security Best Practices

### Security Headers

**Comprehensive Security Headers:**

```nginx
# Prevent clickjacking
add_header X-Frame-Options "SAMEORIGIN" always;

# Prevent MIME type sniffing
add_header X-Content-Type-Options "nosniff" always;

# Enable XSS protection
add_header X-XSS-Protection "1; mode=block" always;

# HSTS - Force HTTPS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;" always;

# Referrer Policy
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Permissions Policy
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

# Remove server header
server_tokens off;
```

### Access Control

**IP Whitelisting:**

```nginx
# Allow specific IPs
location /admin {
    allow 192.168.1.0/24;
    allow 10.0.0.0/8;
    deny all;

    try_files $uri $uri/ /index.html;
}

# Deny specific IPs
location / {
    deny 192.168.1.100;
    deny 10.0.0.50;
    allow all;
}
```

**Basic Authentication:**

```bash
# Create password file
apt-get install apache2-utils
htpasswd -c /etc/nginx/.htpasswd admin
```

```nginx
# Protect location with password
location /admin {
    auth_basic "Restricted Area";
    auth_basic_user_file /etc/nginx/.htpasswd;

    try_files $uri $uri/ /index.html;
}
```

### Rate Limiting

**Limit Request Rate:**

```nginx
# Define rate limit zones
http {
    # Limit requests to 10 per second
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;

    # Limit API requests to 5 per second
    limit_req_zone $binary_remote_addr zone=api:10m rate=5r/s;

    # Limit login attempts to 1 per minute
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/m;

    server {
        # Apply general rate limit
        location / {
            limit_req zone=general burst=20 nodelay;
            try_files $uri $uri/ /index.html;
        }

        # Apply stricter limit to API
        location /api/ {
            limit_req zone=api burst=10 nodelay;
            proxy_pass http://backend;
        }

        # Apply strictest limit to login
        location /api/login {
            limit_req zone=login burst=5;
            proxy_pass http://backend;
        }
    }
}
```

**Connection Limiting:**

```nginx
# Limit concurrent connections
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

server {
    # Limit to 10 concurrent connections per IP
    location / {
        limit_conn conn_limit 10;
        try_files $uri $uri/ /index.html;
    }
}
```

### DDoS Protection

**Basic DDoS Protection:**

```nginx
# Limit request body size
client_body_buffer_size 1K;
client_max_body_size 1m;

# Limit request header size
client_header_buffer_size 1k;
large_client_header_buffers 2 1k;

# Set timeouts
client_body_timeout 10;
client_header_timeout 10;
keepalive_timeout 5 5;
send_timeout 10;

# Limit connections
limit_conn_zone $binary_remote_addr zone=addr:10m;
limit_conn addr 10;

# Close slow connections
reset_timedout_connection on;
```

**Advanced Protection with Fail2Ban:**

Create `/etc/fail2ban/filter.d/nginx-noscript.conf`:

```
[Definition]
failregex = ^<HOST> -.*GET.*(\.php|\.asp|\.exe|\.pl|\.cgi|\.scgi)
ignoreregex =
```

Create `/etc/fail2ban/jail.local`:

```
[nginx-noscript]
enabled = true
port = http,https
filter = nginx-noscript
logpath = /var/log/nginx/access.log
maxretry = 6
bantime = 3600
```

---

## Troubleshooting Guide

### Common Issues

#### Issue 1: Container Fails to Start

**Symptoms:**
- Container exits immediately after starting
- "Exited (1)" status

**Diagnosis:**

```bash
# Check container logs
docker logs quick-test-app

# Check NGINX configuration syntax
docker exec quick-test-app nginx -t

# Run container interactively
docker run -it --rm quick-test-app:latest /bin/sh
```

**Solutions:**

```bash
# Fix configuration errors
# Edit config/nginx.conf to fix syntax errors

# Rebuild image
docker build -t quick-test-app:latest .

# Verify file permissions
ls -la src/
chmod 644 src/*
chmod 755 src
```

#### Issue 2: 404 Not Found Errors

**Symptoms:**
- Files not loading
- 404 errors in browser

**Diagnosis:**

```bash
# Check file paths
docker exec quick-test-app ls -la /usr/share/nginx/html/

# Check NGINX error log
docker logs quick-test-app 2>&1 | grep error

# Test file access
docker exec quick-test-app cat /usr/share/nginx/html/index.html
```

**Solutions:**

```bash
# Verify files are copied correctly in Dockerfile
# Check COPY command path

# Verify root directory in nginx.conf
# Should match: root /usr/share/nginx/html;

# Rebuild with correct paths
docker build -t quick-test-app:latest .
docker run -d --name quick-test-app -p 8080:80 quick-test-app:latest
```

#### Issue 3: Port Binding Errors

**Symptoms:**
- "bind: address already in use"
- Cannot start container

**Diagnosis:**

```bash
# Check what's using the port
sudo lsof -i :8080
sudo netstat -tulpn | grep :8080

# Check for existing containers
docker ps -a | grep quick-test-app
```

**Solutions:**

```bash
# Stop conflicting container
docker stop $(docker ps -q --filter "ancestor=quick-test-app")

# Use different port
docker run -d --name quick-test-app -p 8081:80 quick-test-app:latest

# Kill process using the port
sudo kill -9 $(sudo lsof -t -i:8080)
```

#### Issue 4: CSS/JS Not Loading

**Symptoms:**
- HTML loads but no styling
- Console errors for missing files

**Diagnosis:**

```bash
# Check MIME types
curl -I http://localhost:8080/styles.css

# Check file paths
docker exec quick-test-app find /usr/share/nginx/html -type f

# Check NGINX access log
docker logs quick-test-app | grep "GET /styles.css"
```

**Solutions:**

```nginx
# Add MIME types to nginx.conf
include /etc/nginx/mime.types;
default_type application/octet-stream;

# Fix file paths in HTML
# Ensure paths are relative: href="styles.css" not href="/static/styles.css"

# Clear browser cache
# Use Ctrl+Shift+R or clear cache manually
```

### Debug Steps

**Step 1: Verify Container Status**

```bash
# Check if container is running
docker ps | grep quick-test-app

# Check container details
docker inspect quick-test-app

# Check resource usage
docker stats quick-test-app
```

**Step 2: Check Logs**

```bash
# View all logs
docker logs quick-test-app

# Follow logs in real-time
docker logs -f quick-test-app

# View last 50 lines
docker logs --tail 50 quick-test-app

# View logs with timestamps
docker logs -t quick-test-app
```

**Step 3: Test Configuration**

```bash
# Test NGINX configuration
docker exec quick-test-app nginx -t

# Reload NGINX
docker exec quick-test-app nginx -s reload

# View configuration
docker exec quick-test-app cat /etc/nginx/nginx.conf
```

**Step 4: Test Network Connectivity**

```bash
# Test from host
curl -v http://localhost:8080

# Test DNS resolution
docker exec quick-test-app nslookup google.com

# Test network connectivity
docker exec quick-test-app ping -c 3 8.8.8.8
```

**Step 5: Inspect File System**

```bash
# List files
docker exec quick-test-app ls -la /usr/share/nginx/html/

# Check file contents
docker exec quick-test-app cat /usr/share/nginx/html/index.html

# Check file permissions
docker exec quick-test-app ls -la /usr/share/nginx/html/
```

### Log Analysis

**Access Log Format:**

```
$remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent"
```

**Common Error Codes:**

- `404`: File not found - check file paths
- `403`: Forbidden - check file permissions
- `500`: Internal server error - check NGINX configuration
- `502`: Bad gateway - check upstream server
- `503`: Service unavailable - check if NGINX is running

**Log Analysis Commands:**

```bash
# Find 404 errors
docker logs quick-test-app 2>&1 | grep " 404 "

# Find 500 errors
docker logs quick-test-app 2>&1 | grep " 500 "

# Count requests by status code
docker logs quick-test-app 2>&1 | awk '{print $9}' | sort | uniq -c

# Find slow requests (if logged)
docker logs quick-test-app 2>&1 | awk '$NF > 1.0 {print}'
```

### Performance Issues

#### Issue: Slow Response Times

**Diagnosis:**

```bash
# Test response time
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8080

# Create curl-format.txt:
# time_namelookup: %{time_namelookup}\n
# time_connect: %{time_connect}\n
# time_starttransfer: %{time_starttransfer}\n
# time_total: %{time_total}\n

# Check container resources
docker stats quick-test-app

# Check NGINX worker processes
docker exec quick-test-app ps aux | grep nginx
```

**Solutions:**

```nginx
# Increase worker processes
worker_processes auto;

# Increase worker connections
events {
    worker_connections 2048;
}

# Enable keepalive
keepalive_timeout 65;
keepalive_requests 100;

# Enable caching
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m;
```

#### Issue: High Memory Usage

**Diagnosis:**

```bash
# Check memory usage
docker stats quick-test-app --no-stream

# Check inside container
docker exec quick-test-app free -m

# Check NGINX memory
docker exec quick-test-app ps aux | grep nginx | awk '{print $6}'
```

**Solutions:**

```nginx
# Limit worker connections
worker_connections 1024;

# Adjust buffer sizes
client_body_buffer_size 10K;
client_header_buffer_size 1k;
client_max_body_size 8m;

# Limit concurrent connections
limit_conn_zone $binary_remote_addr zone=addr:10m;
limit_conn addr 10;
```

---

## Conclusion

This deployment guide provides comprehensive instructions for deploying the Quick Test App using NGINX. Whether you choose Docker deployment, static hosting services, or traditional server setup, you now have the knowledge and configuration files to deploy successfully.

For additional support:
- Check NGINX documentation: https://nginx.org/en/docs/
- Docker documentation: https://docs.docker.com/
- Project repository: [Add your repository URL]

**Quick Reference Commands:**

```bash
# Build and run
docker build -t quick-test-app:latest .
docker run -d --name quick-test-app -p 8080:80 quick-test-app:latest

# Manage container
docker logs quick-test-app
docker stop quick-test-app
docker start quick-test-app
docker restart quick-test-app

# Test deployment
curl http://localhost:8080
docker exec quick-test-app nginx -t

# Cleanup
docker stop quick-test-app
docker rm quick-test-app
docker rmi quick-test-app:latest
```
