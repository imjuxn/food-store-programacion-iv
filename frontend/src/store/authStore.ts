import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "../features/auth/api/auth";
import type { Usuario } from "../features/auth/types/usuario";
import { queryClient } from "../shared/api/queryClient";

interface AuthState {
  usuario: Usuario | null;
  cargando: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      cargando: true,
      login: async (username, password) => {
        await authApi.login(username, password);
        const usuario = await authApi.me();
        queryClient.clear();
        set({ usuario, cargando: false });
      },
      logout: async () => {
        try {
          await authApi.logout();
        } finally {
          queryClient.clear();
          set({ usuario: null, cargando: false });
        }
      },
      checkSession: async () => {
        set({ cargando: true });
        try {
          const usuario = await authApi.me();
          set({ usuario, cargando: false });
        } catch {
          set({ usuario: null, cargando: false });
        }
      },
      clearSession: () => {
        queryClient.clear();
        set({ usuario: null, cargando: false });
      },
    }),
    { name: "foodstore-auth", partialize: (state) => ({ usuario: state.usuario }) },
  ),
);
