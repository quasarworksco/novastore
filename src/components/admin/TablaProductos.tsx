"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  IconoAlerta,
  IconoBasura,
  IconoImagen,
  IconoLapiz,
  IconoTendenciaAlta,
  IconoTendenciaBaja,
} from "@/components/icons";
import { GlassCard } from "@/components/ui/GlassCard";
import { Insignia } from "@/components/ui/Insignia";
import { margenNeto, porcentajeGanancia, UMBRAL_MARGEN_BAJO } from "@/lib/finance";
import { formatoMoneda, formatoPorcentaje } from "@/lib/format";
import type { Producto } from "@/lib/types";

interface Props {
  productos: Producto[];
  onEditar: (producto: Producto) => void;
  onEliminar: (producto: Producto) => void;
}

/** Color del margen: verde positivo, ámbar bajo el umbral, rojo negativo. */
function claseMargen(porcentaje: number): string {
  if (porcentaje < 0) return "text-rose-600";
  if (porcentaje < UMBRAL_MARGEN_BAJO) return "text-amber-600";
  return "text-emerald-600";
}

function CeldaMargen({ producto }: { producto: Producto }) {
  const margen = margenNeto(producto);
  const porcentaje = porcentajeGanancia(producto);
  const Tendencia = margen >= 0 ? IconoTendenciaAlta : IconoTendenciaBaja;

  return (
    <div className={`flex items-center justify-end gap-1.5 font-semibold ${claseMargen(porcentaje)}`}>
      {porcentaje < UMBRAL_MARGEN_BAJO ? (
        <IconoAlerta className="h-3.5 w-3.5" />
      ) : (
        <Tendencia className="h-3.5 w-3.5" />
      )}
      {formatoMoneda(margen)}
    </div>
  );
}

export function TablaProductos({ productos, onEditar, onEliminar }: Props) {
  return (
    <GlassCard className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
              <th className="px-5 py-4 font-medium">Producto</th>
              <th className="px-3 py-4 font-medium">Categoría</th>
              <th className="px-3 py-4 text-right font-medium">Stock</th>
              <th className="px-3 py-4 text-right font-medium">Costo</th>
              <th className="px-3 py-4 text-right font-medium">Precio base</th>
              <th className="px-3 py-4 text-right font-medium">Precio divisas</th>
              <th className="px-3 py-4 text-right font-medium">Diferencia</th>
              <th className="px-3 py-4 text-right font-medium">% Ganancia</th>
              <th className="px-5 py-4 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {productos.map((p) => {
                const porcentajeBase = porcentajeGanancia(p);
                const porcentajeDivisas = porcentajeGanancia(p, "divisas");
                return (
                  <motion.tr
                    key={p.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          {p.imagenes[0] ? (
                            <Image
                              src={p.imagenes[0]}
                              alt={p.nombre}
                              fill
                              sizes="44px"
                              className="object-cover"
                              unoptimized={p.imagenes[0].startsWith("data:")}
                            />
                          ) : (
                            <span className="grid h-full w-full place-items-center text-slate-300">
                              <IconoImagen className="h-5 w-5" />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-[220px] truncate font-semibold text-slate-900">
                            {p.nombre}
                          </p>
                          {!p.activo && <Insignia tono="neutro">Inactivo</Insignia>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{p.categoria}</td>
                    <td className="px-3 py-3 text-right">
                      {p.stock > 0 ? (
                        <span className="text-slate-700">{p.stock}</span>
                      ) : (
                        <Insignia tono="rojo">0</Insignia>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-600">
                      {formatoMoneda(p.precioCosto)}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-slate-900">
                      {formatoMoneda(p.precioVenta)}
                    </td>
                    <td className="px-3 py-3 text-right text-sky-600">
                      {formatoMoneda(p.precioVentaDivisas)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <CeldaMargen producto={p} />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <p className={`font-semibold ${claseMargen(porcentajeBase)}`}>
                        {formatoPorcentaje(porcentajeBase)}
                      </p>
                      <p className={`text-[11px] ${claseMargen(porcentajeDivisas)}`}>
                        divisas: {formatoPorcentaje(porcentajeDivisas)}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => onEditar(p)}
                          aria-label={`Editar ${p.nombre}`}
                          className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          <IconoLapiz className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEliminar(p)}
                          aria-label={`Eliminar ${p.nombre}`}
                          className="grid h-8 w-8 place-items-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                        >
                          <IconoBasura className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {productos.length === 0 && (
        <p className="px-5 py-10 text-center text-sm text-slate-500">
          Aún no hay productos. Crea el primero con el botón «Nuevo producto».
        </p>
      )}
    </GlassCard>
  );
}
