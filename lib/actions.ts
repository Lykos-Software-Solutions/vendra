"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { esEstado } from "./estados";

export async function cambiarEstado(formData: FormData) {
  const id = Number(formData.get("pedidoId"));
  const estado = String(formData.get("estado"));
  if (!Number.isInteger(id) || !esEstado(estado)) return;
  await prisma.pedido.update({ where: { id }, data: { estado } });
  revalidatePath("/", "layout");
}

function leerDatosProducto(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim().toUpperCase();
  const categoria = String(formData.get("categoria") ?? "").trim();
  const precio = Number(formData.get("precio"));
  const stock = Number(formData.get("stock"));
  const stockMinimo = Number(formData.get("stockMinimo"));

  const valido =
    nombre.length > 0 &&
    sku.length > 0 &&
    categoria.length > 0 &&
    Number.isFinite(precio) &&
    precio > 0 &&
    Number.isInteger(stock) &&
    stock >= 0 &&
    Number.isInteger(stockMinimo) &&
    stockMinimo >= 0;

  return valido ? { nombre, sku, categoria, precio, stock, stockMinimo } : null;
}

export async function crearProducto(formData: FormData) {
  const datos = leerDatosProducto(formData);
  if (!datos) redirect("/productos/nuevo?error=datos");

  let falloSku = false;
  try {
    await prisma.producto.create({ data: datos });
  } catch {
    falloSku = true;
  }
  if (falloSku) redirect("/productos/nuevo?error=sku");

  revalidatePath("/", "layout");
  redirect("/productos");
}

export async function actualizarProducto(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) redirect("/productos");

  const datos = leerDatosProducto(formData);
  if (!datos) redirect(`/productos/${id}/editar?error=datos`);

  let falloSku = false;
  try {
    await prisma.producto.update({ where: { id }, data: datos });
  } catch {
    falloSku = true;
  }
  if (falloSku) redirect(`/productos/${id}/editar?error=sku`);

  revalidatePath("/", "layout");
  redirect("/productos");
}

export async function eliminarProducto(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const enUso = await prisma.itemPedido.count({ where: { productoId: id } });
  if (enUso > 0) redirect("/productos?error=en-uso");

  await prisma.producto.delete({ where: { id } });
  revalidatePath("/", "layout");
  redirect("/productos");
}

export async function crearPedido(formData: FormData) {
  const clienteId = Number(formData.get("clienteId"));
  const notas = String(formData.get("notas") ?? "").trim();
  const productoIds = formData.getAll("productoId").map(Number);
  const cantidades = formData.getAll("cantidad").map(Number);

  const valido =
    Number.isInteger(clienteId) &&
    clienteId > 0 &&
    productoIds.length > 0 &&
    productoIds.length === cantidades.length &&
    productoIds.every((id) => Number.isInteger(id) && id > 0) &&
    cantidades.every((c) => Number.isInteger(c) && c > 0) &&
    new Set(productoIds).size === productoIds.length;
  if (!valido) redirect("/pedidos/nuevo?error=datos");

  // El total y los precios unitarios se calculan acá con los precios de la
  // base; lo que manda el cliente es solo informativo.
  let pedidoId = 0;
  let falla: "datos" | "stock" | null = null;
  try {
    pedidoId = await prisma.$transaction(async (tx) => {
      const [cliente, productos] = await Promise.all([
        tx.cliente.findUnique({ where: { id: clienteId } }),
        tx.producto.findMany({ where: { id: { in: productoIds } } }),
      ]);
      if (!cliente || productos.length !== productoIds.length) {
        throw new Error("datos");
      }

      const porId = new Map(productos.map((p) => [p.id, p]));
      const items = productoIds.map((id, i) => ({
        producto: porId.get(id)!,
        cantidad: cantidades[i],
      }));
      if (items.some((it) => it.cantidad > it.producto.stock)) {
        throw new Error("stock");
      }

      for (const it of items) {
        await tx.producto.update({
          where: { id: it.producto.id },
          data: { stock: { decrement: it.cantidad } },
        });
      }

      const ultimo = await tx.pedido.aggregate({ _max: { numero: true } });
      const pedido = await tx.pedido.create({
        data: {
          numero: (ultimo._max.numero ?? 1000) + 1,
          estado: "PENDIENTE",
          fecha: new Date(),
          total: items.reduce((s, it) => s + it.cantidad * it.producto.precio, 0),
          notas: notas || null,
          clienteId,
          items: {
            create: items.map((it) => ({
              productoId: it.producto.id,
              cantidad: it.cantidad,
              precioUnitario: it.producto.precio,
            })),
          },
        },
      });
      return pedido.id;
    });
  } catch (e) {
    const esperado = e instanceof Error && (e.message === "stock" || e.message === "datos");
    if (!esperado) console.error("crearPedido:", e);
    falla = e instanceof Error && e.message === "stock" ? "stock" : "datos";
  }
  if (falla) redirect(`/pedidos/nuevo?error=${falla}`);

  revalidatePath("/", "layout");
  redirect(`/pedidos/${pedidoId}`);
}
