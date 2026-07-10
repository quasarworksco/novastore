"use client";

import { useEffect, useState, type FormEvent } from "react";
import { IconoBillete, IconoCheck } from "@/components/icons";
import { Boton } from "@/components/ui/Boton";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatoFecha } from "@/lib/format";
import { guardarTasaBs, suscribirConfig } from "@/lib/store";

/**
 * Configuración de la tasa de cambio (Bs por USD). Con tasa > 0 la tienda
 * muestra los precios en bolívares en pequeño junto al precio en dólares.
 */
export function TasaCambio() {
  const [tasa, setTasa] = useState("");
  const [actualizadoEn, setActualizadoEn] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(
    () =>
      suscribirConfig((c) => {
        setTasa(c.tasaBs > 0 ? String(c.tasaBs) : "");
        setActualizadoEn(c.actualizadoEn);
      }),
    []
  );

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (guardando) return;
    const valor = parseFloat(tasa);
    if (!(valor >= 0)) return;
    setGuardando(true);
    setGuardado(false);
    try {
      await guardarTasaBs(valor);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2500);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <GlassCard className="p-5">
      <form onSubmit={guardar} className="flex flex-wrap items-end gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-50 text-sky-600">
          <IconoBillete className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Tasa del día (Bs por 1 USD)
            </span>
            <input
              type="number"
              min={0}
              step="0.01"
              placeholder="Ej.: 60.50 (0 = ocultar Bs)"
              value={tasa}
              onChange={(e) => setTasa(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          {actualizadoEn > 0 && (
            <p className="mt-1 text-[11px] text-slate-400">
              Última actualización: {formatoFecha(actualizadoEn)}
            </p>
          )}
        </div>
        <Boton type="submit" disabled={guardando}>
          <IconoCheck className="h-4 w-4" />
          {guardando ? "Guardando…" : guardado ? "Guardada" : "Guardar tasa"}
        </Boton>
      </form>
    </GlassCard>
  );
}
