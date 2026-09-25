# Registro de decisiones técnicas

Este archivo anota las decisiones tomadas durante la implementación que
**complementan o ajustan** las especificaciones (SPEC-000 a SPEC-012).

Cada decisión indica en qué checkpoint se tomó, por qué, y qué spec afecta.
Cuando una spec se actualice para incluirla, se marca como ✅ Incorporada.

---

## D-001 — CHECKPOINT 1 simplificado reemplaza al original

- **Checkpoint:** CP1
- **Decisión:** se usa `docs/check/updated-checkpoint/CHECKPOINT_001_PostgreSQL_conexion_migraciones.md`.
  Los scripts de base de datos (`db:*`) cargan variables con `node --env-file`.
- **Motivo:** el CP1 original era demasiado extenso para aprendices.
- **Requisito:** Node.js 20.6 o superior.
- **Afecta:** CHECKPOINT-001.

## D-002 — Restricciones sin nombre en la migración 001

- **Checkpoint:** CP1
- **Decisión:** solo `ux_usuarios_correo_normalizado` tiene nombre explícito.
  Las demás restricciones usan los nombres automáticos de PostgreSQL.
- **Motivo:** así quedó el CP1 simplificado. No rompe nada (el CP4 solo usa ese nombre).
- **Afecta:** SPEC-002 (que sí nombra todas). Pendiente de decidir si se corrige.

## D-003 — NODE_ENV fuera de los archivos .env

- **Checkpoint:** CP2-C
- **Decisión:** `NODE_ENV` no se escribe en `.env` ni `.env.test`.
  `env.js` lo lee del entorno (por defecto `development`) y con él elige
  qué archivo cargar: `.env` o `.env.test`.
- **Motivo:** `NODE_ENV` decide qué archivo abrir; no puede estar dentro de él.
- **Afecta:** SPEC-011.

## D-004 — Configuración validada sin Zod

- **Checkpoint:** CP2-C
- **Decisión:** `env.js` valida con funciones simples (`requerirTexto`,
  `leerPuerto`, `leerUrl`, `leerZonaHoraria`) y congela el resultado.
- **Motivo:** más fácil de leer para aprendices. Zod se reserva para validar peticiones.
- **Protección extra:** en modo test, la base debe terminar en `_test`.
- **Afecta:** SPEC-011.

## D-005 — Fechas DATE como texto `AAAA-MM-DD`

- **Checkpoint:** CP2-D
- **Decisión:** `pool.js` configura el tipo `DATE` (1082) para devolverse como
  texto tal cual, sin convertirlo a objeto `Date` de JavaScript.
- **Motivo:** evitar horas inventadas y cambios de día por zona horaria.
  La regla "una lectura por día" depende de fechas exactas.
- **Afecta:** SPEC-011, SPEC-005, SPEC-006.

## D-006 — BIGINT como número de JavaScript

- **Checkpoint:** CP2-D
- **Decisión:** el tipo `BIGINT` (20) se convierte a `Number`, verificando
  `Number.isSafeInteger`. Si no es seguro, se lanza un error.
- **Motivo:** por defecto `pg` lo entrega como texto, y `"9" > "10"` es `true`.
  La regla "lectura actual >= lectura anterior" necesita números reales.
- **Afecta:** SPEC-011, SPEC-005.

## D-007 — El servidor verifica PostgreSQL antes de abrir

- **Checkpoint:** CP2-D
- **Decisión:** `server.js` ejecuta `verificarConexionBD()` antes de `listen`.
  Si falla, el servidor no abre. Al recibir SIGINT/SIGTERM cierra el servidor
  y luego el pool.
- **Afecta:** SPEC-011.

## D-008 — Orden del pipeline de Express

- **Checkpoint:** CP2-F a CP2-J
- **Decisión:** requestId → logger → helmet → cors → rate limit → express.json
  → rutas → 404 → manejador de errores.
- **Motivo:**
  - El logger va antes de `express.json` para registrar también los JSON rotos.
  - El rate limit va después de CORS (para que React pueda leer el 429) y antes
    de `express.json` (para no gastar tiempo leyendo pedidos que se rechazarán).
- **Afecta:** SPEC-011 (el CP2-A original proponía json → logger → rate limit).

## D-009 — Qué registra el logger

- **Checkpoint:** CP2-F
- **Decisión:** una línea por petición con método, ruta sin query string,
  status, duración y requestId. Nunca body, headers de sesión ni `?parámetros`.
  Apagado en modo test.
- **Afecta:** SPEC-010.

## D-010 — CORS sin bloqueo en el servidor

- **Checkpoint:** CP2-H
- **Decisión:** peticiones sin `Origin` se permiten (Thunder Client, pruebas).
  Orígenes no permitidos reciben respuesta sin `Access-Control-Allow-Origin`
  (el navegador bloquea); no se responde 403 ni 500.
  `X-Request-Id` se expone para que React pueda leerlo.
- **Afecta:** SPEC-010.

## D-011 — Rate limit con fábrica reutilizable

- **Checkpoint:** CP2-J
- **Decisión:** `crearLimitador({ minutos, maximo, omitir })`.
  General: 120 por minuto por IP, apagado en modo test.
  Login (CP3): 5 intentos cada 15 minutos, con la misma fábrica.
- **Afecta:** SPEC-010.

## D-012 — Catálogo de errores del CP2

- **Checkpoint:** CP2-E a CP2-K
- **Decisión:** todas las respuestas de error tienen `codigo`, `mensaje`,
  `detalles` (opcional) y `requestId`.

  | Status | Código |
  |---|---|
  | 400 | `JSON_INVALIDO` |
  | 404 | `RUTA_NO_ENCONTRADA` |
  | 413 | `SECURITY_BODY_DEMASIADO_GRANDE` |
  | 422 | `VALIDACION_DATOS_INVALIDOS` (con `detalles.campos`) |
  | 429 | `RATE_LIMIT_EXCEDIDO` |
  | 500 | `ERROR_INTERNO` |

- **Regla:** los códigos se agregan solo cuando se necesitan.
- **Afecta:** SPEC-010, SPEC-011.

## D-013 — Nombres de archivos del backend

- **Checkpoint:** CP2
- **Decisión:** los middlewares se llaman `error-handler.js`, `logger.js`,
  `not-found.js`, `rate-limit.js`, `request-id.js` y `validar.js`
  (el CP2 original usaba el sufijo `.middleware.js`).
- **Afecta:** CHECKPOINT-002 y posteriores (sus rutas de import deben ajustarse).

## D-014 — Decisiones pospuestas

- `origin.middleware.js` (`SECURITY_ORIGIN_INVALIDO`) se crea en el **CP3**,
  cuando existan `/api/auth/refresh` y `/api/auth/logout` con cookies.
- La validación de **fecha real** (que no exista el 30 de febrero) se hace en el **CP5**.
- Variables `JWT_*` y de cookies se agregan a `env.js` en el **CP3**.

## Pendientes de documentación

- SPEC-000, sección 32: la lista de specs no coincide con los títulos reales
  (por ejemplo, SPEC-008 es temas + responsive, SPEC-010 es seguridad y
  SPEC-011 es arquitectura).