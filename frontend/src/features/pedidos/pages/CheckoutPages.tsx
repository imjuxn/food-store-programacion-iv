import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "react-router-dom";
import { usePedidoMutations } from "../hooks/usePedidos";
import { useCartStore } from "../../../store/cartStore";
import { useAuthStore } from "../../../store/authStore";
import { EmptyState, ErrorMessage } from "../../../shared/components/Feedback";
import { PageHeader } from "../../../shared/components/PageHeader";
import { formatoPrecio } from "../../../shared/format";
import type { FormaPago } from "../types/pedido";

export function CartPage() {
  const items = useCartStore((state) => state.items);
  const quitar = useCartStore((state) => state.quitar);
  const cambiarCantidad = useCartStore((state) => state.cambiarCantidad);
  const total = useCartStore((state) => state.total);
  const usuario = useAuthStore((state) => state.usuario);
  return <><PageHeader eyebrow="Tu selección" title="Tu carrito" description="Revisá lo que elegiste antes de confirmar el pedido." />{items.length === 0 ? <EmptyState title="Tu carrito está vacío" description="Explorá el menú y agregá algo rico." /> : <div className="grid gap-7 lg:grid-cols-[1fr_320px]"><div className="space-y-3">{items.map((item) => <div key={item.producto_id} className="surface flex flex-wrap items-center gap-4"><div className="flex size-16 items-center justify-center rounded-xl bg-orange-100 text-3xl" aria-hidden="true">🍽️</div><div className="min-w-40 flex-1"><p className="font-black text-stone-900">{item.nombre}</p><p className="mt-1 text-sm text-stone-500">{formatoPrecio.format(item.precio_unitario)} c/u</p></div><label className="text-sm text-stone-600">Cantidad <input type="number" min={1} max={99} className="field ml-2 w-20" value={item.cantidad} onChange={(event) => { const cantidad = Number(event.target.value); if (Number.isInteger(cantidad) && cantidad >= 1) cambiarCantidad(item.producto_id, cantidad); }} /></label><strong>{formatoPrecio.format(item.precio_unitario * item.cantidad)}</strong><button type="button" className="text-sm font-bold text-red-600 hover:underline" onClick={() => quitar(item.producto_id)}>Quitar</button></div>)}</div><aside className="surface h-fit"><h2 className="text-xl font-black">Resumen</h2><div className="mt-6 flex justify-between border-b border-stone-200 pb-4 text-stone-600"><span>Productos</span><span>{items.reduce((sum, item) => sum + item.cantidad, 0)}</span></div><div className="my-5 flex justify-between text-lg font-black"><span>Total estimado</span><span className="text-orange-700">{formatoPrecio.format(total())}</span></div><p className="mb-5 text-xs leading-relaxed text-stone-500">El precio y el stock definitivos se confirman al crear el pedido.</p><Link to={usuario ? "/checkout" : "/login"} state={usuario ? undefined : { from: "/checkout" }} className="btn-primary w-full">{usuario ? "Continuar pedido" : "Ingresar para pedir"}</Link><Link to="/" className="mt-3 block text-center text-sm font-bold text-stone-500 hover:text-orange-700">Seguir comprando</Link></aside></div>}</>;
}

export function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const total = useCartStore((state) => state.total);
  const vaciar = useCartStore((state) => state.vaciar);
  const { crear } = usePedidoMutations();
  const navigate = useNavigate();
  const [error, setError] = useState<unknown>(null);
  const form = useForm({
    defaultValues: { direccion_entrega: "", forma_pago: "EFECTIVO" as FormaPago, notas: "" },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await crear.mutateAsync({ items: items.map(({ producto_id, cantidad }) => ({ producto_id, cantidad })), forma_pago: value.forma_pago, direccion_entrega: value.direccion_entrega.trim(), notas: value.notas.trim() || null });
        vaciar();
        navigate("/mis-pedidos", { state: { creado: true } });
      } catch (failure) { setError(failure); }
    },
  });
  if (items.length === 0) return <><PageHeader eyebrow="Confirmación" title="Finalizá tu pedido" /><EmptyState title="No hay productos para pedir" description="Agregá productos desde el menú antes de continuar." /></>;
  return <><PageHeader eyebrow="Último paso" title="Finalizá tu pedido" description="Confirmá cómo querés recibir y pagar tu pedido." /><div className="grid gap-7 lg:grid-cols-[1fr_320px]"><form onSubmit={(event) => { event.preventDefault(); void form.handleSubmit(); }} className="surface space-y-5"><h2 className="text-xl font-black">Datos de entrega</h2><form.Field name="direccion_entrega" validators={{ onBlur: ({ value }) => value.trim().length < 5 ? "La dirección debe tener al menos 5 caracteres" : undefined }}>{(field) => <div><label className="field-label" htmlFor="direccion">Dirección de entrega</label><input id="direccion" className="field" placeholder="Calle, número y piso" minLength={5} value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} onBlur={field.handleBlur} required />{field.state.meta.errors.map((message, index) => <p key={index} className="text-sm text-red-600">{String(message)}</p>)}</div>}</form.Field><form.Field name="forma_pago">{(field) => <div><label className="field-label" htmlFor="pago">Forma de pago</label><select id="pago" className="field" value={field.state.value} onChange={(event) => field.handleChange(event.target.value as FormaPago)}><option value="EFECTIVO">Efectivo</option><option value="TRANSFERENCIA">Transferencia</option></select></div>}</form.Field><form.Field name="notas">{(field) => <div><label className="field-label" htmlFor="notas">Notas adicionales (opcional)</label><textarea id="notas" className="field min-h-28" placeholder="Indicaciones para la entrega" value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} /></div>}</form.Field>{error !== null && <ErrorMessage error={error} />}<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>{([canSubmit, isSubmitting]) => <button className="btn-primary w-full" disabled={!canSubmit || isSubmitting}>{isSubmitting ? "Confirmando..." : "Confirmar pedido"}</button>}</form.Subscribe></form><aside className="surface h-fit"><h2 className="text-xl font-black">Tu pedido</h2><div className="my-5 space-y-3">{items.map((item) => <div key={item.producto_id} className="flex justify-between gap-2 text-sm"><span>{item.cantidad} × {item.nombre}</span><span className="font-bold">{formatoPrecio.format(item.precio_unitario * item.cantidad)}</span></div>)}</div><div className="flex justify-between border-t border-stone-200 pt-4 text-lg font-black"><span>Total estimado</span><span className="text-orange-700">{formatoPrecio.format(total())}</span></div></aside></div></>;
}
