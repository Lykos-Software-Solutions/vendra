# Gate de autenticación real

Fecha: 2026-07-06 · Estado: aprobado

Reemplaza el login decorativo de Vendra por autenticación real, replicando el
mecanismo de Solvia (`~/repos/solvia`: `lib/auth.ts`, `lib/adminGuard.ts`,
`middleware.ts`, `app/login/actions.ts`), con nombres en castellano
consistentes con el resto de Vendra.

## Mecanismo (réplica de Solvia)

### `lib/auth.ts` — núcleo agnóstico del runtime

Sin imports de `next/headers` ni `next/navigation`, solo Web Crypto
(`crypto.subtle`): usable desde el middleware (edge) y desde server
components/actions (node).

- Cookie **`vendra_sesion`**, token `"<expiraMs>.<hmac>"` con HMAC-SHA256 en
  hex. TTL **7 días**.
- `SESSION_SECRET` firma la cookie; si no está definida, **fallback a
  `ADMIN_PASSWORD`** (así rotar una no invalida la otra cuando ambas existen).
- **Fail-closed**: `gateActivo()` devuelve `true` SIEMPRE en producción
  (`NODE_ENV === "production"`); sin `ADMIN_PASSWORD` configurada, ningún
  login puede pasar y nadie entra. En desarrollo, activo solo si hay
  contraseña configurada (el dev diario y los e2e existentes quedan abiertos).
- Comparaciones en **tiempo constante** (`safeEqual` por XOR de charCodes),
  tanto para la firma como para la contraseña.
- Exporta: `COOKIE_NAME`, `SESSION_MAX_AGE_SECONDS`, `gateActivo()`,
  `crearTokenSesion()` (null si no hay secreto), `verificarTokenSesion(token)`,
  `passwordCoincide(input)`.

### `lib/guard.ts` — server-only

Importa `next/headers` / `next/navigation`:

- `haySesion(): Promise<boolean>` — si el gate no está activo, `true`; si no,
  verifica la cookie.
- `protegerPagina()` — para server components: `redirect("/login")` si no hay
  sesión.
- `exigirSesion()` — para server actions: `throw new Error("No autorizado")`
  (las actions se pueden invocar por POST directo; el middleware no alcanza).

### `middleware.ts` (raíz del repo)

Si `gateActivo()` y no hay token válido → redirect a `/login?from=<pathname>`.
Matcher **negativo** para que rutas futuras nazcan protegidas:

```ts
export const config = {
  matcher: ["/((?!login|_next/static|_next/image|icon.svg|favicon.ico).*)"],
};
```

## Defensa en profundidad

El middleware es la primera capa; el re-chequeo va en cada punto que lee o
modifica datos:

- **Páginas** (9): `app/(panel)/page.tsx`, `pedidos/page.tsx`,
  `pedidos/[id]/page.tsx`, `pedidos/nuevo/page.tsx`, `clientes/page.tsx`,
  `clientes/[id]/page.tsx`, `productos/page.tsx`, `productos/nuevo/page.tsx`,
  `productos/[id]/editar/page.tsx` — cada una llama `await protegerPagina()`
  antes de consultar Prisma. (El guard va en páginas, no en el layout, porque
  el layout no protege con renderizado parcial.)
- **Server actions** (5): `cambiarEstado`, `crearProducto`,
  `actualizarProducto`, `eliminarProducto`, `crearPedido` en `lib/actions.ts`
  — primera línea: `await exigirSesion()`.

## Login y logout

### `app/login/actions.ts` — `ingresar(formData)`

1. Lee `password` y `from`.
2. `destinoSeguro(from)`: solo rutas internas (empieza con `/`, no con `//`);
   si no, `/`.
3. Contraseña incorrecta (o gate sin contraseña) → redirect
   `/login?error=1` (+ `from` preservado).
4. OK → `crearTokenSesion()`, cookie `httpOnly`, `sameSite: "lax"`,
   `secure` en producción, `path: "/"`, `maxAge` 7 días → redirect al destino.

### `salir()` en `lib/actions.ts`

Borra la cookie y redirige a `/login`. El link "Cerrar sesión" del sidebar
(escritorio) pasa de `<Link href="/login">` a un `<form action={salir}>` con
el mismo ícono y estilos.

### `app/login/page.tsx` — form real con branding intacto

- Se mantienen el panel de marca verde, el copy y el layout actual.
- Form: **solo campo contraseña** (`name="password"`, requerido) + hidden
  `from` (de `searchParams`). Botón "Ingresar".
- `?error=1` → `p[role="alert"]` con "Contraseña incorrecta." (clases
  `error-*` del sistema de tokens).
- Hint demo visible bajo el form: la credencial demo publicada
  (`vendra2026`), estilo discreto (`bg-papel`, borde, `text-tinta-2`).
- Desaparecen: los `defaultValue` decorativos, el campo email y el texto "la
  autenticación es decorativa".
- Si ya hay sesión, `/login` redirige al panel (`/`).

## Credenciales demo (públicas a propósito)

La contraseña demo es **`vendra2026`** y se publica en el portfolio, README y
el hint del login. Es una decisión consciente de demo: el gate existe para
mostrar el mecanismo, no para custodiar datos reales.

## Documentación

- **`.env.example`**: `ADMIN_PASSWORD` y `SESSION_SECRET` comentadas, con
  nota del fallback y del fail-closed en producción.
- **README**: sección "Acceso" (credencial demo, cómo funciona el gate, que
  en dev sin `ADMIN_PASSWORD` queda abierto) + dos filas en la tabla de
  Dokploy (`ADMIN_PASSWORD=vendra2026` requerida, `SESSION_SECRET`
  recomendada).

## Fuera de alcance

- Usuarios múltiples, registro, roles, rate limiting del login, expiración
  deslizante. Un solo acceso por contraseña, como Solvia.

## Verificación

- `npm run build` y `npm run lint` limpios.
- e2e existentes (`e2e-pedidos`, `e2e-tema-base`, `e2e-tema-toggle`) siguen
  verdes en dev sin `ADMIN_PASSWORD` (gate inactivo).
- e2e nuevo `e2e-auth.js` contra build de producción con
  `ADMIN_PASSWORD=vendra2026`:
  1. `/pedidos` sin sesión → redirect a `/login?from=%2Fpedidos`.
  2. Contraseña incorrecta → `/login?error=1` con alerta visible.
  3. Contraseña correcta → entra y respeta `from` (aterriza en `/pedidos`).
  4. Cookie adulterada (editar un carácter del valor) → vuelta al login.
  5. Logout desde el sidebar → cookie borrada, `/` redirige a login.
  6. `/login` con sesión activa → redirige al panel.
