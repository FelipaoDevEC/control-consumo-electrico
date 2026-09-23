# CHECKPOINT 1 — PostgreSQL, conexión y sistema de migraciones

## 1. Objetivo

Construir la primera infraestructura persistente del proyecto.

Al finalizar este checkpoint tendremos:

* PostgreSQL configurado localmente;
* base `consumo_electrico`;
* usuario PostgreSQL propio para la aplicación;
* conexión Node.js → PostgreSQL mediante `pg`;
* configuración mediante `.env`;
* pool centralizado;
* tabla técnica `schema_migrations`;
* ejecutor de migraciones SQL;
* migración `001_esquema_inicial.sql`;
* migración `002_sesiones.sql`;
* tablas `usuarios`, `medidores`, `lecturas_medidor` y `sesiones`;
* restricciones `PK`, `FK`, `CHECK`, `UNIQUE`;
* índice único de correo normalizado;
* seed del `Medidor principal`;
* comandos reproducibles para reconstruir el esquema;
* verificación del estado de migraciones.

Todavía NO implementaremos:

* login;
* bcrypt;
* JWT;
* Refresh Token funcional;
* administración de usuarios;
* endpoints de lecturas;
* estadísticas;
* dashboard;
* frontend funcional.

---

# 2. Precondición

Antes de comenzar:

```text
CHECKPOINT 0 → CERRADO
```

Debe existir:

```text
backend/
frontend/
docs/
Git
```

y:

```text
GET /api/health → 200
```

---

# 3. SPEC relacionadas

Principalmente:

```text
SPEC-002 → Modelo de datos
SPEC-003 → Sesiones
SPEC-010 → Seguridad transversal
SPEC-011 → Arquitectura técnica
SPEC-012 → Estrategia de pruebas
```

---

# 4. Qué aprenderemos

Este checkpoint debe enseñar:

```text
¿Qué es PostgreSQL?
¿Qué es una base de datos?
¿Qué es una tabla?
¿Qué es una fila?
¿Qué es una columna?
¿Qué es una PRIMARY KEY?
¿Qué es una FOREIGN KEY?
¿Qué es UNIQUE?
¿Qué es CHECK?
¿Qué es un índice?
¿Qué es una migración?
¿Qué es un seed?
¿Qué es una transacción?
¿Qué es un pool de conexiones?
```

---

# 5. Arquitectura que construiremos

```text
Node.js
   │
   │ pg
   ▼
Pool PostgreSQL
   │
   ▼
consumo_electrico
   │
   ├── schema_migrations
   ├── usuarios
   ├── medidores
   ├── lecturas_medidor
   └── sesiones
```

---

# 6. Instalar PostgreSQL

PostgreSQL deberá estar instalado y ejecutándose localmente.

Necesitamos conocer:

```text
host
puerto
usuario administrador local
```

Normalmente:

```text
host = localhost
puerto = 5432
```

No debemos asumir que estos valores son iguales en todas las instalaciones.

---

# 7. Herramienta de administración

El estudiante puede utilizar:

```text
pgAdmin
```

o:

```text
psql
```

El proyecto no dependerá de cuál utilice.

---

# 8. No utilizar superusuario desde la aplicación

La aplicación no debe conectarse normalmente utilizando:

```text
postgres
```

Crearemos un usuario específico.

Ejemplo conceptual:

```text
consumo_app
```

---

# 9. Crear usuario PostgreSQL

Desde una sesión administrativa:

```sql
CREATE ROLE consumo_app
WITH
    LOGIN
    PASSWORD 'UNA_PASSWORD_LOCAL_SEGURA';
```

La contraseña mostrada aquí es conceptual.

Cada instalación deberá definir la suya.

---

# 10. Crear base de datos

```sql
CREATE DATABASE consumo_electrico
OWNER consumo_app;
```

---

# 11. Permisos

Conectados a:

```text
consumo_electrico
```

podemos asegurar permisos sobre el esquema:

```sql
GRANT USAGE, CREATE
ON SCHEMA public
TO consumo_app;
```

---

# 12. Principio de menor privilegio

`consumo_app` NO necesita ser:

```text
SUPERUSER
CREATEDB
CREATEROLE
```

para utilizar normalmente la aplicación.

---

# 13. Resultado esperado

Tendremos:

```text
PostgreSQL
│
└── consumo_electrico
     propietario/aplicación → consumo_app
```

---

# 14. Instalar `pg`

Ir a:

```text
backend/
```

