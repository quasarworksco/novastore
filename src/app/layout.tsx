import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "NovaStore — Tienda Online",
  description:
    "Perfumes, electrónica, accesorios y juguetes con entrega inmediata. Pide por WhatsApp.",
};

export const viewport: Viewport = {
  themeColor: "#0b0f1e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* Blobs decorativos animados del fondo Liquid Glass */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-32 top-[-10%] h-[420px] w-[420px] rounded-full bg-violet-600/25 blur-[120px] animate-blob-slow" />
          <div className="absolute right-[-10%] top-[20%] h-[380px] w-[380px] rounded-full bg-cyan-500/20 blur-[120px] animate-blob-slower" />
          <div className="absolute bottom-[-15%] left-[30%] h-[420px] w-[420px] rounded-full bg-fuchsia-600/20 blur-[130px] animate-blob-slow" />
        </div>
        {children}
      </body>
    </html>
  );
}
