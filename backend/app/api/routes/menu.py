from typing import Annotated

from fastapi import APIRouter, Depends, status

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
    payload: MenuCreate,
    db: DBSession,
    _=Depends(require_roles(RoleName.ROLE_ADMIN)),
):
    return MenuService(db).create_menu_item(payload)


@router.put("/{menu_id}", response_model=MenuResponse)
def update_menu_item(
    menu_id: int,
    payload: MenuUpdate,
    db: DBSession,
    _=Depends(require_roles(RoleName.ROLE_ADMIN)),
):
    return MenuService(db).update_menu_item(menu_id, payload)


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
