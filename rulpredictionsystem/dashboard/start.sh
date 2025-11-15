#!/bin/bash

# RUL Prediction Dashboard - Quick Start Script

set -e

echo "======================================="
echo "RUL Prediction Dashboard - Quick Start"
echo "======================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed."
    echo "Please install Node.js v16 or higher from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "Error: Node.js version must be 16 or higher (current: $(node -v))"
    exit 1
fi

echo "✓ Node.js $(node -v) detected"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed."
    exit 1
fi

echo "✓ npm $(npm -v) detected"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "✓ .env file created"
    echo ""
fi

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo "✓ Dependencies installed"
    echo ""
else
    echo "✓ Dependencies already installed"
    echo ""
fi

# Check if backend is running
echo "Checking if backend is running..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✓ Backend is running at http://localhost:8000"
else
    echo "⚠ Warning: Backend is not running at http://localhost:8000"
    echo "  Please start the backend before using the dashboard"
    echo "  Run: cd ../backend && python -m uvicorn main:app --reload"
fi
echo ""

# Start the dashboard
echo "======================================="
echo "Starting dashboard..."
echo "======================================="
echo ""
echo "Dashboard will open at: http://localhost:3000"
echo "Backend API: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start
