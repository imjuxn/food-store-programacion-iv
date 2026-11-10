from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, status

from app.core.deps import require_role
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.service import CategoriaNoEncontrada, CategoriaService, NombreDuplicado
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork
from app.modules.usuarios.models import Usuario

router = APIRouter(prefix="/categorias", tags=["Categorías"])
Admin = Annotated[Usuario, Depends(require_role(["admin"]))]


def get_categoria_service() -> CategoriaService:
    return CategoriaService(CategoriaUnitOfWork())


ServiceDep = Annotated[CategoriaService, Depends(get_categoria_service)]


@router.get("", response_model=list[CategoriaRead])
def listar_categorias(service: ServiceDep) -> list[CategoriaRead]:
    return service.listar()


@router.get("/{categoria_id}", response_model=CategoriaRead)
def obtener_categoria(service: ServiceDep, categoria_id: int = Path(gt=0)) -> CategoriaRead:
    try:
        return service.obtener(categoria_id)
    except CategoriaNoEncontrada as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("", response_model=CategoriaRead, status_code=status.HTTP_201_CREATED)
def crear_categoria(datos: CategoriaCreate, admin: Admin, service: ServiceDep) -> CategoriaRead:
    try:
        return service.crear(datos)
    except NombreDuplicado as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@router.put("/{categoria_id}", response_model=CategoriaRead)
def actualizar_categoria(
    datos: CategoriaUpdate, admin: Admin, service: ServiceDep, categoria_id: int = Path(gt=0)
) -> CategoriaRead:
    try:
        return service.actualizar(categoria_id, datos)
    except CategoriaNoEncontrada as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except NombreDuplicado as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_categoria(admin: Admin, service: ServiceDep, categoria_id: int = Path(gt=0)) -> None:
    try:
        service.eliminar(categoria_id)
    except CategoriaNoEncontrada as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
