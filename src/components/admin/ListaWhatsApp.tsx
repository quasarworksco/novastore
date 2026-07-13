"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconoCerrar, IconoCheck, IconoWhatsApp } from "@/components/icons";
import { Boton } from "@/components/ui/Boton";
import type { Producto } from "@/lib/types";

/** Precio compacto para texto: $33 o $33,50 (sin ",00" innecesario). */
function precio(valor: number): string {
  return `$${valor.toLocaleString("es-VE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

interface Props {
  abierto: boolean;
  productos: Producto[];
  onCerrar: () => void;
}

const SITIO = "novastore.dgp-link.com";

/**
 * Genera una lista de texto de los productos disponibles, lista para copiar
 * y enviar por WhatsApp. Permite elegir categoría y mostrar u ocultar precios.
 */
export function ListaWhatsApp({ abierto, productos, onCerrar }: Props) {
  const [conPrecio, setConPrecio] = useState(true);
  const [categoria, setCategoria] = useState("Perfumes");
  const [copiado, setCopiado] = useState(false);

  const categorias = useMemo(
    () => Array.from(new Set(productos.map((p) => p.categoria).filter(Boolean))).sort(),
    [productos]
  );

  // Disponibles = activos y con stock.
  const disponibles = useMemo(
    () =>
      productos
        .filter((p) => p.activo && p.stock > 0)
        .filter((p) => categoria === "Todas" || p.categoria === categoria)
        .sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [productos, categoria]
  );

  const texto = useMemo(() => {
    const titulo = categoria === "Todas" ? "PRODUCTOS DISPONIBLES" : `${categoria.toUpperCase()} DISPONIBLES`;
    const lineas = disponibles.map((p) => {
      if (!conPrecio) return `- ${p.nombre}`;
      const promo =
        p.precioVentaDivisas < p.precioVenta
          ? ` (${precio(p.precioVentaDivisas)} en divisas)`
          : "";
      return `- ${p.nombre}: ${precio(p.precioVenta)}${promo}`;
    });
    return [`NOVASTORE - ${titulo}`, "", ...lineas, "", `Pedidos: ${SITIO}`].join("\n");
  }, [disponibles, conPrecio, categoria]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Fallback: seleccionar el textarea para copiar a mano.
      const area = document.getElementById("lista-wa-texto") as HTMLTextAreaElement | null;
      area?.select();
    }
  }

  function enviarWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
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
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
            onClick={(e) => e.stopPropagation()}
            className="my-8 w-full max-w-lg space-y-4 rounded-3xl border border-glass-border bg-white p-6 shadow-glass"
          >
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <IconoWhatsApp className="h-5 w-5 text-emerald-600" />
                Lista para WhatsApp
              </h3>
              <button
                onClick={onCerrar}
                aria-label="Cerrar"
                className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              >
                <IconoCerrar className="h-4 w-4" />
              </button>
            </div>

            {/* Controles */}
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                Categoría
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  {categorias.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="Todas">Todas</option>
                </select>
              </label>

              <div className="flex overflow-hidden rounded-xl border border-slate-200">
                <button
                  onClick={() => setConPrecio(true)}
                  className={`px-3 py-1.5 text-sm font-medium transition ${
                    conPrecio ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Con precio
                </button>
                <button
                  onClick={() => setConPrecio(false)}
                  className={`px-3 py-1.5 text-sm font-medium transition ${
                    !conPrecio ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Sin precio
                </button>
              </div>

              <span className="ml-auto text-xs text-slate-400">
                {disponibles.length} disponibles
              </span>
            </div>

            {/* Vista previa */}
            <textarea
              id="lista-wa-texto"
              readOnly
              value={texto}
              rows={12}
              className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-800 outline-none focus:border-blue-400"
            />

            <div className="flex flex-wrap justify-end gap-2">
              <Boton variante="vidrio" onClick={copiar} disabled={disponibles.length === 0}>
                <IconoCheck className="h-4 w-4" />
                {copiado ? "¡Copiado!" : "Copiar texto"}
              </Boton>
              <Boton onClick={enviarWhatsApp} disabled={disponibles.length === 0}>
                <IconoWhatsApp className="h-4 w-4" />
                Enviar por WhatsApp
              </Boton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
