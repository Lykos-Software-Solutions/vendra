"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { moneda, monedaCompacta } from "@/lib/format";

export type PuntoVenta = {
  dia: string;
  total: number;
  pedidos: number;
};

function TooltipVentas({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: PuntoVenta }[];
}) {
  if (!active || !payload?.length) return null;
  const punto = payload[0].payload;
  return (
    <div className="rounded-lg border border-borde bg-carta px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-tinta-2">{punto.dia}</p>
      <p className="font-display text-sm font-semibold text-tinta">
        {moneda(punto.total)}
      </p>
      <p className="text-xs text-tinta-3">
        {punto.pedidos === 1 ? "1 pedido" : `${punto.pedidos} pedidos`}
      </p>
    </div>
  );
}

export function VentasChart({ datos }: { datos: PuntoVenta[] }) {
  return (
    <div className="h-72 w-full" role="img" aria-label="Ventas por día de los últimos 30 días">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={datos} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="relleno-ventas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-marca-600)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--color-marca-600)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--color-borde)" strokeWidth={1} />
          <XAxis
            dataKey="dia"
            tickLine={false}
            axisLine={{ stroke: "var(--color-borde)" }}
            tick={{ fill: "var(--color-tinta-3)", fontSize: 12 }}
            interval={4}
            tickMargin={8}
          />
          <YAxis
            width={56}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-tinta-3)", fontSize: 12 }}
            tickFormatter={(valor: number) => monedaCompacta(valor)}
          />
          <Tooltip
            content={<TooltipVentas />}
            cursor={{ stroke: "var(--color-marca-200)", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="var(--color-marca-600)"
            strokeWidth={2}
            fill="url(#relleno-ventas)"
            dot={false}
            activeDot={{ r: 4, fill: "var(--color-marca-600)", stroke: "var(--color-carta)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
