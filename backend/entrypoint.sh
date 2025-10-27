#!/bin/sh
set -e

echo "🚀 Running database migrations..."
npx tsx src/database/migrate.ts

echo "✅ Migrations completed!"
echo "🚀 Starting server..."
exec npx tsx watch src/server.ts
