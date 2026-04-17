from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from pathlib import Path
import os
import uuid

from app.models import Menu
from app.repositories.menu_repository import MenuRepository
from app.schemas.menu import MenuCreate, MenuUpdate


class MenuService:
    def __init__(self, db: Session):
        self.db = db
        self.menu = MenuRepository(db)
        self.upload_dir = Path("assets/images/salads")
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def list_menu(self, include_unavailable: bool) -> list[Menu]:
        return self.menu.list_all() if include_unavailable else self.menu.list_available()

    def create_menu_item(self, payload: MenuCreate, image: UploadFile | None = None) -> Menu:
        if self.menu.get_by_name(payload.name):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Salad name already exists.")

        data = payload.model_dump(exclude_none=True)
        if image:
            data["image_path"] = self._save_image(image)

        row = Menu(**data)
        self.menu.save(row)
        self.db.commit()
        return row

    def update_menu_item(self, menu_id: int, payload: MenuUpdate, image: UploadFile | None = None) -> Menu:
        row = self.menu.get(menu_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Salad not found.")

        if image:
            if row.image_path and os.path.exists(f".{row.image_path}"):
                os.remove(f".{row.image_path}")
            payload.image_path = self._save_image(image)

        for key, value in payload.model_dump(exclude_none=True).items():
            setattr(row, key, value)
        self.menu.save(row)
        self.db.commit()
        return row

    def _save_image(self, image: UploadFile) -> str:
        allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if image.content_type not in allowed_types:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image type.")

        extension = Path(image.filename).suffix or ".jpg"
        filename = f"{uuid.uuid4()}{extension}"
        file_path = self.upload_dir / filename

        with file_path.open("wb") as buffer:
            buffer.write(image.file.read())

        return f"/assets/images/salads/{filename}"

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

        if row.image_path and os.path.exists(f".{row.image_path}"):
            os.remove(f".{row.image_path}")

        self.menu.delete(row)
        self.db.commit()
