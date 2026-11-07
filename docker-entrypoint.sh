#!/bin/sh
set -e

echo "==> Pushing schema to database..."
node node_modules/prisma/build/index.js db push --skip-generate 2>&1 || echo "    (db push failed or already up to date)"

echo "==> Starting Cekbar..."
exec node server.js
