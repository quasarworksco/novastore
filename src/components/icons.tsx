import type { SVGProps } from "react";

/**
 * Set de iconos SVG minimalistas (trazo 1.8, esquinas redondeadas).
 * Sin dependencias externas ni emojis.
 */

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconoLogo = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.4L12 15l-1.9-4.6L5.5 9l4.6-1.4L12 3z" />
    <path d="M18.5 15.5l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8.8-1.9z" />
  </Base>
);

export const IconoBolsa = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 8h12l-1 12a2 2 0 01-2 1.8H9A2 2 0 017 20L6 8z" />
    <path d="M9 10V6a3 3 0 016 0v4" />
  </Base>
);

export const IconoBuscar = (p: IconProps) => (
  <Base {...p}>
    <circle cx={11} cy={11} r={7} />
    <path d="M20 20l-3.2-3.2" />
  </Base>
);

export const IconoCerrar = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Base>
);

export const IconoMas = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const IconoMenos = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 12h14" />
  </Base>
);

export const IconoBasura = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6 7l1 13a2 2 0 002 1.8h6A2 2 0 0017 20l1-13" />
    <path d="M10 11v6M14 11v6" />
  </Base>
);

export const IconoFlechaIzq = (p: IconProps) => (
  <Base {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Base>
);

export const IconoFlechaDer = (p: IconProps) => (
  <Base {...p}>
    <path d="M9 5l7 7-7 7" />
  </Base>
);

export const IconoWhatsApp = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3a9 9 0 00-7.8 13.5L3 21l4.7-1.2A9 9 0 1012 3z" />
    <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.5-1.5-2-1.5-1 .8a4.2 4.2 0 01-2.1-2.1l.8-1-1.5-2L9 9.5z" />
  </Base>
);

export const IconoGrid = (p: IconProps) => (
  <Base {...p}>
    <rect x={4} y={4} width={7} height={7} rx={1.8} />
    <rect x={13} y={4} width={7} height={7} rx={1.8} />
    <rect x={4} y={13} width={7} height={7} rx={1.8} />
    <rect x={13} y={13} width={7} height={7} rx={1.8} />
  </Base>
);

export const IconoPerfume = (p: IconProps) => (
  <Base {...p}>
    <rect x={8} y={10} width={8} height={10} rx={2.5} />
    <path d="M10 10V8h4v2M12 8V6" />
    <path d="M12 6h4l1.5-1.5" />
  </Base>
);

export const IconoChip = (p: IconProps) => (
  <Base {...p}>
    <rect x={7} y={7} width={10} height={10} rx={2} />
    <path d="M12 4v3M12 17v3M4 12h3M17 12h3M6.5 6.5L8 8M17.5 6.5L16 8M6.5 17.5L8 16M17.5 17.5L16 16" />
  </Base>
);

export const IconoReloj = (p: IconProps) => (
  <Base {...p}>
    <circle cx={12} cy={12} r={5.5} />
    <path d="M12 9.5V12l1.8 1.5" />
    <path d="M9.5 7L10 3.5h4L14.5 7M9.5 17L10 20.5h4l.5-3.5" />
  </Base>
);

export const IconoCohete = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 15c-1.5-4 0-8.5 4.5-11 1 4.5-.5 9-4.5 11z" strokeWidth={0} fill="none" />
    <path d="M14 10a8.9 8.9 0 015.5-6.5A8.9 8.9 0 0113 9m1 1l-4 4m4-4l1 4.5L11.5 18 11 14m-1-1L5.5 12.5 9 9l4.5.5" />
    <path d="M7.5 16.5c-1 1-1.5 3-1.5 3s2-.5 3-1.5" />
  </Base>
);

export const IconoEtiqueta = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 11V5a1 1 0 011-1h6l9 9-7 7-9-9z" />
    <circle cx={8.5} cy={8.5} r={1.2} />
  </Base>
);

export const IconoGrafica = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 4v15a1 1 0 001 1h15" />
    <path d="M8 15l3.5-4 3 2.5L19 8" />
  </Base>
);

