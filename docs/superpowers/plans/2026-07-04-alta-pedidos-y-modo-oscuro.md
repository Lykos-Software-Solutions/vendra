# Alta de pedidos y modo oscuro — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear pedidos desde la UI (con descuento y validación de stock) y modo oscuro con toggle + preferencia del sistema.

**Architecture:** El alta de pedidos sigue el patrón existente de productos: página server + componente client de formulario + server action con redirect por querystring; el stock se valida y descuenta dentro de una transacción Prisma. El modo oscuro redefine los tokens semánticos de `@theme` con `light-dark()` y conmuta `color-scheme` vía `data-theme` en `<html>` (script anti-flash inline + toggle en el sidebar); los colores hardcodeados (chips de estado, chips de error, gráfico) pasan a variables.

**Tech Stack:** Next.js 16 App Router, React 19, Prisma 6 + SQLite, Tailwind CSS v4, lucide-react, recharts. Verificación e2e con `playwright-core` + Chrome del sistema (ya instalado en el scratchpad, NO agregarlo al repo).

**Spec:** `docs/superpowers/specs/2026-07-04-alta-pedidos-y-modo-oscuro-design.md`

## Global Constraints

- Todo el copy de UI en español rioplatense (voseo: "Elegí", "Revisá").
- Sin dependencias nuevas en `package.json`.
- No hay framework de tests unitarios en el repo y no se agrega: la verificación es `npm run build`, `npm run lint` y scripts e2e de Playwright (patrón de la skill `verify`: `chromium.launch({ channel: "chrome", headless: true })`).
- Los scripts e2e viven en el scratchpad de la sesión (fuera del repo). En este plan la ruta se abrevia `$SCRATCH` — reemplazar por el directorio scratchpad real de la sesión.
- Servidor para e2e: `npm run build && PORT=3111 npm start` (matar el server al terminar cada tanda).
- La base local es `prisma/dev.db`; al terminar la verificación final correr `npx prisma db seed` para restaurar los datos demo.
- Trampas de selectores (de la skill `verify`): el link "Pedidos" del sidebar matchea también el tile "Pedidos pendientes" → usar `page.locator("aside").getByRole("link", ...)`; `getByRole("alert")` matchea el route announcer de Next → usar `p[role="alert"]`.

---

### Task 1: Server action `crearPedido`

**Files:**
- Modify: `lib/actions.ts` (agregar al final)

**Interfaces:**
- Consumes: `prisma` (`lib/prisma.ts`), `revalidatePath`, `redirect` (ya importados en el archivo).
- Produces: `crearPedido(formData: FormData): Promise<void>` — server action. Lee del FormData: `clienteId` (string numérico), `notas` (string, opcional), y campos repetidos `productoId` / `cantidad` (uno por fila de item). Redirige a `/pedidos/nuevo?error=datos` o `?error=stock` si falla, o al detalle `/pedidos/<id>` si crea.

- [ ] **Step 1: Agregar la action al final de `lib/actions.ts`**

```ts
export async function crearPedido(formData: FormData) {
  const clienteId = Number(formData.get("clienteId"));
  const notas = String(formData.get("notas") ?? "").trim();
  const productoIds = formData.getAll("productoId").map(Number);
  const cantidades = formData.getAll("cantidad").map(Number);

  const valido =
    Number.isInteger(clienteId) &&
    clienteId > 0 &&
    productoIds.length > 0 &&
    productoIds.length === cantidades.length &&
    productoIds.every((id) => Number.isInteger(id) && id > 0) &&
    cantidades.every((c) => Number.isInteger(c) && c > 0) &&
    new Set(productoIds).size === productoIds.length;
  if (!valido) redirect("/pedidos/nuevo?error=datos");

  // El total y los precios unitarios se calculan acá con los precios de la
  // base; lo que manda el cliente es solo informativo.
  let pedidoId = 0;
  let falla: "datos" | "stock" | null = null;
  try {
    pedidoId = await prisma.$transaction(async (tx) => {
      const [cliente, productos] = await Promise.all([
        tx.cliente.findUnique({ where: { id: clienteId } }),
        tx.producto.findMany({ where: { id: { in: productoIds } } }),
      ]);
      if (!cliente || productos.length !== productoIds.length) {
        throw new Error("datos");
      }

      const porId = new Map(productos.map((p) => [p.id, p]));
      const items = productoIds.map((id, i) => ({
        producto: porId.get(id)!,
        cantidad: cantidades[i],
      }));
      if (items.some((it) => it.cantidad > it.producto.stock)) {
        throw new Error("stock");
      }

      for (const it of items) {
        await tx.producto.update({
          where: { id: it.producto.id },
          data: { stock: { decrement: it.cantidad } },
        });
      }

      const ultimo = await tx.pedido.aggregate({ _max: { numero: true } });
      const pedido = await tx.pedido.create({
        data: {
          numero: (ultimo._max.numero ?? 1000) + 1,
          estado: "PENDIENTE",
          fecha: new Date(),
          total: items.reduce((s, it) => s + it.cantidad * it.producto.precio, 0),
          notas: notas || null,
          clienteId,
          items: {
            create: items.map((it) => ({
              productoId: it.producto.id,
              cantidad: it.cantidad,
              precioUnitario: it.producto.precio,
            })),
          },
        },
      });
      return pedido.id;
    });
  } catch (e) {
    falla = e instanceof Error && e.message === "stock" ? "stock" : "datos";
  }
  if (falla) redirect(`/pedidos/nuevo?error=${falla}`);

  revalidatePath("/", "layout");
  redirect(`/pedidos/${pedidoId}`);
}
```