Ejecutar:

```bash
npm install pg
```

---

# 15. Instalar `dotenv`

Necesitamos cargar configuración local sin quemarla en código.

```bash
npm install dotenv
```

---

# 16. Dependencias backend después de este paso

Tendremos aproximadamente:

```text
express
pg
dotenv
```

Todavía no necesitamos:

```text
bcrypt
jsonwebtoken
helmet
cors
axios
recharts
```

---

# 17. Crear `.env`

En:

```text
backend/.env
```

utilizar:

```text
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=consumo_electrico
DB_USER=consumo_app
DB_PASSWORD=TU_PASSWORD_LOCAL

FRONTEND_URL=http://localhost:5173
APP_TIMEZONE=America/Guayaquil

NODE_ENV=development
```

---

# 18. Importante

Este archivo:

```text
backend/.env
```

NO debe subirse a Git.

---

# 19. `.env.example`

Continúa sin contener secretos:

```text
DB_HOST=localhost
DB_PORT=5432
DB_NAME=consumo_electrico
DB_USER=
DB_PASSWORD=
```

---

# 20. Configuración centralizada

Crear:

```text
backend/src/config/env.js
```

En este checkpoint validaremos únicamente las variables necesarias para PostgreSQL.

Conceptualmente:

```javascript
import 'dotenv/config';

function requerirVariable(nombre) {
    const valor = process.env[nombre];

    if (!valor) {
        throw new Error(
            `Falta la variable de entorno obligatoria: ${nombre}`
        );
    }

    return valor;
}

export const env = {
    db: {
        host: requerirVariable('DB_HOST'),
        port: Number(process.env.DB_PORT ?? 5432),
        name: requerirVariable('DB_NAME'),
        user: requerirVariable('DB_USER'),
        password: requerirVariable('DB_PASSWORD'),
    },
};
```

---

# 21. Validar el puerto

No debemos aceptar silenciosamente:

```text
DB_PORT=abc
```

La configuración final deberá comprobar que represente un puerto válido.

---

# 22. Evolución futura de `env.js`

En CHECKPOINT 2/3 ampliaremos esta configuración con:

```text
JWT_SECRET
JWT_ACCESS_EXPIRES_IN
REFRESH_TOKEN_DAYS
FRONTEND_URL
APP_TIMEZONE
NODE_ENV
```

No necesitamos bloquear ahora el servidor por un `JWT_SECRET` que todavía no utilizamos.

---

# 23. Crear pool

Archivo:

```text
backend/src/db/pool.js
```

Conceptualmente:

```javascript
import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

export const pool = new Pool({
    host: env.db.host,
    port: env.db.port,
    database: env.db.name,
    user: env.db.user,
    password: env.db.password,
});
```

---

# 24. ¿Qué es un Pool?

Incorrecto conceptualmente:

```text
petición
→ abrir conexión
→ cerrar
→ petición
→ abrir conexión
→ cerrar
```

Preferimos:

```text
Pool
├── conexión disponible
├── conexión disponible
└── ...
```

Node reutiliza conexiones.

---

# 25. Regla CP1-DB-001

Solo debe existir una configuración central del pool.

No queremos:

```text
new Pool()
```

dentro de:

```text
usuarios.repository.js
lecturas.repository.js
sesiones.repository.js
```

---

# 26. Probar conexión

Crear:

```text
backend/scripts/db-check.js
```

Conceptualmente:

```javascript
import { pool } from '../src/db/pool.js';

try {
    const resultado = await pool.query(`
        SELECT
            current_database() AS base,
            current_user AS usuario,
            CURRENT_TIMESTAMP AS fecha
    `);

    console.log('Conexión PostgreSQL correcta.');
    console.table(resultado.rows);
} catch (error) {
    console.error('No se pudo conectar a PostgreSQL.');
    process.exitCode = 1;
} finally {
    await pool.end();
}
```

---

# 27. Script npm

Agregar:

```json
"db:check": "node scripts/db-check.js"
```

---

# 28. Ejecutar

```bash
npm run db:check
```

Esperado:

```text
Conexión PostgreSQL correcta.
```

y algo equivalente a:

```text
base                 usuario
consumo_electrico    consumo_app
```

---

# 29. Primer gate de CHECKPOINT 1

No continuamos con migraciones hasta comprobar:

```text
Node
↓
pg
↓
PostgreSQL

PASS
```

---

# 30. ¿Qué es una migración?

