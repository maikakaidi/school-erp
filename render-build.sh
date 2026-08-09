#!/usr/bin/env bash
set -e

cd backend-csp
npm install
npx prisma generate
npx prisma migrate deploy
cd ../frontend-csp
npm install
npm run build
