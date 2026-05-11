from backend.core.config import settings
from backend.core.security import hash_password
from backend.model.admin import Admin


def seed_admin(db):
    email = settings.ADMIN_EMAIL.strip().lower()
    password = settings.ADMIN_PASSWORD
    role = settings.ADMIN_ROLE.strip().lower()

    admin = db.query(Admin).filter(Admin.email == email).first()

    if admin:
        updated = False

        if admin.role != role:
            admin.role = role
            updated = True

        if not admin.password_hash:
            admin.password_hash = hash_password(password)
            updated = True

        if updated:
            db.commit()
            db.refresh(admin)
            print(f"Admin updated: {admin.email}, role={admin.role}")
        else:
            print(f"Admin already exists: {admin.email}, role={admin.role}")

        return admin

    admin = Admin(
        email=email,
        password_hash=hash_password(password),
        role=role,
    )

    db.add(admin)
    db.commit()
    db.refresh(admin)

    print(f"Admin seeded: {admin.email}, role={admin.role}")

    return admin