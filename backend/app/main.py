from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from .config import settings
from .database import engine, Base, SessionLocal

# Import all models so SQLAlchemy registers them before create_all
from .models import User, GuardianLink, SafetySession, SafetyCheck, Emergency, Notification, IncidentReport, GuardianContact  # noqa: F401

from .routes import auth as auth_router
from .routes import sessions as sessions_router
from .routes import guardian as guardian_router
from .routes import reports as reports_router
from .routes import users as users_router
from .scheduler import scheduler

# Ensure data directory exists regardless of working directory
_DATA_DIR = Path(__file__).parent.parent.parent / "data"
_DATA_DIR.mkdir(exist_ok=True)

app = FastAPI(
    title="AMANAH AI",
    description="Your Safety. Your Circle. Your City.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(sessions_router.router)
app.include_router(guardian_router.router)
app.include_router(reports_router.router)
app.include_router(users_router.router)


def _migrate_schema():
    """Add columns introduced after initial DB creation (idempotent)."""
    from sqlalchemy import text
    migrations = [
        ("safety_sessions", "latitude", "REAL"),
        ("safety_sessions", "longitude", "REAL"),
        ("users", "full_name", "TEXT"),
    ]
    with engine.connect() as conn:
        for table, col, col_type in migrations:
            try:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"))
                conn.commit()
            except Exception:
                pass  # column already exists


@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    _migrate_schema()

    db = SessionLocal()
    try:
        from .services.seed import seed_demo_data
        seed_demo_data(db)
    finally:
        db.close()

    scheduler.start()

    db = SessionLocal()
    try:
        from .scheduler.reconcile import reconcile_active_sessions
        reconcile_active_sessions(db)
    finally:
        db.close()


@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown(wait=False)


@app.get("/api/v1/health", tags=["system"])
def health_check():
    return {"status": "ok", "service": "amanah-ai"}
