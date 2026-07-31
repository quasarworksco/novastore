"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  IconoBillete,
  IconoCohete,
  IconoFlechaDer,
  IconoFlechaIzq,
  IconoWhatsApp,
} from "@/components/icons";
import { imagenOptimizada } from "@/lib/imagen";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { BotonWhatsApp } from "@/components/store/BotonWhatsApp";
import { CartDrawer } from "@/components/store/CartDrawer";
import { CategoryTabs } from "@/components/store/CategoryTabs";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductModal } from "@/components/store/ProductModal";
import { CarritoProvider } from "@/lib/cart-context";
import { suscribirConfig, suscribirErrorDatos, suscribirProductos } from "@/lib/store";
import type { Producto } from "@/lib/types";

function Tienda() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [categoria, setCategoria] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [detalle, setDetalle] = useState<Producto | null>(null);
  const [tasaBs, setTasaBs] = useState(0);
  const [errorDatos, setErrorDatos] = useState(false);

  useEffect(() => {
    const cancelar = suscribirProductos((datos) => {
      setProductos(datos.filter((p) => p.activo));
      setCargando(false);
    });
    const cancelarConfig = suscribirConfig((c) => setTasaBs(c.tasaBs));
    const cancelarError = suscribirErrorDatos(setErrorDatos);
    return () => {
      cancelar();
      cancelarConfig();
      cancelarError();
    };
  }, []);

  // Enlace directo: si la URL trae ?p=<id>, abre ese producto al cargar.
  const deepLinkHecho = useRef(false);
  useEffect(() => {
    if (cargando || deepLinkHecho.current) return;
    const pid = new URLSearchParams(window.location.search).get("p");
    if (!pid) return;
    deepLinkHecho.current = true;
    const prod = productos.find((x) => x.id === pid);
    if (prod) setDetalle(prod);
  }, [cargando, productos]);

  const soloCategorias = useMemo(
    () => Array.from(new Set(productos.map((p) => p.categoria).filter(Boolean))).sort(),
    [productos]
  );
  const categorias = useMemo(() => ["Todos", ...soloCategorias], [soloCategorias]);

  // Con stock primero; los agotados quedan al final (orden estable).
  const agotadoAlFinal = (a: Producto, b: Producto) =>
    (a.stock > 0 ? 0 : 1) - (b.stock > 0 ? 0 : 1);

  const destacados = useMemo(
    () => productos.filter((p) => p.destacado).sort(agotadoAlFinal),
    [productos]
  );

  // Carrusel horizontal de destacados
  const carruselRef = useRef<HTMLDivElement>(null);
  const desplazarCarrusel = (direccion: number) => {
    const el = carruselRef.current;
    if (el) el.scrollBy({ left: direccion * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return productos
      .filter(
        (p) =>
          (categoria === "Todos" || p.categoria === categoria) &&
          (texto === "" ||
            p.nombre.toLowerCase().includes(texto) ||
            p.descripcion.toLowerCase().includes(texto))
      )
      .sort(agotadoAlFinal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productos, categoria, busqueda]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar busqueda={busqueda} onBuscar={setBusqueda} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-8">
        {/* Aviso de conexión: evita confundir un fallo de red con datos borrados */}
        {errorDatos && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            No pudimos actualizar el catálogo en este momento (conexión o límite temporal del
            servidor). Tus datos están a salvo; estamos mostrando la última copia disponible.
          </motion.div>
        )}

        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative mb-10 overflow-hidden rounded-3xl border border-glass-border bg-gradient-to-br from-blue-50 via-white to-sky-50 p-8 shadow-glass sm:p-14"
        >
          {/* Fondo animado más llamativo */}
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl animate-blob-slow" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-sky-500/25 blur-3xl animate-blob-slower" />
          <div className="pointer-events-none absolute right-1/4 top-1/2 h-48 w-48 rounded-full bg-blue-600/20 blur-3xl animate-float" />
          <div className="pointer-events-none absolute -left-16 top-1/4 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl animate-blob-slower" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.4]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(37,99,235,0.12) 1px, transparent 0)",
              backgroundSize: "26px 26px",
            }}
          />

          <div className="relative flex items-center gap-8">
            <div className="min-w-0 flex-1">
            <h1 className="max-w-3xl text-[2.7rem] font-extrabold leading-[1.02] tracking-tight text-slate-900 sm:text-6xl">
              {["Todo", "lo", "que", "te", "gusta,"].map((palabra, i) => (
                <motion.span
                  key={palabra}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08, duration: 0.5, ease: "easeOut" }}
                  className="mr-[0.26em] inline-block"
                >
                  {palabra}
                </motion.span>
              ))}
              <br />
              <motion.span
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
                className="mr-[0.26em] inline-block"
              >
                en
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 22, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.72, duration: 0.55, ease: "easeOut" }}
                className="texto-degradado-animado inline-block"
              >
                un solo lugar
              </motion.span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.4 }}
                className="inline-block text-blue-600"
              >
                .
              </motion.span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600">
              Perfumes, tecnología, accesorios y más, cuidadosamente seleccionados. Elige tus
              favoritos y coordina tu entrega en segundos.
            </p>

            {/* Llamadas a la acción */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5, ease: "easeOut" }}
              className="mt-7 flex flex-wrap items-center gap-3"
            >
              <a
                href="#catalogo"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById("catalogo")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
              >
                <IconoCohete className="h-4 w-4" />
                Ver catálogo
              </a>
              <a
                href="https://wa.me/584121002090"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/85 px-6 py-3 text-sm font-semibold text-emerald-700 shadow-soft backdrop-blur-sm transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                <IconoWhatsApp className="h-4 w-4" />
                Escríbenos
              </a>
            </motion.div>

            {/* Señales de confianza */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.15, duration: 0.5 }}
              className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500"
            >
              <span className="inline-flex items-center gap-1.5">
                <IconoBillete className="h-3.5 w-3.5 text-emerald-600" />
                Paga en bolívares o divisas
              </span>
              <span className="text-slate-300">·</span>
              <span>Entrega coordinada por WhatsApp</span>
            </motion.p>
            </div>

            {/* Collage de productos destacados (solo escritorio) */}
            {destacados.length >= 2 && (
              <div className="relative hidden h-80 w-[21rem] shrink-0 lg:block xl:w-[24rem]">
                {destacados.slice(0, 3).map((p, i) => {
                  const posiciones = [
                    "left-0 top-6 z-20 h-52 w-44 -rotate-6",
                    "right-2 top-0 z-10 h-48 w-40 rotate-6",
                    "bottom-0 left-1/2 z-30 h-48 w-40 -translate-x-1/3 rotate-2",
                  ];
                  return (
                    <motion.button
                      key={p.id}
                      onClick={() => setDetalle(p)}
                      initial={{ opacity: 0, y: 28, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.15, duration: 0.6, ease: "easeOut" }}
                      whileHover={{ scale: 1.05, rotate: 0, zIndex: 40 }}
                      aria-label={`Ver ${p.nombre}`}
                      className={`absolute overflow-hidden rounded-3xl border-4 border-white bg-slate-100 shadow-glass ${posiciones[i]}`}
                    >
                      {p.imagenes[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imagenOptimizada(p.imagenes[0], 400)}
                          alt={p.nombre}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </motion.button>
                  );
                })}
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
            className="relative mb-10 overflow-hidden rounded-3xl border border-blue-200/60 bg-gradient-to-br from-blue-600/15 via-sky-400/10 to-blue-50 p-5 shadow-glass sm:p-7"
          >
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-500/25 blur-3xl animate-blob-slow" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-sky-500/25 blur-3xl animate-blob-slower" />
            <div
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(29,78,216,0.18) 1px, transparent 0)",
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
                <div className="flex gap-2">
                  <button
                    onClick={() => desplazarCarrusel(-1)}
                    aria-label="Anteriores"
                    className="grid h-9 w-9 place-items-center rounded-full border border-blue-200 bg-white/90 text-blue-700 shadow-soft transition hover:bg-blue-50"
                  >
                    <IconoFlechaIzq className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => desplazarCarrusel(1)}
                    aria-label="Siguientes"
                    className="grid h-9 w-9 place-items-center rounded-full border border-blue-200 bg-white/90 text-blue-700 shadow-soft transition hover:bg-blue-50"
                  >
                    <IconoFlechaDer className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Carrusel horizontal: en móvil una tarjeta por deslizamiento */}
              <div
                ref={carruselRef}
                className="scrollbar-none -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-5 pb-3 pt-2 sm:-mx-7 sm:px-7"
              >
                {destacados.map((producto) => (
                  <div
                    key={producto.id}
                    className="w-[82%] shrink-0 snap-center sm:w-56 sm:snap-start lg:w-60"
                  >
                    <ProductCard producto={producto} onVer={setDetalle} tasaBs={tasaBs} />
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* Categorías */}
        <div id="catalogo" className="sticky top-[84px] z-30 -mx-4 mb-6 scroll-mt-24 px-4 py-2">
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
      <BotonWhatsApp />
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
