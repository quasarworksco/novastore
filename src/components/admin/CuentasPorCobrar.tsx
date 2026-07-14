"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  IconoAlerta,
  IconoBillete,
  IconoCerrar,
  IconoCheck,
  IconoMas,
  IconoReloj,
  IconoUsuarios,
} from "@/components/icons";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { GlassCard } from "@/components/ui/GlassCard";
import { Insignia } from "@/components/ui/Insignia";
import { StatCard } from "./StatCard";
import { formatoFecha, formatoMoneda } from "@/lib/format";
import { abonarVenta, actualizarVenta } from "@/lib/store";
import { saldoPendiente, totalAbonado, type Venta } from "@/lib/types";

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
  const [ventaEnAbono, setVentaEnAbono] = useState<Venta | null>(null);
  const [montoAbono, setMontoAbono] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const deudas = ventas
    .filter((v) => v.fiado && !v.pagado && v.estado !== "cancelada")
    .sort((a, b) => (a.fechaCobro ?? Infinity) - (b.fechaCobro ?? Infinity));

  const totalPorCobrar = deudas.reduce((acc, v) => acc + saldoPendiente(v), 0);
  const vencidas = deudas.filter((v) => {
    const d = diasRestantes(v.fechaCobro);
    return d !== null && d < 0;
  });
  const totalVencido = vencidas.reduce((acc, v) => acc + saldoPendiente(v), 0);

  // Total adeudado agrupado por cliente.
  const porCliente = useMemo(() => {
    const mapa = new Map<
      string,
      { nombre: string; telefono: string; saldo: number; deudas: number; proximaFecha: number | null }
    >();
    for (const v of deudas) {
      const clave = (v.cliente.telefono || v.cliente.nombre || "—").toLowerCase();
      const actual = mapa.get(clave) ?? {
        nombre: v.cliente.nombre || "—",
        telefono: v.cliente.telefono || "",
        saldo: 0,
        deudas: 0,
        proximaFecha: null,
      };
      actual.saldo += saldoPendiente(v);
      actual.deudas += 1;
      if (v.fechaCobro !== null) {
        actual.proximaFecha =
          actual.proximaFecha === null ? v.fechaCobro : Math.min(actual.proximaFecha, v.fechaCobro);
      }
      if (!actual.telefono && v.cliente.telefono) actual.telefono = v.cliente.telefono;
      mapa.set(clave, actual);
    }
    return Array.from(mapa.values()).sort((a, b) => b.saldo - a.saldo);
  }, [deudas]);

  function abrirAbono(v: Venta) {
    setVentaEnAbono(v);
    setMontoAbono("");
    setError("");
  }

  async function registrarAbono() {
    if (!ventaEnAbono || guardando) return;
    const saldo = saldoPendiente(ventaEnAbono);
    const monto = parseFloat(montoAbono);
    if (!(monto > 0)) return setError("Indica un monto válido.");
    if (monto > saldo + 0.005) return setError(`El abono no puede superar el saldo (${formatoMoneda(saldo)}).`);

    setGuardando(true);
    setError("");
    try {
      await abonarVenta(ventaEnAbono, monto);
      setVentaEnAbono(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el abono.");
    } finally {
      setGuardando(false);
    }
  }

  async function marcarPagada(v: Venta) {
    const saldo = saldoPendiente(v);
    if (saldo > 0) {
      await abonarVenta(v, saldo);
    } else {
      await actualizarVenta(v.id, { pagado: true, estado: "entregada" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          etiqueta="Saldo por cobrar"
          valor={formatoMoneda(totalPorCobrar)}
          detalle={`${deudas.length} ${deudas.length === 1 ? "deuda" : "deudas"} activas`}
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

      {/* Total adeudado por cliente */}
      {porCliente.length > 0 && (
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-600">
            <IconoUsuarios className="h-4 w-4 text-blue-500" />
            Total adeudado por cliente
          </h3>
          <GlassCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5 font-medium">Cliente</th>
                    <th className="px-3 py-3.5 text-right font-medium">Deudas</th>
                    <th className="px-3 py-3.5 font-medium">Próximo cobro</th>
                    <th className="px-5 py-3.5 text-right font-medium">Total adeudado</th>
                  </tr>
                </thead>
                <tbody>
                  {porCliente.map((c) => {
                    const dias = diasRestantes(c.proximaFecha);
                    const est = estadoCobro(dias);
                    return (
                      <tr
                        key={`${c.nombre}-${c.telefono}`}
                        className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-900">{c.nombre}</p>
                          {c.telefono && <p className="text-xs text-slate-500">{c.telefono}</p>}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-600">{c.deudas}</td>
                        <td className="px-3 py-3">
                          <Insignia tono={est.tono}>{est.texto}</Insignia>
                        </td>
                        <td className="px-5 py-3 text-right text-base font-bold text-slate-900">
                          {formatoMoneda(c.saldo)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </section>
      )}

      <h3 className="pt-2 text-sm font-semibold uppercase tracking-wider text-slate-600">
        Detalle de deudas
      </h3>
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4 font-medium">Cliente</th>
                <th className="px-3 py-4 font-medium">Detalle</th>
                <th className="px-3 py-4 text-right font-medium">Total</th>
                <th className="px-3 py-4 text-right font-medium">Abonado</th>
                <th className="px-3 py-4 text-right font-medium">Saldo</th>
                <th className="px-3 py-4 font-medium">Cobrar el</th>
                <th className="px-3 py-4 font-medium">Estado</th>
                <th className="px-5 py-4 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {deudas.map((v) => {
                const dias = diasRestantes(v.fechaCobro);
                const est = estadoCobro(dias);
                const abonado = totalAbonado(v);
                const saldo = saldoPendiente(v);
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
                    <td className="max-w-[200px] px-3 py-3 text-xs text-slate-600">
                      {v.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(", ")}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-600">
                      {formatoMoneda(v.total)}
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-600">
                      {abonado > 0 ? formatoMoneda(abonado) : "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-slate-900">
                      {formatoMoneda(saldo)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                      {v.fechaCobro ? formatoFecha(v.fechaCobro).split(",")[0] : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <Insignia tono={est.tono}>{est.texto}</Insignia>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => abrirAbono(v)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                        >
                          <IconoMas className="h-3.5 w-3.5" />
                          Abonar
                        </button>
                        <button
                          onClick={() => marcarPagada(v)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <IconoCheck className="h-3.5 w-3.5" />
                          Cobrado
                        </button>
                      </div>
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

      {/* Modal de abono */}
      <AnimatePresence>
        {ventaEnAbono && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setVentaEnAbono(null)}
            className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm space-y-4 rounded-3xl border border-glass-border bg-white p-6 shadow-glass"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Registrar abono</h3>
                <button
                  onClick={() => setVentaEnAbono(null)}
                  aria-label="Cerrar"
                  className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                >
                  <IconoCerrar className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-medium text-slate-900">{ventaEnAbono.cliente.nombre}</p>
                <p className="mt-1 flex justify-between text-xs text-slate-500">
                  <span>Saldo pendiente</span>
                  <span className="font-bold text-slate-900">
                    {formatoMoneda(saldoPendiente(ventaEnAbono))}
                  </span>
                </p>
                {(ventaEnAbono.abonos ?? []).length > 0 && (
                  <ul className="mt-2 space-y-0.5 border-t border-slate-200 pt-2 text-[11px] text-slate-500">
                    {(ventaEnAbono.abonos ?? []).map((a, i) => (
                      <li key={i} className="flex justify-between">
                        <span>{formatoFecha(a.fecha).split(",")[0]}</span>
                        <span className="text-emerald-600">+{formatoMoneda(a.monto)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Campo
                etiqueta="Monto del abono (USD)"
                type="number"
                min={0}
                step="0.01"
                autoFocus
                value={montoAbono}
                onChange={(e) => setMontoAbono(e.target.value)}
              />

              {error && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                  {error}
                </p>
              )}

              <Boton className="w-full" onClick={registrarAbono} disabled={guardando}>
                <IconoCheck className="h-4 w-4" />
                {guardando ? "Guardando…" : "Registrar abono"}
              </Boton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
