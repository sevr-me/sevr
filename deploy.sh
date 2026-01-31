#!/bin/bash
set -e

echo "Pulling latest changes..."
git pull

echo "Installing frontend dependencies..."
npm ci

echo "Installing server dependencies..."
cd server && npm ci && cd ..

echo "Building frontend..."
npm run build

echo "Restarting server..."
pm2 restart sevr

echo "Done."
pm2 status sevr
