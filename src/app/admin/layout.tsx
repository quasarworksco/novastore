import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel Administrativo — NovaStore",
  robots: { index: false, follow: false },
};

// El gate de autenticación vive en el cliente (src/app/admin/page.tsx)
// para que la ruta funcione en hosting estático como GitHub Pages.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
