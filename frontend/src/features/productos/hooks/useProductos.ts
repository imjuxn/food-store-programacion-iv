import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productosApi } from "../api/productos";
import type { FiltrosProductos } from "../types/producto";

export function useProductos(filtros: FiltrosProductos) {
  return useQuery({ queryKey: ["productos", filtros], queryFn: () => productosApi.listar(filtros) });
}

export function useProductoMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: ["productos"] });
  return {
    crear: useMutation({ mutationFn: productosApi.crear, onSuccess }),
    actualizar: useMutation({ mutationFn: ({ id, datos }: { id: number; datos: Parameters<typeof productosApi.actualizar>[1] }) => productosApi.actualizar(id, datos), onSuccess }),
    stock: useMutation({ mutationFn: ({ id, stock, disponible }: { id: number; stock: number; disponible: boolean }) => productosApi.cambiarStock(id, stock, disponible), onSuccess }),
    eliminar: useMutation({ mutationFn: productosApi.eliminar, onSuccess }),
  };
}
