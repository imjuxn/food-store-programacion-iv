from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from app.core.deps import require_role
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductoStockUpdate,
    ProductoUpdate,
    ProductosPaginados,
)
from app.modules.productos.service import CategoriaNoEncontrada, ProductoNoEncontrado, ProductoService
from app.modules.productos.unit_of_work import ProductoUnitOfWork
from app.modules.usuarios.models import Usuario

router = APIRouter(prefix="/productos", tags=["Productos"])
Admin = Annotated[Usuario, Depends(require_role(["admin"]))]


def get_producto_service() -> ProductoService:
    return ProductoService(ProductoUnitOfWork())


ServiceDep = Annotated[ProductoService, Depends(get_producto_service)]


@router.get("", response_model=ProductosPaginados)
def listar_productos(
    service: ServiceDep,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    search: str | None = None,
    categoria_id: int | None = Query(default=None, gt=0),
    disponible: bool | None = None,
) -> ProductosPaginados:
    return service.listar(skip, limit, search, categoria_id, disponible)


@router.get("/{producto_id}", response_model=ProductoRead)
def obtener_producto(service: ServiceDep, producto_id: int = Path(gt=0)) -> ProductoRead:
    try:
        return service.obtener(producto_id)
    except ProductoNoEncontrado as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("", response_model=ProductoRead, status_code=status.HTTP_201_CREATED)
def crear_producto(datos: ProductoCreate, admin: Admin, service: ServiceDep) -> ProductoRead:
    try:
        return service.crear(datos)
    except CategoriaNoEncontrada as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.put("/{producto_id}", response_model=ProductoRead)
def actualizar_producto(
    datos: ProductoUpdate, admin: Admin, service: ServiceDep, producto_id: int = Path(gt=0)
) -> ProductoRead:
    try:
        return service.actualizar(producto_id, datos)
    except (CategoriaNoEncontrada, ProductoNoEncontrado) as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@router.patch("/{producto_id}/stock", response_model=ProductoRead)
def cambiar_stock(
    datos: ProductoStockUpdate, admin: Admin, service: ServiceDep, producto_id: int = Path(gt=0)
) -> ProductoRead:
    try:
        return service.cambiar_stock(producto_id, datos)
    except ProductoNoEncontrado as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_producto(admin: Admin, service: ServiceDep, producto_id: int = Path(gt=0)) -> None:
    try:
        service.eliminar(producto_id)
    except ProductoNoEncontrado as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
