import { IconoLogo } from "@/components/icons";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-glass-border bg-white/[0.03] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2 text-slate-300">
          <IconoLogo className="h-5 w-5 text-violet-300" />
          <span className="text-sm font-semibold tracking-wide">NovaStore</span>
          <span className="text-xs text-slate-500">
            © {new Date().getFullYear()} — Todos los derechos reservados
          </span>
        </div>
        <a
          href="https://dgpglobalgroup.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group text-xs text-slate-400 transition-colors hover:text-white"
        >
          Desarrollo y arquitectura por{" "}
          <span className="font-semibold text-violet-300 underline-offset-4 group-hover:underline">
            DGP Global Group
          </span>
        </a>
      </div>
    </footer>
  );
}
