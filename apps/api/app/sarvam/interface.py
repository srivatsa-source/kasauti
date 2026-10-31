from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List

class SarvamClient(ABC):
    @abstractmethod
    async def translate(
        self,
        input_text: str,
        source_language_code: str = "hi-IN",
        target_language_code: str = "en-IN",
        speaker_gender: str = "Female",
        mode: str = "formal"
    ) -> Dict[str, Any]:
        """Translate Indic text using Sarvam Translate API."""
        pass

    @abstractmethod
    async def speech_to_text(
        self,
        audio_url_or_bytes: Any,
        language_code: str = "hi-IN"
    ) -> Dict[str, Any]:
        """Transcribe audio using Sarvam Indic STT."""
        pass

    @abstractmethod
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str = "sarvam-105b"
    ) -> Dict[str, Any]:
        """Generate conversational completion using Sarvam Indic LLM."""
        pass

    @abstractmethod
    async def list_models(self) -> List[Dict[str, Any]]:
        """List available Sarvam models."""
        pass
