from sqlmodel import select

from app.core.database import create_all_tables, session_factory
from app.core.security import hash_password
from app.modules.categorias.models import Categoria
from app.modules.categorias.repository import CategoriaRepository
from app.modules.productos.models import Producto
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.repository import UsuarioRepository

CATEGORIAS = (
    ("Pizzas", "Pizzas artesanales recién horneadas"),
    ("Hamburguesas", "Hamburguesas clásicas y especiales"),
    ("Bebidas", "Bebidas frías para acompañar"),
)

PRODUCTOS = (
    ("Pizzas", "Pizza muzzarella", "Masa casera, salsa y muzzarella", 8900.0, 20),
    ("Pizzas", "Pizza fugazzeta", "Cebolla y muzzarella", 10500.0, 15),
    ("Pizzas", "Pizza napolitana", "Tomate, ajo y albahaca", 11000.0, 12),
    ("Hamburguesas", "Hamburguesa clásica", "Carne, lechuga y tomate", 7600.0, 25),
    ("Hamburguesas", "Hamburguesa doble", "Doble carne y cheddar", 9800.0, 18),
    ("Hamburguesas", "Hamburguesa vegetariana", "Medallón vegetal y vegetales", 8100.0, 10),
    ("Bebidas", "Gaseosa cola", "Botella de 500 ml", 2500.0, 40),
    ("Bebidas", "Limonada", "Limonada fresca de la casa", 3200.0, 30),
)


def seed() -> None:
    create_all_tables()
    with session_factory() as session:
        usuarios = UsuarioRepository(session)
        if usuarios.get_by_username("admin") is None:
            session.add(
                Usuario(
                    username="admin",
                    full_name="Administrador Food Store",
                    email="admin@foodstore.com",
                    hashed_password=hash_password("Admin1234!"),
                    role="admin",
                )
            )
        categorias = CategoriaRepository(session)
        for nombre, descripcion in CATEGORIAS:
            if categorias.get_by_nombre(nombre) is None:
                session.add(Categoria(nombre=nombre, descripcion=descripcion))
        session.flush()
        for categoria_nombre, nombre, descripcion, precio, stock in PRODUCTOS:
            existente = session.exec(select(Producto).where(Producto.nombre == nombre)).first()
            if existente is None:
                categoria = categorias.get_by_nombre(categoria_nombre)
                session.add(
                    Producto(
                        categoria_id=categoria.id,
                        nombre=nombre,
                        descripcion=descripcion,
                        precio_base=precio,
                        stock=stock,
                    )
                )
        session.commit()


if __name__ == "__main__":
    seed()
    print("Seed listo: admin, 3 categorías y 8 productos (sin duplicados).")
