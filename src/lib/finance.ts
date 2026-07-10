import type { MetodoPago, Producto } from "./types";

/** Margen (%) por debajo del cual se muestra una alerta visual en el panel. */
export const UMBRAL_MARGEN_BAJO = 15;

export function precioSegunMetodo(p: Producto, metodo: MetodoPago): number {
  return metodo === "divisas" ? p.precioVentaDivisas : p.precioVenta;
}

/** Diferencia (margen neto): precioVenta - precioCosto. */
export function margenNeto(p: Producto, metodo: MetodoPago = "base"): number {
  return precioSegunMetodo(p, metodo) - p.precioCosto;
}

/** Porcentaje de ganancia: ((precioVenta - precioCosto) / precioCosto) * 100. */
export function porcentajeGanancia(p: Producto, metodo: MetodoPago = "base"): number {
  if (p.precioCosto <= 0) return 0;
  return (margenNeto(p, metodo) / p.precioCosto) * 100;
}

export interface ResumenFinanciero {
  /** Suma de stock * precioCosto de cada producto. */
  valorInventario: number;
  /** Valor total si se vende todo el stock al precio de venta base. */
  proyeccionVenta: number;
  /** Valor total si se vende todo el stock al precio promocional en divisas. */
  proyeccionVentaDivisas: number;
  gananciaProyectada: number;
  gananciaProyectadaDivisas: number;
  unidadesEnStock: number;
  totalProductos: number;
  productosMargenBajo: number;
  productosSinStock: number;
}

export function resumenFinanciero(productos: Producto[]): ResumenFinanciero {
  const resumen: ResumenFinanciero = {
    valorInventario: 0,
    proyeccionVenta: 0,
    proyeccionVentaDivisas: 0,
    gananciaProyectada: 0,
    gananciaProyectadaDivisas: 0,
    unidadesEnStock: 0,
    totalProductos: productos.length,
    productosMargenBajo: 0,
    productosSinStock: 0,
  };

  for (const p of productos) {
    resumen.valorInventario += p.stock * p.precioCosto;
    resumen.proyeccionVenta += p.stock * p.precioVenta;
    resumen.proyeccionVentaDivisas += p.stock * p.precioVentaDivisas;
    resumen.unidadesEnStock += p.stock;
    if (porcentajeGanancia(p) < UMBRAL_MARGEN_BAJO) resumen.productosMargenBajo += 1;
    if (p.stock <= 0) resumen.productosSinStock += 1;
  }

  resumen.gananciaProyectada = resumen.proyeccionVenta - resumen.valorInventario;
  resumen.gananciaProyectadaDivisas = resumen.proyeccionVentaDivisas - resumen.valorInventario;
  return resumen;
}
