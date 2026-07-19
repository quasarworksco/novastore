"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconoCerrar, IconoCompartir, IconoDescargar } from "@/components/icons";
import { Boton } from "@/components/ui/Boton";
import { formatoMoneda } from "@/lib/format";
import { imagenOptimizada } from "@/lib/imagen";
import { resumenProducto, enlaceProducto } from "@/lib/compartir";
import type { Producto } from "@/lib/types";

const W = 1080;
const H = 1920;

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Dibuja texto centrado con salto de línea automático; devuelve la Y final. */
function textoMultilinea(
  ctx: CanvasRenderingContext2D,
  texto: string,
  x: number,
  y: number,
  anchoMax: number,
  alturaLinea: number,
  maxLineas = 2
): number {
  const palabras = texto.split(" ");
  const lineas: string[] = [];
  let actual = "";
  for (const palabra of palabras) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (ctx.measureText(prueba).width > anchoMax && actual) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = prueba;
    }
  }
  if (actual) lineas.push(actual);
  const recortadas = lineas.slice(0, maxLineas);
  if (lineas.length > maxLineas) {
    let ult = recortadas[maxLineas - 1];
    while (ctx.measureText(`${ult}…`).width > anchoMax && ult.length > 0) ult = ult.slice(0, -1);
    recortadas[maxLineas - 1] = `${ult}…`;
  }
  recortadas.forEach((linea, i) => ctx.fillText(linea, x, y + i * alturaLinea));
  return y + recortadas.length * alturaLinea;
}

function rectRedondeado(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function generarImagen(p: Producto): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Sin canvas");

  // Fondo degradado azul (identidad NovaStore).
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#0b1e5b");
  g.addColorStop(0.55, "#1d4ed8");
  g.addColorStop(1, "#0ea5e9");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Marca arriba.
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 64px system-ui, -apple-system, 'Segoe UI', sans-serif";
  ctx.fillText("NOVASTORE", W / 2, 170);
  ctx.fillStyle = "rgba(255,255,255,.75)";
  ctx.font = "500 34px system-ui, -apple-system, 'Segoe UI', sans-serif";
  ctx.fillText("Todo lo que te gusta, en un solo lugar", W / 2, 228);

  // Tarjeta blanca con la foto del producto.
  const cx = 90;
  const cy = 290;
  const cw = W - 180;
  const ch = 820;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.3)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = "#ffffff";
  rectRedondeado(ctx, cx, cy, cw, ch, 56);
  ctx.fill();
  ctx.restore();

  if (p.imagenes[0]) {
    try {
      const img = await cargarImagen(imagenOptimizada(p.imagenes[0], 1000));
      const pad = 40;
      const areaX = cx + pad;
      const areaY = cy + pad;
      const areaW = cw - pad * 2;
      const areaH = ch - pad * 2;
      const escala = Math.min(areaW / img.width, areaH / img.height);
      const dw = img.width * escala;
      const dh = img.height * escala;
      const dx = areaX + (areaW - dw) / 2;
      const dy = areaY + (areaH - dh) / 2;
      ctx.save();
      rectRedondeado(ctx, cx + 20, cy + 20, cw - 40, ch - 40, 40);
      ctx.clip();
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    } catch {
      /* imagen no disponible: la tarjeta queda blanca */
    }
  }

  // Bloque inferior apilado (nombre → precio → divisas), sin colisiones.
  let y = cy + ch + 120;

  // Nombre del producto.
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 76px system-ui, -apple-system, 'Segoe UI', sans-serif";
  y = textoMultilinea(ctx, p.nombre, W / 2, y, W - 160, 92, 2) + 24;

  // Precio base.
  ctx.font = "800 108px system-ui, -apple-system, 'Segoe UI', sans-serif";
  ctx.fillText(formatoMoneda(p.precioVenta), W / 2, y + 88);
  y += 120;

  // Precio en divisas (si hay promoción).
  if (p.precioVentaDivisas < p.precioVenta) {
    const texto = `${formatoMoneda(p.precioVentaDivisas)} en divisas`;
    ctx.font = "700 46px system-ui, -apple-system, 'Segoe UI', sans-serif";
    const tw = ctx.measureText(texto).width;
    const px = 34;
    ctx.fillStyle = "rgba(16,185,129,.95)";
    rectRedondeado(ctx, W / 2 - tw / 2 - px, y, tw + px * 2, 84, 42);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(texto, W / 2, y + 58);
  }

  // Pie fijo al fondo: llamado a pedir.
  ctx.fillStyle = "rgba(255,255,255,.95)";
  ctx.font = "700 44px system-ui, -apple-system, 'Segoe UI', sans-serif";
  ctx.fillText("Pídelo por WhatsApp", W / 2, H - 150);
  ctx.fillStyle = "rgba(255,255,255,.65)";
  ctx.font = "500 36px system-ui, -apple-system, 'Segoe UI', sans-serif";
  ctx.fillText("novastore.dgp-link.com", W / 2, H - 88);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo generar la imagen"))), "image/jpeg", 0.92)
  );
}

