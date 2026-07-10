"use client";

import type { ButtonHTMLAttributes } from "react";

type Variante = "primario" | "vidrio" | "peligro" | "fantasma";

const estilos: Record<Variante, string> = {
  primario:
    "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-glow hover:brightness-110",
  vidrio:
    "border border-glass-border bg-white/80 text-slate-800 backdrop-blur hover:bg-white shadow-soft",
  peligro: "border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100",
  fantasma: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
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
