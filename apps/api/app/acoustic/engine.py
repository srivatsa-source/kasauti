import math
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field

class NoiseProfile(BaseModel):
    id: str
    name: str
    category: str  # "AMBIENT_NOISE", "TELEPHONY_CODEC", "PACKET_LOSS"
    snr_db: float
    frequency_cutoff_hz: int
    packet_loss_rate: float
    description: str
    audio_sample_url: Optional[str] = None

class AcousticSimulationResult(BaseModel):
    profile_id: str
    profile_name: str
    snr_db: float
    clean_wer_pct: float
    degraded_wer_pct: float
    wer_delta_pct: float
    carrier_codec: str
    sarvam_indic_confidence: float
    resilience_rating: str  # "HIGH", "MODERATE", "DEGRADED"
    recommendation: str
    timestamp: str

class AcousticEngine:
    """
    Acoustic & Ambient Noise Stress Testing Suite.
    Benchmarks how Indian voice agent STT pipelines (Bolna Deepgram & Sarvam Saarika v2)
    withstand Indian ambient noise and narrow-band 2G telephony packet drops.
    """
    def __init__(self):
        self._profiles = [
            NoiseProfile(
                id="profile_railway",
                name="Bandra Suburban Railway Platform",
                category="AMBIENT_NOISE",
                snr_db=3.5,
                frequency_cutoff_hz=4000,
                packet_loss_rate=0.08,
                description="Heavy crowd chatter, loud Hindi train arrival PA announcements, and track rumbling.",
                audio_sample_url="/samples/acoustic/railway_noise.wav"
            ),
            NoiseProfile(
                id="profile_traffic",
                name="Chandni Chowk Traffic Honking",
                category="AMBIENT_NOISE",
                snr_db=-2.0,
                frequency_cutoff_hz=8000,
                packet_loss_rate=0.04,
                description="Aggressive multi-tonal scooter and auto-rickshaw horns peaking at 2.5kHz.",
                audio_sample_url="/samples/acoustic/traffic_noise.wav"
            ),
            NoiseProfile(
                id="profile_2g_codec",
                name="Rural 2G AMR Narrowband Telephony",
                category="TELEPHONY_CODEC",
                snr_db=8.0,
                frequency_cutoff_hz=3400,
                packet_loss_rate=0.18,
                description="Aggressive 8kHz telephony sampling, 18% burst packet drop, and robotic jitter.",
                audio_sample_url="/samples/acoustic/telephony_2g.wav"
            ),
            NoiseProfile(
                id="profile_kitchen",
                name="Domestic Kitchen Pressure Cooker",
                category="AMBIENT_NOISE",
                snr_db=1.0,
                frequency_cutoff_hz=16000,
                packet_loss_rate=0.01,
                description="Sharp intermittent high-pressure steam whistle pulses masking agent speech.",
                audio_sample_url="/samples/acoustic/cooker_whistle.wav"
            )
        ]

    def list_profiles(self) -> List[NoiseProfile]:
        return self._profiles

    def run_simulation(self, profile_id: str, transcript: Optional[str] = None) -> AcousticSimulationResult:
        profile = next((p for p in self._profiles if p.id == profile_id), self._profiles[0])

        # Mathematical WER degradation simulation based on SNR and packet loss
        snr_factor = max(0.0, (15.0 - profile.snr_db) / 20.0)
        loss_factor = profile.packet_loss_rate * 2.5

        clean_wer = 3.8  # 96.2% clean baseline on Sarvam Saarika v2
        degraded_wer = round(clean_wer + (snr_factor * 12.0) + (loss_factor * 15.0), 1)
        wer_delta = round(degraded_wer - clean_wer, 1)

        confidence = round(max(0.55, 0.98 - (degraded_wer / 100.0)), 2)

        if degraded_wer < 10.0:
            rating = "HIGH"
            rec = "Agent voice architecture robust. Sarvam Indic STT phoneme tracking intact."
        elif degraded_wer < 20.0:
            rating = "MODERATE"
            rec = "Deploy dynamic beamforming or prompt agent for clarification ('Kripya thoda zor se boliye')."
        else:
            rating = "DEGRADED"
            rec = "Severe acoustic degradation. Agent should immediately trigger fallback DTMF or SMS confirmation."

        return AcousticSimulationResult(
            profile_id=profile.id,
            profile_name=profile.name,
            snr_db=profile.snr_db,
            clean_wer_pct=clean_wer,
            degraded_wer_pct=degraded_wer,
            wer_delta_pct=wer_delta,
            carrier_codec=f"G.711 / {profile.frequency_cutoff_hz}Hz",
            sarvam_indic_confidence=confidence,
            resilience_rating=rating,
            recommendation=rec,
            timestamp=datetime.now(timezone.utc).isoformat()
        )

acoustic_instance = AcousticEngine()

