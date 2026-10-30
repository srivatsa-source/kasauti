import pytest_asyncio

from app.db.session import init_db


@pytest_asyncio.fixture(autouse=True)
async def initialize_database():
    await init_db()
