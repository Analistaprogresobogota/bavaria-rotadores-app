-- Esquema para el proyecto Supabase de Rotadores Fase 1.
-- Pegar y correr una sola vez (o de nuevo si ya lo corriste antes: es
-- seguro repetirlo) en: Supabase Dashboard -> SQL Editor -> New query.
--
-- Cambio respecto a la version anterior: Skus y Modulos vuelven a vivir
-- embebidos en la app (van dentro del APK/HTML, son datos maestros que casi
-- no cambian) — ya NO se guardan en Supabase. Solo lo que cambia todo el
-- tiempo (Conteos, Historial, Rotadores) y los bloqueos de edicion en vivo
-- quedan en la base de datos.

drop table if exists skus;
drop table if exists modulos;

create table if not exists conteos (
  id text primary key default gen_random_uuid()::text,
  "Orden" integer,
  "Modulo" text,
  "Codigo" text,
  "Estibas" numeric,
  "Cajas" numeric,
  "Unidades" numeric,
  "FechaVencimiento" text,
  "Estatus" text,
  "Observaciones" text,
  "Bloquear" text,
  "Usuario" text,
  "Rol" text,
  "Turno" text,
  "FechaToma" text,
  "Sede" text
);

-- Historial: log append-only, misma forma que Conteos, nunca se edita/borra.
create table if not exists historial (
  id text primary key default gen_random_uuid()::text,
  "Orden" integer,
  "Modulo" text,
  "Codigo" text,
  "Estibas" numeric,
  "Cajas" numeric,
  "Unidades" numeric,
  "FechaVencimiento" text,
  "Estatus" text,
  "Observaciones" text,
  "Bloquear" text,
  "Usuario" text,
  "Rol" text,
  "Turno" text,
  "FechaToma" text,
  "Sede" text
);

create table if not exists rotadores (
  id text primary key default gen_random_uuid()::text,
  "Nombre" text not null,
  "Codigo" text,
  "Password" text,
  "Activo" text default 'Si'
);

-- Bloqueos de edicion: para que dos Rotadores no editen la misma posicion
-- (Orden) al mismo tiempo. Cuando alguien le da "Editar", se guarda aqui;
-- cuando guarda o cancela, se borra. Un bloqueo mas viejo que unos minutos
-- se ignora en el cliente (por si alguien cierra la app sin guardar).
create table if not exists bloqueos_edicion (
  "Orden" integer primary key,
  "Usuario" text,
  "Turno" text,
  "CreadoEn" timestamptz not null default now()
);

-- Resultado de la macro: la app calcula esto en el navegador (cruzando
-- Conteos con el maestro de Skus embebido) y lo vuelve a guardar aqui cada
-- vez que algo cambia, para que se pueda consultar directo desde Supabase
-- (Table Editor, reportes, etc.) sin tener que abrir la app. Se reemplaza
-- por completo en cada actualizacion (no es un historico, es "la foto de
-- ahorita" — igual que Conteos).
create table if not exists resultado_macro (
  id text primary key,
  "OrdenMacro" integer,
  "Orden" integer,
  "Modulo" text,
  "Familia" text,
  "Codigo" text,
  "Descripcion" text,
  "Estibas" numeric,
  "Cajas" numeric,
  "Unidades" numeric,
  "FechaVencimiento" text,
  "DiasParaVencer" integer,
  "Estado" text,
  "Frescura" numeric,
  "AptoT1" text,
  "AptoT2" text,
  "AptoKA" text,
  "TotalCajas" numeric,
  "TotalUnidades" numeric,
  "Hectolitros" numeric,
  "Estatus" text,
  "Observaciones" text,
  "Usuario" text
);

alter table conteos enable row level security;
alter table historial enable row level security;
alter table rotadores enable row level security;
alter table bloqueos_edicion enable row level security;
alter table resultado_macro enable row level security;

drop policy if exists "anon all conteos" on conteos;
drop policy if exists "anon all historial" on historial;
drop policy if exists "anon all rotadores" on rotadores;
drop policy if exists "anon all bloqueos_edicion" on bloqueos_edicion;
drop policy if exists "anon all resultado_macro" on resultado_macro;

create policy "anon all conteos" on conteos for all using (true) with check (true);
create policy "anon all historial" on historial for all using (true) with check (true);
create policy "anon all rotadores" on rotadores for all using (true) with check (true);
create policy "anon all bloqueos_edicion" on bloqueos_edicion for all using (true) with check (true);
create policy "anon all resultado_macro" on resultado_macro for all using (true) with check (true);

-- Tiempo real: para que cuando un Rotador guarde algo, los demas
-- dispositivos abiertos vean el cambio solos (sin recargar la pagina).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conteos'
  ) then
    alter publication supabase_realtime add table public.conteos;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'historial'
  ) then
    alter publication supabase_realtime add table public.historial;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bloqueos_edicion'
  ) then
    alter publication supabase_realtime add table public.bloqueos_edicion;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'resultado_macro'
  ) then
    alter publication supabase_realtime add table public.resultado_macro;
  end if;
end $$;
