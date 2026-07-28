"use client";

import { motion } from "framer-motion";
import { IconoWhatsApp } from "@/components/icons";
import { NUMERO_WHATSAPP } from "@/lib/whatsapp";

const MENSAJE = "Hola NovaStore, quisiera hacer una consulta.";

/**
 * Botón flotante de WhatsApp, siempre visible en la tienda, para que el
 * cliente escriba sus dudas al instante al número del negocio.
 */
export function BotonWhatsApp() {
  const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(MENSAJE)}`;
  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chatéanos por WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.8, type: "spring", bounce: 0.45, duration: 0.6 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-emerald-500 py-3.5 pl-4 pr-4 text-white shadow-glow transition-colors hover:bg-emerald-600 sm:pr-5"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-emerald-400/60" />
      <IconoWhatsApp className="h-6 w-6 shrink-0" />
      <span className="hidden text-sm font-semibold sm:inline">Chatéanos</span>
    </motion.a>
  );
}
