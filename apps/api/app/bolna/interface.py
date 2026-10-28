from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List

class BolnaClient(ABC):
    """
    Abstract interface isolating Bolna API integration.
    Guarantees that the app can run 100% in mock mode without any credentials.
    """

    @abstractmethod
    async def start_call(
        self,
        agent_id: str,
        recipient_phone_number: str,
        from_phone_number: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Start a single call. Returns dict with execution_id and status."""
        pass

    @abstractmethod
    async def get_execution(self, execution_id: str) -> Dict[str, Any]:
        """Get call execution details including status, transcript, cost, recording."""
        pass

    @abstractmethod
    async def create_batch(
        self,
        agent_id: str,
        csv_content: bytes,
        from_phone_numbers: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Upload a CSV batch of recipients. Returns batch_id and state."""
        pass

    @abstractmethod
    async def schedule_batch(self, batch_id: str, scheduled_at: str) -> Dict[str, Any]:
        """Schedule a batch. scheduled_at must use numeric offset (not Z)."""
        pass

    @abstractmethod
    async def get_batch_executions(self, batch_id: str) -> List[Dict[str, Any]]:
        """Get execution results for all calls in a batch (returns bare array)."""
        pass

    @abstractmethod
    async def update_staging_agent(self, agent_id: str, patch_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update an agent prompt/config on STAGING copy only.
        Never touches production targets.
        """
        pass
