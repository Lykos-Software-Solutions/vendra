import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { moneda, fechaHora } from "@/lib/format";
import { ESTADOS, ESTADO_INFO, type Estado } from "@/lib/estados";
import { cambiarEstado } from "@/lib/actions";
import { EstadoBadge } from "@/components/estado-badge";

export default async function PaginaPedido({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pedidoId = Number(id);
  if (!Number.isInteger(pedidoId)) notFound();

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: {
      cliente: true,
      items: { include: { producto: true } },
    },
  });
  if (!pedido) notFound();

  return (
    <>
      <Link
        href="/pedidos"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-tinta-2 hover:text-tinta"
      >
        <ArrowLeft className="size-4" />
        Volver a pedidos
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight text-tinta">
          Pedido #{pedido.numero}
        </h1>
        <EstadoBadge estado={pedido.estado as Estado} />
        <p className="w-full text-sm text-tinta-2 sm:w-auto">
          Ingresó el {fechaHora(pedido.fecha)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Detalle de productos */}
        <div className="overflow-x-auto rounded-2xl bg-carta ring-1 ring-borde lg:col-span-2">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-borde text-xs uppercase tracking-wide text-tinta-3">
                <th className="px-6 py-3.5 font-medium">Producto</th>
                <th className="px-4 py-3.5 text-right font-medium">Cantidad</th>
                <th className="px-4 py-3.5 text-right font-medium">Precio unit.</th>
                <th className="px-6 py-3.5 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borde">
              {pedido.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-3.5">
                    <p className="font-medium text-tinta">{item.producto.nombre}</p>
                    <p className="text-xs text-tinta-3">{item.producto.sku}</p>
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-tinta-2">
                    {item.cantidad}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-tinta-2">
                    {moneda(item.precioUnitario)}
                  </td>
                  <td className="px-6 py-3.5 text-right font-medium tabular-nums text-tinta">
                    {moneda(item.cantidad * item.precioUnitario)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-borde">
                <td colSpan={3} className="px-6 py-4 text-right font-medium text-tinta-2">
                  Total del pedido
                </td>
                <td className="px-6 py-4 text-right font-display text-lg font-bold tabular-nums text-tinta">
                  {moneda(pedido.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex flex-col gap-4">
          {/* Cambio de estado */}
          <div className="rounded-2xl bg-carta p-5 ring-1 ring-borde">
            <h2 className="font-display text-sm font-semibold text-tinta">
              Estado del pedido
            </h2>
            <div className="mt-3 flex flex-col gap-1.5">
              {ESTADOS.map((estado) => {
                const actual = estado === pedido.estado;
                const info = ESTADO_INFO[estado];
                return (
                  <form key={estado} action={cambiarEstado}>
                    <input type="hidden" name="pedidoId" value={pedido.id} />
                    <input type="hidden" name="estado" value={estado} />
                    <button
                      type="submit"
                      disabled={actual}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium ring-1 transition-colors ${
                        actual
                          ? "bg-marca-50 text-tinta ring-marca-600/40"
                          : "bg-carta text-tinta-2 ring-borde hover:bg-papel hover:text-tinta"
                      }`}
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{ background: info.punto }}
                        aria-hidden
                      />
                      <span className="flex-1">{info.etiqueta}</span>
                      {actual && <Check className="size-4 text-marca-700" />}
                    </button>
                  </form>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-tinta-3">
              Tocá un estado para actualizar el pedido.
            </p>
          </div>

          {/* Cliente */}
          <div className="rounded-2xl bg-carta p-5 ring-1 ring-borde">
            <h2 className="font-display text-sm font-semibold text-tinta">Cliente</h2>
            <Link
              href={`/clientes/${pedido.cliente.id}`}
              className="mt-2 block font-medium text-marca-700 hover:text-marca-600"
            >
              {pedido.cliente.nombre}
            </Link>
            <dl className="mt-2 space-y-1 text-sm text-tinta-2">
              <div>
                <dt className="sr-only">Ubicación</dt>
                <dd>
                  {pedido.cliente.ciudad}, {pedido.cliente.provincia}
                </dd>
              </div>
              <div>
                <dt className="sr-only">Email</dt>
                <dd>{pedido.cliente.email}</dd>
              </div>
              <div>
                <dt className="sr-only">Teléfono</dt>
                <dd>{pedido.cliente.telefono}</dd>
              </div>
            </dl>
          </div>

          {/* Notas */}
          {pedido.notas && (
            <div className="rounded-2xl bg-carta p-5 ring-1 ring-borde">
              <h2 className="font-display text-sm font-semibold text-tinta">Notas</h2>
              <p className="mt-2 text-sm text-tinta-2">{pedido.notas}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
