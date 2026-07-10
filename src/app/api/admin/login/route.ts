import { NextResponse } from "next/server";
import {
  COOKIE_SESION,
  DURACION_SESION_SEG,
  credencialesValidas,
  tokenSesion,
} from "@/lib/admin-auth";

export async function POST(solicitud: Request) {
  const { usuario, password } = (await solicitud.json().catch(() => ({}))) as {
    usuario?: string;
    password?: string;
  };

  if (!usuario || !password || !credencialesValidas(usuario, password)) {
    return NextResponse.json({ ok: false, error: "Credenciales inválidas." }, { status: 401 });
  }

  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.set(COOKIE_SESION, tokenSesion(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_SESION_SEG,
  });
  return respuesta;
}
