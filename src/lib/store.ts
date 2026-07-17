"use client";

/**
 * Capa de datos de la tienda.
 *
 * Con Firebase configurado usa Firestore vía REST (src/lib/firestore-rest.ts):
 * una carga por visita + caché local, y las mutaciones actualizan el estado
 * en memoria sin releer colecciones. Sin credenciales cae a un almacén demo
 * en localStorage con la misma API, para que todo funcione desde el arranque.
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
 *  - Revalidación solo al volver a la pestaña y si pasaron > 15 minutos.
 *  - Las mutaciones (crear/editar/borrar) actualizan el estado local tras
 *    el write exitoso, sin releer la colección completa.
 *  - Ante un fallo de lectura se reintenta una vez antes de mostrar el
 *    aviso, y se rechequea cada minuto para retirarlo al reconectar.
 */
const TTL_REVALIDACION_MS = 15 * 60 * 1000;
const REINTENTO_ERROR_MS = 4000;
const RECHEQUEO_ERROR_MS = 60000;

interface Fuente<T> {
  suscribir: (cb: (datos: T[]) => void) => Unsubscribe;
  refrescar: () => Promise<void>;
  revalidarSiViejo: () => void;
  /** Aplica una mutación local (tras un write exitoso) sin releer la colección. */
  aplicarLocal: (mutador: (datos: T[]) => T[]) => void;
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

  let rechequeoProgramado = false;

  function refrescar(esReintento = false): Promise<void> {
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
        // Fallback: mostrar la última copia local conocida.
        if (!cargado) {
          const cache = leerCache();
          if (cache) {
            datos = ordenar(cache);
            cargado = true;
            emitir();
          }
        }
        if (!esReintento) {
          // Un fallo aislado (micro-corte de red) no debe mostrar el aviso:
          // reintentar una vez a los pocos segundos antes de alarmarse.
          setTimeout(() => {
            if (suscriptores.size > 0) refrescar(true);
          }, REINTENTO_ERROR_MS);
        } else {
          marcarErrorLectura(true);
          // Auto-recuperación: rechequear periódicamente para quitar el
          // aviso solo cuando la conexión vuelva de verdad.
          if (!rechequeoProgramado) {
            rechequeoProgramado = true;
            setTimeout(() => {
              rechequeoProgramado = false;
              if (suscriptores.size > 0 && hayErrorLectura) refrescar(true);
            }, RECHEQUEO_ERROR_MS);
          }
        }
      } finally {
        enVuelo = null;
      }
    })();
    return enVuelo;
  }

  function aplicarLocal(mutador: (datos: T[]) => T[]) {
    datos = ordenar(mutador(datos));
    cargado = true;
    guardarCache();
    emitir();
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

  return { suscribir, refrescar, revalidarSiViejo, aplicarLocal };
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
  const id = await rest.crear("gastos", { ...datos, creadoEn: ahora });
  fuenteGastos.aplicarLocal((d) => [{ ...datos, id, creadoEn: ahora }, ...d]);
}

export async function eliminarGasto(id: string): Promise<void> {
  if (modoDemo) {
    const estado = cargarDemo();
    estado.gastos = (estado.gastos ?? []).filter((g) => g.id !== id);
    notificarDemo();
    return;
  }
  await rest.eliminar("gastos", id);
  fuenteGastos.aplicarLocal((d) => d.filter((g) => g.id !== id));
}

/* ── CRUD de productos ───────────────────────────────────────────── */

export async function crearProducto(datos: ProductoInput): Promise<void> {
  const ahora = Date.now();
  if (modoDemo) {
    cargarDemo().productos.unshift({ ...datos, id: idDemo("prod"), creadoEn: ahora, actualizadoEn: ahora });
    notificarDemo();
    return;
  }
  const id = await rest.crear("productos", { ...datos, creadoEn: ahora, actualizadoEn: ahora });
  fuenteProductos.aplicarLocal((d) => [{ ...datos, id, creadoEn: ahora, actualizadoEn: ahora }, ...d]);
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
  fuenteProductos.aplicarLocal((d) =>
    d.map((p) => (p.id === id ? { ...p, ...datos, actualizadoEn: ahora } : p))
  );
}

