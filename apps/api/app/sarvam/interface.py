from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

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

