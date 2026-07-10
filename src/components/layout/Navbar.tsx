"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { IconoBolsa, IconoBuscar, IconoLogo } from "@/components/icons";
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
      <nav className="mx-auto flex max-w-7xl items-center gap-3 rounded-3xl border border-glass-border bg-slate-950/40 px-4 py-3 shadow-glass backdrop-blur-2xl sm:gap-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-glow">
            <IconoLogo className="h-5 w-5 text-white" />
          </span>
          <span className="hidden text-lg font-bold tracking-tight sm:block">
            Nova<span className="texto-degradado">Store</span>
          </span>
        </Link>

        <div className="relative min-w-0 flex-1">
          <IconoBuscar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={busqueda}
            onChange={(e) => onBuscar(e.target.value)}
            placeholder="Buscar productos…"
            className="w-full rounded-2xl border border-glass-border bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-400 outline-none transition-colors focus:border-violet-400/60 focus:bg-white/10"
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={abrir}
          aria-label="Abrir carrito"
          className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-glass-border bg-glass-strong text-white backdrop-blur-xl transition-colors hover:bg-white/20"
        >
          <IconoBolsa className="h-5 w-5" />
          {totalItems > 0 && (
            <motion.span
              key={totalItems}
              initial={{ scale: 0.4 }}
              animate={{ scale: 1 }}
              className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 px-1 text-[11px] font-bold text-white shadow-glow"
            >
              {totalItems}
            </motion.span>
          )}
        </motion.button>
      </nav>
    </motion.header>
  );
}
