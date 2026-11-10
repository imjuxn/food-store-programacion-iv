import { api } from "../../../shared/api/axiosInstance";
import type { Categoria, CategoriaInput } from "../types/categoria";

export const categoriasApi = {
  async listar(): Promise<Categoria[]> {
    return (await api.get<Categoria[]>("/categorias")).data;
  },
  async crear(datos: CategoriaInput): Promise<Categoria> {
    return (await api.post<Categoria>("/categorias", datos)).data;
  },
  async actualizar(id: number, datos: CategoriaInput): Promise<Categoria> {
    return (await api.put<Categoria>(`/categorias/${id}`, datos)).data;
  },
  async eliminar(id: number): Promise<void> {
    await api.delete(`/categorias/${id}`);
  },
};
