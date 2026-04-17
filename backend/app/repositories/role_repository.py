from sqlalchemy.orm import Session

from app.models import Role, RoleName


class RoleRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_name(self, name: RoleName) -> Role | None:
        return self.db.query(Role).filter(Role.name == name).first()
