#!/bin/bash
# setup.sh - Automated setup script for Territory Running App

echo "================================"
echo "Territory Running App - Setup"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js v14+ from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✓ npm found: $(npm --version)"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠ PostgreSQL is not installed"
    echo "Please install PostgreSQL from https://www.postgresql.org/download/"
    echo ""
    echo "After installing PostgreSQL, run:"
    echo "  createdb territory_running_app"
    echo "  psql -d territory_running_app -f config/database.sql"
    echo ""
else
    echo "✓ PostgreSQL found"
fi

# Install npm dependencies
echo ""
echo "Installing npm dependencies..."
npm install

# Check if .env file exists
if [ ! -f .env ]; then
    echo ""
    echo "⚠ .env file not found"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo "⚠ Please edit .env and configure database credentials:"
    echo "  nano .env"
    echo ""
fi

echo ""
echo "✓ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure database:"
echo "   - Edit .env with your PostgreSQL credentials"
echo "   - Create database: createdb territory_running_app"
echo "   - Run schema: psql -d territory_running_app -f config/database.sql"
echo ""
echo "2. Start the server:"
echo "   npm run dev"
echo ""
echo "3. Open in browser:"
echo "   http://localhost:3000"
echo ""
