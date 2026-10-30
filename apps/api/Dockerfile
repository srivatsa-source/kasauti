# ── Stage 1: Build stage with compiler tools ─────────────────────────
FROM python:3.11-slim as builder

WORKDIR /build

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY apps/api/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir --prefix=/install -r requirements.txt \
    && pip install --no-cache-dir --prefix=/install Levenshtein scipy supabase

# ── Stage 2: Final Minimal Runtime Image (Cloud Run Scale-to-Zero) ─────
FROM python:3.11-slim as runtime

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app \
    PORT=8000

# Install ffmpeg for fast native acoustic transcoding and audio analysis
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

# Copy repository assets required by engine
COPY rules /rules
COPY scenarios /scenarios
COPY fixtures /fixtures
COPY apps/api/app /app/app

EXPOSE 8000

# Google Cloud Run injects $PORT dynamically. Use shell expansion with default 8000.
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --log-level info
