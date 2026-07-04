# Vendra

Sistema de gestión de pedidos para pymes. Un panel único para seguir las ventas,
los pedidos, los clientes y el stock, pensado para negocios que hoy manejan todo
con planillas.

> Proyecto de demostración con datos de ejemplo en español rioplatense. La
> pantalla de login es decorativa: no hay autenticación real.

## Funcionalidades

- **Panel general**: ventas del mes con variación contra el mes anterior,
  pedidos pendientes, alertas de stock bajo y gráfico de ventas de los últimos
  30 días.
- **Pedidos**: listado con filtros por estado (pendiente, en preparación,
  enviado, entregado), vista de detalle con los productos del pedido y cambio de
  estado con un clic.
- **Clientes**: listado con búsqueda por nombre, email o ciudad, y ficha de cada
  cliente con su historial de pedidos.
- **Productos**: alta, edición y baja de productos con control de stock y alerta
  visual cuando la cantidad queda en el mínimo o por debajo.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4
- [Prisma](https://www.prisma.io) + SQLite
- [Recharts](https://recharts.org) para el gráfico de ventas
- [Lucide](https://lucide.dev) para los íconos

## Cómo correrlo localmente

Requisitos: Node.js 20 o superior.

```bash
# 1. Clonar e instalar dependencias
git clone https://github.com/<tu-usuario>/vendra.git
cd vendra
npm install

# 2. Configurar el entorno
cp .env.example .env

# 3. Crear la base SQLite y cargar los datos de ejemplo
npx prisma migrate dev
npx prisma db seed

# 4. Levantar el servidor de desarrollo
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). Podés entrar directo al
panel o pasar por [el login decorativo](http://localhost:3000/login).

El seed carga 15 productos, 20 clientes y 60 pedidos distribuidos en los últimos
3 meses, así el panel se ve poblado desde el primer arranque. Para regenerar los
datos en cualquier momento: `npx prisma db seed`.

## Deploy con Docker / Dokploy

El repo incluye un `Dockerfile` pensado para Dokploy (build type **Dockerfile**).
En el arranque, `npm run start:prod` aplica las migraciones con
`prisma migrate deploy` y ejecuta el seed **solo si la base está vacía**, así el
demo siempre levanta con datos sin pisarlos en cada reinicio.

Configuración necesaria en Dokploy:

| Qué | Valor |
| --- | --- |
| Variable de entorno | `DATABASE_URL=file:/app/data/vendra.db` |
| Volumen (mount) | montar un volumen en `/app/data` |
| Puerto expuesto | `3000` |

El volumen en `/app/data` persiste la base SQLite entre deploys y reinicios; sin
él, la base se regenera (migraciones + seed) en cada arranque y se pierde
cualquier cambio hecho desde la app.

Notas:

- `prisma generate` corre en el build de la imagen (script `postinstall` y
  también en `npm run build`).
- La imagen conserva las dependencias de desarrollo porque el arranque usa la
  CLI de Prisma y `tsx` para el seed; es una elección deliberada de simplicidad
  para un demo.
- Si en vez del Dockerfile se usa Nixpacks, alcanza con configurar el comando de
  inicio como `npm run start:prod`.

## Estructura

```
app/
  (panel)/          Layout con sidebar y las cuatro secciones
    page.tsx        Panel general (métricas + gráfico)
    pedidos/        Listado con filtros y detalle con cambio de estado
    clientes/       Listado con búsqueda y ficha con historial
    productos/      CRUD con control de stock
  login/            Pantalla de acceso decorativa
components/         Sidebar, gráfico de ventas, badges y formularios
lib/                Cliente de Prisma, acciones de servidor y formateo es-AR
prisma/             Schema, migraciones y seed con datos realistas
```
