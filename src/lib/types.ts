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
  /** Si la venta (o su deuda) ya fue cobrada. */
  pagado: boolean;
  /** Fecha acordada para cobrar la deuda (epoch ms) o null. */
  fechaCobro: number | null;
  creadoEn: number;
}

export type VentaInput = Omit<Venta, "id" | "creadoEn">;

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
