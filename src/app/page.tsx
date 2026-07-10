"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { CartDrawer } from "@/components/store/CartDrawer";
import { CategoryTabs } from "@/components/store/CategoryTabs";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductModal } from "@/components/store/ProductModal";
import { CarritoProvider } from "@/lib/cart-context";
import { suscribirConfig, suscribirProductos } from "@/lib/store";
import type { Producto } from "@/lib/types";

function Tienda() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [categoria, setCategoria] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [detalle, setDetalle] = useState<Producto | null>(null);
  const [tasaBs, setTasaBs] = useState(0);

  useEffect(() => {
    const cancelar = suscribirProductos((datos) => {
      setProductos(datos.filter((p) => p.activo));
      setCargando(false);
    });
    const cancelarConfig = suscribirConfig((c) => setTasaBs(c.tasaBs));
    return () => {
      cancelar();
      cancelarConfig();
    };
  }, []);

  const soloCategorias = useMemo(
    () => Array.from(new Set(productos.map((p) => p.categoria).filter(Boolean))).sort(),
    [productos]
  );
  const categorias = useMemo(() => ["Todos", ...soloCategorias], [soloCategorias]);

  const destacados = useMemo(
    () => productos.filter((p) => p.destacado).slice(0, 4),
    [productos]
  );

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return productos.filter(
      (p) =>
        (categoria === "Todos" || p.categoria === categoria) &&
        (texto === "" ||
          p.nombre.toLowerCase().includes(texto) ||
          p.descripcion.toLowerCase().includes(texto))
    );
  }, [productos, categoria, busqueda]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar busqueda={busqueda} onBuscar={setBusqueda} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-8">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative mb-10 overflow-hidden rounded-3xl border border-glass-border bg-gradient-to-br from-blue-50 via-white to-sky-50 p-8 shadow-glass sm:p-14"
        >
          {/* Fondo animado más llamativo */}
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl animate-blob-slow" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-sky-300/30 blur-3xl animate-blob-slower" />
          <div className="pointer-events-none absolute right-1/4 top-1/2 h-48 w-48 rounded-full bg-cyan-200/30 blur-3xl animate-float" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.4]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(37,99,235,0.12) 1px, transparent 0)",
              backgroundSize: "26px 26px",
            }}
          />

          <div className="relative">
            <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl">
              Todo lo que te gusta, <br className="hidden sm:block" />
              en <span className="texto-degradado">un solo lugar</span>.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600">
              Perfumes, tecnología, accesorios y más, cuidadosamente seleccionados. Elige tus
              favoritos y coordina tu entrega en segundos.
            </p>

            {soloCategorias.length > 0 && (
              <div className="mt-7 flex flex-wrap gap-2">
                {soloCategorias.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategoria(c)}
                    className="rounded-full border border-blue-100 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-soft transition hover:border-blue-300 hover:text-blue-700"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.section>

        {/* Productos destacados: fondo propio para resaltar la selección */}
        {!cargando && destacados.length > 0 && categoria === "Todos" && busqueda.trim() === "" && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative mb-10 overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-600/[0.06] via-sky-100/60 to-blue-50 p-5 shadow-glass sm:p-7"
          >
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-300/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-sky-300/25 blur-3xl" />
            <div
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(37,99,235,0.14) 1px, transparent 0)",
                backgroundSize: "22px 22px",
              }}
            />

            <div className="relative">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-2xl bg-blue-600 text-white shadow-glow">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path d="M12 2c.4 3.6 2.4 5.6 6 6-3.6.4-5.6 2.4-6 6-.4-3.6-2.4-5.6-6-6 3.6-.4 5.6-2.4 6-6z" />
                    </svg>
                  </span>
                  <div>
                    <h2 className="text-lg font-bold leading-tight tracking-tight text-slate-900">
                      Productos destacados
                    </h2>
                    <p className="text-xs text-slate-500">Nuestra selección para ti</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {destacados.map((producto) => (
                  <ProductCard key={producto.id} producto={producto} onVer={setDetalle} tasaBs={tasaBs} />
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* Categorías */}
        <div className="sticky top-[84px] z-30 -mx-4 mb-6 px-4 py-2">
          <div className="rounded-3xl border border-glass-border bg-white/85 p-1.5 shadow-soft backdrop-blur-2xl">
            <CategoryTabs categorias={categorias} activa={categoria} onCambiar={setCategoria} />
          </div>
        </div>

        {/* Grilla de productos con transición animada entre categorías */}
        {cargando ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] animate-pulse rounded-3xl border border-glass-border bg-slate-100"
              />
            ))}
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {visibles.map((producto) => (
                <ProductCard key={producto.id} producto={producto} onVer={setDetalle} tasaBs={tasaBs} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!cargando && visibles.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center text-sm text-slate-500"
          >
            No encontramos productos que coincidan con tu búsqueda.
          </motion.p>
        )}
      </main>

      <Footer />
      <CartDrawer />
      <ProductModal producto={detalle} onCerrar={() => setDetalle(null)} tasaBs={tasaBs} />
    </div>
  );
}

export default function PaginaTienda() {
  return (
    <CarritoProvider>
      <Tienda />
    </CarritoProvider>
  );
}
