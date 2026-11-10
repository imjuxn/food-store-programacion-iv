from sqlalchemy import func
from sqlmodel import Session, select

from app.core.base_repository import BaseRepository
from app.modules.productos.models import Producto


class ProductoRepository(BaseRepository[Producto]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Producto)

    def search(
        self,
        skip: int,
        limit: int,
        search: str | None = None,
        categoria_id: int | None = None,
        disponible: bool | None = None,
    ) -> tuple[int, list[Producto]]:
        filters = [Producto.activo == True]
        if search:
            filters.append(Producto.nombre.ilike(f"%{search.strip()}%"))
        if categoria_id is not None:
            filters.append(Producto.categoria_id == categoria_id)
        if disponible is not None:
            filters.append(Producto.disponible == disponible)
        total = self.session.exec(select(func.count()).select_from(Producto).where(*filters)).one()
        items = self.session.exec(
            select(Producto).where(*filters).order_by(Producto.id).offset(skip).limit(limit)
        ).all()
        return total, list(items)

    def get_for_update(self, producto_id: int) -> Producto | None:
        return self.session.exec(
            select(Producto).where(Producto.id == producto_id).with_for_update()
        ).first()
