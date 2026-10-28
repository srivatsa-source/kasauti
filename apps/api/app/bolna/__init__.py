from app.config import settings
from app.bolna.interface import BolnaClient
from app.bolna.mock_client import MockBolnaClient
from app.bolna.real_client import RealBolnaClient

_mock_singleton = MockBolnaClient()

def get_bolna_client(confirmed_by_user: bool = False) -> BolnaClient:
    """
    Selects Bolna client based on BOLNA_MODE (mock or real).
    Defaults to MockBolnaClient singleton so mock state persists across requests.
    """
    if settings.BOLNA_MODE.lower() == "real":
        return RealBolnaClient(confirmed_by_user=confirmed_by_user)
    return _mock_singleton
