# CHECKPOINT 1 — PostgreSQL, migraciones y seeds 🏪

> **Etiqueta Git:** `cp1` · **Commit:** `feat: configurar PostgreSQL y migraciones iniciales`
>
> Guía original usada: [`CHECKPOINT-001-postgresql.md`](../checkpoints/CHECKPOINT-001-postgresql.md) (versión simplificada del CP1, ver [D-001](../DECISIONES.md)).

## 🎯 Objetivo

Construir **la bodega** del restaurante y dejar que el backend pueda:

- conectarse a PostgreSQL;
- crear todas las tablas **automáticamente**;
- recordar qué cambios ya aplicó;
- insertar los datos iniciales **sin duplicarlos**;
- trabajar con una base de **desarrollo** y otra de **pruebas**.

---

## 📚 Palabras nuevas

| Palabra | Significado sencillo |
|---|---|
| **PostgreSQL** | El motor de base de datos: la bodega 🏪 |
| **pgAdmin** | La ventana para mirar y administrar la bodega |
| **Rol** | Un usuario de PostgreSQL, con su llave y sus permisos 🔑 |
| **Migración** | Un archivo `.sql` numerado que construye o cambia las tablas. Como los planos de una ampliación: se aplican en orden y una sola vez |
| **Seed** | Datos iniciales que la app necesita para funcionar (la "semilla") 🌱 |
| **Idempotente** | Que se puede repetir sin romper nada. Ejecutar el seed 5 veces deja el mismo resultado que ejecutarlo 1 vez |

---

## 1. Crear el rol de la aplicación (pgAdmin)

`Servers → PostgreSQL → Login/Group Roles → Create → Login/Group Role`

```text
Nombre:            consumo_app
Can login:         YES
Superuser:         NO
Create roles:      NO
Create databases:  NO
```

Asígnale una contraseña local segura.

> 🔑 **La app nunca usa `postgres`.** `postgres` es la llave maestra de todo el edificio. La app recibe una llave que **solo abre su propia bodega**. Si algún día alguien roba esa llave, el daño queda limitado.

## 2. Crear las dos bases de datos

| Base | Uso | Owner |
|---|---|---|
| `consumo_electrico` | Desarrollo (tus datos de trabajo) | `consumo_app` |
| `consumo_electrico_test` | Pruebas automáticas (base de juguete 🧸) | `consumo_app` |

> ¿Por qué dos? Porque las pruebas automáticas **crean y borran datos**. Nunca deben tocar tus datos reales.

## 3. Instalar dependencias

Dentro de `backend`:

```powershell
npm install pg dotenv
node -v
```

| Paquete | Para qué |
|---|---|
| `pg` | Hablar con PostgreSQL desde Node |
| `dotenv` | Leer el archivo `.env` desde la aplicación |

Los scripts de base de datos usan la opción `node --env-file`, que necesita **Node 20.6 o superior**.

---

## 4. Las libretas de configuración

`backend/.env` (desarrollo):

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=consumo_electrico
DB_USER=consumo_app
DB_PASSWORD=TU_CONTRASENA
```

`backend/.env.test` (pruebas):

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=consumo_electrico_test
DB_USER=consumo_app
DB_PASSWORD=TU_CONTRASENA
```

Y sus plantillas sin contraseña: `.env.example` y `.env.test.example`.

> 🔄 En el CP2-C estas libretas ganaron más variables (`PORT`, `FRONTEND_URL`, `APP_TIMEZONE`). Si instalas desde `main`, copia los `.env.example` actuales.

### Reforzar `.gitignore`

```gitignore
.env
.env.*
!.env.example
!.env.test.example
node_modules/
coverage/
dist/
```

El `!` significa **"excepto"**: se ignoran todos los `.env*` **excepto** las dos plantillas.

---

## 5. La estructura de la bodega (migraciones)

```text
backend/database/
├── migrations/
│   ├── 001_esquema_inicial.sql
│   └── 002_sesiones.sql
└── seeds/
    └── 001_medidor_principal.sql
```

### Migración 001 — esquema inicial

Crea las tablas principales:

| Tabla | Qué guarda |
|---|---|
| `usuarios` | Las personas que usan la app (con correo único, sin distinguir mayúsculas) |
| `medidores` | El medidor eléctrico de la casa (en el MVP, solo uno) |
| `lecturas_medidor` | La numeración del medidor de cada día |

Reglas importantes que **la propia base de datos** protege:

- ✅ **Una sola lectura por día** para el medidor.
- ✅ Las lecturas son **enteros** y **no negativos**.
- ✅ No puede haber dos usuarios con el mismo correo.

> 💡 **No existe una tabla de "consumos".** El consumo se **calcula** a partir de las lecturas (`lecturaActual - lecturaAnterior`). Guardar el consumo aparte sería duplicar datos, y los datos duplicados terminan contradiciéndose. Las lecturas son la **única fuente de verdad**.

### Migración 002 — sesiones

Crea la tabla `sesiones`, que se usará en el CP3 para el login.

### Seed — Medidor principal 🌱

