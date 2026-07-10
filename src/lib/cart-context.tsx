"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ItemCarrito, MetodoPago, Producto } from "./types";
import { totalCarrito } from "./whatsapp";

interface ContextoCarrito {
  items: ItemCarrito[];
  abierto: boolean;
  metodoPago: MetodoPago;
  totalItems: number;
  total: number;
  abrir: () => void;
  cerrar: () => void;
  agregar: (producto: Producto, cantidad?: number) => void;
  quitar: (productoId: string) => void;
  cambiarCantidad: (productoId: string, cantidad: number) => void;
  vaciar: () => void;
  setMetodoPago: (metodo: MetodoPago) => void;
}

const CarritoContext = createContext<ContextoCarrito | null>(null);

export function CarritoProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("base");

  const agregar = useCallback((producto: Producto, cantidad = 1) => {
    setItems((prev) => {
      const existente = prev.find((i) => i.producto.id === producto.id);
      if (existente) {
        return prev.map((i) =>
          i.producto.id === producto.id
            ? { ...i, cantidad: Math.min(i.cantidad + cantidad, producto.stock) }
            : i
        );
      }
      return [...prev, { producto, cantidad: Math.min(cantidad, producto.stock) }];
    });
    setAbierto(true);
  }, []);

  const quitar = useCallback((productoId: string) => {
    setItems((prev) => prev.filter((i) => i.producto.id !== productoId));
  }, []);

  const cambiarCantidad = useCallback((productoId: string, cantidad: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.producto.id === productoId
            ? { ...i, cantidad: Math.max(0, Math.min(cantidad, i.producto.stock)) }
            : i
        )
        .filter((i) => i.cantidad > 0)
    );
  }, []);

  const valor = useMemo<ContextoCarrito>(
    () => ({
      items,
      abierto,
      metodoPago,
      totalItems: items.reduce((acc, i) => acc + i.cantidad, 0),
      total: totalCarrito(items, metodoPago),
      abrir: () => setAbierto(true),
      cerrar: () => setAbierto(false),
      agregar,
      quitar,
      cambiarCantidad,
      vaciar: () => setItems([]),
      setMetodoPago,
    }),
    [items, abierto, metodoPago, agregar, quitar, cambiarCantidad]
  );

  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>;
}

export function useCarrito(): ContextoCarrito {
  const ctx = useContext(CarritoContext);
  if (!ctx) throw new Error("useCarrito debe usarse dentro de <CarritoProvider>.");
  return ctx;
}
