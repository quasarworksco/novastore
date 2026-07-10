import type { Metadata } from "next";
import { cookies } from "next/headers";
import { COOKIE_SESION, tokenValido } from "@/lib/admin-auth";
import { LoginAdmin } from "@/components/admin/LoginAdmin";

export const metadata: Metadata = {
  title: "Panel Administrativo — NovaStore",
  robots: { index: false, follow: false },
};

/**
 * Ruta protegida: valida la cookie de sesión en el servidor.
 * Sin sesión válida se renderiza el formulario de acceso en lugar del panel.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get(COOKIE_SESION)?.value;

  if (!tokenValido(token)) {
    return <LoginAdmin />;
  }

  return <>{children}</>;
}
