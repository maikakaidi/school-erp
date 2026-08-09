#!/usr/bin/env bash
set -e

cd backend-csp
npm install --include=dev
npx prisma generate
npx prisma migrate deploy
cd ../frontend-csp
npm install --include=dev
npm run build
