"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { IconoBolsa, IconoBuscar } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { useCarrito } from "@/lib/cart-context";

interface Props {
  busqueda: string;
  onBuscar: (valor: string) => void;
}

export function Navbar({ busqueda, onBuscar }: Props) {
  const { totalItems, abrir } = useCarrito();

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-40 px-3 pt-3 sm:px-4 sm:pt-4"
    >
      <nav className="mx-auto flex max-w-7xl items-center gap-3 rounded-3xl border border-glass-border bg-white/80 px-4 py-3 shadow-soft backdrop-blur-xl sm:gap-4 sm:px-6">
        <Link href="/" className="shrink-0" aria-label="NovaStore inicio">
          <Logo size="md" />
        </Link>

        <div className="relative min-w-0 flex-1">
          <IconoBuscar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={busqueda}
            onChange={(e) => onBuscar(e.target.value)}
            placeholder="Buscar productos…"
            className="w-full rounded-2xl border border-slate-200 bg-white/70 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={abrir}
          aria-label="Abrir carrito"
          className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-glass-border bg-white text-slate-700 shadow-soft transition-colors hover:bg-slate-50"
        >
          <IconoBolsa className="h-5 w-5" />
          {totalItems > 0 && (
            <motion.span
              key={totalItems}
              initial={{ scale: 0.4 }}
              animate={{ scale: 1 }}
              className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-1 text-[11px] font-bold text-white shadow-glow"
            >
              {totalItems}
            </motion.span>
          )}
        </motion.button>
      </nav>
    </motion.header>
  );
}
