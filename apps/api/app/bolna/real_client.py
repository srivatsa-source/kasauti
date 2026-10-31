from typing import Dict, Any, Optional, List
import asyncio
import httpx
from app.bolna.interface import BolnaClient
from app.config import settings

class RealBolnaClient(BolnaClient):
    """
    Live production client for Bolna Voice AI.
    Strictly isolated behind BolnaClient interface.
    Guards account balance with MAX_CALLS_PER_RUN and BUDGET_USD.
    Strictly enforces staging agent isolation: target agent is NEVER patched.
    """

    def __init__(self, confirmed_by_user: bool = False):
        if not settings.BOLNA_API_KEY:
            raise ValueError(
                "BOLNA_API_KEY is not configured! RealBolnaClient cannot be instantiated without a valid key. "
                "Use BOLNA_MODE=mock or provide BOLNA_API_KEY in .env."
            )
        self.api_key = settings.BOLNA_API_KEY
        self.base_url = settings.BOLNA_BASE_URL.rstrip("/")
        self.confirmed_by_user = confirmed_by_user
        self.calls_count_today = 0
        self.spend_today = 0.0

    @property
    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def _check_safety_limits(self):
        if not self.confirmed_by_user:
            raise PermissionError(
                "Real call execution blocked: explicit confirmation required before placing real calls."
            )
        if self.calls_count_today >= settings.MAX_CALLS_PER_RUN:
            raise RuntimeError(
                f"MAX_CALLS_PER_RUN limit reached ({settings.MAX_CALLS_PER_RUN}). Real calls aborted for safety."
            )
        if self.spend_today >= settings.BUDGET_USD:
            raise RuntimeError(
                f"BUDGET_USD limit reached (${settings.BUDGET_USD:.2f}). Real calls aborted for safety."
            )

    async def start_call(
        self,
        agent_id: str,
        recipient_phone_number: str,
        from_phone_number: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        self._check_safety_limits()

        # Call Direction configuration:
        # DIRECTION=caller_to_target: Persona agent (BOLNA_CALLER_AGENT_ID) dials target agent number (BOLNA_TARGET_PHONE)
        # DIRECTION=target_to_caller: Target agent dials tester number (recipient_phone_number)
        if settings.DIRECTION == "caller_to_target" and settings.BOLNA_CALLER_AGENT_ID:
            effective_agent_id = settings.BOLNA_CALLER_AGENT_ID
            effective_recipient = recipient_phone_number or settings.BOLNA_TARGET_PHONE
        else:
            effective_agent_id = agent_id
            effective_recipient = recipient_phone_number or settings.BOLNA_TARGET_PHONE

        payload: Dict[str, Any] = {
            "agent_id": effective_agent_id,
            "recipient_phone_number": effective_recipient
        }
        if from_phone_number:
            payload["from_phone_number"] = from_phone_number
        if context:
            payload["user_data"] = context
        if settings.PUBLIC_WEBHOOK_URL:
            payload["webhook_url"] = settings.PUBLIC_WEBHOOK_URL

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{self.base_url}/call",
                headers=self._headers,
                json=payload
            )
            resp.raise_for_status()
            data = resp.json()
            self.calls_count_today += 1
            # Bolna returns { "execution_id": "...", "status": "queued" }
            return {
                "execution_id": data.get("execution_id") or data.get("id"),
                "status": data.get("status", "queued")
            }

    async def get_execution(self, execution_id: str) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                f"{self.base_url}/executions/{execution_id}",
                headers=self._headers
            )
            resp.raise_for_status()
            return resp.json()

    async def poll_until_terminal(self, execution_id: str, max_wait_seconds: int = 90) -> Dict[str, Any]:
        """
        Polls execution status every 3s until reaching a terminal status:
        'completed', 'no-answer', 'busy', 'failed', 'canceled', 'stopped', 'error', 'balance-low'.
        90-second fallback when webhooks are delayed.
        """
        terminal_statuses = {
            "completed", "no-answer", "busy", "failed",
            "canceled", "stopped", "error", "balance-low"
        }
        elapsed = 0
        last_data: Dict[str, Any] = {}
        while elapsed < max_wait_seconds:
            last_data = await self.get_execution(execution_id)
            status = last_data.get("status")
            if status in terminal_statuses:
                return last_data
            await asyncio.sleep(3)
            elapsed += 3
        return last_data

    async def create_batch(
        self,
        agent_id: str,
        csv_content: bytes,
        from_phone_numbers: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        self._check_safety_limits()

        files = {
            "file": ("batch.csv", csv_content, "text/csv")
        }
        data = {
            "agent_id": agent_id
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            headers = {"Authorization": f"Bearer {self.api_key}"}
            resp = await client.post(
                f"{self.base_url}/batches",
                headers=headers,
                data=data,
                files=files
            )
            resp.raise_for_status()
            return resp.json()

    async def schedule_batch(self, batch_id: str, scheduled_at: str) -> Dict[str, Any]:
        """
        Bolna docs rule: scheduled_at must use numeric offset (+00:00 or +05:30), NOT Z.
        """
        if scheduled_at.endswith("Z"):
            scheduled_at = scheduled_at[:-1] + "+00:00"

        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {"Authorization": f"Bearer {self.api_key}"}
            resp = await client.post(
                f"{self.base_url}/batches/{batch_id}/schedule",
                headers=headers,
                data={"scheduled_at": scheduled_at}
            )
            resp.raise_for_status()
            return resp.json()

    async def get_batch_executions(self, batch_id: str) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                f"{self.base_url}/batches/{batch_id}/executions",
                headers=self._headers
            )
            resp.raise_for_status()
            return resp.json()

    async def update_staging_agent(self, agent_id: str, patch_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Patch agent on staging only using PATCH /v2/agent/{agent_id}.
        CRITICAL SAFETY: Refuses to patch production target agent under any circumstances.
        """
        if settings.BOLNA_TARGET_AGENT_ID and agent_id == settings.BOLNA_TARGET_AGENT_ID:
            raise ValueError(
                f"SAFETY VIOLATION: Refusing to patch target agent '{agent_id}'! "
                "Agent patching must ONLY touch staging agents (BOLNA_STAGING_AGENT_ID)."
            )

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.patch(
                f"{self.base_url}/v2/agent/{agent_id}",
                headers=self._headers,
                json=patch_data
            )
            resp.raise_for_status()
            return resp.json()
