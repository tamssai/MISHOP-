-- ============================================================
-- Phoenix Portal RH — schéma Supabase
-- À exécuter une seule fois dans le SQL Editor de Supabase
-- (https://supabase.com/dashboard/project/tlwvevrvtnpvykpfqkxy/sql)
-- ============================================================

-- Sites ajoutés via le portail (en complément du dataset Excel de base)
create table if not exists public.custom_sites (
  id text primary key,
  num integer default 0,
  name text not null,
  client text not null,
  lieu text not null,
  lat double precision not null,
  lng double precision not null,
  status text not null default 'actif' check (status in ('actif','alerte','inactif')),
  agents_count integer not null default 0,
  approximate boolean not null default false,
  created_at timestamptz not null default now()
);

-- Agents ajoutés via le portail
create table if not exists public.custom_agents (
  id text primary key,
  matricule text not null default '',
  prenom text not null,
  nom text not null,
  full_name text not null,
  address text not null default '',
  contract_type text not null default 'CDD' check (contract_type in ('CDD','CDI')),
  lat double precision not null,
  lng double precision not null,
  approximate boolean not null default false,
  created_at timestamptz not null default now()
);

-- Index sur created_at pour trier facilement
create index if not exists custom_sites_created_idx on public.custom_sites(created_at desc);
create index if not exists custom_agents_created_idx on public.custom_agents(created_at desc);

-- Activer la sécurité au niveau ligne
alter table public.custom_sites enable row level security;
alter table public.custom_agents enable row level security;

-- Politiques (portail interne — on autorise lecture/écriture publique pour l'instant)
drop policy if exists "read custom_sites" on public.custom_sites;
drop policy if exists "insert custom_sites" on public.custom_sites;
drop policy if exists "delete custom_sites" on public.custom_sites;

create policy "read custom_sites"
  on public.custom_sites for select
  to anon, authenticated
  using (true);

create policy "insert custom_sites"
  on public.custom_sites for insert
  to anon, authenticated
  with check (true);

create policy "delete custom_sites"
  on public.custom_sites for delete
  to anon, authenticated
  using (true);

drop policy if exists "read custom_agents" on public.custom_agents;
drop policy if exists "insert custom_agents" on public.custom_agents;
drop policy if exists "delete custom_agents" on public.custom_agents;

create policy "read custom_agents"
  on public.custom_agents for select
  to anon, authenticated
  using (true);

create policy "insert custom_agents"
  on public.custom_agents for insert
  to anon, authenticated
  with check (true);

create policy "delete custom_agents"
  on public.custom_agents for delete
  to anon, authenticated
  using (true);

-- Active la diffusion en temps réel pour ces tables
alter publication supabase_realtime add table public.custom_sites;
alter publication supabase_realtime add table public.custom_agents;
