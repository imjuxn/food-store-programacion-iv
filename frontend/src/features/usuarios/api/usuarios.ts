import { api } from "../../../shared/api/axiosInstance";
import type { Usuario } from "../../auth/types/usuario";

export const usuariosApi = {
  async listar(): Promise<Usuario[]> {
    return (await api.get<Usuario[]>("/admin/usuarios")).data;
  },
  async activar(id: number): Promise<Usuario> {
    return (await api.post<Usuario>(`/admin/usuarios/${id}/activar`)).data;
  },
  async desactivar(id: number): Promise<Usuario> {
    return (await api.post<Usuario>(`/admin/usuarios/${id}/desactivar`)).data;
  },
};
