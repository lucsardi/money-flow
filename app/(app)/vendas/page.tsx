import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function getEmpresaId() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase.from("empresas").select("id").eq("owner_id", user.id).single();
  return data!.id as string;
}

async function lancarVenda(formData: FormData) {
  "use server";
  const supabase = createClient();
  const empresa_id = await getEmpresaId();

  const data = formData.get("data") as string;
  const total_bruto = Number(formData.get("total_bruto"));
  const lucro_liquido = Number(formData.get("lucro_liquido"));

  await supabase
    .from("vendas_diarias")
    .upsert(
      { empresa_id, data, total_bruto, lucro_liquido },
      { onConflict: "empresa_id,data" }
    );

  revalidatePath("/vendas");
  revalidatePath("/dashboard");
}

export default async function VendasPage() {
  const supabase = createClient();
  const empresa_id = await getEmpresaId();

  const { data: vendas } = await supabase
    .from("vendas_diarias")
    .select("*")
    .eq("empresa_id", empresa_id)
    .order("data", { ascending: false })
    .limit(31);

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold mb-1">Vendas Diárias</h1>
        <p className="text-sm text-ink/60">
          Lance o total bruto e o lucro líquido do dia. Se já existir um lançamento pra essa data,
          ele é atualizado.
        </p>
      </div>

      <form
        action={lancarVenda}
        className="bg-white border border-line rounded-xl p-6 grid gap-4 sm:grid-cols-4 items-end"
      >
        <label className="text-sm">
          <span className="block text-ink/60 mb-1">Data</span>
          <input
            name="data"
            type="date"
            required
            defaultValue={hoje}
            className="w-full rounded-md border border-line px-3 py-2 text-sm font-mono"
          />
        </label>
        <label className="text-sm">
          <span className="block text-ink/60 mb-1">Total bruto (R$)</span>
          <input
            name="total_bruto"
            type="number"
            step="0.01"
            min="0"
            required
            className="w-full rounded-md border border-line px-3 py-2 text-sm font-mono"
          />
        </label>
        <label className="text-sm">
          <span className="block text-ink/60 mb-1">Lucro líquido (R$)</span>
          <input
            name="lucro_liquido"
            type="number"
            step="0.01"
            min="0"
            required
            className="w-full rounded-md border border-line px-3 py-2 text-sm font-mono"
          />
        </label>
        <button className="bg-emerald text-white rounded-md py-2 text-sm font-medium hover:bg-emerald/90 transition h-fit">
          Lançar
        </button>
      </form>

      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-paper/60 text-left text-ink/60">
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Total bruto</th>
              <th className="px-4 py-3 font-medium">Lucro líquido</th>
              <th className="px-4 py-3 font-medium">% de lucro</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {vendas?.length ? (
              vendas.map((v) => (
                <tr key={v.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">{v.data}</td>
                  <td className="px-4 py-3">R$ {Number(v.total_bruto).toFixed(2)}</td>
                  <td className="px-4 py-3">R$ {Number(v.lucro_liquido).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    {v.total_bruto > 0
                      ? ((v.lucro_liquido / v.total_bruto) * 100).toFixed(1)
                      : "0.0"}
                    %
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink/40 font-body">
                  Nenhuma venda lançada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
