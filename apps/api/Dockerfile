FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

COPY apps/api/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY rules /rules
COPY scenarios /scenarios
COPY fixtures /fixtures
COPY apps/api /app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
