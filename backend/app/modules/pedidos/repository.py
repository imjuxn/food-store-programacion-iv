from datetime import datetime, time, timezone

from sqlalchemy import func
from sqlmodel import Session, select

from app.core.base_repository import BaseRepository
from app.modules.pedidos.models import Pedido


class PedidoRepository(BaseRepository[Pedido]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Pedido)

    def get_for_update(self, pedido_id: int) -> Pedido | None:
        return self.session.exec(
            select(Pedido).where(Pedido.id == pedido_id).with_for_update()
        ).first()

    def list_by_usuario(
        self, usuario_id: int | None, skip: int, limit: int, estado: str | None
    ) -> tuple[int, list[Pedido]]:
        filters = []
        if usuario_id is not None:
            filters.append(Pedido.usuario_id == usuario_id)
        if estado is not None:
            filters.append(Pedido.estado == estado)
        total = self.session.exec(select(func.count()).select_from(Pedido).where(*filters)).one()
        items = self.session.exec(
            select(Pedido).where(*filters).order_by(Pedido.id.desc()).offset(skip).limit(limit)
        ).all()
        return total, list(items)

    def count_by_estado(self, estado: str) -> int:
        return self.session.exec(
            select(func.count()).select_from(Pedido).where(Pedido.estado == estado)
        ).one()

    def count_today(self) -> int:
        today = datetime.combine(datetime.now(timezone.utc).date(), time.min, tzinfo=timezone.utc)
        return self.session.exec(
            select(func.count()).select_from(Pedido).where(Pedido.created_at >= today)
        ).one()

    def total_entregado(self) -> float:
        value = self.session.exec(
            select(func.coalesce(func.sum(Pedido.total), 0)).where(Pedido.estado == "ENTREGADO")
        ).one()
        return float(value)
