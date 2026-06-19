-- ============================================================
-- Migración: tabla `leads` (captura del formulario de la web)
-- Arreglo del HUECO CRÍTICO #1 del PLAN-DUPLICAR-GANANCIAS-2026:
-- el formulario de la web no guardaba el lead (solo armaba un
-- WhatsApp manual). Ahora cada envío se inserta aquí en la nube.
--
-- Ejecutar UNA vez en: Supabase → SQL Editor → Run.
-- (El MCP de Supabase está en solo-lectura, por eso va a mano.)
-- ============================================================

create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  empresa    text,
  correo     text,
  telefono   text not null,
  tipo       text,
  mensaje    text,
  origen     text not null default 'web-form',   -- web-form | cotizador | manual
  estado     text not null default 'nuevo',      -- nuevo | contactado | cotizado | ganado | perdido
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

-- El CRM (usuario logueado = rol authenticated) tiene acceso total,
-- igual que en el resto de tablas (patrón `clientes_auth`).
drop policy if exists "leads_auth" on public.leads;
create policy "leads_auth" on public.leads
  for all to authenticated using (true) with check (true);

-- El formulario público (rol anon, sin login) SOLO puede insertar.
-- No puede leer ni modificar leads ajenos.
drop policy if exists "leads_anon_insert" on public.leads;
create policy "leads_anon_insert" on public.leads
  for insert to anon with check (true);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_estado_idx     on public.leads (estado);
