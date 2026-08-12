-- Esquema de base de datos para "Rotadores Fase 1", adaptado para correr en
-- un Postgres propio (Azure Database for PostgreSQL), sin depender de nada
-- especifico de Supabase.
--
-- Nota: los nombres de columna van con mayuscula inicial ENTRE COMILLAS
-- ("Orden", "Modulo", etc.) porque asi quedo definido el esquema original
-- en Supabase — hay que respetar exactamente esas comillas y mayusculas al
-- consultar, si no Postgres las vuelve minusculas solas y dejan de coincidir.
--
-- Es seguro volver a correrlo (usa "if not exists"). Ejecutar UNA vez,
-- conectado a la base "dbgroot", antes de arrancar la API.

create extension if not exists pgcrypto;

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

-- Bloqueos de edicion: para que dos Rotadores no editen la misma posicion
-- (Orden) al mismo tiempo.
create table if not exists bloqueos_edicion (
  "Orden" integer primary key,
  "Usuario" text,
  "Turno" text,
  "CreadoEn" timestamptz not null default now()
);

-- Resultado de la macro (respalda la pantalla MPRot): la app lo recalcula
-- en el dispositivo y lo vuelve a guardar aqui completo cada vez que algo
-- cambia, para poder consultarlo directo desde la base sin abrir la app.
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

-- Login unificado (Rotador, Supervisor, Programador, Admin).
create table if not exists usuarios_rotadores (
  id text primary key default gen_random_uuid()::text,
  "Nombre" text not null,
  "Usuario" text not null unique,
  "Password" text not null,
  "Rol" text not null check ("Rol" in ('Rotador', 'Supervisor', 'Programador', 'Admin')),
  "Activo" text not null default 'Si',
  "CreadoEn" timestamptz not null default now()
);

create index if not exists usuarios_rotadores_usuario_idx on usuarios_rotadores ("Usuario");
