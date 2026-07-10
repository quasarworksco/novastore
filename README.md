# NovaStore — Tienda Online Liquid Glass

Tienda online de alto impacto visual construida con **Next.js (App Router) + TypeScript**,
**Tailwind CSS** y **Framer Motion**, con backend en **Firestore (Firebase)**, imágenes en
**Cloudinary** y checkout por **WhatsApp**.

## Stack

| Capa | Tecnología |
| --- | --- |
| UI | React 18 / Next.js 14, Tailwind CSS, Framer Motion |
| Iconografía | SVG minimalista propio (`src/components/icons.tsx`, sin emojis) |
| Datos | Firestore (tiempo real con `onSnapshot`) con fallback a modo demo |
| Medios | Cloudinary (unsigned upload preset) |
| Checkout | WhatsApp (`wa.me/584121002090`) con resumen del pedido prellenado |
| Admin | Ruta protegida `/admin` con usuario/contraseña y cookie httpOnly firmada |

## Arranque rápido

```bash
npm install
npm run dev                  # http://localhost:3000
```

La app viene conectada por defecto al proyecto Firebase **`novastore-c5457`** y al cloud de
Cloudinary **`gingt9vy`** (valores sobreescribibles vía `.env.local`, ver `.env.example`).

**Paso obligatorio en Firebase**: en la consola → *Firestore Database* → *Reglas*, publica el
contenido de [`firestore.rules`](./firestore.rules); si la base quedó en "modo producción"
(deniega todo), la tienda no podrá leer ni escribir. Con el catálogo vacío, el panel
`/admin` → *Productos* ofrece un botón para **cargar el catálogo de ejemplo** con un clic.

- Tienda: `/`
- Panel administrativo: `/admin` (por defecto `admin` / `novastore2026`; cámbialo con
  `ADMIN_USER`, `ADMIN_PASSWORD` y `ADMIN_SECRET`).

## Arquitectura de datos (Firestore)

### `productos`

```jsonc
{
  "nombre": "Aurora Intense 100ml",
  "descripcion": "Eau de parfum…",
  "categoria": "Perfumes",
  "precioCosto": 28,            // obligatorio: costo de adquisición
  "precioVenta": 55,            // obligatorio: precio de venta base
  "precioVentaDivisas": 48,     // promocional al pagar en divisas en físico
  "stock": 14,
  "imagenes": ["https://res.cloudinary.com/…"],  // múltiples imágenes
  "activo": true,
  "creadoEn": 1720576800000,    // epoch ms
  "actualizadoEn": 1720576800000
}
```

La rentabilidad **no se almacena**: se calcula en el cliente (`src/lib/finance.ts`), por lo
que editar un producto actualiza márgenes y totales del dashboard en tiempo real.

- Diferencia (margen neto): `precioVenta - precioCosto`
- % de ganancia: `((precioVenta - precioCosto) / precioCosto) * 100` (2 decimales)
- Valor del inventario: `Σ stock × precioCosto`
- Proyección de ventas: `Σ stock × precioVenta` (y variante en divisas)

### `ventas`

```jsonc
{
  "items": [
    {
      "productoId": "abc123",
      "nombre": "Aurora Intense 100ml",
      "cantidad": 2,
      "precioUnitario": 48,     // precio aplicado según método de pago
      "costoUnitario": 28       // costo congelado para ganancia real
    }
  ],
  "total": 96,
  "metodoPago": "divisas",      // "base" | "divisas"
  "cliente": { "nombre": "Ana", "telefono": "0412…" },
  "estado": "pendiente",        // pendiente | confirmada | entregada | cancelada
  "creadoEn": 1720576800000
}
```

Al registrar la venta se descuenta stock (`increment(-cantidad)`) y se hace *upsert* del
cliente por teléfono.

### `clientes`

```jsonc
{
  "nombre": "Ana Pérez",
  "telefono": "04121234567",
  "pedidos": 3,
  "totalGastado": 214,
  "creadoEn": 1720576800000,
  "ultimoPedido": 1720576800000
}
```

Reglas de seguridad de ejemplo en [`firestore.rules`](./firestore.rules) (endurécelas para
producción con Firebase Auth).

## Estructura del proyecto

```
src/
├── app/
│   ├── layout.tsx              # Fondo Liquid Glass + blobs animados
│   ├── page.tsx                # Tienda (catálogo, categorías animadas)
│   ├── admin/
│   │   ├── layout.tsx          # Gate de autenticación (cookie firmada)
│   │   └── page.tsx            # Dashboard con pestañas
│   └── api/admin/{login,logout}/route.ts
├── components/
│   ├── icons.tsx               # Set de iconos SVG minimalistas
│   ├── ui/                     # GlassCard, Boton, Campo, Insignia
│   ├── layout/                 # Navbar, Footer (firma DGP Global Group)
│   ├── store/                  # CategoryTabs, ProductCard, ProductModal, CartDrawer
│   └── admin/                  # LoginAdmin, StatCard, ResumenFinanciero,
│                               # TablaProductos, FormularioProducto,
│                               # TablaVentas, TablaClientes
├── lib/
│   ├── firebase.ts             # Inicialización perezosa de Firestore
│   ├── store.ts                # Capa de datos (Firestore ⇄ modo demo)
│   ├── finance.ts              # Márgenes, % ganancia, resumen financiero
│   ├── cloudinary.ts           # Subida unsigned de imágenes
│   ├── whatsapp.ts             # Construcción del pedido para wa.me
│   ├── cart-context.tsx        # Estado global del carrito
│   ├── admin-auth.ts           # Sesión HMAC del panel
│   ├── format.ts / types.ts
│   └── …
└── data/seed.ts                # Catálogo demo
```

## Cloudinary

El panel sube imágenes directo desde el formulario de producto usando el **unsigned upload
preset** (`novastore`, cloud `gingt9vy` por defecto). Para cambiarlo define
`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` y `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
El preset debe estar en modo *Unsigned* (Cloudinary → Settings → Upload → Upload presets).

## Checkout por WhatsApp

El botón **«Pedir por WhatsApp»** del carrito registra la venta en Firestore, descuenta el
stock y abre `https://wa.me/584121002090` con el resumen: ítems, cantidades, precios según
método de pago (base o **divisas en físico**, con precio promocional), total y datos del
cliente.

---

Desarrollo y arquitectura por [DGP Global Group](https://dgpglobalgroup.com).
