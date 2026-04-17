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
        _seed_menu(db)
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


def _seed_menu(db: Session) -> None:
    if db.query(Menu).count() > 0:
        return
    db.add_all(
        [
            Menu(
                name="Tropical Bliss",
                description="Fresh pineapple, mango, kiwi, and mint.",
                price=189.00,
                available=True,
                image_url="https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=900&q=80",
            ),
            Menu(
                name="Berry Crunch",
                description="Strawberries, blueberries, apple, chia, and honey drizzle.",
                price=209.00,
                available=True,
                image_url="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
            ),
            Menu(
                name="Citrus Glow",
                description="Orange, sweet lime, pomegranate, and watermelon.",
                price=179.00,
                available=True,
                image_url="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
            ),
        ]
    )
