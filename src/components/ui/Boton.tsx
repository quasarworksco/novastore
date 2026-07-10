"use client";

import type { ButtonHTMLAttributes } from "react";

type Variante = "primario" | "vidrio" | "peligro" | "fantasma";

const estilos: Record<Variante, string> = {
  primario:
    "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 text-white shadow-glow hover:brightness-110",
  vidrio:
    "border border-glass-border bg-glass-strong text-white backdrop-blur-xl hover:bg-white/20",
  peligro: "border border-rose-400/30 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25",
  fantasma: "text-slate-300 hover:bg-white/10 hover:text-white",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
}

export function Boton({ variante = "primario", className = "", ...props }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 ${estilos[variante]} ${className}`}
      {...props}
    />
  );
}
