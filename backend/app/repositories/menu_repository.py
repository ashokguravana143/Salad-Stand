from sqlalchemy.orm import Session

from app.models import Menu


class MenuRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_all(self) -> list[Menu]:
        return self.db.query(Menu).order_by(Menu.name.asc()).all()

    def list_available(self) -> list[Menu]:
        return self.db.query(Menu).filter(Menu.available.is_(True)).order_by(Menu.name.asc()).all()

    def get(self, menu_id: int) -> Menu | None:
        return self.db.query(Menu).filter(Menu.id == menu_id).first()

    def get_by_name(self, name: str) -> Menu | None:
        return self.db.query(Menu).filter(Menu.name == name).first()

    def save(self, menu: Menu) -> Menu:
        self.db.add(menu)
        self.db.flush()
        self.db.refresh(menu)
        return menu

    def delete(self, menu: Menu) -> None:
        self.db.delete(menu)
