from typing import List, Dict, Any
from app.llm import get_llm_client
from app.llm.interface import RubricEvaluation

class RubricJudge:
    def __init__(self):
        self.llm_client = get_llm_client()

    async def judge_call(
        self,
        transcript: str,
        goal: str,
        expected_outcome: str,
        language: str
    ) -> List[Dict[str, Any]]:
        """
        Runs LLM judge on transcript, returning 4 structured check items
        for task_completion, language_handling, hallucination, and tone.
        """
        rubric: RubricEvaluation = await self.llm_client.evaluate_transcript(
            transcript=transcript,
            scenario_goal=goal,
            expected_outcome=expected_outcome,
            language=language
        )

        checks = []
        dimensions = [
            ("task_completion", rubric.task_completion),
            ("language_handling", rubric.language_handling),
            ("hallucination", rubric.hallucination),
            ("tone", rubric.tone),
        ]

        for name, item in dimensions:
            # Score threshold: >= 3.5 passes
            passed = item.score >= 3.5
            checks.append({
                "kind": "rubric",
                "rule_id": name,
                "passed": passed,
                "score": float(item.score),
                "evidence": f"{item.evidence} — {item.explanation}"
            })

        return checks
