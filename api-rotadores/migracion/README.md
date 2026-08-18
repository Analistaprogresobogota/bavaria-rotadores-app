# Migración de datos — Rotadores Fase 1

Export real de la base de Supabase del piloto (corte: fecha de generación de estos
archivos), listo para cargar en el esquema `progreso` una vez Tecnología entregue los 4
habilitadores (esquema, identidad técnica, conectividad, secretos — ver el informe
técnico en `Documentación/`).

## Contenido y orden de carga

| Orden | Archivo | Filas | Qué es |
|---|---|---|---|
| 1 | `01_usuarios.sql` | 5 | Cuentas del piloto (Rotador/Supervisor/Programador/Admin) |
| 2 | `02_conteos.sql` | 913 | Estado actual de cada posición — **ver advertencia abajo** |
| 3 | `03_historial.sql` | 6 | Log histórico de conteos guardados |
| 4 | `04_bloqueos.sql` | 0 | Vacío al momento del corte (normal, son temporales) |
| 5 | `05_resultado_macro.sql` | 913 | Snapshot de MPRot — **misma advertencia que conteos** |

## ⚠️ ADVERTENCIA — catálogo de posiciones desactualizado (913 vs 933)

Esto es el riesgo #1 que señala el informe técnico de Tecnología, textual: *"No debe
migrarse ni recompilarse hasta definir el catálogo autorizado y validar la
correspondencia de Orden con Módulo."*

Al generar este export encontramos justo ese problema: **Supabase todavía tiene el
catálogo viejo de 913 posiciones** (`conteos` y `resultado_macro` traen 913 filas cada
uno). Ya confirmamos con el dueño del proceso que **el catálogo correcto es el de 933
posiciones** — el código de la app (`src/datos/modulosDemo.js`) ya se regeneró con las
933 posiciones reales tomadas directo del Excel `Seg Rotacion OK.xlsm` (hoja "Conteos"),
pero **estos archivos SQL siguen reflejando las 913 posiciones viejas de Supabase**, no
las 933 corregidas.

**No cargues `02_conteos.sql` ni `05_resultado_macro.sql` a producción tal cual estén.**
Antes de migrar en serio hay que:

1. Confirmar con el proceso operativo el estado actual real de cada una de las 933
   posiciones (probablemente ya cambió desde que se generó este export)
2. Regenerar `conteos` desde el Excel actualizado con
   `node scripts/actualizar-desde-excel.mjs "/ruta/al/Excel.xlsm"` (ver el script, ya
   ajustado para no depender de Supabase) en vez de reusar este archivo
3. `resultado_macro` se recalcula solo del lado de la app (`src/logica/macro.js`), no
   hace falta migrarlo a mano — mejor dejar que la app lo regenere la primera vez que
   corra contra la base nueva

`01_usuarios.sql`, `03_historial.sql` y `04_bloqueos.sql` sí están al día y se pueden
cargar directo.

## ⚠️ Contraseñas excluidas a propósito

`01_usuarios.sql` trae la contraseña de cada cuenta reemplazada por el texto
`CAMBIAR_ESTA_CONTRASENA` — las contraseñas originales del piloto se guardaban en texto
plano, y subir eso a un repositorio (aunque sea privado) es un riesgo innecesario.
**Antes de dar por cerrado el corte, alguien con acceso a la base debe poner una
contraseña real a cada usuario.**

## Cómo cargarlo

```bash
psql "$CONNECTION_STRING" -f 01_usuarios.sql
# 02_conteos.sql: NO cargar sin antes resolver la advertencia de arriba
psql "$CONNECTION_STRING" -f 03_historial.sql
psql "$CONNECTION_STRING" -f 04_bloqueos.sql
# 05_resultado_macro.sql: dejar que la app lo recalcule solo
```

Los `insert ... on conflict do nothing` hacen que sea seguro volver a correrlos si algo
falla a mitad de camino — no van a duplicar filas.
