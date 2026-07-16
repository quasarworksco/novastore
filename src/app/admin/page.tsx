"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FormularioProducto } from "@/components/admin/FormularioProducto";
import { FormularioVentaManual } from "@/components/admin/FormularioVentaManual";
import { CuentasPorCobrar } from "@/components/admin/CuentasPorCobrar";
import { PanelGastos } from "@/components/admin/PanelGastos";
import { TasaCambio } from "@/components/admin/TasaCambio";
import { ListaWhatsApp } from "@/components/admin/ListaWhatsApp";
import { MasVendidos } from "@/components/admin/MasVendidos";
import { ResumenFinanciero } from "@/components/admin/ResumenFinanciero";
import { StatCard } from "@/components/admin/StatCard";
import { TablaClientes } from "@/components/admin/TablaClientes";
import { TablaProductos } from "@/components/admin/TablaProductos";
import { TablaVentas } from "@/components/admin/TablaVentas";
import {
  IconoBillete,
  IconoBuscar,
  IconoCaja,
  IconoCerrar,
  IconoDolar,
  IconoGrafica,
  IconoMas,
  IconoMenu,
  IconoOjo,
  IconoRecibo,
  IconoWhatsApp,
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
  suscribirErrorDatos,
  suscribirGastos,
  suscribirProductos,
  suscribirVentas,
} from "@/lib/store";
import { productosSemilla } from "@/data/seed";
import type { Cliente, Gasto, Producto, Venta } from "@/lib/types";
import { saldoPendiente } from "@/lib/types";

type Pestana = "resumen" | "productos" | "ventas" | "cobrar" | "gastos" | "clientes";

const pestanas: { id: Pestana; etiqueta: string; Icono: typeof IconoGrafica }[] = [
  { id: "resumen", etiqueta: "Resumen", Icono: IconoGrafica },
  { id: "productos", etiqueta: "Productos", Icono: IconoCaja },
  { id: "ventas", etiqueta: "Ventas", Icono: IconoDolar },
  { id: "cobrar", etiqueta: "Por cobrar", Icono: IconoBillete },
  { id: "gastos", etiqueta: "Gastos", Icono: IconoRecibo },
  { id: "clientes", etiqueta: "Clientes", Icono: IconoUsuarios },
];

