"use client";

/**
 * Capa de datos de la tienda.
 *
 * Con Firebase configurado usa Firestore vía REST (src/lib/firestore-rest.ts):
 * fetch inicial + sondeo ligero para simular tiempo real, y refresco inmediato
 * tras cada mutación. Sin credenciales cae a un almacén demo en localStorage
 * con la misma API, para que todo funcione desde el primer arranque.
 */

import { productosSemilla } from "@/data/seed";
import { firebaseConfigurado } from "./firebase";
import * as rest from "./firestore-rest";
import type { Cliente, Producto, ProductoInput, Venta, VentaInput } from "./types";

export const modoDemo = !firebaseConfigurado;

type Unsubscribe = () => void;
const INTERVALO_SONDEO_MS = 15000;

/* ── Almacén demo (localStorage) ─────────────────────────────────── */

interface EstadoDemo {
  productos: Producto[];
  ventas: Venta[];
  clientes: Cliente[];
}

const CLAVE_DEMO = "novastore-demo-v1";
let estadoDemo: EstadoDemo | null = null;
const oyentesDemo = new Set<() => void>();

function cargarDemo(): EstadoDemo {
  if (estadoDemo) return estadoDemo;
  if (typeof window !== "undefined") {
    try {
      const crudo = window.localStorage.getItem(CLAVE_DEMO);
      if (crudo) return (estadoDemo = JSON.parse(crudo) as EstadoDemo);
    } catch {
      /* re-sembrar */
    }
  }
  estadoDemo = { productos: [...productosSemilla], ventas: [], clientes: [] };
  persistirDemo();
  return estadoDemo;
}

function persistirDemo() {
  if (typeof window !== "undefined" && estadoDemo) {
    try {
      window.localStorage.setItem(CLAVE_DEMO, JSON.stringify(estadoDemo));
    } catch {
      /* cuota excedida */
    }
  }
}

function notificarDemo() {
  persistirDemo();
  oyentesDemo.forEach((fn) => fn());
}

