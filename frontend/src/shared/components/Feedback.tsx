import { handleApiError } from "../api/handleApiError";

export function ErrorMessage({ error }: { error: unknown }) {
  return <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{handleApiError(error)}</p>;
}

export function Loading({ label = "Cargando..." }: { label?: string }) {
  return <div role="status" className="flex min-h-40 items-center justify-center gap-3 text-stone-500"><span className="size-5 animate-spin rounded-full border-2 border-orange-200 border-t-orange-600" />{label}</div>;
}

export function CatalogSkeleton() {
  return <div role="status" aria-label="Cargando menú" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="overflow-hidden rounded-2xl border border-stone-200 bg-white"><div className="h-44 animate-pulse bg-orange-100" /><div className="space-y-3 p-5"><div className="h-5 w-2/3 animate-pulse rounded bg-stone-200" /><div className="h-4 w-full animate-pulse rounded bg-stone-100" /><div className="h-4 w-3/4 animate-pulse rounded bg-stone-100" /><div className="h-8 w-1/2 animate-pulse rounded bg-orange-100" /></div></div>)}</div>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center"><h3 className="text-xl font-semibold text-stone-900">{title}</h3><p className="mt-2 text-stone-500">{description}</p></div>;
}