export default function PaginaAdmin() {
  // null = comprobando sesión (evita parpadeo en la hidratación estática)
  const [autenticado, setAutenticado] = useState<boolean | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [errorDatos, setErrorDatos] = useState(false);
  const [pestana, setPestana] = useState<Pestana>("resumen");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [formAbierto, setFormAbierto] = useState(false);
  const [listaWaAbierta, setListaWaAbierta] = useState(false);
  const [productoEnEdicion, setProductoEnEdicion] = useState<Producto | null>(null);
  const [ventaManualAbierta, setVentaManualAbierta] = useState(false);
  const [sembrando, setSembrando] = useState(false);
  const [busquedaProd, setBusquedaProd] = useState("");

  useEffect(() => {
    setAutenticado(sesionValida());
  }, []);

  useEffect(() => {
    if (!autenticado) return;
    const cancelaciones = [
      suscribirProductos(setProductos),
      suscribirVentas(setVentas),
      suscribirClientes(setClientes),
      suscribirGastos(setGastos),
      suscribirErrorDatos(setErrorDatos),
    ];
    return () => cancelaciones.forEach((c) => c());
  }, [autenticado]);

  const ingresos = useMemo(
    () =>
      ventas
        .filter((v) => v.estado !== "cancelada" && v.pagado !== false)
        .reduce((acc, v) => acc + v.total, 0),
    [ventas]
  );

  const categorias = useMemo(
    () => Array.from(new Set(productos.map((p) => p.categoria).filter(Boolean))).sort(),
    [productos]
  );

  const porCobrar = useMemo(
    () => ventas.filter((v) => v.fiado && !v.pagado && v.estado !== "cancelada"),
    [ventas]
  );

  const productosFiltrados = useMemo(() => {
    const q = busquedaProd.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) || (p.categoria ?? "").toLowerCase().includes(q)
    );
  }, [productos, busquedaProd]);

  function abrirCrear() {
    setProductoEnEdicion(null);
    setFormAbierto(true);
  }

  function abrirEditar(p: Producto) {
    setProductoEnEdicion(p);
    setFormAbierto(true);
  }

  function elegirPestana(p: Pestana) {
    setPestana(p);
    setMenuAbierto(false);
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

  const pestanaActual = pestanas.find((p) => p.id === pestana);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-7xl px-4 pb-16">
      {/* Cabecera */}
      <header className="sticky top-0 z-40 -mx-4 mb-8 px-4 pt-4">
        <div className="flex items-center gap-3 rounded-3xl border border-glass-border bg-white/80 px-4 py-3 shadow-soft backdrop-blur-2xl sm:px-5">
          {/* Botón menú (móvil) */}
          <button
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 sm:hidden"
          >
            <IconoMenu className="h-5 w-5" />
          </button>
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

      {errorDatos && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No se pudo actualizar la información (conexión o límite diario gratuito de Firebase
          alcanzado). Tus datos están a salvo en la base de datos; se muestra la última copia
          disponible y todo volverá a la normalidad cuando la cuota se renueve.
        </div>
      )}

      {/* Pestañas en línea (escritorio) */}
      <nav className="mb-8 hidden gap-1 rounded-3xl border border-glass-border bg-white/70 p-1.5 shadow-soft backdrop-blur-xl sm:flex">
        {pestanas.map(({ id, etiqueta, Icono }) => (
          <button
            key={id}
            onClick={() => setPestana(id)}
            className={`relative flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors ${
              pestana === id ? "text-blue-700" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {pestana === id && (
              <motion.span
                layoutId="pestana-admin"
                transition={{ type: "spring", bounce: 0.25, duration: 0.55 }}
                className="absolute inset-0 rounded-2xl border border-blue-100 bg-blue-50 shadow-soft"
              />
            )}
            <Icono className="relative z-10 h-4 w-4" />
            <span className="relative z-10">{etiqueta}</span>
            {id === "cobrar" && porCobrar.length > 0 && (
              <span className="relative z-10 grid h-4 min-w-4 place-items-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                {porCobrar.length}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Sección actual (móvil) */}
      <div className="mb-6 flex items-center gap-2 sm:hidden">
        {pestanaActual && <pestanaActual.Icono className="h-5 w-5 text-blue-600" />}
        <h1 className="text-lg font-bold text-slate-900">{pestanaActual?.etiqueta}</h1>
      </div>

      {/* Drawer lateral (móvil) */}
      <AnimatePresence>
        {menuAbierto && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuAbierto(false)}
              className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm sm:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
              className="fixed left-0 top-0 z-50 flex h-dvh w-72 max-w-[80vw] flex-col gap-2 border-r border-slate-200 bg-white p-4 shadow-glass sm:hidden"
            >
              <div className="mb-2 flex items-center justify-between">
                <Logo size="md" />
                <button
                  onClick={() => setMenuAbierto(false)}
                  aria-label="Cerrar menú"
                  className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                >
                  <IconoCerrar className="h-4 w-4" />
                </button>
              </div>
              {pestanas.map(({ id, etiqueta, Icono }) => (
                <button
                  key={id}
                  onClick={() => elegirPestana(id)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                    pestana === id
                      ? "border border-blue-100 bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icono className="h-5 w-5" />
                  {etiqueta}
                  {id === "cobrar" && porCobrar.length > 0 && (
                    <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-amber-500 px-1 text-[11px] font-bold text-white">
                      {porCobrar.length}
                    </span>
                  )}
                </button>
              ))}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

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
                  etiqueta="Ingresos cobrados"
                  valor={formatoMoneda(ingresos)}
                  detalle={`${ventas.length} ventas registradas`}
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
                  etiqueta="Por cobrar"
                  valor={formatoMoneda(porCobrar.reduce((a, v) => a + saldoPendiente(v), 0))}
                  detalle={`${porCobrar.length} deudas pendientes`}
                  icono={IconoBillete}
                  tono="ambar"
                />
                <StatCard
                  etiqueta="Clientes"
                  valor={String(clientes.length)}
                  detalle="Registrados desde ventas"
                  icono={IconoUsuarios}
                  tono="cian"
                />
              </section>

              <TasaCambio />

              <MasVendidos ventas={ventas} />

              <ResumenFinanciero productos={productos} />

              <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                    Últimas ventas
                  </h2>
                  <Boton onClick={() => setVentaManualAbierta(true)}>
                    <IconoMas className="h-4 w-4" />
                    Venta manual
                  </Boton>
                </div>
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
                <div className="flex flex-wrap gap-2">
                  {productos.length === 0 && (
                    <Boton variante="vidrio" onClick={cargarCatalogoEjemplo} disabled={sembrando}>
                      {sembrando ? "Cargando…" : "Cargar catálogo de ejemplo"}
                    </Boton>
                  )}
                  <Boton variante="vidrio" onClick={() => setListaWaAbierta(true)}>
                    <IconoWhatsApp className="h-4 w-4" />
                    Lista para WhatsApp
                  </Boton>
                  <Boton onClick={abrirCrear}>
                    <IconoMas className="h-4 w-4" />
                    Nuevo producto
                  </Boton>
                </div>
              </div>
              <ResumenFinanciero productos={productos} />
              <div className="relative">
                <IconoBuscar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={busquedaProd}
                  onChange={(e) => setBusquedaProd(e.target.value)}
                  placeholder="Buscar producto por nombre o categoría…"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              {busquedaProd.trim() && (
                <p className="-mt-4 text-xs text-slate-400">
                  {productosFiltrados.length}{" "}
                  {productosFiltrados.length === 1 ? "producto encontrado" : "productos encontrados"}
                </p>
              )}
              {productosFiltrados.length === 0 && busquedaProd.trim() ? (
                <p className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
                  No se encontraron productos para «{busquedaProd.trim()}».
                </p>
              ) : (
                <TablaProductos
                  productos={productosFiltrados}
                  onEditar={abrirEditar}
                  onEliminar={confirmarEliminar}
                />
              )}
            </>
          )}

          {pestana === "ventas" && (
            <>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                  Registro de ventas ({ventas.length})
                </h2>
                <Boton onClick={() => setVentaManualAbierta(true)}>
                  <IconoMas className="h-4 w-4" />
                  Venta manual
                </Boton>
              </div>
              <TablaVentas ventas={ventas} />
            </>
          )}

          {pestana === "cobrar" && (
            <>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                  Cuentas por cobrar
                </h2>
                <Boton onClick={() => setVentaManualAbierta(true)}>
                  <IconoMas className="h-4 w-4" />
                  Venta manual
                </Boton>
              </div>
              <CuentasPorCobrar ventas={ventas} />
            </>
          )}

          {pestana === "gastos" && (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                Control de gastos y ganancia neta
              </h2>
              <PanelGastos gastos={gastos} ventas={ventas} />
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
        categorias={categorias}
        onCerrar={() => setFormAbierto(false)}
      />
      <FormularioVentaManual
        abierto={ventaManualAbierta}
        productos={productos}
        clientes={clientes}
        onCerrar={() => setVentaManualAbierta(false)}
      />
      <ListaWhatsApp
        abierto={listaWaAbierta}
        productos={productos}
        onCerrar={() => setListaWaAbierta(false)}
      />
    </div>
  );
}
