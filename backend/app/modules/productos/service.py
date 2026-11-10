from app.modules.categorias.models import Categoria
from app.modules.productos.models import Producto
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductoStockUpdate,
    ProductoUpdate,
    ProductosPaginados,
)
from app.modules.productos.unit_of_work import ProductoUnitOfWork


class ProductoNoEncontrado(Exception):
    pass


class CategoriaNoEncontrada(Exception):
    pass


def producto_read(producto: Producto) -> ProductoRead:
    return ProductoRead.model_validate(
        {**producto.model_dump(), "categoria": producto.categoria}
    )


class ProductoService:
    def __init__(self, uow: ProductoUnitOfWork) -> None:
        self.uow = uow

    @staticmethod
    def _activo(producto: Producto | None) -> Producto:
        if producto is None or not producto.activo:
            raise ProductoNoEncontrado("Producto no encontrado")
        return producto

    @staticmethod
    def _categoria(categoria: Categoria | None) -> Categoria:
        if categoria is None or not categoria.activo:
            raise CategoriaNoEncontrada("Categoría no encontrada")
        return categoria

    def listar(
        self, skip: int, limit: int, search: str | None, categoria_id: int | None, disponible: bool | None
    ) -> ProductosPaginados:
        with self.uow as uow:
            total, items = uow.productos.search(skip, limit, search, categoria_id, disponible)
            return ProductosPaginados(total=total, items=[producto_read(item) for item in items])

    def obtener(self, producto_id: int) -> ProductoRead:
        with self.uow as uow:
            return producto_read(self._activo(uow.productos.get_by_id(producto_id)))

    def crear(self, datos: ProductoCreate) -> ProductoRead:
        with self.uow as uow:
            self._categoria(uow.categorias.get_by_id(datos.categoria_id))
            producto = Producto(**datos.model_dump())
            uow.productos.add(producto)
            uow.session.flush()
            return producto_read(producto)

    def actualizar(self, producto_id: int, datos: ProductoUpdate) -> ProductoRead:
        with self.uow as uow:
            producto = self._activo(uow.productos.get_by_id(producto_id))
            cambios = datos.model_dump(exclude_unset=True)
            if "categoria_id" in cambios:
                self._categoria(uow.categorias.get_by_id(cambios["categoria_id"]))
            for campo, valor in cambios.items():
                if valor is None:
                    raise ValueError(f"{campo} no puede ser nulo")
                setattr(producto, campo, valor)
            uow.session.flush()
            return producto_read(producto)

    def cambiar_stock(self, producto_id: int, datos: ProductoStockUpdate) -> ProductoRead:
        with self.uow as uow:
            producto = self._activo(uow.productos.get_for_update(producto_id))
            for campo, valor in datos.model_dump(exclude_unset=True).items():
                if valor is None:
                    raise ValueError(f"{campo} no puede ser nulo")
                setattr(producto, campo, valor)
            uow.session.flush()
            return producto_read(producto)

    def eliminar(self, producto_id: int) -> None:
        with self.uow as uow:
            producto = self._activo(uow.productos.get_by_id(producto_id))
            producto.activo = False
