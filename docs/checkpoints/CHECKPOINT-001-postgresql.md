# CHECKPOINT 1 — PostgreSQL, conexión, migraciones y seeds

## Objetivo

Dejar PostgreSQL listo para el proyecto y conseguir que el backend pueda:

- conectarse a PostgreSQL;
- crear la estructura de la base automáticamente;
- recordar qué migraciones ya fueron aplicadas;
- insertar datos iniciales sin duplicarlos;
- trabajar con una base de desarrollo y otra de pruebas.

Al finalizar deben funcionar:

```bash
npm run db:check
npm run db:migrate
npm run db:seed
npm run db:status

npm run db:check:test
npm run db:migrate:test
npm run db:seed:test
npm run db:status:test
```

---

# 1. Conceptos mínimos

| Concepto | Significado |
|---|---|
| PostgreSQL | Motor de base de datos |
| pgAdmin | Interfaz gráfica para administrar PostgreSQL |
| Base de datos | Donde se guardan los datos del proyecto |
| Tabla | Estructura de filas y columnas |
| Migración | Archivo SQL que crea o modifica estructura |
| Seed | Archivo SQL que inserta datos iniciales |
| `schema_migrations` | Tabla técnica que recuerda migraciones aplicadas |

Regla principal:

```text
Migración → estructura
Seed      → datos iniciales
```

---

# 2. Crear usuario PostgreSQL

En pgAdmin:

```text
Servers
→ PostgreSQL
→ Login/Group Roles
→ Create
→ Login/Group Role
```

Crear:

```text
Nombre: consumo_app
Can login: YES
Superuser: NO
Create roles: NO
Create databases: NO
```

Asignar una contraseña local segura.

No usar el usuario `postgres` dentro de la aplicación.

---

# 3. Crear bases de datos

Crear:

```text
consumo_electrico
consumo_electrico_test
```

En ambas:

```text
Owner = consumo_app
```

Uso:

```text
consumo_electrico
→ desarrollo

consumo_electrico_test
→ pruebas automáticas
```

---

# 4. Dependencias backend

Desde:

```text
backend/
```

ejecutar:

```bash
npm install pg dotenv
```

Para los scripts de este checkpoint usaremos Node.js `20.6+` y su opción:

```text
--env-file
```

Comprobar:

```bash
node -v
```

---

# 5. Variables de entorno

## `backend/.env`

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=consumo_electrico
DB_USER=consumo_app
DB_PASSWORD=TU_CONTRASENA
```

## `backend/.env.test`

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=consumo_electrico_test
DB_USER=consumo_app
DB_PASSWORD=TU_CONTRASENA
```

No subir `.env` ni `.env.test` a Git.

---

# 6. Archivos de ejemplo

## `backend/.env.example`

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=consumo_electrico
DB_USER=consumo_app
DB_PASSWORD=
```

## `backend/.env.test.example`

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=consumo_electrico_test
DB_USER=consumo_app
DB_PASSWORD=
```

---

# 7. `.gitignore`

Debe proteger:

```gitignore
.env
.env.*
!.env.example
!.env.test.example

node_modules/
coverage/
dist/
```

---

# 8. Estructura de base de datos

Crear:

```text
backend/
├── database/
│   ├── migrations/
│   └── seeds/
└── scripts/
```

---

# 9. Migración 001 — esquema inicial

Crear:

```text
backend/database/migrations/001_esquema_inicial.sql
```

Contenido exacto:

```sql
CREATE TABLE usuarios (
    id_usuario BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    nombre VARCHAR(100) NOT NULL,

    correo VARCHAR(254) NOT NULL,

    password_hash TEXT NOT NULL,

    rol VARCHAR(20) NOT NULL
        CHECK (rol IN ('ADMIN', 'USUARIO')),

    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'INACTIVO')),

    tema VARCHAR(20) NOT NULL DEFAULT 'SISTEMA'
        CHECK (tema IN ('SISTEMA', 'CLARO', 'OSCURO')),

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (BTRIM(nombre) <> ''),
    CHECK (BTRIM(correo) <> '')
);

CREATE UNIQUE INDEX ux_usuarios_correo_normalizado
ON usuarios (LOWER(BTRIM(correo)));


CREATE TABLE medidores (
    id_medidor BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    nombre VARCHAR(100) NOT NULL,

    unidad VARCHAR(10) NOT NULL DEFAULT 'kWh'
        CHECK (unidad = 'kWh'),

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (BTRIM(nombre) <> '')
);


CREATE TABLE lecturas_medidor (
    id_lectura BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_medidor BIGINT NOT NULL
        REFERENCES medidores(id_medidor)
        ON DELETE RESTRICT,

    id_usuario_registro BIGINT NOT NULL
        REFERENCES usuarios(id_usuario)
        ON DELETE RESTRICT,

    id_usuario_actualizacion BIGINT
        REFERENCES usuarios(id_usuario)
        ON DELETE RESTRICT,

    valor_lectura BIGINT NOT NULL
        CHECK (valor_lectura >= 0),

    fecha_lectura DATE NOT NULL,

    registrado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (id_medidor, fecha_lectura)
);
```