function idDemo(prefijo: string): string {
  return `${prefijo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function suscribirDemo<T>(selector: (e: EstadoDemo) => T[], cb: (datos: T[]) => void): Unsubscribe {
  const emitir = () => cb(selector(cargarDemo()).slice());
  oyentesDemo.add(emitir);
  emitir();
  return () => oyentesDemo.delete(emitir);
}

/* ── Fuente REST con sondeo (para modo Firebase) ─────────────────── */

interface Fuente<T> {
  suscribir: (cb: (datos: T[]) => void) => Unsubscribe;
  refrescar: () => Promise<void>;
}

function crearFuente<T>(coleccion: string, ordenar: (datos: T[]) => T[]): Fuente<T> {
  const suscriptores = new Set<(datos: T[]) => void>();
  let datos: T[] = [];
  let intervalo: ReturnType<typeof setInterval> | null = null;
  let cargadoAlMenosUnaVez = false;

  async function refrescar() {
    try {
      datos = ordenar(await rest.listar<T>(coleccion));
      cargadoAlMenosUnaVez = true;
      suscriptores.forEach((cb) => cb(datos));
    } catch {
      // Mantener los últimos datos ante un fallo puntual de red.
    }
  }

  function suscribir(cb: (datos: T[]) => void): Unsubscribe {
    suscriptores.add(cb);
    if (cargadoAlMenosUnaVez) cb(datos);
    if (!intervalo) {
      refrescar();
      intervalo = setInterval(refrescar, INTERVALO_SONDEO_MS);
    }
    return () => {
      suscriptores.delete(cb);
      if (suscriptores.size === 0 && intervalo) {
        clearInterval(intervalo);
        intervalo = null;
      }
    };
  }

  return { suscribir, refrescar };
}

const porFecha = <T extends { creadoEn: number }>(d: T[]) => [...d].sort((a, b) => b.creadoEn - a.creadoEn);

const fuenteProductos = crearFuente<Producto>("productos", porFecha);
const fuenteVentas = crearFuente<Venta>("ventas", porFecha);
const fuenteClientes = crearFuente<Cliente>("clientes", (d) =>
  [...d].sort((a, b) => b.ultimoPedido - a.ultimoPedido)
);

/* ── Suscripciones públicas ──────────────────────────────────────── */

export function suscribirProductos(cb: (productos: Producto[]) => void): Unsubscribe {
  if (modoDemo) return suscribirDemo((e) => porFecha(e.productos), cb);
  return fuenteProductos.suscribir(cb);
}

export function suscribirVentas(cb: (ventas: Venta[]) => void): Unsubscribe {
  if (modoDemo) return suscribirDemo((e) => porFecha(e.ventas), cb);
  return fuenteVentas.suscribir(cb);
}

export function suscribirClientes(cb: (clientes: Cliente[]) => void): Unsubscribe {
  if (modoDemo)
    return suscribirDemo((e) => [...e.clientes].sort((a, b) => b.ultimoPedido - a.ultimoPedido), cb);
  return fuenteClientes.suscribir(cb);
}

/* ── CRUD de productos ───────────────────────────────────────────── */

export async function crearProducto(datos: ProductoInput): Promise<void> {
  const ahora = Date.now();
  if (modoDemo) {
    cargarDemo().productos.unshift({ ...datos, id: idDemo("prod"), creadoEn: ahora, actualizadoEn: ahora });
    notificarDemo();
    return;
  }
  await rest.crear("productos", { ...datos, creadoEn: ahora, actualizadoEn: ahora });
  await fuenteProductos.refrescar();
}

export async function actualizarProducto(id: string, datos: Partial<ProductoInput>): Promise<void> {
  const ahora = Date.now();
  if (modoDemo) {
    const estado = cargarDemo();
    const idx = estado.productos.findIndex((p) => p.id === id);
    if (idx >= 0) {
      estado.productos[idx] = { ...estado.productos[idx], ...datos, actualizadoEn: ahora };
      notificarDemo();
    }
    return;
  }
  await rest.actualizar("productos", id, { ...datos, actualizadoEn: ahora });
  await fuenteProductos.refrescar();
}

export async function eliminarProducto(id: string): Promise<void> {
  if (modoDemo) {
    const estado = cargarDemo();
    estado.productos = estado.productos.filter((p) => p.id !== id);
    notificarDemo();
    return;
  }
  await rest.eliminar("productos", id);
  await fuenteProductos.refrescar();
}

/* ── Registro de ventas y clientes ───────────────────────────────── */

export async function registrarVenta(venta: VentaInput): Promise<void> {
  const ahora = Date.now();
  const telefono = venta.cliente.telefono.replace(/\D/g, "");

  if (modoDemo) {
    const estado = cargarDemo();
    estado.ventas.unshift({ ...venta, id: idDemo("venta"), creadoEn: ahora });
    for (const item of venta.items) {
      const p = estado.productos.find((x) => x.id === item.productoId);
      if (p) p.stock = Math.max(0, p.stock - item.cantidad);
    }
    const existente = estado.clientes.find((c) => c.telefono === telefono);
    if (existente) {
      existente.pedidos += 1;
      existente.totalGastado += venta.total;
      existente.ultimoPedido = ahora;
      existente.nombre = venta.cliente.nombre || existente.nombre;
    } else {
      estado.clientes.push({
        id: idDemo("cli"),
        nombre: venta.cliente.nombre,
        telefono,
        pedidos: 1,
        totalGastado: venta.total,
        creadoEn: ahora,
        ultimoPedido: ahora,
      });
    }
    notificarDemo();
    return;
  }

  await rest.crear("ventas", { ...venta, creadoEn: ahora });

  // Descontar stock (lectura-modificación-escritura por ítem).
  await Promise.all(
    venta.items.map(async (item) => {
      const p = await rest.obtener<Producto>("productos", item.productoId).catch(() => null);
      if (p) {
        await rest
          .actualizar("productos", item.productoId, {
            stock: Math.max(0, p.stock - item.cantidad),
            actualizadoEn: ahora,
          })
          .catch(() => undefined);
      }
    })
  );

  // Upsert de cliente por teléfono.
  const clientes = await rest.listar<Cliente>("clientes").catch(() => [] as Cliente[]);
  const existente = clientes.find((c) => c.telefono === telefono);
  if (existente) {
    await rest.actualizar("clientes", existente.id, {
      pedidos: existente.pedidos + 1,
      totalGastado: existente.totalGastado + venta.total,
      ultimoPedido: ahora,
      nombre: venta.cliente.nombre || existente.nombre,
    });
  } else {
    await rest.crear("clientes", {
      nombre: venta.cliente.nombre,
      telefono,
      pedidos: 1,
      totalGastado: venta.total,
      creadoEn: ahora,
      ultimoPedido: ahora,
    });
  }

  await Promise.all([
    fuenteProductos.refrescar(),
    fuenteVentas.refrescar(),
    fuenteClientes.refrescar(),
  ]);
}

export async function actualizarEstadoVenta(id: string, estado: Venta["estado"]): Promise<void> {
  await actualizarVenta(id, { estado });
}

/** Actualiza campos de una venta (estado, pagado, fechaCobro, etc.). */
export async function actualizarVenta(id: string, datos: Partial<VentaInput>): Promise<void> {
  if (modoDemo) {
    const st = cargarDemo();
    const venta = st.ventas.find((v) => v.id === id);
    if (venta) {
      Object.assign(venta, datos);
      notificarDemo();
    }
    return;
  }
  await rest.actualizar("ventas", id, datos as Record<string, unknown>);
  await fuenteVentas.refrescar();
}
