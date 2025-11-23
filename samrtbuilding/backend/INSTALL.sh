#!/bin/bash

# Smart Building Energy Management System - Installation Script
# This script sets up the backend API for local development

set -e

echo "======================================================"
echo " Smart Building Energy Management - Backend Setup"
echo "======================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✓ Node.js version: $(node --version)${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm version: $(npm --version)${NC}"
echo ""

# Install dependencies
echo "Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi

echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}⚠ Please edit .env file with your configuration${NC}"
else
    echo -e "${YELLOW}⚠ .env file already exists${NC}"
fi

echo ""

# Create logs directory
if [ ! -d logs ]; then
    mkdir -p logs
    echo -e "${GREEN}✓ Logs directory created${NC}"
fi

# Create mosquitto config directory for MQTT
if [ ! -d mosquitto ]; then
    mkdir -p mosquitto/{config,data,log}
    cat > mosquitto/config/mosquitto.conf << EOF
# Mosquitto MQTT Broker Configuration
listener 1883
allow_anonymous true
persistence true
persistence_location /mosquitto/data/
log_dest file /mosquitto/log/mosquitto.log
log_dest stdout
EOF
    touch mosquitto/data/.gitkeep
    touch mosquitto/log/.gitkeep
    echo -e "${GREEN}✓ MQTT broker configuration created${NC}"
fi

echo ""
echo "======================================================"
echo " Setup Complete!"
echo "======================================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Configure your environment:"
echo "   ${YELLOW}nano .env${NC}"
echo ""
echo "2. Start required services:"
echo ""
echo "   Option A - Using Docker (Recommended):"
echo "   ${GREEN}docker-compose up -d${NC}"
echo ""
echo "   Option B - Manual setup:"
echo "   - Start PostgreSQL (port 5432)"
echo "   - Start Redis (port 6379)"
echo "   - Start MQTT broker (port 1883)"
echo ""
echo "3. Start the backend server:"
echo "   ${GREEN}npm run dev${NC}  (development)"
echo "   ${GREEN}npm start${NC}    (production)"
echo ""
echo "4. Access the API:"
echo "   http://localhost:8000"
echo ""
echo "5. Check health:"
echo "   ${GREEN}curl http://localhost:8000/health${NC}"
echo ""
echo "======================================================"
