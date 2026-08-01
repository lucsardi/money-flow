-- =========================================================
-- CONTROLE FINANCEIRO - SCHEMA COMPLETO (multi-tenant)
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- 1. EMPRESAS (tenant) - cada loja/cliente do seu SaaS
-- ---------------------------------------------------------
create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  cnpj text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 2. VENDAS DIÁRIAS (abas JAN..DEZ) - MVP
-- ---------------------------------------------------------
create table public.vendas_diarias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  data date not null,
  total_bruto numeric(12,2) not null default 0,
  lucro_liquido numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (empresa_id, data)
);

-- ---------------------------------------------------------
-- 3. METAS MENSAIS (META DO MÊS, em cada aba de mês)
-- ---------------------------------------------------------
create table public.metas_mensais (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  ano int not null,
  mes int not null check (mes between 1 and 12),
  valor_meta numeric(12,2) not null default 0,
  estoque_comprado numeric(12,2) default 0,      -- "TOTAL EM ESTOQUE COMPRADO NO 1º DIA"
  pro_labore numeric(12,2) default 0,
  unique (empresa_id, ano, mes)
);

-- ---------------------------------------------------------
-- 4. FORNECEDORES (aba FORNECEDORES)
-- ---------------------------------------------------------
create table public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  empresa_fornecedor text not null,
  vendedor text,
  telefone text,
  formas_comprar text,
  formas_pagamento text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 5. BOLETOS FORNECEDORES (aba BOLETOS FORNECEDORES)
-- ---------------------------------------------------------
create table public.boletos_fornecedores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  fornecedor_id uuid references public.fornecedores(id) on delete set null,
  data date not null,
  parcelas int not null default 1,
  valor numeric(12,2) not null default 0,
  situacao text not null default 'PENDENTE' check (situacao in ('PENDENTE','OK')),
  observacao text
);

-- ---------------------------------------------------------
-- 6. GASTOS FIXOS e GASTOS VARIÁVEIS (mesma estrutura)
-- ---------------------------------------------------------
create table public.gastos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  tipo text not null check (tipo in ('FIXO','VARIAVEL')),
  descricao text not null,
  data_vencimento date,
  valor numeric(12,2) not null default 0,
  local_pagamento text,
  situacao text not null default 'PENDENTE' check (situacao in ('PENDENTE','OK')),
  observacoes text
);

-- ---------------------------------------------------------
-- 7. COMPRAS POR CNPJ (abas CNPJ 01 / CNPJ 02)
-- ---------------------------------------------------------
create table public.compras_cnpj (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  cnpj text not null,
  data date not null,
  fornecedor_empresa text,
  representante text,
  valor numeric(12,2) not null default 0
);

-- ---------------------------------------------------------
-- 8. TAXAS DE CARTÃO (aba LUCRO LÍQUIDO - simulador)
-- ---------------------------------------------------------
create table public.taxas_pagamento (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  forma_pagamento text not null,   -- PIX, DINHEIRO, DEBITO, CREDITO 1X..12X
  taxa_percentual numeric(6,3) not null default 0,
  unique (empresa_id, forma_pagamento)
);

-- =========================================================
-- ROW LEVEL SECURITY - isola os dados de cada cliente (tenant)
-- =========================================================
alter table public.empresas enable row level security;
alter table public.vendas_diarias enable row level security;
alter table public.metas_mensais enable row level security;
alter table public.fornecedores enable row level security;
alter table public.boletos_fornecedores enable row level security;
alter table public.gastos enable row level security;
alter table public.compras_cnpj enable row level security;
alter table public.taxas_pagamento enable row level security;

-- dono só vê/edita a própria empresa
create policy "empresa_owner_all" on public.empresas
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- para as demais tabelas: acesso liberado apenas se a empresa pertence ao usuário logado
create policy "vendas_by_owner" on public.vendas_diarias
  for all using (empresa_id in (select id from public.empresas where owner_id = auth.uid()))
  with check (empresa_id in (select id from public.empresas where owner_id = auth.uid()));

create policy "metas_by_owner" on public.metas_mensais
  for all using (empresa_id in (select id from public.empresas where owner_id = auth.uid()))
  with check (empresa_id in (select id from public.empresas where owner_id = auth.uid()));

create policy "fornecedores_by_owner" on public.fornecedores
  for all using (empresa_id in (select id from public.empresas where owner_id = auth.uid()))
  with check (empresa_id in (select id from public.empresas where owner_id = auth.uid()));

create policy "boletos_by_owner" on public.boletos_fornecedores
  for all using (empresa_id in (select id from public.empresas where owner_id = auth.uid()))
  with check (empresa_id in (select id from public.empresas where owner_id = auth.uid()));

create policy "gastos_by_owner" on public.gastos
  for all using (empresa_id in (select id from public.empresas where owner_id = auth.uid()))
  with check (empresa_id in (select id from public.empresas where owner_id = auth.uid()));

create policy "compras_by_owner" on public.compras_cnpj
  for all using (empresa_id in (select id from public.empresas where owner_id = auth.uid()))
  with check (empresa_id in (select id from public.empresas where owner_id = auth.uid()));

create policy "taxas_by_owner" on public.taxas_pagamento
  for all using (empresa_id in (select id from public.empresas where owner_id = auth.uid()))
  with check (empresa_id in (select id from public.empresas where owner_id = auth.uid()));

-- =========================================================
-- Cria a empresa automaticamente no primeiro login (1 loja por usuário no MVP)
-- =========================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.empresas (owner_id, nome)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome_loja', 'Minha Loja'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
