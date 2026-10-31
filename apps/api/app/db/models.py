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
    bolna_api_key: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
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


class BenchmarkRun(Base):
    __tablename__ = "benchmark_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    target_id: Mapped[str] = mapped_column(String(36), ForeignKey("targets.id", ondelete="CASCADE"), nullable=False)
    bolna_execution_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="queued")
    purity_score: Mapped[float] = mapped_column(Float, default=0.0)
    audio_storage_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bolna_transcript_jsonb: Mapped[Any] = mapped_column(JSON, default=list)
    sarvam_transcript_jsonb: Mapped[Any] = mapped_column(JSON, default=list)
    trai_compliance_jsonb: Mapped[Any] = mapped_column(JSON, default=dict)
    ast_prompt_diff: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class SentinelTelemetry(Base):
    __tablename__ = "sentinel_telemetry"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    run_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("benchmark_runs.id", ondelete="SET NULL"), nullable=True)
    utterance: Mapped[str] = mapped_column(Text, nullable=False)
    intercept_latency_ms: Mapped[float] = mapped_column(Float, nullable=False)
    rule_triggered: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    action_taken: Mapped[str] = mapped_column(String(50), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class FuzzerLog(Base):
    __tablename__ = "fuzzer_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    run_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("benchmark_runs.id", ondelete="SET NULL"), nullable=True)
    attack_vector: Mapped[str] = mapped_column(Text, nullable=False)
    payload: Mapped[str] = mapped_column(Text, nullable=False)
    agent_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tool_called_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    passed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class AcousticBenchmark(Base):
    __tablename__ = "acoustic_benchmarks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    run_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("benchmark_runs.id", ondelete="SET NULL"), nullable=True)
    soundscape_profile: Mapped[str] = mapped_column(String(100), nullable=False)
    snr_db: Mapped[float] = mapped_column(Float, nullable=False)
    baseline_wer: Mapped[float] = mapped_column(Float, nullable=False)
    degraded_wer: Mapped[float] = mapped_column(Float, nullable=False)
    audio_artifact_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class HallmarkCertificate(Base):
    __tablename__ = "hallmark_certificates"

    cert_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    run_id: Mapped[str] = mapped_column(String(36), ForeignKey("benchmark_runs.id", ondelete="CASCADE"), nullable=False)
    target_id: Mapped[str] = mapped_column(String(36), ForeignKey("targets.id", ondelete="CASCADE"), nullable=False)
    purity_score: Mapped[float] = mapped_column(Float, nullable=False)
    sha256_signature: Mapped[str] = mapped_column(String(128), nullable=False)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class TrainingDataset(Base):
    __tablename__ = "training_datasets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    contributor_github: Mapped[str] = mapped_column(String(100), nullable=False)
    dialect: Mapped[str] = mapped_column(String(50), nullable=False)
    scenario_type: Mapped[str] = mapped_column(String(100), nullable=False)
    audio_url: Mapped[str] = mapped_column(Text, nullable=False)
    ground_truth_jsonb: Mapped[Any] = mapped_column(JSON, default=dict)
    sha256_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    verified_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
