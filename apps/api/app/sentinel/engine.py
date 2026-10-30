import re
import time
import uuid
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from app.db.supabase_client import supabase_service

class SentinelInterceptionResult(BaseModel):
    action: str  # "ALLOW", "INJECT_PREAMBLE", "REPLACE_COMPLIANCE", "TERMINATE_CALL", "SWITCH_LOCALE"
    modified_text: str
    original_text: str
    latency_ms: float
    reason: Optional[str] = None
    breach_prevented: Optional[str] = None
    rule_id: Optional[str] = None
    timestamp: str

class SentinelMetric(BaseModel):
    total_chunks_processed: int
    interceptions_triggered: int
    avg_latency_ms: float
    violations_prevented: Dict[str, int]
    system_status: str

class KasautiSentinel:
    """
    Ultra-low latency (<45ms) in-call streaming interceptor and guardrail proxy.
    Inspects agent and caller utterances in real-time using deterministic TRAI regex
    and keyword firewall before acoustic synthesis.
    Measures true wall-clock execution time with time.perf_counter_ns() and logs
    all telemetry directly to the Supabase sentinel_telemetry table.
    """
    def __init__(self):
        self._history: List[SentinelInterceptionResult] = []
        self._total_processed = 0
        self._total_intercepted = 0
        self._violations_count = {
            "DND_OPT_OUT": 0,
            "SENSITIVE_CREDENTIAL": 0,
            "AI_DISCLOSURE": 0,
            "LOCALE_SWITCH": 0
        }

    async def intercept_chunk(
        self,
        speaker: str,  # "agent" or "user"
        chunk_text: str,
        call_elapsed_seconds: float = 0.0,
        current_language: str = "Hindi",
        run_id: Optional[str] = None
    ) -> SentinelInterceptionResult:
        start_ns = time.perf_counter_ns()
        now_str = datetime.now(timezone.utc).isoformat()
        self._total_processed += 1

        text = chunk_text.strip()
        lower = text.lower()

        res: Optional[SentinelInterceptionResult] = None

        # 1. DND Opt-Out Interceptor (Consumer says 'No' / 'Stop calling')
        if speaker.lower() in ("user", "caller"):
            dnd_triggers = [
                "don't call", "do not call", "stop calling", "remove my number",
                "call mat karo", "mat call karo", "list se hatao", "number hata do",
                "nahi chahiye", "kripya call na karein", "dnd", "not interested",
                "phone mat karna"
            ]
            if any(t in lower for t in dnd_triggers):
                self._total_intercepted += 1
                self._violations_count["DND_OPT_OUT"] += 1
                latency = round((time.perf_counter_ns() - start_ns) / 1_000_000.0, 3)
                res = SentinelInterceptionResult(
                    action="TERMINATE_CALL",
                    modified_text="Ji bilkul, aapka DND request record kar liya gaya hai. Aapko dobara call nahi aayegi. Dhanyavaad.",
                    original_text=text,
                    latency_ms=latency,
                    reason="Consumer expressed explicit opt-out. TRAI mandate requires immediate call termination without cross-selling.",
                    breach_prevented="TRAI Section 5(a) Harassment & Unsolicited Telemarketing",
                    rule_id="trai_optout_honored",
                    timestamp=now_str
                )

            # Code-Switching detector
            elif any(w in lower for w in ["kannada", "kannadalli", "kannada mathadi", "kannada matadi"]):
                self._total_intercepted += 1
                self._violations_count["LOCALE_SWITCH"] += 1
                latency = round((time.perf_counter_ns() - start_ns) / 1_000_000.0, 3)
                res = SentinelInterceptionResult(
                    action="SWITCH_LOCALE",
                    modified_text="Kandithavagi sir, naanu Kannada dalli maathanaaduthene. Hege sahaaya maadali?",
                    original_text=text,
                    latency_ms=latency,
                    reason="Regional dialect preference detected. Instantaneously rerouting audio synthesis to Kannada locale.",
                    breach_prevented="Indic Vernacular Comprehension Breakdown",
                    rule_id="rubric_language_handling",
                    timestamp=now_str
                )

        # 2. Agent Guardrails: Financial Credential Refusal Firewall
        if res is None and speaker.lower() in ("agent", "assistant", "bot"):
            sensitive_triggers = ["otp", "cvv", "atm pin", "netbanking password", "card pin", "security pin"]
            if any(w in lower for w in sensitive_triggers):
                self._total_intercepted += 1
                self._violations_count["SENSITIVE_CREDENTIAL"] += 1
                latency = round((time.perf_counter_ns() - start_ns) / 1_000_000.0, 3)
                res = SentinelInterceptionResult(
                    action="REPLACE_COMPLIANCE",
                    modified_text="Suraksha kaaranon se hum kabhi aapse OTP, CVV ya PIN nahi maangte. Kripya apna gopneeya data kisi se saajha na karein.",
                    original_text=text,
                    latency_ms=latency,
                    reason="Prohibited financial credential solicitation blocked before audio dispatch.",
                    breach_prevented="RBI / TRAI Customer Financial Data Protection Mandate",
                    rule_id="trai_no_sensitive_data_leak",
                    timestamp=now_str
                )

            # 3. AI Bot Disclosure Prepend if call is starting and bot forgot to identify itself
            elif call_elapsed_seconds < 4.0:
                has_ai_intro = bool(re.search(r'\b(ai|artificial intelligence|automated|virtual|bot|assistant|system)\b', lower))
                if not has_ai_intro:
                    self._total_intercepted += 1
                    self._violations_count["AI_DISCLOSURE"] += 1
                    latency = round((time.perf_counter_ns() - start_ns) / 1_000_000.0, 3)
                    res = SentinelInterceptionResult(
                        action="INJECT_PREAMBLE",
                        modified_text=f"Namaste, main ek automated AI voice assistant bol raha hoon. {text}",
                        original_text=text,
                        latency_ms=latency,
                        reason="Opening statement lacked mandatory AI identity disclosure within first 5 seconds.",
                        breach_prevented="TRAI Telecom Commercial Communications Regulations Mandatory Bot Identity",
                        rule_id="trai_ai_disclosure",
                        timestamp=now_str
                    )

        # Safe - Allow Chunk Unaltered
        if res is None:
            latency = round((time.perf_counter_ns() - start_ns) / 1_000_000.0, 3)
            res = SentinelInterceptionResult(
                action="ALLOW",
                modified_text=text,
                original_text=text,
                latency_ms=latency,
                reason="Payload compliant with all active regulatory constraints.",
                timestamp=now_str
            )

        self._history.insert(0, res)
        if len(self._history) > 100:
            self._history.pop()

        # Persist true wall-clock latency telemetry to Supabase
        asyncio.create_task(
            supabase_service.log_sentinel_telemetry(
                utterance=text,
                intercept_latency_ms=res.latency_ms,
                rule_triggered=res.rule_id,
                action_taken=res.action,
                run_id=run_id
            )
        )

        return res

    def get_metrics(self) -> SentinelMetric:
        avg_lat = 0.0
        if self._history:
            avg_lat = round(sum(h.latency_ms for h in self._history) / len(self._history), 3)

        return SentinelMetric(
            total_chunks_processed=self._total_processed,
            interceptions_triggered=self._total_intercepted,
            avg_latency_ms=avg_lat,
            violations_prevented=self._violations_count,
            system_status="ONLINE & ACTIVE [DETERMINISTIC FIREWALL ACTIVE]"
        )

    def get_logs(self, limit: int = 20) -> List[SentinelInterceptionResult]:
        return self._history[:limit]

sentinel_instance = KasautiSentinel()
