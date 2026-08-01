# Controle Financeiro — MVP (Vendas Diárias + Resumo)

Base do seu SaaS: login multiempresa (cada cliente só vê os dados dele),
lançamento de vendas diárias e um dashboard mensal. Roda de graça em
Supabase + Vercel.

## 1. Criar o banco (Supabase — grátis)

1. Crie uma conta em https://supabase.com e um novo projeto (fica pronto em ~2 min).
2. Vá em **SQL Editor** → **New query**, cole todo o conteúdo de `supabase/schema.sql`
   e clique em **Run**. Isso cria as tabelas, ativa a segurança por cliente (RLS)
   e configura a criação automática da "empresa" no primeiro cadastro.
3. Vá em **Project Settings → API** e copie:
   - `Project URL`
   - `anon public key`

## 2. Rodar o projeto na sua máquina

```bash
npm install
cp .env.local.example .env.local
# cole a URL e a anon key que você copiou no passo anterior
npm run dev
```

Abra http://localhost:3000 — você vai cair na tela de login. Clique em
"Criar minha loja", cadastre-se, e pronto: já existe uma empresa isolada
pra esse usuário no banco (o trigger `handle_new_user` faz isso sozinho).

## 3. Colocar no ar de graça (Vercel)

1. Suba este projeto para um repositório no GitHub.
2. Em https://vercel.com, "Add New Project" → importe o repositório.
3. Em **Environment Variables**, adicione as mesmas duas variáveis do `.env.local`.
4. Deploy. Pronto — você tem uma URL pública rodando 100% de graça.

## Como o multiempresa (multi-tenant) funciona

Cada usuário autenticado só consegue ler/gravar linhas cuja `empresa_id`
pertence a ele — essa regra vive **no banco** (Row Level Security), não
no código do front-end. Ou seja: mesmo que haja um bug numa tela, é
impossível um cliente enxergar dado de outro. Isso é o que te permite
vender a mesma aplicação pra vários lojistas sem separar bancos ou
servidores por cliente.

## O que já está pronto no banco, mas ainda sem tela (próximas fases)

O `schema.sql` já contempla o resto da planilha original, então quando
formos expandir o MVP não vamos precisar redesenhar o banco:

- `fornecedores` — aba FORNECEDORES
- `boletos_fornecedores` — aba BOLETOS FORNECEDORES
- `gastos` (tipo FIXO/VARIAVEL) — abas GASTOS FIXOS e GASTOS VARIÁVEIS
- `compras_cnpj` — abas CNPJ 01 / CNPJ 02
- `metas_mensais` — "META DO MÊS" de cada aba mensal
- `taxas_pagamento` — simulador de taxas de cartão da aba LUCRO LÍQUIDO

## Roadmap sugerido

1. **MVP (feito aqui):** login, vendas diárias, resumo mensal
2. **Fase 2:** telas de Gastos Fixos/Variáveis + Boletos Fornecedores,
   puxando os cartões do dashboard automaticamente
3. **Fase 3:** Fornecedores + Compras por CNPJ + calculadora de taxas de cartão
4. **Fase 4 (monetização):** Stripe Checkout + tabela de planos,
   bloqueando funcionalidades por plano
5. **Fase 5:** convite de membros por empresa (hoje é 1 usuário = 1 loja;
   dá pra evoluir pra "equipe" com uma tabela `membros_empresa`)

## Stack

Next.js 14 (App Router) · Supabase (Postgres + Auth + RLS) · Tailwind CSS ·
Recharts · Vercel
