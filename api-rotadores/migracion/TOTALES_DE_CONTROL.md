# Totales de control — migración Rotadores Fase 1

Corte del export: ver fecha de commit de este archivo en git.

## Origen (Supabase, `public`)

| Tabla | Filas en origen |
|---|---|
| `usuarios_rotadores` | 5 |
| `conteos` | 913 ⚠️ ver advertencia en `README.md` — catálogo viejo, no cargar tal cual |
| `historial` | 6 |
| `bloqueos_edicion` | 0 |
| `resultado_macro` | 913 ⚠️ misma advertencia que `conteos` |

## Archivos generados

| Archivo | Filas que inserta |
|---|---|
| `01_usuarios.sql` | 5 |
| `02_conteos.sql` | 913 (NO cargar sin resolver la advertencia del catálogo — ver README) |
| `03_historial.sql` | 6 |
| `04_bloqueos.sql` | 0 (archivo vacío, normal) |
| `05_resultado_macro.sql` | 913 (mejor dejar que la app lo recalcule) |

## Cómo reconciliar después de cargar

```sql
select count(*) from progreso.usuarios_rotadores;  -- debe dar 5
select count(*) from progreso.historial;           -- debe dar 6
select count(*) from progreso.bloqueos_edicion;     -- debe dar 0
```

`conteos` y `resultado_macro` **no se reconcilian contra estos totales** — deben
regenerarse desde el catálogo de 933 posiciones antes de cargar (ver README.md, sección
de advertencia). Una vez regenerados, la reconciliación correcta es:

```sql
select count(*) from progreso.conteos;  -- debe dar 933, no 913
```

Si algún número no coincide, **no continúes con el corte** — revisa qué falló antes de
seguir.
