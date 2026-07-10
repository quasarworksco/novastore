"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FormularioProducto } from "@/components/admin/FormularioProducto";
import { ResumenFinanciero } from "@/components/admin/ResumenFinanciero";
import { StatCard } from "@/components/admin/StatCard";
import { TablaClientes } from "@/components/admin/TablaClientes";
import { TablaProductos } from "@/components/admin/TablaProductos";
import { TablaVentas } from "@/components/admin/TablaVentas";
import {
  IconoCaja,
  IconoDolar,
  IconoGrafica,
  IconoMas,
  IconoOjo,
  IconoSalir,
  IconoUsuarios,
} from "@/components/icons";
import { Logo } from "@/components/Logo";
import { Boton } from "@/components/ui/Boton";
import { Insignia } from "@/components/ui/Insignia";
import { LoginAdmin } from "@/components/admin/LoginAdmin";
import { cerrarSesion, sesionValida } from "@/lib/admin-auth";
import { formatoMoneda } from "@/lib/format";
import {
  crearProducto,
  eliminarProducto,
  modoDemo,
  suscribirClientes,
  suscribirProductos,
  suscribirVentas,
} from "@/lib/store";
import { productosSemilla } from "@/data/seed";
import type { Cliente, Producto, Venta } from "@/lib/types";

type Pestana = "resumen" | "productos" | "ventas" | "clientes";

const pestanas: { id: Pestana; etiqueta: string; Icono: typeof IconoGrafica }[] = [
  { id: "resumen", etiqueta: "Resumen", Icono: IconoGrafica },
  { id: "productos", etiqueta: "Productos", Icono: IconoCaja },
  { id: "ventas", etiqueta: "Ventas", Icono: IconoDolar },
  { id: "clientes", etiqueta: "Clientes", Icono: IconoUsuarios },
];

