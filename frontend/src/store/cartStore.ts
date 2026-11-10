import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Producto } from "../features/productos/types/producto";

export interface CartItem {
  producto_id: number;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
}

interface CartState {
  items: CartItem[];
  agregar: (producto: Producto) => void;
  quitar: (productoId: number) => void;
  cambiarCantidad: (productoId: number, cantidad: number) => void;
  vaciar: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      agregar: (producto) => set((state) => {
        const existente = state.items.find((item) => item.producto_id === producto.id);
        if (existente) {
          if (existente.cantidad >= producto.stock) return state;
          return { items: state.items.map((item) => item.producto_id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item) };
        }
        if (producto.stock < 1 || !producto.disponible) return state;
        return { items: [...state.items, { producto_id: producto.id, nombre: producto.nombre, precio_unitario: producto.precio_base, cantidad: 1 }] };
      }),
      quitar: (productoId) => set((state) => ({ items: state.items.filter((item) => item.producto_id !== productoId) })),
      cambiarCantidad: (productoId, cantidad) => set((state) => ({ items: state.items.map((item) => item.producto_id === productoId ? { ...item, cantidad: Math.max(1, Math.floor(cantidad)) } : item) })),
      vaciar: () => set({ items: [] }),
      total: () => get().items.reduce((total, item) => total + item.precio_unitario * item.cantidad, 0),
    }),
    { name: "foodstore-cart", partialize: (state) => ({ items: state.items }) },
  ),
);
