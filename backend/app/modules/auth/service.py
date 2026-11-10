from app.core.security import verify_password
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


class CredencialesInvalidas(Exception):
    pass


class CuentaDesactivada(Exception):
    pass


class AuthService:
    def __init__(self, uow: UsuarioUnitOfWork) -> None:
        self.uow = uow

    def autenticar(self, username: str, password: str) -> str:
        with self.uow as uow:
            usuario = uow.usuarios.get_by_username(username)
            if usuario is None or not verify_password(password, usuario.hashed_password):
                raise CredencialesInvalidas("Credenciales incorrectas")
            if usuario.disabled:
                raise CuentaDesactivada("Cuenta de usuario desactivada")
            return usuario.username
