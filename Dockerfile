FROM python:3.11-slim

# Install system dependencies (including Node.js for frontend)
RUN apt-get update && apt-get install -y curl gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && pip install poetry \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Setup Backend
COPY backend/pyproject.toml backend/poetry.lock ./backend/
RUN cd backend && poetry config virtualenvs.create false && poetry install --no-dev

# Setup Frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy all files
COPY . .

# Setup data directory for SQLite
RUN mkdir -p /app/data && chmod +x start.sh

# Environment
ENV DATABASE_URL=sqlite:////app/data/expenses.db
ENV ACCESS_TOKEN_EXPIRE_MINUTES=1440
ENV SECRET_KEY=super_secure_key_123456
ENV PYTHONPATH=/app/backend

# Expose both ports (FE: 5173, BE: 8000)
EXPOSE 5173
EXPOSE 8000

CMD ["./start.sh"]
