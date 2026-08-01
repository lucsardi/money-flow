import { createClient } from "@/lib/supabase/server";
import { getEmpresaId } from "@/lib/empresa";
import { revalidatePath } from "next/cache";
import Link from "next/link";

async function lancarBoleto(formData: FormData) {
  "use server";
  const supabase = createClient();
  const empresa_id = await getEmpresaId();

  await supabase.from("boletos_fornecedores").insert({
    empresa_id,
    fornecedor_id: (formData.get("fornecedor_id") as string) || null,
    data: formData.get("data") as string,
    parcelas: Number(formData.get("parcelas")) || 1,
    valor: Number(formData.get("valor")),
    observacao: formData.get("observacao") as string,
  });

  revalidatePath("/boletos");
  revalidatePath("/dashboard");
}

async function alternarSituacao(formData: FormData) {
  "use server";
  const supabase = createClient();
  await getEmpresaId();
  const id = formData.get("id") as string;
  const novaSituacao = formData.get("nova_situacao") as string;

  await supabase.from("boletos_fornecedores").update({ situacao: novaSituacao }).eq("id", id);

  revalidatePath("/boletos");
  revalidatePath("/dashboard");
}

export default async function BoletosPage() {
  const supabase = createClient();
  const empresa_id = await getEmpresaId();

  const [{ data: boletos }, { data: fornecedores }] = await Promise.all([
    supabase
      .from("boletos_fornecedores")
      .select("*, fornecedores(empresa_fornecedor)")
      .eq("empresa_id", empresa_id)
      .order("data", { ascending: true }),
    supabase
      .from("fornecedores")
      .select("id, empresa_fornecedor")
      .eq("empresa_id", empresa_id)
      .order("empresa_fornecedor", { ascending: true }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold mb-1">Boletos Fornecedores</h1>
        <p className="text-sm text-ink/60">Contas a pagar para seus fornecedores.</p>
      </div>

      {!fornecedores?.length && (
        <p className="text-sm bg-amber/10 text-amber border border-amber/30 rounded-md px-3 py-2">
          Você ainda não tem fornecedores cadastrados.{" "}
          <Link href="/fornecedores" className="underline font-medium">
            Cadastre um primeiro
          </Link>{" "}
          para poder vincular os boletos.
        </p>
      )}

      <form
        action={lancarBoleto}
        className="bg-white border border-line rounded-xl p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6 items-end"
      >
        <label className="text-sm lg:col-span-2">
          <span className="block text-ink/60 mb-1">Fornecedor</span>
          <select
            name="fornecedor_id"
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          >
            <option value="">Selecione</option>
            {fornecedores?.map((f) => (
              <option key={f.id} value={f.id}>
                {f.empresa_fornecedor}
              </option>
            ))}
          </select>
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
          <span className="block text-ink/60 mb-1">Parcelas</span>
          <input
            name="parcelas"
            type="number"
            min="1"
            defaultValue={1}
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
          <span className="block text-ink/60 mb-1">Observação</span>
          <input name="observacao" className="w-full rounded-md border border-line px-3 py-2 text-sm" />
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
              <th className="px-4 py-3 font-medium">Fornecedor</th>
              <th className="px-4 py-3 font-medium">Parcelas</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Situação</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {boletos?.length ? (
              boletos.map((b: any) => (
                <tr key={b.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-mono">{b.data}</td>
                  <td className="px-4 py-3">{b.fornecedores?.empresa_fornecedor ?? "—"}</td>
                  <td className="px-4 py-3 font-mono">{b.parcelas}x</td>
                  <td className="px-4 py-3 font-mono">R$ {Number(b.valor).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-mono px-2 py-1 rounded ${
                        b.situacao === "OK"
                          ? "bg-emerald/10 text-emerald"
                          : "bg-amber/10 text-amber"
                      }`}
                    >
                      {b.situacao}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <form action={alternarSituacao}>
                      <input type="hidden" name="id" value={b.id} />
                      <input
                        type="hidden"
                        name="nova_situacao"
                        value={b.situacao === "OK" ? "PENDENTE" : "OK"}
                      />
                      <button className="text-xs text-ink/60 hover:text-emerald underline">
                        Marcar como {b.situacao === "OK" ? "pendente" : "pago"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink/40">
                  Nenhum boleto lançado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
