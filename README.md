<div align="center">

# Vendra

**Sistema de gestión de pedidos e inventario optimizado para rendimiento**

[![Live Demo](https://img.shields.io/badge/🌐_Demo_en_vivo-vendra.lykos.com.ar-6366f1?style=for-the-badge)](https://vendra.lykos.com.ar/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2d3748?style=for-the-badge&logo=prisma)](https://prisma.io)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ed?style=for-the-badge&logo=docker&logoColor=white)](https://ghcr.io/lykos-software-solutions/vendra)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
[![CI](https://github.com/Lykos-Software-Solutions/vendra/actions/workflows/ci.yml/badge.svg)](https://github.com/Lykos-Software-Solutions/vendra/actions/workflows/ci.yml)

> Demo showcase desarrollado por [Lykos - Performance-Driven Web Solutions](https://lykos.com.ar).
> La pantalla de login tiene autenticación básica para el demo. Credenciales: **`vendra2026`**

</div>

---

## 🌐 English Summary

**Vendra** is an open-source order and inventory management dashboard for small and medium businesses (SMBs). Built as a demo/portfolio showcase by [Lykos - Performance-Driven Web Solutions](https://lykos.com.ar).

**Features:** order tracking with status workflow, customer directory with order history, product catalog with stock alerts, and a sales dashboard with charts.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Prisma · SQLite · Recharts

**Live demo:** [vendra.lykos.com.ar](https://vendra.lykos.com.ar/) — pre-seeded with realistic Argentine business data (15 products, 20 customers, 60 orders over 3 months).

---

## ✨ Funcionalidades

- **📊 Panel general** — ventas del mes con variación contra el mes anterior, pedidos pendientes, alertas de stock bajo y gráfico de ventas de los últimos 30 días.
- **📦 Pedidos** — listado con filtros por estado (`PENDIENTE`, `EN_PREPARACION`, `ENVIADO`, `ENTREGADO`), vista de detalle con los productos y cambio de estado con un clic.
- **👥 Clientes** — directorio con búsqueda por nombre, email o ciudad, y ficha con historial completo de compras.
- **🏷️ Productos** — alta, edición y baja con control de stock y alerta visual cuando el stock llega al mínimo configurado.

---

## 🛠️ Stack

| Tecnología | Uso |
|---|---|
| [Next.js 16](https://nextjs.org) (App Router) | Framework web + Server Actions |
| [TypeScript](https://www.typescriptlang.org) | Tipado estático |
| [Tailwind CSS v4](https://tailwindcss.com) | Estilos |
| [Prisma](https://prisma.io) + SQLite | Base de datos |
| [Recharts](https://recharts.org) | Gráfico de ventas |
| [Lucide](https://lucide.dev) | Íconos |

---

## 🚀 Cómo correrlo localmente

**Requisitos:** Node.js 20+

```bash
# 1. Clonar e instalar
git clone https://github.com/Lykos-Software-Solutions/vendra.git
cd vendra
npm install

# 2. Configurar entorno
cp .env.example .env

# 3. Crear la base y cargar datos de ejemplo
npm run db:setup

# 4. Levantar el servidor de desarrollo
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). El seed carga **15 productos, 20 clientes y 60 pedidos** distribuidos en los últimos 3 meses.

---

## 🐳 Docker

```bash
docker run -p 3000:3000 \
  -v vendra-data:/app/data \
  -e DATABASE_URL=file:/app/data/vendra.db \
  ghcr.io/lykos-software-solutions/vendra:latest
```

Al arrancar, el contenedor aplica las migraciones y ejecuta el seed **solo si la base está vacía**, así el demo siempre levanta con datos sin pisarlos en cada reinicio.

---

## ☁️ Deploy con Dokploy / Docker Compose

El repo incluye un `Dockerfile` pensado para Dokploy (build type **Dockerfile**).

| Qué | Valor |
|---|---|
| Variable de entorno | `DATABASE_URL=file:/app/data/vendra.db` |
| Volumen (mount) | `/app/data` |
| Puerto expuesto | `3000` |

---

## 📁 Estructura

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

---

## 🤝 Contribuciones

Este es un proyecto de demostración de [Lykos - Performance-Driven Web Solutions](https://lykos.com.ar). Leé [CONTRIBUTING.md](CONTRIBUTING.md) antes de abrir un PR.

¿Querés una versión con autenticación real, pagos, multi-sucursal o integración con WhatsApp? **[hola@lykos.com.ar](mailto:hola@lykos.com.ar)**

---

## 📄 Licencia

[MIT](LICENSE) — © 2025 [Lykos - Performance-Driven Web Solutions](https://lykos.com.ar)
