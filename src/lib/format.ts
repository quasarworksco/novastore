const usd = new Intl.NumberFormat("es-VE", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatoMoneda(valor: number): string {
  return usd.format(valor);
}

export function formatoPorcentaje(valor: number): string {
  return `${valor.toFixed(2)}%`;
}

export function formatoFecha(epochMs: number): string {
  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(epochMs));
}
