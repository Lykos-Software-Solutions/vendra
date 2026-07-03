import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { moneda, fechaHora } from "@/lib/format";
import { ESTADO_INFO, FILTROS_ESTADO, type Estado } from "@/lib/estados";
import { EstadoBadge } from "@/components/estado-badge";
import { Encabezado } from "@/components/encabezado";

const TABS: { valor: string | null; etiqueta: string }[] = [
  { valor: null, etiqueta: "Todos" },
  { valor: "pendiente", etiqueta: "Pendientes" },
  { valor: "en-preparacion", etiqueta: "En preparación" },
  { valor: "enviado", etiqueta: "Enviados" },
  { valor: "entregado", etiqueta: "Entregados" },
];

export default async function PaginaPedidos({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado: filtro } = await searchParams;
  const estadoFiltrado: Estado | undefined = filtro
    ? FILTROS_ESTADO[filtro]
    : undefined;

  const [pedidos, grupos] = await Promise.all([
    prisma.pedido.findMany({
      where: estadoFiltrado ? { estado: estadoFiltrado } : undefined,
      orderBy: { fecha: "desc" },
      include: {
        cliente: { select: { nombre: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.pedido.groupBy({ by: ["estado"], _count: true }),
  ]);

  const totalPorEstado = new Map(grupos.map((g) => [g.estado, g._count]));
  const totalGeneral = grupos.reduce((suma, g) => suma + g._count, 0);

  return (
    <>
      <Encabezado
        titulo="Pedidos"
        descripcion="Seguí cada pedido desde que entra hasta que se entrega."
      />

      <nav className="mb-4 flex flex-wrap gap-2" aria-label="Filtrar por estado">
        {TABS.map((tab) => {
          const activo = (filtro ?? null) === tab.valor;
          const cantidad = tab.valor
            ? (totalPorEstado.get(FILTROS_ESTADO[tab.valor]) ?? 0)
            : totalGeneral;
          return (
            <Link
              key={tab.etiqueta}
              href={tab.valor ? `/pedidos?estado=${tab.valor}` : "/pedidos"}
              aria-current={activo ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition-colors ${
                activo
                  ? "bg-marca-950 text-white ring-marca-950"
                  : "bg-carta text-tinta-2 ring-borde hover:text-tinta"
              }`}
            >
              {tab.etiqueta}
              <span
                className={`rounded-full px-1.5 text-xs tabular-nums ${
                  activo ? "bg-white/15 text-marca-100" : "bg-papel text-tinta-3"
                }`}
              >
                {cantidad}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="overflow-x-auto rounded-2xl bg-carta ring-1 ring-borde">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-borde text-xs uppercase tracking-wide text-tinta-3">
              <th className="px-6 py-3.5 font-medium">Pedido</th>
              <th className="px-4 py-3.5 font-medium">Fecha</th>
              <th className="px-4 py-3.5 font-medium">Cliente</th>
              <th className="px-4 py-3.5 text-right font-medium">Productos</th>
              <th className="px-4 py-3.5 text-right font-medium">Total</th>
              <th className="px-4 py-3.5 font-medium">Estado</th>
              <th className="px-4 py-3.5"><span className="sr-only">Ver detalle</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {pedidos.map((pedido) => (
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
                <td className="px-4 py-3.5 font-medium text-tinta">
                  {pedido.cliente.nombre}
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
            {pedidos.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-tinta-2">
                  No hay pedidos{" "}
                  {estadoFiltrado
                    ? `con estado "${ESTADO_INFO[estadoFiltrado].etiqueta.toLowerCase()}"`
                    : "cargados"}
                  .
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
