#!/bin/sh
set -e

echo "🚀 Running migrations..."
npm run migrate

echo "🚀 Starting server..."
exec npm start
