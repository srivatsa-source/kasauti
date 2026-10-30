from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.acoustic.engine import (
    acoustic_instance,
    NoiseProfile,
    AcousticSimulationResult
)

router = APIRouter(prefix="/acoustic", tags=["acoustic"])

class AcousticSimulateRequest(BaseModel):
    profile_id: str = Field(..., description="Noise profile ID e.g. 'profile_railway'")
    sample_transcript: Optional[str] = Field(None, description="Optional audio transcript text")

@router.get("/profiles", response_model=List[NoiseProfile])
async def list_acoustic_profiles():
    """Lists available Indian ambient acoustic stress profiles and telephony codecs."""
    return acoustic_instance.list_profiles()

@router.post("/simulate", response_model=AcousticSimulationResult)
async def simulate_acoustic_stress(payload: AcousticSimulateRequest):
    """Calculates STT Word Error Rate (WER) degradation and acoustic resilience under stress."""
    return acoustic_instance.run_simulation(
        profile_id=payload.profile_id,
        transcript=payload.sample_transcript
    )

