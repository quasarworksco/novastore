"use client";

// Valores públicos por diseño (unsigned preset); pueden sobreescribirse por env.
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "gingt9vy";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "novastore";

export const cloudinaryConfigurado = Boolean(CLOUD_NAME && UPLOAD_PRESET);

/**
 * Sube una imagen a Cloudinary mediante un "unsigned upload preset" y
 * devuelve la URL segura. Sin Cloudinary configurado (modo demo) convierte
 * el archivo a data-URL para que la vista previa funcione igual.
 */
export async function subirImagen(archivo: File): Promise<string> {
  if (!cloudinaryConfigurado) {
    return new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.onload = () => resolve(lector.result as string);
      lector.onerror = () => reject(new Error("No se pudo leer la imagen."));
      lector.readAsDataURL(archivo);
    });
  }

  const cuerpo = new FormData();
  cuerpo.append("file", archivo);
  cuerpo.append("upload_preset", UPLOAD_PRESET as string);

  const respuesta = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: cuerpo,
  });

  if (!respuesta.ok) {
    throw new Error(`Cloudinary respondió ${respuesta.status}. Verifica el upload preset.`);
  }

  const datos = (await respuesta.json()) as { secure_url: string };
  return datos.secure_url;
}

/**
 * Trae una imagen a partir de su URL (pegada por el usuario): Cloudinary la
 * descarga en su servidor y la re-aloja de forma permanente, evitando que el
 * enlace original se rompa. Si Cloudinary no logra descargarla (sitio que
 * bloquea hotlinking, etc.), se usa la URL tal cual como último recurso.
 */
export async function subirImagenDesdeUrl(url: string): Promise<string> {
  const limpia = url.trim();
  if (!/^https?:\/\//i.test(limpia)) {
    throw new Error("Pega un enlace de imagen válido que empiece por http.");
  }
  if (!cloudinaryConfigurado) return limpia;

  try {
    const cuerpo = new FormData();
    cuerpo.append("file", limpia);
    cuerpo.append("upload_preset", UPLOAD_PRESET as string);
    const respuesta = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: cuerpo,
    });
    if (!respuesta.ok) throw new Error(String(respuesta.status));
    const datos = (await respuesta.json()) as { secure_url: string };
    return datos.secure_url;
  } catch {
    // Cloudinary no pudo traerla: usar el enlace original directamente.
    return limpia;
  }
}
