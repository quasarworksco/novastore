import type { Producto } from "@/lib/types";

const ahora = Date.now();

/**
 * Catálogo de ejemplo usado solo en modo demo (sin Firebase configurado)
 * para que la tienda sea navegable desde el primer arranque.
 */
export const productosSemilla: Producto[] = [
  {
    id: "perfume-aurora",
    nombre: "Aurora Intense 100ml",
    descripcion:
      "Eau de parfum con notas de bergamota, jazmín y ámbar. Estuche de lujo incluido.",
    categoria: "Perfumes",
    precioCosto: 28,
    precioVenta: 55,
    precioVentaDivisas: 48,
    stock: 14,
    imagenes: [
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=900&q=80",
      "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=900&q=80",
    ],
    activo: true,
    destacado: true,
    creadoEn: ahora - 86400000 * 12,
    actualizadoEn: ahora - 86400000 * 2,
  },
  {
    id: "perfume-noir",
    nombre: "Noir Élégance 75ml",
    descripcion: "Fragancia masculina amaderada con acordes de cuero y vainilla negra.",
    categoria: "Perfumes",
    precioCosto: 32,
    precioVenta: 62,
    precioVentaDivisas: 55,
    stock: 9,
    imagenes: [
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=900&q=80",
    ],
    activo: true,
    destacado: false,
    creadoEn: ahora - 86400000 * 10,
    actualizadoEn: ahora - 86400000 * 3,
  },
  {
    id: "audifonos-nova",
    nombre: "Audífonos Nova ANC",
    descripcion:
      "Cancelación activa de ruido, 40h de batería, Bluetooth 5.3 y estuche de carga rápida.",
    categoria: "Electrónica",
    precioCosto: 45,
    precioVenta: 89,
    precioVentaDivisas: 79,
    stock: 22,
    imagenes: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=900&q=80",
    ],
    activo: true,
    destacado: true,
    creadoEn: ahora - 86400000 * 8,
    actualizadoEn: ahora - 86400000,
  },
  {
    id: "smartwatch-pulse",
    nombre: "Smartwatch Pulse S2",
    descripcion:
      "Pantalla AMOLED 1.43”, monitoreo de salud 24/7, GPS y resistencia al agua 5ATM.",
    categoria: "Electrónica",
    precioCosto: 58,
    precioVenta: 68,
    precioVentaDivisas: 64,
    stock: 11,
    imagenes: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900&q=80",
    ],
    activo: true,
    destacado: true,
    creadoEn: ahora - 86400000 * 7,
    actualizadoEn: ahora - 86400000,
  },
  {
    id: "lentes-sol-vega",
    nombre: "Lentes de Sol Vega",
    descripcion: "Protección UV400, montura ultraliviana de acetato y estuche rígido.",
    categoria: "Accesorios",
    precioCosto: 12,
    precioVenta: 29,
    precioVentaDivisas: 25,
    stock: 30,
    imagenes: [
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=900&q=80",
    ],
    activo: true,
    destacado: false,
    creadoEn: ahora - 86400000 * 6,
    actualizadoEn: ahora - 86400000 * 4,
  },
  {
    id: "bolso-lumen",
    nombre: "Bolso Lumen Mini",
    descripcion: "Bolso crossbody de cuero vegano con herrajes dorados y correa ajustable.",
    categoria: "Accesorios",
    precioCosto: 18,
    precioVenta: 42,
    precioVentaDivisas: 36,
    stock: 0,
    imagenes: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=900&q=80",
    ],
    activo: true,
    destacado: false,
    creadoEn: ahora - 86400000 * 5,
    actualizadoEn: ahora - 86400000 * 2,
  },
  {
    id: "robot-astro",
    nombre: "Robot Astro Kids",
    descripcion:
      "Robot interactivo programable con sensores de gestos, luces LED y control remoto.",
    categoria: "Juguetes",
    precioCosto: 25,
    precioVenta: 54,
    precioVentaDivisas: 47,
    stock: 16,
    imagenes: [
      "https://images.unsplash.com/photo-1563396983906-b3795482a59a?w=900&q=80",
    ],
    activo: true,
    destacado: true,
    creadoEn: ahora - 86400000 * 4,
    actualizadoEn: ahora - 86400000,
  },
  {
    id: "bloques-galaxy",
    nombre: "Set Bloques Galaxy 520pz",
    descripcion: "Set de construcción espacial de 520 piezas compatible con marcas líderes.",
    categoria: "Juguetes",
    precioCosto: 15,
    precioVenta: 34,
    precioVentaDivisas: 29,
    stock: 20,
    imagenes: [
      "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=900&q=80",
    ],
    activo: true,
    destacado: false,
    creadoEn: ahora - 86400000 * 3,
    actualizadoEn: ahora,
  },
];
