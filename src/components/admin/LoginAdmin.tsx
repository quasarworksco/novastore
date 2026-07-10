"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { IconoCandado } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { GlassCard } from "@/components/ui/GlassCard";
import { iniciarSesion } from "@/lib/admin-auth";

export function LoginAdmin({ onExito }: { onExito: () => void }) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function ingresar(e: FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      if (await iniciarSesion(usuario, password)) {
        onExito();
      } else {
        setError("Usuario o contraseña incorrectos.");
      }
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
          <div className="flex flex-col items-center gap-3 text-center">
            <Logo size="lg" />
            <div>
              <h1 className="text-lg font-bold text-slate-900">Panel Administrativo</h1>
              <p className="text-xs text-slate-500">Acceso restringido</p>
            </div>
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
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600"
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
