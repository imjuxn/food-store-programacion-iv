from datetime import datetime, timezone

from app.modules.pedidos.models import DetallePedido, Pedido
from app.modules.pedidos.schemas import (
    DetallePedidoRead,
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.usuarios.models import Usuario


class PedidoNoEncontrado(Exception):
    pass


class ProductoNoEncontrado(Exception):
    pass


class PedidoAjeno(Exception):
    pass


class StockInsuficiente(Exception):
    pass


class ProductoNoDisponible(Exception):
    pass


class ProductoRepetido(Exception):
    pass


class TransicionInvalida(Exception):
    pass


TRANSICIONES = {
    "PENDIENTE": {"EN_PREPARACION", "CANCELADO"},
    "EN_PREPARACION": {"ENTREGADO", "CANCELADO"},
    "ENTREGADO": set(),
    "CANCELADO": set(),
}


def pedido_read(pedido: Pedido) -> PedidoRead:
    return PedidoRead.model_validate(
        {
            **pedido.model_dump(),
            "items": [DetallePedidoRead.model_validate(item) for item in pedido.items],
        }
    )


class PedidoService:
    def __init__(self, uow: PedidoUnitOfWork) -> None:
        self.uow = uow

    def crear(self, datos: PedidoCreate, usuario: Usuario) -> PedidoRead:
        with self.uow as uow:
            identificadores = [item.producto_id for item in datos.items]
            if len(identificadores) != len(set(identificadores)):
                raise ProductoRepetido("No se puede repetir un producto en el pedido")
            pedido = Pedido(
                usuario_id=usuario.id,
                forma_pago=datos.forma_pago,
                direccion_entrega=datos.direccion_entrega,
                notas=datos.notas,
                estado="PENDIENTE",
                total=0,
            )
            uow.pedidos.add(pedido)
            uow.session.flush()
            for item in datos.items:
                producto = uow.productos.get_for_update(item.producto_id)
                if producto is None or not producto.activo:
                    raise ProductoNoEncontrado("Producto no encontrado")
                if not producto.disponible:
                    raise ProductoNoDisponible(f"{producto.nombre} no está disponible")
                if producto.stock < item.cantidad:
                    raise StockInsuficiente(f"Stock insuficiente para {producto.nombre}")
                producto.stock -= item.cantidad
                subtotal = producto.precio_base * item.cantidad
                pedido.items.append(
                    DetallePedido(
                        pedido_id=pedido.id,
                        producto_id=producto.id,
                        cantidad=item.cantidad,
                        nombre_producto=producto.nombre,
                        precio_unitario=producto.precio_base,
                        subtotal=subtotal,
                    )
                )
                pedido.total += subtotal
            uow.session.flush()
            return pedido_read(pedido)

    def listar(self, usuario: Usuario, skip: int, limit: int, estado: str | None) -> PedidosPaginados:
        with self.uow as uow:
            filtro_usuario = None if usuario.role == "admin" else usuario.id
            total, pedidos = uow.pedidos.list_by_usuario(filtro_usuario, skip, limit, estado)
            return PedidosPaginados(total=total, items=[pedido_read(pedido) for pedido in pedidos])

    def obtener(self, pedido_id: int, usuario: Usuario) -> PedidoRead:
        with self.uow as uow:
            pedido = uow.pedidos.get_by_id(pedido_id)
            if pedido is None:
                raise PedidoNoEncontrado("Pedido no encontrado")
            if usuario.role != "admin" and pedido.usuario_id != usuario.id:
                raise PedidoAjeno("No tenés permiso para ver este pedido")
            return pedido_read(pedido)

    @staticmethod
    def _transicionar(uow: PedidoUnitOfWork, pedido: Pedido, estado: str) -> None:
        if estado not in TRANSICIONES[pedido.estado]:
            raise TransicionInvalida("Transición de estado inválida")
        if estado == "CANCELADO":
            for item in pedido.items:
                producto = uow.productos.get_for_update(item.producto_id)
                producto.stock += item.cantidad
        pedido.estado = estado
        pedido.updated_at = datetime.now(timezone.utc)

    def cambiar_estado(self, pedido_id: int, estado: str) -> PedidoRead:
        with self.uow as uow:
            pedido = uow.pedidos.get_for_update(pedido_id)
            if pedido is None:
                raise PedidoNoEncontrado("Pedido no encontrado")
            self._transicionar(uow, pedido, estado)
            uow.session.flush()
            return pedido_read(pedido)

    def cancelar(self, pedido_id: int, usuario: Usuario) -> PedidoRead:
        with self.uow as uow:
            pedido = uow.pedidos.get_for_update(pedido_id)
            if pedido is None:
                raise PedidoNoEncontrado("Pedido no encontrado")
            if pedido.usuario_id != usuario.id:
                raise PedidoAjeno("No podés cancelar un pedido ajeno")
            if pedido.estado != "PENDIENTE":
                raise TransicionInvalida("Solo podés cancelar un pedido pendiente")
            self._transicionar(uow, pedido, "CANCELADO")
            uow.session.flush()
            return pedido_read(pedido)

    def resumen(self) -> ResumenPedidos:
        with self.uow as uow:
            return ResumenPedidos(
                pendientes=uow.pedidos.count_by_estado("PENDIENTE"),
                en_preparacion=uow.pedidos.count_by_estado("EN_PREPARACION"),
                entregados=uow.pedidos.count_by_estado("ENTREGADO"),
                cancelados=uow.pedidos.count_by_estado("CANCELADO"),
                pedidos_hoy=uow.pedidos.count_today(),
                ingresos_entregados=uow.pedidos.total_entregado(),
            )
