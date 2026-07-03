import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { actualizarProducto } from "@/lib/actions";
import { Encabezado } from "@/components/encabezado";
import { ProductoForm } from "@/components/producto-form";

export default async function PaginaEditarProducto({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const productoId = Number(id);
  if (!Number.isInteger(productoId)) notFound();

  const producto = await prisma.producto.findUnique({ where: { id: productoId } });
  if (!producto) notFound();

  return (
    <>
      <Link
        href="/productos"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-tinta-2 hover:text-tinta"
      >
        <ArrowLeft className="size-4" />
        Volver a productos
      </Link>
      <Encabezado
        titulo={`Editar ${producto.nombre}`}
        descripcion={`SKU ${producto.sku}`}
      />
      <ProductoForm
        accion={actualizarProducto}
        producto={producto}
        error={error}
        textoBoton="Guardar cambios"
      />
    </>
  );
}
