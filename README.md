# Food Store — TPI Programación IV

Aplicación fullstack de pedidos de comida. El backend expone una API REST con FastAPI, SQLModel y PostgreSQL; el frontend usa React, TypeScript y Tailwind CSS.

## Qué incluye

- Catálogo público con búsqueda, categorías, disponibilidad y paginación.
- Registro, inicio y cierre de sesión mediante JWT en cookie `HttpOnly`; roles de cliente y administrador.
- Carrito persistido en el navegador, checkout, historial y cancelación de pedidos pendientes.
- Administración de categorías, productos, stock, pedidos y usuarios; resumen de pedidos e ingresos.
- Pedidos transaccionales: el stock baja al comprar, se restituye al cancelar y se revierte la transacción si falla un ítem. Cada detalle conserva nombre y precio del momento de la compra.
- Bajas lógicas de categorías y productos. Carga inicial idempotente de 3 categorías y 8 productos.

## Estructura

```text
backend/
  app/core/              configuración, seguridad, repositorio base, Unit of Work
  app/db/                carga inicial
  app/modules/           auth, usuarios, categorías, productos y pedidos
  tests/                 pruebas de integración de la API
  requests.http          ejemplos HTTP
frontend/
  src/features/          pantallas, API, hooks y tipos por funcionalidad
  src/shared/            componentes y cliente HTTP
  src/store/             sesión y carrito con Zustand
```

## Requisitos

Python 3.11–3.13, Node.js compatible con Vite 8, pnpm 10 (o npm), y PostgreSQL. Para probar localmente sin PostgreSQL también se puede usar SQLite.

## 1. Base de datos y backend

En pgAdmin, crear una base llamada `foodstore_db`. Desde PowerShell, ubicarse en `backend` y ejecutar:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Editar `backend/.env`: reemplazar `TU_CLAVE` por la contraseña local de PostgreSQL y generar un `SECRET_KEY` propio de al menos 32 caracteres. Por ejemplo:

```powershell
.\.venv\Scripts\python.exe -c "import secrets; print(secrets.token_urlsafe(48))"
```

Como alternativa **solo para pruebas locales**, cambiar `DATABASE_URL` por `sqlite:///./foodstore.db`. `backend/.env` nunca debe subirse al repositorio ni incluirse en el ZIP.

Luego ejecutar, desde `backend`:

```powershell
.\.venv\Scripts\python.exe -m app.db.check_connection
.\.venv\Scripts\python.exe -m app.db.seed
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

La API queda en `http://localhost:8000/api/v1` y Swagger en `http://localhost:8000/docs`. La carga inicial crea el administrador `admin` con contraseña **`Admin1234!`**. Cambiar esta credencial si se despliega fuera del entorno de práctica. Ejecutar el seed varias veces no duplica los registros.

## 2. Frontend

En otra terminal, desde `frontend`:

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

Si no tenés pnpm, `npm install` y `npm run dev` también funcionan. Abrir `http://localhost:5173`. La URL de la API se configura con `VITE_API_URL` (ver `frontend/.env.example`); el valor por defecto apunta a `http://localhost:8000/api/v1`.

Si los puertos `8000` o `5173` están ocupados por otro proyecto, cambiar `FRONTEND_ORIGIN` en `backend/.env` a `http://localhost:5174`, iniciar el backend con `--port 8001` y ejecutar el frontend así:

```powershell
$env:VITE_API_URL = 'http://localhost:8001/api/v1'
pnpm dev -- --port 5174
```

Los dos orígenes deben coincidir con los puertos reales para que funcionen CORS y la cookie de sesión.

## Verificación

Desde `backend`:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Desde `frontend`:

```powershell
pnpm build
```

Recorrido manual sugerido: registrar un cliente → agregar productos → confirmar pedido → ver stock reducido → cancelar mientras está pendiente → verificar stock restituido. Entrar como admin para cambiar el estado de otro pedido y gestionar el catálogo. Probar también un pedido sin stock y verificar que no se guarda parcialmente.

## Entrega

Comprimir **esta carpeta raíz**, no la carpeta que la contiene. Excluir `.venv`, `node_modules`, `dist`, `__pycache__`, `.tmp` y los archivos `.env`. Conservar ambos `.env.example`, `requirements.txt` y `pnpm-lock.yaml`.

Después de completar los enlaces de abajo, desde la carpeta raíz ejecutar `./pack.ps1` en PowerShell para regenerar el ZIP sin incluir secretos ni dependencias descargadas.

La consigna también solicita un **repositorio público en GitHub** y un **video de 10–15 minutos**. Enlaces de la entrega:

- Repositorio público: https://github.com/imjuxn/food-store-programacion-iv
- Video público: https://youtu.be/jcEjikQgkCQ

Para el video: presentarse con la cámara encendida al inicio; mostrar la arquitectura y el seed; registrar un cliente, comprar y cancelar un pedido pendiente comprobando que se devuelve el stock; crear otro pedido y mostrar la gestión como admin. Cerrar con las pruebas y el build. Son dos pedidos distintos porque uno que ya está en preparación no puede ser cancelado por el cliente.
