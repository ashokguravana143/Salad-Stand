from fastapi import APIRouter, Depends, File, Form, UploadFile, status

from app.api.deps import DBSession, require_roles
from app.models import RoleName
from app.schemas.menu import MenuCreate, MenuResponse, MenuUpdate
from app.services.menu_service import MenuService


router = APIRouter()


@router.get("", response_model=list[MenuResponse])
def list_menu(db: DBSession):
    return MenuService(db).list_menu(include_unavailable=False)


@router.get("/admin", response_model=list[MenuResponse])
def list_admin_menu(
    db: DBSession,
    _=Depends(require_roles(RoleName.ROLE_ADMIN)),
):
    return MenuService(db).list_menu(include_unavailable=True)


@router.post("", response_model=MenuResponse, status_code=status.HTTP_201_CREATED)
def create_menu_item(
    db: DBSession,
    name: str = Form(...),
    description: str | None = Form(None),
    price: float = Form(...),
    available: bool = Form(True),
    image: UploadFile | None = File(None),
    _=Depends(require_roles(RoleName.ROLE_ADMIN)),
):
    payload = MenuCreate(name=name, description=description, price=price, available=available)
    return MenuService(db).create_menu_item(payload, image)


@router.put("/{menu_id}", response_model=MenuResponse)
def update_menu_item(
    menu_id: int,
    db: DBSession,
    name: str = Form(...),
    description: str | None = Form(None),
    price: float = Form(...),
    available: bool = Form(True),
    image: UploadFile | None = File(None),
    _=Depends(require_roles(RoleName.ROLE_ADMIN)),
):
    payload = MenuUpdate(name=name, description=description, price=price, available=available)
    return MenuService(db).update_menu_item(menu_id, payload, image)


@router.post("/{menu_id}/toggle", response_model=MenuResponse)
def toggle_menu_item(
    menu_id: int,
    db: DBSession,
    _=Depends(require_roles(RoleName.ROLE_ADMIN)),
):
    return MenuService(db).toggle_availability(menu_id)


@router.delete("/{menu_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_menu_item(
    menu_id: int,
    db: DBSession,
    _=Depends(require_roles(RoleName.ROLE_ADMIN)),
):
    MenuService(db).delete_menu_item(menu_id)
