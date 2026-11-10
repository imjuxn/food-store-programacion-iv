import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usuariosApi } from "../api/usuarios";

export function useUsuarios() {
  return useQuery({ queryKey: ["usuarios"], queryFn: usuariosApi.listar });
}

export function useUsuarioMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: ["usuarios"] });
  return {
    activar: useMutation({ mutationFn: usuariosApi.activar, onSuccess }),
    desactivar: useMutation({ mutationFn: usuariosApi.desactivar, onSuccess }),
  };
}
