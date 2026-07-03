import type { ReactNode } from "react";

export function Encabezado({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-tinta">
          {titulo}
        </h1>
        {descripcion ? (
          <p className="mt-1 text-sm text-tinta-2">{descripcion}</p>
        ) : null}
      </div>
      {children ? <div className="flex items-center gap-3">{children}</div> : null}
    </div>
  );
}
