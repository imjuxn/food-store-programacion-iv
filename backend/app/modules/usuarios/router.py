from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import require_role
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.service import AutoDesactivacion, UsuarioNoEncontrado, UsuarioService
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

router = APIRouter(prefix="/admin/usuarios", tags=["Administración de usuarios"])
Admin = Annotated[Usuario, Depends(require_role(["admin"]))]


def get_usuario_service() -> UsuarioService:
    return UsuarioService(UsuarioUnitOfWork())


ServiceDep = Annotated[UsuarioService, Depends(get_usuario_service)]


@router.get("", response_model=list[UserPublic])
def listar_usuarios(admin: Admin, service: ServiceDep) -> list[UserPublic]:
    return service.listar()


@router.post("/{usuario_id}/activar", response_model=UserPublic)
def activar_usuario(usuario_id: int, admin: Admin, service: ServiceDep) -> UserPublic:
    try:
        return service.activar(usuario_id)
    except UsuarioNoEncontrado as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/{usuario_id}/desactivar", response_model=UserPublic)
def desactivar_usuario(usuario_id: int, admin: Admin, service: ServiceDep) -> UserPublic:
    try:
        return service.desactivar(usuario_id, admin.id)
    except UsuarioNoEncontrado as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except AutoDesactivacion as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
