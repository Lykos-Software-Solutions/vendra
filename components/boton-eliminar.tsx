"use client";

import { Trash2 } from "lucide-react";

export function BotonEliminar({
  accion,
  id,
  nombre,
}: {
  accion: (formData: FormData) => void;
  id: number;
  nombre: string;
}) {
  return (
    <form
      action={accion}
      onSubmit={(e) => {
        if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        title={`Eliminar ${nombre}`}
        className="rounded-md p-2 text-tinta-3 transition-colors hover:bg-error-suave hover:text-error"
      >
        <Trash2 className="size-4" />
        <span className="sr-only">Eliminar {nombre}</span>
      </button>
    </form>
  );
}
