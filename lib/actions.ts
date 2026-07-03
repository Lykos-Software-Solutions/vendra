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