Nota: los `redirect()` van FUERA del `try` porque `redirect` lanza `NEXT_REDIRECT` y el `catch` se lo comería.

- [ ] **Step 2: Verificar que compila**

Run: `npm run build 2>&1 | tail -5`
Expected: build exitoso, sin errores de tipos.

- [ ] **Step 3: Commit**

```bash
git add lib/actions.ts
git commit -m "Alta de pedidos: server action crearPedido con stock transaccional"
```

---

### Task 2: Formulario, página `/pedidos/nuevo` y botón en el listado

**Files:**
- Create: `components/pedido-form.tsx`
- Create: `app/(panel)/pedidos/nuevo/page.tsx`
- Modify: `app/(panel)/pedidos/page.tsx` (encabezado, línea ~44)

**Interfaces:**
- Consumes: `crearPedido` (Task 1), `moneda` de `lib/format.ts`, `Encabezado` de `components/encabezado.tsx`.
- Produces: `PedidoForm({ accion, clientes, productos, error })` — client component. `clientes: { id, nombre, ciudad }[]`, `productos: { id, nombre, precio, stock }[]`. Manda al FormData: `clienteId`, `notas`, y por cada fila `productoId` + `cantidad`.

- [ ] **Step 1: Crear `components/pedido-form.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { moneda } from "@/lib/format";

const MENSAJES_ERROR: Record<string, string> = {
  datos:
    "Revisá los datos: elegí un cliente y al menos un producto con cantidad válida.",
  stock: "No hay stock suficiente para alguno de los productos del pedido.",
};

const claseCampo =
  "rounded-lg bg-carta px-3 py-2 text-sm text-tinta ring-1 ring-borde placeholder:text-tinta-3 focus:outline-2 focus:outline-marca-600";

export type ClienteOpcion = { id: number; nombre: string; ciudad: string };
export type ProductoOpcion = {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
};

type Fila = { clave: number; productoId: string; cantidad: string };

export function PedidoForm({
  accion,
  clientes,
  productos,
  error,
}: {
  accion: (formData: FormData) => void;
  clientes: ClienteOpcion[];
  productos: ProductoOpcion[];
  error?: string;
}) {
  const [filas, setFilas] = useState<Fila[]>([
    { clave: 0, productoId: "", cantidad: "1" },
  ]);
  const [proximaClave, setProximaClave] = useState(1);

  const porId = new Map(productos.map((p) => [String(p.id), p]));
  const total = filas.reduce((suma, fila) => {
    const producto = porId.get(fila.productoId);
    const cantidad = Number(fila.cantidad);
    if (!producto || !Number.isInteger(cantidad) || cantidad <= 0) return suma;
    return suma + producto.precio * cantidad;
  }, 0);

  function actualizarFila(clave: number, cambios: Partial<Fila>) {
    setFilas((prev) =>
      prev.map((f) => (f.clave === clave ? { ...f, ...cambios } : f)),
    );
  }

  function agregarFila() {
    setFilas((prev) => [
      ...prev,
      { clave: proximaClave, productoId: "", cantidad: "1" },
    ]);
    setProximaClave((n) => n + 1);
  }

  function quitarFila(clave: number) {
    setFilas((prev) =>
      prev.length > 1 ? prev.filter((f) => f.clave !== clave) : prev,
    );
  }

  return (
    <form
      action={accion}
      className="max-w-2xl rounded-2xl bg-carta p-6 ring-1 ring-borde"
    >
      {error && MENSAJES_ERROR[error] && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200"
        >
          {MENSAJES_ERROR[error]}
        </p>
      )}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-tinta">
          Cliente
        </span>
        <select
          name="clienteId"
          required
          defaultValue=""
          className={`${claseCampo} w-full`}
        >
          <option value="" disabled>
            Elegí un cliente…
          </option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre} · {c.ciudad}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="mt-5">
        <legend className="mb-1.5 text-sm font-medium text-tinta">
          Productos
        </legend>
        <div className="flex flex-col gap-2">
          {filas.map((fila) => (
            <div key={fila.clave} className="flex items-center gap-2">
              <select
                name="productoId"
                required
                value={fila.productoId}
                onChange={(e) =>
                  actualizarFila(fila.clave, { productoId: e.target.value })
                }
                aria-label="Producto"
                className={`${claseCampo} min-w-0 flex-1`}
              >
                <option value="" disabled>
                  Elegí un producto…
                </option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.stock === 0}>
                    {p.nombre} · {moneda(p.precio)}
                    {p.stock === 0 ? " · sin stock" : ` · ${p.stock} disp.`}
                  </option>
                ))}
              </select>
              <input
                type="number"
                name="cantidad"
                required
                min="1"
                step="1"
                value={fila.cantidad}
                onChange={(e) =>
                  actualizarFila(fila.clave, { cantidad: e.target.value })
                }
                aria-label="Cantidad"
                className={`${claseCampo} w-24 shrink-0`}
              />
              <button
                type="button"
                onClick={() => quitarFila(fila.clave)}
                disabled={filas.length === 1}
                title="Quitar producto"
                className="rounded-md p-2 text-tinta-3 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-tinta-3"
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Quitar producto</span>
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={agregarFila}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-marca-700 ring-1 ring-borde transition-colors hover:bg-marca-50"
        >
          <Plus className="size-4" />
          Agregar producto
        </button>
      </fieldset>

      <label className="mt-5 block">
        <span className="mb-1.5 block text-sm font-medium text-tinta">
          Notas <span className="font-normal text-tinta-3">(opcional)</span>
        </span>
        <textarea
          name="notas"
          rows={2}
          placeholder="Ej.: Entregar por la mañana."
          className={`${claseCampo} w-full`}
        />
      </label>

      <div className="mt-5 flex items-center justify-between rounded-lg bg-papel px-4 py-3">
        <span className="text-sm font-medium text-tinta-2">Total estimado</span>
        <span className="font-display text-lg font-bold tabular-nums text-tinta">
          {moneda(total)}
        </span>
      </div>
      <p className="mt-2 text-xs text-tinta-3">
        El total final se calcula al confirmar, con los precios vigentes. El
        stock se descuenta al crear el pedido.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          className="rounded-lg bg-marca-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-marca-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600"
        >
          Crear pedido
        </button>
        <a
          href="/pedidos"
          className="rounded-lg px-4 py-2 text-sm font-medium text-tinta-2 ring-1 ring-borde transition-colors hover:bg-papel hover:text-tinta"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
```

