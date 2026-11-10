from sqlalchemy import func
from sqlmodel import Session, select

from app.core.base_repository import BaseRepository
from app.modules.usuarios.models import Usuario


class UsuarioRepository(BaseRepository[Usuario]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Usuario)

    def get_by_username(self, username: str) -> Usuario | None:
        return self.session.exec(
            select(Usuario).where(func.lower(Usuario.username) == username.lower())
        ).first()

    def get_by_email(self, email: str) -> Usuario | None:
        return self.session.exec(
            select(Usuario).where(func.lower(Usuario.email) == email.lower())
        ).first()

    def list_all(self) -> list[Usuario]:
        return list(self.session.exec(select(Usuario).order_by(Usuario.id)).all())
