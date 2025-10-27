#!/bin/sh
set -e

echo "🚀 Building..."
npm run build

echo "🚀 Running database migrations..."
npm run migrate

echo "✅ Migrations completed!"
echo "🚀 Starting server..."
exec npm start
