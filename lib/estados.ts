export const ESTADOS = [
  "PENDIENTE",
  "EN_PREPARACION",
  "ENVIADO",
  "ENTREGADO",
] as const;

export type Estado = (typeof ESTADOS)[number];

export const ESTADO_INFO: Record<
  Estado,
  { etiqueta: string; punto: string; chip: string }
> = {
  PENDIENTE: {
    etiqueta: "Pendiente",
    punto: "#d97706",
    chip: "bg-[#fdf3e0] text-[#8a4b04] ring-[#d97706]/25",
  },
  EN_PREPARACION: {
    etiqueta: "En preparación",
    punto: "#0e7dc1",
    chip: "bg-[#e8f3fb] text-[#0b5d90] ring-[#0e7dc1]/25",
  },
  ENVIADO: {
    etiqueta: "Enviado",
    punto: "#6d28d9",
    chip: "bg-[#f1ecfb] text-[#5b21b6] ring-[#6d28d9]/25",
  },
  ENTREGADO: {
    etiqueta: "Entregado",
    punto: "#0a9455",
    chip: "bg-[#e6f6ee] text-[#076b3e] ring-[#0a9455]/25",
  },
};

export function esEstado(valor: string): valor is Estado {
  return (ESTADOS as readonly string[]).includes(valor);
}

// Mapeo de los valores usados en la URL (?estado=pendiente) al valor en la base
export const FILTROS_ESTADO: Record<string, Estado> = {
  pendiente: "PENDIENTE",
  "en-preparacion": "EN_PREPARACION",
  enviado: "ENVIADO",
  entregado: "ENTREGADO",
};
