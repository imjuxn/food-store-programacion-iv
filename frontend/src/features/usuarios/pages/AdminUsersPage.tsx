import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useAuthStore } from "../../../store/authStore";
import { useUsuarioMutations, useUsuarios } from "../hooks/useUsuarios";
import type { Usuario } from "../../auth/types/usuario";
import { DataTable } from "../../../shared/components/DataTable";
import { EmptyState, ErrorMessage, Loading } from "../../../shared/components/Feedback";
import { PageHeader } from "../../../shared/components/PageHeader";

export function AdminUsersPage() {
  const usuarios = useUsuarios();
  const usuarioActual = useAuthStore((state) => state.usuario);
  const { activar, desactivar } = useUsuarioMutations();
  const [error, setError] = useState<unknown>(null);
  async function cambiar(usuario: Usuario) {
    setError(null);
    try { if (usuario.disabled) await activar.mutateAsync(usuario.id); else await desactivar.mutateAsync(usuario.id); } catch (failure) { setError(failure); }
  }
  const columns: ColumnDef<Usuario, unknown>[] = [
    { accessorKey: "username", header: "Usuario", cell: ({ row }) => <div><p className="font-black">{row.original.full_name}</p><p className="text-xs text-stone-500">@{row.original.username}</p></div> },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "role", header: "Rol", cell: ({ row }) => row.original.role === "admin" ? "Admin" : "Cliente" },
    { accessorKey: "disabled", header: "Estado", cell: ({ row }) => <span className={`rounded-full px-2 py-1 text-xs font-bold ${row.original.disabled ? "bg-red-50 text-red-700" : "bg-emerald-100 text-emerald-800"}`}>{row.original.disabled ? "Desactivado" : "Activo"}</span> },
    { id: "acciones", header: "Acciones", cell: ({ row }) => <button type="button" disabled={row.original.id === usuarioActual?.id || activar.isPending || desactivar.isPending} onClick={() => void cambiar(row.original)} className={`text-xs font-bold hover:underline ${row.original.disabled ? "text-emerald-700" : "text-red-600"}`}>{row.original.disabled ? "Activar" : "Desactivar"}</button> },
  ];
  return <><PageHeader eyebrow="Administración" title="Usuarios" description="Gestioná el acceso de las cuentas registradas." />{error !== null && <div className="mb-5"><ErrorMessage error={error} /></div>}{usuarios.isPending ? <Loading /> : usuarios.error ? <ErrorMessage error={usuarios.error} /> : usuarios.data.length === 0 ? <EmptyState title="No hay usuarios" description="Las cuentas nuevas aparecerán acá." /> : <DataTable data={usuarios.data} columns={columns} />}</>;
}