Una migración representa un cambio versionado en la estructura de la base.

Ejemplo:

```text
001 → crear esquema inicial
002 → agregar sesiones
003 → cambio futuro
```

---

# 31. No usar un único archivo mutable

No queremos:

```text
schema.sql
```

editado eternamente sin saber qué cambió.

La historia oficial será:

```text
001
002
003
004
...
```

---

# 32. Estructura

```text
backend/database/
├── migrations/
│   ├── 001_esquema_inicial.sql
│   └── 002_sesiones.sql
│
└── seeds/
    └── 001_medidor_principal.sql
```

---

# 33. Tabla técnica `schema_migrations`

Necesitamos saber qué migraciones ya fueron aplicadas.

Por eso el ejecutor creará automáticamente:

```text
schema_migrations
```

---

# 34. Estructura

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    aplicada_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

# 35. ¿Por qué no es una migración normal?

Tenemos un pequeño problema lógico:

```text
Para saber qué migraciones ejecutar
necesitamos schema_migrations.
```

Por eso el propio ejecutor garantiza primero que esta tabla técnica exista.

Después procesa:

```text
001
002
003...
```

---

# 36. Estado esperado

```text
schema_migrations

version | nombre
--------|------------------
001     | esquema_inicial
002     | sesiones
```

---

# 37. Ejecutor de migraciones

Crear:

```text
backend/scripts/migrate.js
```

Su responsabilidad será:

```text
1. conectar a PostgreSQL
2. crear schema_migrations si no existe
3. leer database/migrations
4. ordenar archivos
5. consultar migraciones aplicadas
6. ejecutar solo pendientes
7. registrar cada migración
8. cerrar conexión
```

---

# 38. Formato permitido

Archivos:

```text
001_nombre.sql
002_nombre.sql
003_nombre.sql
```

---

# 39. No ejecutar cualquier archivo

El ejecutor deberá ignorar archivos que no cumplan el patrón esperado.

Conceptualmente:

```text
^\d{3}_.+\.sql$
```

---

# 40. Orden

Debe ser:

```text
001
002
003
```

Nunca depender del orden aleatorio del sistema de archivos.

---

# 41. Migraciones transaccionales

Cada migración se ejecutará dentro de:

```text
BEGIN
...
COMMIT
```

---

# 42. Si falla

```text
BEGIN
↓
SQL
↓
ERROR
↓
ROLLBACK
```

No debe registrarse como aplicada.

---

# 43. Pseudoflujo del ejecutor

```text
for cada migración pendiente:

    BEGIN

    ejecutar SQL

    INSERT schema_migrations

    COMMIT
```

Si ocurre error:

```text
ROLLBACK
detener ejecución
```

---

# 44. No editar migraciones ya compartidas

Si:

```text
001
```

ya fue aplicada y versionada, no deberíamos modificarla posteriormente para añadir una columna.

Creamos:

```text
003_agregar_columna_x.sql
```

---

# 45. Script npm

Agregar:

```json
"db:migrate": "node scripts/migrate.js"
```

---

# 46. Migración `001_esquema_inicial.sql`

Ubicación:

```text
backend/database/migrations/001_esquema_inicial.sql
```

Esta migración implementará:

```text
usuarios
medidores
lecturas_medidor
índice de correo
```

---

# 47. Tabla `usuarios`

SQL:

```sql
CREATE TABLE usuarios (
    id_usuario BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(254) NOT NULL,
    password_hash TEXT NOT NULL,

    rol VARCHAR(20) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    tema VARCHAR(20) NOT NULL DEFAULT 'SISTEMA',

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_usuarios_nombre_no_vacio
        CHECK (BTRIM(nombre) <> ''),

    CONSTRAINT chk_usuarios_correo_no_vacio
        CHECK (BTRIM(correo) <> ''),

    CONSTRAINT chk_usuarios_rol
        CHECK (rol IN ('ADMIN', 'USUARIO')),

    CONSTRAINT chk_usuarios_estado
        CHECK (estado IN ('ACTIVO', 'INACTIVO')),

    CONSTRAINT chk_usuarios_tema
        CHECK (tema IN ('SISTEMA', 'CLARO', 'OSCURO'))
);
```

---

# 48. Correo normalizado único

Después:

```sql
CREATE UNIQUE INDEX ux_usuarios_correo_normalizado
ON usuarios (LOWER(BTRIM(correo)));
```

---

# 49. ¿Por qué índice normalizado?

Queremos considerar iguales:

