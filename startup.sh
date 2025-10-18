#!/bin/bash

# Azure Web Apps Startup Script for Next.js
# This script ensures Next.js runs on the correct port assigned by Azure

echo "============================================"
echo "Rush Policy Chat - Azure Web Apps Startup"
echo "============================================"
echo "Starting at: $(date)"
echo ""

# Azure Web Apps assigns a dynamic port via PORT environment variable
# If PORT is not set, default to 3000 for local testing
export PORT="${PORT:-3000}"

echo "Configuration:"
echo "  PORT: $PORT"
echo "  NODE_ENV: ${NODE_ENV:-production}"
echo "  NODE_VERSION: $(node --version)"
echo "  NPM_VERSION: $(npm --version)"
echo ""

# Check if standalone build exists
if [ -d ".next/standalone" ]; then
    echo "✅ Standalone build detected"
    echo "Starting Next.js standalone server..."
    echo ""

    # Start the standalone server
    # The standalone output includes a minimal server.js
    cd .next/standalone
    node server.js
else
    echo "⚠️  Standalone build not found - using standard Next.js server"
    echo "Starting Next.js with npm start..."
    echo ""

    # Fallback to standard Next.js start
    npm start
fi

# If the server exits, log the exit code
EXIT_CODE=$?
echo ""
echo "============================================"
echo "Server stopped with exit code: $EXIT_CODE"
echo "Stopped at: $(date)"
echo "============================================"

exit $EXIT_CODE
