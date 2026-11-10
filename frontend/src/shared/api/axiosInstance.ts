import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1",
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const url = error.config?.url ?? "";
      const desactivado = error.response?.status === 400 && error.response?.data?.detail === "Cuenta de usuario desactivada";
      const sinSesion = error.response?.status === 401 && !url.includes("/auth/token") && !url.includes("/auth/me");
      if (desactivado || sinSesion) {
        window.dispatchEvent(new Event("foodstore:session-expired"));
      }
    }
    return Promise.reject(error);
  },
);