```text
Usuario@Correo.com
usuario@correo.com
```

y también:

```text
 usuario@correo.com 
```

frente a:

```text
usuario@correo.com
```

---

# 50. Tabla `medidores`

```sql
CREATE TABLE medidores (
    id_medidor BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    nombre VARCHAR(100) NOT NULL,
    unidad VARCHAR(10) NOT NULL DEFAULT 'kWh',
    activo BOOLEAN NOT NULL DEFAULT TRUE,

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_medidores_nombre_no_vacio
        CHECK (BTRIM(nombre) <> ''),

    CONSTRAINT chk_medidores_unidad
        CHECK (unidad = 'kWh')
);
```

---

# 51. Tabla `lecturas_medidor`

```sql
CREATE TABLE lecturas_medidor (
    id_lectura BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_medidor BIGINT NOT NULL,
    id_usuario_registro BIGINT NOT NULL,
    id_usuario_actualizacion BIGINT NULL,

    valor_lectura BIGINT NOT NULL,
    fecha_lectura DATE NOT NULL,

    registrado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_lecturas_medidor
        FOREIGN KEY (id_medidor)
        REFERENCES medidores (id_medidor)
        ON DELETE RESTRICT,

    CONSTRAINT fk_lecturas_usuario_registro
        FOREIGN KEY (id_usuario_registro)
        REFERENCES usuarios (id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT fk_lecturas_usuario_actualizacion
        FOREIGN KEY (id_usuario_actualizacion)
        REFERENCES usuarios (id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT chk_lecturas_valor_no_negativo
        CHECK (valor_lectura >= 0),

    CONSTRAINT uq_lecturas_medidor_fecha
        UNIQUE (id_medidor, fecha_lectura)
);
```

---

# 52. Qué NO almacena la tabla

No contiene:

```text
consumo_diario
consumo_semanal
consumo_mensual
consumo_anual
```

porque todos son:

```text
datos derivados
```

---

# 53. Migración completa `001`

El archivo deberá contener en orden:

```text
1. usuarios
2. índice usuarios
3. medidores
4. lecturas_medidor
```

---

# 54. ¿Por qué este orden?

`lecturas_medidor` referencia:

```text
usuarios
medidores
```

Por eso esas tablas deben existir primero.

---

# 55. Migración `002_sesiones.sql`

Ubicación:

```text
backend/database/migrations/002_sesiones.sql
```

---

# 56. Tabla `sesiones`

```sql
CREATE TABLE sesiones (
    id_sesion BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_usuario BIGINT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,

    expira_en TIMESTAMPTZ NOT NULL,
    ultimo_uso_en TIMESTAMPTZ NULL,
    revocada_en TIMESTAMPTZ NULL,
    creada_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sesiones_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios (id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT uq_sesiones_token_hash
        UNIQUE (token_hash),

    CONSTRAINT chk_sesiones_token_hash_longitud
        CHECK (CHAR_LENGTH(token_hash) = 64)
);
```

---

# 57. Motivo del `64`

Posteriormente almacenaremos:

```text
SHA-256 en hexadecimal
```

Un SHA-256 hexadecimal tiene:

```text
64 caracteres
```

---

# 58. Todavía no generamos tokens

La tabla existe porque la arquitectura ya la necesita.

Pero todavía:

```text
NO hacemos login
NO generamos refresh token
NO hacemos JWT
```

Eso pertenece a CHECKPOINT 3.

---

# 59. Ejecutar migraciones

Desde:

```text
backend/
```

ejecutar:

```bash
npm run db:migrate
```

---

# 60. Salida esperada

Algo conceptualmente similar a:

```text
Aplicando 001_esquema_inicial.sql...
OK

Aplicando 002_sesiones.sql...
OK

Migraciones completadas.
```

---

# 61. Ejecutar nuevamente

Volver a ejecutar:

```bash
npm run db:migrate
```

Debe responder algo equivalente:

```text
No hay migraciones pendientes.
```

---

# 62. Regla CP1-MIG-001

Ejecutar el comando dos veces NO debe intentar volver a crear:

```text
usuarios
medidores
lecturas_medidor
sesiones
```

---

# 63. Verificar `schema_migrations`

Consulta:

```sql
SELECT
    version,
    nombre,
    aplicada_en
FROM schema_migrations
ORDER BY version;
```

Esperado:

```text
001 | esquema_inicial
002 | sesiones
```

---

# 64. Verificar tablas

