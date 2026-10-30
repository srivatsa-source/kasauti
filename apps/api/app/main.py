from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.session import init_db
from app.routes.targets import router as targets_router
from app.routes.runs import router as runs_router
from app.routes.calls import router as calls_router
from app.routes.webhooks import router as webhooks_router
from app.routes.budget import router as budget_router
from app.routes.knowledge import router as knowledge_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    await init_db()

    # Auto-seed default targets if table is empty
    from app.db.session import AsyncSessionLocal
    from app.db.models import Target
    from sqlalchemy import select
    async with AsyncSessionLocal() as session:
        t_res = await session.execute(select(Target))
        existing = t_res.scalars().all()
        if not existing:
            live_agent_id = settings.BOLNA_CALLER_AGENT_ID or settings.BOLNA_STAGING_AGENT_ID or "74bbf2a4-6561-48de-aec3-aafc7153bcd7"
            live_phone = settings.BOLNA_TARGET_PHONE or "+919019823296"
            t_live = Target(
                name="Kasauti CSA (Bolna Telephony Agent)",
                phone_number=live_phone,
                bolna_agent_id=live_agent_id,
                staging_agent_id=settings.BOLNA_STAGING_AGENT_ID or live_agent_id,
                languages=["Hindi", "Hinglish", "Kannada", "Indian English"],
                notes="Primary Bolna outbound customer support voice agent."
            )
            session.add(t_live)
            await session.commit()

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
app.include_router(budget_router)
app.include_router(knowledge_router)

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
