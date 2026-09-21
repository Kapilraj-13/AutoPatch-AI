import json
import logging
import requests
from typing import Dict, Any, Optional
from ..core.config import OLLAMA_BASE_URL, OLLAMA_MODEL

logger = logging.getLogger(__name__)

class OllamaClient:
    def __init__(self, base_url: str = OLLAMA_BASE_URL, model: str = OLLAMA_MODEL):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self._cached_status = None
        self._last_checked = 0

    def check_connection(self) -> Dict[str, Any]:
        """Check if local Ollama daemon is running and what models are pulled with a 5-second cache."""
        import time
        now = time.time()
        if self._cached_status and (now - self._last_checked < 5.0):
            return self._cached_status

        try:
            resp = requests.get(f"{self.base_url}/api/tags", timeout=1.0)
            if resp.status_code == 200:
                data = resp.json()
                models = [m.get("name") for m in data.get("models", [])]
                has_model = any(self.model in m for m in models)
                status_data = {
                    "connected": True,
                    "models": models,
                    "target_model": self.model,
                    "model_available": has_model,
                    "status": "online"
                }
                self._cached_status = status_data
                self._last_checked = now
                return status_data
        except Exception:
            pass

        status_data = {
            "connected": False,
            "models": [],
            "target_model": self.model,
            "model_available": False,
            "status": "offline (using built-in deterministic AI engine)"
        }
        self._cached_status = status_data
        self._last_checked = now
        return status_data

    def generate_json(self, prompt: str, system_prompt: str = "") -> Optional[Dict[str, Any]]:
        """Sends prompt to Ollama with JSON mode."""
        try:
            payload = {
                "model": self.model,
                "prompt": prompt,
                "system": system_prompt,
                "stream": False,
                "format": "json",
                "options": {
                    "temperature": 0.1,
                    "num_ctx": 4096
                }
            }
            resp = requests.post(f"{self.base_url}/api/generate", json=payload, timeout=60)
            if resp.status_code == 200:
                raw_response = resp.json().get("response", "{}")
                return json.loads(raw_response)
        except Exception as e:
            logger.error(f"Error communicating with Ollama: {e}")
        return None
