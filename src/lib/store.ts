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
import type {
  Cliente,
  ConfigTienda,
  Gasto,
  GastoInput,
  Producto,
  ProductoInput,
  Venta,
  VentaInput,
} from "./types";
import { totalAbonado } from "./types";

export const modoDemo = !firebaseConfigurado;

type Unsubscribe = () => void;

/* ── Almacén demo (localStorage) ─────────────────────────────────── */

interface EstadoDemo {
  productos: Producto[];
  ventas: Venta[];
  clientes: Cliente[];
  gastos?: Gasto[];
  config?: ConfigTienda;
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
  estadoDemo = { productos: [...productosSemilla], ventas: [], clientes: [], gastos: [] };
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

/**
 * Estrategia de lecturas pensada para la cuota gratuita de Firestore
 * (50.000 lecturas/día; cada documento devuelto cuenta como 1 lectura):
 *
 *  - UNA carga por colección al abrir la página (nada de sondeo continuo:
 *    un intervalo de 15s dejado abierto toda la noche agota la cuota él solo).
 *  - Caché en localStorage: pinta al instante en visitas repetidas y sirve
 *    de respaldo visual si la red o la cuota fallan.
 *  - Revalidación solo al volver a la pestaña y si pasaron > 5 minutos.
 *  - Refresco inmediato tras cada mutación (crear/editar/borrar).
 */
const TTL_REVALIDACION_MS = 5 * 60 * 1000;

interface Fuente<T> {
  suscribir: (cb: (datos: T[]) => void) => Unsubscribe;
  refrescar: () => Promise<void>;
  revalidarSiViejo: () => void;
}

/** Aviso global de fallo de lectura (cuota agotada / sin conexión). */
const oyentesError = new Set<(hayError: boolean) => void>();
let hayErrorLectura = false;

function marcarErrorLectura(valor: boolean) {
  if (hayErrorLectura !== valor) {
    hayErrorLectura = valor;
    oyentesError.forEach((cb) => cb(valor));
  }
}

/** Suscripción al estado de salud de las lecturas (banner en la UI). */
export function suscribirErrorDatos(cb: (hayError: boolean) => void): Unsubscribe {
  oyentesError.add(cb);
  cb(hayErrorLectura);
  return () => oyentesError.delete(cb);
}

function crearFuente<T>(coleccion: string, ordenar: (datos: T[]) => T[]): Fuente<T> {
  const suscriptores = new Set<(datos: T[]) => void>();
  const CLAVE_CACHE = `novastore-cache-${coleccion}`;
  let datos: T[] = [];
  let cargado = false;
  let ultimaCarga = 0;
  let enVuelo: Promise<void> | null = null;

  function leerCache(): T[] | null {
    if (typeof window === "undefined") return null;
    try {
      const crudo = window.localStorage.getItem(CLAVE_CACHE);
      return crudo ? (JSON.parse(crudo) as T[]) : null;
    } catch {
      return null;
    }
  }

  function guardarCache() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(CLAVE_CACHE, JSON.stringify(datos));
    } catch {
      // cuota de localStorage excedida: seguir sin caché
    }
  }

  function emitir() {
    suscriptores.forEach((cb) => cb(datos));
  }

  function refrescar(): Promise<void> {
    if (enVuelo) return enVuelo;
    enVuelo = (async () => {
      try {
        datos = ordenar(await rest.listar<T>(coleccion));
        cargado = true;
        ultimaCarga = Date.now();
        guardarCache();
        marcarErrorLectura(false);
        emitir();
      } catch {
        marcarErrorLectura(true);
        // Fallback: mostrar la última copia local conocida.
        if (!cargado) {
          const cache = leerCache();
          if (cache) {
            datos = ordenar(cache);
            cargado = true;
            emitir();
          }
        }
      } finally {
        enVuelo = null;
      }
    })();
    return enVuelo;
  }

  function revalidarSiViejo() {
    if (suscriptores.size > 0 && Date.now() - ultimaCarga > TTL_REVALIDACION_MS) {
      refrescar();
    }
  }

  function suscribir(cb: (datos: T[]) => void): Unsubscribe {
    suscriptores.add(cb);
    if (cargado) {
      cb(datos);
      revalidarSiViejo();
    } else {
      // Pintado instantáneo desde caché mientras llega lo fresco.
      const cache = leerCache();
      if (cache) {
        datos = ordenar(cache);
        cb(datos);
      }
      refrescar();
    }
    return () => {
      suscriptores.delete(cb);
    };
  }

  return { suscribir, refrescar, revalidarSiViejo };
}

