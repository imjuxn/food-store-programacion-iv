from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from app.core.deps import get_current_active_user, require_role
from app.modules.pedidos.schemas import (
    CambioEstado,
    EstadoPedido,
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.service import (
    PedidoAjeno,
    PedidoNoEncontrado,
    PedidoService,
    ProductoNoDisponible,
    ProductoNoEncontrado,
    ProductoRepetido,
    StockInsuficiente,
    TransicionInvalida,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.usuarios.models import Usuario

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])
CurrentUser = Annotated[Usuario, Depends(get_current_active_user)]
Admin = Annotated[Usuario, Depends(require_role(["admin"]))]


def get_pedido_service() -> PedidoService:
    return PedidoService(PedidoUnitOfWork())


ServiceDep = Annotated[PedidoService, Depends(get_pedido_service)]


@router.post("", response_model=PedidoRead, status_code=status.HTTP_201_CREATED)
def crear_pedido(datos: PedidoCreate, usuario: CurrentUser, service: ServiceDep) -> PedidoRead:
    try:
        return service.crear(datos, usuario)
    except ProductoNoEncontrado as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except (ProductoNoDisponible, ProductoRepetido, StockInsuficiente) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("", response_model=PedidosPaginados)
def listar_pedidos(
    usuario: CurrentUser,
    service: ServiceDep,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    estado: EstadoPedido | None = None,
) -> PedidosPaginados:
    return service.listar(usuario, skip, limit, estado)


@router.get("/resumen", response_model=ResumenPedidos)
def resumen_pedidos(admin: Admin, service: ServiceDep) -> ResumenPedidos:
    return service.resumen()


@router.get("/{pedido_id}", response_model=PedidoRead)
def obtener_pedido(usuario: CurrentUser, service: ServiceDep, pedido_id: int = Path(gt=0)) -> PedidoRead:
    try:
        return service.obtener(pedido_id, usuario)
    except PedidoNoEncontrado as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except PedidoAjeno as error:
        raise HTTPException(status_code=403, detail=str(error)) from error


@router.patch("/{pedido_id}/estado", response_model=PedidoRead)
def cambiar_estado(
    datos: CambioEstado, admin: Admin, service: ServiceDep, pedido_id: int = Path(gt=0)
) -> PedidoRead:
    try:
        return service.cambiar_estado(pedido_id, datos.estado)
    except PedidoNoEncontrado as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except TransicionInvalida as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.patch("/{pedido_id}/cancelar", response_model=PedidoRead)
def cancelar_pedido(usuario: CurrentUser, service: ServiceDep, pedido_id: int = Path(gt=0)) -> PedidoRead:
    try:
        return service.cancelar(pedido_id, usuario)
    except PedidoNoEncontrado as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except PedidoAjeno as error:
        raise HTTPException(status_code=403, detail=str(error)) from error
    except TransicionInvalida as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
