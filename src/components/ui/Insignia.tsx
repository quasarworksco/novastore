import type { HTMLAttributes } from "react";

type Tono = "verde" | "ambar" | "rojo" | "neutro" | "violeta";

const tonos: Record<Tono, string> = {
  verde: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
  ambar: "border-amber-400/30 bg-amber-500/15 text-amber-300",
  rojo: "border-rose-400/30 bg-rose-500/15 text-rose-300",
  neutro: "border-glass-border bg-white/10 text-slate-300",
  violeta: "border-violet-400/30 bg-violet-500/15 text-violet-300",
};

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tono?: Tono;
}

export function Insignia({ tono = "neutro", className = "", ...props }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${tonos[tono]} ${className}`}
      {...props}
    />
  );
}
