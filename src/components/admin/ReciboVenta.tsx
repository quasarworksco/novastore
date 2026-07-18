"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconoCerrar, IconoCheck, IconoRecibo, IconoWhatsApp } from "@/components/icons";
import { Boton } from "@/components/ui/Boton";
import { Insignia } from "@/components/ui/Insignia";
import { formatoFecha, formatoMoneda } from "@/lib/format";
import { saldoPendiente, totalAbonado, type Venta } from "@/lib/types";

const SITIO = "novastore.dgp-link.com";

/** Número de recibo estable derivado del id de la venta guardada. */
export function numeroRecibo(v: Venta): string {
  return v.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
}

/** Monto compacto para texto: $65 o $65,50. */
function monto(valor: number): string {
  return `$${valor.toLocaleString("es-VE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/** Teléfono venezolano a formato internacional para wa.me. */
function telefonoWa(tel: string): string {
  const d = tel.replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("58")) return d;
  return `58${d.replace(/^0/, "")}`;
}

function textoRecibo(v: Venta): string {
  const abonado = totalAbonado(v);
  const saldo = saldoPendiente(v);
  const debe = v.fiado && !v.pagado;
  const lineas = v.items.map((i) => {
    const sub = i.precioUnitario * i.cantidad;
    return i.cantidad > 1
      ? `- ${i.cantidad} x ${i.nombre} (${monto(i.precioUnitario)} c/u) = ${monto(sub)}`
      : `- 1 x ${i.nombre} = ${monto(sub)}`;
  });
  return [
    `NOVASTORE - RECIBO #${numeroRecibo(v)}`,
    `Fecha: ${formatoFecha(v.creadoEn).split(",")[0]}`,
    `Cliente: ${v.cliente.nombre || "-"}`,
    "",
    ...lineas,
    "",
    `Total: ${monto(v.total)}`,
    `Pago: ${v.metodoPago === "divisas" ? "Divisas en efectivo" : "Precio base"}`,
    ...(abonado > 0
      ? [
          "Abonos:",
          ...(v.abonos ?? []).map((a) => `- ${formatoFecha(a.fecha).split(",")[0]}: ${monto(a.monto)}`),
        ]
      : []),
    ...(debe ? [`SALDO PENDIENTE: ${monto(saldo)}`] : ["PAGADO - Gracias por tu compra"]),
    "",
    SITIO,
  ].join("\n");
}

/**
 * Recibo de una venta guardada, listo para copiar o enviar al cliente por
 * WhatsApp como respaldo del cobro.
 */
export function ReciboVenta({ venta, onCerrar }: { venta: Venta | null; onCerrar: () => void }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    if (!venta) return;
    try {
      await navigator.clipboard.writeText(textoRecibo(venta));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* portapapeles no disponible */
    }
  }

  function enviarWhatsApp() {
    if (!venta) return;
    const tel = telefonoWa(venta.cliente.telefono);
    const destino = tel ? `https://wa.me/${tel}` : "https://wa.me/";
    window.open(`${destino}?text=${encodeURIComponent(textoRecibo(venta))}`, "_blank", "noopener");
  }

  const abonado = venta ? totalAbonado(venta) : 0;
  const saldo = venta ? saldoPendiente(venta) : 0;
  const debe = !!venta && venta.fiado && !venta.pagado;

  return (
    <AnimatePresence>
      {venta && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCerrar}
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
            onClick={(e) => e.stopPropagation()}
            className="my-8 w-full max-w-md space-y-4 rounded-3xl border border-glass-border bg-white p-6 shadow-glass"
          >
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <IconoRecibo className="h-5 w-5 text-blue-600" />
                Recibo #{numeroRecibo(venta)}
              </h3>
              <button
                onClick={onCerrar}
                aria-label="Cerrar"
                className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              >
                <IconoCerrar className="h-4 w-4" />
              </button>
            </div>

            {/* Cuerpo del recibo */}
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm">
              <div className="flex items-baseline justify-between">
                <p className="font-bold tracking-tight text-slate-900">
                  nova<span className="font-normal text-slate-400">store</span>
                </p>
                <p className="text-xs text-slate-500">{formatoFecha(venta.creadoEn)}</p>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Cliente: <span className="font-medium text-slate-700">{venta.cliente.nombre || "—"}</span>
                {venta.cliente.telefono ? ` · ${venta.cliente.telefono}` : ""}
              </p>

              <ul className="mt-3 space-y-1.5 border-t border-dashed border-slate-300 pt-3">
                {venta.items.map((i, idx) => (
                  <li key={idx} className="flex justify-between gap-3 text-slate-700">
                    <span className="min-w-0">
                      {i.cantidad} × {i.nombre}
                      {i.cantidad > 1 && (
                        <span className="text-xs text-slate-400"> ({formatoMoneda(i.precioUnitario)} c/u)</span>
                      )}
                    </span>
                    <span className="shrink-0 font-medium text-slate-900">
                      {formatoMoneda(i.precioUnitario * i.cantidad)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 space-y-1 border-t border-dashed border-slate-300 pt-3">
                <p className="flex justify-between font-bold text-slate-900">
                  <span>Total</span>
                  <span>{formatoMoneda(venta.total)}</span>
                </p>
                <p className="flex justify-between text-xs text-slate-500">
                  <span>Pago</span>
                  <span>{venta.metodoPago === "divisas" ? "Divisas en efectivo" : "Precio base"}</span>
                </p>
                {(venta.abonos ?? []).map((a, i) => (
                  <p key={i} className="flex justify-between text-xs text-emerald-600">
                    <span>Abono {formatoFecha(a.fecha).split(",")[0]}</span>
                    <span>-{formatoMoneda(a.monto)}</span>
                  </p>
                ))}
                {debe ? (
                  <p className="flex items-center justify-between pt-1 font-bold text-amber-700">
                    <span>Saldo pendiente</span>
                    <span>{formatoMoneda(saldo)}</span>
                  </p>
                ) : (
                  <div className="pt-1 text-right">
                    <Insignia tono="verde">Pagado</Insignia>
                  </div>
                )}
                {abonado > 0 && debe && (
                  <p className="flex justify-between text-[11px] text-slate-400">
                    <span>Abonado hasta hoy</span>
                    <span>{formatoMoneda(abonado)}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Boton variante="vidrio" onClick={copiar}>
                <IconoCheck className="h-4 w-4" />
                {copiado ? "¡Copiado!" : "Copiar recibo"}
              </Boton>
              <Boton onClick={enviarWhatsApp}>
                <IconoWhatsApp className="h-4 w-4" />
                {venta.cliente.telefono ? "Enviar al cliente" : "Enviar por WhatsApp"}
              </Boton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