export async function eliminarProducto(id: string): Promise<void> {
  if (modoDemo) {
    const estado = cargarDemo();
    estado.productos = estado.productos.filter((p) => p.id !== id);
    notificarDemo();
    return;
  }
  await rest.eliminar("productos", id);
  fuenteProductos.aplicarLocal((d) => d.filter((p) => p.id !== id));
}

/* ── Registro de ventas y clientes ───────────────────────────────── */

/**
 * Encuentra el cliente que corresponde a una venta.
 *
 * Con teléfono se busca por teléfono (y como respaldo por nombre, para
 * completarle el teléfono a un cliente registrado sin él). Sin teléfono se
 * busca SOLO por nombre: nunca por teléfono vacío, porque eso hacía que
 * todas las ventas sin teléfono se acumularan en un mismo cliente.
 */
/**
 * Reintenta una operación de red con espera creciente antes de rendirse.
 * Útil para que un corte breve de conexión no deje datos a medias.
 */
async function reintentar<T>(fn: () => Promise<T>, intentos = 3, esperaMs = 700): Promise<T> {
  let ultimoError: unknown;
  for (let i = 0; i < intentos; i++) {
    try {
      return await fn();
    } catch (e) {
      ultimoError = e;
      if (i < intentos - 1) await new Promise((r) => setTimeout(r, esperaMs * (i + 1)));
    }
  }
  throw ultimoError;
}

function buscarClienteExistente(
  clientes: Cliente[],
  nombre: string,
  telefono: string
): Cliente | undefined {
  const nombreNorm = nombre.trim().toLowerCase();
  const porNombre = () =>
    nombreNorm ? clientes.find((c) => c.nombre.trim().toLowerCase() === nombreNorm) : undefined;
  if (telefono) {
    return clientes.find((c) => c.telefono === telefono) ?? porNombre();
  }
  return porNombre();
}

