import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function signIn(formData: FormData) {
  "use server";
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?erro=${encodeURIComponent(error.message)}`);
  redirect("/dashboard");
}

async function signUp(formData: FormData) {
  "use server";
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const nomeLoja = formData.get("nomeLoja") as string;
  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nome_loja: nomeLoja } },
  });
  if (error) redirect(`/login?erro=${encodeURIComponent(error.message)}`);
  redirect(`/login?criado=1`);
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { erro?: string; criado?: string };
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-mono text-xs tracking-widest text-emerald uppercase mb-2">
            Controle Financeiro
          </p>
          <h1 className="font-display text-3xl font-semibold">Sua loja, em dia.</h1>
        </div>

        {searchParams.erro && (
          <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {searchParams.erro}
          </p>
        )}
        {searchParams.criado && (
          <p className="mb-4 text-sm text-emerald bg-emerald/10 border border-emerald/30 rounded-md px-3 py-2">
            Conta criada! Confirme seu e-mail (se exigido) e entre abaixo.
          </p>
        )}

        <form action={signIn} className="space-y-3 bg-white border border-line rounded-xl p-6">
          <h2 className="font-display font-semibold text-lg mb-1">Entrar</h2>
          <input
            name="email"
            type="email"
            required
            placeholder="seu@email.com"
            className="w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald"
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Senha"
            className="w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald"
          />
          <button
            type="submit"
            className="w-full bg-ink text-white rounded-md py-2 text-sm font-medium hover:bg-ink/90 transition"
          >
            Entrar
          </button>
        </form>

        <details className="mt-4 bg-white border border-line rounded-xl p-6">
          <summary className="font-display font-semibold text-lg cursor-pointer">
            Criar minha loja
          </summary>
          <form action={signUp} className="space-y-3 mt-4">
            <input
              name="nomeLoja"
              type="text"
              required
              placeholder="Nome da loja"
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald"
            />
            <input
              name="email"
              type="email"
              required
              placeholder="seu@email.com"
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald"
            />
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Crie uma senha"
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald"
            />
            <button
              type="submit"
              className="w-full bg-emerald text-white rounded-md py-2 text-sm font-medium hover:bg-emerald/90 transition"
            >
              Criar conta
            </button>
          </form>
        </details>
      </div>
    </main>
  );
}
