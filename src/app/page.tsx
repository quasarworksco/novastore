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
import { suscribirProductos } from "@/lib/store";
import type { Producto } from "@/lib/types";

function Tienda() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [categoria, setCategoria] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [detalle, setDetalle] = useState<Producto | null>(null);

  useEffect(() => {
    const cancelar = suscribirProductos((datos) => {
      setProductos(datos.filter((p) => p.activo));
      setCargando(false);
    });
    return cancelar;
  }, []);

  const categorias = useMemo(
    () => ["Todos", ...Array.from(new Set(productos.map((p) => p.categoria))).sort()],
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
          className="mb-10 rounded-3xl border border-glass-border bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-cyan-400/10 p-8 shadow-glass backdrop-blur-xl sm:p-12"
        >
          <h1 className="max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            Lo que buscas, <span className="texto-degradado">con estilo</span> y entrega
            inmediata.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Perfumes, electrónica, accesorios y juguetes seleccionados. Arma tu pedido y
            recíbelo coordinando directo por WhatsApp.
          </p>
        </motion.section>

        {/* Categorías */}
        <div className="sticky top-[84px] z-30 -mx-4 mb-6 px-4 py-2">
          <div className="rounded-3xl border border-glass-border bg-slate-950/40 p-1.5 shadow-glass backdrop-blur-2xl">
            <CategoryTabs categorias={categorias} activa={categoria} onCambiar={setCategoria} />
          </div>
        </div>

        {/* Grilla de productos con transición animada entre categorías */}
        {cargando ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] animate-pulse rounded-3xl border border-glass-border bg-white/5"
              />
            ))}
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {visibles.map((producto) => (
                <ProductCard key={producto.id} producto={producto} onVer={setDetalle} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!cargando && visibles.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center text-sm text-slate-400"
          >
            No encontramos productos que coincidan con tu búsqueda.
          </motion.p>
        )}
      </main>

      <Footer />
      <CartDrawer />
      <ProductModal producto={detalle} onCerrar={() => setDetalle(null)} />
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