export default function PaginaAdmin() {
  // null = comprobando sesión (evita parpadeo en la hidratación estática)
  const [autenticado, setAutenticado] = useState<boolean | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pestana, setPestana] = useState<Pestana>("resumen");
  const [formAbierto, setFormAbierto] = useState(false);
  const [productoEnEdicion, setProductoEnEdicion] = useState<Producto | null>(null);
  const [sembrando, setSembrando] = useState(false);

  useEffect(() => {
    setAutenticado(sesionValida());
  }, []);

  useEffect(() => {
    if (!autenticado) return;
    const cancelaciones = [
      suscribirProductos(setProductos),
      suscribirVentas(setVentas),
      suscribirClientes(setClientes),
    ];
    return () => cancelaciones.forEach((c) => c());
  }, [autenticado]);

  const ingresos = useMemo(
    () => ventas.filter((v) => v.estado !== "cancelada").reduce((acc, v) => acc + v.total, 0),
    [ventas]
  );

  function abrirCrear() {
    setProductoEnEdicion(null);
    setFormAbierto(true);
  }

  function abrirEditar(p: Producto) {
    setProductoEnEdicion(p);
    setFormAbierto(true);
  }

  async function confirmarEliminar(p: Producto) {
    if (window.confirm(`¿Eliminar «${p.nombre}» definitivamente?`)) {
      await eliminarProducto(p.id);
    }
  }

  /** Carga el catálogo de ejemplo en la base de datos (solo con catálogo vacío). */
  async function cargarCatalogoEjemplo() {
    if (sembrando) return;
    setSembrando(true);
    try {
      for (const { id, creadoEn, actualizadoEn, ...datos } of productosSemilla) {
        await crearProducto(datos);
      }
    } catch (e) {
      window.alert(
        e instanceof Error
          ? `No se pudo cargar el catálogo: ${e.message}`
          : "No se pudo cargar el catálogo. Revisa las reglas de Firestore."
      );
    } finally {
      setSembrando(false);
    }
  }

  function salir() {
    cerrarSesion();
    setAutenticado(false);
  }

  if (autenticado === null) return null;
  if (!autenticado) return <LoginAdmin onExito={() => setAutenticado(true)} />;

  return (
    <div className="mx-auto min-h-dvh w-full max-w-7xl px-4 pb-16">
      {/* Cabecera */}
      <header className="sticky top-0 z-40 -mx-4 mb-8 px-4 pt-4">
        <div className="flex items-center gap-3 rounded-3xl border border-glass-border bg-white/80 px-5 py-3 shadow-soft backdrop-blur-2xl">
          <Logo size="md" conMarca />
          <div className="hidden min-w-0 sm:block">
            <span className="text-xs font-medium text-slate-400">/ Panel</span>
          </div>
          {modoDemo && <Insignia tono="ambar">Modo demo</Insignia>}
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <IconoOjo className="h-4 w-4" />
              <span className="hidden sm:inline">Ver tienda</span>
            </Link>
            <button
              onClick={salir}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <IconoSalir className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Pestañas */}
      <nav className="mb-8 flex gap-1 overflow-x-auto rounded-3xl border border-glass-border bg-white/70 p-1.5 shadow-soft backdrop-blur-xl">
        {pestanas.map(({ id, etiqueta, Icono }) => (
          <button
            key={id}
            onClick={() => setPestana(id)}
            className={`relative flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors ${
              pestana === id ? "text-indigo-700" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {pestana === id && (
              <motion.span
                layoutId="pestana-admin"
                transition={{ type: "spring", bounce: 0.25, duration: 0.55 }}
                className="absolute inset-0 rounded-2xl border border-indigo-100 bg-indigo-50 shadow-soft"
              />
            )}
            <Icono className="relative z-10 h-4 w-4" />
            <span className="relative z-10">{etiqueta}</span>
          </button>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        <motion.div
          key={pestana}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="space-y-8"
        >
          {pestana === "resumen" && (
            <>
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  etiqueta="Ingresos por ventas"
                  valor={formatoMoneda(ingresos)}
                  detalle={`${ventas.length} pedidos registrados`}
                  icono={IconoDolar}
                  tono="verde"
                />
                <StatCard
                  etiqueta="Productos"
                  valor={String(productos.length)}
                  detalle={`${productos.filter((p) => p.activo).length} visibles en tienda`}
                  icono={IconoCaja}
                />
                <StatCard
                  etiqueta="Clientes"
                  valor={String(clientes.length)}
                  detalle="Registrados desde pedidos"
                  icono={IconoUsuarios}
                  tono="cian"
                />
                <StatCard
                  etiqueta="Pedidos pendientes"
                  valor={String(ventas.filter((v) => v.estado === "pendiente").length)}
                  detalle="Por confirmar en WhatsApp"
                  icono={IconoGrafica}
                  tono="ambar"
                />
              </section>

              <ResumenFinanciero productos={productos} />

              <section className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                  Últimas ventas
                </h2>
                <TablaVentas ventas={ventas.slice(0, 5)} />
              </section>
            </>
          )}

          {pestana === "productos" && (
            <>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                  Control de productos ({productos.length})
                </h2>
                <div className="flex gap-2">
                  {productos.length === 0 && (
                    <Boton variante="vidrio" onClick={cargarCatalogoEjemplo} disabled={sembrando}>
                      {sembrando ? "Cargando…" : "Cargar catálogo de ejemplo"}
                    </Boton>
                  )}
                  <Boton onClick={abrirCrear}>
                    <IconoMas className="h-4 w-4" />
                    Nuevo producto
                  </Boton>
                </div>
              </div>
              <ResumenFinanciero productos={productos} />
              <TablaProductos
                productos={productos}
                onEditar={abrirEditar}
                onEliminar={confirmarEliminar}
              />
            </>
          )}

          {pestana === "ventas" && (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                Registro de ventas ({ventas.length})
              </h2>
              <TablaVentas ventas={ventas} />
            </>
          )}

          {pestana === "clientes" && (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                Registro de clientes ({clientes.length})
              </h2>
              <TablaClientes clientes={clientes} />
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <FormularioProducto
        abierto={formAbierto}
        producto={productoEnEdicion}
        onCerrar={() => setFormAbierto(false)}
      />
    </div>
  );
}
