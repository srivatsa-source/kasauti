-- Kasauti Production Supabase PostgreSQL Schema
-- Migration: 0001_kasauti_schema.sql
-- Enables UUID extension and establishes tables for benchmark runs,
-- sentinel telemetry, fuzzer logs, acoustic benchmarks, hallmark certificates,
-- and contributor training datasets.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Voice Agent Targets
CREATE TABLE IF NOT EXISTS targets (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    bolna_agent_id VARCHAR(100),
    phone_number VARCHAR(50) NOT NULL,
    staging_agent_id VARCHAR(100),
    languages JSONB DEFAULT '["Hindi", "English"]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Benchmark Runs
CREATE TABLE IF NOT EXISTS benchmark_runs (
    id VARCHAR(36) PRIMARY KEY,
    target_id VARCHAR(36) NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
    bolna_execution_id VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'queued',
    purity_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    audio_storage_url TEXT,
    bolna_transcript_jsonb JSONB DEFAULT '[]'::jsonb,
    sarvam_transcript_jsonb JSONB DEFAULT '[]'::jsonb,
    trai_compliance_jsonb JSONB DEFAULT '{}'::jsonb,
    ast_prompt_diff TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_benchmark_runs_target_id ON benchmark_runs(target_id);
CREATE INDEX IF NOT EXISTS idx_benchmark_runs_execution_id ON benchmark_runs(bolna_execution_id);
CREATE INDEX IF NOT EXISTS idx_benchmark_runs_created_at ON benchmark_runs(created_at DESC);

-- 3. Kasauti Sentinel Telemetry (Real-time in-call guardrail interceptor logs)
CREATE TABLE IF NOT EXISTS sentinel_telemetry (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    run_id VARCHAR(36) REFERENCES benchmark_runs(id) ON DELETE SET NULL,
    utterance TEXT NOT NULL,
    intercept_latency_ms DOUBLE PRECISION NOT NULL,
    rule_triggered TEXT,
    action_taken VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sentinel_telemetry_run_id ON sentinel_telemetry(run_id);
CREATE INDEX IF NOT EXISTS idx_sentinel_telemetry_timestamp ON sentinel_telemetry(timestamp DESC);

-- 4. Agentic Tool Fuzzer Logs
CREATE TABLE IF NOT EXISTS fuzzer_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    run_id VARCHAR(36) REFERENCES benchmark_runs(id) ON DELETE SET NULL,
    attack_vector TEXT NOT NULL,
    payload TEXT NOT NULL,
    agent_response TEXT,
    tool_called_flag BOOLEAN NOT NULL DEFAULT FALSE,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fuzzer_logs_run_id ON fuzzer_logs(run_id);
CREATE INDEX IF NOT EXISTS idx_fuzzer_logs_passed ON fuzzer_logs(passed);

-- 5. Acoustic & Soundscape Benchmarks
CREATE TABLE IF NOT EXISTS acoustic_benchmarks (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    run_id VARCHAR(36) REFERENCES benchmark_runs(id) ON DELETE SET NULL,
    soundscape_profile VARCHAR(100) NOT NULL,
    snr_db DOUBLE PRECISION NOT NULL,
    baseline_wer DOUBLE PRECISION NOT NULL,
    degraded_wer DOUBLE PRECISION NOT NULL,
    audio_artifact_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_acoustic_benchmarks_run_id ON acoustic_benchmarks(run_id);
CREATE INDEX IF NOT EXISTS idx_acoustic_benchmarks_profile ON acoustic_benchmarks(soundscape_profile);

-- 6. Kasauti Hallmark Certification Registry
CREATE TABLE IF NOT EXISTS hallmark_certificates (
    cert_id VARCHAR(100) PRIMARY KEY,
    run_id VARCHAR(36) NOT NULL REFERENCES benchmark_runs(id) ON DELETE CASCADE,
    target_id VARCHAR(36) NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
    purity_score DOUBLE PRECISION NOT NULL,
    sha256_signature VARCHAR(128) NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hallmark_certificates_target_id ON hallmark_certificates(target_id);

-- 7. Contributor Audio Training Datasets
CREATE TABLE IF NOT EXISTS training_datasets (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    contributor_github VARCHAR(100) NOT NULL,
    dialect VARCHAR(50) NOT NULL,
    scenario_type VARCHAR(100) NOT NULL,
    audio_url TEXT NOT NULL,
    ground_truth_jsonb JSONB NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL UNIQUE,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_datasets_dialect ON training_datasets(dialect);
CREATE INDEX IF NOT EXISTS idx_training_datasets_sha256 ON training_datasets(sha256_hash);

-- Storage bucket note:
-- Bucket 'kasauti-audio-artifacts' must be created in Supabase Storage with public read access
-- Subpaths:
--   /recordings/   -> Raw Bolna telephony call audio (.mp3 / .wav)
--   /acoustic/     -> Acoustic stress-tested degraded audio buffers (.wav)
--   /training/     -> Contributor speech training datasets

