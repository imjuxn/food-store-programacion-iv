import { api } from "../../../shared/api/axiosInstance";
import type { Registro, Usuario } from "../types/usuario";

export const authApi = {
  async register(datos: Registro): Promise<Usuario> {
    return (await api.post<Usuario>("/auth/register", datos)).data;
  },
  async login(username: string, password: string): Promise<void> {
    const form = new URLSearchParams({ username, password });
    await api.post("/auth/token", form, { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
  },
  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },
  async me(): Promise<Usuario> {
    return (await api.get<Usuario>("/auth/me")).data;
  },
};
