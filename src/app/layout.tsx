import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Starfield } from "@/components/layout/Starfield";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const SITIO = "https://novastore.dgp-link.com";
const DESCRIPCION =
  "Perfumes, tecnología, accesorios y juguetes con entrega inmediata. Elige lo que te gusta y pídelo por WhatsApp en segundos.";

export const metadata: Metadata = {
  metadataBase: new URL(SITIO),
  title: {
    default: "NovaStore — Tu tienda online",
    template: "%s · NovaStore",
  },
  description: DESCRIPCION,
  applicationName: "NovaStore",
  keywords: ["tienda online", "perfumes", "electrónica", "accesorios", "juguetes", "WhatsApp"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_VE",
    url: SITIO,
    siteName: "NovaStore",
    title: "NovaStore — Tu tienda online",
    description: DESCRIPCION,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "NovaStore" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NovaStore — Tu tienda online",
    description: DESCRIPCION,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Starfield />
        {children}
      </body>
    </html>
  );
}
