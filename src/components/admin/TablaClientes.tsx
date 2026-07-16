"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconoBasura, IconoCerrar, IconoCheck, IconoLapiz, IconoUsuarios } from "@/components/icons";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatoFecha, formatoMoneda } from "@/lib/format";
import { actualizarCliente, eliminarCliente, unirClientes } from "@/lib/store";
import type { Cliente } from "@/lib/types";

export function TablaClientes({ clientes }: { clientes: Cliente[] }) {
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [procesando, setProcesando] = useState(false);
  const [enEdicion, setEnEdicion] = useState<Cliente | null>(null);
  const [nombreEdit, setNombreEdit] = useState("");
  const [telefonoEdit, setTelefonoEdit] = useState("");
  const [guardandoEdit, setGuardandoEdit] = useState(false);
  const [errorEdit, setErrorEdit] = useState("");

  function abrirEdicion(c: Cliente) {
    setEnEdicion(c);
    setNombreEdit(c.nombre);
    setTelefonoEdit(c.telefono);
    setErrorEdit("");
  }

  async function guardarEdicion() {
    if (!enEdicion || guardandoEdit) return;
    if (!nombreEdit.trim()) return setErrorEdit("El nombre no puede quedar vacío.");
    setGuardandoEdit(true);
    setErrorEdit("");
    try {
      await actualizarCliente(enEdicion.id, { nombre: nombreEdit, telefono: telefonoEdit });
      setEnEdicion(null);
    } catch (err) {
      setErrorEdit(err instanceof Error ? err.message : "No se pudo guardar el cliente.");
    } finally {
      setGuardandoEdit(false);
    }
  }

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
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => abrirEdicion(c)}
                        aria-label={`Editar ${c.nombre || c.telefono}`}
                        className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-blue-600"
                      >
                        <IconoLapiz className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => confirmarEliminar(c)}
                        aria-label={`Eliminar ${c.nombre || c.telefono}`}
                        className="grid h-8 w-8 place-items-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                      >
                        <IconoBasura className="h-4 w-4" />
                      </button>
                    </div>
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

      {/* Modal de edición */}
      <AnimatePresence>
        {enEdicion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEnEdicion(null)}
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
                <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <IconoLapiz className="h-4 w-4 text-blue-600" />
                  Editar cliente
                </h3>
                <button
                  onClick={() => setEnEdicion(null)}
                  aria-label="Cerrar"
                  className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                >
                  <IconoCerrar className="h-4 w-4" />
                </button>
              </div>

              <Campo
                etiqueta="Nombre"
                autoFocus
                value={nombreEdit}
                onChange={(e) => setNombreEdit(e.target.value)}
              />
              <Campo
                etiqueta="Teléfono (opcional)"
                inputMode="tel"
                value={telefonoEdit}
                onChange={(e) => setTelefonoEdit(e.target.value)}
              />

              <p className="text-[11px] text-slate-400">
                Corrige el nombre o teléfono. Los pedidos y el total gastado no cambian.
              </p>

              {errorEdit && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                  {errorEdit}
                </p>
              )}

              <Boton className="w-full" onClick={guardarEdicion} disabled={guardandoEdit}>
                <IconoCheck className="h-4 w-4" />
                {guardandoEdit ? "Guardando…" : "Guardar cambios"}
              </Boton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
