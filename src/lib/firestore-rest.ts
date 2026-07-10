"use client";

/**
 * Cliente mínimo de Firestore sobre su API REST (fetch + CORS).
 *
 * Se usa en lugar del SDK de tiempo real porque la REST funciona de forma
 * fiable en todo navegador/red (el canal WebChannel del SDK se cuelga tras
 * proxies y en redes móviles restrictivas, dejando las escrituras a medias).
 * No hay listeners en vivo: las vistas hacen fetch inicial + sondeo ligero,
 * y las mutaciones fuerzan un refresco inmediato.
 */

import { firebaseConfig } from "./firebase";

const BASE = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
const KEY = firebaseConfig.apiKey;

type Primitivo = string | number | boolean | null;
type Valor = Primitivo | Valor[] | { [k: string]: Valor };
type Campos = Record<string, unknown>;

/* ── Codificación de valores al formato REST de Firestore ─────────── */

function aValor(v: unknown): Record<string, unknown> {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (typeof v === "string") return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(aValor) } };
  if (typeof v === "object") return { mapValue: { fields: aCampos(v as Campos) } };
  return { stringValue: String(v) };
}

function aCampos(obj: Campos): Record<string, unknown> {
  const campos: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) campos[k] = aValor(v);
  }
  return campos;
}

function desdeValor(val: Record<string, unknown>): Valor {
  const clave = Object.keys(val)[0];
  switch (clave) {
    case "integerValue":
      return Number(val.integerValue);
    case "doubleValue":
      return Number(val.doubleValue);
    case "booleanValue":
      return val.booleanValue as boolean;
    case "stringValue":
    case "timestampValue":
      return val[clave] as string;
    case "nullValue":
      return null;
    case "arrayValue": {
      const arr = (val.arrayValue as { values?: Record<string, unknown>[] }).values ?? [];
      return arr.map(desdeValor);
    }
    case "mapValue": {
      const f = (val.mapValue as { fields?: Record<string, Record<string, unknown>> }).fields ?? {};
      return desdeCampos(f);
    }
    default:
      return null;
  }
}

function desdeCampos(campos: Record<string, Record<string, unknown>>): Record<string, Valor> {
  const obj: Record<string, Valor> = {};
  for (const [k, v] of Object.entries(campos)) obj[k] = desdeValor(v);
  return obj;
}

interface DocREST {
  name: string;
  fields?: Record<string, Record<string, unknown>>;
}

function idDeNombre(name: string): string {
  return name.split("/").pop() as string;
}

function mapearDoc<T>(doc: DocREST): T {
  return { ...desdeCampos(doc.fields ?? {}), id: idDeNombre(doc.name) } as T;
}

/* ── Operaciones ─────────────────────────────────────────────────── */

export async function listar<T>(coleccion: string): Promise<T[]> {
  const resultados: T[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL(`${BASE}/${coleccion}`);
    url.searchParams.set("key", KEY);
    url.searchParams.set("pageSize", "300");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const resp = await fetch(url.toString());
    if (!resp.ok) throw new Error(`Firestore ${resp.status} al listar ${coleccion}`);
    const datos = (await resp.json()) as { documents?: DocREST[]; nextPageToken?: string };
    (datos.documents ?? []).forEach((d) => resultados.push(mapearDoc<T>(d)));
    pageToken = datos.nextPageToken;
  } while (pageToken);
  return resultados;
}

export async function obtener<T>(coleccion: string, id: string): Promise<T | null> {
  const resp = await fetch(`${BASE}/${coleccion}/${id}?key=${KEY}`);
  if (resp.status === 404) return null;
  if (!resp.ok) throw new Error(`Firestore ${resp.status} al obtener ${coleccion}/${id}`);
  return mapearDoc<T>((await resp.json()) as DocREST);
}

/** Crea un documento con id autogenerado y devuelve su id. */
export async function crear(coleccion: string, datos: Campos): Promise<string> {
  const resp = await fetch(`${BASE}/${coleccion}?key=${KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: aCampos(datos) }),
  });
  if (!resp.ok) throw new Error(await mensajeError(resp, `crear en ${coleccion}`));
  return idDeNombre(((await resp.json()) as DocREST).name);
}

/** Actualiza solo los campos indicados (updateMask), preservando el resto. */
export async function actualizar(coleccion: string, id: string, datos: Campos): Promise<void> {
  const url = new URL(`${BASE}/${coleccion}/${id}`);
  url.searchParams.set("key", KEY);
  for (const campo of Object.keys(datos)) url.searchParams.append("updateMask.fieldPaths", campo);

  const resp = await fetch(url.toString(), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: aCampos(datos) }),
  });
  if (!resp.ok) throw new Error(await mensajeError(resp, `actualizar ${coleccion}/${id}`));
}

export async function eliminar(coleccion: string, id: string): Promise<void> {
  const resp = await fetch(`${BASE}/${coleccion}/${id}?key=${KEY}`, { method: "DELETE" });
  if (!resp.ok) throw new Error(await mensajeError(resp, `eliminar ${coleccion}/${id}`));
}

async function mensajeError(resp: Response, accion: string): Promise<string> {
  try {
    const cuerpo = (await resp.json()) as { error?: { message?: string } };
    const detalle = cuerpo.error?.message ?? "";
    if (resp.status === 429 || /quota/i.test(detalle)) {
      return "Se alcanzó el límite diario gratuito de Firebase. Los datos están a salvo; vuelve a intentarlo más tarde o activa el plan Blaze en la consola de Firebase.";
    }
    if (resp.status === 403 || /permission/i.test(detalle)) {
      return "Firestore denegó la operación. Publica las reglas de firestore.rules en la consola de Firebase.";
    }
    return `No se pudo ${accion}: ${detalle || resp.status}`;
  } catch {
    return `No se pudo ${accion} (HTTP ${resp.status}).`;
  }
}
