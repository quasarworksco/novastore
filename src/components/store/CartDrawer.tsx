"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  IconoBasura,
  IconoBillete,
  IconoBolsa,
  IconoCerrar,
  IconoDolar,
  IconoMas,
  IconoMenos,
  IconoWhatsApp,
} from "@/components/icons";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { useCarrito } from "@/lib/cart-context";
import { precioSegunMetodo } from "@/lib/finance";
import { formatoMoneda } from "@/lib/format";
import { registrarVenta } from "@/lib/store";
import type { MetodoPago } from "@/lib/types";
import { enlacePedidoWhatsApp } from "@/lib/whatsapp";

/**
 * Carrito flotante: panel lateral animado que no recarga la página.
 * El botón "Pedir" registra la venta en Firestore y redirige a WhatsApp
 * con el resumen del pedido prellenado.
 */
export function CartDrawer() {
  const carrito = useCarrito();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [enviando, setEnviando] = useState(false);

  const listoParaPedir = carrito.items.length > 0 && nombre.trim().length > 1;

  async function pedir() {
    if (!listoParaPedir || enviando) return;
    setEnviando(true);

    const cliente = { nombre: nombre.trim(), telefono: telefono.trim() };
    const url = enlacePedidoWhatsApp(carrito.items, carrito.metodoPago, cliente);

    try {
      await registrarVenta({
        items: carrito.items.map(({ producto, cantidad }) => ({
          productoId: producto.id,
          nombre: producto.nombre,
          cantidad,
          precioUnitario: precioSegunMetodo(producto, carrito.metodoPago),
          costoUnitario: producto.precioCosto,
        })),
        total: carrito.total,
        metodoPago: carrito.metodoPago,
        cliente,
      });
    } catch {
      // Aunque falle el registro, no bloqueamos el pedido por WhatsApp.
    } finally {
      setEnviando(false);
    }

    window.open(url, "_blank", "noopener,noreferrer");
    carrito.vaciar();
    carrito.cerrar();
  }

  const opcionesPago: { valor: MetodoPago; etiqueta: string; Icono: typeof IconoDolar }[] = [
    { valor: "base", etiqueta: "Precio base", Icono: IconoDolar },
    { valor: "divisas", etiqueta: "Divisas en físico", Icono: IconoBillete },
  ];

  return (
    <AnimatePresence>
      {carrito.abierto && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={carrito.cerrar}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
            className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-glass"
          >
            <header className="flex items-center justify-between border-b border-slate-200 p-5">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <IconoBolsa className="h-5 w-5 text-blue-500" />
                Tu carrito
                {carrito.totalItems > 0 && (
                  <span className="text-sm font-normal text-slate-500">
                    ({carrito.totalItems} {carrito.totalItems === 1 ? "ítem" : "ítems"})
                  </span>
                )}
              </h2>
              <button
                onClick={carrito.cerrar}
                aria-label="Cerrar carrito"
                className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <IconoCerrar className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {carrito.items.length === 0 && (
                <div className="grid h-full place-items-center text-center">
                  <div className="space-y-3">
                    <IconoBolsa className="mx-auto h-12 w-12 text-slate-300" />
                    <p className="text-sm text-slate-500">Tu carrito está vacío.</p>
                  </div>
                </div>
              )}

              <AnimatePresence initial={false}>
                {carrito.items.map(({ producto, cantidad }) => {
                  const unitario = precioSegunMetodo(producto, carrito.metodoPago);
                  return (
                    <motion.div
                      key={producto.id}
                      layout
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
                      className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        {producto.imagenes[0] && (
                          <Image
                            src={producto.imagenes[0]}
                            alt={producto.nombre}
                            fill
                            sizes="64px"
                            className="object-cover"
                            unoptimized={producto.imagenes[0].startsWith("data:")}
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {producto.nombre}
                        </p>
                        <p className="text-xs text-slate-500">{formatoMoneda(unitario)} c/u</p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() => carrito.cambiarCantidad(producto.id, cantidad - 1)}
                            aria-label="Restar unidad"
                            className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                          >
                            <IconoMenos className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold text-slate-900">
                            {cantidad}
                          </span>
                          <button
                            onClick={() => carrito.cambiarCantidad(producto.id, cantidad + 1)}
                            aria-label="Sumar unidad"
                            className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                            disabled={cantidad >= producto.stock}
                          >
                            <IconoMas className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => carrito.quitar(producto.id)}
                            aria-label="Quitar del carrito"
                            className="ml-auto grid h-7 w-7 place-items-center rounded-lg text-rose-500 hover:bg-rose-50"
                          >
                            <IconoBasura className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="shrink-0 text-sm font-bold text-slate-900">
                        {formatoMoneda(unitario * cantidad)}
                      </p>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {carrito.items.length > 0 && (
              <footer className="space-y-4 border-t border-slate-200 p-5">
                {/* Método de pago */}
                <div className="grid grid-cols-2 gap-2">
                  {opcionesPago.map(({ valor, etiqueta, Icono }) => (
                    <button
                      key={valor}
                      onClick={() => carrito.setMetodoPago(valor)}
                      className={`relative flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-xs font-medium transition-colors ${
                        carrito.metodoPago === valor
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <Icono className="h-4 w-4" />
                      {etiqueta}
                    </button>
                  ))}
                </div>
                {carrito.metodoPago === "divisas" && (
                  <p className="text-[11px] leading-relaxed text-emerald-600">
                    Precio promocional aplicado por pago en divisas en efectivo.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Campo
                    placeholder="Tu nombre *"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                  <Campo
                    placeholder="Tu teléfono"
                    inputMode="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total</span>
                  <motion.span
                    key={`${carrito.total}-${carrito.metodoPago}`}
                    initial={{ scale: 0.9, opacity: 0.6 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-2xl font-bold text-slate-900"
                  >
                    {formatoMoneda(carrito.total)}
                  </motion.span>
                </div>

                <Boton className="w-full py-3" disabled={!listoParaPedir || enviando} onClick={pedir}>
                  <IconoWhatsApp className="h-5 w-5" />
                  {enviando ? "Procesando…" : "Pedir por WhatsApp"}
                </Boton>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
