import os
import zipfile
import shutil
from pathlib import Path

def generate_sample_zip():
    base_dir = Path("sample_student_portal")
    if base_dir.exists():
        shutil.rmtree(base_dir)
    base_dir.mkdir(parents=True)

    # 1. auth.py with SQL Injection
    auth_code = '''import sqlite3

def authenticate_student(student_id, pin):
    """Authenticate student credentials using database lookup"""
    conn = sqlite3.connect("students.db")
    cursor = conn.cursor()
    # Vulnerability: Dynamic SQL string concatenation
    query = "SELECT * FROM students WHERE id = '" + student_id + "' AND pin = '" + pin + "'"
    cursor.execute(query)
    return cursor.fetchone()

def update_email(student_id, new_email):
    """Update student email address"""
    conn = sqlite3.connect("students.db")
    cursor = conn.cursor()
    # Vulnerability: f-string SQL query construction
    sql = f"UPDATE students SET email = '{new_email}' WHERE id = '{student_id}'"
    cursor.execute(sql)
    conn.commit()
'''
    (base_dir / "auth.py").write_text(auth_code, encoding="utf-8")

    # 2. reports.py with Command Injection
    reports_code = '''import os

def export_report_pdf(student_id, output_filename):
    """Generates student grade report PDF using system utility"""
    # Vulnerability: Arbitrary Command Injection via os.system
    command = f"generate_pdf --id {student_id} --out {output_filename}"
    return os.system(command)

def archive_reports(folder_name):
    """Compress older reports into a tar archive"""
    return os.system("tar -czf archive.tar.gz " + folder_name)
'''
    (base_dir / "reports.py").write_text(reports_code, encoding="utf-8")

    # 3. grade_calc.py with Dynamic Execution
    grade_code = '''def evaluate_grade_formula(formula_expression):
    """Dynamically parses and evaluates user-provided custom grading formulas"""
    # Vulnerability: Unsafe dynamic code execution via eval
    return eval(formula_expression)

def calculate_gpa(credits, grade_points):
    """Computes standard GPA calculation safely"""
    if not credits:
        return 0.0
    total = sum(c * p for c, p in zip(credits, grade_points))
    return total / sum(credits)
'''
    (base_dir / "grade_calc.py").write_text(grade_code, encoding="utf-8")

    # 4. config.py with Hardcoded Secrets
    config_code = '''# Application Configuration and Secrets
DATABASE_URL = "sqlite:///students.db"
API_KEY = "sk_live_9948271049283749281"
SECRET_KEY = "super_secret_jwt_signing_key_2026"
DEBUG = True
'''
    (base_dir / "config.py").write_text(config_code, encoding="utf-8")

    # Create ZIP archive in project root
    zip_path = Path("sample_student_portal.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk(base_dir):
            for f in files:
                full_f = Path(root) / f
                arc_name = full_f.relative_to(base_dir)
                zf.write(full_f, arc_name)

    # Also copy to uploads folder for easy access
    uploads_dest = Path("uploads") / "sample_student_portal.zip"
    uploads_dest.parent.mkdir(exist_ok=True)
    shutil.copy(zip_path, uploads_dest)

    # Clean up unzipped folder
    shutil.rmtree(base_dir)

    print(f"Created ZIP archive: {zip_path.resolve()} ({zip_path.stat().st_size} bytes)")
    print(f"Also placed copy in: {uploads_dest.resolve()}")

if __name__ == "__main__":
    generate_sample_zip()
