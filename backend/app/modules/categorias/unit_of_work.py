from typing import Self

from app.core.unit_of_work import UnitOfWork
from app.modules.categorias.repository import CategoriaRepository


class CategoriaUnitOfWork(UnitOfWork):
    def __enter__(self) -> Self:
        super().__enter__()
        self.categorias = CategoriaRepository(self.session)
        return self
