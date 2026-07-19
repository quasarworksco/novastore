import type { SVGProps } from "react";

/**
 * Características de perfume (día/noche, familia olfativa…) que el admin
 * marca en cada producto y la tienda muestra como mini etiquetas con icono.
 */

type IconProps = SVGProps<SVGSVGElement>;

const trazo = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24",
} as const;

const IconoSol = (p: IconProps) => (
  <svg {...trazo} {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

const IconoLuna = (p: IconProps) => (
  <svg {...trazo} {...p}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);

const IconoFlor = (p: IconProps) => (
  <svg {...trazo} {...p}>
    <circle cx="12" cy="12" r="2.6" />
    <path d="M12 9.4a3.2 3.2 0 1 0-3.2-3.2c0 1.8 1.4 3.2 3.2 3.2zM14.6 12a3.2 3.2 0 1 0 3.2-3.2c-1.8 0-3.2 1.4-3.2 3.2zM12 14.6a3.2 3.2 0 1 0 3.2 3.2c0-1.8-1.4-3.2-3.2-3.2zM9.4 12a3.2 3.2 0 1 0-3.2 3.2c1.8 0 3.2-1.4 3.2-3.2z" />
  </svg>
);

const IconoMadera = (p: IconProps) => (
  <svg {...trazo} {...p}>
    <path d="M12 22V8M12 8c0-3 2-5 5-6-1 3-1 5-5 6zM12 8c0-3-2-5-5-6 1 3 1 5 5 6zM12 15c0-2.5 1.6-4 4-4.8-.8 2.4-.8 4-4 4.8zM12 15c0-2.5-1.6-4-4-4.8.8 2.4.8 4 4 4.8z" />
  </svg>
);

const IconoDestello = (p: IconProps) => (
  <svg {...trazo} {...p}>
    <path d="M12 3c.7 2.5 2 3.8 4.5 4.5C14 8.2 12.7 9.5 12 12c-.7-2.5-2-3.8-4.5-4.5C10 6.8 11.3 5.5 12 3z" />
    <path d="M17 13c.5 1.7 1.4 2.6 3 3-1.6.5-2.5 1.4-3 3-.5-1.7-1.4-2.6-3-3 1.6-.4 2.5-1.3 3-3z" />
  </svg>
);

const IconoGota = (p: IconProps) => (
  <svg {...trazo} {...p}>
    <path d="M12 3c3 3.5 5 6.5 5 9a5 5 0 0 1-10 0c0-2.5 2-5.5 5-9z" />
  </svg>
);

const IconoCitrico = (p: IconProps) => (
  <svg {...trazo} {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 4v16M4.9 8.5l14.2 7M4.9 15.5l14.2-7" />
  </svg>
);

const IconoLlama = (p: IconProps) => (
  <svg {...trazo} {...p}>
    <path d="M12 2c1 3 4 4.5 4 8.5a4 4 0 0 1-8 0c0-1.5.5-2.5 1.2-3.7C9.8 8.6 10.5 10 12 10c-.5-2.5-.5-5.5 0-8z" />
    <path d="M8.5 14.5C7 16 6 17.5 6 19a6 6 0 0 0 12 0c0-1.5-1-3-2.5-4.5" />
  </svg>
);

export interface Caracteristica {
  id: string;
  etiqueta: string;
  /** Clases de color del pill (fondo, texto y borde). */
  clase: string;
  Icono: (p: IconProps) => React.ReactElement;
}

export const CARACTERISTICAS: Caracteristica[] = [
  { id: "dia", etiqueta: "Día", clase: "border-amber-200 bg-amber-50 text-amber-700", Icono: IconoSol },
  { id: "noche", etiqueta: "Noche", clase: "border-indigo-200 bg-indigo-50 text-indigo-700", Icono: IconoLuna },
  { id: "floral", etiqueta: "Floral", clase: "border-pink-200 bg-pink-50 text-pink-700", Icono: IconoFlor },
  { id: "amaderado", etiqueta: "Amaderado", clase: "border-orange-200 bg-orange-50 text-orange-800", Icono: IconoMadera },
  { id: "dulce", etiqueta: "Dulce", clase: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700", Icono: IconoDestello },
  { id: "fresco", etiqueta: "Fresco", clase: "border-cyan-200 bg-cyan-50 text-cyan-700", Icono: IconoGota },
  { id: "citrico", etiqueta: "Cítrico", clase: "border-lime-200 bg-lime-50 text-lime-700", Icono: IconoCitrico },
  { id: "especiado", etiqueta: "Especiado", clase: "border-red-200 bg-red-50 text-red-700", Icono: IconoLlama },
];

/** Pills de características de un producto (no renderiza nada si no tiene). */
export function NotasProducto({ ids, className = "" }: { ids?: string[]; className?: string }) {
  const notas = (ids ?? [])
    .map((id) => CARACTERISTICAS.find((c) => c.id === id))
    .filter((c): c is Caracteristica => Boolean(c));
  if (notas.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {notas.map(({ id, etiqueta, clase, Icono }) => (
        <span
          key={id}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${clase}`}
        >
          <Icono className="h-3 w-3 shrink-0" />
          {etiqueta}
        </span>
      ))}
    </div>
  );
}
