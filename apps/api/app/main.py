from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.session import init_db
from app.routes.targets import router as targets_router
from app.routes.runs import router as runs_router
from app.routes.calls import router as calls_router
from app.routes.webhooks import router as webhooks_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    await init_db()
    yield

app = FastAPI(
    title="Kasauti API",
    description="Test it like gold before you dial. Testing tool for Indian voice agents.",
    version="0.1.0",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(targets_router)
app.include_router(runs_router)
app.include_router(calls_router)
app.include_router(webhooks_router)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": "Kasauti",
        "tagline": "Test it like gold before you dial.",
        "bolna_mode": settings.BOLNA_MODE,
        "llm_mode": "anthropic" if settings.ANTHROPIC_API_KEY else "mock"
    }

@app.get("/")
async def root():
    return {
        "message": "Welcome to Kasauti API — Test it like gold before you dial.",
        "docs": "/docs",
        "mode": settings.BOLNA_MODE
    }