Consulta:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Esperado al menos:

```text
lecturas_medidor
medidores
schema_migrations
sesiones
usuarios
```

---

# 65. Seeds

Una migración crea:

```text
estructura
```

Un seed crea:

```text
datos iniciales
```

---

# 66. Seed inicial

Necesitamos:

```text
Medidor principal
```

---

# 67. Archivo

```text
backend/database/seeds/001_medidor_principal.sql
```

---

# 68. Seed idempotente

No queremos crear un medidor nuevo cada vez que ejecutemos el seed.

Utilizaremos algo equivalente a:

```sql
INSERT INTO medidores (
    nombre,
    unidad,
    activo
)
SELECT
    'Medidor principal',
    'kWh',
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM medidores
    WHERE LOWER(BTRIM(nombre)) = LOWER('Medidor principal')
);
```

---

# 69. ¿Por qué no ponemos `UNIQUE(nombre)`?

Porque la arquitectura futura podría permitir nombres iguales en contextos diferentes.

Durante el MVP solo queremos evitar que nuestro seed local duplique accidentalmente el medidor principal.

---

# 70. Ejecutar seeds

Crear:

```text
backend/scripts/seed.js
```

que:

```text
lee database/seeds
↓
ejecuta SQL
↓
finaliza
```

---

# 71. Decisión sobre seeds

A diferencia de migraciones:

```text
los seeds del MVP deben ser idempotentes
```

Así pueden ejecutarse nuevamente sin duplicar el estado inicial.

---

# 72. Script npm

```json
"db:seed": "node scripts/seed.js"
```

---

# 73. Ejecutar

```bash
npm run db:seed
```

---

# 74. Verificar

```sql
SELECT
    id_medidor,
    nombre,
    unidad,
    activo
FROM medidores;
```

Esperado:

```text
1 | Medidor principal | kWh | true
```

El ID exacto no debe utilizarse como regla absoluta.

Lo importante es:

```text
existe exactamente un Medidor principal sembrado
```

---

# 75. Ejecutar seed nuevamente

```bash
npm run db:seed
```

Después:

```sql
SELECT COUNT(*)
FROM medidores
WHERE LOWER(BTRIM(nombre)) = LOWER('Medidor principal');
```

Esperado:

```text
1
```

---

# 76. No crear ADMIN todavía

No utilizaremos:

```sql
INSERT INTO usuarios (...)
VALUES (..., '123456', ...);
```

---

# 77. Motivo

`password_hash` debe contener un hash real generado de manera segura.

Eso llegará cuando introduzcamos:

```text
bcrypt
```

---

# 78. Primer ADMIN

Se implementará posteriormente mediante:

```text
npm run crear-admin
```

en CHECKPOINT 3.

---

# 79. Comandos PostgreSQL que debemos entender

En este checkpoint los estudiantes deben practicar:

```sql
SELECT
INSERT
UPDATE
DELETE
```

aunque la aplicación todavía no utilice todos automáticamente.

También:

```text
PRIMARY KEY
FOREIGN KEY
CHECK
UNIQUE
INDEX
```

---

# 80. Comprobar `CHECK` de rol

Podemos razonar que PostgreSQL no debe aceptar:

```text
rol = CLIENTE
```

Solo:

```text
ADMIN
USUARIO
```

---

# 81. Comprobar estado

Solo:

```text
ACTIVO
INACTIVO
```

---

# 82. Comprobar tema

Solo:

```text
SISTEMA
CLARO
OSCURO
```

---

# 83. Comprobar lectura

PostgreSQL debe rechazar:

```text
valor_lectura = -1
```

---

# 84. Comprobar duplicado diario

No debe ser posible guardar:

```text
Medidor 1 + 30/08
Medidor 1 + 30/08
```

dos veces.

---

# 85. Comprobar FK

No deberá poder crearse una lectura con:

```text
id_usuario_registro
```

que no exista.

---

# 86. Doble capa futura

Posteriormente Express validará estas reglas antes de PostgreSQL.

Pero PostgreSQL continúa siendo:

```text
última barrera de integridad
```

---

# 87. No implementar reglas cronológicas en PostgreSQL

Todavía no haremos triggers para:

```text
lectura actual >= anterior
lectura actual <= siguiente
```

---

# 88. Motivo

Estas reglas dependen de otras filas y pertenecen principalmente al:

```text
servicio de lecturas
```

como definió SPEC-004.

---

# 89. No crear triggers

En CHECKPOINT 1:

```text
TRIGGERS = 0
```

salvo que aparezca una necesidad nueva explícitamente especificada.

---

# 90. `actualizado_en`

No crearemos trigger automático.

Posteriormente los `UPDATE` de aplicación harán:

```sql
actualizado_en = CURRENT_TIMESTAMP
```

explícitamente.

---

# 91. No crear vistas de estadísticas

No necesitamos:

```text
vista_consumo_diario
vista_consumo_mensual
```

todavía.

---

# 92. No crear tabla `consumos`

Sigue prohibido durante el MVP:

```text
consumos
```

como fuente independiente.

---

# 93. No crear tabla `estadisticas`

Tampoco:

```text
estadisticas
```

---

# 94. Scripts backend después del checkpoint

`backend/package.json` debería disponer aproximadamente de:

```json
{
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",
    "db:check": "node scripts/db-check.js",
    "db:migrate": "node scripts/migrate.js",
    "db:seed": "node scripts/seed.js"
  }
}
```

---

# 95. Orden para preparar una instalación nueva

La ruta reproducible será:

```text
1. crear usuario PostgreSQL
2. crear base
3. configurar backend/.env
4. npm install
5. npm run db:check
6. npm run db:migrate
7. npm run db:seed
```

---

# 96. Después

Resultado:

```text
PostgreSQL listo
```

sin necesidad de crear tablas manualmente desde pgAdmin.

---

# 97. Principio importante

pgAdmin puede utilizarse para:

```text
observar
consultar
aprender
```

pero la instalación oficial del proyecto debe ser reproducible mediante:

```text
migraciones
```

---

# 98. ¿Por qué?

No queremos instrucciones como:

```text
abre pgAdmin
crea esta tabla
luego haz clic aquí
después agrega esta columna...
```

porque eso no es reproducible automáticamente.

---

# 99. Migraciones como código

La estructura de la BD debe vivir en:

```text
Git
```

igual que:

```text
JavaScript
React
CSS
```

---

# 100. Verificación automática básica

Podemos crear:

```text
backend/scripts/db-status.js
```

para mostrar las migraciones.

---

# 101. `db-status`

Resultado conceptual:

```text
Migraciones:

001 esquema_inicial   APLICADA
002 sesiones          APLICADA
```

---

# 102. Script

```json
"db:status": "node scripts/db-status.js"
```

---

# 103. Beneficio educativo

Antes de trabajar podremos ejecutar:

```bash
npm run db:status
```

y saber si nuestra base coincide con el código.

---

# 104. Estado limpio

Al finalizar:

```bash
npm run db:check
npm run db:migrate
npm run db:seed
npm run db:status
```

todos deben completar correctamente.

---

# 105. Prueba de reinicio conceptual

La prueba más importante del sistema de migraciones es imaginar una base completamente nueva.

Debe ser posible:

```text
base vacía
↓
db:migrate
↓
db:seed
↓
estructura completa
```

sin pasos manuales de tablas.

---

# 106. Base de pruebas

SPEC-012 exige posteriormente:

```text
consumo_electrico_test
```

No la utilizaremos todavía para desarrollar funcionalidades, pero podemos crearla desde ahora para dejar preparada la infraestructura.

Ejemplo administrativo:

```sql
CREATE DATABASE consumo_electrico_test
OWNER consumo_app;
```

---

# 107. Recomendación

Crear la base de test en CHECKPOINT 1:

```text
SÍ
```

pero todavía no ejecutar pruebas destructivas sobre ella hasta incorporar la infraestructura formal de test.

---

# 108. Variable futura

El entorno de tests utilizará una configuración separada.

Ejemplo conceptual:

```text
DB_NAME=consumo_electrico_test
NODE_ENV=test
```

---

# 109. Regla crítica

Nunca debe ocurrir:

```text
npm test
↓
DELETE datos desarrollo
```

---

# 110. Documentar instalación PostgreSQL

Actualizar README con una sección:

```text
## Base de datos
```

que explique:

```text
crear rol
crear base
configurar .env
ejecutar migraciones
ejecutar seed
comprobar estado
```

---

# 111. No documentar contraseñas reales

Ejemplo README:

```text
DB_PASSWORD=TU_PASSWORD_LOCAL
```

No:

```text
DB_PASSWORD=MiPasswordReal123
```

---

# 112. Estado de SPEC

Después de este checkpoint NO debemos decir:

```text
SPEC-002 → CERRADA
```

