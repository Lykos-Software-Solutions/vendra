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
    punto: "bg-pendiente",
    chip: "bg-pendiente-suave text-pendiente-texto ring-pendiente/25",
  },
  EN_PREPARACION: {
    etiqueta: "En preparación",
    punto: "bg-preparacion",
    chip: "bg-preparacion-suave text-preparacion-texto ring-preparacion/25",
  },
  ENVIADO: {
    etiqueta: "Enviado",
    punto: "bg-enviado",
    chip: "bg-enviado-suave text-enviado-texto ring-enviado/25",
  },
  ENTREGADO: {
    etiqueta: "Entregado",
    punto: "bg-entregado",
    chip: "bg-entregado-suave text-entregado-texto ring-entregado/25",
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
