from sqlalchemy.orm import Session

from backend.core.config import settings
from backend.core.security import hash_password
from backend.model.admin import Admin


def seed_admin(db: Session):
    existing_admin = (
        db.query(Admin)
        .filter(Admin.email == settings.ADMIN_EMAIL)
        .first()
    )

    if existing_admin:
        return existing_admin

    admin = Admin(
        email=settings.ADMIN_EMAIL,
        password_hash=hash_password(settings.ADMIN_PASSWORD),
        role=settings.ADMIN_ROLE,
    )

    db.add(admin)
    db.commit()
    db.refresh(admin)

    print("Seeded admin created:")
    print(f"Email: {settings.ADMIN_EMAIL}")
    print(f"Password: {settings.ADMIN_PASSWORD}")

    return admin