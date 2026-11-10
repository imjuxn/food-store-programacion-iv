import os
import unittest
from pathlib import Path

Path('.tmp').mkdir(exist_ok=True)
os.environ["DATABASE_URL"] = "sqlite:///./.tmp/test_foodstore.db"
os.environ["SECRET_KEY"] = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEF"

from fastapi.testclient import TestClient
from sqlmodel import SQLModel

from app.core.database import engine
from app.db.seed import seed
from app.main import app

API = "/api/v1"


class FoodStoreAPITest(unittest.TestCase):
    def setUp(self):
        SQLModel.metadata.drop_all(engine)
        seed()
        self.client = TestClient(app)
        self.client.__enter__()

    def tearDown(self):
        self.client.__exit__(None, None, None)

    def login_admin(self):
        respuesta = self.client.post(
            f"{API}/auth/token", data={"username": "admin", "password": "Admin1234!"}
        )
        self.assertEqual(respuesta.status_code, 200)
        self.assertNotIn("access_token", respuesta.json())
        self.assertIn("access_token", self.client.cookies)

    def registrar_cliente(self, username="cliente", email="cliente@correo.com"):
        respuesta = self.client.post(
            f"{API}/auth/register",
            json={
                "username": username,
                "full_name": "Cliente de prueba",
                "email": email,
                "password": "Clave1234!",
            },
        )
        self.assertEqual(respuesta.status_code, 201)
        return respuesta.json()

    def login_cliente(self, username="cliente"):
        respuesta = self.client.post(
            f"{API}/auth/token", data={"username": username, "password": "Clave1234!"}
        )
        self.assertEqual(respuesta.status_code, 200)

    def primer_producto(self):
        return self.client.get(f"{API}/productos").json()["items"][0]

    def test_seed_idempotente_y_documentacion(self):
        seed()
        self.assertEqual(len(self.client.get(f"{API}/categorias").json()), 3)
        self.assertEqual(self.client.get(f"{API}/productos").json()["total"], 8)
        self.assertEqual(self.client.get("/docs").status_code, 200)
        self.assertEqual(self.client.get("/redoc").status_code, 200)

    def test_registro_login_cookie_y_roles(self):
        self.assertEqual(self.client.get(f"{API}/auth/me").status_code, 401)
        usuario = self.registrar_cliente()
        self.assertEqual(usuario["role"], "user")
        self.assertNotIn("hashed_password", usuario)
        self.assertEqual(
            self.client.post(
                f"{API}/auth/register",
                json={"username": "CLIENTE", "full_name": "Otro", "email": "otro@correo.com", "password": "Clave1234!"},
            ).status_code,
            409,
        )
        self.login_cliente()
        self.assertEqual(self.client.get(f"{API}/auth/me").status_code, 200)
        self.assertEqual(self.client.get(f"{API}/admin/usuarios").status_code, 403)
        self.assertEqual(self.client.post(f"{API}/auth/logout").status_code, 200)
        self.assertEqual(self.client.get(f"{API}/auth/me").status_code, 401)

    def test_catalogo_crud_y_baja_logica(self):
        self.assertEqual(self.client.post(f"{API}/categorias", json={"nombre": "Helados"}).status_code, 401)
        self.login_admin()
        categoria = self.client.post(f"{API}/categorias", json={"nombre": "Helados", "descripcion": "Fríos"})
        self.assertEqual(categoria.status_code, 201)
        categoria_id = categoria.json()["id"]
        self.assertEqual(self.client.post(f"{API}/categorias", json={"nombre": "HELADOS"}).status_code, 409)
        producto = self.client.post(
            f"{API}/productos",
            json={"categoria_id": categoria_id, "nombre": "Helado de chocolate", "precio_base": 4000, "stock": 5},
        )
        self.assertEqual(producto.status_code, 201)
        producto_id = producto.json()["id"]
        self.assertEqual(producto.json()["categoria"]["nombre"], "Helados")
        self.assertEqual(self.client.put(f"{API}/productos/{producto_id}", json={"precio_base": 4500}).json()["nombre"], "Helado de chocolate")
        self.assertEqual(self.client.patch(f"{API}/productos/{producto_id}/stock", json={"stock": 7, "disponible": False}).json()["stock"], 7)
        self.assertEqual(self.client.get(f"{API}/productos?search=chocolate").json()["total"], 1)
        self.assertEqual(self.client.delete(f"{API}/categorias/{categoria_id}").status_code, 204)
        self.assertEqual(self.client.get(f"{API}/productos/{producto_id}").status_code, 200)
        self.assertEqual(self.client.delete(f"{API}/productos/{producto_id}").status_code, 204)
        self.assertEqual(self.client.get(f"{API}/productos/{producto_id}").status_code, 404)
        self.assertEqual(self.client.delete(f"{API}/productos/{producto_id}").status_code, 404)

    def test_pedido_y_cancelacion_restituyen_stock(self):
        self.registrar_cliente()
        self.login_cliente()
        producto = self.primer_producto()
        pedido = self.client.post(
            f"{API}/pedidos",
            json={
                "items": [{"producto_id": producto["id"], "cantidad": 2}],
                "forma_pago": "EFECTIVO",
                "direccion_entrega": "Calle Falsa 123",
            },
        )
        self.assertEqual(pedido.status_code, 201)
        self.assertEqual(pedido.json()["estado"], "PENDIENTE")
        self.assertEqual(pedido.json()["items"][0]["nombre_producto"], producto["nombre"])
        self.assertEqual(pedido.json()["total"], producto["precio_base"] * 2)
        self.assertEqual(self.client.get(f"{API}/productos/{producto['id']}").json()["stock"], producto["stock"] - 2)
        pedido_id = pedido.json()["id"]
        cancelado = self.client.patch(f"{API}/pedidos/{pedido_id}/cancelar")
        self.assertEqual(cancelado.status_code, 200)
        self.assertEqual(cancelado.json()["estado"], "CANCELADO")
        self.assertEqual(self.client.get(f"{API}/productos/{producto['id']}").json()["stock"], producto["stock"])
        self.assertEqual(self.client.patch(f"{API}/pedidos/{pedido_id}/cancelar").status_code, 400)

    def test_rollback_si_falla_un_item(self):
        self.registrar_cliente()
        self.login_cliente()
        productos = self.client.get(f"{API}/productos").json()["items"]
        primero, segundo = productos[:2]
        pedido = self.client.post(
            f"{API}/pedidos",
            json={
                "items": [
                    {"producto_id": primero["id"], "cantidad": 1},
                    {"producto_id": segundo["id"], "cantidad": segundo["stock"] + 1},
                ],
                "forma_pago": "TRANSFERENCIA",
                "direccion_entrega": "Calle Falsa 123",
            },
        )
        self.assertEqual(pedido.status_code, 400)
        self.assertEqual(self.client.get(f"{API}/productos/{primero['id']}").json()["stock"], primero["stock"])
        self.assertEqual(self.client.get(f"{API}/pedidos").json()["total"], 0)

    def test_pedido_ajeno_y_snapshot_historico(self):
        self.registrar_cliente()
        self.login_cliente()
        producto = self.primer_producto()
        pedido = self.client.post(
            f"{API}/pedidos",
            json={
                "items": [{"producto_id": producto["id"], "cantidad": 1}],
                "forma_pago": "EFECTIVO",
                "direccion_entrega": "Calle Falsa 123",
            },
        )
        self.assertEqual(pedido.status_code, 201)
        pedido_id = pedido.json()["id"]

        self.registrar_cliente("otro_cliente", "otro_cliente@correo.com")
        self.login_cliente("otro_cliente")
        self.assertEqual(self.client.get(f"{API}/pedidos/{pedido_id}").status_code, 403)
        self.assertEqual(self.client.patch(f"{API}/pedidos/{pedido_id}/cancelar").status_code, 403)
        self.assertEqual(self.client.get(f"{API}/pedidos").json()["total"], 0)

        self.login_admin()
        self.assertEqual(
            self.client.put(
                f"{API}/productos/{producto['id']}",
                json={"nombre": "Nombre nuevo", "precio_base": producto["precio_base"] + 1000},
            ).status_code,
            200,
        )
        self.assertEqual(self.client.delete(f"{API}/productos/{producto['id']}").status_code, 204)
        self.login_cliente()
        historico = self.client.get(f"{API}/pedidos/{pedido_id}").json()
        self.assertEqual(historico["items"][0]["nombre_producto"], producto["nombre"])
        self.assertEqual(historico["items"][0]["precio_unitario"], producto["precio_base"])

    def test_producto_repetido_y_validaciones(self):
        self.registrar_cliente()
        self.login_cliente()
        producto = self.primer_producto()
        datos = {
            "items": [{"producto_id": producto["id"], "cantidad": 1}] * 2,
            "forma_pago": "EFECTIVO",
            "direccion_entrega": "Calle Falsa 123",
        }
        self.assertEqual(self.client.post(f"{API}/pedidos", json=datos).status_code, 400)
        datos["items"] = []
        self.assertEqual(self.client.post(f"{API}/pedidos", json=datos).status_code, 422)
        datos["items"] = [{"producto_id": producto["id"], "cantidad": 1}]
        datos["forma_pago"] = "TARJETA"
        self.assertEqual(self.client.post(f"{API}/pedidos", json=datos).status_code, 422)

    def test_admin_transiciones_resumen_y_usuarios(self):
        cliente = self.registrar_cliente()
        self.login_cliente()
        producto = self.primer_producto()
        pedido = self.client.post(
            f"{API}/pedidos",
            json={"items": [{"producto_id": producto["id"], "cantidad": 1}], "forma_pago": "EFECTIVO", "direccion_entrega": "Calle Falsa 123"},
        )
        pedido_id = pedido.json()["id"]
        self.assertEqual(self.client.patch(f"{API}/pedidos/{pedido_id}/estado", json={"estado": "ENTREGADO"}).status_code, 403)
        self.login_admin()
        self.assertEqual(self.client.patch(f"{API}/pedidos/{pedido_id}/estado", json={"estado": "ENTREGADO"}).status_code, 400)
        self.assertEqual(self.client.patch(f"{API}/pedidos/{pedido_id}/estado", json={"estado": "EN_PREPARACION"}).status_code, 200)
        self.assertEqual(self.client.patch(f"{API}/pedidos/{pedido_id}/estado", json={"estado": "ENTREGADO"}).status_code, 200)
        resumen = self.client.get(f"{API}/pedidos/resumen")
        self.assertEqual(resumen.status_code, 200)
        self.assertEqual(resumen.json()["entregados"], 1)
        self.assertEqual(resumen.json()["ingresos_entregados"], pedido.json()["total"])
        self.assertEqual(self.client.post(f"{API}/admin/usuarios/{cliente['id']}/desactivar").status_code, 200)
        self.assertEqual(self.client.post(f"{API}/admin/usuarios/{cliente['id']}/activar").status_code, 200)
        admin_id = self.client.get(f"{API}/auth/me").json()["id"]
        self.assertEqual(self.client.post(f"{API}/admin/usuarios/{admin_id}/desactivar").status_code, 400)


if __name__ == "__main__":
    unittest.main()
