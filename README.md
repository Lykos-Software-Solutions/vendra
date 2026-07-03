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
