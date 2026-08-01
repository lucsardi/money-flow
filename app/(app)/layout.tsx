import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function signOut() {
  "use server";
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: empresa } = await supabase
    .from("empresas")
    .select("nome")
    .eq("owner_id", user.id)
    .single();

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] tracking-widest text-emerald uppercase">
              {empresa?.nome ?? "Minha Loja"}
            </p>
            <nav className="flex gap-4 mt-1">
              <Link href="/dashboard" className="font-display font-medium text-sm hover:text-emerald">
                Resumo
              </Link>
              <Link href="/vendas" className="font-display font-medium text-sm hover:text-emerald">
                Vendas Diárias
              </Link>
            </nav>
          </div>
          <form action={signOut}>
            <button className="text-xs text-ink/60 hover:text-ink font-medium">Sair</button>
          </form>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
