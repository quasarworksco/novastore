import { formatoMoneda } from "./format";
import type { ItemCarrito, MetodoPago } from "./types";
import { precioSegunMetodo } from "./finance";

const NUMERO_WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "584121002090";

export function totalCarrito(items: ItemCarrito[], metodo: MetodoPago): number {
  return items.reduce(
    (acc, { producto, cantidad }) => acc + precioSegunMetodo(producto, metodo) * cantidad,
    0
  );
}

/** Construye la URL de WhatsApp con el resumen del pedido prellenado. */
export function enlacePedidoWhatsApp(
  items: ItemCarrito[],
  metodo: MetodoPago,
  cliente: { nombre: string; telefono: string }
): string {
  const lineas = items.map(({ producto, cantidad }) => {
    const unitario = precioSegunMetodo(producto, metodo);
    return `- ${cantidad} x ${producto.nombre} (${formatoMoneda(unitario)} c/u) = ${formatoMoneda(unitario * cantidad)}`;
  });

  const etiquetaPago =
    metodo === "divisas" ? "Divisas en efectivo (precio promocional)" : "Precio base";

  const mensaje = [
    "Hola NovaStore, quiero hacer un pedido:",
    "",
    ...lineas,
    "",
    `Total: ${formatoMoneda(totalCarrito(items, metodo))}`,
    `Metodo de pago: ${etiquetaPago}`,
    `Nombre: ${cliente.nombre}`,
    `Telefono: ${cliente.telefono}`,
  ].join("\n");

  return `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
}
