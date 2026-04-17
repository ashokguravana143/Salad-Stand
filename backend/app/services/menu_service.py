from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Menu
from app.repositories.menu_repository import MenuRepository
from app.schemas.menu import MenuCreate, MenuUpdate


class MenuService:
    def __init__(self, db: Session):
        self.db = db
        self.menu = MenuRepository(db)

    def list_menu(self, include_unavailable: bool) -> list[Menu]:
        return self.menu.list_all() if include_unavailable else self.menu.list_available()

    def create_menu_item(self, payload: MenuCreate) -> Menu:
        if self.menu.get_by_name(payload.name):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Salad name already exists.")
        row = Menu(**payload.model_dump())
        self.menu.save(row)
        self.db.commit()
        return row

    def update_menu_item(self, menu_id: int, payload: MenuUpdate) -> Menu:
        row = self.menu.get(menu_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Salad not found.")
        for key, value in payload.model_dump().items():
            setattr(row, key, value)
        self.menu.save(row)
        self.db.commit()
        return row

    def toggle_availability(self, menu_id: int) -> Menu:
        row = self.menu.get(menu_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Salad not found.")
        row.available = not row.available
        self.menu.save(row)
        self.db.commit()
        return row

    def delete_menu_item(self, menu_id: int) -> None:
        row = self.menu.get(menu_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Salad not found.")
        self.menu.delete(row)
        self.db.commit()
