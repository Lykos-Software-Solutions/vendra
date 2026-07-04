"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { moneda } from "@/lib/format";

const MENSAJES_ERROR: Record<string, string> = {
  datos:
    "Revisá los datos: elegí un cliente y al menos un producto con cantidad válida.",
  stock: "No hay stock suficiente para alguno de los productos del pedido.",
};

const claseCampo =
  "rounded-lg bg-carta px-3 py-2 text-sm text-tinta ring-1 ring-borde placeholder:text-tinta-3 focus:outline-2 focus:outline-marca-600";

export type ClienteOpcion = { id: number; nombre: string; ciudad: string };
export type ProductoOpcion = {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
};

type Fila = { clave: number; productoId: string; cantidad: string };

export function PedidoForm({
  accion,
  clientes,
  productos,
  error,
}: {
  accion: (formData: FormData) => void;
  clientes: ClienteOpcion[];
  productos: ProductoOpcion[];
  error?: string;
}) {
  const [filas, setFilas] = useState<Fila[]>([
    { clave: 0, productoId: "", cantidad: "1" },
  ]);
  const [proximaClave, setProximaClave] = useState(1);

  const porId = new Map(productos.map((p) => [String(p.id), p]));
  const total = filas.reduce((suma, fila) => {
    const producto = porId.get(fila.productoId);
    const cantidad = Number(fila.cantidad);
    if (!producto || !Number.isInteger(cantidad) || cantidad <= 0) return suma;
    return suma + producto.precio * cantidad;
  }, 0);

  function actualizarFila(clave: number, cambios: Partial<Fila>) {
    setFilas((prev) =>
      prev.map((f) => (f.clave === clave ? { ...f, ...cambios } : f)),
    );
  }

  function agregarFila() {
    setFilas((prev) => [
      ...prev,
      { clave: proximaClave, productoId: "", cantidad: "1" },
    ]);
    setProximaClave((n) => n + 1);
  }

  function quitarFila(clave: number) {
    setFilas((prev) =>
      prev.length > 1 ? prev.filter((f) => f.clave !== clave) : prev,
    );
  }

  return (
    <form
      action={accion}
      className="max-w-2xl rounded-2xl bg-carta p-6 ring-1 ring-borde"
    >
      {error && MENSAJES_ERROR[error] && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-error-suave px-4 py-3 text-sm text-error-texto ring-1 ring-error-borde"
        >
          {MENSAJES_ERROR[error]}
        </p>
      )}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-tinta">
          Cliente
        </span>
        <select
          name="clienteId"
          required
          defaultValue=""
          className={`${claseCampo} w-full`}
        >
          <option value="" disabled>
            Elegí un cliente…
          </option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre} · {c.ciudad}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="mt-5">
        <legend className="mb-1.5 text-sm font-medium text-tinta">
          Productos
        </legend>
        <div className="flex flex-col gap-2">
          {filas.map((fila) => (
            <div key={fila.clave} className="flex items-center gap-2">
              <select
                name="productoId"
                required
                value={fila.productoId}
                onChange={(e) =>
                  actualizarFila(fila.clave, { productoId: e.target.value })
                }
                aria-label="Producto"
                className={`${claseCampo} min-w-0 flex-1`}
              >
                <option value="" disabled>
                  Elegí un producto…
                </option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.stock === 0}>
                    {p.nombre} · {moneda(p.precio)}
                    {p.stock === 0 ? " · sin stock" : ` · ${p.stock} disp.`}
                  </option>
                ))}
              </select>
              <input
                type="number"
                name="cantidad"
                required
                min="1"
                step="1"
                value={fila.cantidad}
                onChange={(e) =>
                  actualizarFila(fila.clave, { cantidad: e.target.value })
                }
                aria-label="Cantidad"
                className={`${claseCampo} w-24 shrink-0`}
              />
              <button
                type="button"
                onClick={() => quitarFila(fila.clave)}
                disabled={filas.length === 1}
                title="Quitar producto"
                className="rounded-md p-2 text-tinta-3 transition-colors hover:bg-error-suave hover:text-error disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-tinta-3"
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Quitar producto</span>
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={agregarFila}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-marca-700 ring-1 ring-borde transition-colors hover:bg-marca-50"
        >
          <Plus className="size-4" />
          Agregar producto
        </button>
      </fieldset>

      <label className="mt-5 block">
        <span className="mb-1.5 block text-sm font-medium text-tinta">
          Notas <span className="font-normal text-tinta-3">(opcional)</span>
        </span>
        <textarea
          name="notas"
          rows={2}
          placeholder="Ej.: Entregar por la mañana."
          className={`${claseCampo} w-full`}
        />
      </label>

      <div className="mt-5 flex items-center justify-between rounded-lg bg-papel px-4 py-3">
        <span className="text-sm font-medium text-tinta-2">Total estimado</span>
        <span className="font-display text-lg font-bold tabular-nums text-tinta">
          {moneda(total)}
        </span>
      </div>
      <p className="mt-2 text-xs text-tinta-3">
        El total final se calcula al confirmar, con los precios vigentes. El
        stock se descuenta al crear el pedido.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          className="rounded-lg bg-marca-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-marca-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600"
        >
          Crear pedido
        </button>
        <a
          href="/pedidos"
          className="rounded-lg px-4 py-2 text-sm font-medium text-tinta-2 ring-1 ring-borde transition-colors hover:bg-papel hover:text-tinta"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
