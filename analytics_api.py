import sqlite3

def query_student_metrics(department_id, semester, filter_expr):
    """Fetches aggregated student academic performance records"""
    conn = sqlite3.connect("data/analytics.db")
    cursor = conn.cursor()
    # Vulnerability: Dynamic SQL Injection via string concatenation
    # AutoPatch AI Fix: Parameterized query binding
    query = "SELECT student_id, gpa, attendance FROM student_records WHERE department_id = ? AND semester = ?"
    cursor.execute(query, (department_id, semester))
    return cursor.fetchall()

def batch_update_records(record_id, status_code):
    """Updates student records status"""
    conn = sqlite3.connect("data/analytics.db")
    cursor = conn.cursor()
    # Vulnerability: Dynamic f-string SQL query execution
    # AutoPatch AI Fix: Parameterized SQL statement
    cursor.execute("UPDATE student_records SET status = ? WHERE id = ?", (status_code, record_id))
    conn.commit()
