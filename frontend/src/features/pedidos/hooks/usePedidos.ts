import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pedidosApi } from "../api/pedidos";
import type { EstadoPedido } from "../types/pedido";

export function usePedidos(estado?: EstadoPedido) {
  return useQuery({ queryKey: ["pedidos", estado], queryFn: () => pedidosApi.listar(estado) });
}

export function useResumenPedidos() {
  return useQuery({ queryKey: ["resumen-pedidos"], queryFn: pedidosApi.resumen });
}

export function usePedidoMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["pedidos"] }),
    queryClient.invalidateQueries({ queryKey: ["resumen-pedidos"] }),
    queryClient.invalidateQueries({ queryKey: ["productos"] }),
  ]);
  return {
    crear: useMutation({ mutationFn: pedidosApi.crear, onSuccess }),
    cancelar: useMutation({ mutationFn: pedidosApi.cancelar, onSuccess }),
    estado: useMutation({ mutationFn: ({ id, estado }: { id: number; estado: EstadoPedido }) => pedidosApi.cambiarEstado(id, estado), onSuccess }),
  };
}
