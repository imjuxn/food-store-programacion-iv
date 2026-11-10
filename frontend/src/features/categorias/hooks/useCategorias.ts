import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriasApi } from "../api/categorias";

export function useCategorias() {
  return useQuery({ queryKey: ["categorias"], queryFn: categoriasApi.listar });
}

export function useCategoriaMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["categorias"] }),
    queryClient.invalidateQueries({ queryKey: ["productos"] }),
  ]);
  return {
    crear: useMutation({ mutationFn: categoriasApi.crear, onSuccess }),
    actualizar: useMutation({ mutationFn: ({ id, datos }: { id: number; datos: Parameters<typeof categoriasApi.actualizar>[1] }) => categoriasApi.actualizar(id, datos), onSuccess }),
    eliminar: useMutation({ mutationFn: categoriasApi.eliminar, onSuccess }),
  };
}
