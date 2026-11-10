import { api } from "../../../shared/api/axiosInstance";
import type { EstadoPedido, Pedido, PedidoInput, PedidosPaginados, ResumenPedidos } from "../types/pedido";

export const pedidosApi = {
  async listar(estado?: EstadoPedido): Promise<PedidosPaginados> {
    return (await api.get<PedidosPaginados>("/pedidos", { params: { skip: 0, limit: 100, estado } })).data;
  },
  async crear(datos: PedidoInput): Promise<Pedido> {
    return (await api.post<Pedido>("/pedidos", datos)).data;
  },
  async cancelar(id: number): Promise<Pedido> {
    return (await api.patch<Pedido>(`/pedidos/${id}/cancelar`)).data;
  },
  async cambiarEstado(id: number, estado: EstadoPedido): Promise<Pedido> {
    return (await api.patch<Pedido>(`/pedidos/${id}/estado`, { estado })).data;
  },
  async resumen(): Promise<ResumenPedidos> {
    return (await api.get<ResumenPedidos>("/pedidos/resumen")).data;
  },
};
