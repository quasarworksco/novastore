"use client";

import { motion } from "framer-motion";
import type { ComponentType, SVGProps } from "react";
import {
  IconoChip,
  IconoCohete,
  IconoEtiqueta,
  IconoGrid,
  IconoPerfume,
  IconoReloj,
} from "@/components/icons";

const iconosPorCategoria: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  Todos: IconoGrid,
  Perfumes: IconoPerfume,
  "Electrónica": IconoChip,
  Accesorios: IconoReloj,
  Juguetes: IconoCohete,
};

interface Props {
  categorias: string[];
  activa: string;
  onCambiar: (categoria: string) => void;
}

export function CategoryTabs({ categorias, activa, onCambiar }: Props) {
  return (
    <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 py-1">
      {categorias.map((categoria) => {
        const Icono = iconosPorCategoria[categoria] ?? IconoEtiqueta;
        const esActiva = categoria === activa;
        return (
          <button
            key={categoria}
            onClick={() => onCambiar(categoria)}
            className={`relative flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors ${
              esActiva ? "text-blue-700" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {esActiva && (
              <motion.span
                layoutId="categoria-activa"
                transition={{ type: "spring", bounce: 0.25, duration: 0.55 }}
                className="absolute inset-0 rounded-2xl border border-blue-100 bg-blue-50 shadow-soft"
              />
            )}
            <Icono className="relative z-10 h-4 w-4" />
            <span className="relative z-10">{categoria}</span>
          </button>
        );
      })}
    </div>
  );
}
