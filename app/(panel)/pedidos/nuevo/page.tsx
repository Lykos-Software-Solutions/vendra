import { prisma } from "@/lib/prisma";
import { crearPedido } from "@/lib/actions";
import { Encabezado } from "@/components/encabezado";
import { PedidoForm } from "@/components/pedido-form";

export default async function PaginaNuevoPedido({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const [clientes, productos] = await Promise.all([
    prisma.cliente.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, ciudad: true },
    }),
    prisma.producto.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, precio: true, stock: true },
    }),
  ]);

  return (
    <>
      <Encabezado
        titulo="Nuevo pedido"
        descripcion="Elegí el cliente y los productos; el stock se descuenta al crear."
      />
      <PedidoForm
        accion={crearPedido}
        clientes={clientes}
        productos={productos}
        error={error}
      />
    </>
  );
}
