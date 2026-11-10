import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCategorias } from "../../categorias/hooks/useCategorias";
import { useProductos } from "../hooks/useProductos";
import type { Producto } from "../types/producto";
import { useCartStore } from "../../../store/cartStore";
import { useAuthStore } from "../../../store/authStore";
import { CatalogSkeleton, EmptyState, ErrorMessage } from "../../../shared/components/Feedback";
import { formatoPrecio } from "../../../shared/format";

const ilustraciones: Record<string, { emoji: string; fondo: string }> = {
  Pizzas: { emoji: "🍕", fondo: "from-orange-100 to-amber-50" },
  Hamburguesas: { emoji: "🍔", fondo: "from-yellow-100 to-orange-50" },
  Bebidas: { emoji: "🥤", fondo: "from-sky-100 to-cyan-50" },
};

function ProductCard({ producto }: { producto: Producto }) {
  const [imgError, setImgError] = useState(false);
  const agregar = useCartStore((state) => state.agregar);
  const items = useCartStore((state) => state.items);
  const cantidad = items.find((item) => item.producto_id === producto.id)?.cantidad ?? 0;
  const categoria = ilustraciones[producto.categoria.nombre] ?? { emoji: "🍽️", fondo: "from-stone-100 to-orange-50" };
  const agotado = !producto.disponible || producto.stock === 0;
  return <article className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><div className={`relative flex h-44 items-center justify-center bg-gradient-to-br ${categoria.fondo}`}>
    {producto.imagen_url && !imgError ? <img src={producto.imagen_url} alt={producto.nombre} className="h-full w-full object-cover" onError={() => setImgError(true)} /> : <span aria-hidden="true" className="select-none text-8xl transition group-hover:scale-110">{categoria.emoji}</span>}
    <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-stone-700 shadow-sm">{producto.categoria.nombre}</span>
  </div><div className="p-5"><h3 className="text-lg font-black text-stone-950">{producto.nombre}</h3><p className="mt-2 min-h-12 text-sm leading-relaxed text-stone-500">{producto.descripcion}</p><div className="mt-5 flex items-end justify-between gap-2"><div><p className="text-2xl font-black text-orange-700">{formatoPrecio.format(producto.precio_base)}</p><p className="mt-1 text-xs text-stone-400">{agotado ? "Sin stock" : `${producto.stock} disponibles`}</p></div><button type="button" onClick={() => agregar(producto)} disabled={agotado || cantidad >= producto.stock} className="flex size-11 items-center justify-center rounded-xl bg-stone-950 text-2xl font-medium text-white transition hover:bg-orange-600" aria-label={`Agregar ${producto.nombre} al carrito`}>+</button></div></div></article>;
}

export function CatalogPage() {
  const usuario = useAuthStore((state) => state.usuario);
  const [busqueda, setBusqueda] = useState("");
  const [search, setSearch] = useState("");
  const [categoriaId, setCategoriaId] = useState<number | undefined>();
  const [pagina, setPagina] = useState(0);
  const [soloDisponibles, setSoloDisponibles] = useState(false);
  useEffect(() => { const timer = setTimeout(() => { setSearch(busqueda.trim()); setPagina(0); }, 300); return () => clearTimeout(timer); }, [busqueda]);
  const categorias = useCategorias();
  const productos = useProductos({ skip: pagina * 8, limit: 8, search: search || undefined, categoria_id: categoriaId, disponible: soloDisponibles || undefined });
  const totalPaginas = Math.ceil((productos.data?.total ?? 0) / 8);
  return <><section className="relative mb-12 overflow-hidden rounded-3xl bg-stone-950 px-7 py-12 text-white sm:px-12 sm:py-16"><div className="absolute -right-12 -top-24 size-80 rounded-full bg-orange-600/20 blur-3xl" /><div className="relative max-w-2xl"><span className="inline-block rounded-full border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[.2em] text-orange-300">Food Store · Hecho con amor</span><h1 className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-6xl">Algo rico para <span className="text-orange-400">cada momento.</span></h1><p className="mt-5 text-lg text-stone-300">Pizzas, hamburguesas y bebidas para disfrutar. Elegí tus favoritos y nosotros nos encargamos del resto.</p><div className="mt-8 flex flex-wrap gap-3"><a href="#menu" className="btn-primary">Explorar el menú ↓</a>{!usuario && <Link to="/register" className="rounded-xl border border-white/30 px-5 py-3 font-bold text-white hover:bg-white/10">Crear cuenta</Link>}</div></div><span aria-hidden="true" className="absolute -bottom-8 right-8 hidden rotate-12 select-none text-[11rem] drop-shadow-2xl lg:block">🍕</span></section><section id="menu"><div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-orange-600">Nuestro menú</p><h2 className="mt-2 text-3xl font-black tracking-tight">Elegí lo que más te guste</h2></div><span className="text-sm text-stone-500">{productos.data?.total ?? 0} productos</span></div><div className="mb-7 flex flex-wrap items-center gap-3"><input className="field max-w-sm" type="search" placeholder="Buscar algo rico..." aria-label="Buscar productos" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} /><select className="field max-w-52" aria-label="Filtrar por categoría" value={categoriaId ?? ""} onChange={(event) => { setCategoriaId(event.target.value ? Number(event.target.value) : undefined); setPagina(0); }}><option value="">Todas las categorías</option>{categorias.data?.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}</select><label className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700"><input type="checkbox" checked={soloDisponibles} onChange={(event) => { setSoloDisponibles(event.target.checked); setPagina(0); }} className="accent-orange-600" />Solo disponibles</label></div>{productos.isPending ? <CatalogSkeleton /> : productos.error ? <ErrorMessage error={productos.error} /> : productos.data.items.length === 0 ? <EmptyState title="No encontramos productos" description="Probá otra búsqueda o categoría." /> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{productos.data.items.map((producto) => <ProductCard key={producto.id} producto={producto} />)}</div>}{totalPaginas > 1 && <div className="mt-8 flex items-center justify-center gap-4"><button type="button" className="btn-secondary" disabled={pagina === 0} onClick={() => setPagina((value) => value - 1)}>Anterior</button><span className="text-sm font-semibold text-stone-600">{pagina + 1} / {totalPaginas}</span><button type="button" className="btn-secondary" disabled={pagina + 1 >= totalPaginas} onClick={() => setPagina((value) => value + 1)}>Siguiente</button></div>}</section></>;
}
