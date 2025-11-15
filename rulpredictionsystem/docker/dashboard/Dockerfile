# ============================================================================
# RUL Prediction Dashboard - Production Dockerfile
# Multi-stage build: Build React app + Serve with Nginx
# ============================================================================

# ============================================================================
# Stage 1: Build - Compile React application
# ============================================================================
FROM node:18-alpine AS builder

LABEL maintainer="RUL Prediction Team"
LABEL stage="builder"

# Set working directory
WORKDIR /app

# Copy package files
COPY dashboard/package*.json ./

# Install dependencies
RUN npm install --production && \
    npm cache clean --force

# Copy source code
COPY dashboard/ ./

# Build production application
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false
RUN npm run build

# ============================================================================
# Stage 2: Production - Serve with Nginx
# ============================================================================
FROM nginx:1.25-alpine AS production

LABEL maintainer="RUL Prediction Team"
LABEL version="1.0.0"
LABEL description="React dashboard for RUL prediction system"

# Install curl for health checks
RUN apk add --no-cache curl

# Remove default nginx configuration
RUN rm -rf /etc/nginx/conf.d/*

# Copy custom nginx configuration
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder
COPY --from=builder /app/build /usr/share/nginx/html

# Create nginx user for security
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chmod -R 755 /usr/share/nginx/html

# Create directories for nginx runtime
RUN mkdir -p /var/run/nginx && \
    chown -R nginx:nginx /var/run/nginx

# Create custom error pages
RUN echo '<!DOCTYPE html><html><head><title>404</title></head><body><h1>404 Not Found</h1></body></html>' > /usr/share/nginx/html/404.html && \
    echo '<!DOCTYPE html><html><head><title>50x</title></head><body><h1>Server Error</h1></body></html>' > /usr/share/nginx/html/50x.html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Use nginx user (non-root)
USER nginx

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
