#!/bin/sh
set -e

echo "=== Generating Prisma Client ==="
npm run prisma:generate

echo "=== Applying Migrations ==="
npx prisma migrate deploy

echo "=== Seeding Chat Flow Data ==="
node --loader tsx/esm prisma/seed-chat-flow.ts || echo "Seed attempt completed"

echo "=== Starting Dev Server ==="
npm run start:dev
