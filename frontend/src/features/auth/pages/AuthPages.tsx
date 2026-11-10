import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import { useAuthStore } from "../../../store/authStore";
import { ErrorMessage } from "../../../shared/components/Feedback";

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl md:grid-cols-2"><div className="hidden flex-col justify-between bg-stone-950 p-10 text-white md:flex"><span className="text-2xl font-black">Food<span className="text-orange-400">Store</span></span><div><p className="text-sm font-bold uppercase tracking-[.2em] text-orange-400">El sabor de estar juntos</p><h2 className="mt-5 text-5xl font-black leading-tight">Tu próxima comida favorita empieza acá.</h2><p className="mt-6 text-stone-300">Elegí tus productos, armá el pedido y disfrutá. Simple, rápido y delicioso.</p></div><span className="text-sm text-stone-500">Productos frescos · Pedidos sencillos</span></div><div className="p-7 sm:p-10"><p className="mb-2 text-xs font-bold uppercase tracking-[.22em] text-orange-600">Bienvenido</p><h1 className="text-3xl font-black tracking-tight">{title}</h1><p className="mb-8 mt-2 text-stone-500">{subtitle}</p>{children}</div></div>;
}

export function LoginPage() {
  const usuario = useAuthStore((state) => state.usuario);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<unknown>(null);
  const form = useForm({
    defaultValues: { username: "", password: "" },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await login(value.username.trim(), value.password);
        const from = (location.state as { from?: string } | null)?.from;
        navigate(from && from.startsWith("/") ? from : "/", { replace: true });
      } catch (failure) { setError(failure); }
    },
  });
  if (usuario) return <Navigate to="/" replace />;
  return <AuthShell title="Ingresá a tu cuenta" subtitle="Usá tus datos para continuar con tu pedido."><form onSubmit={(event) => { event.preventDefault(); void form.handleSubmit(); }} className="space-y-5"><form.Field name="username" validators={{ onBlur: ({ value }) => value.trim().length < 3 ? "Ingresá tu usuario" : undefined }}>{(field) => <div><label className="field-label" htmlFor="username">Usuario</label><input id="username" className="field" autoComplete="username" value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} onBlur={field.handleBlur} required />{field.state.meta.errors.map((message, index) => <p className="mt-1 text-sm text-red-600" key={index}>{String(message)}</p>)}</div>}</form.Field><form.Field name="password" validators={{ onBlur: ({ value }) => !value ? "Ingresá tu contraseña" : undefined }}>{(field) => <div><label className="field-label" htmlFor="password">Contraseña</label><input id="password" className="field" type="password" autoComplete="current-password" value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} onBlur={field.handleBlur} required />{field.state.meta.errors.map((message, index) => <p className="mt-1 text-sm text-red-600" key={index}>{String(message)}</p>)}</div>}</form.Field>{error !== null && <ErrorMessage error={error} />}<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>{([canSubmit, isSubmitting]) => <button className="btn-primary w-full" disabled={!canSubmit || isSubmitting}>{isSubmitting ? "Ingresando..." : "Ingresar"}</button>}</form.Subscribe></form><p className="mt-7 text-center text-sm text-stone-500">¿Todavía no tenés cuenta? <Link to="/register" className="font-bold text-orange-700 hover:underline">Registrate</Link></p></AuthShell>;
}

export function RegisterPage() {
  const usuario = useAuthStore((state) => state.usuario);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const [error, setError] = useState<unknown>(null);
  const form = useForm({
    defaultValues: { username: "", full_name: "", email: "", password: "" },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await authApi.register({ ...value, username: value.username.trim(), full_name: value.full_name.trim(), email: value.email.trim() });
        await login(value.username.trim(), value.password);
        navigate("/", { replace: true });
      } catch (failure) { setError(failure); }
    },
  });
  if (usuario) return <Navigate to="/" replace />;
  return <AuthShell title="Creá tu cuenta" subtitle="Unos pocos datos y ya podés pedir."><form onSubmit={(event) => { event.preventDefault(); void form.handleSubmit(); }} className="space-y-4"><form.Field name="full_name" validators={{ onBlur: ({ value }) => !value.trim() ? "El nombre es obligatorio" : undefined }}>{(field) => <div><label className="field-label" htmlFor="full_name">Nombre completo</label><input id="full_name" className="field" autoComplete="name" value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} onBlur={field.handleBlur} required />{field.state.meta.errors.map((message, index) => <p key={index} className="text-sm text-red-600">{String(message)}</p>)}</div>}</form.Field><form.Field name="username" validators={{ onBlur: ({ value }) => value.trim().length < 3 ? "Mínimo 3 caracteres" : undefined }}>{(field) => <div><label className="field-label" htmlFor="register-username">Usuario</label><input id="register-username" className="field" autoComplete="username" minLength={3} value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} onBlur={field.handleBlur} required />{field.state.meta.errors.map((message, index) => <p key={index} className="text-sm text-red-600">{String(message)}</p>)}</div>}</form.Field><form.Field name="email" validators={{ onBlur: ({ value }) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value) ? "Ingresá un email válido" : undefined }}>{(field) => <div><label className="field-label" htmlFor="email">Email</label><input id="email" className="field" type="email" autoComplete="email" value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} onBlur={field.handleBlur} required />{field.state.meta.errors.map((message, index) => <p key={index} className="text-sm text-red-600">{String(message)}</p>)}</div>}</form.Field><form.Field name="password" validators={{ onBlur: ({ value }) => value.length < 8 ? "Mínimo 8 caracteres" : undefined }}>{(field) => <div><label className="field-label" htmlFor="register-password">Contraseña</label><input id="register-password" className="field" type="password" autoComplete="new-password" minLength={8} value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} onBlur={field.handleBlur} required />{field.state.meta.errors.map((message, index) => <p key={index} className="text-sm text-red-600">{String(message)}</p>)}</div>}</form.Field>{error !== null && <ErrorMessage error={error} />}<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>{([canSubmit, isSubmitting]) => <button className="btn-primary w-full" disabled={!canSubmit || isSubmitting}>{isSubmitting ? "Creando cuenta..." : "Crear cuenta"}</button>}</form.Subscribe></form><p className="mt-7 text-center text-sm text-stone-500">¿Ya tenés cuenta? <Link to="/login" className="font-bold text-orange-700 hover:underline">Ingresá</Link></p></AuthShell>;
}
