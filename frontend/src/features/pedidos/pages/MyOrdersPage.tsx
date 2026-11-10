import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { EstadoBadge } from "../components/EstadoBadge";
import { usePedidoMutations, usePedidos } from "../hooks/usePedidos";
import { EmptyState, ErrorMessage, Loading } from "../../../shared/components/Feedback";
import { PageHeader } from "../../../shared/components/PageHeader";
import { formatoFecha, formatoPrecio } from "../../../shared/format";

export function MyOrdersPage() {
  const pedidos = usePedidos();
  const { cancelar } = usePedidoMutations();
  const location = useLocation();
  const [error, setError] = useState<unknown>(null);
  async function cancelarPedido(id: number) {
    if (!window.confirm(`¿Cancelar el pedido #${id}?`)) return;
    setError(null);
    try { await cancelar.mutateAsync(id); } catch (failure) { setError(failure); }
  }
  return <><PageHeader eyebrow="Tu historial" title="Mis pedidos" description="Seguí el estado de tus pedidos en un solo lugar." action={<Link to="/" className="btn-secondary">Ver menú</Link>} />{(location.state as { creado?: boolean } | null)?.creado && <p role="status" className="mb-5 rounded-xl bg-emerald-50 p-4 font-semibold text-emerald-800">¡Pedido creado con éxito!</p>}{error !== null && <div className="mb-5"><ErrorMessage error={error} /></div>}{pedidos.isPending ? <Loading /> : pedidos.error ? <ErrorMessage error={pedidos.error} /> : pedidos.data.items.length === 0 ? <EmptyState title="Todavía no hiciste pedidos" description="Elegí algo del menú para empezar." /> : <div className="space-y-4">{pedidos.data.items.map((pedido) => <article key={pedido.id} className="surface"><div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 pb-4"><div><p className="text-xl font-black">Pedido #{pedido.id}</p><p className="mt-1 text-sm text-stone-500">{formatoFecha.format(new Date(pedido.created_at))}</p></div><EstadoBadge estado={pedido.estado} /></div><div className="space-y-2 py-5">{pedido.items.map((item) => <p key={item.producto_id} className="flex justify-between gap-3 text-sm text-stone-600"><span>{item.cantidad} × {item.nombre_producto}</span><span>{formatoPrecio.format(item.subtotal)}</span></p>)}</div><div className="flex flex-wrap items-end justify-between gap-4 border-t border-stone-100 pt-4"><div><p className="text-xs text-stone-500">{pedido.direccion_entrega} · {pedido.forma_pago === "EFECTIVO" ? "Efectivo" : "Transferencia"}</p><p className="mt-1 text-xl font-black text-orange-700">{formatoPrecio.format(pedido.total)}</p></div>{pedido.estado === "PENDIENTE" && <button type="button" className="btn-danger" disabled={cancelar.isPending} onClick={() => void cancelarPedido(pedido.id)}>Cancelar pedido</button>}</div></article>)}</div>}</>;
}
