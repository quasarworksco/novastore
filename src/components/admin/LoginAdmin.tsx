"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { IconoCandado, IconoLogo } from "@/components/icons";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { GlassCard } from "@/components/ui/GlassCard";

export function LoginAdmin() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function ingresar(e: FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const respuesta = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password }),
      });
      if (respuesta.ok) {
        router.refresh();
      } else {
        setError("Usuario o contraseña incorrectos.");
      }
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <GlassCard className="space-y-6 p-8">
          <div className="space-y-2 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-glow">
              <IconoLogo className="h-7 w-7 text-white" />
            </span>
            <h1 className="text-xl font-bold text-white">Panel Administrativo</h1>
            <p className="text-xs text-slate-400">Acceso restringido — NovaStore</p>
          </div>

          <form onSubmit={ingresar} className="space-y-4">
            <Campo
              etiqueta="Usuario"
              autoComplete="username"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />
            <Campo
              etiqueta="Contraseña"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300"
              >
                {error}
              </motion.p>
            )}

            <Boton type="submit" className="w-full py-3" disabled={cargando}>
              <IconoCandado className="h-4 w-4" />
              {cargando ? "Verificando…" : "Ingresar"}
            </Boton>
          </form>
        </GlassCard>
      </motion.div>
    </main>
  );
}
