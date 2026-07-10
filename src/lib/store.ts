"use client";

/**
 * Capa de acceso a datos.
 *
 * Con Firebase configurado usa Firestore en tiempo real (onSnapshot);
 * sin credenciales cae a un almacén demo en memoria persistido en
 * localStorage, con la misma API de suscripción, para que la tienda y el
 * panel administrativo funcionen completos desde el primer arranque.
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { productosSemilla } from "@/data/seed";
import { firebaseConfigurado, obtenerDb } from "./firebase";
import type { Cliente, Producto, ProductoInput, Venta } from "./types";

export const modoDemo = !firebaseConfigurado;

type Unsubscribe = () => void;

/* ── Almacén demo (localStorage) ─────────────────────────────────── */

interface EstadoDemo {
  productos: Producto[];
  ventas: Venta[];
  clientes: Cliente[];
}

const CLAVE_DEMO = "novastore-demo-v1";
let estadoDemo: EstadoDemo | null = null;
const oyentes = new Set<() => void>();

function cargarDemo(): EstadoDemo {
  if (estadoDemo) return estadoDemo;
  if (typeof window !== "undefined") {
    try {
      const crudo = window.localStorage.getItem(CLAVE_DEMO);
      if (crudo) {
        estadoDemo = JSON.parse(crudo) as EstadoDemo;
        return estadoDemo;
      }
    } catch {
      // localStorage corrupto o inaccesible: re-sembrar
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
      // cuota excedida: seguir solo en memoria
    }
  }
}

function notificarDemo() {
  persistirDemo();
  oyentes.forEach((fn) => fn());
}

function idDemo(prefijo: string): string {
  return `${prefijo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function suscribirDemo<T>(selector: (e: EstadoDemo) => T[], cb: (datos: T[]) => void): Unsubscribe {
  const emitir = () => cb(selector(cargarDemo()).slice());
  oyentes.add(emitir);
  emitir();
  return () => oyentes.delete(emitir);
}

/* ── Suscripciones en tiempo real ────────────────────────────────── */

export function suscribirProductos(cb: (productos: Producto[]) => void): Unsubscribe {
  if (modoDemo) {
    return suscribirDemo(
      (e) => [...e.productos].sort((a, b) => b.creadoEn - a.creadoEn),
      cb
    );
  }
  const q = query(collection(obtenerDb(), "productos"), orderBy("creadoEn", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ ...(d.data() as Omit<Producto, "id">), id: d.id })));
  });
}

export function suscribirVentas(cb: (ventas: Venta[]) => void): Unsubscribe {
  if (modoDemo) {
    return suscribirDemo((e) => [...e.ventas].sort((a, b) => b.creadoEn - a.creadoEn), cb);
  }
  const q = query(collection(obtenerDb(), "ventas"), orderBy("creadoEn", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ ...(d.data() as Omit<Venta, "id">), id: d.id })));
  });
}

export function suscribirClientes(cb: (clientes: Cliente[]) => void): Unsubscribe {
  if (modoDemo) {
    return suscribirDemo((e) => [...e.clientes].sort((a, b) => b.ultimoPedido - a.ultimoPedido), cb);
  }
  const q = query(collection(obtenerDb(), "clientes"), orderBy("ultimoPedido", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ ...(d.data() as Omit<Cliente, "id">), id: d.id })));
  });
}

/* ── CRUD de productos ───────────────────────────────────────────── */

export async function crearProducto(datos: ProductoInput): Promise<void> {
  const ahora = Date.now();
  if (modoDemo) {
    cargarDemo().productos.unshift({ ...datos, id: idDemo("prod"), creadoEn: ahora, actualizadoEn: ahora });
    notificarDemo();
    return;
  }
  await addDoc(collection(obtenerDb(), "productos"), { ...datos, creadoEn: ahora, actualizadoEn: ahora });
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
  await updateDoc(doc(obtenerDb(), "productos", id), { ...datos, actualizadoEn: ahora });
}

export async function eliminarProducto(id: string): Promise<void> {
  if (modoDemo) {
    const estado = cargarDemo();
    estado.productos = estado.productos.filter((p) => p.id !== id);
    notificarDemo();
    return;
  }
  await deleteDoc(doc(obtenerDb(), "productos", id));
}

/* ── Registro de ventas y clientes ───────────────────────────────── */

export async function registrarVenta(venta: Omit<Venta, "id" | "creadoEn" | "estado">): Promise<void> {
  const ahora = Date.now();
  const telefono = venta.cliente.telefono.replace(/\D/g, "");

  if (modoDemo) {
    const estado = cargarDemo();
    estado.ventas.unshift({ ...venta, id: idDemo("venta"), estado: "pendiente", creadoEn: ahora });

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

  const db = obtenerDb();
  await addDoc(collection(db, "ventas"), { ...venta, estado: "pendiente", creadoEn: ahora });

  await Promise.all(
    venta.items.map((item) =>
      updateDoc(doc(db, "productos", item.productoId), {
        stock: increment(-item.cantidad),
        actualizadoEn: ahora,
      }).catch(() => undefined)
    )
  );

  const clientes = await getDocs(query(collection(db, "clientes"), where("telefono", "==", telefono)));
  if (!clientes.empty) {
    const ref = clientes.docs[0].ref;
    await updateDoc(ref, {
      pedidos: increment(1),
      totalGastado: increment(venta.total),
      ultimoPedido: ahora,
      nombre: venta.cliente.nombre,
    });
  } else {
    await setDoc(doc(collection(db, "clientes")), {
      nombre: venta.cliente.nombre,
      telefono,
      pedidos: 1,
      totalGastado: venta.total,
      creadoEn: ahora,
      ultimoPedido: ahora,
    });
  }
}

export async function actualizarEstadoVenta(id: string, estado: Venta["estado"]): Promise<void> {
  if (modoDemo) {
    const st = cargarDemo();
    const venta = st.ventas.find((v) => v.id === id);
    if (venta) {
      venta.estado = estado;
      notificarDemo();
    }
    return;
  }
  await updateDoc(doc(obtenerDb(), "ventas", id), { estado });
}
