from app.config import settings
from app.llm.interface import LLMClient
from app.llm.mock_llm import MockLLMClient
from app.llm.anthropic_client import AnthropicLLMClient

def get_llm_client() -> LLMClient:
    """
    Returns Anthropic client if ANTHROPIC_API_KEY is configured in env,
    otherwise returns MockLLMClient for reliable mock/test runs.
    """
    if settings.ANTHROPIC_API_KEY:
        try:
            return AnthropicLLMClient()
        except Exception:
            return MockLLMClient()
    return MockLLMClient()
