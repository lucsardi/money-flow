import { createClient } from "@/lib/supabase/server";
import { getEmpresaId } from "@/lib/empresa";
import { revalidatePath } from "next/cache";

async function cadastrarFornecedor(formData: FormData) {
  "use server";
  const supabase = createClient();
  const empresa_id = await getEmpresaId();

  await supabase.from("fornecedores").insert({
    empresa_id,
    empresa_fornecedor: formData.get("empresa_fornecedor") as string,
    vendedor: formData.get("vendedor") as string,
    telefone: formData.get("telefone") as string,
    formas_comprar: formData.get("formas_comprar") as string,
    formas_pagamento: formData.get("formas_pagamento") as string,
  });

  revalidatePath("/fornecedores");
  revalidatePath("/boletos");
}

export default async function FornecedoresPage() {
  const supabase = createClient();
  const empresa_id = await getEmpresaId();

  const { data: fornecedores } = await supabase
    .from("fornecedores")
    .select("*")
    .eq("empresa_id", empresa_id)
    .order("empresa_fornecedor", { ascending: true });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold mb-1">Fornecedores</h1>
        <p className="text-sm text-ink/60">Cadastre seus fornecedores para usá-los nos boletos.</p>
      </div>

      <form
        action={cadastrarFornecedor}
        className="bg-white border border-line rounded-xl p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end"
      >
        <label className="text-sm lg:col-span-1">
          <span className="block text-ink/60 mb-1">Empresa</span>
          <input
            name="empresa_fornecedor"
            required
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="block text-ink/60 mb-1">Vendedor</span>
          <input name="vendedor" className="w-full rounded-md border border-line px-3 py-2 text-sm" />
        </label>
        <label className="text-sm">
          <span className="block text-ink/60 mb-1">Telefone</span>
          <input name="telefone" className="w-full rounded-md border border-line px-3 py-2 text-sm" />
        </label>
        <label className="text-sm">
          <span className="block text-ink/60 mb-1">Formas de comprar</span>
          <input
            name="formas_comprar"
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="block text-ink/60 mb-1">Formas de pagamento</span>
          <input
            name="formas_pagamento"
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </label>
        <button className="bg-emerald text-white rounded-md py-2 text-sm font-medium hover:bg-emerald/90 transition h-fit lg:col-span-5 sm:col-span-2 sm:w-fit sm:px-6">
          Cadastrar
        </button>
      </form>

      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-paper/60 text-left text-ink/60">
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">Vendedor</th>
              <th className="px-4 py-3 font-medium">Telefone</th>
              <th className="px-4 py-3 font-medium">Formas de comprar</th>
              <th className="px-4 py-3 font-medium">Formas de pagamento</th>
            </tr>
          </thead>
          <tbody>
            {fornecedores?.length ? (
              fornecedores.map((f) => (
                <tr key={f.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">{f.empresa_fornecedor}</td>
                  <td className="px-4 py-3">{f.vendedor || "—"}</td>
                  <td className="px-4 py-3 font-mono">{f.telefone || "—"}</td>
                  <td className="px-4 py-3">{f.formas_comprar || "—"}</td>
                  <td className="px-4 py-3">{f.formas_pagamento || "—"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink/40">
                  Nenhum fornecedor cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
