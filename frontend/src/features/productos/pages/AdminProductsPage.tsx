import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import type { ColumnDef } from "@tanstack/react-table";
import { useCategorias } from "../../categorias/hooks/useCategorias";
import { useProductoMutations, useProductos } from "../hooks/useProductos";
import type { Producto, ProductoInput } from "../types/producto";
import { DataTable } from "../../../shared/components/DataTable";
import { EmptyState, ErrorMessage, Loading } from "../../../shared/components/Feedback";
import { PageHeader } from "../../../shared/components/PageHeader";
import { formatoPrecio } from "../../../shared/format";

function ProductEditor({ producto, onClose }: { producto: Producto | null; onClose: () => void }) {
  const categorias = useCategorias();
  const { crear, actualizar } = useProductoMutations();
  const [error, setError] = useState<unknown>(null);
  const form = useForm({
    defaultValues: { categoria_id: producto?.categoria_id ?? 0, nombre: producto?.nombre ?? "", descripcion: producto?.descripcion ?? "", precio_base: producto?.precio_base ?? 0, imagen_url: producto?.imagen_url ?? "", stock: producto?.stock ?? 0, disponible: producto?.disponible ?? true } satisfies ProductoInput,
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        if (producto) await actualizar.mutateAsync({ id: producto.id, datos: value });
        else await crear.mutateAsync(value);
        onClose();
      } catch (failure) { setError(failure); }
    },
  });
  return <form className="surface mb-7" onSubmit={(event) => { event.preventDefault(); void form.handleSubmit(); }}><div className="mb-5 flex justify-between gap-3"><h2 className="text-xl font-black">{producto ? `Editar ${producto.nombre}` : "Nuevo producto"}</h2><button type="button" className="text-sm font-bold text-stone-500 hover:text-stone-900" onClick={onClose}>Cerrar</button></div><div className="grid gap-4 sm:grid-cols-2"><form.Field name="nombre" validators={{ onBlur: ({ value }) => !value.trim() ? "El nombre es obligatorio" : undefined }}>{(field) => <div><label htmlFor="producto-nombre" className="field-label">Nombre</label><input id="producto-nombre" className="field" required value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} onBlur={field.handleBlur} />{field.state.meta.errors.map((message, index) => <p key={index} className="text-sm text-red-600">{String(message)}</p>)}</div>}</form.Field><form.Field name="categoria_id" validators={{ onChange: ({ value }) => value <= 0 ? "Seleccioná una categoría" : undefined }}>{(field) => <div><label htmlFor="producto-categoria" className="field-label">Categoría</label><select id="producto-categoria" className="field" value={field.state.value} onChange={(event) => field.handleChange(Number(event.target.value))}><option value={0}>Seleccioná una categoría</option>{categorias.data?.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}</select>{field.state.meta.errors.map((message, index) => <p key={index} className="text-sm text-red-600">{String(message)}</p>)}</div>}</form.Field><form.Field name="precio_base">{(field) => <div><label htmlFor="producto-precio" className="field-label">Precio base</label><input id="producto-precio" className="field" type="number" min={0} step="0.01" required value={field.state.value} onChange={(event) => field.handleChange(Number(event.target.value))} /></div>}</form.Field><form.Field name="stock">{(field) => <div><label htmlFor="producto-stock" className="field-label">Stock</label><input id="producto-stock" className="field" type="number" min={0} step={1} required value={field.state.value} onChange={(event) => field.handleChange(Number(event.target.value))} /></div>}</form.Field><form.Field name="imagen_url">{(field) => <div><label htmlFor="producto-imagen" className="field-label">URL de imagen (opcional)</label><input id="producto-imagen" className="field" type="url" placeholder="https://..." value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} /></div>}</form.Field><form.Field name="disponible">{(field) => <label className="flex items-center gap-3 pt-8 font-semibold text-stone-700"><input type="checkbox" checked={field.state.value} onChange={(event) => field.handleChange(event.target.checked)} className="size-5 accent-orange-600" />Disponible para comprar</label>}</form.Field><form.Field name="descripcion">{(field) => <div className="sm:col-span-2"><label htmlFor="producto-descripcion" className="field-label">Descripción</label><textarea id="producto-descripcion" className="field min-h-24" value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} /></div>}</form.Field></div>{error !== null && <div className="mt-4"><ErrorMessage error={error} /></div>}<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>{([canSubmit, isSubmitting]) => <button className="btn-primary mt-5" disabled={!canSubmit || isSubmitting}>{isSubmitting ? "Guardando..." : producto ? "Guardar cambios" : "Crear producto"}</button>}</form.Subscribe></form>;
}

