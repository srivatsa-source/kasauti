import re
import yaml
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from zoneinfo import ZoneInfo
from pydantic import BaseModel, Field
from app.config import settings

class RuleDefinition(BaseModel):
    id: str
    description: str
    check_type: str # transcript_regex, transcript_semantic, timestamp, transcript_absence
    params: Dict[str, Any] = Field(default_factory=dict)
    source_citation: str = "TODO: verify against official TRAI text"
    verified: bool = False

class RuleCheckResult(BaseModel):
    rule_id: str
    passed: bool
    score: float # 1.0 or 0.0
    evidence: str
    verified: bool
    description: str

class RuleEngine:
    def __init__(self, rules_path: Optional[str] = None):
        self.rules_path = rules_path or settings.RULES_PATH
        self.rules: Dict[str, RuleDefinition] = {}
        self.load_rules()

    def load_rules(self):
        p = Path(self.rules_path)
        if not p.exists():
            return
        with open(p, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
            rules_list = data.get("rules", [])
            for r in rules_list:
                rule_obj = RuleDefinition.model_validate(r)
                self.rules[rule_obj.id] = rule_obj

    def get_rule(self, rule_id: str) -> Optional[RuleDefinition]:
        return self.rules.get(rule_id)

    def evaluate_rule(
        self,
        rule_id: str,
        transcript: str,
        call_timestamp: Optional[datetime] = None
    ) -> RuleCheckResult:
        rule = self.rules.get(rule_id)
        if not rule:
            return RuleCheckResult(
                rule_id=rule_id,
                passed=False,
                score=0.0,
                evidence=f"Unknown rule ID: {rule_id}",
                verified=False,
                description="Unknown rule"
            )

        if rule.check_type == "transcript_regex":
            passed, evidence = self._check_transcript_regex(rule, transcript)
        elif rule.check_type == "transcript_absence":
            passed, evidence = self._check_transcript_absence(rule, transcript)
        elif rule.check_type == "timestamp":
            passed, evidence = self._check_timestamp(rule, call_timestamp)
        elif rule.check_type == "transcript_semantic":
            passed, evidence = self._check_transcript_semantic(rule, transcript)
        else:
            passed, evidence = False, f"Unsupported check type: {rule.check_type}"

        return RuleCheckResult(
            rule_id=rule.id,
            passed=passed,
            score=1.0 if passed else 0.0,
            evidence=evidence,
            verified=rule.verified,
            description=rule.description.strip()
        )

    def _parse_dialogue_turns(self, transcript: str) -> List[Tuple[str, str]]:
        """Parses lines of format 'Agent: ...' or 'User: ...'"""
        turns = []
        for line in transcript.strip().split("\n"):
            line = line.strip()
            if not line:
                continue
            if line.lower().startswith("agent:"):
                turns.append(("agent", line[6:].strip()))
            elif line.lower().startswith("user:"):
                turns.append(("user", line[5:].strip()))
            else:
                turns.append(("unknown", line))
        return turns

    def _check_transcript_regex(self, rule: RuleDefinition, transcript: str) -> Tuple[bool, str]:
        params = rule.params
        turns = self._parse_dialogue_turns(transcript)
        n_turns = params.get("n_turns", 2)
        patterns = params.get("patterns", [])

        # Check early turns for matching disclosure
        checked_turns = turns[: n_turns * 2] if params.get("search_window") == "first_n_turns" else turns

        for speaker, text in checked_turns:
            if speaker in ("agent", "unknown"):
                for pat in patterns:
                    match = re.search(pat, text)
                    if match:
                        return True, f"Found AI disclosure in turn: '{text}' (matched '{match.group(0)}')"

        return False, f"No AI disclosure detected within the first {n_turns} turns of the conversation."

    def _check_transcript_absence(self, rule: RuleDefinition, transcript: str) -> Tuple[bool, str]:
        params = rule.params
        target_role = params.get("role", "agent")
        forbidden_patterns = params.get("forbidden_patterns", [])
        turns = self._parse_dialogue_turns(transcript)

        for speaker, text in turns:
            if target_role == "all" or speaker == target_role or speaker == "unknown":
                for pat in forbidden_patterns:
                    match = re.search(pat, text)
                    if match:
                        return False, f"Sensitive data leak detected! Spoken by {speaker}: '{text}' (matched '{match.group(0)}')"

        return True, "No sensitive credential leak (OTP, PIN, Aadhaar, PAN) detected in agent dialogue."

    def _check_timestamp(self, rule: RuleDefinition, call_timestamp: Optional[datetime]) -> Tuple[bool, str]:
        params = rule.params
        tz_name = params.get("timezone", "Asia/Kolkata")
        tz = ZoneInfo(tz_name)

        ts = call_timestamp or datetime.now(timezone.utc)
        ts_local = ts.astimezone(tz)

        start_h, start_m = map(int, params.get("allowed_start", "09:00").split(":"))
        end_h, end_m = map(int, params.get("allowed_end", "21:00").split(":"))

        call_time_minutes = ts_local.hour * 60 + ts_local.minute
        start_minutes = start_h * 60 + start_m
        end_minutes = end_h * 60 + end_m

        if start_minutes <= call_time_minutes <= end_minutes:
            return True, f"Call timestamp {ts_local.strftime('%H:%M:%S %Z')} is within permissible window ({params.get('allowed_start')}-{params.get('allowed_end')})."
        else:
            return False, f"Call timestamp {ts_local.strftime('%H:%M:%S %Z')} violates calling hours window ({params.get('allowed_start')}-{params.get('allowed_end')} {tz_name})."

    def _check_transcript_semantic(self, rule: RuleDefinition, transcript: str) -> Tuple[bool, str]:
        params = rule.params

        if rule.id == "optout_honored":
            trigger_patterns = params.get("trigger_patterns", [])
            max_turns = params.get("max_turns_after_trigger", 2)
            turns = self._parse_dialogue_turns(transcript)

            trigger_index = -1
            trigger_quote = ""
            for idx, (speaker, text) in enumerate(turns):
                if speaker in ("user", "unknown"):
                    for pat in trigger_patterns:
                        if re.search(pat, text):
                            trigger_index = idx
                            trigger_quote = text
                            break
                if trigger_index != -1:
                    break

            if trigger_index == -1:
                # User never requested opt-out in this call
                return True, "Caller did not request opt-out; rule is not applicable."

            # Verify turns following trigger
            subsequent_turns = turns[trigger_index + 1 :]
            if len(subsequent_turns) > max_turns:
                return False, f"Opt-out trigger '{trigger_quote}' was ignored; call continued for {len(subsequent_turns)} more turns (limit {max_turns})."

            for speaker, text in subsequent_turns:
                if "listen" in text.lower() or "verification is needed" in text.lower() or "annual fee" in text.lower():
                    return False, f"Opt-out trigger ignored. Agent persisted with pitch: '{text}'"

            return True, f"Opt-out request '{trigger_quote}' was acknowledged and honored within {len(subsequent_turns)} turns."

        if rule.id == "consent_captured":
            consent_indicators = params.get("consent_indicators", [])
            n_turns = params.get("n_turns", 5)
            turns = self._parse_dialogue_turns(transcript)[: n_turns * 2]

            for speaker, text in turns:
                if speaker in ("agent", "unknown"):
                    for pat in consent_indicators:
                        if re.search(pat, text):
                            return True, f"Explicit consent check captured: '{text}'"

            return False, f"Agent did not seek explicit consent within first {n_turns} turns before pitch."

        return True, "Rule criteria satisfied."