(Los `bg-red-50`/`red-700`… quedan igual que en producto-form; la Task 5 los migra a variables `error-*` en todos los archivos a la vez.)

- [ ] **Step 2: Crear `app/(panel)/pedidos/nuevo/page.tsx`**

```tsx
import { prisma } from "@/lib/prisma";
import { crearPedido } from "@/lib/actions";
import { Encabezado } from "@/components/encabezado";
import { PedidoForm } from "@/components/pedido-form";

export default async function PaginaNuevoPedido({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const [clientes, productos] = await Promise.all([
    prisma.cliente.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, ciudad: true },
    }),
    prisma.producto.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, precio: true, stock: true },
    }),
  ]);

  return (
    <>
      <Encabezado
        titulo="Nuevo pedido"
        descripcion="Elegí el cliente y los productos; el stock se descuenta al crear."
      />
      <PedidoForm
        accion={crearPedido}
        clientes={clientes}
        productos={productos}
        error={error}
      />
    </>
  );
}
```

- [ ] **Step 3: Botón "Nuevo pedido" en el listado**

En `app/(panel)/pedidos/page.tsx`: agregar imports de `Plus` (sumarlo al import de lucide existente: `import { ChevronRight, Plus } from "lucide-react";`) y reemplazar el `<Encabezado …/>` autocerrado por:

```tsx
<Encabezado
  titulo="Pedidos"
  descripcion="Seguí cada pedido desde que entra hasta que se entrega."
>
  <Link
    href="/pedidos/nuevo"
    className="inline-flex items-center gap-1.5 rounded-lg bg-marca-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-marca-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600"
  >
    <Plus className="size-4" />
    Nuevo pedido
  </Link>
</Encabezado>
```

