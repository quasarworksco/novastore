import type { HTMLAttributes } from "react";

type Tono = "verde" | "ambar" | "rojo" | "neutro" | "violeta";

const tonos: Record<Tono, string> = {
  verde: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ambar: "border-amber-200 bg-amber-50 text-amber-700",
  rojo: "border-rose-200 bg-rose-50 text-rose-600",
  neutro: "border-slate-200 bg-slate-50 text-slate-600",
  violeta: "border-blue-200 bg-blue-50 text-blue-700",
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
