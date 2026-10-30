from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.marketplace.engine import (
    marketplace_instance,
    HallmarkCertificate
)

router = APIRouter(prefix="/marketplace", tags=["marketplace"])

class IssueCertRequest(BaseModel):
    agent_name: str
    bolna_agent_id: str
    phone_number: str
    purity_score: float
    dialect_coverage: Optional[List[str]] = None

@router.get("/certificates", response_model=List[HallmarkCertificate])
async def list_certificates():
    """Returns all public verified voice agent Hallmark certificates."""
    return marketplace_instance.list_certificates()

@router.get("/verify/{cert_id}", response_model=HallmarkCertificate)
async def verify_certificate(cert_id: str):
    """Cryptographic public verification endpoint for any Kasauti Hallmark Certificate."""
    cert = marketplace_instance.get_certificate(cert_id)
    if not cert:
        raise HTTPException(status_code=404, detail=f"Certificate {cert_id} not found in Kasauti registry.")
    return cert

@router.post("/issue", response_model=HallmarkCertificate)
async def issue_new_certificate(payload: IssueCertRequest):
    """Issues a new verifiable cryptographic Hallmark certificate for an audited voice agent."""
    return marketplace_instance.issue_certificate(
        agent_name=payload.agent_name,
        bolna_agent_id=payload.bolna_agent_id,
        phone_number=payload.phone_number,
        purity_score=payload.purity_score,
        dialects=payload.dialect_coverage
    )
