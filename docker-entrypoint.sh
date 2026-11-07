#!/bin/sh
set -e

echo "==> Pushing schema to database..."
npx prisma db push --skip-generate 2>&1 || echo "    (db push failed or already up to date)"

echo "==> Starting Cekbar..."
exec node server.js
