"use client";

import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const claseBase =
  "w-full rounded-2xl border border-glass-border bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 outline-none backdrop-blur-sm transition-colors focus:border-violet-400/60 focus:bg-white/10";

interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta?: string;
}

export function Campo({ etiqueta, className = "", ...props }: CampoProps) {
  return (
    <label className="block space-y-1.5">
      {etiqueta && (
        <span className="text-xs font-medium uppercase tracking-wider text-slate-300">
          {etiqueta}
        </span>
      )}
      <input className={`${claseBase} ${className}`} {...props} />
    </label>
  );
}

interface AreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  etiqueta?: string;
}

export function CampoArea({ etiqueta, className = "", ...props }: AreaProps) {
  return (
    <label className="block space-y-1.5">
      {etiqueta && (
        <span className="text-xs font-medium uppercase tracking-wider text-slate-300">
          {etiqueta}
        </span>
      )}
      <textarea className={`${claseBase} min-h-[90px] resize-y ${className}`} {...props} />
    </label>
  );
}
