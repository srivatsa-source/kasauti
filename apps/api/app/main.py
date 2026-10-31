import asyncio
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
from app.routes.telemetry import router as telemetry_router
from app.routes.sentinel import router as sentinel_router
from app.routes.fuzzer import router as fuzzer_router
from app.routes.acoustic import router as acoustic_router
from app.routes.deployer import router as deployer_router
from app.routes.marketplace import router as marketplace_router
from app.engine.job_worker import recover_run_jobs, run_job_worker

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    try:
        await init_db()
    except Exception as e:
        print(f"Warning: init_db failed ({e})")

    # Auto-seed default targets if table is empty
    try:
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
    except Exception as e:
        print(f"Warning: seeding targets encountered: {e}")

    await recover_run_jobs()
    stop_event = asyncio.Event()
    worker_task = asyncio.create_task(run_job_worker(stop_event))
    try:
        yield
    finally:
        stop_event.set()
        await worker_task

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
app.include_router(telemetry_router)
app.include_router(sentinel_router)
app.include_router(fuzzer_router)
app.include_router(acoustic_router)
app.include_router(deployer_router)
app.include_router(marketplace_router)

@app.get("/health")
async def health_check():
    from app.db.supabase_client import supabase_service
    return {
        "status": "healthy",
        "app": "Kasauti",
        "tagline": "Test it like gold before you dial.",
        "bolna_mode": settings.BOLNA_MODE,
        "supabase_configured": supabase_service.is_configured,
        "llm_mode": "anthropic" if settings.ANTHROPIC_API_KEY else "mock"
    }

@app.get("/")
async def root():
    return {
        "message": "Welcome to Kasauti API — Test it like gold before you dial.",
        "docs": "/docs",
        "mode": settings.BOLNA_MODE
    }
