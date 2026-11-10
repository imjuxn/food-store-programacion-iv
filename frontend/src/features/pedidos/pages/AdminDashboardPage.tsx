import { Link } from "react-router-dom";
import { useResumenPedidos } from "../hooks/usePedidos";
import { ErrorMessage, Loading } from "../../../shared/components/Feedback";
import { PageHeader } from "../../../shared/components/PageHeader";
import { formatoPrecio } from "../../../shared/format";

export function AdminDashboardPage() {
  const resumen = useResumenPedidos();
  const tarjetas = resumen.data ? [
    { label: "Pedidos hoy", valor: resumen.data.pedidos_hoy, tono: "bg-orange-50 text-orange-700" },
    { label: "Pendientes", valor: resumen.data.pendientes, tono: "bg-amber-50 text-amber-700" },
    { label: "En preparación", valor: resumen.data.en_preparacion, tono: "bg-sky-50 text-sky-700" },
    { label: "Entregados", valor: resumen.data.entregados, tono: "bg-emerald-50 text-emerald-700" },
    { label: "Cancelados", valor: resumen.data.cancelados, tono: "bg-stone-100 text-stone-600" },
    { label: "Ingresos entregados", valor: formatoPrecio.format(resumen.data.ingresos_entregados), tono: "bg-violet-50 text-violet-700" },
  ] : [];
  return <><PageHeader eyebrow="Administración" title="Resumen general" description="Una vista rápida del movimiento de Food Store." />{resumen.isPending ? <Loading /> : resumen.error ? <ErrorMessage error={resumen.error} /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{tarjetas.map((tarjeta) => <div className={`rounded-2xl p-6 ${tarjeta.tono}`} key={tarjeta.label}><p className="text-sm font-bold">{tarjeta.label}</p><p className="mt-5 text-4xl font-black">{tarjeta.valor}</p></div>)}</div>}<div className="surface mt-7"><h2 className="text-xl font-black">Accesos rápidos</h2><div className="mt-4 flex flex-wrap gap-3"><Link to="/admin/pedidos" className="btn-primary">Ver pedidos</Link><Link to="/admin/productos" className="btn-secondary">Gestionar productos</Link><Link to="/admin/categorias" className="btn-secondary">Categorías</Link></div></div></>;
}