- [ ] **Step 4: Build**

Run: `npm run build 2>&1 | tail -5`
Expected: build exitoso; la ruta `/pedidos/nuevo` aparece como dinámica (ƒ).

- [ ] **Step 5: Preparar datos y servidor para e2e**

```bash
npx prisma db seed
PORT=3111 npm start   # en background; esperar "Ready"
```

- [ ] **Step 6: Escribir y correr el e2e de alta de pedidos**

Crear `$SCRATCH/e2e-pedidos.js` (correrlo con `cd` en la raíz del repo para que resuelva `@prisma/client` y `playwright-core` desde el scratchpad — usar rutas absolutas en los `require` si hace falta):

```js
const { chromium } = require("$SCRATCH/node_modules/playwright-core");
const { PrismaClient } = require("@prisma/client");
const assert = require("node:assert");

const BASE = "http://localhost:3111";
const prisma = new PrismaClient();

(async () => {
  const dulce = await prisma.producto.findUnique({ where: { sku: "DDL-003" } });
  const miel = await prisma.producto.findUnique({ where: { sku: "MIE-004" } });
  const aceite = await prisma.producto.findUnique({ where: { sku: "ACE-005" } }); // stock 5
  const maxAntes = (await prisma.pedido.aggregate({ _max: { numero: true } }))._max.numero;

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();

  // --- Caso feliz: 2 items ---
  await page.goto(BASE + "/pedidos");
  await page.getByRole("link", { name: "Nuevo pedido" }).click();
  await page.waitForURL("**/pedidos/nuevo");
  await page.getByLabel("Cliente").selectOption({ index: 1 });
  await page.getByLabel("Producto").selectOption(String(dulce.id));
  await page.getByLabel("Cantidad").fill("2");
  await page.getByRole("button", { name: "Agregar producto" }).click();
  await page.getByLabel("Producto").nth(1).selectOption(String(miel.id));
  await page.getByLabel("Cantidad").nth(1).fill("3");
  await page.getByRole("button", { name: "Crear pedido" }).click();
  await page.waitForURL(/\/pedidos\/\d+$/);

  const nuevo = await prisma.pedido.findFirst({
    orderBy: { numero: "desc" },
    include: { items: true },
  });
  assert.equal(nuevo.numero, maxAntes + 1, "numero correlativo");
  assert.equal(nuevo.estado, "PENDIENTE");
  assert.equal(nuevo.total, 2 * dulce.precio + 3 * miel.precio, "total server-side");
  assert.equal(nuevo.items.length, 2);
  const dulceDespues = await prisma.producto.findUnique({ where: { id: dulce.id } });
  const mielDespues = await prisma.producto.findUnique({ where: { id: miel.id } });
  assert.equal(dulceDespues.stock, dulce.stock - 2, "stock descontado (dulce)");
  assert.equal(mielDespues.stock, miel.stock - 3, "stock descontado (miel)");

  // --- Stock insuficiente ---
  await page.goto(BASE + "/pedidos/nuevo");
  await page.getByLabel("Cliente").selectOption({ index: 1 });
  await page.getByLabel("Producto").selectOption(String(aceite.id));
  await page.getByLabel("Cantidad").fill("999");
  await page.getByRole("button", { name: "Crear pedido" }).click();
  await page.waitForURL("**/pedidos/nuevo?error=stock");
  assert.ok(await page.locator('p[role="alert"]').isVisible(), "alerta visible");
  const aceiteDespues = await prisma.producto.findUnique({ where: { id: aceite.id } });
  assert.equal(aceiteDespues.stock, aceite.stock, "stock intacto tras rechazo");

  console.log("e2e pedidos: OK");
  await browser.close();
  await prisma.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

Run: `DATABASE_URL="file:/Users/rpeak/repos/vendra/prisma/dev.db" node $SCRATCH/e2e-pedidos.js`
Expected: `e2e pedidos: OK`

- [ ] **Step 7: Matar el server, restaurar seed y commitear**

```bash
npx prisma db seed
git add components/pedido-form.tsx "app/(panel)/pedidos/nuevo/page.tsx" "app/(panel)/pedidos/page.tsx"
git commit -m "Alta de pedidos: formulario con items dinámicos y botón en el listado"
```

---

### Task 3: Tokens de tema con `light-dark()` + anti-flash

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: contrato de tema para las Tasks 4–6: `<html>` sin `data-theme` = sigue al sistema; `data-theme="oscuro"` / `"claro"` = forzado. Clave de localStorage: `tema`, valores `"claro"` | `"oscuro"`. Todos los tokens `--color-*` resuelven solos vía `light-dark()`.

- [ ] **Step 1: Reescribir la paleta en `app/globals.css`**

Reemplazar el bloque `@theme` completo y las reglas de `body`/`::selection` por:

```css
@import "tailwindcss";

