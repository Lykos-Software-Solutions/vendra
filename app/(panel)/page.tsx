import Link from "next/link";
import { ArrowRight, ArrowUpRight, ArrowDownRight, TriangleAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { moneda, fechaCorta, fechaLarga } from "@/lib/format";
import { EstadoBadge } from "@/components/estado-badge";
import { VentasChart, type PuntoVenta } from "@/components/ventas-chart";
import type { Estado } from "@/lib/estados";

export default async function PaginaPanel() {
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
  // Para que la comparación sea justa, se toma el mismo tramo del mes anterior
  const finPeriodoAnterior = new Date(
    inicioMesAnterior.getTime() + (ahora.getTime() - inicioMes.getTime()),
  );
  const nombreMesAnterior = new Intl.DateTimeFormat("es-AR", {
    month: "long",
  }).format(inicioMesAnterior);
  const hace30 = new Date(ahora);
  hace30.setDate(hace30.getDate() - 29);
  hace30.setHours(0, 0, 0, 0);

  const [mes, mesAnterior, pendientes, enPreparacion, productos, pedidos30, ultimos] =
    await Promise.all([
      prisma.pedido.aggregate({
        _sum: { total: true },
        _count: true,
        where: { fecha: { gte: inicioMes } },
      }),
      prisma.pedido.aggregate({
        _sum: { total: true },
        where: { fecha: { gte: inicioMesAnterior, lt: finPeriodoAnterior } },
      }),
      prisma.pedido.count({ where: { estado: "PENDIENTE" } }),
      prisma.pedido.count({ where: { estado: "EN_PREPARACION" } }),
      prisma.producto.findMany({ orderBy: { nombre: "asc" } }),
      prisma.pedido.findMany({
        where: { fecha: { gte: hace30 } },
        select: { fecha: true, total: true },
      }),
      prisma.pedido.findMany({
        take: 6,
        orderBy: { fecha: "desc" },
        include: { cliente: { select: { nombre: true } } },
      }),
    ]);

  const ventasMes = mes._sum.total ?? 0;
  const ventasMesAnterior = mesAnterior._sum.total ?? 0;
  const variacion =
    ventasMesAnterior > 0
      ? ((ventasMes - ventasMesAnterior) / ventasMesAnterior) * 100
      : null;

  const stockBajo = productos.filter((p) => p.stock <= p.stockMinimo);

  // Serie diaria de los últimos 30 días, con días sin ventas en cero
  const serie: PuntoVenta[] = [];
  for (let i = 0; i < 30; i++) {
    const dia = new Date(hace30);
    dia.setDate(dia.getDate() + i);
    const siguiente = new Date(dia);
    siguiente.setDate(siguiente.getDate() + 1);
    const delDia = pedidos30.filter((p) => p.fecha >= dia && p.fecha < siguiente);
    serie.push({
      dia: fechaCorta(dia),
      total: delDia.reduce((suma, p) => suma + p.total, 0),
      pedidos: delDia.length,
    });
  }
  const total30 = serie.reduce((suma, p) => suma + p.total, 0);

  return (
    <>
      <div className="mb-6">
        <p className="text-sm text-tinta-2">{fechaLarga(ahora)}</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-tinta">
          Panel general
        </h1>
      </div>

      {/* Métricas */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-marca-950 p-5 text-white">
          <p className="text-sm text-marca-200/80">Ventas del mes</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight">
            {moneda(ventasMes)}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-marca-200/80">
            {variacion !== null ? (
              <>
                <span
                  className={`inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                    variacion >= 0
                      ? "bg-marca-600/40 text-marca-100"
                      : "bg-red-400/20 text-red-200"
                  }`}
                >
                  {variacion >= 0 ? (
                    <ArrowUpRight className="size-3.5" />
                  ) : (
                    <ArrowDownRight className="size-3.5" />
                  )}
                  {Math.abs(variacion).toFixed(0)} %
                </span>
                vs. {nombreMesAnterior} a esta altura
              </>
            ) : (
              "sin datos del mes anterior"
            )}
          </p>
        </div>

        <div className="rounded-2xl bg-carta p-5 ring-1 ring-borde">
          <p className="text-sm text-tinta-2">Pedidos del mes</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight text-tinta">
            {mes._count}
          </p>
          <p className="mt-2 text-sm text-tinta-3">
            ticket promedio {mes._count > 0 ? moneda(ventasMes / mes._count) : "—"}
          </p>
        </div>

        <Link
          href="/pedidos?estado=pendiente"
          className="group rounded-2xl bg-carta p-5 ring-1 ring-borde transition-shadow hover:shadow-md"
        >
          <p className="text-sm text-tinta-2">Pedidos pendientes</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight text-tinta">
            {pendientes}
          </p>
          <p className="mt-2 flex items-center gap-1 text-sm text-tinta-3">
            {enPreparacion} en preparación
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </p>
        </Link>

        <Link
          href="/productos"
          className={`group rounded-2xl p-5 ring-1 transition-shadow hover:shadow-md ${
            stockBajo.length > 0
              ? "bg-alerta-suave ring-alerta/25"
              : "bg-carta ring-borde"
          }`}
        >
          <p className="flex items-center gap-1.5 text-sm text-tinta-2">
            {stockBajo.length > 0 && (
              <TriangleAlert className="size-4 text-alerta" />
            )}
            Stock bajo
          </p>
          <p
            className={`mt-2 font-display text-3xl font-bold tracking-tight ${
              stockBajo.length > 0 ? "text-alerta" : "text-tinta"
            }`}
          >
            {stockBajo.length}
          </p>
          <p className="mt-2 flex items-center gap-1 text-sm text-tinta-3">
            {stockBajo.length > 0
              ? "productos por reponer"
              : "todo por encima del mínimo"}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </p>
        </Link>
      </section>

      {/* Ventas de los últimos 30 días */}
      <section className="mt-4 rounded-2xl bg-carta p-6 ring-1 ring-borde">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-base font-semibold text-tinta">
            Ventas de los últimos 30 días
          </h2>
          <p className="text-sm text-tinta-2">
            <span className="font-display font-semibold text-tinta">
              {moneda(total30)}
            </span>{" "}
            en {pedidos30.length} pedidos
          </p>
        </div>
        <VentasChart datos={serie} />
      </section>

      {/* Últimos pedidos + stock bajo */}
      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="rounded-2xl bg-carta ring-1 ring-borde lg:col-span-3">
          <div className="flex items-center justify-between px-6 pt-5">
            <h2 className="font-display text-base font-semibold text-tinta">
              Últimos pedidos
            </h2>
            <Link
              href="/pedidos"
              className="text-sm font-medium text-marca-700 hover:text-marca-600"
            >
              Ver todos
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-borde px-2 pb-2">
            {ultimos.map((pedido) => (
              <li key={pedido.id}>
                <Link
                  href={`/pedidos/${pedido.id}`}
                  className="flex items-center gap-4 rounded-lg px-4 py-3 transition-colors hover:bg-papel"
                >
                  <span className="w-14 shrink-0 text-sm font-semibold text-tinta">
                    #{pedido.numero}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-tinta">
                      {pedido.cliente.nombre}
                    </span>
                    <span className="block text-xs text-tinta-3">
                      {fechaCorta(pedido.fecha)}
                    </span>
                  </span>
                  <span className="hidden text-sm font-medium tabular-nums text-tinta sm:block">
                    {moneda(pedido.total)}
                  </span>
                  <EstadoBadge estado={pedido.estado as Estado} />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-carta ring-1 ring-borde lg:col-span-2">
          <div className="flex items-center justify-between px-6 pt-5">
            <h2 className="font-display text-base font-semibold text-tinta">
              Stock por reponer
            </h2>
            <Link
              href="/productos"
              className="text-sm font-medium text-marca-700 hover:text-marca-600"
            >
              Ver productos
            </Link>
          </div>
          {stockBajo.length === 0 ? (
            <p className="px-6 py-8 text-sm text-tinta-2">
              Ningún producto está por debajo del mínimo. Buen trabajo.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-borde px-6 pb-5">
              {stockBajo.map((producto) => (
                <li key={producto.id} className="py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-medium text-tinta">
                      {producto.nombre}
                    </p>
                    <p className="shrink-0 text-sm tabular-nums text-alerta">
                      {producto.stock} u
                      <span className="text-tinta-3"> / mín. {producto.stockMinimo}</span>
                    </p>
                  </div>
                  <div
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-papel"
                    role="meter"
                    aria-valuemin={0}
                    aria-valuemax={producto.stockMinimo}
                    aria-valuenow={producto.stock}
                    aria-label={`Stock de ${producto.nombre}`}
                  >
                    <div
                      className="h-full rounded-full bg-alerta"
                      style={{
                        width: `${Math.min(100, (producto.stock / producto.stockMinimo) * 100)}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
