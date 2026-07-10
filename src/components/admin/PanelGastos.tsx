"use client";

import { useState, type FormEvent } from "react";
import {
  IconoBasura,
  IconoDolar,
  IconoMas,
  IconoTendenciaAlta,
  IconoTendenciaBaja,
} from "@/components/icons";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { GlassCard } from "@/components/ui/GlassCard";
import { Insignia } from "@/components/ui/Insignia";
import { StatCard } from "./StatCard";
import { formatoFecha, formatoMoneda } from "@/lib/format";
import { crearGasto, eliminarGasto } from "@/lib/store";
import type { Gasto, Venta } from "@/lib/types";

const CATEGORIAS_GASTO = ["Proveedores", "Delivery", "Servicios", "Empaques", "Otros"];

/** Ganancia bruta de las ventas cobradas: Σ (precio − costo) × cantidad. */
export function gananciaBruta(ventas: Venta[]): number {
  return ventas
    .filter((v) => v.estado !== "cancelada" && v.pagado)
    .reduce(
      (acc, v) =>
        acc +
        v.items.reduce((s, i) => s + (i.precioUnitario - i.costoUnitario) * i.cantidad, 0),
      0
    );
}

export function PanelGastos({ gastos, ventas }: { gastos: Gasto[]; ventas: Venta[] }) {
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS_GASTO[0]);
  const [monto, setMonto] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const totalGastos = gastos.reduce((acc, g) => acc + g.monto, 0);
  const bruta = gananciaBruta(ventas);
  const neta = bruta - totalGastos;

  async function agregar(e: FormEvent) {
    e.preventDefault();
    if (guardando) return;
    const valor = parseFloat(monto);
    if (!descripcion.trim()) return setError("Describe el gasto.");
    if (!(valor > 0)) return setError("Indica un monto válido.");

    setGuardando(true);
    setError("");
    try {
      await crearGasto({ descripcion: descripcion.trim(), categoria, monto: valor });
      setDescripcion("");
      setMonto("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el gasto.");
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminar(g: Gasto) {
    if (window.confirm(`¿Eliminar el gasto «${g.descripcion}»?`)) {
      await eliminarGasto(g.id);
    }
  }

  return (
    <div className="space-y-6">
      {/* Resumen: bruta − gastos = neta */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          etiqueta="Ganancia bruta"
          valor={formatoMoneda(bruta)}
          detalle="Ventas cobradas − costo de productos"
          icono={IconoTendenciaAlta}
          tono="verde"
        />
        <StatCard
          etiqueta="Gastos totales"
          valor={formatoMoneda(totalGastos)}
          detalle={`${gastos.length} gastos registrados`}
          icono={IconoTendenciaBaja}
          tono="rojo"
        />
        <StatCard
          etiqueta="Ganancia neta"
          valor={formatoMoneda(neta)}
          detalle="Bruta − gastos (para reinvertir)"
          icono={IconoDolar}
          tono={neta >= 0 ? "verde" : "rojo"}
        />
      </div>

      {/* Registrar gasto */}
      <GlassCard className="p-5">
        <form onSubmit={agregar} className="grid gap-3 sm:grid-cols-[1fr_170px_130px_auto]">
          <Campo
            etiqueta="Descripción *"
            placeholder="Ej.: Compra a proveedor de perfumes"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Categoría
            </span>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {CATEGORIAS_GASTO.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <Campo
            etiqueta="Monto (USD) *"
            type="number"
            min={0}
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
          />
          <div className="flex items-end">
            <Boton type="submit" disabled={guardando} className="w-full sm:w-auto">
              <IconoMas className="h-4 w-4" />
              {guardando ? "Guardando…" : "Agregar"}
            </Boton>
          </div>
        </form>
        {error && (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
            {error}
          </p>
        )}
      </GlassCard>

      {/* Historial */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4 font-medium">Fecha</th>
                <th className="px-3 py-4 font-medium">Descripción</th>
                <th className="px-3 py-4 font-medium">Categoría</th>
                <th className="px-3 py-4 text-right font-medium">Monto</th>
                <th className="px-5 py-4 text-right font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
              {gastos.map((g) => (
                <tr
                  key={g.id}
                  className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
                >
                  <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                    {formatoFecha(g.creadoEn)}
                  </td>
                  <td className="px-3 py-3 font-medium text-slate-900">{g.descripcion}</td>
                  <td className="px-3 py-3">
                    <Insignia tono={g.categoria === "Proveedores" ? "violeta" : "neutro"}>
                      {g.categoria}
                    </Insignia>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-rose-600">
                    −{formatoMoneda(g.monto)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => confirmarEliminar(g)}
                      aria-label={`Eliminar ${g.descripcion}`}
                      className="grid h-8 w-8 place-items-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 ml-auto"
                    >
                      <IconoBasura className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {gastos.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            Sin gastos registrados. Anota aquí las compras a proveedores y otros gastos para ver
            tu ganancia neta real.
          </p>
        )}
      </GlassCard>
    </div>
  );
}
