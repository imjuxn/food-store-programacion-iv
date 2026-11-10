import axios from "axios";

export function handleApiError(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : "Ocurrió un error inesperado";
  }
  if (!error.response) return "No se pudo conectar con la API. Verificá que el backend esté iniciado.";
  const detail: unknown = error.response.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((item: { loc?: unknown; msg?: unknown }) => `${String(item.loc ?? "Campo")}: ${String(item.msg ?? "inválido")}`).join(" · ");
  }
  return `La solicitud falló (${error.response.status}).`;
}
