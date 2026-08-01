"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Ponto = { dia: string; bruto: number; lucro: number };

export default function VendasChart({ dados }: { dados: Ponto[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dados} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#DBDFD9" vertical={false} />
          <XAxis dataKey="dia" tick={{ fontSize: 11, fontFamily: "IBM Plex Mono" }} />
          <YAxis tick={{ fontSize: 11, fontFamily: "IBM Plex Mono" }} />
          <Tooltip
            contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 12, borderRadius: 8 }}
          />
          <Line type="monotone" dataKey="bruto" name="Total bruto" stroke="#12233D" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="lucro" name="Lucro líquido" stroke="#1F7A5C" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
