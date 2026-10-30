from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.sentinel.engine import (
    sentinel_instance,
    SentinelInterceptionResult,
    SentinelMetric
)

router = APIRouter(prefix="/sentinel", tags=["sentinel"])

class InterceptRequest(BaseModel):
    speaker: str = Field(..., description="agent or user")
    text: str = Field(..., description="Spoken utterance text chunk")
    call_elapsed_seconds: float = Field(default=0.0, description="Elapsed seconds since call connect")
    language: str = Field(default="Hindi")

@router.post("/intercept", response_model=SentinelInterceptionResult)
async def intercept_utterance(payload: InterceptRequest):
    """
    Sub-50ms streaming guardrail interceptor. Evaluates spoken chunk,
    returning unaltered or patched utterance before acoustic synthesis.
    """
    return sentinel_instance.intercept_chunk(
        speaker=payload.speaker,
        chunk_text=payload.text,
        call_elapsed_seconds=payload.call_elapsed_seconds,
        current_language=payload.language
    )

@router.get("/metrics", response_model=SentinelMetric)
async def get_sentinel_metrics():
    """Live telemetry on latency, packets evaluated, and prevented statutory breaches."""
    return sentinel_instance.get_metrics()

@router.get("/logs", response_model=List[SentinelInterceptionResult])
async def get_sentinel_logs(limit: int = 20):
    """Real-time audit log of prevented violations and modified audio packets."""
    return sentinel_instance.get_logs(limit=limit)