---

# 10. Migración 002 — sesiones

Crear:

```text
backend/database/migrations/002_sesiones.sql
```

Contenido exacto:

```sql
CREATE TABLE sesiones (
    id_sesion BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_usuario BIGINT NOT NULL
        REFERENCES usuarios(id_usuario)
        ON DELETE RESTRICT,

    token_hash VARCHAR(64) NOT NULL UNIQUE
        CHECK (CHAR_LENGTH(token_hash) = 64),

    expira_en TIMESTAMPTZ NOT NULL,

    ultimo_uso_en TIMESTAMPTZ,

    revocada_en TIMESTAMPTZ,

    creada_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Regla importante:

```text
Una migración ya aplicada NO se modifica.
Un cambio nuevo se agrega en una migración nueva.
```

---

# 11. Seed — Medidor principal

Crear:

```text
backend/database/seeds/001_medidor_principal.sql
```

Contenido exacto:

```sql
INSERT INTO medidores (
    nombre
)
SELECT
    'Medidor principal'
WHERE NOT EXISTS (
    SELECT 1
    FROM medidores
    WHERE nombre = 'Medidor principal'
);
```

Este seed es idempotente:

```text
ejecutarlo varias veces
→ no duplica Medidor principal
```

---

# 12. Script `db-check.js`

Crear:

```text
backend/scripts/db-check.js
```

Contenido completo:

```javascript
import pg from 'pg';

const { Client } = pg;

const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

try {
  await client.connect();

  console.log('✅ Conexión PostgreSQL correcta.');
  console.log(`📦 Base de datos: ${process.env.DB_NAME}`);
} catch (error) {
  console.error('❌ No se pudo conectar con PostgreSQL.');
  console.error(error.message);

  process.exitCode = 1;
} finally {
  await client.end();
}
```

---

# 13. Script `db-migrate.js`

Crear:

```text
backend/scripts/db-migrate.js
```

Contenido completo:

```javascript
import pg from 'pg';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(
  __dirname,
  '..',
  'database',
  'migrations'
);

