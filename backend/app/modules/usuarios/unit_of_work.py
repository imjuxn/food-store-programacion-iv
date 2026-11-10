from typing import Self

from app.core.unit_of_work import UnitOfWork
from app.modules.usuarios.repository import UsuarioRepository


class UsuarioUnitOfWork(UnitOfWork):
    def __enter__(self) -> Self:
        super().__enter__()
        self.usuarios = UsuarioRepository(self.session)
        return self
