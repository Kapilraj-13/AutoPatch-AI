import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
TEST_PROJECT_DIR = BASE_DIR / "test_project"
BACKEND_DIR = BASE_DIR / "backend"

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5-coder:7b")

MAX_REPAIR_ATTEMPTS = 3
DEFAULT_SCAN_PATH = str(TEST_PROJECT_DIR)
