#!/bin/sh
set -e

echo "[duenext] applying database migrations..."

attempt=1
max_attempts=30
until npx prisma migrate deploy; do
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "[duenext] database still unreachable after ${max_attempts} attempts, giving up."
    exit 1
  fi
  echo "[duenext] database not ready yet (attempt ${attempt}/${max_attempts}), retrying in 2s..."
  attempt=$((attempt + 1))
  sleep 2
done

echo "[duenext] starting server..."
exec node server.js
