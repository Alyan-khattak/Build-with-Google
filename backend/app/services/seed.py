"""
Seed synthetic demo accounts at startup.
All data is fabricated — no real user information.
"""
from sqlalchemy.orm import Session
from ..models.user import User
from ..models.guardian_link import GuardianLink
from ..security.auth import hash_password

_DEMO_ACCOUNTS = [
    {"email": "woman@demo.local",    "password": "Demo1234!", "role": "woman"},
    {"email": "guardian@demo.local", "password": "Demo1234!", "role": "guardian"},
]


def seed_demo_data(db: Session) -> None:
    existing = {u.email for u in db.query(User.email).all()}
    new_users: dict[str, User] = {}

    for acct in _DEMO_ACCOUNTS:
        if acct["email"] not in existing:
            user = User(
                email=acct["email"],
                password_hash=hash_password(acct["password"]),
                role=acct["role"],
            )
            db.add(user)
            new_users[acct["role"]] = user

    db.flush()  # assign IDs before creating guardian_link

    # Create guardian link if both accounts were just created
    if "woman" in new_users and "guardian" in new_users:
        db.add(GuardianLink(
            owner_user_id=new_users["woman"].id,
            guardian_user_id=new_users["guardian"].id,
            status="active",
        ))
    elif "woman" not in new_users and "guardian" not in new_users:
        # Both already exist — ensure link exists
        woman = db.query(User).filter_by(email="woman@demo.local").first()
        guardian = db.query(User).filter_by(email="guardian@demo.local").first()
        if woman and guardian:
            exists = db.query(GuardianLink).filter_by(
                owner_user_id=woman.id,
                guardian_user_id=guardian.id,
            ).first()
            if not exists:
                db.add(GuardianLink(
                    owner_user_id=woman.id,
                    guardian_user_id=guardian.id,
                    status="active",
                ))

    db.commit()
