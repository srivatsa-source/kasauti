from fastapi import APIRouter, HTTPException
from app.deployer.engine import (
    deployer_instance,
    BolnaDeployRequest,
    BolnaDeployResponse,
    GitPRRequest,
    GitPRResponse
)

router = APIRouter(prefix="/deployer", tags=["deployer"])

@router.post("/bolna-sync", response_model=BolnaDeployResponse)
async def deploy_to_bolna_staging(payload: BolnaDeployRequest):
    """Deploys self-healed compliance patch directly into Bolna Agent Studio staging agent."""
    try:
        return await deployer_instance.deploy_to_bolna_staging(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/git-pr", response_model=GitPRResponse)
async def create_git_pr(payload: GitPRRequest):
    """Formats an autonomous Git branch and GitHub Pull Request with compliance hallmark."""
    try:
        return deployer_instance.generate_git_pr(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

