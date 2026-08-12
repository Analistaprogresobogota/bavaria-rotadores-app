# api-rotadores

API intermedia entre el aplicativo **Rotadores Fase 1** y la base de datos Postgres de Tecnología (Azure Database for PostgreSQL). Reemplaza a Supabase: el aplicativo le habla a esta API por HTTP, y esta API es la única que se conecta directamente a la base de datos.

```
App Rotadores (Android / Windows / macOS)
        │  HTTPS
        ▼
   api-rotadores  (este proyecto)
        │  conexión Postgres (host/puerto/usuario/contraseña)
        ▼
Base de datos "dbgroot" en Azure
```

## Por qué existe

El aplicativo no puede conectarse directo a la base de datos: ni el navegador ni el APK/exe pueden hablar el protocolo de Postgres, y aunque pudieran, sería un riesgo grave guardar la contraseña de la base dentro de una app instalada en varios dispositivos. Esta API hace de intermediario: recibe peticiones HTTP normales del aplicativo y es la única que usa las credenciales reales de la base de datos.

Nota: si ya montaron `api-roturas` (la misma pieza para la app de Roturas), esta API sigue exactamente el mismo patrón — pueden correr las dos en el mismo servidor, en puertos distintos.

## 1. Preparar la base de datos (una sola vez)

Conectarse a la base `dbgroot` (por ejemplo con DBeaver) y correr el contenido de [`schema.sql`](./schema.sql). Es seguro volver a correrlo si hace falta — usa `if not exists`.

Crea 5 tablas: `conteos`, `historial`, `bloqueos_edicion`, `resultado_macro` y `usuarios_rotadores`. El detalle completo de cada columna está en el documento `Documentación/Aplicativo 2 - Rotadores - Base de datos - Especificacion para Tecnologia.docx`, en la carpeta raíz del proyecto Rotadores.

**Importante:** las columnas de `conteos`, `historial`, `bloqueos_edicion` y `resultado_macro` van con mayúscula inicial entre comillas (`"Orden"`, `"Modulo"`, etc.) — hay que respetar exactamente eso, si no Postgres las vuelve minúsculas solas y dejan de coincidir con lo que espera la API.

## 2. Configurar y correr la API

Requiere Node.js 18 o superior.

```bash
cd api-rotadores
npm install
cp .env.example .env
```

Completar `.env` con los datos reales de conexión (los mismos que usan en DBeaver):

```
PGHOST=svr-dba-ienm.postgres.database.azure.com
PGPORT=5432
PGDATABASE=dbgroot
PGUSER=userprog
PGPASSWORD=<la contraseña real>
PORT=3002
CORS_ORIGIN=*
```

Correr:

```bash
npm start
```

Debe imprimir `API de Rotadores escuchando en el puerto 3002`. Para confirmar que sí llega a la base de datos:

```bash
curl http://localhost:3002/salud
# esperado: {"estado":"ok","base_de_datos":"conectada"}
```

## 3. Firewall de Azure

Azure Database for PostgreSQL bloquea por IP. Hay que agregar, en las reglas de firewall de la base `dbgroot`, la IP pública desde donde va a correr esta API en producción.

## 4. Desplegarla en un servidor real

Igual que `api-roturas`: Azure App Service (Node.js), Azure Container Apps, o el mecanismo que Tecnología ya use para correr servicios internos. La API debe quedar accesible por una URL HTTPS, que luego se configura en el aplicativo (`VITE_API_URL`, ver `.env.example` del proyecto `rotadores-fase1`).

## Endpoints

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/salud` | Verifica que la API está viva y conectada a la base de datos. |
| GET | `/conteos` | Estado actual de todas las posiciones. |
| POST | `/conteos` | Crea un conteo nuevo. |
| PATCH | `/conteos/:id` | Edita un conteo existente. |
| GET | `/conteos/eventos` | SSE: avisa cuando algo cambió en Conteos (reemplaza tiempo real de Supabase). |
| GET | `/historial` | Log completo, más reciente primero (append-only). |
| POST | `/historial` | Agrega una fila nueva. |
| GET | `/historial/eventos` | SSE para Historial. |
| GET | `/bloqueos` | Bloqueos de edición vigentes. |
| POST | `/bloqueos` | Crea/reemplaza el bloqueo de una posición. |
| DELETE | `/bloqueos/:orden` | Libera una posición. |
| GET | `/bloqueos/eventos` | SSE para Bloqueos. |
| GET | `/resultado-macro` | Snapshot más reciente de MPRot calculado. |
| PUT | `/resultado-macro` | Reemplaza todo el contenido (lo hace la app tras cada cambio). |
| GET | `/usuarios` | Todas las cuentas. |
| POST | `/usuarios/login` | Valida usuario/contraseña en el servidor (nunca se envían las contraseñas al dispositivo). |
| POST | `/usuarios` | Crea una cuenta nueva. |
| PATCH | `/usuarios/:id` | Cambia rol, estado activo, etc. |

## Nota sobre esto siendo un "piloto→producción"

Esta API queda pensada para vivir dentro de la infraestructura de Tecnología (junto a la base de datos), no como algo que dependa de un plan gratuito de otro proveedor — es la pieza que permite que el aplicativo deje de depender de Supabase y pase a ser la solución definitiva.
