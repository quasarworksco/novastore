"use client";

import { useState } from "react";
import {
  IconoBasura,
  IconoBillete,
  IconoCerrar,
  IconoCheck,
  IconoDolar,
  IconoRecibo,
} from "@/components/icons";
import { ReciboVenta } from "@/components/admin/ReciboVenta";
import { GlassCard } from "@/components/ui/GlassCard";
import { Insignia } from "@/components/ui/Insignia";
import { formatoFecha, formatoMoneda } from "@/lib/format";
import { actualizarEstadoVenta, aprobarVenta, eliminarVenta, rechazarVenta } from "@/lib/store";
import type { Venta } from "@/lib/types";

const tonoEstado: Record<Venta["estado"], "ambar" | "violeta" | "verde" | "rojo"> = {
  pendiente: "ambar",
  confirmada: "violeta",
  entregada: "verde",
  cancelada: "rojo",
};

const estados: Venta["estado"][] = ["pendiente", "confirmada", "entregada", "cancelada"];

function gananciaVenta(v: Venta): number {
  return v.items.reduce(
    (acc, item) => acc + (item.precioUnitario - item.costoUnitario) * item.cantidad,
    0
  );
}

export function TablaVentas({ ventas }: { ventas: Venta[] }) {
  const [ventaRecibo, setVentaRecibo] = useState<Venta | null>(null);

  async function confirmarEliminar(v: Venta) {
    const detalle = `${v.cliente.nombre || "cliente"} — ${formatoMoneda(v.total)}`;
    const unidades = v.items.reduce((a, i) => a + i.cantidad, 0);
    const notaStock =
      v.inventarioDescontado === false
        ? "Este pedido no había descontado stock, así que el inventario no cambia."
        : `Las ${unidades} unidad(es) vendidas volverán al stock de sus productos.`;
    if (
      window.confirm(
        `¿Seguro que quieres eliminar esta venta del historial?\n\n${detalle}\n\n${notaStock} Esta acción no se puede deshacer.`
      )
    ) {
      await eliminarVenta(v);
    }
  }

  async function confirmarAprobar(v: Venta) {
    const detalle = `${v.cliente.nombre || "cliente"} — ${formatoMoneda(v.total)}`;
    if (
      window.confirm(
        `¿Aprobar este pedido?\n\n${detalle}\n\nSe descontarán las unidades del inventario y la venta contará como ingreso.`
      )
    ) {
      await aprobarVenta(v);
    }
  }

  async function confirmarRechazar(v: Venta) {
    const detalle = `${v.cliente.nombre || "cliente"} — ${formatoMoneda(v.total)}`;
    if (
      window.confirm(
        `¿Rechazar este pedido?\n\n${detalle}\n\nQuedará cancelado y el inventario no se toca.`
      )
    ) {
      await rechazarVenta(v);
    }
  }

  return (
    <GlassCard className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
              <th className="px-5 py-4 font-medium">Fecha</th>
              <th className="px-3 py-4 font-medium">Cliente</th>
              <th className="px-3 py-4 font-medium">Ítems</th>
              <th className="px-3 py-4 font-medium">Pago</th>
              <th className="px-3 py-4 text-right font-medium">Total</th>
              <th className="px-3 py-4 text-right font-medium">Ganancia</th>
              <th className="px-3 py-4 text-right font-medium">Estado</th>
              <th className="px-5 py-4 text-right font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((v) => {
              const ganancia = gananciaVenta(v);
              return (
                <tr
                  key={v.id}
                  className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
                >
                  <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                    {formatoFecha(v.creadoEn)}
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-slate-900">{v.cliente.nombre || "—"}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      {v.cliente.telefono && (
                        <span className="text-xs text-slate-500">{v.cliente.telefono}</span>
                      )}
                      {v.origen === "manual" && <Insignia tono="neutro">Manual</Insignia>}
                      {v.fiado && !v.pagado && <Insignia tono="ambar">Debe</Insignia>}
                    </div>
                  </td>
                  <td className="max-w-[260px] px-3 py-3 text-xs text-slate-600">
                    {v.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(", ")}
                  </td>
                  <td className="px-3 py-3">
                    {v.metodoPago === "divisas" ? (
                      <Insignia tono="verde">
                        <IconoBillete className="h-3.5 w-3.5" />
                        Divisas
                      </Insignia>
                    ) : (
                      <Insignia tono="neutro">
                        <IconoDolar className="h-3.5 w-3.5" />
                        Base
                      </Insignia>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-slate-900">
                    {formatoMoneda(v.total)}
                  </td>
                  <td
                    className={`px-3 py-3 text-right font-semibold ${
                      ganancia >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {formatoMoneda(ganancia)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {v.estado === "pendiente" && v.inventarioDescontado === false ? (
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => confirmarAprobar(v)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <IconoCheck className="h-3.5 w-3.5" />
                          Aprobar
                        </button>
                        <button
                          onClick={() => confirmarRechazar(v)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100"
                        >
                          <IconoCerrar className="h-3.5 w-3.5" />
                          Rechazar
                        </button>
                      </div>
                    ) : (
                      <select
                        value={v.estado}
                        onChange={(e) =>
                          actualizarEstadoVenta(v, e.target.value as Venta["estado"])
                        }
                        className={`cursor-pointer rounded-full border bg-white px-2.5 py-1 text-xs font-medium outline-none ${
                          {
                            ambar: "border-amber-300 text-amber-700",
                            violeta: "border-blue-300 text-blue-700",
                            verde: "border-emerald-300 text-emerald-700",
                            rojo: "border-rose-300 text-rose-600",
                          }[tonoEstado[v.estado]]
                        }`}
                      >
                        {estados.map((e) => (
                          <option key={e} value={e} className="bg-white text-slate-700">
                            {e}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setVentaRecibo(v)}
                        aria-label="Ver recibo"
                        title="Ver recibo"
                        className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-blue-600"
                      >
                        <IconoRecibo className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => confirmarEliminar(v)}
                        aria-label="Eliminar venta"
                        className="grid h-8 w-8 place-items-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                      >
                        <IconoBasura className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {ventas.length === 0 && (
        <p className="px-5 py-10 text-center text-sm text-slate-500">
          Todavía no hay ventas registradas. Cuando un cliente pida por WhatsApp, el pedido
          aparecerá aquí.
        </p>
      )}

      <ReciboVenta venta={ventaRecibo} onCerrar={() => setVentaRecibo(null)} />
    </GlassCard>
  );
}
