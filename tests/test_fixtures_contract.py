import json
from pathlib import Path
from typing import Optional, Dict, Any
import pytest
from pydantic import BaseModel, Field, model_validator
from app.config import settings

class BolnaUsageBreakdown(BaseModel):
    synthesizerCharacters: Optional[int] = None
    synthesizerModel: Optional[str] = None
    transcriberDuration: Optional[float] = None
    transcriberModel: Optional[str] = None
    llmTokens: Optional[int] = None
    llmModel: Optional[Dict[str, Any]] = None

class BolnaTelephonyData(BaseModel):
    provider: Optional[str] = None
    from_number: Optional[str] = None
    to_number: Optional[str] = None
    hangup_cause: Optional[str] = None
    recording_url: Optional[str] = None

class BolnaExecutionContract(BaseModel):
    id: str | int
    status: str
    conversation_duration: Optional[float] = None
    total_cost: Optional[float] = None
    transcript: Optional[str] = None
    recording_url: Optional[str] = None
    extracted_data: Optional[Dict[str, Any]] = None
    telephony_data: Optional[BolnaTelephonyData] = None
    usage_breakdown: Optional[BolnaUsageBreakdown] = None

    @model_validator(mode="before")
    @classmethod
    def extract_recording_url(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("recording_url"):
                tel = data.get("telephony_data")
                if isinstance(tel, dict) and tel.get("recording_url"):
                    data["recording_url"] = tel["recording_url"]
        return data

def test_execution_response_fixture_contract():
    fixture_path = Path(settings.FIXTURES_DIR) / "execution_response.json"
    assert fixture_path.exists(), "fixtures/execution_response.json must exist"

    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    contract = BolnaExecutionContract.model_validate(data)
    assert contract.status == "completed"
    assert contract.transcript is not None
    assert contract.total_cost is not None
    assert contract.conversation_duration is not None

def test_webhook_completed_fixture_contract():
    fixture_path = Path(settings.FIXTURES_DIR) / "webhook_completed.json"
    assert fixture_path.exists(), "fixtures/webhook_completed.json must exist"

    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    contract = BolnaExecutionContract.model_validate(data)
    assert contract.status == "completed"
    assert contract.recording_url is not None
