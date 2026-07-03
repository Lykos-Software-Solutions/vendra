import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { crearProducto } from "@/lib/actions";
import { Encabezado } from "@/components/encabezado";
import { ProductoForm } from "@/components/producto-form";

export default async function PaginaNuevoProducto({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

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
        titulo="Nuevo producto"
        descripcion="Sumá un producto al catálogo con su precio y control de stock."
      />
      <ProductoForm accion={crearProducto} error={error} textoBoton="Crear producto" />
    </>
  );
}
