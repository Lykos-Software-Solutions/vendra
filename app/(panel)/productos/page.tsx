import Link from "next/link";
import { Pencil, Plus, TriangleAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { moneda } from "@/lib/format";
import { eliminarProducto } from "@/lib/actions";
import { Encabezado } from "@/components/encabezado";
import { BotonEliminar } from "@/components/boton-eliminar";

export default async function PaginaProductos({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const productos = await prisma.producto.findMany({
    orderBy: { nombre: "asc" },
  });
  const bajos = productos.filter((p) => p.stock <= p.stockMinimo).length;

  return (
    <>
      <Encabezado
        titulo="Productos"
        descripcion={
          bajos > 0
            ? `${productos.length} productos en catálogo · ${bajos} con stock bajo`
            : `${productos.length} productos en catálogo`
        }
      >
        <Link
          href="/productos/nuevo"
          className="inline-flex items-center gap-1.5 rounded-lg bg-marca-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-marca-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600"
        >
          <Plus className="size-4" />
          Nuevo producto
        </Link>
      </Encabezado>

      {error === "en-uso" && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200"
        >
          No se puede eliminar ese producto porque tiene pedidos asociados.
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl bg-carta ring-1 ring-borde">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-borde text-xs uppercase tracking-wide text-tinta-3">
              <th className="px-6 py-3.5 font-medium">Producto</th>
              <th className="px-4 py-3.5 font-medium">Categoría</th>
              <th className="px-4 py-3.5 text-right font-medium">Precio</th>
              <th className="px-4 py-3.5 text-right font-medium">Stock</th>
              <th className="px-4 py-3.5 font-medium">Disponibilidad</th>
              <th className="px-4 py-3.5"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {productos.map((producto) => {
              const bajo = producto.stock <= producto.stockMinimo;
              return (
                <tr key={producto.id} className="transition-colors hover:bg-papel/60">
                  <td className="px-6 py-3.5">
                    <p className="font-medium text-tinta">{producto.nombre}</p>
                    <p className="text-xs text-tinta-3">{producto.sku}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-full bg-papel px-2.5 py-1 text-xs font-medium text-tinta-2">
                      {producto.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium tabular-nums text-tinta">
                    {moneda(producto.precio)}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums">
                    <span className={bajo ? "font-semibold text-alerta" : "text-tinta"}>
                      {producto.stock} u
                    </span>
                    <span className="block text-xs text-tinta-3">
                      mín. {producto.stockMinimo}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {bajo ? (
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-alerta-suave px-2.5 py-1 text-xs font-medium text-alerta ring-1 ring-inset ring-alerta/25">
                        <TriangleAlert className="size-3.5" />
                        Stock bajo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-marca-50 px-2.5 py-1 text-xs font-medium text-marca-800 ring-1 ring-inset ring-marca-600/20">
                        <span className="size-1.5 rounded-full bg-marca-600" aria-hidden />
                        En stock
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/productos/${producto.id}/editar`}
                        title={`Editar ${producto.nombre}`}
                        className="rounded-md p-2 text-tinta-3 transition-colors hover:bg-papel hover:text-tinta"
                      >
                        <Pencil className="size-4" />
                        <span className="sr-only">Editar {producto.nombre}</span>
                      </Link>
                      <BotonEliminar
                        accion={eliminarProducto}
                        id={producto.id}
                        nombre={producto.nombre}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