automáticamente.

---

# 113. Qué parte sí implementamos

Principalmente:

```text
SPEC-002 → implementación de persistencia base
SPEC-003 → estructura de sesiones únicamente
SPEC-011 → infraestructura DB/migraciones
```

---

# 114. Estado propuesto

Después del gate verde:

```text
SPEC-002 → IMPLEMENTADA
```

pero todavía no necesariamente:

```text
CERRADA
```

hasta que tenga sus pruebas de integración formales correspondientes.

---

# 115. SPEC-003

Continúa:

```text
DISEÑADA
```

porque crear la tabla `sesiones` no significa haber implementado autenticación.

---

# 116. Pruebas manuales/estructurales del checkpoint

Debemos verificar:

```text
conexión PostgreSQL
migraciones aplicadas
migraciones no se repiten
seed no se duplica
tablas existentes
constraints existentes
correo único normalizado
lectura no negativa
duplicado diario bloqueado
FK funcionando
```

---

# 117. Verificación del correo normalizado

La BD deberá impedir conceptualmente:

```text
Usuario@Test.com
usuario@test.com
```

como dos cuentas distintas.

---

# 118. Verificación del tipo de lectura

`valor_lectura` es:

```text
BIGINT
```

Por tanto:

```text
12555
```

es correcto.

Un valor decimal no forma parte del dominio.

---

# 119. Verificación de fechas

`fecha_lectura`:

```text
DATE
```

Mientras:

```text
registrado_en
actualizado_en
```

son:

```text
TIMESTAMPTZ
```

---

# 120. Explicación educativa

```text
DATE
```

responde:

> ¿A qué día pertenece la lectura?

Mientras:

```text
TIMESTAMPTZ
```

responde:

> ¿En qué instante ocurrió esta operación?

---

# 121. Verificación de eliminación

Las relaciones utilizan:

```text
ON DELETE RESTRICT
```

---

# 122. Ejemplo

Si un usuario tiene lecturas:

```text
usuario
  ↓
lectura
```

PostgreSQL no debería permitir eliminarlo físicamente sin resolver esa relación.

Eso apoya nuestra regla:

```text
usuarios se desactivan
no se eliminan
```

---

# 123. No almacenar IDs externos en frontend

Nada de este checkpoint modifica React.

El frontend todavía no necesita saber:

```text
id_medidor = 1
```

---

# 124. No hardcodear `id_medidor = 1` como regla universal

Aunque probablemente el primer medidor tenga ID `1`, la aplicación futura deberá obtener el medidor principal mediante lógica/configuración adecuada.

Nunca debemos depender permanentemente de:

```javascript
const idMedidor = 1;
```

porque una secuencia puede cambiar.

---

# 125. Cómo localizar el medidor del MVP

Posteriormente el repositorio podrá obtener:

```text
medidor activo principal
```

por una consulta explícita.

La decisión exacta se terminará de implementar en CHECKPOINT 5.

---

# 126. No crear múltiples medidores

La arquitectura los podría soportar.

La aplicación del MVP todavía trabajará con:

```text
uno
```

---

# 127. Git — antes del commit

Ejecutar:

```bash
git status
```

Comprobar especialmente que NO aparezca:

```text
backend/.env
```

---

# 128. Revisar archivos

Deben aparecer aproximadamente:

```text
backend/package.json
backend/package-lock.json
backend/.env.example
backend/src/config/env.js
backend/src/db/pool.js
backend/database/migrations/001_esquema_inicial.sql
backend/database/migrations/002_sesiones.sql
backend/database/seeds/001_medidor_principal.sql
backend/scripts/db-check.js
backend/scripts/migrate.js
backend/scripts/seed.js
backend/scripts/db-status.js
README.md
```

---

# 129. Commit

Después del gate:

```bash
git add .
git status
```

Revisar.

Luego:

```bash
git commit -m "feat: configurar PostgreSQL y migraciones iniciales"
```

---

# 130. Estado final Git

```bash
git status
```

Esperado:

```text
nothing to commit, working tree clean
```

---

# 131. Gate CHECKPOINT 1

## CP1-001

PostgreSQL funciona localmente.

## CP1-002

Existe usuario de aplicación sin superusuario.

## CP1-003

Existe `consumo_electrico`.

## CP1-004

Node se conecta usando `pg`.

## CP1-005

La conexión utiliza variables de entorno.

## CP1-006

Existe pool centralizado.

## CP1-007

Existe `schema_migrations`.

