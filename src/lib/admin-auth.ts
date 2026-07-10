import { createHmac, timingSafeEqual } from "crypto";

/**
 * Autenticación simple para /admin: usuario y contraseña definidos por
 * variables de entorno y sesión mediante cookie httpOnly firmada (HMAC).
 */

const USUARIO = process.env.ADMIN_USER ?? "admin";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "novastore2026";
const SECRETO = process.env.ADMIN_SECRET ?? "novastore-secreto-de-desarrollo";

export const COOKIE_SESION = "nova_admin";
export const DURACION_SESION_SEG = 60 * 60 * 8; // 8 horas

export function credencialesValidas(usuario: string, password: string): boolean {
  return usuario === USUARIO && password === PASSWORD;
}

/** Token determinístico derivado de las credenciales y el secreto. */
export function tokenSesion(): string {
  return createHmac("sha256", SECRETO).update(`${USUARIO}:${PASSWORD}`).digest("hex");
}

export function tokenValido(token: string | undefined): boolean {
  if (!token) return false;
  const esperado = Buffer.from(tokenSesion());
  const recibido = Buffer.from(token);
  return esperado.length === recibido.length && timingSafeEqual(esperado, recibido);
}
