import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="text-xs text-slate-400">
            © {new Date().getFullYear()} — Todos los derechos reservados
          </span>
        </div>
        <a
          href="https://dgpglobalgroup.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group text-xs text-slate-500 transition-colors hover:text-slate-900"
        >
          Desarrollo y arquitectura por{" "}
          <span className="font-semibold text-indigo-600 underline-offset-4 group-hover:underline">
            DGP Global Group
          </span>
        </a>
      </div>
    </footer>
  );
}
