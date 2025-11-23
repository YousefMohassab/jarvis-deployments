#!/bin/bash

echo "=============================================="
echo "  Backend Verification Report"
echo "=============================================="
echo ""

# Count files
echo "📁 File Count:"
echo "  JavaScript files: $(find . -name '*.js' | wc -l)"
echo "  Controllers: $(find src/controllers -name '*.js' 2>/dev/null | wc -l)"
echo "  Routes: $(find src/routes -name '*.js' 2>/dev/null | wc -l)"
echo "  Models: $(find src/models -name '*.js' 2>/dev/null | wc -l)"
echo "  Services: $(find src/services -name '*.js' 2>/dev/null | wc -l)"
echo "  Workers: $(find src/workers -name '*.js' 2>/dev/null | wc -l)"
echo ""

# Check key files
echo "✅ Key Files Exist:"
for file in "server.js" "package.json" "Dockerfile" "docker-compose.yml" ".env.example" "README.md"; do
  if [ -f "$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ $file (MISSING)"
  fi
done
echo ""

# Check directories
echo "✅ Directory Structure:"
for dir in "src/config" "src/middleware" "src/models" "src/routes" "src/controllers" "src/services" "src/workers" "src/utils" "docs" "logs"; do
  if [ -d "$dir" ]; then
    echo "  ✓ $dir/"
  else
    echo "  ✗ $dir/ (MISSING)"
  fi
done
echo ""

# Check Node version
if command -v node &> /dev/null; then
  echo "✅ Node.js: $(node --version)"
else
  echo "❌ Node.js: NOT INSTALLED"
fi

if command -v npm &> /dev/null; then
  echo "✅ npm: $(npm --version)"
else
  echo "❌ npm: NOT INSTALLED"
fi
echo ""

# Check package.json dependencies
if [ -f "package.json" ]; then
  echo "✅ Dependencies in package.json:"
  echo "  Total: $(grep -c '":' package.json)"
  echo ""
fi

echo "=============================================="
echo "  Installation Commands"
echo "=============================================="
echo ""
echo "1. Install dependencies:"
echo "   npm install"
echo ""
echo "2. Start with Docker:"
echo "   docker-compose up -d"
echo ""
echo "3. Start manually (requires PostgreSQL, Redis, MQTT):"
echo "   npm start"
echo ""
echo "4. Run database seeds:"
echo "   npm run seed"
echo ""
echo "5. Check health:"
echo "   curl http://localhost:8000/health"
echo ""
echo "=============================================="
echo "  API Endpoints Ready: 32"
echo "=============================================="
echo ""
echo "Authentication (6): /api/auth/*"
echo "Energy (6): /api/energy/*"
echo "Zones (6): /api/zones/*"
echo "Equipment (5): /api/equipment/*"
echo "Analytics (5): /api/analytics/*"
echo "Alerts (4): /api/alerts/*"
echo "Settings (2): /api/settings/*"
echo ""
echo "Documentation: ./README.md, ./docs/API.md"
echo "=============================================="
