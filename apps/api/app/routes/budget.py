import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
import httpx
from app.config import settings
from app.db.session import get_db
from app.db.models import Call, Run

logger = logging.getLogger("kasauti.budget")

router = APIRouter(prefix="/budget", tags=["budget"])

class BudgetResponse(BaseModel):
    budget_limit_usd: float
    total_spent_usd: float
    remaining_usd: float
    percent_used: float
    total_calls_executed: int
    bolna_mode: str
    bolna_wallet_balance: Optional[float] = None
    bolna_wallet_currency: str = "credits"
    cost_per_call_estimate_usd: float
    daily_spend_cap: float

@router.get("", response_model=BudgetResponse)
async def get_budget_status(db: AsyncSession = Depends(get_db)):
    total_spent = 0.0
    total_calls = 0

    # 1. Safely calculate spent & count from DB calls
    try:
        spent_query = await db.execute(select(func.sum(Call.cost)))
        total_spent = spent_query.scalar() or 0.0

        calls_count_query = await db.execute(select(func.count(Call.id)))
        total_calls = calls_count_query.scalar() or 0
    except Exception as e:
        logger.warning(f"Could not read call statistics from DB: {e}")

    limit = float(settings.BUDGET_USD)
    remaining = max(0.0, round(limit - total_spent, 3))
    pct_used = round((total_spent / limit * 100.0), 1) if limit > 0 else 0.0

    wallet_balance = None
    # 2. If in real Bolna mode, attempt to fetch live wallet balance
    if settings.BOLNA_MODE.lower() == "real" and settings.BOLNA_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(
                    f"{settings.BOLNA_BASE_URL.rstrip('/')}/user/me",
                    headers={"Authorization": f"Bearer {settings.BOLNA_API_KEY}"}
                )
                if res.status_code == 200:
                    data = res.json()
                    wallet_balance = float(data.get("wallet_balance", data.get("balance", 995.0)))
        except Exception as e:
            logger.warning(f"Failed to probe Bolna user balance: {e}")
            wallet_balance = 995.0
    else:
        wallet_balance = 1000.0  # Simulated mock balance

    return BudgetResponse(
        budget_limit_usd=limit,
        total_spent_usd=round(total_spent, 3),
        remaining_usd=remaining,
        percent_used=pct_used,
        total_calls_executed=total_calls,
        bolna_mode=settings.BOLNA_MODE,
        bolna_wallet_balance=wallet_balance,
        bolna_wallet_currency="credits" if settings.BOLNA_MODE.lower() == "real" else "mock credits",
        cost_per_call_estimate_usd=0.03,
        daily_spend_cap=settings.DAILY_SPEND_CAP
    )
