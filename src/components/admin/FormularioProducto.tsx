"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconoBasura, IconoCerrar, IconoCheck, IconoSubir } from "@/components/icons";
import { Boton } from "@/components/ui/Boton";
import { Campo, CampoArea } from "@/components/ui/Campo";
import { UMBRAL_MARGEN_BAJO } from "@/lib/finance";
import { formatoMoneda, formatoPorcentaje } from "@/lib/format";
import { subirImagen } from "@/lib/cloudinary";
import { actualizarProducto, crearProducto } from "@/lib/store";
import type { Producto } from "@/lib/types";

interface Props {
  abierto: boolean;
  producto: Producto | null; // null = crear
  onCerrar: () => void;
}

interface Borrador {
  nombre: string;
  descripcion: string;
  categoria: string;
  precioCosto: string;
  precioVenta: string;
  precioVentaDivisas: string;
  stock: string;
  imagenes: string[];
  activo: boolean;
}

const borradorVacio: Borrador = {
  nombre: "",
  descripcion: "",
  categoria: "Perfumes",
  precioCosto: "",
  precioVenta: "",
  precioVentaDivisas: "",
  stock: "0",
  imagenes: [],
  activo: true,
};

function vistaMargen(costo: number, venta: number) {
  if (!(costo > 0) || !(venta > 0)) return null;
  const margen = venta - costo;
  const porcentaje = (margen / costo) * 100;
  const clase =
    porcentaje < 0
      ? "text-rose-600"
      : porcentaje < UMBRAL_MARGEN_BAJO
        ? "text-amber-600"
        : "text-emerald-600";
  return (
    <span className={`text-xs font-semibold ${clase}`}>
      {formatoMoneda(margen)} ({formatoPorcentaje(porcentaje)})
    </span>
  );
}

