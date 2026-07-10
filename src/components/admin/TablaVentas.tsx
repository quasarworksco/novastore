"use client";

import { IconoBillete, IconoDolar } from "@/components/icons";
import { GlassCard } from "@/components/ui/GlassCard";
import { Insignia } from "@/components/ui/Insignia";
import { formatoFecha, formatoMoneda } from "@/lib/format";
import { actualizarEstadoVenta } from "@/lib/store";
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
  return (
    <GlassCard className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-glass-border text-[11px] uppercase tracking-wider text-slate-400">
              <th className="px-5 py-4 font-medium">Fecha</th>
              <th className="px-3 py-4 font-medium">Cliente</th>
              <th className="px-3 py-4 font-medium">Ítems</th>
              <th className="px-3 py-4 font-medium">Pago</th>
              <th className="px-3 py-4 text-right font-medium">Total</th>
              <th className="px-3 py-4 text-right font-medium">Ganancia</th>
              <th className="px-5 py-4 text-right font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((v) => {
              const ganancia = gananciaVenta(v);
              return (
                <tr
                  key={v.id}
                  className="border-b border-glass-border/50 transition-colors last:border-0 hover:bg-white/[0.04]"
                >
                  <td className="whitespace-nowrap px-5 py-3 text-slate-300">
                    {formatoFecha(v.creadoEn)}
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-white">{v.cliente.nombre || "—"}</p>
                    <p className="text-xs text-slate-400">{v.cliente.telefono}</p>
                  </td>
                  <td className="max-w-[260px] px-3 py-3 text-xs text-slate-300">
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
                  <td className="px-3 py-3 text-right font-semibold text-white">
                    {formatoMoneda(v.total)}
                  </td>
                  <td
                    className={`px-3 py-3 text-right font-semibold ${
                      ganancia >= 0 ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    {formatoMoneda(ganancia)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <select
                      value={v.estado}
                      onChange={(e) =>
                        actualizarEstadoVenta(v.id, e.target.value as Venta["estado"])
                      }
                      className={`cursor-pointer rounded-full border bg-slate-950/60 px-2.5 py-1 text-xs font-medium outline-none ${
                        {
                          ambar: "border-amber-400/30 text-amber-300",
                          violeta: "border-violet-400/30 text-violet-300",
                          verde: "border-emerald-400/30 text-emerald-300",
                          rojo: "border-rose-400/30 text-rose-300",
                        }[tonoEstado[v.estado]]
                      }`}
                    >
                      {estados.map((e) => (
                        <option key={e} value={e} className="bg-slate-900 text-slate-200">
                          {e}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {ventas.length === 0 && (
        <p className="px-5 py-10 text-center text-sm text-slate-400">
          Todavía no hay ventas registradas. Cuando un cliente pida por WhatsApp, el pedido
          aparecerá aquí.
        </p>
      )}
    </GlassCard>
  );
}
