"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconoBasura, IconoBillete, IconoCerrar, IconoCheck, IconoDolar } from "@/components/icons";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Insignia } from "@/components/ui/Insignia";
import { precioSegunMetodo } from "@/lib/finance";
import { formatoMoneda } from "@/lib/format";
import { registrarVenta } from "@/lib/store";
import type { Cliente, MetodoPago, Producto } from "@/lib/types";

interface Props {
  abierto: boolean;
  productos: Producto[];
  clientes: Cliente[];
  onCerrar: () => void;
}

interface Linea {
  producto: Producto;
  cantidad: number;
}

export function FormularioVentaManual({ abierto, productos, clientes, onCerrar }: Props) {
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("base");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fiado, setFiado] = useState(false);
  const [fechaCobro, setFechaCobro] = useState("");
  const [seleccion, setSeleccion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (abierto) {
      setLineas([]);
      setMetodoPago("base");
      setNombre("");
      setTelefono("");
      setFiado(false);
      setFechaCobro("");
      setSeleccion("");
      setError("");
    }
  }, [abierto]);

  const disponibles = productos.filter((p) => p.stock > 0);
  const total = useMemo(
    () => lineas.reduce((acc, l) => acc + precioSegunMetodo(l.producto, metodoPago) * l.cantidad, 0),
    [lineas, metodoPago]
  );

  function agregar(id: string) {
    const p = productos.find((x) => x.id === id);
    if (!p) return;
    setLineas((prev) => {
      const existe = prev.find((l) => l.producto.id === id);
      if (existe) {
        return prev.map((l) =>
          l.producto.id === id ? { ...l, cantidad: Math.min(l.cantidad + 1, p.stock) } : l
        );
      }
      return [...prev, { producto: p, cantidad: 1 }];
    });
    setSeleccion("");
  }

  /** Al escribir/elegir un nombre, autocompleta el teléfono si el cliente ya existe. */
  function alCambiarNombre(valor: string) {
    setNombre(valor);
    const existente = clientes.find((c) => c.nombre.trim().toLowerCase() === valor.trim().toLowerCase());
    if (existente?.telefono) setTelefono(existente.telefono);
  }

  function cambiar(id: string, cantidad: number) {
    setLineas((prev) =>
      prev
        .map((l) =>
          l.producto.id === id
            ? { ...l, cantidad: Math.max(0, Math.min(cantidad, l.producto.stock)) }
            : l
        )
        .filter((l) => l.cantidad > 0)
    );
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (guardando) return;
    if (lineas.length === 0) return setError("Agrega al menos un producto.");
    if (!nombre.trim()) return setError("El nombre del cliente es obligatorio.");
    if (fiado && !fechaCobro) return setError("Indica la fecha para cobrar la deuda.");

    setGuardando(true);
    setError("");
    try {
      await registrarVenta({
        items: lineas.map(({ producto, cantidad }) => ({
          productoId: producto.id,
          nombre: producto.nombre,
          cantidad,
          precioUnitario: precioSegunMetodo(producto, metodoPago),
          costoUnitario: producto.precioCosto,
        })),
        total,
        metodoPago,
        cliente: { nombre: nombre.trim(), telefono: telefono.trim() },
        estado: fiado ? "confirmada" : "entregada",
        origen: "manual",
        fiado,
        pagado: !fiado,
        fechaCobro: fiado && fechaCobro ? new Date(`${fechaCobro}T12:00:00`).getTime() : null,
      });
      onCerrar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la venta.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCerrar}
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm"
        >
          <motion.form
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={guardar}
            className="my-8 w-full max-w-xl space-y-5 rounded-3xl border border-glass-border bg-white p-6 shadow-glass sm:p-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Registrar venta manual</h2>
              <button
                type="button"
                onClick={onCerrar}
                aria-label="Cerrar"
                className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <IconoCerrar className="h-4 w-4" />
              </button>
            </div>

            {/* Agregar productos */}
            <div className="flex gap-2">
              <select
                value={seleccion}
                onChange={(e) => agregar(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Agregar producto…</option>
                {disponibles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} — {formatoMoneda(precioSegunMetodo(p, metodoPago))} ({p.stock} en stock)
                  </option>
                ))}
              </select>
            </div>

            {/* Líneas */}
            <div className="space-y-2">
              {lineas.length === 0 && (
                <p className="rounded-2xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
                  Aún no has agregado productos a esta venta.
                </p>
              )}
              {lineas.map(({ producto, cantidad }) => {
                const unitario = precioSegunMetodo(producto, metodoPago);
                return (
                  <div
                    key={producto.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{producto.nombre}</p>
                      <p className="text-xs text-slate-500">{formatoMoneda(unitario)} c/u</p>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={producto.stock}
                      value={cantidad}
                      onChange={(e) => cambiar(producto.id, parseInt(e.target.value, 10) || 0)}
                      className="w-16 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-center text-sm text-slate-900 outline-none focus:border-blue-400"
                    />
                    <p className="w-20 text-right text-sm font-bold text-slate-900">
                      {formatoMoneda(unitario * cantidad)}
                    </p>
                    <button
                      type="button"
                      onClick={() => cambiar(producto.id, 0)}
                      aria-label="Quitar"
                      className="grid h-7 w-7 place-items-center rounded-lg text-rose-500 hover:bg-rose-50"
                    >
                      <IconoBasura className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Método de pago */}
            <div className="grid grid-cols-2 gap-2">
              {([
                { valor: "base", etiqueta: "Precio base", Icono: IconoDolar },
                { valor: "divisas", etiqueta: "Divisas en físico", Icono: IconoBillete },
              ] as const).map(({ valor, etiqueta, Icono }) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setMetodoPago(valor)}
                  className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-xs font-medium transition-colors ${
                    metodoPago === valor
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Icono className="h-4 w-4" />
                  {etiqueta}
                </button>
              ))}
            </div>

            {/* Cliente: escribe uno nuevo o elige uno ya guardado */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo
                etiqueta="Nombre del cliente *"
                list="clientes-guardados"
                placeholder="Escribe o elige un cliente"
                autoComplete="off"
                value={nombre}
                onChange={(e) => alCambiarNombre(e.target.value)}
              />
              <datalist id="clientes-guardados">
                {clientes.map((c) => (
                  <option key={c.id} value={c.nombre}>
                    {c.telefono ? `${c.telefono} · ` : ""}
                    {c.pedidos} pedido{c.pedidos === 1 ? "" : "s"}
                  </option>
                ))}
              </datalist>
              <Campo
                etiqueta="Teléfono (opcional)"
                inputMode="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>
            {clientes.length > 0 && (
              <p className="-mt-2 text-[11px] text-slate-400">
                Toca el campo de nombre para elegir un cliente ya registrado.
              </p>
            )}

            {/* Fiado */}
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={fiado}
                  onChange={(e) => setFiado(e.target.checked)}
                  className="h-5 w-5 rounded-md border-slate-300 accent-blue-600"
                />
                <span className="text-sm font-medium text-slate-700">
                  Venta a crédito (fiado) — el cliente queda debiendo
                </span>
              </label>
              {fiado && (
                <Campo
                  etiqueta="¿Para qué día se cobra?"
                  type="date"
                  value={fechaCobro}
                  onChange={(e) => setFechaCobro(e.target.value)}
                />
              )}
            </div>

            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-500">Total</span>
                <p className="text-2xl font-bold text-slate-900">{formatoMoneda(total)}</p>
              </div>
              <div className="flex items-center gap-2">
                {fiado && <Insignia tono="ambar">Por cobrar</Insignia>}
                <Boton type="submit" disabled={guardando}>
                  <IconoCheck className="h-4 w-4" />
                  {guardando ? "Guardando…" : "Registrar venta"}
                </Boton>
              </div>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