export function AdminProductsPage() {
  const [busqueda, setBusqueda] = useState("");
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [stockEditando, setStockEditando] = useState<Producto | null>(null);
  const [stockValor, setStockValor] = useState(0);
  const [disponible, setDisponible] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const productos = useProductos({ skip: 0, limit: 100, search: busqueda.trim() || undefined });
  const { stock, eliminar } = useProductoMutations();
  async function guardarStock() {
    if (!stockEditando) return;
    setError(null);
    try { await stock.mutateAsync({ id: stockEditando.id, stock: stockValor, disponible }); setStockEditando(null); } catch (failure) { setError(failure); }
  }
  async function eliminarProducto(producto: Producto) {
    if (!window.confirm(`¿Eliminar ${producto.nombre} del catálogo?`)) return;
    setError(null);
    try { await eliminar.mutateAsync(producto.id); } catch (failure) { setError(failure); }
  }
  const columns: ColumnDef<Producto, unknown>[] = [
    { accessorKey: "nombre", header: "Producto", cell: ({ row }) => <div><p className="font-black">{row.original.nombre}</p><p className="text-xs text-stone-500">{row.original.categoria.nombre}</p></div> },
    { accessorKey: "precio_base", header: "Precio", cell: ({ row }) => formatoPrecio.format(row.original.precio_base) },
    { accessorKey: "stock", header: "Stock" },
    { accessorKey: "disponible", header: "Estado", cell: ({ row }) => <span className={`rounded-full px-2 py-1 text-xs font-bold ${row.original.disponible ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"}`}>{row.original.disponible ? "Disponible" : "No disponible"}</span> },
    { id: "acciones", header: "Acciones", cell: ({ row }) => <div className="flex flex-wrap gap-3 text-xs font-bold"><button type="button" className="text-orange-700 hover:underline" onClick={() => { setEditando(row.original); setFormAbierto(true); }}>Editar</button><button type="button" className="text-sky-700 hover:underline" onClick={() => { setStockEditando(row.original); setStockValor(row.original.stock); setDisponible(row.original.disponible); }}>Stock</button><button type="button" className="text-red-600 hover:underline" disabled={eliminar.isPending} onClick={() => void eliminarProducto(row.original)}>Eliminar</button></div> },
  ];
  return <><PageHeader eyebrow="Administración" title="Productos" description="Gestioná el menú, sus precios y disponibilidad." action={<button type="button" className="btn-primary" onClick={() => { setEditando(null); setFormAbierto(true); }}>+ Nuevo producto</button>} />{formAbierto && <ProductEditor key={editando?.id ?? "nuevo"} producto={editando} onClose={() => { setFormAbierto(false); setEditando(null); }} />}{stockEditando && <div className="surface mb-6 flex flex-wrap items-end gap-3"><div><p className="mb-2 font-black">Stock de {stockEditando.nombre}</p><input className="field w-32" type="number" min={0} step={1} value={stockValor} onChange={(event) => setStockValor(Number(event.target.value))} /></div><label className="flex items-center gap-2 pb-3 text-sm"><input type="checkbox" checked={disponible} onChange={(event) => setDisponible(event.target.checked)} />Disponible</label><button type="button" className="btn-primary" disabled={stock.isPending || !Number.isInteger(stockValor) || stockValor < 0} onClick={() => void guardarStock()}>Guardar stock</button><button type="button" className="btn-secondary" onClick={() => setStockEditando(null)}>Cancelar</button></div>}{error !== null && <div className="mb-5"><ErrorMessage error={error} /></div>}<input className="field mb-5 max-w-sm" type="search" aria-label="Buscar productos" placeholder="Buscar productos..." value={busqueda} onChange={(event) => { setBusqueda(event.target.value); }} />{productos.isPending ? <Loading /> : productos.error ? <ErrorMessage error={productos.error} /> : productos.data.items.length === 0 ? <EmptyState title="No hay productos" description="Creá un producto o cambiá el filtro." /> : <DataTable data={productos.data.items} columns={columns} pageSize={10} />}</>;
}
