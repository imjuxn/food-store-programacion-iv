from sqlalchemy import text

from app.core.database import engine


def main() -> None:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1")).scalar_one()
    if result != 1:
        raise RuntimeError("La base de datos no respondió correctamente")
    print(f"Conexión OK: {engine.dialect.name} / {engine.url.database}")


if __name__ == "__main__":
    main()
