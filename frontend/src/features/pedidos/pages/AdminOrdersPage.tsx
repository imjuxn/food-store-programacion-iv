import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { EstadoBadge } from "../components/EstadoBadge";
import { usePedidoMutations, usePedidos } from "../hooks/usePedidos";
import type { EstadoPedido, Pedido } from "../types/pedido";
import { DataTable } from "../../../shared/components/DataTable";
import { EmptyState, ErrorMessage, Loading } from "../../../shared/components/Feedback";
import { PageHeader } from "../../../shared/components/PageHeader";
import { formatoFecha, formatoPrecio } from "../../../shared/format";

export function AdminOrdersPage() {
  const [estado, setEstado] = useState<EstadoPedido | undefined>();
  const [error, setError] = useState<unknown>(null);
  const pedidos = usePedidos(estado);
  const { estado: cambiarEstado } = usePedidoMutations();
  async function transicionar(id: number, nuevoEstado: EstadoPedido) {
    setError(null);
    try { await cambiarEstado.mutateAsync({ id, estado: nuevoEstado }); } catch (failure) { setError(failure); }
  }
  const columns: ColumnDef<Pedido, unknown>[] = [
    { accessorKey: "id", header: "Pedido", cell: ({ row }) => <div><p className="font-black">#{row.original.id}</p><p className="text-xs text-stone-500">Usuario #{row.original.usuario_id}</p></div> },
    { accessorKey: "created_at", header: "Fecha", cell: ({ row }) => formatoFecha.format(new Date(row.original.created_at)) },
    { id: "detalle", header: "Detalle", cell: ({ row }) => <div className="max-w-52 text-xs text-stone-600">{row.original.items.map((item) => `${item.cantidad} × ${item.nombre_producto}`).join(", ")}<p className="mt-1 text-stone-400">{row.original.direccion_entrega}</p></div> },
    { accessorKey: "total", header: "Total", cell: ({ row }) => <strong>{formatoPrecio.format(row.original.total)}</strong> },
    { accessorKey: "estado", header: "Estado", cell: ({ row }) => <EstadoBadge estado={row.original.estado} /> },
    { id: "acciones", header: "Acciones", cell: ({ row }) => <div className="flex flex-wrap gap-2 text-xs font-bold">{row.original.estado === "PENDIENTE" && <button type="button" className="text-sky-700 hover:underline" disabled={cambiarEstado.isPending} onClick={() => void transicionar(row.original.id, "EN_PREPARACION")}>Preparar</button>}{row.original.estado === "EN_PREPARACION" && <button type="button" className="text-emerald-700 hover:underline" disabled={cambiarEstado.isPending} onClick={() => void transicionar(row.original.id, "ENTREGADO")}>Entregar</button>}{["PENDIENTE", "EN_PREPARACION"].includes(row.original.estado) && <button type="button" className="text-red-600 hover:underline" disabled={cambiarEstado.isPending} onClick={() => { if (window.confirm(`¿Cancelar el pedido #${row.original.id}?`)) void transicionar(row.original.id, "CANCELADO"); }}>Cancelar</button>}</div> },
  ];
  return <><PageHeader eyebrow="Administración" title="Pedidos" description="Controlá el ciclo de cada pedido y sus entregas." /><select className="field mb-5 max-w-xs" aria-label="Filtrar pedidos por estado" value={estado ?? ""} onChange={(event) => setEstado(event.target.value ? event.target.value as EstadoPedido : undefined)}><option value="">Todos los estados</option><option value="PENDIENTE">Pendientes</option><option value="EN_PREPARACION">En preparación</option><option value="ENTREGADO">Entregados</option><option value="CANCELADO">Cancelados</option></select>{error !== null && <div className="mb-5"><ErrorMessage error={error} /></div>}{pedidos.isPending ? <Loading /> : pedidos.error ? <ErrorMessage error={pedidos.error} /> : pedidos.data.items.length === 0 ? <EmptyState title="No hay pedidos" description="Los pedidos aparecerán acá cuando los clientes compren." /> : <DataTable data={pedidos.data.items} columns={columns} />}</>;
}
