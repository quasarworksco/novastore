/**
 * Tipos de dominio compartidos entre la tienda y el panel administrativo.
 * Reflejan 1:1 el esquema de las colecciones de Firestore.
 */

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  /** Costo de adquisición del producto (obligatorio). */
  precioCosto: number;
  /** Precio de venta base (obligatorio). */
  precioVenta: number;
  /** Precio promocional cuando el cliente paga en divisas en físico. */
  precioVentaDivisas: number;
  stock: number;
  /** URLs (Cloudinary) de las imágenes del producto. */
  imagenes: string[];
  activo: boolean;
  /** Se muestra en la sección "Productos destacados" de la tienda. */
  destacado: boolean;
  creadoEn: number;
  actualizadoEn: number;
}

export type ProductoInput = Omit<Producto, "id" | "creadoEn" | "actualizadoEn">;

export type MetodoPago = "base" | "divisas";

export interface VentaItem {
  productoId: string;
  nombre: string;
  cantidad: number;
  /** Precio unitario aplicado según el método de pago elegido. */
  precioUnitario: number;
  /** Costo unitario al momento de la venta, para calcular ganancia real. */
  costoUnitario: number;
}

export interface AbonoVenta {
  monto: number;
  fecha: number;
}

export interface Venta {
  id: string;
  items: VentaItem[];
  total: number;
  metodoPago: MetodoPago;
  cliente: {
    nombre: string;
    telefono: string;
  };
  estado: "pendiente" | "confirmada" | "entregada" | "cancelada";
  /** Origen: pedido de la tienda online o venta manual en tienda física. */
  origen: "tienda" | "manual";
  /** Venta a crédito (fiado): el cliente queda debiendo. */
  fiado: boolean;
  /** Si la venta (o su deuda) ya fue cobrada por completo. */
  pagado: boolean;
  /** Fecha acordada para cobrar la deuda (epoch ms) o null. */
  fechaCobro: number | null;
  /** Pagos parciales registrados sobre la deuda. */
  abonos?: AbonoVenta[];
  /**
   * Si esta venta ya descontó unidades del inventario. Los pedidos de la
   * tienda entran en false y solo descuentan stock cuando el dueño los
   * aprueba. undefined = ventas antiguas, que sí descontaron (legado).
   */
  inventarioDescontado?: boolean;
  creadoEn: number;
}

export type VentaInput = Omit<Venta, "id" | "creadoEn">;

/** Monto ya abonado de una venta. */
export function totalAbonado(v: Venta): number {
  return (v.abonos ?? []).reduce((acc, a) => acc + a.monto, 0);
}

/** Saldo pendiente por cobrar de una venta fiada. */
export function saldoPendiente(v: Venta): number {
  return Math.max(0, v.total - totalAbonado(v));
}

export interface Gasto {
  id: string;
  descripcion: string;
  /** Ej.: Proveedores, Delivery, Servicios, Otros. */
  categoria: string;
  monto: number;
  creadoEn: number;
}

export type GastoInput = Omit<Gasto, "id" | "creadoEn">;

export interface ConfigTienda {
  /** Tasa de cambio: bolívares por 1 USD. 0 = no mostrar precios en Bs. */
  tasaBs: number;
  actualizadoEn: number;
}

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  pedidos: number;
  totalGastado: number;
  creadoEn: number;
  ultimoPedido: number;
}

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}
