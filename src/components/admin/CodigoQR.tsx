"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import QRCode from "qrcode";
import { IconoCerrar, IconoCompartir, IconoDescargar } from "@/components/icons";
import { Boton } from "@/components/ui/Boton";

const SITIO = "https://novastore.dgp-link.com";
const W = 1080;
const H = 1350;

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
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

async function generarTarjeta(): Promise<Blob> {
  const qrUrl = await QRCode.toDataURL(SITIO, {
    width: 720,
    margin: 1,
    color: { dark: "#0b1e5b", light: "#ffffff" },
  });

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Sin canvas");

  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#0b1e5b");
  g.addColorStop(0.55, "#1d4ed8");
  g.addColorStop(1, "#0ea5e9");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 72px system-ui, -apple-system, 'Segoe UI', sans-serif";
  ctx.fillText("NOVASTORE", W / 2, 150);
  ctx.fillStyle = "rgba(255,255,255,.8)";
  ctx.font = "500 38px system-ui, -apple-system, 'Segoe UI', sans-serif";
  ctx.fillText("Escanea y descubre nuestro catálogo", W / 2, 210);

  // Tarjeta blanca con el QR.
  const cardW = 800;
  const cardX = (W - cardW) / 2;
  const cardY = 270;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.3)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = "#ffffff";
  rectRedondeado(ctx, cardX, cardY, cardW, cardW, 56);
  ctx.fill();
  ctx.restore();

  const qr = await cargarImagen(qrUrl);
  const qrSize = 680;
  ctx.drawImage(qr, (W - qrSize) / 2, cardY + (cardW - qrSize) / 2, qrSize, qrSize);

  // Pie.
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 56px system-ui, -apple-system, 'Segoe UI', sans-serif";
  ctx.fillText("Pídelo por WhatsApp", W / 2, cardY + cardW + 110);
  ctx.fillStyle = "rgba(255,255,255,.75)";
  ctx.font = "600 40px system-ui, -apple-system, 'Segoe UI', sans-serif";
  ctx.fillText("novastore.dgp-link.com", W / 2, cardY + cardW + 175);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo generar"))), "image/jpeg", 0.92)
  );
}

/**
 * Modal con el código QR de la tienda en una tarjeta lista para imprimir,
 * pegar en el local o compartir. Al escanearlo se abre el catálogo.
 */
export function CodigoQR({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const [url, setUrl] = useState("");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [estado, setEstado] = useState<"generando" | "listo" | "error">("generando");

  useEffect(() => {
    if (!abierto) return;
    let vivo = true;
    let urlLocal = "";
    setEstado("generando");
    setUrl("");
    setBlob(null);
    generarTarjeta()
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
  }, [abierto]);

  function descargar() {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = "novastore-codigo-qr.jpg";
    a.click();
  }

  async function compartir() {
    if (!blob) return;
    const file = new File([blob], "novastore-codigo-qr.jpg", { type: "image/jpeg" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: "NovaStore", text: "Escanea y compra en NovaStore" });
      } catch {
        /* cancelado */
      }
    } else {
      descargar();
    }
  }

  const puedeCompartir =
    typeof navigator !== "undefined" &&
    "canShare" in navigator &&
    !!blob &&
    (navigator as Navigator & { canShare?: (d: ShareData) => boolean }).canShare?.({
      files: [new File([blob], "x.jpg", { type: "image/jpeg" })],
    });

  return (
    <AnimatePresence>
      {abierto && (
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
              <h3 className="text-base font-bold text-slate-900">Código QR de la tienda</h3>
              <button
                onClick={onCerrar}
                aria-label="Cerrar"
                className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              >
                <IconoCerrar className="h-4 w-4" />
              </button>
            </div>

            <div className="mx-auto grid aspect-[4/5] w-full max-h-[56vh] place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              {estado === "listo" && url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="Código QR de NovaStore" className="h-full w-full object-contain" />
              ) : (
                <p className="px-4 text-center text-sm text-slate-500">
                  {estado === "error" ? "No se pudo generar el QR." : "Generando…"}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {puedeCompartir && (
                <Boton className="w-full" onClick={compartir} disabled={estado !== "listo"}>
                  <IconoCompartir className="h-4 w-4" />
                  Compartir
                </Boton>
              )}
              <Boton
                variante={puedeCompartir ? "vidrio" : "primario"}
                className="w-full"
                onClick={descargar}
                disabled={estado !== "listo"}
              >
                <IconoDescargar className="h-4 w-4" />
                Descargar imagen
              </Boton>
            </div>
            <p className="text-center text-[11px] leading-relaxed text-slate-400">
              Imprímelo para tu local, pégalo en el empaque o compártelo. Al escanearlo se abre tu
              catálogo.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
