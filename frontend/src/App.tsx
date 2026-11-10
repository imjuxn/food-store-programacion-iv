import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AdminLayout, SiteLayout } from "./shared/components/Layout";
import { Loading } from "./shared/components/Feedback";
import { useAuthStore } from "./store/authStore";

const LoginPage = lazy(async () => ({ default: (await import("./features/auth/pages/AuthPages")).LoginPage }));
const RegisterPage = lazy(async () => ({ default: (await import("./features/auth/pages/AuthPages")).RegisterPage }));
const CatalogPage = lazy(async () => ({ default: (await import("./features/productos/pages/CatalogPage")).CatalogPage }));
const CartPage = lazy(async () => ({ default: (await import("./features/pedidos/pages/CheckoutPages")).CartPage }));
const CheckoutPage = lazy(async () => ({ default: (await import("./features/pedidos/pages/CheckoutPages")).CheckoutPage }));
const MyOrdersPage = lazy(async () => ({ default: (await import("./features/pedidos/pages/MyOrdersPage")).MyOrdersPage }));
const AdminDashboardPage = lazy(async () => ({ default: (await import("./features/pedidos/pages/AdminDashboardPage")).AdminDashboardPage }));
const AdminOrdersPage = lazy(async () => ({ default: (await import("./features/pedidos/pages/AdminOrdersPage")).AdminOrdersPage }));
const AdminCategoriesPage = lazy(async () => ({ default: (await import("./features/categorias/pages/AdminCategoriesPage")).AdminCategoriesPage }));
const AdminProductsPage = lazy(async () => ({ default: (await import("./features/productos/pages/AdminProductsPage")).AdminProductsPage }));
const AdminUsersPage = lazy(async () => ({ default: (await import("./features/usuarios/pages/AdminUsersPage")).AdminUsersPage }));

function Protected({ admin = false, children }: { admin?: boolean; children: ReactNode }) {
  const usuario = useAuthStore((state) => state.usuario);
  const location = useLocation();
  if (!usuario) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (admin && usuario.role !== "admin") return <Navigate to="/unauthorized" replace />;
  return children;
}

export default function App() {
  const checkSession = useAuthStore((state) => state.checkSession);
  const cargando = useAuthStore((state) => state.cargando);
  const clearSession = useAuthStore((state) => state.clearSession);
  useEffect(() => { void checkSession(); }, [checkSession]);
  useEffect(() => { window.addEventListener("foodstore:session-expired", clearSession); return () => window.removeEventListener("foodstore:session-expired", clearSession); }, [clearSession]);
  if (cargando) return <Loading label="Comprobando sesión..." />;
  return <Suspense fallback={<Loading label="Cargando sección..." />}><Routes><Route element={<SiteLayout />}><Route path="/" element={<CatalogPage />} /><Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} /><Route path="/carrito" element={<CartPage />} /><Route path="/checkout" element={<Protected><CheckoutPage /></Protected>} /><Route path="/mis-pedidos" element={<Protected><MyOrdersPage /></Protected>} /><Route path="/unauthorized" element={<div className="surface mx-auto max-w-lg text-center"><h1 className="text-3xl font-black">Acceso no autorizado</h1><p className="mt-3 text-stone-600">Tu cuenta no tiene permisos para esta sección.</p></div>} /></Route><Route path="/admin" element={<Protected admin><AdminLayout /></Protected>}><Route index element={<Navigate to="resumen" replace />} /><Route path="resumen" element={<AdminDashboardPage />} /><Route path="categorias" element={<AdminCategoriesPage />} /><Route path="productos" element={<AdminProductsPage />} /><Route path="pedidos" element={<AdminOrdersPage />} /><Route path="usuarios" element={<AdminUsersPage />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes></Suspense>;
}
