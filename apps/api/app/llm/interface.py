from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class RubricItem(BaseModel):
    score: float = Field(ge=0.0, le=5.0, description="Score from 0.0 to 5.0")
    evidence: str = Field(description="Exact quote or transcript evidence")
    explanation: str = Field(description="Reasoning behind this score")

class RubricEvaluation(BaseModel):
    task_completion: RubricItem
    language_handling: RubricItem
    hallucination: RubricItem
    tone: RubricItem

    @property
    def average_score(self) -> float:
        return (
            self.task_completion.score +
            self.language_handling.score +
            self.hallucination.score +
            self.tone.score
        ) / 4.0

class PromptFixProposal(BaseModel):
    prompt_before: str
    prompt_after: str
    diff: str
    rationale_per_change: List[str] = Field(default_factory=list)

class LLMClient(ABC):
    @abstractmethod
    async def evaluate_transcript(
        self,
        transcript: str,
        scenario_goal: str,
        expected_outcome: str,
        language: str
    ) -> RubricEvaluation:
        """Score transcript across 4 rubric dimensions with quotes and explanation."""
        pass

    @abstractmethod
    async def propose_prompt_fix(
        self,
        current_prompt: str,
        failed_checks: List[Dict[str, Any]],
        failed_transcripts: List[str]
    ) -> PromptFixProposal:
        """Propose minimal prompt patch with reasons for each change."""
        pass
