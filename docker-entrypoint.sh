#!/bin/sh
set -e

# Simple retry loop for DB migrations: tries up to 30 times with 2s delay.
if [ -n "$DATABASE_URL" ]; then
  echo "DATABASE_URL found — running migrations (will retry if DB not ready)..."
  n=0
  until npx sequelize-cli db:migrate --env ${NODE_ENV:-production}; do
    n=$((n+1))
    if [ "$n" -ge 30 ]; then
      echo "Migrations failed after $n attempts. Exiting."
      exit 1
    fi
    echo "Migration attempt $n failed — retrying in 2s..."
    sleep 2
  done
else
  echo "DATABASE_URL not set — skipping migrations"
fi

# Start the app (uses "start" script from package.json -> node src/index.js)
exec npm start