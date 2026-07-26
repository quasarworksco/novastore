"use client";

import Image from "next/image";
import { Fragment, useMemo } from "react";
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
import { imagenOptimizada } from "@/lib/imagen";
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
  // Agrupar por categoría (orden alfabético); dentro de cada grupo, los
  // disponibles primero y las agotadas/inactivas al final. Así las gorras
  // (y sus modelos ya vendidos) quedan juntas y aparte del resto.
  const grupos = useMemo(() => {
    const mapa = new Map<string, Producto[]>();
    for (const p of productos) {
      const cat = p.categoria || "General";
      const lista = mapa.get(cat);
      if (lista) lista.push(p);
      else mapa.set(cat, [p]);
    }
    const entradas = Array.from(mapa.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    for (const [, items] of entradas) {
      items.sort((a, b) => {
        const dispA = a.activo && a.stock > 0 ? 0 : 1;
        const dispB = b.activo && b.stock > 0 ? 0 : 1;
        if (dispA !== dispB) return dispA - dispB;
        return a.nombre.localeCompare(b.nombre);
      });
    }
    return entradas;
  }, [productos]);

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
            {grupos.map(([categoria, items]) => {
              const disponibles = items.filter((p) => p.activo && p.stock > 0).length;
              return (
                <Fragment key={categoria}>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <td
                      colSpan={9}
                      className="px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                    >
                      {categoria}
                      <span className="ml-2 font-normal normal-case text-slate-400">
                        {disponibles} disponible{disponibles === 1 ? "" : "s"} · {items.length} en total
                      </span>
                    </td>
                  </tr>
                  {items.map((p) => {
                    const porcentajeBase = porcentajeGanancia(p);
                    const porcentajeDivisas = porcentajeGanancia(p, "divisas");
                    return (
                      <tr
                        key={p.id}
                        className={`border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50 ${
                          !p.activo || p.stock <= 0 ? "opacity-60" : ""
                        }`}
                      >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          {p.imagenes[0] ? (
                            <Image
                              src={imagenOptimizada(p.imagenes[0], 120)}
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
                      </tr>
                    );
                  })}
                </Fragment>
              );
            })}
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