## CP1-008

Existe ejecutor de migraciones.

## CP1-009

Las migraciones se ejecutan en orden.

## CP1-010

Las migraciones ya aplicadas no se repiten.

## CP1-011

Cada migración es transaccional.

## CP1-012

Existe `usuarios`.

## CP1-013

Existe índice único de correo normalizado.

## CP1-014

Existe `medidores`.

## CP1-015

Existe `lecturas_medidor`.

## CP1-016

Existe `sesiones`.

## CP1-017

Las claves foráneas están activas.

## CP1-018

Los `CHECK` están activos.

## CP1-019

La regla de una lectura por medidor/día está en PostgreSQL.

## CP1-020

Existe seed del medidor principal.

## CP1-021

El seed es idempotente.

## CP1-022

No existe tabla `consumos`.

## CP1-023

No existe tabla de estadísticas.

## CP1-024

No existen triggers innecesarios.

## CP1-025

`.env` no está versionado.

## CP1-026

README explica preparación de BD.

## CP1-027

Existe commit del checkpoint.

## CP1-028

Working tree queda limpio.

---

# 132. Estado al cerrar CHECKPOINT 1

```text
FASE ESPECIFICACIÓN
===================

SPEC-000 a SPEC-012
→ DISEÑADAS


FASE IMPLEMENTACIÓN
===================

CHECKPOINT 0
Inicialización
→ CERRADO

CHECKPOINT 1
PostgreSQL y migraciones
→ CERRADO

CHECKPOINT 2
Backend base y seguridad
→ SIGUIENTE

CHECKPOINT 3
Autenticación
→ PENDIENTE

CHECKPOINT 4
Administración usuarios
→ PENDIENTE

CHECKPOINT 5
Lecturas
→ PENDIENTE

CHECKPOINT 6
Estadísticas
→ PENDIENTE

CHECKPOINT 7
Frontend base
→ PENDIENTE

CHECKPOINT 8
Dashboard
→ PENDIENTE

CHECKPOINT 9
Historial
→ PENDIENTE

CHECKPOINT 10
Perfil y temas
→ PENDIENTE

CHECKPOINT 11
Responsive y accesibilidad
→ PENDIENTE

CHECKPOINT 12
E2E y cierre MVP
→ PENDIENTE
```

---

# 133. Qué todavía NO existe

Después de CHECKPOINT 1 todavía:

```text
NO hay login
NO hay JWT
NO hay bcrypt
NO hay usuarios reales de la aplicación
NO hay API de usuarios
NO hay API de lecturas
NO hay estadísticas
NO hay dashboard
```

Solo tenemos:

```text
infraestructura PostgreSQL reproducible
```

---

# 134. Qué sigue

El siguiente bloque será:

```text
CHECKPOINT 2
Backend base y seguridad transversal
```

Ahí implementaremos:

```text
configuración completa
CORS
Helmet
requestId
body limits
rate limiting base
validación
errores centralizados
404 API
logging seguro
estructura AppError
helpers de transacción
base de pruebas backend
Vitest + Supertest
```

Todavía sin implementar login.

---

# 135. Criterio pedagógico de cierre

Un aprendiz debe ser capaz de explicar:

1. ¿Por qué la aplicación no usa el usuario `postgres`?
2. ¿Qué hace `pg`?
3. ¿Qué es un pool?
4. ¿Qué problema resuelven las migraciones?
5. ¿Qué hace `schema_migrations`?
6. ¿Qué diferencia existe entre migración y seed?
7. ¿Por qué una migración usa transacción?
8. ¿Por qué una migración aplicada no debe editarse?
9. ¿Qué es una PK?
10. ¿Qué es una FK?
11. ¿Qué hace `ON DELETE RESTRICT`?
12. ¿Qué hace `CHECK`?
13. ¿Qué hace `UNIQUE`?
14. ¿Por qué el correo utiliza un índice normalizado?
15. ¿Por qué `valor_lectura` es `BIGINT`?
16. ¿Por qué `fecha_lectura` es `DATE`?
17. ¿Por qué `registrado_en` utiliza `TIMESTAMPTZ`?
18. ¿Por qué no existe una tabla `consumos`?
19. ¿Por qué no utilizamos triggers para la secuencia del medidor?
20. ¿Cómo reconstruimos una base nueva desde cero?

Cuando estas respuestas y todos los criterios `CP1-*` estén verdes:

```text
CHECKPOINT 1 → CERRADO
```
