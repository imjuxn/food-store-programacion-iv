from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from app.core.config import get_settings

database_url = get_settings().DATABASE_URL
engine = create_engine(
    database_url,
    connect_args={"check_same_thread": False} if database_url.startswith("sqlite") else {},
    pool_pre_ping=True,
)


def session_factory() -> Session:
    return Session(engine, expire_on_commit=False)


def get_session() -> Generator[Session, None, None]:
    with session_factory() as session:
        yield session


def create_all_tables() -> None:
    from app.modules.categorias import models as categorias_models
    from app.modules.pedidos import models as pedidos_models
    from app.modules.productos import models as productos_models
    from app.modules.usuarios import models as usuarios_models

    SQLModel.metadata.create_all(engine)
