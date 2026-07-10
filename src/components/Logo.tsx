import type { CSSProperties } from "react";

/**
 * Logotipo minimalista de texto: wordmark "novastore" con una estrella
 * (nova) discreta en color de acento. Escalable vía `size`.
 */

const tamanos = {
  sm: { texto: "text-sm", mark: 12 },
  md: { texto: "text-lg", mark: 15 },
  lg: { texto: "text-2xl", mark: 20 },
} as const;

interface Props {
  size?: keyof typeof tamanos;
  className?: string;
  conMarca?: boolean;
  style?: CSSProperties;
}

export function Logo({ size = "md", className = "", conMarca = true, style }: Props) {
  const t = tamanos[size];
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} style={style}>
      {conMarca && (
        <svg
          width={t.mark}
          height={t.mark}
          viewBox="0 0 24 24"
          fill="currentColor"
          className="shrink-0 text-indigo-500"
          aria-hidden="true"
        >
          <path d="M12 2c.4 3.6 2.4 5.6 6 6-3.6.4-5.6 2.4-6 6-.4-3.6-2.4-5.6-6-6 3.6-.4 5.6-2.4 6-6z" />
        </svg>
      )}
      <span className={`font-semibold tracking-tight ${t.texto}`}>
        <span className="text-slate-900">nova</span>
        <span className="font-light text-slate-400">store</span>
      </span>
    </span>
  );
}
