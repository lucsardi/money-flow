import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import VendasChart from "./VendasChart";

function inicioFimDoMes(ref = new Date()) {
  const inicio = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const fim = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { inicio: fmt(inicio), fim: fmt(fim) };
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: empresa } = await supabase
    .from("empresas")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  const { inicio, fim } = inicioFimDoMes();

  const [{ data: vendas }, { data: gastos } = { data: [] } as any] = await Promise.all([
    supabase
      .from("vendas_diarias")
      .select("data, total_bruto, lucro_liquido")
      .eq("empresa_id", empresa!.id)
      .gte("data", inicio)
      .lte("data", fim)
      .order("data", { ascending: true }),
    supabase
      .from("gastos")
      .select("valor")
      .eq("empresa_id", empresa!.id)
      .gte("data_vencimento", inicio)
      .lte("data_vencimento", fim),
  ]);

  const totalBruto = vendas?.reduce((s, v) => s + Number(v.total_bruto), 0) ?? 0;
  const totalLucro = vendas?.reduce((s, v) => s + Number(v.lucro_liquido), 0) ?? 0;
  const totalGastos = gastos?.reduce((s: number, g: any) => s + Number(g.valor), 0) ?? 0;
  const lucroLiquidoMes = totalLucro - totalGastos;

  const dadosGrafico =
    vendas?.map((v) => ({
      dia: v.data.slice(8, 10),
      bruto: Number(v.total_bruto),
      lucro: Number(v.lucro_liquido),
    })) ?? [];

  const cartoes = [
    { label: "Total de entradas (mês)", valor: totalBruto, cor: "text-ink" },
    { label: "Total de saídas (mês)", valor: totalGastos, cor: "text-amber" },
    { label: "Lucro líquido (mês)", valor: lucroLiquidoMes, cor: "text-emerald" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold mb-1">Resumo do mês</h1>
        <p className="text-sm text-ink/60">
          {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cartoes.map((c) => (
          <div key={c.label} className="bg-white border border-line rounded-xl p-5">
            <p className="text-xs text-ink/60 mb-2 uppercase tracking-wide font-mono">{c.label}</p>
            <p className={`font-display text-2xl font-semibold ${c.cor}`}>
              R$ {c.valor.toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-line rounded-xl p-6">
        <h2 className="font-display font-semibold mb-4">Vendas do mês, dia a dia</h2>
        {dadosGrafico.length ? (
          <VendasChart dados={dadosGrafico} />
        ) : (
          <p className="text-sm text-ink/40 py-12 text-center">
            Nenhuma venda lançada este mês ainda. Vá em "Vendas Diárias" para começar.
          </p>
        )}
      </div>
    </div>
  );
}
