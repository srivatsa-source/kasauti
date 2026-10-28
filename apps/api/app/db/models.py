import uuid
from datetime import datetime, timezone
from typing import List, Optional, Any
from sqlalchemy import String, Text, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Target(Base):
    __tablename__ = "targets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(50), nullable=False)
    bolna_agent_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    staging_agent_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    languages: Mapped[List[str]] = mapped_column(JSON, default=lambda: ["Hindi", "English"])
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    runs: Mapped[List["Run"]] = relationship("Run", back_populates="target", cascade="all, delete-orphan")


class Scenario(Base):
    __tablename__ = "scenarios"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    language: Mapped[str] = mapped_column(String(50), nullable=False)
    persona: Mapped[str] = mapped_column(Text, nullable=False)
    goal: Mapped[str] = mapped_column(Text, nullable=False)
    behavior_flags: Mapped[List[str]] = mapped_column(JSON, default=list)
    expected_outcome: Mapped[str] = mapped_column(Text, nullable=False)
    rule_ids: Mapped[List[str]] = mapped_column(JSON, default=list)

    calls: Mapped[List["Call"]] = relationship("Call", back_populates="scenario")


class Run(Base):
    __tablename__ = "runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    target_id: Mapped[str] = mapped_column(String(36), ForeignKey("targets.id"), nullable=False)
    suite_name: Mapped[str] = mapped_column(String(100), default="standard_trai_pack")
    status: Mapped[str] = mapped_column(String(50), default="queued") # queued, in_progress, completed, failed
    purity_score: Mapped[float] = mapped_column(Float, default=0.0) # pass percentage 0.0 - 100.0
    total_calls: Mapped[int] = mapped_column(default=0)
    passed_calls: Mapped[int] = mapped_column(default=0)
    failed_calls: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    target: Mapped["Target"] = relationship("Target", back_populates="runs")
    calls: Mapped[List["Call"]] = relationship("Call", back_populates="run", cascade="all, delete-orphan")
    fixes: Mapped[List["Fix"]] = relationship("Fix", back_populates="run", foreign_keys="Fix.run_id", cascade="all, delete-orphan")


class Call(Base):
    __tablename__ = "calls"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    run_id: Mapped[str] = mapped_column(String(36), ForeignKey("runs.id"), nullable=False)
    scenario_id: Mapped[str] = mapped_column(String(100), ForeignKey("scenarios.id"), nullable=False)
    bolna_execution_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="queued") # queued, initiated, ringing, in-progress, completed, failed
    transcript: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recording_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    cost: Mapped[float] = mapped_column(Float, default=0.0)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    run: Mapped["Run"] = relationship("Run", back_populates="calls")
    scenario: Mapped["Scenario"] = relationship("Scenario", back_populates="calls")
    checks: Mapped[List["Check"]] = relationship("Check", back_populates="call", cascade="all, delete-orphan")


class Check(Base):
    __tablename__ = "checks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    call_id: Mapped[str] = mapped_column(String(36), ForeignKey("calls.id"), nullable=False)
    kind: Mapped[str] = mapped_column(String(20), nullable=False) # rule or rubric
    rule_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    passed: Mapped[bool] = mapped_column(Boolean, default=False)
    score: Mapped[float] = mapped_column(Float, default=0.0) # 0-5 for rubric, 0 or 1 for rule
    evidence: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    call: Mapped["Call"] = relationship("Call", back_populates="checks")


class Fix(Base):
    __tablename__ = "fixes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    run_id: Mapped[str] = mapped_column(String(36), ForeignKey("runs.id"), nullable=False)
    prompt_before: Mapped[str] = mapped_column(Text, nullable=False)
    prompt_after: Mapped[str] = mapped_column(Text, nullable=False)
    diff: Mapped[str] = mapped_column(Text, nullable=False)
    rerun_run_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("runs.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    run: Mapped["Run"] = relationship("Run", back_populates="fixes", foreign_keys=[run_id])
    rerun_run: Mapped[Optional["Run"]] = relationship("Run", foreign_keys=[rerun_run_id])


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    task_type: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. execute_run, evaluate_call
    payload: Mapped[Any] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(30), default="pending") # pending, processing, completed, failed
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
