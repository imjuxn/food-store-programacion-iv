from sqlalchemy import func
from sqlmodel import Session, select

from app.core.base_repository import BaseRepository
from app.modules.categorias.models import Categoria
from app.modules.productos.models import Producto


class CategoriaRepository(BaseRepository[Categoria]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Categoria)

    def get_by_nombre(self, nombre: str) -> Categoria | None:
        return self.session.exec(
            select(Categoria).where(func.lower(Categoria.nombre) == nombre.lower())
        ).first()

    def list_active(self) -> list[Categoria]:
        return list(self.session.exec(
            select(Categoria).where(Categoria.activo == True).order_by(Categoria.id)
        ).all())

    def has_active_products(self, categoria_id: int) -> bool:
        return self.session.exec(
            select(Producto.id).where(Producto.categoria_id == categoria_id, Producto.activo == True)
        ).first() is not None
