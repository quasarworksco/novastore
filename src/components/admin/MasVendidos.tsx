"use client";

import { useMemo } from "react";
import { IconoCohete } from "@/components/icons";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatoMoneda } from "@/lib/format";
import type { Venta } from "@/lib/types";

interface Fila {
  nombre: string;
  unidades: number;
  ingreso: number;
}

/**
 * Ranking de productos más vendidos (por unidades), calculado a partir de
 * los ítems de todas las ventas no canceladas. Incluye ventas fiadas, ya que
 * cuentan como unidades que salieron del inventario.
 */
export function MasVendidos({ ventas, limite = 5 }: { ventas: Venta[]; limite?: number }) {
  const ranking = useMemo<Fila[]>(() => {
    const mapa = new Map<string, Fila>();
    for (const v of ventas) {
      if (v.estado === "cancelada") continue;
      for (const it of v.items) {
        const clave = it.productoId || it.nombre;
        const actual = mapa.get(clave) ?? { nombre: it.nombre, unidades: 0, ingreso: 0 };
        actual.unidades += it.cantidad;
        actual.ingreso += it.precioUnitario * it.cantidad;
        mapa.set(clave, actual);
      }
    }
    return Array.from(mapa.values())
      .sort((a, b) => b.unidades - a.unidades || b.ingreso - a.ingreso)
      .slice(0, limite);
  }, [ventas, limite]);

  const maximo = ranking[0]?.unidades ?? 0;

  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-600">
        <IconoCohete className="h-4 w-4 text-blue-500" />
        Más vendidos
      </h3>
      <GlassCard className="p-5 sm:p-6">
        {ranking.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            Aún no hay ventas registradas. Aquí verás los productos más vendidos.
          </p>
        ) : (
          <ol className="space-y-4">
            {ranking.map((f, i) => (
              <li key={`${f.nombre}-${i}`} className="flex items-center gap-4">
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                    i === 0
                      ? "bg-blue-600 text-white"
                      : i === 1
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-slate-900">{f.nombre}</p>
                    <p className="shrink-0 text-xs text-slate-500">
                      <span className="font-bold text-slate-900">{f.unidades}</span>{" "}
                      {f.unidades === 1 ? "unidad" : "uds"} · {formatoMoneda(f.ingreso)}
                    </p>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-400"
                      style={{ width: `${maximo > 0 ? (f.unidades / maximo) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </GlassCard>
    </section>
  );
}
