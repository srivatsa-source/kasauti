import logging
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import settings, ROOT_DIR

logger = logging.getLogger("kasauti.db")

class Base(DeclarativeBase):
    pass

try:
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        future=True
    )
except Exception as e:
    logger.warning(f"Failed to initialize async engine with {settings.DATABASE_URL}: {e}. Falling back to SQLite.")
    engine = create_async_engine(
        f"sqlite+aiosqlite:///{ROOT_DIR / 'kasauti.db'}",
        echo=False,
        future=True
    )

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        logger.warning(f"Database init_db encountered error: {e}")
