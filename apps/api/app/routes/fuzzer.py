from typing import List, Optional, Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.fuzzer.engine import (
    fuzzer_instance,
    FuzzTestResult,
    FuzzerSuiteSummary
)

router = APIRouter(prefix="/fuzzer", tags=["fuzzer"])

class ExecuteFuzzRequest(BaseModel):
    tool_name: str = Field(..., description="Target tool name e.g. 'execute_refund'")
    attack_category: str = Field(default="PROMPT_INJECTION", description="PROMPT_INJECTION | SQL_PARAM_POISONING | PRIVILEGE_ESCALATION")
    spoken_utterance: str = Field(..., description="Adversarial spoken prompt")
    simulated_arguments: Optional[Dict[str, Any]] = Field(default_factory=dict)

@router.post("/execute", response_model=FuzzTestResult)
async def run_fuzz_test(payload: ExecuteFuzzRequest):
    """Executes a real-time voice tool fuzzing attack against agent parameter validators."""
    return fuzzer_instance.run_fuzz_attack(
        tool_name=payload.tool_name,
        attack_category=payload.attack_category,
        spoken_utterance=payload.spoken_utterance,
        simulated_arguments=payload.simulated_arguments
    )

@router.get("/summary", response_model=FuzzerSuiteSummary)
async def get_fuzz_summary():
    """Security scorecard of agent tool calling defenses."""
    return fuzzer_instance.get_summary()

@router.get("/results", response_model=List[FuzzTestResult])
async def list_fuzz_results():
    """History of executed tool fuzz tests."""
    return fuzzer_instance.list_results()
