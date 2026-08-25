
from datetime import datetime, timedelta, timezone
from pathlib import Path
import csv, io, statistics

from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session

BASE = Path(__file__).resolve().parent
DB_URL = f"sqlite:///{BASE / 'focusflow.db'}"
engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class SessionRow(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    ended_at = Column(DateTime, nullable=True)
    planned_minutes = Column(Integer, default=25)
    actual_minutes = Column(Integer, default=0)
    focus_score = Column(Float, default=100)
    interruptions = Column(Integer, default=0)
    completed = Column(Boolean, default=False)

class EventRow(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, nullable=True)
    app_name = Column(String, nullable=False)
    category = Column(String, default="other")
    occurred_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    distraction_score = Column(Float, default=0)

class ScoreRow(Base):
    __tablename__ = "scores"
    id = Column(Integer, primary_key=True)
    score = Column(Float, nullable=False)
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

Base.metadata.create_all(engine)

app = FastAPI(title="FocusFlow API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SessionIn(BaseModel):
    planned_minutes: int = Field(25, ge=1, le=240)

class SessionUpdate(BaseModel):
    actual_minutes: int = Field(0, ge=0, le=240)
    focus_score: float = Field(100, ge=0, le=100)
    interruptions: int = Field(0, ge=0)
    completed: bool = False

class EventIn(BaseModel):
    session_id: int | None = None
    app_name: str
    category: str = "other"
    distraction_score: float = Field(0, ge=0, le=100)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def now_utc():
    return datetime.now(timezone.utc)

def as_utc(dt):
    if dt is None: return None
    if dt.tzinfo is None: return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

def day_key(dt):
    return as_utc(dt).strftime("%Y-%m-%d")

@app.get("/api/health")
def health():
    return {"ok": True, "service": "FocusFlow API"}

@app.post("/api/session")
def create_session(payload: SessionIn, db: Session = Depends(get_db)):
    row = SessionRow(planned_minutes=payload.planned_minutes)
    db.add(row); db.commit(); db.refresh(row)
    return {"id": row.id, "started_at": as_utc(row.started_at).isoformat(), "planned_minutes": row.planned_minutes}

@app.patch("/api/session/{session_id}")
def finish_session(session_id: int, payload: SessionUpdate, db: Session = Depends(get_db)):
    row = db.get(SessionRow, session_id)
    if not row:
        return {"error": "session_not_found"}
    row.actual_minutes = payload.actual_minutes
    row.focus_score = payload.focus_score
    row.interruptions = payload.interruptions
    row.completed = payload.completed
    if payload.completed:
        row.ended_at = now_utc()
    db.commit()
    return {"ok": True, "session_id": row.id}

@app.post("/api/event")
def log_event(payload: EventIn, db: Session = Depends(get_db)):
    row = EventRow(**payload.model_dump())
    db.add(row)
    db.add(ScoreRow(score=payload.distraction_score))
    if payload.session_id:
        session = db.get(SessionRow, payload.session_id)
        if session:
            session.interruptions += 1
    db.commit(); db.refresh(row)
    return {"id": row.id, "occurred_at": as_utc(row.occurred_at).isoformat(), **payload.model_dump()}

def daily_rows(db):
    start = now_utc() - timedelta(days=6)
    events = db.query(EventRow).filter(EventRow.occurred_at >= start).all()
    sessions = db.query(SessionRow).filter(SessionRow.started_at >= start).all()
    out = []
    for i in range(7):
        d = (start + timedelta(days=i+1)).date()
        ds = d.strftime("%Y-%m-%d")
        de = [e for e in events if day_key(e.occurred_at) == ds]
        se = [s for s in sessions if day_key(s.started_at) == ds]
        scores = [e.distraction_score for e in de]
        focus = [s.focus_score for s in se]
        out.append({
            "date": ds,
            "label": d.strftime("%a"),
            "avg_distraction": round(statistics.mean(scores), 1) if scores else 0,
            "switches": len(de),
            "focus_minutes": sum(s.actual_minutes for s in se),
            "sessions": len(se),
            "focus_score": round(statistics.mean(focus), 1) if focus else 0
        })
    return out

@app.get("/api/stats/daily")
def daily(db: Session = Depends(get_db)):
    today = now_utc().date().strftime("%Y-%m-%d")
    events = [e for e in db.query(EventRow).all() if day_key(e.occurred_at) == today]
    sessions = [s for s in db.query(SessionRow).all() if day_key(s.started_at) == today]
    scores = [e.distraction_score for e in events]
    return {
        "date": today,
        "switches": len(events),
        "average_distraction": round(statistics.mean(scores), 1) if scores else 0,
        "focus_minutes": sum(s.actual_minutes for s in sessions),
        "sessions": len(sessions),
        "completed_sessions": sum(1 for s in sessions if s.completed),
    }

@app.get("/api/stats/weekly")
def weekly(db: Session = Depends(get_db)):
    return {"days": daily_rows(db)}

@app.get("/api/stats/analytics")
def analytics(db: Session = Depends(get_db)):
    days = daily_rows(db)
    events = db.query(EventRow).all()
    sessions = db.query(SessionRow).all()
    app_counts = {}
    for e in events:
        app_counts[e.app_name] = app_counts.get(e.app_name, 0) + 1
    most_apps = sorted(
        [{"app": k, "switches": v} for k, v in app_counts.items()],
        key=lambda x: x["switches"], reverse=True
    )[:8]

    completed = [s for s in sessions if s.completed]
    total_focus = sum(s.actual_minutes for s in completed)
    avg_len = round(statistics.mean([s.actual_minutes for s in completed]), 1) if completed else 0
    personal_best = max([s.actual_minutes for s in completed], default=0)

    # Simple peak-hour heatmap: count completed focus starts by hour.
    hours = [{"hour": h, "count": 0} for h in range(24)]
    for s in completed:
        hours[as_utc(s.started_at).hour]["count"] += 1

    streak = 0
    today = now_utc().date()
    completed_days = {as_utc(s.started_at).date() for s in completed}
    cursor = today
    while cursor in completed_days:
        streak += 1
        cursor -= timedelta(days=1)

    return {
        "weekly_trend": days,
        "most_distracting_apps": most_apps,
        "daily_streak": streak,
        "peak_hours": hours,
        "average_session_length": avg_len,
        "personal_best_minutes": personal_best,
        "monthly_focus_minutes": total_focus,
    }

@app.get("/api/stats/anomaly")
def anomaly(db: Session = Depends(get_db)):
    since = now_utc() - timedelta(days=7)
    events = db.query(EventRow).filter(EventRow.occurred_at >= since).all()
    today = now_utc().date()
    daily_counts = {}
    for e in events:
        k = day_key(e.occurred_at)
        daily_counts[k] = daily_counts.get(k, 0) + 1
    historical = [v for k, v in daily_counts.items() if k != today.strftime("%Y-%m-%d")]
    baseline = statistics.mean(historical) if historical else 0
    current = daily_counts.get(today.strftime("%Y-%m-%d"), 0)
    if baseline <= 0:
        anomaly_score = 0
        pct = 0
    else:
        pct = max(0, round((current - baseline) / baseline * 100))
        anomaly_score = round(min(100, pct / 2), 1)
    message = f"You're {pct}% more distracted than usual today" if pct >= 40 else "Your distraction is within your usual range"
    return {"current_switches": current, "user_baseline": round(baseline, 1), "anomaly_score": anomaly_score, "message": message, "learned_days": len(historical)}

@app.get("/api/history")
def history(
    period: str = Query("month", pattern="^(today|week|month)$"),
    db: Session = Depends(get_db)
):
    days = {"today": 1, "week": 7, "month": 31}[period]
    cutoff = now_utc() - timedelta(days=days)
    rows = db.query(SessionRow).filter(SessionRow.started_at >= cutoff).order_by(SessionRow.started_at.desc()).all()
    result = []
    for s in rows:
        apps = db.query(EventRow).filter(EventRow.session_id == s.id).all()
        result.append({
            "id": s.id,
            "date_time": as_utc(s.started_at).isoformat(),
            "planned_minutes": s.planned_minutes,
            "actual_minutes": s.actual_minutes,
            "focus_score": s.focus_score,
            "interruptions": s.interruptions,
            "apps": sorted(list({e.app_name for e in apps})),
            "completed": s.completed,
        })
    return {"sessions": result, "total_focus_minutes": sum(x["actual_minutes"] for x in result)}

@app.get("/api/export.csv")
def export_csv(db: Session = Depends(get_db)):
    rows = db.query(SessionRow).order_by(SessionRow.started_at.desc()).all()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["date_time","planned_minutes","actual_minutes","focus_score","interruptions","completed"])
    for s in rows:
        writer.writerow([as_utc(s.started_at).isoformat(), s.planned_minutes, s.actual_minutes, s.focus_score, s.interruptions, s.completed])
    buf.seek(0)
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv", headers={"Content-Disposition":"attachment; filename=focusflow_report.csv"})
