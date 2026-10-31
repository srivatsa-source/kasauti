import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Job, Run
from app.db.session import AsyncSessionLocal
from app.engine.orchestrator import RunOrchestrator

logger = logging.getLogger("kasauti.job_worker")

POLL_INTERVAL_SECONDS = 2
STALE_JOB_SECONDS = 300


def _job_payload(job: Job) -> tuple[str, Optional[list[str]]]:
    payload: dict[str, Any] = job.payload or {}
    run_id = payload.get("run_id")
    if not isinstance(run_id, str) or not run_id:
        raise ValueError("Run job payload is missing run_id")

    scenario_ids = payload.get("scenario_ids")
    if scenario_ids is not None and (
        not isinstance(scenario_ids, list)
        or not all(isinstance(item, str) for item in scenario_ids)
    ):
        raise ValueError("Run job payload has invalid scenario_ids")
    return run_id, scenario_ids


async def enqueue_run(
    session: AsyncSession,
    run_id: str,
    scenario_ids: Optional[list[str]] = None,
) -> Job:
    job = Job(
        task_type="execute_run",
        payload={"run_id": run_id, "scenario_ids": scenario_ids},
        status="pending",
    )
    session.add(job)
    return job


async def recover_run_jobs() -> None:
    """Requeue runs left in progress when the API process was restarted."""
    async with AsyncSessionLocal() as session:
        runs_res = await session.execute(
            select(Run).where(Run.status == "in_progress")
        )
        runs = runs_res.scalars().all()
        if not runs:
            return

        jobs_res = await session.execute(
            select(Job).where(
                Job.task_type == "execute_run",
                Job.status.in_(("pending", "processing")),
            )
        )
        active_run_ids = set()
        for job in jobs_res.scalars().all():
            try:
                run_id, _ = _job_payload(job)
                active_run_ids.add(run_id)
                if job.status == "processing":
                    job.status = "pending"
                    job.error = "Requeued after API restart"
            except ValueError:
                job.status = "failed"
                job.error = "Invalid run job payload"

        for run in runs:
            if run.id not in active_run_ids:
                session.add(
                    Job(
                        task_type="execute_run",
                        payload={"run_id": run.id, "scenario_ids": None},
                        status="pending",
                    )
                )
        await session.commit()


async def _claim_next_job() -> Optional[str]:
    async with AsyncSessionLocal() as session:
        stale_before = datetime.now(timezone.utc) - timedelta(
            seconds=STALE_JOB_SECONDS
        )
        stale_res = await session.execute(
            select(Job).where(
                Job.task_type == "execute_run",
                Job.status == "processing",
                Job.updated_at < stale_before,
            )
        )
        for job in stale_res.scalars().all():
            job.status = "pending"
            job.error = "Requeued after worker restart"

        await session.commit()

        job_res = await session.execute(
            select(Job)
            .where(
                Job.task_type == "execute_run",
                Job.status == "pending",
            )
            .order_by(Job.created_at)
            .limit(1)
        )
        job = job_res.scalar_one_or_none()
        if not job:
            return None

        job.status = "processing"
        await session.commit()
        return job.id


async def _execute_job(job_id: str) -> None:
    async with AsyncSessionLocal() as session:
        job_res = await session.execute(select(Job).where(Job.id == job_id))
        job = job_res.scalar_one_or_none()
        if not job:
            logger.error("Run job %s disappeared before execution", job_id)
            return

        try:
            run_id, scenario_ids = _job_payload(job)
            await RunOrchestrator().execute_run(session, run_id, scenario_ids)
            job.status = "completed"
            job.error = None
        except Exception as exc:
            logger.exception("Run job %s failed", job_id)
            job.status = "failed"
            job.error = str(exc)
            payload = job.payload or {}
            run_id = payload.get("run_id")
            if isinstance(run_id, str):
                run_res = await session.execute(select(Run).where(Run.id == run_id))
                run = run_res.scalar_one_or_none()
                if run and run.status == "in_progress":
                    run.status = "failed"
        await session.commit()


async def run_job_worker(stop_event: asyncio.Event) -> None:
    while not stop_event.is_set():
        job_id = await _claim_next_job()
        if job_id:
            await _execute_job(job_id)
            continue
        try:
            await asyncio.wait_for(stop_event.wait(), timeout=POLL_INTERVAL_SECONDS)
        except asyncio.TimeoutError:
            pass