@theme {
  --font-sans: var(--font-instrument), system-ui, sans-serif;
  --font-display: var(--font-sora), var(--font-instrument), system-ui, sans-serif;

  /* Papel cálido + tinta verdosa (claro) / verde-negruzco (oscuro) */
  --color-papel: light-dark(#f5f4ef, #101613);
  --color-carta: light-dark(#ffffff, #17211b);
  --color-tinta: light-dark(#1a2421, #e7ece8);
  --color-tinta-2: light-dark(#5b6660, #a6b0a8);
  --color-tinta-3: light-dark(#879088, #7d887f);
  --color-borde: light-dark(#e7e5dc, #29342c);

  /* Verde petróleo, el color de Vendra */
  --color-marca-50: light-dark(#f0f8f4, #152e24);
  --color-marca-100: light-dark(#dcefe6, #cde8da);
  --color-marca-200: #b5dfcc;
  --color-marca-600: light-dark(#0b8c68, #16a37c);
  --color-marca-700: light-dark(#0e6b50, #11845f);
  --color-marca-800: light-dark(#10493a, #9bd4ba);
  --color-marca-900: #0f3931;
  --color-marca-950: light-dark(#0b241f, #0a1d18);

  /* Alertas de stock */
  --color-alerta: light-dark(#b45309, #e0913c);
  --color-alerta-suave: light-dark(#fdf3e0, #362510);
}

/* Sin elección guardada manda el sistema; data-theme la pisa. */
html {
  color-scheme: light;
}
html[data-theme="oscuro"] {
  color-scheme: dark;
}
@media (prefers-color-scheme: dark) {
  html:not([data-theme="claro"]) {
    color-scheme: dark;
  }
}

body {
  background: var(--color-papel);
  color: var(--color-tinta);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

::selection {
  background: var(--color-marca-200);
  color: #0f3931;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Notas: `marca-100` queda clara en ambos temas (solo se usa como texto sobre fondos oscuros); `marca-200` y `marca-900` no cambian; `marca-800` flipea a claro porque solo se usa como texto sobre tints `marca-50`. `::selection` fija el color de texto porque en oscuro la tinta clara no se leería sobre el verde claro.

- [ ] **Step 2: Script anti-flash en `app/layout.tsx`**

Como primer hijo de `<body>` (antes de `{children}`):

```tsx
<body className="min-h-screen">
  <script
    // Aplica el tema guardado antes del primer paint para evitar flash
    dangerouslySetInnerHTML={{
      __html:
        'try{var t=localStorage.getItem("tema");if(t==="claro"||t==="oscuro")document.documentElement.dataset.theme=t}catch(e){}',
    }}
  />
  {children}
</body>
```

- [ ] **Step 3: Build y chequeo visual rápido**

Run: `npm run build 2>&1 | tail -3` → exitoso.

Script `$SCRATCH/e2e-tema-base.js` (server en 3111 como en Task 2):

```js
const { chromium } = require("$SCRATCH/node_modules/playwright-core");
const assert = require("node:assert");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  for (const [esquema, esperado] of [
    ["light", "rgb(245, 244, 239)"], // #f5f4ef
    ["dark", "rgb(16, 22, 19)"], // #101613
  ]) {
    const ctx = await browser.newContext({ colorScheme: esquema });
    const page = await ctx.newPage();
    await page.goto("http://localhost:3111/");
    const fondo = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    assert.equal(fondo, esperado, `fondo en ${esquema}`);
    await ctx.close();
  }
  console.log("tema base: OK");
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

Run: `node $SCRATCH/e2e-tema-base.js`
Expected: `tema base: OK`

- [ ] **Step 4: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "Modo oscuro: tokens light-dark() y script anti-flash"
```

---

### Task 4: Toggle de tema en el sidebar

**Files:**
- Create: `components/tema-toggle.tsx`
- Modify: `components/sidebar.tsx`

**Interfaces:**
- Consumes: contrato de tema de Task 3 (`data-theme`, localStorage `tema`).
- Produces: `TemaToggle()` — client component, botón sol/luna.

- [ ] **Step 1: Crear `components/tema-toggle.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Tema = "claro" | "oscuro";

function temaEfectivo(): Tema {
  const forzado = document.documentElement.dataset.theme;
  if (forzado === "claro" || forzado === "oscuro") return forzado;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro";
}

export function TemaToggle() {
  // Arranca en null para que el HTML del server coincida en la hidratación
  const [tema, setTema] = useState<Tema | null>(null);

  useEffect(() => {
    setTema(temaEfectivo());
  }, []);

  function alternar() {
    const nuevo: Tema = temaEfectivo() === "oscuro" ? "claro" : "oscuro";
    document.documentElement.dataset.theme = nuevo;
    try {
      localStorage.setItem("tema", nuevo);
    } catch {}
    setTema(nuevo);
  }

  const etiqueta =
    tema === "oscuro" ? "Cambiar a modo claro" : "Cambiar a modo oscuro";

  return (
    <button
      type="button"
      onClick={alternar}
      title={etiqueta}
      className="rounded-md p-1.5 text-marca-200/70 hover:bg-white/5 hover:text-white"
    >
      {tema === "oscuro" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      <span className="sr-only">{etiqueta}</span>
    </button>
  );
}
```

- [ ] **Step 2: Integrarlo al sidebar**

En `components/sidebar.tsx`, importar `import { TemaToggle } from "./tema-toggle";` y:

1. Escritorio — en el bloque del pie (`<div className="border-t border-white/10 pt-4">`), junto al link de "Cerrar sesión", envolver ambos en un contenedor para que queden juntos. Reemplazar el `<Link href="/login" …>…</Link>` por:

```tsx
<span className="flex items-center gap-0.5">
  <TemaToggle />
  <Link
    href="/login"
    title="Cerrar sesión"
    className="rounded-md p-1.5 text-marca-200/70 hover:bg-white/5 hover:text-white"
  >
    <LogOut className="size-4" />
    <span className="sr-only">Cerrar sesión</span>
  </Link>
</span>
```

2. Móvil — en el `<header>`, después del `<nav>` de íconos, agregar `<TemaToggle />` como último elemento (queda a la derecha de la navegación).

- [ ] **Step 3: e2e del toggle**

Script `$SCRATCH/e2e-tema-toggle.js` (server en 3111, `npm run build && PORT=3111 npm start` con el código nuevo):

```js
const { chromium } = require("$SCRATCH/node_modules/playwright-core");
const assert = require("node:assert");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ colorScheme: "light" });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3111/");

  // Sistema claro → el botón ofrece pasar a oscuro
  await page
    .locator("aside")
    .getByRole("button", { name: "Cambiar a modo oscuro" })
    .click();
  assert.equal(
    await page.evaluate(() => document.documentElement.dataset.theme),
    "oscuro",
  );
  assert.equal(
    await page.evaluate(() => localStorage.getItem("tema")),
    "oscuro",
  );
  assert.equal(
    await page.evaluate(() => getComputedStyle(document.body).backgroundColor),
    "rgb(16, 22, 19)",
  );

  // Persiste tras recargar (sin flash: lo aplica el script inline)
  await page.reload();
  assert.equal(
    await page.evaluate(() => document.documentElement.dataset.theme),
    "oscuro",
  );
  assert.equal(
    await page.evaluate(() => getComputedStyle(document.body).backgroundColor),
    "rgb(16, 22, 19)",
  );

  // Vuelta a claro
  await page
    .locator("aside")
    .getByRole("button", { name: "Cambiar a modo claro" })
    .click();
  assert.equal(
    await page.evaluate(() => getComputedStyle(document.body).backgroundColor),
    "rgb(245, 244, 239)",
  );

  console.log("toggle: OK");
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

Run: `node $SCRATCH/e2e-tema-toggle.js`
Expected: `toggle: OK`

- [ ] **Step 4: Commit**

```bash
git add components/tema-toggle.tsx components/sidebar.tsx
git commit -m "Modo oscuro: toggle sol/luna en el sidebar con persistencia"
```

---

### Task 5: Chips de estado y de error a variables de tema

**Files:**
- Modify: `app/globals.css` (agregar tokens al `@theme`)
- Modify: `lib/estados.ts`
- Modify: `components/estado-badge.tsx`
- Modify: `app/(panel)/pedidos/[id]/page.tsx` (línea ~117)
- Modify: `components/producto-form.tsx` (línea ~42), `components/pedido-form.tsx` (chip de error y hovers rojos), `app/(panel)/productos/page.tsx` (línea ~43), `components/boton-eliminar.tsx` (línea ~27)
- Modify: `app/(panel)/clientes/page.tsx` (línea ~81)

**Interfaces:**
- Consumes: infraestructura de tema de Task 3.
- Produces: tokens `--color-error{,-suave,-texto,-borde}` y por estado `--color-<estado>{,-suave,-texto}` (`pendiente`, `preparacion`, `enviado`, `entregado`); `ESTADO_INFO[estado].punto` pasa de hex a clase Tailwind (`"bg-pendiente"`, …).

- [ ] **Step 1: Agregar tokens al `@theme` de `app/globals.css`**

```css
  /* Errores de formularios y acciones destructivas */
  --color-error: light-dark(#b91c1c, #f0938a);
  --color-error-suave: light-dark(#fef2f2, #391716);
  --color-error-texto: light-dark(#991b1b, #f2b3ac);
  --color-error-borde: light-dark(#fecaca, #6b2420);

  /* Chips de estado de pedidos */
  --color-pendiente: light-dark(#d97706, #e5a33c);
  --color-pendiente-suave: light-dark(#fdf3e0, #33270e);
  --color-pendiente-texto: light-dark(#8a4b04, #efc689);
  --color-preparacion: light-dark(#0e7dc1, #4aa8dd);
  --color-preparacion-suave: light-dark(#e8f3fb, #102a3a);
  --color-preparacion-texto: light-dark(#0b5d90, #93cdf0);
  --color-enviado: light-dark(#6d28d9, #a583ec);
  --color-enviado-suave: light-dark(#f1ecfb, #241b3d);
  --color-enviado-texto: light-dark(#5b21b6, #c9b6f2);
  --color-entregado: light-dark(#0a9455, #33bd7f);
  --color-entregado-suave: light-dark(#e6f6ee, #0e3020);
  --color-entregado-texto: light-dark(#076b3e, #86d9ad);
```

- [ ] **Step 2: `lib/estados.ts` — `punto` pasa a clase y `chip` a tokens**

Reemplazar el bloque `ESTADO_INFO` por:

```ts
export const ESTADO_INFO: Record<
  Estado,
  { etiqueta: string; punto: string; chip: string }
> = {
  PENDIENTE: {
    etiqueta: "Pendiente",
    punto: "bg-pendiente",
    chip: "bg-pendiente-suave text-pendiente-texto ring-pendiente/25",
  },
  EN_PREPARACION: {
    etiqueta: "En preparación",
    punto: "bg-preparacion",
    chip: "bg-preparacion-suave text-preparacion-texto ring-preparacion/25",
  },
  ENVIADO: {
    etiqueta: "Enviado",
    punto: "bg-enviado",
    chip: "bg-enviado-suave text-enviado-texto ring-enviado/25",
  },
  ENTREGADO: {
    etiqueta: "Entregado",
    punto: "bg-entregado",
    chip: "bg-entregado-suave text-entregado-texto ring-entregado/25",
  },
};
```

- [ ] **Step 3: Actualizar los dos usos de `punto` como estilo inline**

`components/estado-badge.tsx`:

```tsx
<span className={`size-1.5 rounded-full ${info.punto}`} aria-hidden />
```

`app/(panel)/pedidos/[id]/page.tsx` (~117): mismo cambio — quitar `style={{ background: info.punto }}` y sumar `info.punto` al `className` del span del punto.

- [ ] **Step 4: Migrar los rojos a tokens `error-*`**

- `components/producto-form.tsx`, `components/pedido-form.tsx`, `app/(panel)/productos/page.tsx` — chips de alerta: `bg-red-50 … text-red-800 ring-1 ring-red-200` → `bg-error-suave … text-error-texto ring-1 ring-error-borde`.
- `components/boton-eliminar.tsx` y el botón "Quitar producto" de `components/pedido-form.tsx`: `hover:bg-red-50 hover:text-red-700` → `hover:bg-error-suave hover:text-error`.
- NO tocar `app/(panel)/page.tsx:97` (`bg-red-400/20 text-red-200`): está sobre la tarjeta verde oscura del hero, que es oscura en ambos temas.

- [ ] **Step 5: Avatar de clientes**

`app/(panel)/clientes/page.tsx` (~81): `bg-marca-100 text-marca-800` → `bg-marca-50 text-marca-800` (marca-100 queda reservada como texto claro; marca-50 es el tint que flipea).

- [ ] **Step 6: Build + vistazo**

Run: `npm run build 2>&1 | tail -3` → exitoso.
Con el server en 3111: en claro, `/pedidos` se ve idéntico a antes (mismos colores); en oscuro (contexto `colorScheme: "dark"`), los chips son tints oscuros con texto claro.

- [ ] **Step 7: Commit**

```bash
git add app/globals.css lib/estados.ts components/estado-badge.tsx components/producto-form.tsx components/pedido-form.tsx components/boton-eliminar.tsx "app/(panel)/pedidos/[id]/page.tsx" "app/(panel)/productos/page.tsx" "app/(panel)/clientes/page.tsx"
git commit -m "Modo oscuro: chips de estado y de error con tokens de tema"
```

---

### Task 6: Gráfico de ventas a variables + pasada visual completa

**Files:**
- Modify: `components/ventas-chart.tsx`

**Interfaces:**
- Consumes: tokens de Task 3.

- [ ] **Step 1: Reemplazar los hex de `components/ventas-chart.tsx`**

| Antes | Después |
| --- | --- |
| `stopColor="#0b8c68"` (×2) | `stopColor="var(--color-marca-600)"` |
| `stroke="#e7e5dc"` (grilla) | `stroke="var(--color-borde)"` |
| `axisLine={{ stroke: "#d5d3c9" }}` | `axisLine={{ stroke: "var(--color-borde)" }}` |
| `tick={{ fill: "#879088", … }}` (×2) | `tick={{ fill: "var(--color-tinta-3)", … }}` |
| `cursor={{ stroke: "#b5dfcc", … }}` | `cursor={{ stroke: "var(--color-marca-200)", … }}` |
| `stroke="#0b8c68"` (Area) | `stroke="var(--color-marca-600)"` |
| `activeDot={{ r: 4, fill: "#0b8c68", stroke: "#ffffff", … }}` | `activeDot={{ r: 4, fill: "var(--color-marca-600)", stroke: "var(--color-carta)", … }}` |

- [ ] **Step 2: Screenshots claro/oscuro de todo**

`npm run build && PORT=3111 npm start`, luego `$SCRATCH/screenshots-temas.js`:

```js
const { chromium } = require("$SCRATCH/node_modules/playwright-core");

const RUTAS = ["/", "/pedidos", "/pedidos/nuevo", "/clientes", "/productos", "/login"];

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  for (const esquema of ["light", "dark"]) {
    const ctx = await browser.newContext({
      colorScheme: esquema,
      viewport: { width: 1440, height: 900 },
    });
    const page = await ctx.newPage();
    for (const ruta of RUTAS) {
      await page.goto("http://localhost:3111" + ruta, { waitUntil: "networkidle" });
      if (ruta === "/") await page.waitForTimeout(2000); // animación del gráfico
      const nombre = (ruta === "/" ? "panel" : ruta.slice(1).replace(/\//g, "-"));
      await page.screenshot({
        path: `$SCRATCH/cap-${esquema}-${nombre}.png`,
        fullPage: true,
      });
    }
    await ctx.close();
  }
  console.log("screenshots listos");
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 3: Revisar las 12 capturas con la herramienta Read**

Checklist por captura oscura: fondo verde-negruzco (no gris ni claro), texto legible, chips de estado como tints oscuros, gráfico con grilla/ejes visibles, tarjetas `carta` distinguibles del fondo, sidebar apenas más oscuro que el contenido, login coherente. En claro: idéntico a como estaba antes de este trabajo (sin regresiones).

- [ ] **Step 4: Retocar solo lo que se vea mal**

Si algún valor oscuro no funciona (contraste pobre, tint demasiado brillante), ajustar el hex correspondiente en `app/globals.css` y re-capturar esa página. No tocar valores del tema claro.

- [ ] **Step 5: Commit**

```bash
git add components/ventas-chart.tsx app/globals.css
git commit -m "Modo oscuro: gráfico de ventas con variables de tema"
```

---

### Task 7: Verificación final

**Files:** ninguno nuevo (solo fixes si algo falla).

- [ ] **Step 1: Lint y build limpios**

Run: `npm run lint` → 0 errores (el warning preexistente en `.remember/` no cuenta). `npm run build` → exitoso.

- [ ] **Step 2: Re-correr los tres e2e contra un build fresco**

```bash
npx prisma db seed
npm run build && PORT=3111 npm start   # background
DATABASE_URL="file:/Users/rpeak/repos/vendra/prisma/dev.db" node $SCRATCH/e2e-pedidos.js
node $SCRATCH/e2e-tema-base.js
node $SCRATCH/e2e-tema-toggle.js
```

Expected: `e2e pedidos: OK`, `tema base: OK`, `toggle: OK`.

- [ ] **Step 3: Restaurar datos demo y cerrar**

```bash
npx prisma db seed
```

Matar el server. Si quedó algún ajuste sin commitear, commitearlo. NO pushear sin confirmación del usuario.
