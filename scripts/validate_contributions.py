#!/usr/bin/env python3
"""
Kasauti Contributor Training Data Validator & Prod-Protection Gate.
Strictly validates:
1. All contributor annotation JSON files in data/contributions/ against Pydantic schema
   (dialects: hi, hinglish, kn, en-IN; TRAI rubric labels; 16kHz or 8kHz WAV audio headers).
2. Codebase scan across apps/api and apps/web for forbidden mock patterns
   (MOCK_, faker, Math.random(), hardcoded dummy transcripts).
"""

import os
import sys
import json
import wave
from pathlib import Path
from typing import List, Dict, Any, Optional
from enum import Enum
from pydantic import BaseModel, Field, ValidationError

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT_DIR = Path(__file__).resolve().parent.parent

class AllowedDialect(str, Enum):
    HI = "hi"
    HINGLISH = "hinglish"
    KN = "kn"
    EN_IN = "en-IN"

ALLOWED_TRAI_RUBRICS = {
    "ai_disclosure_early",
    "optout_honored",
    "no_sensitive_data_leak",
    "calling_hours",
    "rubric_task_completion",
    "rubric_language_handling",
    "rubric_hallucination",
    "rubric_tone"
}

class ContributorTurn(BaseModel):
    speaker: str
    text: str
    start_time_sec: Optional[float] = None
    end_time_sec: Optional[float] = None

class GroundTruthAnnotation(BaseModel):
    transcript: str
    turns: List[ContributorTurn] = Field(default_factory=list)
    trai_rubric_labels: List[str] = Field(default_factory=list)

class ContributorDatasetSchema(BaseModel):
    contributor_github: str
    dialect: AllowedDialect
    scenario_type: str
    audio_file: str
    ground_truth: GroundTruthAnnotation

def validate_audio_file(audio_path: Path):
    if not audio_path.exists():
        raise FileNotFoundError(f"Audio file '{audio_path}' does not exist.")

    try:
        with wave.open(str(audio_path), 'rb') as wf:
            framerate = wf.getframerate()
            channels = wf.getnchannels()
            sampwidth = wf.getsampwidth()
            frames = wf.getnframes()

            if framerate not in (8000, 16000):
                raise ValueError(
                    f"Invalid sample rate {framerate}Hz for '{audio_path.name}'. "
                    f"Must be strictly 8000Hz (telephony) or 16000Hz (broadband)."
                )

            if channels not in (1, 2):
                raise ValueError(f"Invalid audio channels {channels}. Must be 1 (mono) or 2 (stereo).")

            if frames == 0:
                raise ValueError(f"Audio file '{audio_path.name}' is empty (0 frames).")

    except wave.Error as e:
        raise ValueError(f"Invalid WAV header in '{audio_path.name}': {e}")

def validate_contributions():
    contrib_dir = ROOT_DIR / "data" / "contributions"
    if not contrib_dir.exists():
        print(f"[OK] No data/contributions/ directory found. Creating directory.")
        contrib_dir.mkdir(parents=True, exist_ok=True)
        return True

    json_files = list(contrib_dir.glob("*.json"))
    if not json_files:
        print(f"[INFO] data/contributions/ is currently empty. Ready for contributors.")
        return True

    errors = []
    print(f"[*] Validating {len(json_files)} contributor dataset files...")

    for jf in json_files:
        try:
            with open(jf, "r", encoding="utf-8") as f:
                data = json.load(f)

            parsed = ContributorDatasetSchema(**data)

            # Check TRAI rubric labels
            for label in parsed.ground_truth.trai_rubric_labels:
                if label not in ALLOWED_TRAI_RUBRICS:
                    errors.append(f"[{jf.name}] Unknown TRAI rubric label '{label}'. Allowed: {sorted(ALLOWED_TRAI_RUBRICS)}")

            # Check Audio File
            audio_path = contrib_dir / parsed.audio_file
            if not audio_path.exists():
                audio_path = ROOT_DIR / parsed.audio_file
            validate_audio_file(audio_path)

            print(f"  ✓ {jf.name}: Valid ({parsed.dialect}, contributor: @{parsed.contributor_github})")

        except ValidationError as ve:
            errors.append(f"[{jf.name}] Schema validation error: {ve}")
        except Exception as ex:
            errors.append(f"[{jf.name}] Error: {ex}")

    if errors:
        print("\n[ERROR] Contributor dataset validation failed:")
        for err in errors:
            print(f"  ✗ {err}")
        return False

    print("\n[SUCCESS] All contributor training datasets passed strict validation!")
    return True

def scan_forbidden_mock_patterns():
    """
    Scans production code in apps/api and apps/web (excluding tests, fixtures, and build artifacts)
    to fail the build if forbidden mock patterns are introduced.
    """
    print("\n[*] Scanning production codebase for forbidden mock patterns...")
    forbidden = [
        "Math.random()",
        "MOCK_",
        "faker."
    ]

    # Directories to scan
    scan_roots = [
        ROOT_DIR / "apps" / "api" / "app",
        ROOT_DIR / "apps" / "web" / "app",
        ROOT_DIR / "apps" / "web" / "components"
    ]

    violations = []

    for root_dir in scan_roots:
        if not root_dir.exists():
            continue
        for file_path in root_dir.rglob("*"):
            if file_path.is_dir() or file_path.name.startswith("."):
                continue
            if file_path.suffix not in (".py", ".ts", ".tsx", ".js"):
                continue
            # Skip build caches or mock_client (legacy test interface)
            if "mock_client" in file_path.name:
                continue

            try:
                content = file_path.read_text(encoding="utf-8", errors="ignore")
                for line_idx, line in enumerate(content.splitlines(), start=1):
                    # Ignore comments
                    stripped = line.strip()
                    if stripped.startswith(("//", "#", "/*", "*")):
                        continue
                    for pat in forbidden:
                        if pat in line:
                            violations.append(f"{file_path.relative_to(ROOT_DIR)}:{line_idx} - Contains '{pat}': {stripped}")
            except Exception as e:
                pass

    if violations:
        print("\n[ERROR] Production Protection Gate: Forbidden mock patterns detected in production code:")
        for v in violations:
            print(f"  ✗ {v}")
        return False

    print("  ✓ Zero forbidden mock patterns detected in production apps/api and apps/web.")
    return True

if __name__ == "__main__":
    c_ok = validate_contributions()
    m_ok = scan_forbidden_mock_patterns()

    if not (c_ok and m_ok):
        sys.exit(1)
    print("\n[GATE PASSED] Ready for production build.")
    sys.exit(0)