export function FormularioProducto({ abierto, producto, onCerrar }: Props) {
  const [borrador, setBorrador] = useState<Borrador>(borradorVacio);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const inputArchivo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!abierto) return;
    setError("");
    setBorrador(
      producto
        ? {
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            categoria: producto.categoria,
            precioCosto: String(producto.precioCosto),
            precioVenta: String(producto.precioVenta),
            precioVentaDivisas: String(producto.precioVentaDivisas),
            stock: String(producto.stock),
            imagenes: [...producto.imagenes],
            activo: producto.activo,
          }
        : borradorVacio
    );
  }, [abierto, producto]);

  const costo = parseFloat(borrador.precioCosto);
  const ventaBase = parseFloat(borrador.precioVenta);
  const ventaDivisas = parseFloat(borrador.precioVentaDivisas);

  const margenBase = useMemo(() => vistaMargen(costo, ventaBase), [costo, ventaBase]);
  const margenDivisas = useMemo(() => vistaMargen(costo, ventaDivisas), [costo, ventaDivisas]);

  function actualizar<K extends keyof Borrador>(clave: K, valor: Borrador[K]) {
    setBorrador((prev) => ({ ...prev, [clave]: valor }));
  }

  async function cargarImagenes(archivos: FileList | null) {
    if (!archivos?.length) return;
    setSubiendo(true);
    setError("");
    try {
      const urls = await Promise.all(Array.from(archivos).map(subirImagen));
      setBorrador((prev) => ({ ...prev, imagenes: [...prev.imagenes, ...urls] }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir imágenes.");
    } finally {
      setSubiendo(false);
      if (inputArchivo.current) inputArchivo.current.value = "";
    }
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (guardando) return;

    if (!borrador.nombre.trim()) return setError("El nombre es obligatorio.");
    if (!(costo >= 0) || borrador.precioCosto === "")
      return setError("El precio de costo es obligatorio.");
    if (!(ventaBase > 0)) return setError("El precio de venta base es obligatorio.");

    setGuardando(true);
    setError("");
    const datos = {
      nombre: borrador.nombre.trim(),
      descripcion: borrador.descripcion.trim(),
      categoria: borrador.categoria.trim() || "General",
      precioCosto: costo,
      precioVenta: ventaBase,
      // Sin precio en divisas definido, usa el precio base (sin promoción).
      precioVentaDivisas: ventaDivisas > 0 ? ventaDivisas : ventaBase,
      stock: Math.max(0, parseInt(borrador.stock, 10) || 0),
      imagenes: borrador.imagenes,
      activo: borrador.activo,
    };

    try {
      if (producto) {
        await actualizarProducto(producto.id, datos);
      } else {
        await crearProducto(datos);
      }
      onCerrar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el producto.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCerrar}
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm"
        >
          <motion.form
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={guardar}
            className="my-8 w-full max-w-2xl space-y-5 rounded-3xl border border-glass-border bg-white p-6 shadow-glass sm:p-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {producto ? "Editar producto" : "Nuevo producto"}
              </h2>
              <button
                type="button"
                onClick={onCerrar}
                aria-label="Cerrar"
                className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <IconoCerrar className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo
                etiqueta="Nombre *"
                value={borrador.nombre}
                onChange={(e) => actualizar("nombre", e.target.value)}
              />
              <Campo
                etiqueta="Categoría"
                list="categorias-sugeridas"
                value={borrador.categoria}
                onChange={(e) => actualizar("categoria", e.target.value)}
              />
              <datalist id="categorias-sugeridas">
                <option value="Perfumes" />
                <option value="Electrónica" />
                <option value="Accesorios" />
                <option value="Juguetes" />
              </datalist>
            </div>

            <CampoArea
              etiqueta="Descripción"
              value={borrador.descripcion}
              onChange={(e) => actualizar("descripcion", e.target.value)}
            />

            {/* Precios y rentabilidad en vivo */}
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Campo
                  etiqueta="Precio costo (USD) *"
                  type="number"
                  min={0}
                  step="0.01"
                  value={borrador.precioCosto}
                  onChange={(e) => actualizar("precioCosto", e.target.value)}
                />
                <Campo
                  etiqueta="Precio venta base *"
                  type="number"
                  min={0}
                  step="0.01"
                  value={borrador.precioVenta}
                  onChange={(e) => actualizar("precioVenta", e.target.value)}
                />
                <Campo
                  etiqueta="Precio divisas (físico)"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Igual al base"
                  value={borrador.precioVentaDivisas}
                  onChange={(e) => actualizar("precioVentaDivisas", e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
                <span>Margen base: {margenBase ?? "—"}</span>
                <span>Margen divisas: {margenDivisas ?? "—"}</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo
                etiqueta="Stock (unidades)"
                type="number"
                min={0}
                step="1"
                value={borrador.stock}
                onChange={(e) => actualizar("stock", e.target.value)}
              />
              <label className="flex cursor-pointer items-end gap-3 pb-2">
                <input
                  type="checkbox"
                  checked={borrador.activo}
                  onChange={(e) => actualizar("activo", e.target.checked)}
                  className="h-5 w-5 rounded-md border-slate-300 accent-indigo-600"
                />
                <span className="text-sm text-slate-600">Visible en la tienda</span>
              </label>
            </div>

            {/* Imágenes (Cloudinary) */}
            <div className="space-y-3">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-600">
                Imágenes del producto
              </span>
              <div className="flex flex-wrap gap-3">
                {borrador.imagenes.map((url, i) => (
                  <div
                    key={`${url.slice(0, 40)}-${i}`}
                    className="group relative h-20 w-20 overflow-hidden rounded-2xl border border-slate-200"
                  >
                    <Image
                      src={url}
                      alt={`Imagen ${i + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                      unoptimized={url.startsWith("data:")}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        actualizar(
                          "imagenes",
                          borrador.imagenes.filter((_, j) => j !== i)
                        )
                      }
                      aria-label="Quitar imagen"
                      className="absolute inset-0 grid place-items-center bg-slate-900/50 opacity-0 transition group-hover:opacity-100"
                    >
                      <IconoBasura className="h-5 w-5 text-white" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={subiendo}
                  onClick={() => inputArchivo.current?.click()}
                  className="grid h-20 w-20 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 transition hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-40"
                >
                  <span className="flex flex-col items-center gap-1 text-[10px]">
                    <IconoSubir className="h-5 w-5" />
                    {subiendo ? "Subiendo…" : "Subir"}
                  </span>
                </button>
              </div>
              <input
                ref={inputArchivo}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => cargarImagenes(e.target.files)}
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600"
              >
                {error}
              </motion.p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Boton type="button" variante="fantasma" onClick={onCerrar}>
                Cancelar
              </Boton>
              <Boton type="submit" disabled={guardando || subiendo}>
                <IconoCheck className="h-4 w-4" />
                {guardando ? "Guardando…" : producto ? "Guardar cambios" : "Crear producto"}
              </Boton>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
