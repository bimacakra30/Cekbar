#!/bin/sh
set -e

echo "==> Pushing schema to database..."
npx prisma db push --skip-generate 2>&1 || echo "    (db push failed or already up to date)"

if [ "$RUN_SEED" = "true" ]; then
  echo "==> Seeding database..."
  npx tsx prisma/seed.ts 2>&1 || echo "    (seed skipped or already seeded)"
fi

echo "==> Starting Cekbar..."
exec node server.js

