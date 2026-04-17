from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.db.session import Base, SessionLocal, engine
from app.models.menu import Menu
from app.models.role import Role, RoleName
from app.models.system_config import SystemConfig
from app.models.user import User


def seed_initial_data() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        _seed_roles(db)
        _seed_admins(db)
        _seed_system_config(db)
        db.commit()


def _seed_roles(db: Session) -> None:
    for name in RoleName:
        existing = db.query(Role).filter(Role.name == name).first()
        if not existing:
            db.add(Role(name=name))


def _seed_admins(db: Session) -> None:
    admin_role = db.query(Role).filter(Role.name == RoleName.ROLE_ADMIN).first()
    if not admin_role:
        return

    admins = [
        ("admin1@saladstand.com", "Admin One", "adminpass", "9998887776"),
        ("admin2@saladstand.com", "Admin Two", "adminpass", "9998887775"),
    ]
    for email, full_name, password, phone in admins:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            continue
        db.add(
            User(
                email=email,
                full_name=full_name,
                password_hash=get_password_hash(password),
                phone_number=phone,
                is_active=True,
                role=admin_role,
            )
        )


def _seed_system_config(db: Session) -> None:
    existing = db.query(SystemConfig).filter(SystemConfig.config_key == "isCodAvailable").first()
    if not existing:
        db.add(SystemConfig(config_key="isCodAvailable", config_value="true"))