/**
 * Modal que genera una imagen vertical (formato estado/story) del producto,
 * lista para descargar o compartir en el estado de WhatsApp.
 */
export function ImagenEstado({ producto, onCerrar }: { producto: Producto | null; onCerrar: () => void }) {
  const [url, setUrl] = useState("");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [estado, setEstado] = useState<"generando" | "listo" | "error">("generando");

  useEffect(() => {
    if (!producto) return;
    let vivo = true;
    let urlLocal = "";
    setEstado("generando");
    setUrl("");
    setBlob(null);
    generarImagen(producto)
      .then((b) => {
        if (!vivo) return;
        urlLocal = URL.createObjectURL(b);
        setBlob(b);
        setUrl(urlLocal);
        setEstado("listo");
      })
      .catch(() => vivo && setEstado("error"));
    return () => {
      vivo = false;
      if (urlLocal) URL.revokeObjectURL(urlLocal);
    };
  }, [producto]);

  function nombreArchivo() {
    const base = (producto?.nombre || "producto").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `novastore-${base}.jpg`;
  }

  async function compartir() {
    if (!blob || !producto) return;
    const file = new File([blob], nombreArchivo(), { type: "image/jpeg" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({
          files: [file],
          title: producto.nombre,
          text: `${resumenProducto(producto)}\n${enlaceProducto(producto.id)}`,
        });
      } catch {
        /* cancelado */
      }
    } else {
      descargar();
    }
  }

  function descargar() {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreArchivo();
    a.click();
  }

  const puedeCompartirArchivo =
    typeof navigator !== "undefined" &&
    "canShare" in navigator &&
    !!blob &&
    (navigator as Navigator & { canShare?: (d: ShareData) => boolean }).canShare?.({
      files: [new File([blob], "x.jpg", { type: "image/jpeg" })],
    });

  return (
    <AnimatePresence>
      {producto && (
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
            className="my-6 w-full max-w-xs space-y-4 rounded-3xl border border-glass-border bg-white p-5 shadow-glass"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Imagen para estado</h3>
              <button
                onClick={onCerrar}
                aria-label="Cerrar"
                className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              >
                <IconoCerrar className="h-4 w-4" />
              </button>
            </div>

            <div className="mx-auto grid aspect-[9/16] w-full max-h-[58vh] place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              {estado === "listo" && url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="Vista previa" className="h-full w-full object-contain" />
              ) : (
                <p className="px-4 text-center text-sm text-slate-500">
                  {estado === "error" ? "No se pudo generar la imagen." : "Generando imagen…"}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {puedeCompartirArchivo && (
                <Boton className="w-full" onClick={compartir} disabled={estado !== "listo"}>
                  <IconoCompartir className="h-4 w-4" />
                  Compartir
                </Boton>
              )}
              <Boton
                variante={puedeCompartirArchivo ? "vidrio" : "primario"}
                className="w-full"
                onClick={descargar}
                disabled={estado !== "listo"}
              >
                <IconoDescargar className="h-4 w-4" />
                Descargar imagen
              </Boton>
            </div>
            <p className="text-center text-[11px] leading-relaxed text-slate-400">
              Descárgala y súbela a tu estado de WhatsApp, o compártela directo.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
