"use client";

import { motion } from "framer-motion";
import type { ComponentType, SVGProps } from "react";
import { GlassCard } from "@/components/ui/GlassCard";

type Tono = "violeta" | "verde" | "cian" | "ambar" | "rojo";

const tonos: Record<Tono, { icono: string; valor: string }> = {
  violeta: { icono: "bg-violet-500/20 text-violet-300", valor: "text-white" },
  verde: { icono: "bg-emerald-500/20 text-emerald-300", valor: "text-emerald-300" },
  cian: { icono: "bg-cyan-500/20 text-cyan-300", valor: "text-white" },
  ambar: { icono: "bg-amber-500/20 text-amber-300", valor: "text-amber-300" },
  rojo: { icono: "bg-rose-500/20 text-rose-300", valor: "text-rose-300" },
};

interface Props {
  etiqueta: string;
  valor: string;
  detalle?: string;
  icono: ComponentType<SVGProps<SVGSVGElement>>;
  tono?: Tono;
}

export function StatCard({ etiqueta, valor, detalle, icono: Icono, tono = "violeta" }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <GlassCard className="flex items-start gap-4 p-5">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tonos[tono].icono}`}>
          <Icono className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{etiqueta}</p>
          <p className={`mt-1 truncate text-2xl font-bold ${tonos[tono].valor}`}>{valor}</p>
          {detalle && <p className="mt-0.5 text-xs text-slate-400">{detalle}</p>}
        </div>
      </GlassCard>
    </motion.div>
  );
}
