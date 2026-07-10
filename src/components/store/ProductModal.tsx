"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  IconoBillete,
  IconoCerrar,
  IconoFlechaDer,
  IconoFlechaIzq,
  IconoMas,
} from "@/components/icons";
import { Boton } from "@/components/ui/Boton";
import { Insignia } from "@/components/ui/Insignia";
import { useCarrito } from "@/lib/cart-context";
import { formatoMoneda } from "@/lib/format";
import type { Producto } from "@/lib/types";

interface Props {
  producto: Producto | null;
  onCerrar: () => void;
}

/** Ficha de producto con galería de múltiples imágenes (Cloudinary). */
export function ProductModal({ producto, onCerrar }: Props) {
  const { agregar } = useCarrito();
  const [indice, setIndice] = useState(0);

  const imagenes = producto?.imagenes ?? [];
  const mover = (delta: number) =>
    setIndice((i) => (i + delta + imagenes.length) % imagenes.length);

  return (
    <AnimatePresence onExitComplete={() => setIndice(0)}>
      {producto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCerrar}
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
            className="grid max-h-[90vh] w-full max-w-3xl grid-cols-1 overflow-hidden rounded-3xl border border-glass-border bg-slate-950/70 shadow-glass backdrop-blur-2xl sm:grid-cols-2"
          >
            {/* Galería */}
            <div className="relative aspect-square bg-slate-900/60">
              <AnimatePresence mode="wait">
                <motion.div
                  key={indice}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0"
                >
                  {imagenes[indice] && (
                    <Image
                      src={imagenes[indice]}
                      alt={producto.nombre}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover"
                      unoptimized={imagenes[indice].startsWith("data:")}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {imagenes.length > 1 && (
                <>
                  <button
                    onClick={() => mover(-1)}
                    aria-label="Imagen anterior"
                    className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-slate-950/50 text-white backdrop-blur-md transition hover:bg-slate-950/80"
                  >
                    <IconoFlechaIzq className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => mover(1)}
                    aria-label="Imagen siguiente"
                    className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-slate-950/50 text-white backdrop-blur-md transition hover:bg-slate-950/80"
                  >
                    <IconoFlechaDer className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                    {imagenes.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setIndice(i)}
                        aria-label={`Ir a imagen ${i + 1}`}
                        className={`h-1.5 rounded-full transition-all ${
                          i === indice ? "w-6 bg-white" : "w-1.5 bg-white/40"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Detalle */}
            <div className="flex flex-col gap-3 overflow-y-auto p-6">
              <div className="flex items-start justify-between gap-3">
                <Insignia tono="violeta">{producto.categoria}</Insignia>
                <button
                  onClick={onCerrar}
                  aria-label="Cerrar"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-glass-border bg-white/5 text-slate-300 transition hover:bg-white/15 hover:text-white"
                >
                  <IconoCerrar className="h-4 w-4" />
                </button>
              </div>

              <h2 className="text-xl font-bold leading-tight text-white">{producto.nombre}</h2>
              <p className="text-sm leading-relaxed text-slate-300">{producto.descripcion}</p>

              <div className="mt-2 space-y-2 rounded-2xl border border-glass-border bg-white/5 p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs uppercase tracking-wider text-slate-400">
                    Precio base
                  </span>
                  <span className="text-2xl font-bold text-white">
                    {formatoMoneda(producto.precioVenta)}
                  </span>
                </div>
                {producto.precioVentaDivisas < producto.precioVenta && (
                  <div className="flex items-center justify-between border-t border-glass-border pt-2">
                    <span className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-emerald-300">
                      <IconoBillete className="h-4 w-4" />
                      Divisas en físico
                    </span>
                    <span className="text-lg font-bold text-emerald-300">
                      {formatoMoneda(producto.precioVentaDivisas)}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-400">
                {producto.stock > 0 ? `${producto.stock} unidades disponibles` : "Sin stock disponible"}
              </p>

              <Boton
                className="mt-auto"
                disabled={producto.stock <= 0}
                onClick={() => {
                  agregar(producto);
                  onCerrar();
                }}
              >
                <IconoMas className="h-4 w-4" />
                Agregar al carrito
              </Boton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
