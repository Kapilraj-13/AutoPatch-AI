import os
import zipfile
import shutil
from pathlib import Path

def create_large_project_zip():
    target_dir = Path("enterprise_analytics_platform")
    if target_dir.exists():
        shutil.rmtree(target_dir)
    target_dir.mkdir(parents=True)
    (target_dir / "data").mkdir()
    (target_dir / "models").mkdir()

    # Program 1: analytics_api.py (SQL Injection)
    (target_dir / "analytics_api.py").write_text('''import sqlite3

def query_student_metrics(department_id, semester, filter_expr):
    """Fetches aggregated student academic performance records"""
    conn = sqlite3.connect("data/analytics.db")
    cursor = conn.cursor()
    # Vulnerability: Dynamic SQL Injection via string concatenation
    query = (
        "SELECT student_id, gpa, attendance FROM student_records "
        "WHERE department_id = '" + department_id + "' "
        "AND semester = '" + semester + "' "
        "AND " + filter_expr
    )
    cursor.execute(query)
    return cursor.fetchall()

def batch_update_records(record_id, status_code):
    """Updates student records status"""
    conn = sqlite3.connect("data/analytics.db")
    cursor = conn.cursor()
    # Vulnerability: Dynamic f-string SQL query execution
    cursor.execute(f"UPDATE student_records SET status = '{status_code}' WHERE id = '{record_id}'")
    conn.commit()
''', encoding="utf-8")

    # Program 2: model_inference.py (Insecure Deserialization & eval)
    (target_dir / "model_inference.py").write_text('''import pickle

def load_cached_session(serialized_blob):
    """Loads user session state from serialized cache"""
    # Vulnerability: Insecure deserialization via pickle.loads
    return pickle.loads(serialized_blob)

def evaluate_custom_scoring_rule(score_expression, record_data):
    """Evaluates custom administrative scoring formula"""
    # Vulnerability: Unsafe dynamic code execution via eval
    return eval(score_expression)

def normalize_features(features):
    mean_val = sum(features) / len(features)
    return [x - mean_val for x in features]
''', encoding="utf-8")

    # Program 3: batch_processor.py (Command Injection)
    (target_dir / "batch_processor.py").write_text('''import os

def export_batch_archives(department, target_archive_name):
    """Archives export records using shell compressor utility"""
    # Vulnerability: Command Injection via os.system
    cmd = f"tar -czf {target_archive_name} ./data/exports/{department}"
    return os.system(cmd)

def run_cleanup_job(directory_to_clean):
    """Cleans up temporary data folders via system command"""
    # Vulnerability: Shell command execution with unfiltered input
    return os.system("rm -rf " + directory_to_clean)
''', encoding="utf-8")

    # Program 4: security_config.py (Hardcoded Secrets)
    (target_dir / "security_config.py").write_text('''# Enterprise Analytics Security & Environment Settings
DATABASE_URI = "sqlite:///data/analytics.db"
API_KEY = "ent_live_983749283749283749281739281"
SECRET_KEY = "enterprise_jwt_signing_token_key_2026_super_secure"
STORAGE_BUCKET_ID = "bkt-campus-analytics-prod-001"
DEBUG = False
''', encoding="utf-8")

    # 5. Generate binary model weights to make total project exactly ~33 MB
    print("Generating binary dataset / neural model weights (32 MB)...")
    model_weights_path = target_dir / "models" / "neural_weights.bin"
    chunk = os.urandom(1024 * 1024)
    with open(model_weights_path, "wb") as f:
        for _ in range(32):
            f.write(chunk)

    # 6. Package into ZIP archive
    zip_name = Path("enterprise_analytics_platform.zip")
    print(f"Compressing into {zip_name}...")
    with zipfile.ZipFile(zip_name, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk(target_dir):
            for file in files:
                p = Path(root) / file
                zf.write(p, p.relative_to(target_dir))

    # 7. Copy to uploads folder
    uploads_dest = Path("uploads") / "enterprise_analytics_platform.zip"
    uploads_dest.parent.mkdir(exist_ok=True)
    shutil.copy(zip_name, uploads_dest)

    # Clean up unzipped working directory
    shutil.rmtree(target_dir)

    size_mb = zip_name.stat().st_size / (1024 * 1024)
    print(f"SUCCESS! Created ZIP archive: {zip_name.resolve()}")
    print(f"Exact File Size: {size_mb:.2f} MB (32-35 MB range)")
    print(f"Available at: {uploads_dest.resolve()}")

if __name__ == "__main__":
    create_large_project_zip()
