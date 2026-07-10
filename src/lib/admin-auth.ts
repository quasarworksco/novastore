"use client";

/**
 * Autenticación simple del panel /admin, 100% en el navegador para que
 * funcione en hosting estático (GitHub Pages).
 *
 * Las credenciales no viajan a ningún servidor: se comparan contra un hash
 * SHA-256 embebido en el bundle. Nota: en un sitio estático esto es una
 * barrera de acceso básica, no seguridad fuerte — la protección real de los
 * datos son las reglas de Firestore.
 *
 * Para cambiar las credenciales genera el hash de "usuario:contraseña":
 *   node -e "console.log(require('crypto').createHash('sha256').update('usuario:contraseña').digest('hex'))"
 * y colócalo en NEXT_PUBLIC_ADMIN_HASH al compilar.
 */

// Hash por defecto: admin / novastore2026
const HASH_CREDENCIALES =
  process.env.NEXT_PUBLIC_ADMIN_HASH ??
  "d6d675299445c871aa19bb7203799e5c8df94661d7103cada4ec327d374b9fab";

const CLAVE_SESION = "nova_admin_sesion";
const DURACION_SESION_MS = 1000 * 60 * 60 * 8; // 8 horas

async function sha256Hex(texto: string): Promise<string> {
  const datos = new TextEncoder().encode(texto);
  const resumen = await crypto.subtle.digest("SHA-256", datos);
  return Array.from(new Uint8Array(resumen))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function iniciarSesion(usuario: string, password: string): Promise<boolean> {
  const hash = await sha256Hex(`${usuario}:${password}`);
  if (hash !== HASH_CREDENCIALES) return false;
  window.localStorage.setItem(
    CLAVE_SESION,
    JSON.stringify({ hash, expira: Date.now() + DURACION_SESION_MS })
  );
  return true;
}

export function sesionValida(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const crudo = window.localStorage.getItem(CLAVE_SESION);
    if (!crudo) return false;
    const sesion = JSON.parse(crudo) as { hash?: string; expira?: number };
    return sesion.hash === HASH_CREDENCIALES && (sesion.expira ?? 0) > Date.now();
  } catch {
    return false;
  }
}

export function cerrarSesion(): void {
  window.localStorage.removeItem(CLAVE_SESION);
}
