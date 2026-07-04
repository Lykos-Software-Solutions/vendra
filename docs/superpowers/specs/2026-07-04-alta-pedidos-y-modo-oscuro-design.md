# Alta de pedidos y modo oscuro

Fecha: 2026-07-04 · Estado: aprobado

Dos features independientes para Vendra (demo de gestión de pedidos, Next.js 16
App Router + Prisma/SQLite, UI en es-AR).

## 1. Alta de pedidos

### Objetivo

Poder crear pedidos desde la UI. Hoy solo existen el listado, el detalle y el
cambio de estado; los pedidos salen del seed.

### Decisión de producto

Crear un pedido **descuenta stock y valida que alcance**: si algún producto no
tiene stock suficiente, el alta se rechaza. Esto hace que las alertas de stock
del panel reflejen la operatoria real del demo.

### UI

- Botón **"Nuevo pedido"** en el encabezado del listado `/pedidos`, con el
  mismo estilo que "Nuevo producto" en `/productos`.
- Página **`/pedidos/nuevo`** (`app/(panel)/pedidos/nuevo/page.tsx`): server
  component que carga clientes (ordenados por nombre) y productos, y renderiza
  el formulario. Lee `?error=` para mostrar el aviso (patrón de productos, con
  `p[role="alert"]`).
- **`components/pedido-form.tsx`** (client component, molde `producto-form`):
  - Select de cliente (requerido).
  - Filas dinámicas de items: select de producto (muestra nombre, precio y
    stock disponible) + cantidad (entero ≥ 1). Botones para agregar y quitar
    filas; arranca con una fila; no se puede quitar la última.
  - Notas opcional (textarea).
  - Total estimado en vivo, calculado en el cliente con los precios recibidos
    como props (solo informativo).
  - Los items viajan como campos repetidos `productoId[]` / `cantidad[]` en el
    FormData.

### Server action `crearPedido` (en `lib/actions.ts`)

1. Lee `clienteId`, `notas` y los arrays `productoId[]` / `cantidad[]`.
2. Valida: cliente entero válido, ≥ 1 item, cada cantidad entera > 0, sin
   productos repetidos. Falla → `redirect("/pedidos/nuevo?error=datos")`.
3. En una **transacción** (`prisma.$transaction`):
   - Relee los productos de la base; el total y cada `precioUnitario` se
     calculan server-side con los precios actuales (nunca se confía en lo que
     manda el cliente).
   - Si el cliente no existe o falta algún producto → error de datos.
   - Si `cantidad > stock` en algún item → aborta; fuera de la transacción,
     `redirect("/pedidos/nuevo?error=stock")`.
   - Descuenta el stock de cada producto.
   - Crea el pedido: `numero = (max numero) + 1` (consultado dentro de la
     transacción), `estado = "PENDIENTE"`, `fecha = now`, items anidados.
4. `revalidatePath("/", "layout")` y `redirect(/pedidos/<id>)` al detalle.

Errores por querystring: `?error=datos` ("Revisá los datos del pedido") y
`?error=stock` ("No hay stock suficiente para alguno de los productos").

## 2. Modo oscuro

### Comportamiento

- Sin elección guardada, sigue `prefers-color-scheme` del sistema.
- Un botón sol/luna al pie del sidebar alterna claro ↔ oscuro sobre el tema
  efectivo y persiste la elección en `localStorage` (clave `tema`, valores
  `"claro"` / `"oscuro"`). No hay opción "volver al sistema" (YAGNI).

### Implementación

- **`app/globals.css`**: la paleta clara queda como está en `@theme`. La
  oscura redefine las mismas variables semánticas (`--color-papel`, `carta`,
  `tinta`, `tinta-2`, `tinta-3`, `borde`, `marca-*`, `alerta`,
  `alerta-suave`) en dos bloques equivalentes:
  - `html[data-theme="oscuro"]` (elección explícita), y
  - `@media (prefers-color-scheme: dark) { html:not([data-theme]) }`
    (preferencia del sistema).
  Los componentes no cambian: ya usan clases semánticas (`bg-carta`,
  `text-tinta`, `ring-borde`, …).
- **Paleta oscura**: mantiene la identidad verde petróleo — papel
  verde-negruzco (base `--color-marca-950`/#0b241f apagado, no gris neutro),
  carta apenas más clara que el papel, tintas claras con matiz verdoso, marca
  más luminosa para que los acentos contrasten sobre fondo oscuro,
  alerta-suave oscurecida. Contraste AA para texto normal.
- **Anti-flash**: script inline (`dangerouslySetInnerHTML`) en el `<head>` de
  `app/layout.tsx` que lee `localStorage.tema` y setea
  `document.documentElement.dataset.theme` antes del primer paint. También
  `color-scheme: light dark` para que los controles nativos acompañen.
- **`components/tema-toggle.tsx`** (client): ícono sol/luna (lucide), al pie
  del sidebar. Calcula el tema efectivo (dataset o media query), alterna y
  persiste. `aria-label` en castellano.
- **Ajustes puntuales**:
  - `components/ventas-chart.tsx`: los 8 hex hardcodeados pasan a
    `var(--color-…)` (gradiente, línea, ejes, grilla, tooltip — fondo del
    tooltip `#ffffff` → `var(--color-carta)`).
  - Revisión visual en oscuro de: badges de estado, chips de error `red-*`,
    login, sombras (`shadow-*`). Se ajusta solo lo que se vea mal.

## Fuera de alcance

- Edición/anulación de pedidos (y reposición de stock al anular).
- Autenticación real; multi-tema más allá de claro/oscuro.

## Verificación

- `npm run build` limpio y `npm run lint` sin errores nuevos.
- Playwright (patrón de la skill `verify`, Chrome del sistema):
  1. Crear un pedido con 2 items → redirige al detalle, total y cliente
     correctos; el stock de los productos bajó en `/productos`.
  2. Intentar un pedido con cantidad mayor al stock → `?error=stock` con el
     aviso visible.
  3. Screenshots claro/oscuro del panel, pedidos, `/pedidos/nuevo`, clientes,
     productos y login; sin flash al recargar con tema guardado.
- Al terminar: `npx prisma db seed` para restaurar los datos demo.
