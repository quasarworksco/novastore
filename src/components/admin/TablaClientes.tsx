"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { formatoFecha, formatoMoneda } from "@/lib/format";
import type { Cliente } from "@/lib/types";

export function TablaClientes({ clientes }: { clientes: Cliente[] }) {
  return (
    <GlassCard className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
              <th className="px-5 py-4 font-medium">Cliente</th>
              <th className="px-3 py-4 font-medium">Teléfono</th>
              <th className="px-3 py-4 text-right font-medium">Pedidos</th>
              <th className="px-3 py-4 text-right font-medium">Total gastado</th>
              <th className="px-5 py-4 text-right font-medium">Último pedido</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr
                key={c.id}
                className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
              >
                <td className="px-5 py-3 font-medium text-slate-900">{c.nombre || "—"}</td>
                <td className="px-3 py-3 text-slate-600">{c.telefono || "—"}</td>
                <td className="px-3 py-3 text-right text-slate-700">{c.pedidos}</td>
                <td className="px-3 py-3 text-right font-semibold text-emerald-600">
                  {formatoMoneda(c.totalGastado)}
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-right text-slate-500">
                  {formatoFecha(c.ultimoPedido)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {clientes.length === 0 && (
        <p className="px-5 py-10 text-center text-sm text-slate-500">
          Aún no hay clientes registrados. Se crean automáticamente con cada pedido.
        </p>
      )}
    </GlassCard>
  );
}
