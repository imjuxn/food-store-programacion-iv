from app.modules.categorias.models import Categoria
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork


class CategoriaNoEncontrada(Exception):
    pass


class NombreDuplicado(Exception):
    pass


class CategoriaService:
    def __init__(self, uow: CategoriaUnitOfWork) -> None:
        self.uow = uow

    @staticmethod
    def _activa(categoria: Categoria | None) -> Categoria:
        if categoria is None or not categoria.activo:
            raise CategoriaNoEncontrada("Categoría no encontrada")
        return categoria

    def listar(self) -> list[CategoriaRead]:
        with self.uow as uow:
            return [CategoriaRead.model_validate(item) for item in uow.categorias.list_active()]

    def obtener(self, categoria_id: int) -> CategoriaRead:
        with self.uow as uow:
            categoria = self._activa(uow.categorias.get_by_id(categoria_id))
            return CategoriaRead.model_validate(categoria)

    def crear(self, datos: CategoriaCreate) -> CategoriaRead:
        with self.uow as uow:
            nombre = datos.nombre.strip()
            if uow.categorias.get_by_nombre(nombre):
                raise NombreDuplicado("Ya existe una categoría con ese nombre")
            categoria = Categoria(nombre=nombre, descripcion=datos.descripcion)
            uow.categorias.add(categoria)
            uow.session.flush()
            return CategoriaRead.model_validate(categoria)

    def actualizar(self, categoria_id: int, datos: CategoriaUpdate) -> CategoriaRead:
        with self.uow as uow:
            categoria = self._activa(uow.categorias.get_by_id(categoria_id))
            cambios = datos.model_dump(exclude_unset=True)
            if "nombre" in cambios:
                if cambios["nombre"] is None:
                    raise ValueError("El nombre no puede ser nulo")
                repetida = uow.categorias.get_by_nombre(cambios["nombre"])
                if repetida is not None and repetida.id != categoria_id:
                    raise NombreDuplicado("Ya existe una categoría con ese nombre")
            for campo, valor in cambios.items():
                if valor is None:
                    raise ValueError(f"{campo} no puede ser nulo")
                setattr(categoria, campo, valor)
            return CategoriaRead.model_validate(categoria)

    def eliminar(self, categoria_id: int) -> None:
        with self.uow as uow:
            categoria = self._activa(uow.categorias.get_by_id(categoria_id))
            categoria.activo = False
