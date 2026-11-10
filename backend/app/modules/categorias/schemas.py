from typing import Annotated

from pydantic import StringConstraints
from sqlmodel import SQLModel

NombreCategoria = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=100)]


class CategoriaCreate(SQLModel):
    nombre: NombreCategoria
    descripcion: str = ""


class CategoriaUpdate(SQLModel):
    nombre: NombreCategoria | None = None
    descripcion: str | None = None


class CategoriaRead(SQLModel):
    id: int
    nombre: str
    descripcion: str
    activo: bool
