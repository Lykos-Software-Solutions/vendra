import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { moneda, fechaHora, fechaLarga } from "@/lib/format";
import type { Estado } from "@/lib/estados";
import { EstadoBadge } from "@/components/estado-badge";

export default async function PaginaCliente({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clienteId = Number(id);
  if (!Number.isInteger(clienteId)) notFound();

  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    include: {
      pedidos: {
        orderBy: { fecha: "desc" },
        include: { _count: { select: { items: true } } },
      },
    },
  });
  if (!cliente) notFound();

  const totalComprado = cliente.pedidos.reduce((suma, p) => suma + p.total, 0);
  const ultimoPedido = cliente.pedidos[0];

  return (
    <>
      <Link
        href="/clientes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-tinta-2 hover:text-tinta"
      >
        <ArrowLeft className="size-4" />
        Volver a clientes
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-tinta">
          {cliente.nombre}
        </h1>
        <p className="mt-1 text-sm text-tinta-2">
          {cliente.ciudad}, {cliente.provincia} · {cliente.email} ·{" "}
          {cliente.telefono} · CUIT {cliente.cuit}
        </p>
      </div>

      <section className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-carta p-5 ring-1 ring-borde">
          <p className="text-sm text-tinta-2">Total comprado</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-tinta">
            {moneda(totalComprado)}
          </p>
        </div>
        <div className="rounded-2xl bg-carta p-5 ring-1 ring-borde">
          <p className="text-sm text-tinta-2">Pedidos realizados</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-tinta">
            {cliente.pedidos.length}
          </p>
        </div>
        <div className="rounded-2xl bg-carta p-5 ring-1 ring-borde">
          <p className="text-sm text-tinta-2">Último pedido</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-tinta">
            {ultimoPedido ? fechaLarga(ultimoPedido.fecha) : "—"}
          </p>
        </div>
      </section>

      <div className="overflow-x-auto rounded-2xl bg-carta ring-1 ring-borde">
        <div className="px-6 pt-5">
          <h2 className="font-display text-base font-semibold text-tinta">
            Historial de pedidos
          </h2>
        </div>
        <table className="mt-3 w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-borde text-xs uppercase tracking-wide text-tinta-3">
              <th className="px-6 py-3 font-medium">Pedido</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 text-right font-medium">Productos</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3"><span className="sr-only">Ver detalle</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {cliente.pedidos.map((pedido) => (
              <tr key={pedido.id} className="transition-colors hover:bg-papel/60">
                <td className="px-6 py-3.5">
                  <Link
                    href={`/pedidos/${pedido.id}`}
                    className="font-semibold text-tinta hover:text-marca-700"
                  >
                    #{pedido.numero}
                  </Link>
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap text-tinta-2">
                  {fechaHora(pedido.fecha)}
                </td>
                <td className="px-4 py-3.5 text-right tabular-nums text-tinta-2">
                  {pedido._count.items}
                </td>
                <td className="px-4 py-3.5 text-right font-medium tabular-nums text-tinta">
                  {moneda(pedido.total)}
                </td>
                <td className="px-4 py-3.5">
                  <EstadoBadge estado={pedido.estado as Estado} />
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Link
                    href={`/pedidos/${pedido.id}`}
                    className="inline-flex rounded-md p-1.5 text-tinta-3 hover:bg-papel hover:text-tinta"
                    title={`Ver pedido #${pedido.numero}`}
                  >
                    <ChevronRight className="size-4" />
                    <span className="sr-only">Ver pedido #{pedido.numero}</span>
                  </Link>
                </td>
              </tr>
            ))}
            {cliente.pedidos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-tinta-2">
                  Este cliente todavía no hizo pedidos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
