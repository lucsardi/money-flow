import { createClient } from "@/lib/supabase/server";
import { getEmpresaId } from "@/lib/empresa";
import { revalidatePath } from "next/cache";

async function lancarCompra(formData: FormData) {
  "use server";
  const supabase = createClient();
  const empresa_id = await getEmpresaId();

  await supabase.from("compras_cnpj").insert({
    empresa_id,
    cnpj: formData.get("cnpj") as string,
    data: formData.get("data") as string,
    fornecedor_empresa: formData.get("fornecedor_empresa") as string,
    representante: formData.get("representante") as string,
    valor: Number(formData.get("valor")),
  });

  revalidatePath("/compras");
}

export default async function ComprasPage() {
  const supabase = createClient();
  const empresa_id = await getEmpresaId();

  const { data: compras } = await supabase
    .from("compras_cnpj")
    .select("*")
    .eq("empresa_id", empresa_id)
    .order("data", { ascending: false });

  const cnpjs = Array.from(new Set(compras?.map((c) => c.cnpj) ?? []));
  const totalPorCnpj = cnpjs.map((cnpj) => ({
    cnpj,
    total: compras!
      .filter((c) => c.cnpj === cnpj)
      .reduce((s, c) => s + Number(c.valor), 0),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold mb-1">Compras por CNPJ</h1>
        <p className="text-sm text-ink/60">
          Se você opera com mais de um CNPJ, use o campo abaixo para separar as compras de cada
          um.
        </p>
      </div>

      {totalPorCnpj.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {totalPorCnpj.map((c) => (
            <div key={c.cnpj} className="bg-white border border-line rounded-xl p-5">
              <p className="text-xs text-ink/60 mb-2 uppercase tracking-wide font-mono">
                CNPJ {c.cnpj}
              </p>
              <p className="font-display text-2xl font-semibold">R$ {c.total.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}

      <form
        action={lancarCompra}
        className="bg-white border border-line rounded-xl p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end"
      >
        <label className="text-sm">
          <span className="block text-ink/60 mb-1">CNPJ</span>
          <input
            name="cnpj"
            required
            placeholder="00.000.000/0001-00"
            className="w-full rounded-md border border-line px-3 py-2 text-sm font-mono"
          />
        </label>
        <label className="text-sm">
          <span className="block text-ink/60 mb-1">Data</span>
          <input
            name="data"
            type="date"
            required
            className="w-full rounded-md border border-line px-3 py-2 text-sm font-mono"
          />
        </label>
        <label className="text-sm">
          <span className="block text-ink/60 mb-1">Fornecedor / Empresa</span>
          <input
            name="fornecedor_empresa"
            required
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="block text-ink/60 mb-1">Representante</span>
          <input name="representante" className="w-full rounded-md border border-line px-3 py-2 text-sm" />
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
        <button className="bg-emerald text-white rounded-md py-2 text-sm font-medium hover:bg-emerald/90 transition h-fit lg:col-span-5 sm:w-fit sm:px-6">
          Lançar compra
        </button>
      </form>

      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-paper/60 text-left text-ink/60">
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">CNPJ</th>
              <th className="px-4 py-3 font-medium">Fornecedor</th>
              <th className="px-4 py-3 font-medium">Representante</th>
              <th className="px-4 py-3 font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            {compras?.length ? (
              compras.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-mono">{c.data}</td>
                  <td className="px-4 py-3 font-mono">{c.cnpj}</td>
                  <td className="px-4 py-3">{c.fornecedor_empresa}</td>
                  <td className="px-4 py-3">{c.representante || "—"}</td>
                  <td className="px-4 py-3 font-mono">R$ {Number(c.valor).toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink/40">
                  Nenhuma compra lançada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
