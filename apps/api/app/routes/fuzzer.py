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
    run_id: Optional[str] = Field(None, description="Optional benchmark run ID")

@router.post("/execute", response_model=FuzzTestResult)
async def run_fuzz_test(payload: ExecuteFuzzRequest):
    """
    Executes a real-time adversarial turn against staging agent parameters,
    inspecting actual tool-call payloads in the response and logging to fuzzer_logs in Supabase.
    """
    return await fuzzer_instance.execute_adversarial_turn(
        tool_name=payload.tool_name,
        attack_category=payload.attack_category,
        spoken_utterance=payload.spoken_utterance,
        simulated_arguments=payload.simulated_arguments,
        run_id=payload.run_id
    )

@router.get("/summary", response_model=FuzzerSuiteSummary)
async def get_fuzz_summary():
    """Security scorecard of agent tool calling defenses."""
    return fuzzer_instance.get_summary()

@router.get("/results", response_model=List[FuzzTestResult])
async def list_fuzz_results():
    """History of executed tool fuzz tests."""
    return fuzzer_instance.list_results()
