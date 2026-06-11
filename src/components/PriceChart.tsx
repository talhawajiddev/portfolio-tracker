"use client";

import {
  Area,
  Bar,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { IntradayPoint } from "@/types/market";
import { compact, pkr, timePkt } from "./format";

interface Props {
  data: IntradayPoint[];
  positive: boolean;
}

export function PriceChart({ data, positive }: Props) {
  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-500 sm:h-64">
        No intraday data available
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: timePkt(d.time * 1000),
  }));

  const color = positive ? "#34d399" : "#fb7185";
  const maxVol = Math.max(...chartData.map((d) => d.volume), 1);

  return (
    <ResponsiveContainer width="100%" height={256}>
      <ComposedChart
        data={chartData}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" hide />
        <YAxis
          yAxisId="price"
          domain={["auto", "auto"]}
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          tickFormatter={(v) => Number(v).toFixed(0)}
          width={48}
        />
        <YAxis yAxisId="vol" orientation="right" hide domain={[0, maxVol * 4]} />
        <Tooltip
          contentStyle={{
            background: "#0f172a",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value, name) => {
            if (name === "volume") return [compact(Number(value)), "Volume"];
            return [pkr(Number(value)), "Price"];
          }}
          labelFormatter={(label) => String(label)}
        />
        <Bar
          yAxisId="vol"
          dataKey="volume"
          fill="rgba(148,163,184,0.15)"
          barSize={3}
        />
        <Area
          yAxisId="price"
          type="monotone"
          dataKey="price"
          stroke={color}
          fill="url(#priceFill)"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
