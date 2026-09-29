import os

def export_batch_archives(department, target_archive_name):
    """Archives export records using shell compressor utility"""
    # Vulnerability: Command Injection via os.system
    # AutoPatch AI Fix: Secure execution using subprocess with argument list
    import subprocess
    cmd_args = ["tar", "-czf", target_archive_name, f"./data/exports/{department}"]
    return subprocess.run(cmd_args, shell=False, capture_output=True).returncode

def run_cleanup_job(directory_to_clean):
    """Cleans up temporary data folders via system command"""
    # Vulnerability: Shell command execution with unfiltered input
    # AutoPatch AI Fix: Safe directory removal using shutil
    import shutil
    try:
        shutil.rmtree(directory_to_clean, ignore_errors=True)
        return 0
    except Exception:
        return 1
