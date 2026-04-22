#!/bin/bash

# Start Backend on Port 8000
echo "Starting Backend..."
cd /app/backend && PYTHONPATH=/app/backend uvicorn app.main:app --host 0.0.0.0 --port 8000 &

# Start Frontend on Port 5173
echo "Starting Frontend..."
cd /app/frontend && npm run dev -- --host 0.0.0.0 --port 5173 &

# Wait for both processes
wait
