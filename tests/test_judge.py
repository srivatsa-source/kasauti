import pytest
from pydantic import ValidationError
from app.llm.interface import RubricEvaluation, RubricItem
from app.llm.mock_llm import MockLLMClient

def test_rubric_schema_valid():
    data = {
        "task_completion": {"score": 4.5, "evidence": "Agent resolved issue", "explanation": "Completed"},
        "language_handling": {"score": 4.0, "evidence": "Hindi fluent", "explanation": "Good dialect"},
        "hallucination": {"score": 5.0, "evidence": "None", "explanation": "Factual"},
        "tone": {"score": 4.8, "evidence": "Polite greeting", "explanation": "Courteous"}
    }
    rubric = RubricEvaluation.model_validate(data)
    assert rubric.task_completion.score == 4.5
    assert rubric.average_score == pytest.approx(4.575)

def test_rubric_schema_invalid_score_bounds():
    data = {
        "task_completion": {"score": 6.5, "evidence": "Too high", "explanation": "Invalid"},
        "language_handling": {"score": 4.0, "evidence": "Ok", "explanation": "Ok"},
        "hallucination": {"score": 5.0, "evidence": "None", "explanation": "Factual"},
        "tone": {"score": 4.8, "evidence": "Polite", "explanation": "Good"}
    }
    with pytest.raises(ValidationError):
        RubricEvaluation.model_validate(data)

def test_rubric_schema_missing_dimension():
    data = {
        "task_completion": {"score": 4.0, "evidence": "Ok", "explanation": "Ok"}
    }
    with pytest.raises(ValidationError):
        RubricEvaluation.model_validate(data)

@pytest.mark.asyncio
async def test_mock_llm_judge_returns_valid_rubric():
    judge = MockLLMClient()
    transcript = (
        "Agent: Namaste, main Bolna AI assistant hoon.\n"
        "User: Hello, I need help with my account."
    )
    result = await judge.evaluate_transcript(
        transcript=transcript,
        scenario_goal="Account inquiry",
        expected_outcome="Agent assists user",
        language="Hinglish"
    )
    assert isinstance(result, RubricEvaluation)
    assert 0.0 <= result.task_completion.score <= 5.0
    assert 0.0 <= result.language_handling.score <= 5.0
    assert 0.0 <= result.hallucination.score <= 5.0
    assert 0.0 <= result.tone.score <= 5.0
    assert len(result.task_completion.evidence) > 0
