import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import type { ColumnDef } from "@tanstack/react-table";
import { useCategoriaMutations, useCategorias } from "../hooks/useCategorias";
import type { Categoria } from "../types/categoria";
import { DataTable } from "../../../shared/components/DataTable";
import { EmptyState, ErrorMessage, Loading } from "../../../shared/components/Feedback";
import { PageHeader } from "../../../shared/components/PageHeader";

function CategoryEditor({ categoria, onSaved, onCancel }: { categoria: Categoria | null; onSaved: () => void; onCancel: () => void }) {
  const { crear, actualizar } = useCategoriaMutations();
  const [error, setError] = useState<unknown>(null);
  const form = useForm({
    defaultValues: { nombre: categoria?.nombre ?? "", descripcion: categoria?.descripcion ?? "" },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        if (categoria) await actualizar.mutateAsync({ id: categoria.id, datos: value });
        else await crear.mutateAsync(value);
        onSaved();
      } catch (failure) { setError(failure); }
    },
  });
  return <form className="surface mb-7 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end" onSubmit={(event) => { event.preventDefault(); void form.handleSubmit(); }}><form.Field name="nombre" validators={{ onBlur: ({ value }) => value.trim().length < 2 ? "Mínimo 2 caracteres" : undefined }}>{(field) => <div><label className="field-label" htmlFor="nombre-categoria">Nombre</label><input id="nombre-categoria" className="field" minLength={2} value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} onBlur={field.handleBlur} required />{field.state.meta.errors.map((message, index) => <p key={index} className="text-sm text-red-600">{String(message)}</p>)}</div>}</form.Field><form.Field name="descripcion">{(field) => <div><label className="field-label" htmlFor="descripcion-categoria">Descripción</label><input id="descripcion-categoria" className="field" value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} /></div>}</form.Field><div className="flex gap-2"><form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>{([canSubmit, isSubmitting]) => <button className="btn-primary" disabled={!canSubmit || isSubmitting}>{categoria ? "Guardar" : "Crear"}</button>}</form.Subscribe>{categoria && <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>}</div>{error !== null && <div className="md:col-span-3"><ErrorMessage error={error} /></div>}</form>;
}

export function AdminCategoriesPage() {
  const categorias = useCategorias();
  const { eliminar } = useCategoriaMutations();
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [formVersion, setFormVersion] = useState(0);
  const [error, setError] = useState<unknown>(null);
  async function eliminarCategoria(categoria: Categoria) {
    if (!window.confirm(`¿Eliminar la categoría ${categoria.nombre}?`)) return;
    setError(null);
    try { await eliminar.mutateAsync(categoria.id); } catch (failure) { setError(failure); }
  }
  const columns: ColumnDef<Categoria, unknown>[] = [
    { accessorKey: "nombre", header: "Nombre", cell: ({ row }) => <span className="font-black">{row.original.nombre}</span> },
    { accessorKey: "descripcion", header: "Descripción" },
    { id: "acciones", header: "Acciones", cell: ({ row }) => <div className="flex gap-3"><button type="button" onClick={() => setEditando(row.original)} className="font-bold text-orange-700 hover:underline">Editar</button><button type="button" disabled={eliminar.isPending} onClick={() => void eliminarCategoria(row.original)} className="font-bold text-red-600 hover:underline">Eliminar</button></div> },
  ];
  return <><PageHeader eyebrow="Administración" title="Categorías" description="Organizá los grupos de productos del catálogo." /><CategoryEditor key={`${editando?.id ?? "nuevo"}-${formVersion}`} categoria={editando} onSaved={() => { setEditando(null); setFormVersion((version) => version + 1); }} onCancel={() => setEditando(null)} />{error !== null && <div className="mb-5"><ErrorMessage error={error} /></div>}{categorias.isPending ? <Loading /> : categorias.error ? <ErrorMessage error={categorias.error} /> : categorias.data.length === 0 ? <EmptyState title="No hay categorías" description="Creá la primera con el formulario." /> : <DataTable data={categorias.data} columns={columns} />}</>;
}
