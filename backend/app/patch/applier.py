import shutil
from pathlib import Path
from typing import Dict, Any

class PatchApplier:
    def __init__(self):
        self.backups: Dict[str, str] = {}

    def backup_file(self, filepath: str):
        path = Path(filepath)
        if path.exists() and filepath not in self.backups:
            with open(path, "r", encoding="utf-8") as f:
                self.backups[filepath] = f.read()

    def apply(self, filepath: str, new_content: str) -> bool:
        self.backup_file(filepath)
        try:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)
            return True
        except Exception:
            return False

    def rollback(self, filepath: str) -> bool:
        if filepath in self.backups:
            try:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(self.backups[filepath])
                del self.backups[filepath]
                return True
            except Exception:
                return False
        return False

    def rollback_all(self):
        for fp, content in list(self.backups.items()):
            try:
                with open(fp, "w", encoding="utf-8") as f:
                    f.write(content)
            except Exception:
                pass
        self.backups.clear()

    def commit_patches(self):
        """Discards memory backups when patches are accepted."""
        self.backups.clear()
