# FocusFlow FastAPI backend

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API: http://localhost:8000
Docs: http://localhost:8000/docs
SQLite database: `focusflow.db`
