import { createClient } from "@/lib/supabase/server";
import { getEmpresaId } from "@/lib/empresa";
import { revalidatePath } from "next/cache";
import TaxasSimulador from "./TaxasSimulador";

async function salvarTaxa(formData: FormData) {
  "use server";
  const supabase = createClient();
  const empresa_id = await getEmpresaId();

  await supabase.from("taxas_pagamento").upsert(
    {
      empresa_id,
      forma_pagamento: formData.get("forma_pagamento") as string,
      taxa_percentual: Number(formData.get("taxa_percentual")),
    },
    { onConflict: "empresa_id,forma_pagamento" }
  );

  revalidatePath("/taxas");
}

export default async function TaxasPage() {
  const supabase = createClient();
  const empresa_id = await getEmpresaId();

  const { data: taxas } = await supabase
    .from("taxas_pagamento")
    .select("forma_pagamento, taxa_percentual")
    .eq("empresa_id", empresa_id)
    .order("forma_pagamento", { ascending: true });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold mb-1">Taxas de Cartão</h1>
        <p className="text-sm text-ink/60">
          Cadastre a taxa de cada forma de pagamento e use o simulador para saber quanto passar
          no cartão ou quanto sobra líquido de uma venda.
        </p>
      </div>

      <form
        action={salvarTaxa}
        className="bg-white border border-line rounded-xl p-6 grid gap-4 sm:grid-cols-3 items-end"
      >
        <label className="text-sm">
          <span className="block text-ink/60 mb-1">Forma de pagamento</span>
          <input
            name="forma_pagamento"
            required
            placeholder="ex: CREDITO 3X"
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="block text-ink/60 mb-1">Taxa (%)</span>
          <input
            name="taxa_percentual"
            type="number"
            step="0.01"
            min="0"
            required
            className="w-full rounded-md border border-line px-3 py-2 text-sm font-mono"
          />
        </label>
        <button className="bg-emerald text-white rounded-md py-2 text-sm font-medium hover:bg-emerald/90 transition h-fit">
          Salvar
        </button>
        <p className="text-xs text-ink/40 sm:col-span-3">
          Dica: use o mesmo nome (ex: "PIX", "DEBITO", "CREDITO 1X") pra atualizar a taxa de uma
          forma já cadastrada.
        </p>
      </form>

      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-paper/60 text-left text-ink/60">
              <th className="px-4 py-3 font-medium">Forma de pagamento</th>
              <th className="px-4 py-3 font-medium">Taxa</th>
            </tr>
          </thead>
          <tbody>
            {taxas?.length ? (
              taxas.map((t) => (
                <tr key={t.forma_pagamento} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">{t.forma_pagamento}</td>
                  <td className="px-4 py-3 font-mono">{t.taxa_percentual}%</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-ink/40">
                  Nenhuma taxa cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-line rounded-xl p-6">
        <h2 className="font-display font-semibold mb-4">Simulador</h2>
        <TaxasSimulador taxas={taxas ?? []} />
      </div>
    </div>
  );
}
