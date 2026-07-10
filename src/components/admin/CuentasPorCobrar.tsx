"use client";

import { IconoAlerta, IconoCheck, IconoReloj } from "@/components/icons";
import { GlassCard } from "@/components/ui/GlassCard";
import { Insignia } from "@/components/ui/Insignia";
import { StatCard } from "./StatCard";
import { IconoBillete } from "@/components/icons";
import { formatoFecha, formatoMoneda } from "@/lib/format";
import { actualizarVenta } from "@/lib/store";
import type { Venta } from "@/lib/types";

const DIA_MS = 86400000;

/** Días que faltan (negativo = vencido) para la fecha de cobro. */
function diasRestantes(fechaCobro: number | null): number | null {
  if (!fechaCobro) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.round((fechaCobro - hoy.getTime()) / DIA_MS);
}

function estadoCobro(dias: number | null): { tono: "verde" | "ambar" | "rojo"; texto: string } {
  if (dias === null) return { tono: "ambar", texto: "Sin fecha" };
  if (dias < 0) return { tono: "rojo", texto: `Vencido hace ${Math.abs(dias)} d` };
  if (dias === 0) return { tono: "rojo", texto: "Cobrar hoy" };
  if (dias <= 3) return { tono: "ambar", texto: `En ${dias} d` };
  return { tono: "verde", texto: `En ${dias} d` };
}

export function CuentasPorCobrar({ ventas }: { ventas: Venta[] }) {
  const deudas = ventas
    .filter((v) => v.fiado && !v.pagado && v.estado !== "cancelada")
    .sort((a, b) => (a.fechaCobro ?? Infinity) - (b.fechaCobro ?? Infinity));

  const totalPorCobrar = deudas.reduce((acc, v) => acc + v.total, 0);
  const vencidas = deudas.filter((v) => {
    const d = diasRestantes(v.fechaCobro);
    return d !== null && d < 0;
  });
  const totalVencido = vencidas.reduce((acc, v) => acc + v.total, 0);

  async function marcarPagada(id: string) {
    await actualizarVenta(id, { pagado: true, estado: "entregada" });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          etiqueta="Total por cobrar"
          valor={formatoMoneda(totalPorCobrar)}
          detalle={`${deudas.length} ${deudas.length === 1 ? "deuda" : "deudas"}`}
          icono={IconoBillete}
          tono="ambar"
        />
        <StatCard
          etiqueta="Vencido"
          valor={formatoMoneda(totalVencido)}
          detalle={`${vencidas.length} sin cobrar a tiempo`}
          icono={IconoAlerta}
          tono={totalVencido > 0 ? "rojo" : "verde"}
        />
        <StatCard
          etiqueta="Clientes que deben"
          valor={String(new Set(deudas.map((d) => d.cliente.nombre || d.cliente.telefono)).size)}
          detalle="Con saldo pendiente"
          icono={IconoReloj}
          tono="cian"
        />
      </div>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4 font-medium">Cliente</th>
                <th className="px-3 py-4 font-medium">Detalle</th>
                <th className="px-3 py-4 text-right font-medium">Monto</th>
                <th className="px-3 py-4 font-medium">Cobrar el</th>
                <th className="px-3 py-4 font-medium">Estado</th>
                <th className="px-5 py-4 text-right font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
              {deudas.map((v) => {
                const dias = diasRestantes(v.fechaCobro);
                const est = estadoCobro(dias);
                return (
                  <tr
                    key={v.id}
                    className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{v.cliente.nombre || "—"}</p>
                      {v.cliente.telefono && (
                        <p className="text-xs text-slate-500">{v.cliente.telefono}</p>
                      )}
                    </td>
                    <td className="max-w-[240px] px-3 py-3 text-xs text-slate-600">
                      {v.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(", ")}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-900">
                      {formatoMoneda(v.total)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                      {v.fechaCobro ? formatoFecha(v.fechaCobro).split(",")[0] : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <Insignia tono={est.tono}>{est.texto}</Insignia>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => marcarPagada(v.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <IconoCheck className="h-3.5 w-3.5" />
                        Cobrado
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {deudas.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            No hay cuentas por cobrar. Las ventas marcadas como «fiado» aparecerán aquí.
          </p>
        )}
      </GlassCard>
    </div>
  );
}
