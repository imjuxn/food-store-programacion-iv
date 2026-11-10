import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";

const adminLinks = [
  ["/admin/resumen", "Resumen"],
  ["/admin/categorias", "Categorías"],
  ["/admin/productos", "Productos"],
  ["/admin/pedidos", "Pedidos"],
  ["/admin/usuarios", "Usuarios"],
] as const;

function Header() {
  const usuario = useAuthStore((state) => state.usuario);
  const logout = useAuthStore((state) => state.logout);
  const cantidad = useCartStore((state) => state.items.reduce((total, item) => total + item.cantidad, 0));
  const navigate = useNavigate();
  async function salir() {
    await logout();
    navigate("/login");
  }
  return <header className="sticky top-0 z-20 border-b border-stone-200 bg-[#faf7f0]/95 backdrop-blur"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6"><Link to="/" className="flex items-center gap-3 text-xl font-black tracking-tight text-stone-950"><span className="flex size-10 items-center justify-center rounded-xl bg-orange-600 text-lg text-white shadow-md">F</span><span>Food<span className="text-orange-600">Store</span></span></Link>{usuario && <span className="ml-auto max-w-36 truncate text-right text-xs text-stone-600 sm:hidden">{usuario.full_name} · {usuario.role === "admin" ? "Admin" : "Cliente"}</span>}<nav aria-label="Navegación principal" className="flex w-full flex-wrap items-center justify-between gap-2 text-xs font-semibold sm:w-auto sm:justify-start sm:gap-5 sm:text-sm"><NavLink to="/" end className={({ isActive }) => isActive ? "text-orange-700" : "text-stone-600 hover:text-orange-700"}>Menú</NavLink>{usuario && <NavLink to="/mis-pedidos" className={({ isActive }) => isActive ? "text-orange-700" : "text-stone-600 hover:text-orange-700"}>Pedidos</NavLink>}{usuario?.role === "admin" && <Link to="/admin/resumen" className="text-stone-600 hover:text-orange-700">Admin</Link>}<Link to="/carrito" className="rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-orange-800">Carrito <span className="ml-1 rounded-full bg-orange-600 px-1.5 py-0.5 text-xs text-white">{cantidad}</span></Link>{usuario && <span className="hidden max-w-44 truncate text-stone-500 lg:inline">{usuario.full_name} · {usuario.role === "admin" ? "Admin" : "Cliente"}</span>}{usuario ? <button type="button" onClick={() => void salir()} className="text-stone-600 hover:text-orange-700">Salir</button> : <Link to="/login" className="text-stone-600 hover:text-orange-700">Ingresar</Link>}</nav></div></header>;
}

function Footer() {
  return <footer className="mt-auto border-t border-stone-200 bg-white py-8"><div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 px-4 text-sm text-stone-500 sm:px-6"><p>© Food Store · Proyecto integrador</p><p>Hecho para aprender FastAPI y React</p></div></footer>;
}

export function SiteLayout() {
  return <div className="flex min-h-screen flex-col"><Header /><main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6"><Outlet /></main><Footer /></div>;
}

export function AdminLayout() {
  return <div className="flex min-h-screen flex-col"><Header /><div className="mx-auto grid w-full max-w-7xl flex-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[200px_1fr]"><aside className="h-fit rounded-2xl border border-stone-200 bg-white p-3 shadow-sm"><p className="px-3 py-3 text-xs font-black uppercase tracking-[.2em] text-stone-400">Administración</p><nav aria-label="Administración" className="flex flex-wrap gap-1 lg:flex-col">{adminLinks.map(([path, label]) => <NavLink key={path} to={path} className={({ isActive }) => `rounded-xl px-4 py-3 text-sm font-bold transition ${isActive ? "bg-orange-600 text-white" : "text-stone-600 hover:bg-orange-50 hover:text-orange-700"}`}>{label}</NavLink>)}</nav></aside><main className="min-w-0 py-2"><Outlet /></main></div><Footer /></div>;
}
