-- Usuarios iniciales para "Rotadores Fase 1", mismos que ya existen en
-- Supabase — se corre en DBeaver, DESPUES de schema.sql, contra la base
-- "dbgroot". Es seguro volver a correrlo (usa upsert por "Usuario").

insert into usuarios_rotadores ("Nombre", "Usuario", "Password", "Rol", "Activo") values
  ('Administrador Piloto', 'admin', 'admin2026', 'Admin', 'Si'),
  ('Supervisor Piloto', 'supervisor', 'bavaria2026', 'Supervisor', 'Si'),
  ('Programador Piloto', 'programador', 'program1234', 'Programador', 'Si'),
  ('SAMUEL FELIPE TORRES PINZON', '01', '012026', 'Rotador', 'Si'),
  ('ARTURO SUSO', '02', '022026', 'Rotador', 'Si')
on conflict ("Usuario") do update set
  "Nombre" = excluded."Nombre",
  "Password" = excluded."Password",
  "Rol" = excluded."Rol",
  "Activo" = excluded."Activo";
