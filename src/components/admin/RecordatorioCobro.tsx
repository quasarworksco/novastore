"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconoCerrar, IconoCheck, IconoWhatsApp } from "@/components/icons";
import { Boton } from "@/components/ui/Boton";
import { formatoFecha, formatoMoneda } from "@/lib/format";
import { saldoPendiente, type Venta } from "@/lib/types";

type Tipo = "cobro" | "abono";

/** Teléfono venezolano a formato internacional para wa.me. */
function telefonoWa(tel: string): string {
  const d = tel.replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("58")) return d;
  return `58${d.replace(/^0/, "")}`;
}

function primerNombre(nombre: string): string {
  const n = (nombre || "").trim().split(/\s+/)[0];
  return n || "";
}

function mensaje(v: Venta, tipo: Tipo): string {
  const nombre = primerNombre(v.cliente.nombre);
  const saludo = nombre ? `Hola ${nombre}, te saluda NovaStore.` : "Hola, te saluda NovaStore.";
  const saldo = formatoMoneda(saldoPendiente(v));
  const fecha = v.fechaCobro ? formatoFecha(v.fechaCobro).split(",")[0] : "";

  if (tipo === "abono") {
    return [
      saludo,
      "",
      `Esperamos que estés muy bien. Te recordamos con cariño que tienes un saldo pendiente de ${saldo}.`,
      "",
      "Si por ahora no puedes cancelarlo completo, puedes hacer un abono parcial cuando gustes. Cada abono mantiene tu crédito al día y te permite seguir disfrutando de nuestros beneficios.",
      "",
      "Quedamos atentos para ayudarte. ¡Gracias por tu preferencia!",
    ].join("\n");
  }

  return [
    saludo,
    "",
    `Esperamos que estés muy bien. Queremos recordarte de la manera más amable que tienes un saldo pendiente de ${saldo}${
      fecha ? ` con fecha de pago el ${fecha}` : ""
    }.`,
    "",
    "Te agradecemos ponerte al día para seguir disfrutando de nuestros beneficios de crédito. Si ya realizaste el pago, por favor ignora este mensaje.",
    "",
    "¡Gracias por tu confianza y preferencia!",
  ].join("\n");
}

/**
 * Modal con un mensaje educado de cobro o de invitación a abonar, listo para
 * copiar y pegar en el chat del cliente o enviar directo por WhatsApp.
 */
export function RecordatorioCobro({ venta, onCerrar }: { venta: Venta | null; onCerrar: () => void }) {
  const [tipo, setTipo] = useState<Tipo>("cobro");
  const [copiado, setCopiado] = useState(false);

  const texto = useMemo(() => (venta ? mensaje(venta, tipo) : ""), [venta, tipo]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      const area = document.getElementById("recordatorio-texto") as HTMLTextAreaElement | null;
      area?.select();
    }
  }

  function enviarWhatsApp() {
    if (!venta) return;
    const tel = telefonoWa(venta.cliente.telefono);
    const destino = tel ? `https://wa.me/${tel}` : "https://wa.me/";
    window.open(`${destino}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
  }

  return (
    <AnimatePresence>
      {venta && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCerrar}
          className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm"
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
                <IconoWhatsApp className="h-5 w-5 text-emerald-600" />
                Recordatorio de pago
              </h3>
              <button
                onClick={onCerrar}
                aria-label="Cerrar"
                className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              >
                <IconoCerrar className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Para <span className="font-medium text-slate-700">{venta.cliente.nombre || "el cliente"}</span> ·
              saldo {formatoMoneda(saldoPendiente(venta))}
            </p>

            {/* Tipo de mensaje */}
            <div className="flex overflow-hidden rounded-2xl border border-slate-200">
              <button
                onClick={() => setTipo("cobro")}
                className={`flex-1 px-3 py-2 text-sm font-medium transition ${
                  tipo === "cobro" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Recordar pago
              </button>
              <button
                onClick={() => setTipo("abono")}
                className={`flex-1 px-3 py-2 text-sm font-medium transition ${
                  tipo === "abono" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Invitar a abonar
              </button>
            </div>

            <textarea
              id="recordatorio-texto"
              readOnly
              value={texto}
              rows={10}
              className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800 outline-none focus:border-blue-400"
            />

            <div className="flex flex-wrap justify-end gap-2">
              <Boton variante="vidrio" onClick={copiar}>
                <IconoCheck className="h-4 w-4" />
                {copiado ? "¡Copiado!" : "Copiar mensaje"}
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
