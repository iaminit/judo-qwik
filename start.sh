#!/bin/sh

echo "--- RUNTIME DEBUG ---"
echo "Current Directory: $(pwd)"
echo "Listing /app directory (all):"
ls -la /app

echo "Checking dist directory..."
if [ -d "/app/dist" ]; then
    echo "dist directory exists."
    if [ -d "/app/dist/media" ]; then
        echo "dist/media directory exists. File count: $(find /app/dist/media -type f | wc -l)"
    else
        echo "ERROR: dist/media NOT found! Creating empty directory..."
        mkdir -p /app/dist/media
    fi
else
    echo "ERROR: dist directory NOT found!"
fi

echo "Checking pb_data..."
if [ -d "/app/pb_data" ]; then
    echo "pb_data directory exists."
    ls -la /app/pb_data
else
    echo "ERROR: pb_data directory NOT found!"
fi

echo "Starting PocketBase..."
./pb-server serve --http=0.0.0.0:8090 &

# Aspetta che PocketBase sia pronto
echo "Waiting for PocketBase to be ready..."
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  if curl -sf http://127.0.0.1:8090/api/health > /dev/null 2>&1; then
    echo "PocketBase is ready!"
    break
  fi
  sleep 1
done

echo "Starting Qwik application on port 8080..."
PORT=8080 node server/entry.express.js
