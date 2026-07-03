import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { moneda } from "@/lib/format";
import { Encabezado } from "@/components/encabezado";

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function PaginaClientes({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const consulta = q?.trim() ?? "";

  const clientes = await prisma.cliente.findMany({
    where: consulta
      ? {
          OR: [
            { nombre: { contains: consulta } },
            { email: { contains: consulta } },
            { ciudad: { contains: consulta } },
          ],
        }
      : undefined,
    orderBy: { nombre: "asc" },
    include: { pedidos: { select: { total: true } } },
  });

  return (
    <>
      <Encabezado
        titulo="Clientes"
        descripcion="Tu cartera de clientes y cuánto compra cada uno."
      >
        <form action="/clientes" className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tinta-3" />
          <input
            type="search"
            name="q"
            defaultValue={consulta}
            placeholder="Buscar por nombre, email o ciudad"
            className="w-72 rounded-lg bg-carta py-2 pl-9 pr-3 text-sm text-tinta ring-1 ring-borde placeholder:text-tinta-3 focus:outline-2 focus:outline-marca-600"
          />
        </form>
      </Encabezado>

      <div className="overflow-x-auto rounded-2xl bg-carta ring-1 ring-borde">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-borde text-xs uppercase tracking-wide text-tinta-3">
              <th className="px-6 py-3.5 font-medium">Cliente</th>
              <th className="px-4 py-3.5 font-medium">Ubicación</th>
              <th className="px-4 py-3.5 font-medium">Teléfono</th>
              <th className="px-4 py-3.5 text-right font-medium">Pedidos</th>
              <th className="px-4 py-3.5 text-right font-medium">Total comprado</th>
              <th className="px-4 py-3.5"><span className="sr-only">Ver detalle</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {clientes.map((cliente) => {
              const totalComprado = cliente.pedidos.reduce(
                (suma, p) => suma + p.total,
                0,
              );
              return (
                <tr key={cliente.id} className="transition-colors hover:bg-papel/60">
                  <td className="px-6 py-3.5">
                    <Link
                      href={`/clientes/${cliente.id}`}
                      className="flex items-center gap-3"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-marca-100 text-xs font-semibold text-marca-800">
                        {iniciales(cliente.nombre)}
                      </span>
                      <span>
                        <span className="block font-medium text-tinta hover:text-marca-700">
                          {cliente.nombre}
                        </span>
                        <span className="block text-xs text-tinta-3">
                          {cliente.email}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-tinta-2">
                    {cliente.ciudad}, {cliente.provincia}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-tinta-2">
                    {cliente.telefono}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-tinta-2">
                    {cliente.pedidos.length}
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium tabular-nums text-tinta">
                    {moneda(totalComprado)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/clientes/${cliente.id}`}
                      className="inline-flex rounded-md p-1.5 text-tinta-3 hover:bg-papel hover:text-tinta"
                      title={`Ver ${cliente.nombre}`}
                    >
                      <ChevronRight className="size-4" />
                      <span className="sr-only">Ver {cliente.nombre}</span>
                    </Link>
                  </td>
                </tr>
              );
            })}
            {clientes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-tinta-2">
                  No encontramos clientes para “{consulta}”. Probá con otro término.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
