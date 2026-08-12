-- Login unificado (igual criterio que "App de Roturas · CD"): una sola
-- tabla de cuentas con usuario+contraseña+rol, en vez de tener las
-- credenciales de Supervisor/Programador/Admin hardcodeadas en el codigo y
-- solo los Rotadores en una tabla aparte.
--
-- Se llama "usuarios_rotadores" (no "usuarios" a secas) porque este mismo
-- proyecto Supabase tambien lo usa la app de Roturas, que ya tiene su
-- propia tabla "usuarios" con roles distintos (operativo/supervisor/admin)
-- — no se deben mezclar las dos.
--
-- Pegar y correr en: Supabase Dashboard -> SQL Editor -> New query.
-- Es seguro volver a correrla.

create table if not exists usuarios_rotadores (
  id text primary key default gen_random_uuid()::text,
  "Nombre" text not null,
  "Usuario" text not null unique,
  "Password" text not null,
  "Rol" text not null check ("Rol" in ('Rotador', 'Supervisor', 'Programador', 'Admin')),
  "Activo" text not null default 'Si',
  "CreadoEn" timestamptz not null default now()
);

comment on table usuarios_rotadores is
  'Login local de la app (usuario/contrasena en texto plano, como el resto de este piloto): no es seguridad real. Reemplaza las credenciales hardcodeadas de Supervisor/Programador/Admin y la tabla "rotadores" para el login (esa tabla se deja intacta, no se borra).';

alter table usuarios_rotadores enable row level security;

drop policy if exists "anon all usuarios_rotadores" on usuarios_rotadores;
create policy "anon all usuarios_rotadores" on usuarios_rotadores for all using (true) with check (true);

create index if not exists usuarios_rotadores_usuario_idx on usuarios_rotadores ("Usuario");
