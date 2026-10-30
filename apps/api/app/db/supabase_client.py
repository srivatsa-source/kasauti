import io
import os
import time
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import httpx
from app.config import settings, ROOT_DIR

logger = logging.getLogger("kasauti.supabase")

# Optional Supabase SDK import
try:
    from supabase import create_client, Client
    _SUPABASE_AVAILABLE = True
except ImportError:
    Client = Any
    _SUPABASE_AVAILABLE = False

class SupabaseService:
    """
    Supabase PostgreSQL & Object Storage Service.
    Handles data persistence across targets, benchmark_runs, sentinel_telemetry,
    fuzzer_logs, acoustic_benchmarks, hallmark_certificates, and training_datasets.
    Provides audio artifact uploads to the 'kasauti-audio-artifacts' storage bucket.
    """
    def __init__(self):
        self._url = settings.SUPABASE_URL
        self._key = settings.SUPABASE_SERVICE_ROLE_KEY
        self._bucket = settings.SUPABASE_BUCKET_NAME or "kasauti-audio-artifacts"
        self._client: Optional[Client] = None
        self._http_client: Optional[httpx.AsyncClient] = None

        if self._url and self._key and _SUPABASE_AVAILABLE:
            try:
                self._client = create_client(self._url, self._key)
                logger.info(f"Supabase client initialized for URL: {self._url}")
            except Exception as e:
                logger.warning(f"Failed to initialize Supabase client: {e}")

    @property
    def is_configured(self) -> bool:
        return bool(self._url and self._key)

    @property
    def client(self) -> Optional[Any]:
        return self._client

    async def get_http_client(self) -> httpx.AsyncClient:
        if self._http_client is None or self._http_client.is_closed:
            self._http_client = httpx.AsyncClient(timeout=30.0)
        return self._http_client

    async def upload_audio_artifact(
        self,
        file_bytes: bytes,
        destination_path: str,
        content_type: str = "audio/wav"
    ) -> str:
        """
        Uploads an audio buffer (.wav/.mp3) to the Supabase Storage bucket 'kasauti-audio-artifacts'.
        Returns the public or accessible URL for the uploaded object.
        """
        destination_path = destination_path.lstrip("/")
        if self.is_configured and self._client is not None:
            try:
                # Use storage-py client
                res = self._client.storage.from_(self._bucket).upload(
                    path=destination_path,
                    file=file_bytes,
                    file_options={"content-type": content_type, "upsert": "true"}
                )
                public_url_resp = self._client.storage.from_(self._bucket).get_public_url(destination_path)
                logger.info(f"Uploaded audio to Supabase Storage: {destination_path}")
                return str(public_url_resp)
            except Exception as e:
                logger.warning(f"Supabase Storage direct upload encountered error ({e}); using direct REST endpoint")
                try:
                    http = await self.get_http_client()
                    upload_url = f"{self._url.rstrip('/')}/storage/v1/object/{self._bucket}/{destination_path}"
                    headers = {
                        "Authorization": f"Bearer {self._key}",
                        "apikey": self._key,
                        "Content-Type": content_type,
                        "x-upsert": "true"
                    }
                    resp = await http.post(upload_url, content=file_bytes, headers=headers)
                    if resp.status_code in (200, 201):
                        return f"{self._url.rstrip('/')}/storage/v1/object/public/{self._bucket}/{destination_path}"
                    else:
                        logger.error(f"Supabase REST storage upload failed: {resp.status_code} - {resp.text}")
                except Exception as rest_err:
                    logger.error(f"Fallback REST upload failed: {rest_err}")

        # Local storage fallback for offline / test environments
        local_dir = ROOT_DIR / "data" / "artifacts" / os.path.dirname(destination_path)
        local_dir.mkdir(parents=True, exist_ok=True)
        local_file = ROOT_DIR / "data" / "artifacts" / destination_path
        local_file.write_bytes(file_bytes)
        return f"/api/artifacts/{destination_path}"

    async def insert_record(self, table: str, record: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Inserts a single row into a Supabase PostgreSQL table.
        """
        if not self.is_configured:
            return None

        try:
            http = await self.get_http_client()
            endpoint = f"{self._url.rstrip('/')}/rest/v1/{table}"
            headers = {
                "Authorization": f"Bearer {self._key}",
                "apikey": self._key,
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            }
            resp = await http.post(endpoint, json=record, headers=headers)
            if resp.status_code in (200, 201):
                data = resp.json()
                return data[0] if isinstance(data, list) and data else record
            else:
                logger.warning(f"Supabase insert into {table} failed: {resp.status_code} {resp.text}")
        except Exception as e:
            logger.warning(f"Error inserting record into Supabase {table}: {e}")
        return None

    async def select_records(
        self,
        table: str,
        select: str = "*",
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 50,
        order: str = "created_at.desc"
    ) -> List[Dict[str, Any]]:
        """
        Queries rows from a Supabase PostgreSQL table via PostgREST API.
        """
        if not self.is_configured:
            return []

        try:
            http = await self.get_http_client()
            endpoint = f"{self._url.rstrip('/')}/rest/v1/{table}"
            params = {"select": select, "limit": str(limit)}
            if order:
                params["order"] = order
            if filters:
                for k, v in filters.items():
                    params[f"{k}"] = f"eq.{v}"

            headers = {
                "Authorization": f"Bearer {self._key}",
                "apikey": self._key,
                "Accept": "application/json"
            }
            resp = await http.get(endpoint, params=params, headers=headers)
            if resp.status_code == 200:
                return resp.json()
            else:
                logger.warning(f"Supabase query {table} failed: {resp.status_code} {resp.text}")
        except Exception as e:
            logger.warning(f"Error querying Supabase {table}: {e}")
        return []

    async def log_sentinel_telemetry(
        self,
        utterance: str,
        intercept_latency_ms: float,
        rule_triggered: Optional[str],
        action_taken: str,
        run_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        record = {
            "run_id": run_id,
            "utterance": utterance,
            "intercept_latency_ms": intercept_latency_ms,
            "rule_triggered": rule_triggered,
            "action_taken": action_taken,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        return await self.insert_record("sentinel_telemetry", record)

    async def log_fuzzer_result(
        self,
        attack_vector: str,
        payload: str,
        agent_response: str,
        tool_called_flag: bool,
        passed: bool,
        run_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        record = {
            "run_id": run_id,
            "attack_vector": attack_vector,
            "payload": payload,
            "agent_response": agent_response,
            "tool_called_flag": tool_called_flag,
            "passed": passed,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        return await self.insert_record("fuzzer_logs", record)

    async def log_acoustic_benchmark(
        self,
        soundscape_profile: str,
        snr_db: float,
        baseline_wer: float,
        degraded_wer: float,
        audio_artifact_url: Optional[str] = None,
        run_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        record = {
            "run_id": run_id,
            "soundscape_profile": soundscape_profile,
            "snr_db": snr_db,
            "baseline_wer": baseline_wer,
            "degraded_wer": degraded_wer,
            "audio_artifact_url": audio_artifact_url,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        return await self.insert_record("acoustic_benchmarks", record)

supabase_service = SupabaseService()

