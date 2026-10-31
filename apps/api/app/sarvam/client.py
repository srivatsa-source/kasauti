import os
import httpx
from typing import Dict, Any, Optional, List
from app.config import settings
from app.sarvam.interface import SarvamClient

class RealSarvamClient(SarvamClient):
    def __init__(self, api_key: str, base_url: str = "https://api.sarvam.ai"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")

    async def translate(
        self,
        input_text: str,
        source_language_code: str = "hi-IN",
        target_language_code: str = "en-IN",
        speaker_gender: str = "Female",
        mode: str = "formal"
    ) -> Dict[str, Any]:
        url = f"{self.base_url}/translate"
        headers = {
            "api-subscription-key": self.api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "input": input_text,
            "source_language_code": source_language_code,
            "target_language_code": target_language_code,
            "speaker_gender": speaker_gender,
            "mode": mode,
            "model": "mayura:v1"
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(url, json=payload, headers=headers)
            res.raise_for_status()
            return res.json()

    async def speech_to_text(
        self,
        audio_url_or_bytes: Any,
        language_code: str = "hi-IN"
    ) -> Dict[str, Any]:
        url = f"{self.base_url}/speech-to-text"
        headers = {
            "api-subscription-key": self.api_key
        }
        if isinstance(audio_url_or_bytes, str) and audio_url_or_bytes.startswith("http"):
            async with httpx.AsyncClient(timeout=20.0) as client:
                audio_res = await client.get(audio_url_or_bytes)
                audio_res.raise_for_status()
                files = {"file": ("audio.wav", audio_res.content, "audio/wav")}
                stt_res = await client.post(
                    url,
                    files=files,
                    data={"language_code": language_code, "model": "saarika:v2"},
                    headers=headers
                )
                stt_res.raise_for_status()
                return stt_res.json()
        elif isinstance(audio_url_or_bytes, bytes):
            files = {"file": ("audio.wav", audio_url_or_bytes, "audio/wav")}
            async with httpx.AsyncClient(timeout=20.0) as client:
                stt_res = await client.post(
                    url,
                    files=files,
                    data={"language_code": language_code, "model": "saarika:v2"},
                    headers=headers
                )
                stt_res.raise_for_status()
                return stt_res.json()
        else:
            return {"transcript": "", "confidence": 0.0}

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str = "sarvam-105b"
    ) -> Dict[str, Any]:
        url = f"{self.base_url}/v1/chat/completions"
        headers = {
            "api-subscription-key": self.api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": 150
        }
        async with httpx.AsyncClient(timeout=25.0) as client:
            res = await client.post(url, json=payload, headers=headers)
            res.raise_for_status()
            return res.json()

    async def list_models(self) -> List[Dict[str, Any]]:
        url = f"{self.base_url}/v1/models"
        headers = {
            "api-subscription-key": self.api_key
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    return data.get("data", [])
        except Exception:
            pass
        return [
            {"id": "sarvam-105b-conversations", "name": "Sarvam 105B Indic Conversational Agent"},
            {"id": "sarvam-105b", "name": "Sarvam 105B Foundation Model"}
        ]

class MockSarvamClient(SarvamClient):
    async def translate(
        self,
        input_text: str,
        source_language_code: str = "hi-IN",
        target_language_code: str = "en-IN",
        speaker_gender: str = "Female",
        mode: str = "formal"
    ) -> Dict[str, Any]:
        text_lower = input_text.lower()
        if "main robot hoon" in text_lower or "ai bot" in text_lower:
            translated = "Namaste, I am an automated AI assistant calling from Bharat FinServe."
        elif "nahi chahiye" in text_lower or "dnd" in text_lower or "band karo" in text_lower:
            translated = "I do not want this loan offer. Please remove my number from your calling list."
        elif "kannada" in text_lower or "kannadadalli" in text_lower:
            translated = "Please speak in Kannada, I cannot understand English or Hindi."
        elif "otp" in text_lower or "pin" in text_lower:
            translated = "Please tell me the 6 digit verification OTP you received on SMS."
        else:
            translated = f"[Sarvam Translated to {target_language_code}]: " + input_text

        return {
            "translated_text": translated,
            "source_language_code": source_language_code,
            "target_language_code": target_language_code,
            "model_version": "mayura:v1"
        }

    async def speech_to_text(
        self,
        audio_url_or_bytes: Any,
        language_code: str = "hi-IN"
    ) -> Dict[str, Any]:
        return {
            "transcript": "नमस्ते, मैं भारत फिनसर्व से एआई असिस्टेंट बोल रहा हूँ। क्या आप 2 मिनट बात कर सकते हैं?",
            "language_code": language_code,
            "confidence": 0.978,
            "words": []
        }

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str = "sarvam-105b"
    ) -> Dict[str, Any]:
        last_user = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
        lower = last_user.lower()
        if "kannada" in lower or "kn" in lower:
            reply = "Haudu, naanu AI assistant. Nimage hege sahayamaadabeku heli."
        elif "dnd" in lower or "call mat karo" in lower or "band karo" in lower:
            reply = "Main maafi chahta hoon. Aapka number Do Not Call list mein daal diya gaya hai."
        elif "ai" in lower or "robot" in lower or "machine" in lower:
            reply = "Haan, main ek AI voice assistant hoon aur main aapki sahayata ke liye yahan hoon."
        elif "otp" in lower or "pin" in lower or "password" in lower:
            reply = "Suraksha niyamon ke anusar hum kabhi bhi aapse OTP ya PIN nahi maangte."
        else:
            reply = "Namaste! Main Sarvam AI conversational model hoon. Aapki kya sahayata kar sakta hoon?"

        return {
            "id": "mock_sarvam_chat",
            "choices": [{"message": {"content": reply, "role": "assistant"}}]
        }

    async def list_models(self) -> List[Dict[str, Any]]:
        return [
            {"id": "sarvam-105b-conversations", "name": "Sarvam 105B Indic Conversational Agent"},
            {"id": "sarvam-105b", "name": "Sarvam 105B Foundation Model"}
        ]

def get_sarvam_client() -> SarvamClient:
    mode = os.getenv('SARVAM_MODE', getattr(settings, 'SARVAM_MODE', 'mock')).lower()
    api_key = os.getenv('SARVAM_API_KEY', getattr(settings, 'SARVAM_API_KEY', None))
    if mode == 'real' and api_key and not api_key.startswith('mock'):
        return RealSarvamClient(api_key=api_key, base_url=settings.SARVAM_BASE_URL)
    return MockSarvamClient()
