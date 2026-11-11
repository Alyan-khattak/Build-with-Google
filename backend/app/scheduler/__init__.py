from pathlib import Path
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore

_SCHEDULER_DB = Path(__file__).parent.parent.parent.parent / "data" / "scheduler.db"
_SCHEDULER_DB.parent.mkdir(exist_ok=True)

_jobstore_url = f"sqlite:///{_SCHEDULER_DB}"

scheduler = BackgroundScheduler(
    jobstores={"default": SQLAlchemyJobStore(url=_jobstore_url)},
    timezone="UTC",
)