export const IconoCaja = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 8l8-4 8 4v8l-8 4-8-4V8z" />
    <path d="M4 8l8 4 8-4M12 12v8" />
  </Base>
);

export const IconoUsuarios = (p: IconProps) => (
  <Base {...p}>
    <circle cx={9} cy={8.5} r={3} />
    <path d="M3.5 19a5.5 5.5 0 0111 0" />
    <path d="M15.5 6a3 3 0 010 5.2M17 13.6a5.5 5.5 0 013.5 5.4" />
  </Base>
);

export const IconoDolar = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 4v16" />
    <path d="M16 7.5c0-1.7-1.8-2.5-4-2.5s-4 1-4 2.8c0 4 8 2.4 8 6.4 0 1.8-1.8 2.8-4 2.8s-4-.8-4-2.5" />
  </Base>
);

export const IconoTendenciaAlta = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 17l5.5-5.5 3 3L19 8" />
    <path d="M14.5 8H19v4.5" />
  </Base>
);

export const IconoTendenciaBaja = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 7l5.5 5.5 3-3L19 16" />
    <path d="M14.5 16H19v-4.5" />
  </Base>
);

export const IconoAlerta = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 4L2.8 19.5a1 1 0 00.9 1.5h16.6a1 1 0 00.9-1.5L12 4z" />
    <path d="M12 10v4.5M12 17.8v.2" />
  </Base>
);

export const IconoLapiz = (p: IconProps) => (
  <Base {...p}>
    <path d="M14.5 5.5l4 4L8 20l-4.5.5L4 16 14.5 5.5z" />
    <path d="M12.5 7.5l4 4" />
  </Base>
);

export const IconoImagen = (p: IconProps) => (
  <Base {...p}>
    <rect x={4} y={5} width={16} height={14} rx={2.5} />
    <circle cx={9} cy={10} r={1.5} />
    <path d="M4.5 17l4.5-4 3 2.5L16 12l3.5 3.5" />
  </Base>
);

export const IconoSubir = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 16V5M7.5 9.5L12 5l4.5 4.5" />
    <path d="M5 19h14" />
  </Base>
);

export const IconoSalir = (p: IconProps) => (
  <Base {...p}>
    <path d="M14 5H7a2 2 0 00-2 2v10a2 2 0 002 2h7" />
    <path d="M17 8.5L20.5 12 17 15.5M20 12h-9" />
  </Base>
);

export const IconoCheck = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Base>
);

export const IconoCandado = (p: IconProps) => (
  <Base {...p}>
    <rect x={5.5} y={10.5} width={13} height={9} rx={2.5} />
    <path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5M12 14.5v1.8" />
  </Base>
);

export const IconoBillete = (p: IconProps) => (
  <Base {...p}>
    <rect x={3} y={7} width={18} height={11} rx={2} />
    <circle cx={12} cy={12.5} r={2.5} />
    <path d="M6.5 10.2v.1M17.5 14.8v.1" />
  </Base>
);

export const IconoAlmacen = (p: IconProps) => (
  <Base {...p}>
    <path d="M3.5 9.5L12 4l8.5 5.5V20h-17V9.5z" />
    <path d="M8 20v-7h8v7M8 16.5h8" />
  </Base>
);

export const IconoOjo = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
    <circle cx={12} cy={12} r={2.5} />
  </Base>
);

export const IconoMenu = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Base>
);

export const IconoRecibo = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 3.5h12v17l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5v-17z" />
    <path d="M9 8h6M9 11.5h6M9 15h3.5" />
  </Base>
);

export const IconoCompartir = (p: IconProps) => (
  <Base {...p}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4" />
  </Base>
);

export const IconoDescargar = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3v12M8 11l4 4 4-4" />
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </Base>
);

export const IconoQR = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 14h3v3M20 14v.01M14 20v.01M17 20h.01M20 17v4" />
  </Base>
);