const porFecha = <T extends { creadoEn: number }>(d: T[]) => [...d].sort((a, b) => b.creadoEn - a.creadoEn);

const fuenteProductos = crearFuente<Producto>("productos", porFecha);
const fuenteVentas = crearFuente<Venta>("ventas", porFecha);
const fuenteClientes = crearFuente<Cliente>("clientes", (d) =>
  [...d].sort((a, b) => b.ultimoPedido - a.ultimoPedido)
);
const fuenteGastos = crearFuente<Gasto>("gastos", porFecha);

// Revalidar (con TTL) al volver a la pestaña, en lugar de sondear siempre.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !modoDemo) {
      [fuenteProductos, fuenteVentas, fuenteClientes, fuenteGastos].forEach((f) =>
        f.revalidarSiViejo()
      );
    }
  });
}

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

export function suscribirGastos(cb: (gastos: Gasto[]) => void): Unsubscribe {
  if (modoDemo) return suscribirDemo((e) => porFecha(e.gastos ?? []), cb);
  return fuenteGastos.suscribir(cb);
}

/* ── Configuración de la tienda (tasa de cambio) ─────────────────── */

const CONFIG_POR_DEFECTO: ConfigTienda = { tasaBs: 0, actualizadoEn: 0 };
const CLAVE_CACHE_CONFIG = "novastore-cache-config";
let configActual: ConfigTienda = CONFIG_POR_DEFECTO;
let configCargada = false;
let ultimaCargaConfig = 0;
const oyentesConfig = new Set<(c: ConfigTienda) => void>();

async function refrescarConfig(): Promise<void> {
  try {
    if (modoDemo) {
      configActual = cargarDemo().config ?? CONFIG_POR_DEFECTO;
    } else {
      const doc = await rest.obtener<ConfigTienda & { id: string }>("config", "general");
      if (doc) configActual = { tasaBs: doc.tasaBs ?? 0, actualizadoEn: doc.actualizadoEn ?? 0 };
      try {
        window.localStorage.setItem(CLAVE_CACHE_CONFIG, JSON.stringify(configActual));
      } catch {
        /* sin caché */
      }
    }
    configCargada = true;
    ultimaCargaConfig = Date.now();
    oyentesConfig.forEach((cb) => cb(configActual));
  } catch {
    // Fallback a la última copia local conocida.
    if (!configCargada && typeof window !== "undefined") {
      try {
        const crudo = window.localStorage.getItem(CLAVE_CACHE_CONFIG);
        if (crudo) {
          configActual = JSON.parse(crudo) as ConfigTienda;
          configCargada = true;
          oyentesConfig.forEach((cb) => cb(configActual));
        }
      } catch {
        /* sin caché */
      }
    }
  }
}

export function suscribirConfig(cb: (config: ConfigTienda) => void): Unsubscribe {
  oyentesConfig.add(cb);
  if (configCargada) {
    cb(configActual);
    if (Date.now() - ultimaCargaConfig > TTL_REVALIDACION_MS) refrescarConfig();
  } else {
    refrescarConfig();
  }
  return () => {
    oyentesConfig.delete(cb);
  };
}

export async function guardarTasaBs(tasaBs: number): Promise<void> {
  const ahora = Date.now();
  if (modoDemo) {
    cargarDemo().config = { tasaBs, actualizadoEn: ahora };
    notificarDemo();
  } else {
    // PATCH crea el documento si no existe.
    await rest.actualizar("config", "general", { tasaBs, actualizadoEn: ahora });
  }
  await refrescarConfig();
}

