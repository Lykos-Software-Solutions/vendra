import { ESTADO_INFO, type Estado } from "@/lib/estados";

export function EstadoBadge({ estado }: { estado: Estado }) {
  const info = ESTADO_INFO[estado];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${info.chip}`}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ background: info.punto }}
        aria-hidden
      />
      {info.etiqueta}
    </span>
  );
}
