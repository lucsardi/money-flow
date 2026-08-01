import { createClient } from "@/lib/supabase/server";
import { getEmpresaId } from "@/lib/empresa";
import { revalidatePath } from "next/cache";

async function lancarGasto(formData: FormData) {
  "use server";
  const supabase = createClient();
  const empresa_id = await getEmpresaId();

  await supabase.from("gastos").insert({
    empresa_id,
    tipo: formData.get("tipo") as string,
    descricao: formData.get("descricao") as string,
    data_vencimento: formData.get("data_vencimento") as string,
    valor: Number(formData.get("valor")),
    local_pagamento: formData.get("local_pagamento") as string,
    observacoes: formData.get("observacoes") as string,
  });

  revalidatePath("/gastos");
  revalidatePath("/dashboard");
}

async function alternarSituacao(formData: FormData) {
  "use server";
  const supabase = createClient();
  await getEmpresaId(); // garante que o usuário está autenticado
  const id = formData.get("id") as string;
  const novaSituacao = formData.get("nova_situacao") as string;

  await supabase.from("gastos").update({ situacao: novaSituacao }).eq("id", id);

  revalidatePath("/gastos");
  revalidatePath("/dashboard");
}

function Tabela({
  titulo,
  itens,
}: {
  titulo: string;
  itens: any[];
}) {
  return (
    <div className="bg-white border border-line rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-line bg-paper/60">
        <h2 className="font-display font-semibold text-sm">{titulo}</h2>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-ink/60">
            <th className="px-4 py-3 font-medium">Descrição</th>
            <th className="px-4 py-3 font-medium">Vencimento</th>
            <th className="px-4 py-3 font-medium">Valor</th>
            <th className="px-4 py-3 font-medium">Local pagamento</th>
            <th className="px-4 py-3 font-medium">Situação</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {itens.length ? (
            itens.map((g) => (
              <tr key={g.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">{g.descricao}</td>
                <td className="px-4 py-3 font-mono">{g.data_vencimento ?? "—"}</td>
                <td className="px-4 py-3 font-mono">R$ {Number(g.valor).toFixed(2)}</td>
                <td className="px-4 py-3">{g.local_pagamento || "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-mono px-2 py-1 rounded ${
                      g.situacao === "OK"
                        ? "bg-emerald/10 text-emerald"
                        : "bg-amber/10 text-amber"
                    }`}
                  >
                    {g.situacao}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <form action={alternarSituacao}>
                    <input type="hidden" name="id" value={g.id} />
                    <input
                      type="hidden"
                      name="nova_situacao"
                      value={g.situacao === "OK" ? "PENDENTE" : "OK"}
                    />
                    <button className="text-xs text-ink/60 hover:text-emerald underline">
                      Marcar como {g.situacao === "OK" ? "pendente" : "pago"}
                    </button>
                  </form>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-ink/40">
                Nada lançado ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default async function GastosPage() {
  const supabase = createClient();
  const empresa_id = await getEmpresaId();

  const { data: gastos } = await supabase
    .from("gastos")
    .select("*")
    .eq("empresa_id", empresa_id)
    .order("data_vencimento", { ascending: true });

  const fixos = gastos?.filter((g) => g.tipo === "FIXO") ?? [];
  const variaveis = gastos?.filter((g) => g.tipo === "VARIAVEL") ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold mb-1">Gastos Fixos e Variáveis</h1>
        <p className="text-sm text-ink/60">
          Lance despesas e marque como pagas quando quitar. Elas entram automaticamente no
          Resumo.
        </p>
      </div>

      <form
        action={lancarGasto}
        className="bg-white border border-line rounded-xl p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6 items-end"
      >
        <label className="text-sm">
          <span className="block text-ink/60 mb-1">Tipo</span>
          <select name="tipo" required className="w-full rounded-md border border-line px-3 py-2 text-sm">
            <option value="FIXO">Fixo</option>
            <option value="VARIAVEL">Variável</option>
          </select>
        </label>
        <label className="text-sm lg:col-span-2">
          <span className="block text-ink/60 mb-1">Descrição</span>
          <input
            name="descricao"
            required
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="block text-ink/60 mb-1">Vencimento</span>
          <input
            name="data_vencimento"
            type="date"
            required
            className="w-full rounded-md border border-line px-3 py-2 text-sm font-mono"
          />
        </label>
        <label className="text-sm">
          <span className="block text-ink/60 mb-1">Valor (R$)</span>
          <input
            name="valor"
            type="number"
            step="0.01"
            min="0"
            required
            className="w-full rounded-md border border-line px-3 py-2 text-sm font-mono"
          />
        </label>
        <label className="text-sm">
          <span className="block text-ink/60 mb-1">Local pagamento</span>
          <input
            name="local_pagamento"
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm lg:col-span-5">
          <span className="block text-ink/60 mb-1">Observações</span>
          <input name="observacoes" className="w-full rounded-md border border-line px-3 py-2 text-sm" />
        </label>
        <button className="bg-emerald text-white rounded-md py-2 text-sm font-medium hover:bg-emerald/90 transition h-fit">
          Lançar
        </button>
      </form>

      <Tabela titulo="Gastos Fixos" itens={fixos} />
      <Tabela titulo="Gastos Variáveis" itens={variaveis} />
    </div>
  );
}