/* ── Gastos ──────────────────────────────────────────────────────── */

export async function crearGasto(datos: GastoInput): Promise<void> {
  const ahora = Date.now();
  if (modoDemo) {
    const estado = cargarDemo();
    estado.gastos = [{ ...datos, id: idDemo("gasto"), creadoEn: ahora }, ...(estado.gastos ?? [])];
    notificarDemo();
    return;
  }
  await rest.crear("gastos", { ...datos, creadoEn: ahora });
  await fuenteGastos.refrescar();
}

export async function eliminarGasto(id: string): Promise<void> {
  if (modoDemo) {
    const estado = cargarDemo();
    estado.gastos = (estado.gastos ?? []).filter((g) => g.id !== id);
    notificarDemo();
    return;
  }
  await rest.eliminar("gastos", id);
  await fuenteGastos.refrescar();
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

/**
 * Registra un abono (pago parcial) sobre una venta fiada. Si con el abono
 * se cubre el total, la venta queda marcada como pagada.
 */
export async function abonarVenta(venta: Venta, monto: number): Promise<void> {
  const abonos = [...(venta.abonos ?? []), { monto, fecha: Date.now() }];
  const acumulado = totalAbonado({ ...venta, abonos });
  const pagado = acumulado >= venta.total - 0.005;
  await actualizarVenta(venta.id, {
    abonos,
    pagado,
    ...(pagado ? { estado: "entregada" as const } : {}),
  });
}

/* ── Gestión de clientes ─────────────────────────────────────────── */

export async function eliminarCliente(id: string): Promise<void> {
  if (modoDemo) {
    const st = cargarDemo();
    st.clientes = st.clientes.filter((c) => c.id !== id);
    notificarDemo();
    return;
  }
  await rest.eliminar("clientes", id);
  await fuenteClientes.refrescar();
}

/**
 * Une clientes duplicados: suma pedidos y total gastado en el cliente
 * destino (conserva su nombre) y elimina los demás registros.
 */
export async function unirClientes(destino: Cliente, duplicados: Cliente[]): Promise<void> {
  const pedidos = destino.pedidos + duplicados.reduce((a, c) => a + c.pedidos, 0);
  const totalGastado = destino.totalGastado + duplicados.reduce((a, c) => a + c.totalGastado, 0);
  const ultimoPedido = Math.max(destino.ultimoPedido, ...duplicados.map((c) => c.ultimoPedido));
  const creadoEn = Math.min(destino.creadoEn, ...duplicados.map((c) => c.creadoEn));
  // Conservar un teléfono si el destino no tiene.
  const telefono = destino.telefono || duplicados.find((c) => c.telefono)?.telefono || "";

  if (modoDemo) {
    const st = cargarDemo();
    const idsDuplicados = new Set(duplicados.map((c) => c.id));
    const dest = st.clientes.find((c) => c.id === destino.id);
    if (dest) Object.assign(dest, { pedidos, totalGastado, ultimoPedido, creadoEn, telefono });
    st.clientes = st.clientes.filter((c) => !idsDuplicados.has(c.id));
    notificarDemo();
    return;
  }

  await rest.actualizar("clientes", destino.id, {
    pedidos,
    totalGastado,
    ultimoPedido,
    creadoEn,
    telefono,
  });
  await Promise.all(duplicados.map((c) => rest.eliminar("clientes", c.id)));
  await fuenteClientes.refrescar();
}

/** Elimina una venta del historial (no repone stock ni ajusta clientes). */
export async function eliminarVenta(id: string): Promise<void> {
  if (modoDemo) {
    const st = cargarDemo();
    st.ventas = st.ventas.filter((v) => v.id !== id);
    notificarDemo();
    return;
  }
  await rest.eliminar("ventas", id);
  await fuenteVentas.refrescar();
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
