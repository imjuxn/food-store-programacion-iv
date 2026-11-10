from app.core.security import hash_password
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


class UsuarioNoEncontrado(Exception):
    pass


class UsuarioDuplicado(Exception):
    pass


class AutoDesactivacion(Exception):
    pass


class UsuarioService:
    def __init__(self, uow: UsuarioUnitOfWork) -> None:
        self.uow = uow

    def registrar(self, datos: UserCreate) -> UserPublic:
        with self.uow as uow:
            username = datos.username.strip()
            email = str(datos.email).lower()
            if uow.usuarios.get_by_username(username) or uow.usuarios.get_by_email(email):
                raise UsuarioDuplicado("El usuario o el correo ya están registrados")
            usuario = Usuario(
                username=username,
                full_name=datos.full_name.strip(),
                email=email,
                hashed_password=hash_password(datos.password),
                role="user",
            )
            uow.usuarios.add(usuario)
            uow.session.flush()
            return UserPublic.model_validate(usuario)

    def listar(self) -> list[UserPublic]:
        with self.uow as uow:
            return [UserPublic.model_validate(usuario) for usuario in uow.usuarios.list_all()]

    def activar(self, usuario_id: int) -> UserPublic:
        with self.uow as uow:
            usuario = uow.usuarios.get_by_id(usuario_id)
            if usuario is None:
                raise UsuarioNoEncontrado("Usuario no encontrado")
            usuario.disabled = False
            return UserPublic.model_validate(usuario)

    def desactivar(self, usuario_id: int, admin_id: int) -> UserPublic:
        with self.uow as uow:
            usuario = uow.usuarios.get_by_id(usuario_id)
            if usuario is None:
                raise UsuarioNoEncontrado("Usuario no encontrado")
            if usuario_id == admin_id:
                raise AutoDesactivacion("No podés desactivar tu propia cuenta")
            usuario.disabled = True
            return UserPublic.model_validate(usuario)
