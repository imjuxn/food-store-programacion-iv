from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import get_settings
from app.core.deps import get_current_active_user
from app.core.security import create_access_token
from app.modules.auth.service import AuthService, CredencialesInvalidas, CuentaDesactivada
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.service import UsuarioDuplicado, UsuarioService
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

router = APIRouter(prefix="/auth", tags=["Autenticación"])


def get_auth_service() -> AuthService:
    return AuthService(UsuarioUnitOfWork())


def get_usuario_service() -> UsuarioService:
    return UsuarioService(UsuarioUnitOfWork())


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def registrar(datos: UserCreate, service: Annotated[UsuarioService, Depends(get_usuario_service)]) -> UserPublic:
    try:
        return service.registrar(datos)
    except UsuarioDuplicado as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@router.post("/token")
def login(
    response: Response,
    formulario: Annotated[OAuth2PasswordRequestForm, Depends()],
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, str]:
    try:
        username = service.autenticar(formulario.username, formulario.password)
    except CredencialesInvalidas as error:
        raise HTTPException(status_code=401, detail=str(error)) from error
    except CuentaDesactivada as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    settings = get_settings()
    response.set_cookie(
        key="access_token",
        value=create_access_token(username),
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    return {"message": "Login exitoso"}


@router.post("/logout")
def logout(response: Response) -> dict[str, str]:
    response.delete_cookie("access_token", path="/")
    return {"message": "Sesión cerrada"}


@router.get("/me", response_model=UserPublic)
def me(usuario: Annotated[Usuario, Depends(get_current_active_user)]) -> UserPublic:
    return UserPublic.model_validate(usuario)
