import type { EstadoPedido } from "../types/pedido";

const estilos: Record<EstadoPedido, string> = {
  PENDIENTE: "bg-amber-100 text-amber-800",
  EN_PREPARACION: "bg-sky-100 text-sky-800",
  ENTREGADO: "bg-emerald-100 text-emerald-800",
  CANCELADO: "bg-stone-100 text-stone-600",
};

const etiquetas: Record<EstadoPedido, string> = {
  PENDIENTE: "Pendiente",
  EN_PREPARACION: "En preparación",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export function EstadoBadge({ estado }: { estado: EstadoPedido }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${estilos[estado]}`}>{etiquetas[estado]}</span>;
}
