#!/usr/bin/env python3
"""
Kasauti Contributor Training Data Syncer.
Validates audio SHA-256 hashes against the Supabase training_datasets table,
uploads missing audio files to the 'kasauti-audio-artifacts' storage bucket,
and issues idempotent UPSERTs into PostgreSQL.
"""

import os
import sys
import json
import hashlib
from pathlib import Path
from datetime import datetime, timezone

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add apps/api to path so app modules can be imported
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR / "apps" / "api"))

from app.config import settings
from app.db.supabase_client import supabase_service

def compute_file_sha256(file_path: Path) -> str:
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

async def sync_contributions():
    contrib_dir = ROOT_DIR / "data" / "contributions"
    if not contrib_dir.exists():
        print("[INFO] No data/contributions directory found. Nothing to sync.")
        return

    json_files = list(contrib_dir.glob("*.json"))
    if not json_files:
        print("[INFO] No contributor training datasets found in data/contributions/.")
        return

    print(f"[*] Found {len(json_files)} contributor dataset(s). Preparing Supabase sync...")

    if not supabase_service.is_configured:
        print("[WARN] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured. Running in offline dry-run mode.")

    synced_count = 0

    for jf in json_files:
        try:
            with open(jf, "r", encoding="utf-8") as f:
                data = json.load(f)

            audio_filename = data.get("audio_file")
            audio_path = contrib_dir / audio_filename
            if not audio_path.exists():
                audio_path = ROOT_DIR / audio_filename

            if not audio_path.exists():
                print(f"[SKIP] Audio file not found for {jf.name}: {audio_filename}")
                continue

            # 1. Compute SHA-256 hash of the audio buffer
            audio_bytes = audio_path.read_bytes()
            sha256_hash = compute_file_sha256(audio_path)
            print(f"[*] Processing {jf.name} | Audio SHA-256: {sha256_hash[:16]}...")

            audio_url = f"/data/contributions/{audio_filename}"

            # 2. Upload to Supabase Storage if configured
            if supabase_service.is_configured:
                storage_dest = f"training/{sha256_hash}.wav"
                audio_url = await supabase_service.upload_audio_artifact(
                    file_bytes=audio_bytes,
                    destination_path=storage_dest,
                    content_type="audio/wav"
                )

            # 3. Idempotent UPSERT into training_datasets table
            record = {
                "contributor_github": data.get("contributor_github", "anonymous"),
                "dialect": data.get("dialect", "hi"),
                "scenario_type": data.get("scenario_type", "general"),
                "audio_url": audio_url,
                "ground_truth_jsonb": data.get("ground_truth", {}),
                "sha256_hash": sha256_hash,
                "verified_at": datetime.now(timezone.utc).isoformat()
            }

            if supabase_service.is_configured:
                # Check if hash already exists
                existing = await supabase_service.select_records(
                    "training_datasets",
                    filters={"sha256_hash": sha256_hash}
                )
                if existing:
                    print(f"  ✓ Existing record verified in Supabase: {sha256_hash[:12]}")
                else:
                    await supabase_service.insert_record("training_datasets", record)
                    print(f"  ✓ Idempotently inserted into Supabase training_datasets: {sha256_hash[:12]}")
            else:
                print(f"  ✓ [Dry-run] Validated record: {record['contributor_github']} ({record['dialect']})")

            synced_count += 1

        except Exception as e:
            print(f"[ERROR] Failed syncing {jf.name}: {e}")

    print(f"\n[DONE] Successfully synced {synced_count}/{len(json_files)} contributor dataset(s).")

if __name__ == "__main__":
    import asyncio
    asyncio.run(sync_contributions())
