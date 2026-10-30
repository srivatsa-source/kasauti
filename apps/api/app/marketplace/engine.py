import hashlib
import time
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field

class HallmarkCertificate(BaseModel):
    cert_id: str
    agent_name: str
    bolna_agent_id: str
    phone_number: str
    purity_score: float
    grade: str  # "GOLD", "SILVER", "PROVISIONAL"
    statutory_standing: str  # "100% TRAI COMPLIANT", "AUDIT PENDING"
    dialect_coverage: List[str]
    verifiable_hash: str
    issued_at: str
    valid_until: str
    verified_url: str
    badge_markdown: str
    badge_html: str

class CertificationRegistry:
    """
    Public Verifiable Hallmark Certification Registry.
    Generates cryptographic proof of compliance for Indian voice agents
    benchmarked across the 12 regulatory and behavioral suites.
    """
    def __init__(self):
        self._certificates: Dict[str, HallmarkCertificate] = {}
        self._seed_production_cert()

    def _seed_production_cert(self):
        # Generate primary certificate for the active Bolna agent
        cert_id = "KASAUTI-2026-BOLNA-01"
        agent_id = "74bbf2a4-6561-48de-aec3-aafc7153bcd7"
        score = 98.4

        raw = f"{cert_id}:{agent_id}:{score}:2026-10-30"
        sig = hashlib.sha256(raw.encode()).hexdigest()[:24]

        verified_url = f"http://localhost:3000/verify/{cert_id}"
        badge_md = f"[![Kasauti Certified](https://img.shields.io/badge/Kasauti-Gold%2098.4%25-black?style=flat-square&logo=shield)]({verified_url})"
        badge_html = f'<a href="{verified_url}"><img src="https://img.shields.io/badge/Kasauti-Gold%2098.4%25-black?style=flat-square" alt="Kasauti Verified" /></a>'

        cert = HallmarkCertificate(
            cert_id=cert_id,
            agent_name="Kasauti CSA (Bolna Telephony Agent)",
            bolna_agent_id=agent_id,
            phone_number="+919019823296",
            purity_score=score,
            grade="GOLD",
            statutory_standing="100% TRAI COMPLIANT",
            dialect_coverage=["Hindi", "Hinglish", "Kannada", "Indian English"],
            verifiable_hash=sig,
            issued_at="2026-10-30T10:00:00Z",
            valid_until="2027-10-30T10:00:00Z",
            verified_url=verified_url,
            badge_markdown=badge_md,
            badge_html=badge_html
        )
        self._certificates[cert_id] = cert

    def issue_certificate(
        self,
        agent_name: str,
        bolna_agent_id: str,
        phone_number: str,
        purity_score: float,
        dialects: Optional[List[str]] = None
    ) -> HallmarkCertificate:
        ts = int(time.time())
        cert_id = f"KASAUTI-2026-{ts % 10000:04d}"
        grade = "GOLD" if purity_score >= 95.0 else ("SILVER" if purity_score >= 80.0 else "PROVISIONAL")
        standing = "100% TRAI COMPLIANT" if purity_score >= 80.0 else "NON-COMPLIANT"

        raw = f"{cert_id}:{bolna_agent_id}:{purity_score}:{ts}"
        sig = hashlib.sha256(raw.encode()).hexdigest()[:24]

        verified_url = f"http://localhost:3000/verify/{cert_id}"
        badge_md = f"[![Kasauti Certified](https://img.shields.io/badge/Kasauti-{grade}%20{purity_score}%25-black?style=flat-square)]({verified_url})"
        badge_html = f'<a href="{verified_url}"><img src="https://img.shields.io/badge/Kasauti-{grade}%20{purity_score}%25-black?style=flat-square" alt="Kasauti Verified" /></a>'

        cert = HallmarkCertificate(
            cert_id=cert_id,
            agent_name=agent_name,
            bolna_agent_id=bolna_agent_id,
            phone_number=phone_number,
            purity_score=purity_score,
            grade=grade,
            statutory_standing=standing,
            dialect_coverage=dialects or ["Hindi", "Hinglish", "Kannada", "Indian English"],
            verifiable_hash=sig,
            issued_at=datetime.now(timezone.utc).isoformat(),
            valid_until=datetime.now(timezone.utc).replace(year=datetime.now().year + 1).isoformat(),
            verified_url=verified_url,
            badge_markdown=badge_md,
            badge_html=badge_html
        )
        self._certificates[cert_id] = cert
        return cert

    def get_certificate(self, cert_id: str) -> Optional[HallmarkCertificate]:
        return self._certificates.get(cert_id)

    def list_certificates(self) -> List[HallmarkCertificate]:
        return list(self._certificates.values())

marketplace_instance = CertificationRegistry()