const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function ejecutarMigraciones() {
  try {
    await client.connect();

    console.log('✅ Conectado a PostgreSQL.');
    console.log(`📦 Base de datos: ${process.env.DB_NAME}`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(20) PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        aplicada_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Tabla schema_migrations lista.');

    const archivos = await readdir(migrationsDir);

    const migraciones = archivos
      .filter((archivo) => /^\d{3}_.+\.sql$/.test(archivo))
      .sort();

    console.log('📂 Migraciones encontradas:', migraciones);

    for (const archivo of migraciones) {
      const version = archivo.slice(0, 3);

      const rutaArchivo = path.join(
        migrationsDir,
        archivo
      );

      const resultado = await client.query(
        `
          SELECT version
          FROM schema_migrations
          WHERE version = $1;
        `,
        [version]
      );

      const yaAplicada = resultado.rowCount > 0;

      if (yaAplicada) {
        console.log(`✅ ${archivo} — YA APLICADA`);
        continue;
      }

      console.log(`⏳ ${archivo} — PENDIENTE`);

      const sql = await readFile(
        rutaArchivo,
        'utf8'
      );

      try {
        await client.query('BEGIN');

        await client.query(sql);

        await client.query(
          `
            INSERT INTO schema_migrations (
              version,
              nombre
            )
            VALUES ($1, $2);
          `,
          [version, archivo]
        );

        await client.query('COMMIT');

        console.log(`✅ ${archivo} — APLICADA`);
      } catch (error) {
        await client.query('ROLLBACK');

        throw error;
      }
    }
  } catch (error) {
    console.error('❌ Error ejecutando migraciones.');
    console.error(error.message);

    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

await ejecutarMigraciones();
```

Funcionamiento:

```text
leer migrations/
→ ordenar
→ comprobar schema_migrations
→ ejecutar solo pendientes
→ BEGIN
→ SQL
→ registrar versión
→ COMMIT
```

Si falla:

```text
ROLLBACK
```

---

# 14. Script `db-seed.js`

Crear:

```text
backend/scripts/db-seed.js
```

Contenido completo:

```javascript
import pg from 'pg';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedsDir = path.join(
  __dirname,
  '..',
  'database',
  'seeds'
);

const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function ejecutarSeeds() {
  try {
    await client.connect();

    console.log('✅ Conectado a PostgreSQL.');
    console.log(`📦 Base de datos: ${process.env.DB_NAME}`);

    const archivos = await readdir(seedsDir);

    const seeds = archivos
      .filter((archivo) => /^\d{3}_.+\.sql$/.test(archivo))
      .sort();

    console.log('🌱 Seeds encontrados:', seeds);

    for (const archivo of seeds) {
      const rutaArchivo = path.join(
        seedsDir,
        archivo
      );

      const sql = await readFile(
        rutaArchivo,
        'utf8'
      );

      await client.query(sql);

      console.log(`✅ ${archivo} — EJECUTADO`);
    }
  } catch (error) {
    console.error('❌ Error ejecutando seeds.');
    console.error(error.message);

    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

await ejecutarSeeds();
```

---

# 15. Script `db-status.js`

Crear:

```text
backend/scripts/db-status.js
```

Contenido completo:

```javascript
import pg from 'pg';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(
  __dirname,
  '..',
  'database',
  'migrations'
);

const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function mostrarEstadoMigraciones() {
  try {
    await client.connect();

    console.log('✅ Conectado a PostgreSQL.');
    console.log(`📦 Base de datos: ${process.env.DB_NAME}`);
    console.log('');

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(20) PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        aplicada_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const archivos = await readdir(migrationsDir);

    const migraciones = archivos
      .filter((archivo) => /^\d{3}_.+\.sql$/.test(archivo))
      .sort();

    if (migraciones.length === 0) {
      console.log('ℹ️ No se encontraron migraciones.');
      return;
    }

    for (const archivo of migraciones) {
      const version = archivo.slice(0, 3);

      const resultado = await client.query(
        `
          SELECT version
          FROM schema_migrations
          WHERE version = $1;
        `,
        [version]
      );

      const aplicada = resultado.rowCount > 0;

      if (aplicada) {
        console.log(`✅ ${archivo} — APLICADA`);
      } else {
        console.log(`⏳ ${archivo} — PENDIENTE`);
      }
    }
  } catch (error) {
    console.error('❌ Error consultando estado de migraciones.');
    console.error(error.message);

    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

await mostrarEstadoMigraciones();
```

---

# 16. Scripts de `package.json`

Dentro de `"scripts"` deben existir:

```json
"db:check": "node --env-file=.env scripts/db-check.js",
"db:migrate": "node --env-file=.env scripts/db-migrate.js",
"db:seed": "node --env-file=.env scripts/db-seed.js",
"db:status": "node --env-file=.env scripts/db-status.js",

"db:check:test": "node --env-file=.env.test scripts/db-check.js",
"db:migrate:test": "node --env-file=.env.test scripts/db-migrate.js",
"db:seed:test": "node --env-file=.env.test scripts/db-seed.js",
"db:status:test": "node --env-file=.env.test scripts/db-status.js"
```

No reemplazar el resto de scripts existentes del proyecto.

---

# 17. Flujo de desarrollo

Primera preparación:

```bash
npm run db:check
npm run db:migrate
npm run db:seed
npm run db:status
```

Resultado esperado:

```text
Base: consumo_electrico

001_esquema_inicial.sql → APLICADA
002_sesiones.sql        → APLICADA
```

Y:

```text
Medidor principal
```

debe existir una sola vez.

---

# 18. Flujo de pruebas

```bash
npm run db:check:test
npm run db:migrate:test
npm run db:seed:test
npm run db:status:test
```

Resultado esperado:

```text
Base: consumo_electrico_test

001_esquema_inicial.sql → APLICADA
002_sesiones.sql        → APLICADA
```

---

# 19. Comprobaciones SQL

## Migraciones

En ambas bases:

```sql
SELECT
    version,
    nombre
FROM schema_migrations
ORDER BY version;
```

Debe devolver:

```text
001 | 001_esquema_inicial.sql
002 | 002_sesiones.sql
```

## Medidor principal

```sql
SELECT
    id_medidor,
    nombre,
    unidad,
    activo
FROM medidores;
```

Debe existir:

```text
Medidor principal
kWh
true
```

No depender de que `id_medidor` sea `1`.

## Idempotencia del seed

```sql
SELECT COUNT(*) AS cantidad
FROM medidores
WHERE nombre = 'Medidor principal';
```

Debe devolver:

```text
1
```

incluso después de ejecutar varias veces:

```bash
npm run db:seed
```

---

# 20. Estructura final esperada

```text
backend/
├── database/
│   ├── migrations/
│   │   ├── 001_esquema_inicial.sql
│   │   └── 002_sesiones.sql
│   │
│   └── seeds/
│       └── 001_medidor_principal.sql
│
├── scripts/
│   ├── db-check.js
│   ├── db-migrate.js
│   ├── db-seed.js
│   └── db-status.js
│
├── .env
├── .env.test
├── .env.example
├── .env.test.example
├── package.json
└── package-lock.json
```

PostgreSQL:

```text
consumo_electrico
├── usuarios
├── medidores
├── lecturas_medidor
├── sesiones
└── schema_migrations

consumo_electrico_test
├── usuarios
├── medidores
├── lecturas_medidor
├── sesiones
└── schema_migrations
```

---

# 21. Qué NO debe existir todavía

```text
ADMIN hardcodeado
datos de usuarios reales
lecturas reales
tabla consumos
tabla estadisticas
triggers
Redis
ORM
```

El primer ADMIN se creará más adelante mediante:

```text
npm run crear-admin
```

en CHECKPOINT 3.

---

# 22. Gate final CHECKPOINT 1

Comprobar:

```text
[ ] PostgreSQL funciona
[ ] pgAdmin conecta
[ ] existe consumo_app
[ ] consumo_app no es superusuario
[ ] existe consumo_electrico
[ ] existe consumo_electrico_test

[ ] npm run db:check funciona
[ ] npm run db:check:test funciona

[ ] existe 001_esquema_inicial.sql
[ ] existe 002_sesiones.sql

[ ] npm run db:migrate funciona
[ ] npm run db:migrate:test funciona
[ ] 001 está aplicada
[ ] 002 está aplicada
[ ] las migraciones no se repiten

[ ] existe 001_medidor_principal.sql
[ ] npm run db:seed funciona
[ ] npm run db:seed:test funciona
[ ] el seed no duplica Medidor principal

[ ] npm run db:status funciona
[ ] npm run db:status:test funciona

[ ] desarrollo usa consumo_electrico
[ ] tests usan consumo_electrico_test

[ ] .env no está versionado
[ ] .env.test no está versionado
[ ] existen .env.example y .env.test.example

[ ] usuarios está vacío
[ ] existe exactamente un Medidor principal
```

Si todo está verde:

```text
CHECKPOINT 1
PostgreSQL, conexión y sistema de migraciones
→ CERRADO
```

---

# 23. Commit

Antes:

```bash
git status
```

Verificar que no aparezcan secretos.

Después:

```bash
git add .
git status
git commit -m "feat: configurar PostgreSQL y migraciones iniciales"
git status
```

Resultado esperado:

```text
nothing to commit, working tree clean
```

---

# 24. Lo que debe saber explicar el aprendiz

Al terminar este checkpoint debe comprender:

```text
PostgreSQL
→ almacena los datos

pgAdmin
→ permite administrarlo visualmente

consumo_app
→ usuario PostgreSQL de la aplicación

Migración
→ modifica estructura

schema_migrations
→ recuerda migraciones aplicadas

Seed
→ agrega datos iniciales

db:check
→ comprueba conexión

db:migrate
→ aplica estructura pendiente

db:seed
→ ejecuta datos iniciales

db:status
→ consulta estado

consumo_electrico
→ desarrollo

consumo_electrico_test
→ pruebas
```

---

# Estado del roadmap

```text
CHECKPOINT 0
Inicialización
→ CERRADO

CHECKPOINT 1
PostgreSQL, conexión y migraciones
→ CERRADO

CHECKPOINT 2
Backend base, seguridad y pruebas
→ SIGUIENTE
```
