import type { Producto } from "@prisma/client";

const MENSAJES_ERROR: Record<string, string> = {
  datos: "Revisá los datos: todos los campos son obligatorios y los números tienen que ser válidos.",
  sku: "Ya existe un producto con ese SKU. Usá un código distinto.",
};

const claseCampo =
  "w-full rounded-lg bg-carta px-3 py-2 text-sm text-tinta ring-1 ring-borde placeholder:text-tinta-3 focus:outline-2 focus:outline-marca-600";

function Campo({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-tinta">{etiqueta}</span>
      {children}
    </label>
  );
}

export function ProductoForm({
  accion,
  producto,
  error,
  textoBoton,
}: {
  accion: (formData: FormData) => void;
  producto?: Producto;
  error?: string;
  textoBoton: string;
}) {
  return (
    <form action={accion} className="max-w-xl rounded-2xl bg-carta p-6 ring-1 ring-borde">
      {error && MENSAJES_ERROR[error] && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-error-suave px-4 py-3 text-sm text-error-texto ring-1 ring-error-borde"
        >
          {MENSAJES_ERROR[error]}
        </p>
      )}

      {producto && <input type="hidden" name="id" value={producto.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Campo etiqueta="Nombre">
            <input
              type="text"
              name="nombre"
              required
              defaultValue={producto?.nombre}
              placeholder="Ej.: Yerba mate orgánica 1 kg"
              className={claseCampo}
            />
          </Campo>
        </div>

        <Campo etiqueta="SKU">
          <input
            type="text"
            name="sku"
            required
            defaultValue={producto?.sku}
            placeholder="Ej.: YER-001"
            className={`${claseCampo} uppercase`}
          />
        </Campo>

        <Campo etiqueta="Categoría">
          <input
            type="text"
            name="categoria"
            required
            defaultValue={producto?.categoria}
            placeholder="Ej.: Almacén"
            list="categorias-sugeridas"
            className={claseCampo}
          />
          <datalist id="categorias-sugeridas">
            <option value="Almacén" />
            <option value="Bebidas" />
            <option value="Dulces" />
            <option value="Infusiones" />
            <option value="Lácteos" />
          </datalist>
        </Campo>

        <Campo etiqueta="Precio (ARS)">
          <input
            type="number"
            name="precio"
            required
            min="1"
            step="0.01"
            defaultValue={producto?.precio}
            placeholder="Ej.: 8900"
            className={claseCampo}
          />
        </Campo>

        <div className="grid grid-cols-2 gap-4">
          <Campo etiqueta="Stock actual">
            <input
              type="number"
              name="stock"
              required
              min="0"
              step="1"
              defaultValue={producto?.stock}
              placeholder="0"
              className={claseCampo}
            />
          </Campo>
          <Campo etiqueta="Stock mínimo">
            <input
              type="number"
              name="stockMinimo"
              required
              min="0"
              step="1"
              defaultValue={producto?.stockMinimo}
              placeholder="0"
              className={claseCampo}
            />
          </Campo>
        </div>
      </div>

      <p className="mt-3 text-xs text-tinta-3">
        Cuando el stock actual queda en el mínimo o por debajo, el producto aparece
        con alerta en el panel.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          className="rounded-lg bg-marca-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-marca-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600"
        >
          {textoBoton}
        </button>
        <a
          href="/productos"
          className="rounded-lg px-4 py-2 text-sm font-medium text-tinta-2 ring-1 ring-borde transition-colors hover:bg-papel hover:text-tinta"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
