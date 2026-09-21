# AutoPatch AI — Intelligent Code Error Detection & Automated Repair

> **First Review College Prototype**: An Agentic AI framework for AST-based deterministic vulnerability detection, LLM contextual verification, closed-loop patch generation, multi-stage automated validation, and Git/GitHub integration.

---

## 📌 Architecture & Build Map

```
                             ┌─────────────────────────┐
                             │      AUTOPATCH AI       │
                             │   React + Vite Web UI   │
                             └────────────┬────────────┘
                                          │
                     ┌────────────────────┼────────────────────┐
                     ▼                    ▼                    ▼
             [1] DETECT ERROR     [2] DEBUG & PUSH     [3] VERIFY & PUSH
                     │                    │                    │
                     └────────────────────┼────────────────────┘
                                          ▼
                             ┌─────────────────────────┐
                             │       FASTAPI API       │
                             └────────────┬────────────┘
                                          │
         ┌────────────────────────────────┼────────────────────────────────┐
         │                                │                                │
         ▼                                ▼                                ▼
┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
│ Target Project  │              │ AST Scan Engine │              │ Git / GitHub    │
│ vulnerable.py   │              │ 8 Security Rules│              │ Integration     │
└─────────────────┘              └────────┬────────┘              └─────────────────┘
                                          │
                                          ▼
                                 ┌─────────────────┐
                                 │ Context Builder │
                                 │ Enclosing Scope │
                                 └────────┬────────┘
                                          │
                                          ▼
                                 ┌─────────────────┐
                                 │   LLM Layer     │
                                 │  Qwen / Ollama  │
                                 └────────┬────────┘
                                          │
                                ┌─────────┴─────────┐
                                ▼                   ▼
                        VERIFIER AGENT       REPAIR AGENT
                                │                   │
                                └─────────┬─────────┘
                                          ▼
                                 ┌─────────────────┐
                                 │  Patch Applier  │
                                 │ Backup/Rollback │
                                 └────────┬────────┘
                                          │
                                          ▼
                                 ┌─────────────────┐
                                 │   Validation    │
                                 │ Syntax + pytest │
                                 └────────┬────────┘
                                          │
                                          ▼
                                 ┌─────────────────┐
                                 │ Security Re-scan│
                                 │ AST Verification│
                                 └────────┬────────┘
                                          │
                                ┌─────────┴─────────┐
                                ▼                   ▼
                             PASSED              FAILED
                                │                   │
                                ▼                   ▼
                             GIT PUSH          REPAIR RETRY
```

---

## 🎯 The 3 Core Actions

| # | Action | Detection | LLM Verification | Code Modification | Testing | Git Integration |
|---|--------|-----------|------------------|-------------------|---------|-----------------|
| **1** | **🔍 Detect Error** | ✅ (AST) | ✅ (False Positive Filter) | ❌ (Strictly Read-Only) | ❌ | ❌ |
| **2** | **🛠️ Debug & Push** | ✅ (AST) | ✅ (Contextual Verify) | ✅ (Applies Patch) | ✅ (Syntax + Pytest + Re-scan) | ✅ (Branch & Push) |
| **3** | **✅ Verify & Push**| ✅ (AST) | ✅ (Clean Verification) | ❌ (Only if clean) | ✅ (Pytest) | ✅ (Direct Push) |

---

## 📁 Repository Structure

