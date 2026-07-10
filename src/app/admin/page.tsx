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
  IconoLogo,
  IconoMas,
  IconoOjo,
  IconoSalir,
  IconoUsuarios,
} from "@/components/icons";
import { Boton } from "@/components/ui/Boton";
import { Insignia } from "@/components/ui/Insignia";
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
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pestana, setPestana] = useState<Pestana>("resumen");
  const [formAbierto, setFormAbierto] = useState(false);
  const [productoEnEdicion, setProductoEnEdicion] = useState<Producto | null>(null);
  const [sembrando, setSembrando] = useState(false);

  useEffect(() => {
    const cancelaciones = [
      suscribirProductos(setProductos),
      suscribirVentas(setVentas),
      suscribirClientes(setClientes),
    ];
    return () => cancelaciones.forEach((c) => c());
  }, []);

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

  async function cerrarSesion() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-7xl px-4 pb-16">
      {/* Cabecera */}
      <header className="sticky top-0 z-40 -mx-4 mb-8 px-4 pt-4">
        <div className="flex items-center gap-3 rounded-3xl border border-glass-border bg-slate-950/50 px-5 py-3 shadow-glass backdrop-blur-2xl">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-glow">
            <IconoLogo className="h-5 w-5 text-white" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold text-white sm:text-base">
              Panel Administrativo
            </h1>
            {modoDemo && <Insignia tono="ambar">Modo demo — sin Firebase</Insignia>}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <IconoOjo className="h-4 w-4" />
              <span className="hidden sm:inline">Ver tienda</span>
            </Link>
            <button
              onClick={cerrarSesion}
              className="flex items-center gap-2 rounded-2xl border border-glass-border bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/15 hover:text-white"
            >
              <IconoSalir className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Pestañas */}
      <nav className="mb-8 flex gap-1 overflow-x-auto rounded-3xl border border-glass-border bg-white/[0.04] p-1.5 backdrop-blur-xl">
        {pestanas.map(({ id, etiqueta, Icono }) => (
          <button
            key={id}
            onClick={() => setPestana(id)}
            className={`relative flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors ${
              pestana === id ? "text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {pestana === id && (
              <motion.span
                layoutId="pestana-admin"
                transition={{ type: "spring", bounce: 0.25, duration: 0.55 }}
                className="absolute inset-0 rounded-2xl border border-glass-border bg-gradient-to-r from-violet-500/30 to-cyan-400/20 shadow-glass"
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
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                  Últimas ventas
                </h2>
                <TablaVentas ventas={ventas.slice(0, 5)} />
              </section>
            </>
          )}

          {pestana === "productos" && (
            <>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
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
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                Registro de ventas ({ventas.length})
              </h2>
              <TablaVentas ventas={ventas} />
            </>
          )}

          {pestana === "clientes" && (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
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
