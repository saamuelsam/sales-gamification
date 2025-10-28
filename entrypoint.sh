#!/bin/sh
set -e

echo "🚀 Building TypeScript..."
npm run build --prefix backend

echo "🚀 Running database migrations..."
npm run migrate --prefix backend

echo "✅ Migrations completed!"
echo "🚀 Starting server..."
exec npm start --prefix backend