```
CLG-PROJECT/
├── run_demo.py                      # One-click full-stack prototype runner
├── test_project/
│   ├── vulnerable.py                # Active target (SQLi, Command Injection, eval)
│   ├── vulnerable.original.py       # Backup copy for instant reset during demos
│   └── test_vulnerable.py           # pytest verification suite
│
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI router with the 3 core endpoints
│   │   ├── core/config.py           # Settings and Ollama config
│   │   ├── scanner/
│   │   │   ├── ast_scanner.py       # AST NodeVisitor detecting vulnerabilities
│   │   │   ├── rules.py             # 8 deterministic security rules
│   │   │   └── detector.py          # Directory/file recursive scanner
│   │   ├── context/builder.py       # Structural context extractor
│   │   ├── llm/
│   │   │   ├── ollama_client.py     # Local Ollama client (cached connection)
│   │   │   ├── verifier.py          # Agent 1: False-positive filtration
│   │   │   └── repair_agent.py      # Agent 2: Minimal safe patch generator
│   │   ├── patch/applier.py         # File patcher with atomic rollback
│   │   ├── validation/
│   │   │   ├── syntax.py            # AST & py_compile validator
│   │   │   ├── tests.py             # pytest runner
│   │   │   └── rescan.py            # AST security re-scanner
│   │   └── git/manager.py           # Automated git branch, commit, & push
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── App.tsx                  # Interactive dashboard
    │   ├── components/
    │   │   ├── Header.tsx           # Live status & Reset button
    │   │   ├── ActionCards.tsx      # The 3 user action cards
    │   │   ├── PipelineStepper.tsx  # Closed-loop execution trace
    │   │   ├── FindingsList.tsx     # Vulnerability breakdown & AI reason
    │   │   ├── CodeDiffViewer.tsx   # Before/After side-by-side & diff view
    │   │   └── GitStatusCard.tsx    # Branch, commit hash, & push confirmation
    │   ├── services/api.ts          # API connector
    │   └── types.ts                 # TypeScript data contracts
    ├── package.json
    └── vite.config.ts
```

---

## 🚀 How to Run the Prototype

### Option A: One-Click Runner (Unified Web UI + Backend)
Run from the root directory:
```bash
python run_demo.py
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser!

### Option B: Development Mode (Hot-Reloading Frontend)
1. **Start Backend**:
   ```bash
   python -m uvicorn backend.app.main:app --reload --port 8000
   ```
2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
   Open **[http://localhost:5173](http://localhost:5173)**.

---

## 💡 How to Demonstrate for Your College Review

1. **Step 1 — Show the Target**:
   - Open `test_project/vulnerable.py`.
   - Point out:
     - **Line 8**: SQL Injection (`"SELECT ... WHERE username='" + username ...'`)
     - **Line 19**: Command Injection (`os.system(user_input)`)
     - **Line 23**: Dynamic Code Execution (`eval(code)`)

2. **Step 2 — Click "1. DETECT ERROR"**:
   - The UI displays the AST scanner findings.
   - Shows **F001 (SQL Injection)**, **F002 (Command Injection)**, and **F003 (Dynamic Code Execution)**.
   - Shows the LLM explanation for each finding.
   - Point out that **the file was not touched** (non-invasive analysis mode).

3. **Step 3 — Try "3. VERIFY & PUSH" while vulnerable**:
   - Click **Verify & Push**.
   - Notice the system **rejects the push** with a clear warning: *"Cannot push: 3 unpatched vulnerabilities found! Please use 'Debug & Push' first."*
   - Explains the safety gate preventing insecure commits.

4. **Step 4 — Click "2. DEBUG & PUSH"**:
   - The closed-loop execution pipeline activates:
     1. AST scan detects findings
     2. Context builder extracts scopes
     3. LLM verifies genuine vulnerabilities
     4. Repair agent generates sequential safe patches
     5. Syntax check passes
     6. `pytest` unit test suite passes
     7. Security re-scan runs and verifies **0 vulnerabilities remain**
     8. Git automatically creates a repair branch (`autopatch/repair-...`) and commits changes!
   - View the **Before vs After Code Diff** on screen.

5. **Step 5 — Click "3. VERIFY & PUSH"**:
   - The codebase is now clean.
   - The system validates and confirms: **"Codebase verified clean! AST: Clean. Tests: Passed. Pushed to Git."**

6. **Step 6 — Reset for Next Demo**:
   - Click the red **"Reset Vulnerable Code"** button in the top header.
   - The original vulnerable file is instantly restored so you can demonstrate again seamlessly.