Inserta el `Medidor principal` (unidad `kWh`) **solo si no existe**. Por eso se puede ejecutar varias veces sin duplicarlo: es **idempotente**.

---

## 6. Los scripts de la bodega

Cuatro scripts en `backend/scripts/`, **cada uno hace una sola cosa**:

| Script | Qué hace |
|---|---|
| `db-check.js` | "¿La bodega responde?" Prueba la conexión |
| `db-migrate.js` | Lee los `.sql` de `migrations/` en orden, aplica **solo los nuevos** y los anota en la tabla `schema_migrations` |
| `db-seed.js` | Ejecuta los seeds |
| `db-status.js` | Muestra qué migraciones están aplicadas |

¿Cómo sabe el migrador qué ya aplicó? Lleva una **libreta de obra** 📋: la tabla `schema_migrations`. Cada migración aplicada se anota ahí. La próxima vez, se salta las que ya están anotadas.

Scripts en `backend/package.json`:

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

Fíjate en el truco: **el mismo script** sirve para las dos bases. Lo único que cambia es **qué libreta** se le entrega (`.env` o `.env.test`).

---

## 7. Primera preparación

**Desarrollo:**

```powershell
npm run db:check
npm run db:migrate
npm run db:seed
npm run db:status
```

**Pruebas:**

```powershell
npm run db:check:test
npm run db:migrate:test
npm run db:seed:test
npm run db:status:test
```

Esperado en ambas:

```text
✅ 001_esquema_inicial.sql — APLICADA
✅ 002_sesiones.sql — APLICADA
```

> 🔁 Puedes repetir `db:migrate` y `db:seed` cuando quieras: no duplican nada.

---

## 8. Verificar en pgAdmin 🔍

En cada base: clic derecho → **Query Tool** → pega y presiona F5:

```sql
SELECT
    current_user AS usuario_conectado,
    (SELECT string_agg(table_name, ', ' ORDER BY table_name)
       FROM information_schema.tables
      WHERE table_schema = 'public') AS tablas,
    (SELECT COUNT(*) FROM medidores
      WHERE nombre = 'Medidor principal') AS medidores_principales,
    (SELECT unidad FROM medidores
      WHERE nombre = 'Medidor principal' LIMIT 1) AS unidad,
    (SELECT activo FROM medidores
      WHERE nombre = 'Medidor principal' LIMIT 1) AS activo,
    (SELECT COUNT(*) FROM usuarios) AS usuarios;
```

Esperado:

| Columna | Valor |
|---|---|
| tablas | `lecturas_medidor, medidores, schema_migrations, sesiones, usuarios` |
| medidores_principales | `1` |
| unidad | `kWh` |
| activo | `true` |
| usuarios | `0` |

> 💡 **Truco de pgAdmin:** si ejecutas varias consultas juntas, solo muestra el resultado de la **última**. Por eso esta consulta junta todo en una sola fila.
>
> En `usuario_conectado` verás `postgres`, porque pgAdmin entra con la llave maestra. Eso está bien: la **app** usa `consumo_app` (lo confirma `npm run db:check`).

---

## 9. Primeras piezas de la aplicación

En este checkpoint también quedaron creadas dos piezas básicas que el CP2 ampliará:

`src/config/env.js` (versión inicial): lee las variables de la base y avisa si falta alguna.

```javascript
import 'dotenv/config';

function requerirVariable(nombre) {
  const valor = process.env[nombre];

  if (!valor) {
    throw new Error(`Falta la variable de entorno obligatoria: ${nombre}`);
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

`src/db/pool.js` (versión inicial): la fila de carritos 🛒 para hablar con la bodega.

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

> 🔄 Ambos archivos crecen mucho en el CP2-C y el CP2-D.

---

## 10. Commit

```powershell
git status          # revisar que NO aparezcan .env ni .env.test
git add .
git commit -m "feat: configurar PostgreSQL y migraciones iniciales"
```

Y después, las specs y los checkpoints se agregaron al repositorio:

```powershell
git add docs
git commit -m "docs: agregar especificaciones y checkpoints del proyecto"
```

---

## ✅ Gate CP1

```text
[ ] Rol consumo_app sin superusuario
[ ] Bases consumo_electrico y consumo_electrico_test con owner consumo_app
[ ] db:check conecta en ambas
[ ] 001 y 002 aplicadas en ambas
[ ] Un solo "Medidor principal" en cada base (aunque repitas el seed)
[ ] 0 usuarios
[ ] .env y .env.test fuera de Git
[ ] Commits hechos
```

## 🧠 Lo que debes poder explicar

- Por qué la app no usa el usuario `postgres`.
- Por qué hay una base de desarrollo y otra de pruebas.
- Qué es una migración y cómo sabe el migrador cuáles ya aplicó.
- Qué significa que el seed sea idempotente.
- Por qué **no** guardamos el consumo en una tabla.

⬅️ Anterior: [CP0](CP0-inicializacion.md) · ➡️ Siguiente: [CHECKPOINT 2 — Backend base](CP2-backend-base.md)
