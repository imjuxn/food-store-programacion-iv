import { api } from "../../../shared/api/axiosInstance";
import type { FiltrosProductos, Producto, ProductoInput, ProductosPaginados } from "../types/producto";

export const productosApi = {
  async listar(filtros: FiltrosProductos): Promise<ProductosPaginados> {
    return (await api.get<ProductosPaginados>("/productos", { params: filtros })).data;
  },
  async crear(datos: ProductoInput): Promise<Producto> {
    return (await api.post<Producto>("/productos", datos)).data;
  },
  async actualizar(id: number, datos: ProductoInput): Promise<Producto> {
    return (await api.put<Producto>(`/productos/${id}`, datos)).data;
  },
  async cambiarStock(id: number, stock: number, disponible: boolean): Promise<Producto> {
    return (await api.patch<Producto>(`/productos/${id}/stock`, { stock, disponible })).data;
  },
  async eliminar(id: number): Promise<void> {
    await api.delete(`/productos/${id}`);
  },
};
