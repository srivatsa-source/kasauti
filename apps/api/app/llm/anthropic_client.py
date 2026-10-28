import json
import difflib
from typing import List, Dict, Any, Optional
from anthropic import AsyncAnthropic
from app.llm.interface import LLMClient, RubricEvaluation, PromptFixProposal
from app.config import settings

RUBRIC_SYSTEM_PROMPT = """You are an expert AI Voice Agent Quality Judge and Indian Telecommunications Compliance Auditor.
Analyze the provided phone call transcript against the scenario goal, expected outcome, and language.

Evaluate these 4 dimensions strictly on a 0.0 to 5.0 scale:
1. task_completion: Did the agent achieve the goal, answer user queries accurately, and follow proper handoff/termination?
2. language_handling: Fluency, dialect handling (Hindi, Hinglish, Kannada, Indian English), turn-taking, and code-switching smoothness.
3. hallucination: Factual consistency, no fabricated data, no fabricated policies or account details.
4. tone: Professionalism, politeness, de-escalation, empathy, and appropriate conversational speed.

Output ONLY a single valid JSON object with this exact structure:
{
  "task_completion": {"score": 4.5, "evidence": "exact quote from transcript", "explanation": "brief reasoning"},
  "language_handling": {"score": 4.0, "evidence": "quote", "explanation": "reasoning"},
  "hallucination": {"score": 5.0, "evidence": "quote", "explanation": "reasoning"},
  "tone": {"score": 4.8, "evidence": "quote", "explanation": "reasoning"}
}
No extra text or markdown formatting before or after the JSON.
"""

FIXER_SYSTEM_PROMPT = """You are an expert Prompt Engineer for Voice AI Agents.
Your job is to examine failed compliance checks and conversational transcripts, then propose a MINIMAL, HIGH-SURGERY prompt patch.
Fix only what broke without bloating the prompt.

Output ONLY a single valid JSON object:
{
  "prompt_after": "the complete updated prompt text",
  "rationale_per_change": ["Reason 1 for change X", "Reason 2 for change Y"]
}
No other text.
"""

class AnthropicLLMClient(LLMClient):
    def __init__(self):
        if not settings.ANTHROPIC_API_KEY:
            raise ValueError("ANTHROPIC_API_KEY is not set.")
        self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = settings.ANTHROPIC_MODEL

    async def evaluate_transcript(
        self,
        transcript: str,
        scenario_goal: str,
        expected_outcome: str,
        language: str
    ) -> RubricEvaluation:
        user_message = (
            f"Scenario Language: {language}\n"
            f"Scenario Goal: {scenario_goal}\n"
            f"Expected Outcome: {expected_outcome}\n\n"
            f"--- Call Transcript ---\n{transcript}\n-----------------------"
        )

        for attempt in range(2):
            try:
                response = await self.client.messages.create(
                    model=self.model,
                    max_tokens=1000,
                    system=RUBRIC_SYSTEM_PROMPT,
                    messages=[{"role": "user", "content": user_message}]
                )
                raw_text = response.content[0].text.strip()
                if "```json" in raw_text:
                    raw_text = raw_text.split("```json")[1].split("```")[0].strip()
                elif "```" in raw_text:
                    raw_text = raw_text.split("```")[1].split("```")[0].strip()

                data = json.loads(raw_text)
                return RubricEvaluation.model_validate(data)
            except Exception as e:
                if attempt == 1:
                    raise RuntimeError(f"Anthropic rubric evaluation failed after 2 attempts: {e}")

        raise RuntimeError("Rubric evaluation failed unexpectedly.")

    async def propose_prompt_fix(
        self,
        current_prompt: str,
        failed_checks: List[Dict[str, Any]],
        failed_transcripts: List[str]
    ) -> PromptFixProposal:
        user_message = (
            f"Current Agent Prompt:\n```\n{current_prompt}\n```\n\n"
            f"Failed Checks Summary:\n{json.dumps(failed_checks, indent=2)}\n\n"
            f"Sample Failed Transcripts (up to 3):\n" + "\n---\n".join(failed_transcripts[:3])
        )

        for attempt in range(2):
            try:
                response = await self.client.messages.create(
                    model=self.model,
                    max_tokens=2000,
                    system=FIXER_SYSTEM_PROMPT,
                    messages=[{"role": "user", "content": user_message}]
                )
                raw_text = response.content[0].text.strip()
                if "```json" in raw_text:
                    raw_text = raw_text.split("```json")[1].split("```")[0].strip()
                elif "```" in raw_text:
                    raw_text = raw_text.split("```")[1].split("```")[0].strip()

                data = json.loads(raw_text)
                prompt_after = data["prompt_after"]
                rationales = data.get("rationale_per_change", [])

                diff_lines = list(difflib.unified_diff(
                    current_prompt.splitlines(keepends=True),
                    prompt_after.splitlines(keepends=True),
                    fromfile="current_prompt",
                    tofile="patched_staging_prompt",
                    lineterm=""
                ))
                diff_str = "".join(diff_lines)

                return PromptFixProposal(
                    prompt_before=current_prompt,
                    prompt_after=prompt_after,
                    diff=diff_str,
                    rationale_per_change=rationales
                )
            except Exception as e:
                if attempt == 1:
                    raise RuntimeError(f"Anthropic prompt fix proposal failed after 2 attempts: {e}")

        raise RuntimeError("Prompt fix proposal failed unexpectedly.")
