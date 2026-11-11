from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from pathlib import Path
from .config import settings

# For sqlite:///./... URLs, resolve to an absolute path so the DB lands in
# the project root's data/ dir regardless of the working directory at startup.
_db_url = settings.database_url
if _db_url.startswith("sqlite:///./"):
    _abs = str(Path(__file__).parent.parent.parent / _db_url[len("sqlite:///./"):])
    _db_url = f"sqlite:///{_abs}"

engine = create_engine(
    _db_url,
    connect_args={"check_same_thread": False},  # required for SQLite + FastAPI
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