/** Descuenta stock y registra la venta en el cliente (almacén demo). */
function aplicarInventarioYClienteDemo(
  estado: EstadoDemo,
  venta: Pick<Venta, "items" | "cliente" | "total">,
  telefono: string,
  ahora: number
) {
  for (const item of venta.items) {
    const p = estado.productos.find((x) => x.id === item.productoId);
    if (p) p.stock = Math.max(0, p.stock - item.cantidad);
  }
  const existente = buscarClienteExistente(estado.clientes, venta.cliente.nombre, telefono);
  if (existente) {
    existente.pedidos += 1;
    existente.totalGastado += venta.total;
    existente.ultimoPedido = ahora;
    if (!existente.telefono && telefono) existente.telefono = telefono;
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
}

/** Descuenta stock y registra la venta en el cliente (Firestore vía REST). */
async function aplicarInventarioYCliente(
  venta: Pick<Venta, "items" | "cliente" | "total">,
  telefono: string,
  ahora: number
): Promise<void> {
  // Descontar stock (lectura-modificación-escritura por ítem).
  await Promise.all(
    venta.items.map(async (item) => {
      const p = await rest.obtener<Producto>("productos", item.productoId).catch(() => null);
      if (p) {
        const nuevoStock = Math.max(0, p.stock - item.cantidad);
        await rest
          .actualizar("productos", item.productoId, { stock: nuevoStock, actualizadoEn: ahora })
          .catch(() => undefined);
        fuenteProductos.aplicarLocal((d) =>
          d.map((x) => (x.id === item.productoId ? { ...x, stock: nuevoStock } : x))
        );
      }
    })
  );

  // Upsert de cliente: consulta puntual por teléfono (o por nombre si no
  // hay teléfono) en lugar de leer la colección completa.
  const candidatos = telefono
    ? await rest.consultarPorCampo<Cliente>("clientes", "telefono", telefono).catch(() => [])
    : await rest
        .consultarPorCampo<Cliente>("clientes", "nombre", venta.cliente.nombre.trim())
        .catch(() => [] as Cliente[]);
  const existente = buscarClienteExistente(candidatos, venta.cliente.nombre, telefono);

  if (existente) {
    const actualizado: Cliente = {
      ...existente,
      pedidos: existente.pedidos + 1,
      totalGastado: existente.totalGastado + venta.total,
      ultimoPedido: ahora,
      telefono: existente.telefono || telefono,
    };
    await rest.actualizar("clientes", existente.id, {
      pedidos: actualizado.pedidos,
      totalGastado: actualizado.totalGastado,
      ultimoPedido: ahora,
      ...(!existente.telefono && telefono ? { telefono } : {}),
    });
    fuenteClientes.aplicarLocal((d) => {
      const resto = d.filter((c) => c.id !== existente.id);
      return [...resto, actualizado];
    });
  } else {
    const nuevo = {
      nombre: venta.cliente.nombre,
      telefono,
      pedidos: 1,
      totalGastado: venta.total,
      creadoEn: ahora,
      ultimoPedido: ahora,
    };
    const idCliente = await rest.crear("clientes", nuevo);
    fuenteClientes.aplicarLocal((d) => [{ ...nuevo, id: idCliente }, ...d]);
  }
}

export async function registrarVenta(venta: VentaInput): Promise<void> {
  const ahora = Date.now();
  const telefono = venta.cliente.telefono.replace(/\D/g, "");

  // Los pedidos de la tienda entran «pendientes»: NO descuentan stock ni
  // tocan al cliente hasta que el dueño los apruebe en el panel. Las ventas
  // manuales sí se aplican de inmediato, como siempre.
  const diferido = venta.estado === "pendiente";
  const datos: VentaInput = { ...venta, inventarioDescontado: !diferido };

  if (modoDemo) {
    const estado = cargarDemo();
    estado.ventas.unshift({ ...datos, id: idDemo("venta"), creadoEn: ahora });
    if (!diferido) aplicarInventarioYClienteDemo(estado, venta, telefono, ahora);
    notificarDemo();
    return;
  }

  const idVenta = await rest.crear("ventas", { ...datos, creadoEn: ahora });
  fuenteVentas.aplicarLocal((d) => [{ ...datos, id: idVenta, creadoEn: ahora }, ...d]);

  if (!diferido) await aplicarInventarioYCliente(venta, telefono, ahora);
}

/**
 * Aprueba un pedido pendiente de la tienda: descuenta el stock, registra la
 * venta en el cliente y marca la venta como confirmada (o el estado dado).
 */
export async function aprobarVenta(
  venta: Venta,
  estadoFinal: Venta["estado"] = "confirmada"
): Promise<void> {
  const ahora = Date.now();
  const telefono = venta.cliente.telefono.replace(/\D/g, "");
  const cambios = { estado: estadoFinal, pagado: true, inventarioDescontado: true };

  if (modoDemo) {
    const st = cargarDemo();
    const v = st.ventas.find((x) => x.id === venta.id);
    if (v) {
      if (v.inventarioDescontado === false) aplicarInventarioYClienteDemo(st, v, telefono, ahora);
      Object.assign(v, cambios);
      notificarDemo();
    }
    return;
  }

  if (venta.inventarioDescontado === false) {
    await aplicarInventarioYCliente(venta, telefono, ahora);
  }
  await actualizarVenta(venta.id, cambios);
}

/** Rechaza un pedido pendiente: lo cancela sin tocar stock ni clientes. */
export async function rechazarVenta(venta: Venta): Promise<void> {
  await actualizarVenta(venta.id, { estado: "cancelada", pagado: false });
}

export async function actualizarEstadoVenta(venta: Venta, estado: Venta["estado"]): Promise<void> {
  // Si un pedido pendiente (sin stock descontado) pasa a confirmada o
  // entregada, equivale a aprobarlo: se descuenta inventario y cliente.
  if (venta.inventarioDescontado === false && (estado === "confirmada" || estado === "entregada")) {
    await aprobarVenta(venta, estado);
    return;
  }
  await actualizarVenta(venta.id, { estado });
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

/** Edita el nombre y/o teléfono de un cliente (por si quedó mal escrito). */
export async function actualizarCliente(
  id: string,
  datos: { nombre: string; telefono: string }
): Promise<void> {
  const cambios = { nombre: datos.nombre.trim(), telefono: datos.telefono.replace(/\D/g, "") };
  if (modoDemo) {
    const st = cargarDemo();
    const c = st.clientes.find((x) => x.id === id);
    if (c) {
      Object.assign(c, cambios);
      notificarDemo();
    }
    return;
  }
  await rest.actualizar("clientes", id, cambios);
  fuenteClientes.aplicarLocal((d) => d.map((c) => (c.id === id ? { ...c, ...cambios } : c)));
}

export async function eliminarCliente(id: string): Promise<void> {
  if (modoDemo) {
    const st = cargarDemo();
    st.clientes = st.clientes.filter((c) => c.id !== id);
    notificarDemo();
    return;
  }
  await rest.eliminar("clientes", id);
  fuenteClientes.aplicarLocal((d) => d.filter((c) => c.id !== id));
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
  const idsDuplicados = new Set(duplicados.map((c) => c.id));
  fuenteClientes.aplicarLocal((d) =>
    d
      .filter((c) => !idsDuplicados.has(c.id))
      .map((c) =>
        c.id === destino.id
          ? { ...c, pedidos, totalGastado, ultimoPedido, creadoEn, telefono }
          : c
      )
  );
}

/**
 * Elimina una venta del historial y deja todo cuadrado:
 *  - devuelve al stock las unidades de cada producto vendido (si aún existe),
 *  - descuenta esa venta del cliente (un pedido menos y su monto del total
 *    gastado). Si al cliente no le quedan pedidos, se elimina su registro,
 *    reflejando que se creó a partir de sus ventas.
 */
export async function eliminarVenta(venta: Venta): Promise<void> {
  const ahora = Date.now();
  const telefono = venta.cliente.telefono.replace(/\D/g, "");
  // Un pedido pendiente nunca descontó stock ni se sumó al cliente, así que
  // al eliminarlo no hay nada que reponer ni descontar.
  const descontada = venta.inventarioDescontado !== false;

  if (modoDemo) {
    const st = cargarDemo();
    st.ventas = st.ventas.filter((v) => v.id !== venta.id);
    if (descontada) {
      for (const item of venta.items) {
        const p = st.productos.find((x) => x.id === item.productoId);
        if (p) p.stock += item.cantidad;
      }
      const cli = buscarClienteExistente(st.clientes, venta.cliente.nombre, telefono);
      if (cli) {
        cli.pedidos -= 1;
        cli.totalGastado = Math.max(0, cli.totalGastado - venta.total);
        if (cli.pedidos <= 0) st.clientes = st.clientes.filter((c) => c.id !== cli.id);
      }
    }
    notificarDemo();
    return;
  }

  // La venta se borra con reintentos: si falla del todo, no seguimos
  // (no queremos reponer stock ni tocar al cliente de una venta que sigue viva).
  await reintentar(() => rest.eliminar("ventas", venta.id));
  fuenteVentas.aplicarLocal((d) => d.filter((v) => v.id !== venta.id));

  if (!descontada) return;

  // Reponer stock de cada ítem de la venta eliminada (con reintentos).
  await Promise.all(
    venta.items.map(async (item) => {
      const p = await reintentar(() => rest.obtener<Producto>("productos", item.productoId)).catch(
        () => null
      );
      if (p) {
        const nuevoStock = p.stock + item.cantidad;
        await reintentar(() =>
          rest.actualizar("productos", item.productoId, { stock: nuevoStock, actualizadoEn: ahora })
        ).catch(() => undefined);
        fuenteProductos.aplicarLocal((d) =>
          d.map((x) => (x.id === item.productoId ? { ...x, stock: nuevoStock } : x))
        );
      }
    })
  );

  // Descontar la venta del cliente (consulta puntual, sin releer todo), con
  // reintentos para que un corte breve no deje el total del cliente inflado.
  const candidatos = await reintentar(() =>
    telefono
      ? rest.consultarPorCampo<Cliente>("clientes", "telefono", telefono)
      : rest.consultarPorCampo<Cliente>("clientes", "nombre", venta.cliente.nombre.trim())
  ).catch(() => [] as Cliente[]);
  const cli = buscarClienteExistente(candidatos, venta.cliente.nombre, telefono);
  if (cli) {
    const pedidos = cli.pedidos - 1;
    const totalGastado = Math.max(0, cli.totalGastado - venta.total);
    if (pedidos <= 0) {
      await reintentar(() => rest.eliminar("clientes", cli.id)).catch(() => undefined);
      fuenteClientes.aplicarLocal((d) => d.filter((c) => c.id !== cli.id));
    } else {
      await reintentar(() => rest.actualizar("clientes", cli.id, { pedidos, totalGastado })).catch(
        () => undefined
      );
      fuenteClientes.aplicarLocal((d) =>
        d.map((c) => (c.id === cli.id ? { ...c, pedidos, totalGastado } : c))
      );
    }
  }
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
  fuenteVentas.aplicarLocal((d) => d.map((v) => (v.id === id ? { ...v, ...datos } : v)));
}
