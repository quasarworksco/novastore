import type { HTMLAttributes } from "react";

/** Contenedor base del sistema visual Liquid Glass. */
export function GlassCard({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-3xl border border-glass-border bg-glass shadow-glass backdrop-blur-xl ${className}`}
      {...props}
    />
  );
}
