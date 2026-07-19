import { formatoMoneda } from "./format";
import type { Producto } from "./types";

const SITIO = "https://novastore.dgp-link.com";

/** Enlace directo que abre este producto en la tienda. */
export function enlaceProducto(id: string): string {
  const base =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}`.replace(/\/$/, "")
      : SITIO;
  return `${base}/?p=${id}`;
}

/** Resumen corto del producto (nombre y precios) para compartir. */
export function resumenProducto(p: Producto): string {
  const promo =
    p.precioVentaDivisas < p.precioVenta
      ? ` (${formatoMoneda(p.precioVentaDivisas)} en divisas)`
      : "";
  return `${p.nombre} — ${formatoMoneda(p.precioVenta)}${promo}`;
}

/** Texto completo para el fallback de WhatsApp (incluye el enlace). */
export function textoCompartir(p: Producto): string {
  return `${resumenProducto(p)}\n\nMíralo aquí: ${enlaceProducto(p.id)}`;
}

/**
 * Comparte un producto: usa el menú nativo del teléfono (WhatsApp,
 * Instagram, etc.) si está disponible; si no, abre WhatsApp con el texto.
 */
export async function compartirProducto(p: Producto): Promise<void> {
  const url = enlaceProducto(p.id);
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  if (nav?.share) {
    try {
      await nav.share({ title: p.nombre, text: resumenProducto(p), url });
    } catch {
      /* el usuario canceló el menú de compartir */
    }
    return;
  }
  if (typeof window !== "undefined") {
    window.open(`https://wa.me/?text=${encodeURIComponent(textoCompartir(p))}`, "_blank", "noopener");
  }
}
