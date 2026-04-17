from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class MenuBase(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    price: Decimal = Field(gt=0)
    available: bool = True
    image_url: str | None = Field(default=None, max_length=1000)


class MenuCreate(MenuBase):
    pass


class MenuUpdate(MenuBase):
    pass


class MenuResponse(MenuBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
