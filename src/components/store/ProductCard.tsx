"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { IconoBillete, IconoImagen, IconoMas } from "@/components/icons";
import { Insignia } from "@/components/ui/Insignia";
import { useCarrito } from "@/lib/cart-context";
import { formatoMoneda } from "@/lib/format";
import type { Producto } from "@/lib/types";

interface Props {
  producto: Producto;
  onVer: (producto: Producto) => void;
}

export function ProductCard({ producto, onVer }: Props) {
  const { agregar } = useCarrito();
  const agotado = producto.stock <= 0;
  const tienePromocion = producto.precioVentaDivisas < producto.precioVenta;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.96 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={{ y: -6 }}
      className="group flex flex-col overflow-hidden rounded-3xl border border-glass-border bg-white shadow-soft transition-shadow hover:shadow-glass"
    >
      <button
        onClick={() => onVer(producto)}
        className="relative aspect-square w-full overflow-hidden bg-slate-100"
        aria-label={`Ver ${producto.nombre}`}
      >
        {producto.imagenes[0] ? (
          <Image
            src={producto.imagenes[0]}
            alt={producto.nombre}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized={producto.imagenes[0].startsWith("data:")}
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-slate-600">
            <IconoImagen className="h-10 w-10" />
          </span>
        )}
        {producto.imagenes.length > 1 && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/85 px-2 py-1 text-[11px] text-slate-600 shadow-soft backdrop-blur-md">
            <IconoImagen className="h-3.5 w-3.5" />
            {producto.imagenes.length}
          </span>
        )}
        {agotado && (
          <span className="absolute inset-0 grid place-items-center bg-white/60 backdrop-blur-sm">
            <Insignia tono="rojo">Agotado</Insignia>
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-[11px] font-medium uppercase tracking-wider text-blue-500">
          {producto.categoria}
        </span>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
          {producto.nombre}
        </h3>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="min-w-0">
            <p className="text-lg font-bold text-slate-900">{formatoMoneda(producto.precioVenta)}</p>
            {tienePromocion && (
              <span className="mt-1 inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-xs font-bold text-emerald-700">
                <IconoBillete className="h-3.5 w-3.5 shrink-0" />
                {formatoMoneda(producto.precioVentaDivisas)}
                <span className="font-medium text-emerald-600">divisas</span>
              </span>
            )}
          </div>
          <motion.button
            whileTap={{ scale: 0.88 }}
            disabled={agotado}
            onClick={() => agregar(producto)}
            aria-label={`Agregar ${producto.nombre} al carrito`}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-glow transition hover:brightness-110 disabled:opacity-30 disabled:shadow-none"
          >
            <IconoMas className="h-5 w-5" />
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
