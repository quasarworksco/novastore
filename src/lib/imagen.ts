/**
 * Optimiza la entrega de imágenes de Cloudinary insertando transformaciones
 * en la URL: formato automático (WebP/AVIF), calidad automática y un ancho
 * máximo. Una foto de varios MB pasa a decenas de KB, clave para que la
 * tienda cargue rápido en móvil. URLs que no son de Cloudinary (o data URLs)
 * se devuelven sin tocar.
 */
export function imagenOptimizada(url: string | undefined, ancho: number): string {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) return url;
  // Ya trae transformaciones (f_/q_/w_): no duplicar.
  if (/\/image\/upload\/[^/]*(f_|q_|w_)/.test(url)) return url;
  return url.replace("/image/upload/", `/image/upload/f_auto,q_auto,w_${ancho},c_limit/`);
}
