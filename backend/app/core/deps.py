from collections.abc import Callable
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.security import decode_access_token
from app.modules.usuarios.models import Usuario

SessionDep = Annotated[Session, Depends(get_session)]


def get_current_user(session: SessionDep, access_token: str | None = Cookie(default=None)) -> Usuario:
    username = decode_access_token(access_token) if access_token else None
    if username is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión inválida o vencida")
    usuario = session.exec(select(Usuario).where(Usuario.username == username)).first()
    if usuario is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión inválida o vencida")
    return usuario


def get_current_active_user(usuario: Annotated[Usuario, Depends(get_current_user)]) -> Usuario:
    if usuario.disabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cuenta de usuario desactivada")
    return usuario


def require_role(roles: list[str]) -> Callable[..., Usuario]:
    def comprobar_rol(usuario: Annotated[Usuario, Depends(get_current_active_user)]) -> Usuario:
        if usuario.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tenés permiso")
        return usuario

    return comprobar_rol
