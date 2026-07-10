"use client";

import { useState } from "react";
import { IconoBasura, IconoUsuarios } from "@/components/icons";
import { Boton } from "@/components/ui/Boton";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatoFecha, formatoMoneda } from "@/lib/format";
import { eliminarCliente, unirClientes } from "@/lib/store";
import type { Cliente } from "@/lib/types";

export function TablaClientes({ clientes }: { clientes: Cliente[] }) {
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [procesando, setProcesando] = useState(false);

  function alternar(id: string) {
    setSeleccion((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }

  async function confirmarEliminar(c: Cliente) {
    if (
      window.confirm(
        `¿Seguro que quieres eliminar al cliente «${c.nombre || c.telefono}»?\n\nSus ventas registradas se conservan; solo se borra la ficha del cliente. Esta acción no se puede deshacer.`
      )
    ) {
      await eliminarCliente(c.id);
      setSeleccion((prev) => {
        const s = new Set(prev);
        s.delete(c.id);
        return s;
      });
    }
  }

  async function confirmarUnion() {
    if (procesando) return;
    const elegidos = clientes.filter((c) => seleccion.has(c.id));
    if (elegidos.length < 2) return;

    // El destino es el cliente con más pedidos (conserva su nombre).
    const [destino, ...duplicados] = [...elegidos].sort((a, b) => b.pedidos - a.pedidos);
    const nombres = elegidos.map((c) => c.nombre || c.telefono).join(", ");

    if (
      window.confirm(
        `¿Seguro que quieres unir estos ${elegidos.length} clientes?\n\n${nombres}\n\nSe conservará el nombre «${destino.nombre || destino.telefono}» y se sumarán sus pedidos y totales. Esta acción no se puede deshacer.`
      )
    ) {
      setProcesando(true);
      try {
        await unirClientes(destino, duplicados);
        setSeleccion(new Set());
      } finally {
        setProcesando(false);
      }
    }
  }

  return (
    <div className="space-y-4">
      {seleccion.size >= 2 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-sm font-medium text-blue-800">
            {seleccion.size} clientes seleccionados
          </p>
          <Boton onClick={confirmarUnion} disabled={procesando}>
            <IconoUsuarios className="h-4 w-4" />
            {procesando ? "Uniendo…" : "Unir clientes"}
          </Boton>
        </div>
      )}

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="w-10 px-4 py-4" aria-label="Seleccionar" />
                <th className="px-3 py-4 font-medium">Cliente</th>
                <th className="px-3 py-4 font-medium">Teléfono</th>
                <th className="px-3 py-4 text-right font-medium">Pedidos</th>
                <th className="px-3 py-4 text-right font-medium">Total gastado</th>
                <th className="px-3 py-4 text-right font-medium">Último pedido</th>
                <th className="px-5 py-4 text-right font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr
                  key={c.id}
                  className={`border-b border-slate-100 transition-colors last:border-0 ${
                    seleccion.has(c.id) ? "bg-blue-50/60" : "hover:bg-slate-50"
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={seleccion.has(c.id)}
                      onChange={() => alternar(c.id)}
                      aria-label={`Seleccionar ${c.nombre || c.telefono}`}
                      className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                    />
                  </td>
                  <td className="px-3 py-3 font-medium text-slate-900">{c.nombre || "—"}</td>
                  <td className="px-3 py-3 text-slate-600">{c.telefono || "—"}</td>
                  <td className="px-3 py-3 text-right text-slate-700">{c.pedidos}</td>
                  <td className="px-3 py-3 text-right font-semibold text-emerald-600">
                    {formatoMoneda(c.totalGastado)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right text-slate-500">
                    {formatoFecha(c.ultimoPedido)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => confirmarEliminar(c)}
                      aria-label={`Eliminar ${c.nombre || c.telefono}`}
                      className="ml-auto grid h-8 w-8 place-items-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                    >
                      <IconoBasura className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {clientes.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            Aún no hay clientes registrados. Se crean automáticamente con cada venta.
          </p>
        )}
      </GlassCard>

      {clientes.length >= 2 && seleccion.size < 2 && (
        <p className="text-xs text-slate-400">
          Marca dos o más clientes con la casilla para unir registros duplicados.
        </p>
      )}
    </div>
  );
}
