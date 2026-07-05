-- ==========================================================
-- NOEVO STUDIO — Schema do Supabase
-- Rode este script inteiro em: Supabase → SQL Editor → New query
-- ==========================================================

-- 1) Tabela de perfis (1 linha por usuário autenticado)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  phone text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Cria automaticamente um perfil sempre que alguém se cadastra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, phone)
  values (new.id, new.email, new.phone)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) Tabela de agendamentos
create table if not exists public.agendamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  client text not null,
  barber text not null,
  service text not null,
  price text,
  date timestamptz not null,
  time text not null,
  created_at timestamptz not null default now()
);

alter table public.agendamentos enable row level security;

-- Cliente só vê os próprios agendamentos; admin vê todos
create policy "agendamentos_select_own_or_admin"
  on public.agendamentos for select
  using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- Cliente só cria agendamento em nome dele mesmo
create policy "agendamentos_insert_own"
  on public.agendamentos for insert
  with check (auth.uid() = user_id);

-- ==========================================================
-- DEPOIS de rodar este script:
-- 1. Vá em Authentication → Users → Add user, crie a conta do
--    admin (ex: admin@noevostudio.com + uma senha forte).
-- 2. Rode o comando abaixo (troque o e-mail se usar outro):
--
--    update public.profiles set is_admin = true
--    where email = 'admin@noevostudio.com';
--
-- 3. Deixe o provider "Phone" DESLIGADO em Authentication → Providers
--    (login por telefone é feito via e-mail sintético internamente,
--    não precisa de Twilio nem de SMS).
-- 4. Em Authentication → Providers → Email, desligue
--    "Confirm email" para o cadastro liberar na hora.
-- ==========================================================
