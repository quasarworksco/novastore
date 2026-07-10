/**
 * Fondo blanco "estrellado" minimalista: puntos tenues que titilan con
 * suavidad sobre un lienzo claro. Las posiciones se generan de forma
 * determinística (semilla fija) para que el HTML del servidor y el cliente
 * coincidan y no haya parpadeo de hidratación.
 */

function prng(semilla: number) {
  let s = semilla;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const aleatorio = prng(20260710);

const estrellas = Array.from({ length: 44 }, () => ({
  x: aleatorio() * 100,
  y: aleatorio() * 100,
  r: 0.6 + aleatorio() * 1.6,
  dur: 3 + aleatorio() * 5,
  delay: aleatorio() * 6,
  op: 0.25 + aleatorio() * 0.5,
}));

export function Starfield() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Glows muy suaves que se desplazan lentamente */}
      <div className="absolute -left-24 top-[-8%] h-[380px] w-[380px] rounded-full bg-indigo-200/25 blur-[130px] animate-blob-slow" />
      <div className="absolute right-[-8%] top-[25%] h-[320px] w-[320px] rounded-full bg-sky-200/25 blur-[130px] animate-blob-slower" />
      <div className="absolute bottom-[-12%] left-[35%] h-[360px] w-[360px] rounded-full bg-fuchsia-200/20 blur-[140px] animate-blob-slow" />

      {/* Estrellas titilantes */}
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        {estrellas.map((e, i) => (
          <circle
            key={i}
            cx={`${e.x}%`}
            cy={`${e.y}%`}
            r={e.r}
            fill="#6366f1"
            style={{
              opacity: e.op,
              animation: `twinkle ${e.dur}s ease-in-out ${e.delay}s infinite`,
            }}
          />
        ))}
      </svg>
    </div>
  );
}
