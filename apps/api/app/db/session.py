import logging
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import settings, ROOT_DIR

logger = logging.getLogger("kasauti.db")

class Base(DeclarativeBase):
    pass

sqlite_url = f"sqlite+aiosqlite:///{ROOT_DIR / 'kasauti.db'}"

try:
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        future=True
    )
except Exception as e:
    logger.warning(f"Failed to create async engine with {settings.DATABASE_URL}: {e}. Falling back to SQLite.")
    engine = create_async_engine(sqlite_url, echo=False, future=True)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def init_db():
    global engine, AsyncSessionLocal
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Primary database engine initialized successfully.")
    except Exception as e:
        logger.warning(f"Primary database connection failed ({e}). Falling back to local SQLite engine.")
        engine = create_async_engine(sqlite_url, echo=False, future=True)
        AsyncSessionLocal = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False
        )
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("SQLite fallback engine initialized successfully.")
        except Exception as sqle:
            logger.error(f"Fallback SQLite init failed: {sqle}")

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
