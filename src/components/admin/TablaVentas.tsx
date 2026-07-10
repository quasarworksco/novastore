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
            <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
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
                  className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
                >
                  <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                    {formatoFecha(v.creadoEn)}
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-slate-900">{v.cliente.nombre || "—"}</p>
                    <p className="text-xs text-slate-500">{v.cliente.telefono}</p>
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
                  <td className="px-5 py-3 text-right">
                    <select
                      value={v.estado}
                      onChange={(e) =>
                        actualizarEstadoVenta(v.id, e.target.value as Venta["estado"])
                      }
                      className={`cursor-pointer rounded-full border bg-white px-2.5 py-1 text-xs font-medium outline-none ${
                        {
                          ambar: "border-amber-300 text-amber-700",
                          violeta: "border-indigo-300 text-indigo-700",
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
    </GlassCard>
  );
}
