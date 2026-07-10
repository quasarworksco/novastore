"use client";

import {
  IconoAlerta,
  IconoAlmacen,
  IconoBillete,
  IconoTendenciaAlta,
} from "@/components/icons";
import { GlassCard } from "@/components/ui/GlassCard";
import { Insignia } from "@/components/ui/Insignia";
import { resumenFinanciero, UMBRAL_MARGEN_BAJO } from "@/lib/finance";
import { formatoMoneda } from "@/lib/format";
import type { Producto } from "@/lib/types";
import { StatCard } from "./StatCard";

/**
 * Resumen Financiero del inventario. Se recalcula automáticamente en cada
 * render: como los productos llegan por suscripción en tiempo real, editar
 * un producto actualiza estos totales al instante.
 */
export function ResumenFinanciero({ productos }: { productos: Producto[] }) {
  const r = resumenFinanciero(productos);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
          Resumen Financiero
        </h2>
        <div className="flex gap-2">
          {r.productosMargenBajo > 0 && (
            <Insignia tono="ambar">
              <IconoAlerta className="h-3.5 w-3.5" />
              {r.productosMargenBajo} con margen &lt; {UMBRAL_MARGEN_BAJO}%
            </Insignia>
          )}
          {r.productosSinStock > 0 && (
            <Insignia tono="rojo">
              <IconoAlerta className="h-3.5 w-3.5" />
              {r.productosSinStock} sin stock
            </Insignia>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          etiqueta="Valor Total del Inventario"
          valor={formatoMoneda(r.valorInventario)}
          detalle={`${r.unidadesEnStock} unidades × costo`}
          icono={IconoAlmacen}
          tono="cian"
        />
        <StatCard
          etiqueta="Proyección de Ventas (base)"
          valor={formatoMoneda(r.proyeccionVenta)}
          detalle="Todo el stock a precio base"
          icono={IconoTendenciaAlta}
          tono="violeta"
        />
        <StatCard
          etiqueta="Proyección en Divisas"
          valor={formatoMoneda(r.proyeccionVentaDivisas)}
          detalle="Todo el stock a precio promocional"
          icono={IconoBillete}
          tono="cian"
        />
        <StatCard
          etiqueta="Ganancia Proyectada"
          valor={formatoMoneda(r.gananciaProyectada)}
          detalle={`En divisas: ${formatoMoneda(r.gananciaProyectadaDivisas)}`}
          icono={IconoTendenciaAlta}
          tono={r.gananciaProyectada >= 0 ? "verde" : "rojo"}
        />
      </div>

      <GlassCard className="p-4 text-xs leading-relaxed text-slate-500">
        La <span className="font-medium text-slate-700">proyección de ventas</span> asume la venta de todo el
        stock actual al precio vigente; la{" "}
        <span className="font-medium text-emerald-600">ganancia proyectada</span> descuenta el valor del
        inventario a costo. Los montos se recalculan automáticamente al crear, editar o eliminar
        productos.
      </GlassCard>
    </section>
  );
}
