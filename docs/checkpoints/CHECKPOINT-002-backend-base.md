# CHECKPOINT 2 — Backend base: el restaurante 🍽️

> **Guía completa.** Este documento reemplaza al `CHECKPOINT-002` original.
> Resumen para repasar: [`docs/manual/CP2-backend-base.md`](../manual/CP2-backend-base.md) · Decisiones: [`docs/DECISIONES.md`](../DECISIONES.md)
>
> **Etiqueta Git al terminar:** `cp2`

## 🎯 Objetivo

Convertir el backend mínimo del CP0 en un restaurante **ordenado, seguro y probado**, listo para recibir el login, las lecturas y las estadísticas de los siguientes checkpoints.

Al terminar tendrás:

- rutas organizadas;
- configuración centralizada y validada;
- conexión a PostgreSQL con verificación y cierre ordenado;
- errores con un formato único;
- número de ticket y bitácora para cada pedido;
- Helmet, CORS, límite de tamaño y límite de velocidad;
- validación de datos con Zod;
- transacciones "todo o nada";
- **30 pruebas automáticas** que se ejecutan en 2 segundos.

## 🧭 Cómo usar esta guía

El CP2 tiene **15 pasos** (A → O). Cada uno sigue la misma forma:

1. **El problema** — por qué lo necesitamos.
2. **La idea** — explicada con la metáfora del restaurante.
3. **Práctica** — los archivos. Cuando un archivo cambia, se muestra **completo**.
4. **Pruebas** — con Thunder Client o PowerShell (a veces rompiendo cosas a propósito 😈).
5. **Guardar** — el commit exacto.
6. **Gate** — la lista de chequeo.

> 🚦 **Regla de oro:** no pases al siguiente paso hasta que el gate esté completo.

| Paso | Tema |
|---|---|
| [A](#cp2-a--cómo-viaja-una-petición) | Cómo viaja una petición (teoría) |
| [B](#cp2-b--poner-orden-en-las-rutas) | Organizar las rutas |
| [C](#cp2-c--la-libreta-de-configuración) | Configuración centralizada |
| [D](#cp2-d--los-carritos-de-la-bodega) | Pool de PostgreSQL |
| [E](#cp2-e--el-mostrador-de-reclamos) | Manejo centralizado de errores |
| [F](#cp2-f--el-número-de-ticket-y-la-bitácora) | Request ID y logging |
| [G](#cp2-g--el-casco-de-seguridad) | Helmet |
| [H](#cp2-h--cors-la-mamá-protectora) | CORS |
| [I](#cp2-i--el-buzón-y-la-comanda-ilegible) | Límite de body y JSON roto |
| [J](#cp2-j--calma-uno-a-la-vez) | Rate limiting |
| [K](#cp2-k--el-inspector-de-formularios) | Validación con Zod |
| [L](#cp2-l--todo-o-nada) | Transacciones |
| [M](#cp2-m--el-robot-probador) | Vitest + Supertest |
| [N](#cp2-n--enseñarle-al-robot-todas-las-pruebas) | Pruebas automáticas |
| [O](#cp2-o--gate-final) | Gate final |

---

## ✅ Antes de empezar

Debes tener el **CHECKPOINT 1 cerrado**:

```text
[ ] PostgreSQL corriendo (servicio "postgresql-x64-18" en Running)
[ ] Bases consumo_electrico y consumo_electrico_test con migraciones 001 y 002
[ ] Existen src/config/env.js y src/db/pool.js (versión inicial del CP1)
[ ] npm run db:check y npm run db:check:test conectan
[ ] git status → working tree clean
```

**Herramientas:** VS Code, terminal PowerShell y la extensión **Thunder Client** (el ícono del rayo ⚡ en la barra izquierda).

Todos los comandos `npm` se ejecutan **dentro de `backend`**, salvo que se indique otra cosa.

---

# CP2-A — Cómo viaja una petición

Este paso **no toca código**. Es para entender la idea con calma y hacer dos pruebas.

## La idea en una frase

Cada vez que alguien le pide algo al backend pasa lo mismo que en un restaurante: **llega un pedido, lo atienden y sale una respuesta**.

| En el restaurante | En nuestro backend |
|---|---|
| El cliente | El navegador, el frontend o Thunder Client |
| El pedido | La **petición** (request) |
| El plato que llega a la mesa | La **respuesta** (response) |
| El restaurante | **Express** |

## ¿Qué quieres hacer? (los métodos)

| Método | En el restaurante | En nuestra app (más adelante) |
|---|---|---|
| **GET** | "¿Me muestras el menú?" 👀 | Ver lecturas, ver el dashboard |
| **POST** | "Quiero pedir algo nuevo" 🆕 | Registrar una lectura, iniciar sesión |
| **PATCH** | "A mi plato cámbiale solo la salsa" ✏️ | Corregir una lectura, cambiar el tema |
| **DELETE** | "Cancela mi pedido" ❌ | Casi no lo usaremos: no se borran lecturas ni usuarios |

## ¿A dónde va el pedido? (la ruta)

`/api/health` es como decir *"al mostrador de información"*. La **ruta** es la dirección exacta dentro del restaurante. Si pides un mostrador que no existe, nadie te atiende.

## `req` y `res`: la comanda y la bandeja

- **`req`** es la **comanda**: la hojita con todo lo que el cliente mandó.
- **`res`** es la **bandeja** donde el restaurante pone lo que devuelve.

```javascript
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' }); // poner en la bandeja: "todo bien"
});
```

Se lee: *"Si alguien pide GET en /api/health, ponle en la bandeja `{ status: 'ok' }`"*.

## Los middlewares: los guardias de la entrada 💂

Antes de llegar a la cocina, el pedido pasa por varios puntos de control:

```text
Pedido llega
   ▼
💂 Guardia 1: "¿Traes número de ticket?"      (Request ID)
   ▼
💂 Guardia 2: "¿Vienes con ropa segura?"       (Helmet)
   ▼
💂 Guardia 3: "¿Vienes de un lugar permitido?" (CORS)
   ▼
💂 Guardia 4: "¿Tu comanda se puede leer?"     (JSON parser)
   ▼
🍳 Cocina
```

Cada guardia tiene dos opciones:

- Si todo está bien, dice **"pase, siga"**. Eso es `next()`.
- Si algo está mal, **te detiene ahí mismo** y te devuelve un error.

⚠️ Un guardia que no dice "pase" ni te devuelve nada deja al cliente **esperando para siempre**.

El **orden** de los guardias importa: no tiene sentido revisar tu comanda si ni siquiera te dejaron entrar.

## Dentro del restaurante: cada uno con su trabajo 👨‍🍳

```text
🧑‍💼 Mesero     → Controller   (recibe la comanda y entrega la bandeja)
👨‍🍳 Chef       → Service      (sabe las reglas: "sin ingrediente no se cocina")
📦 Bodeguero   → Repository   (el único que entra a la bodega)
🏪 Bodega      → PostgreSQL   (donde se guardan los datos)
```

¿Por qué no lo hace todo una sola persona? Imagina un restaurante donde el mesero cocina, atiende, lava y va a la bodega: un caos, y si algo sale mal, nadie sabe dónde falló. Separando trabajos, cada parte es **fácil de entender, probar y arreglar**.

## La cara del mesero: los códigos de estado 🚦

| Código | Qué significa | En el restaurante |
|---|---|---|
| **200** | Todo bien | "Aquí está su plato" 😊 |
| **201** | Se creó algo nuevo | "Su pedido fue registrado" 🆕 |
| **204** | Hecho, sin nada que entregar | "Listo, ya cancelé su reserva" 👍 |
| **401** | No sé quién eres | "¿Tiene reservación?" 🤔 |
| **403** | Sé quién eres, pero no puedes | "La cocina es solo para personal" 🚫 |
| **404** | Eso no existe | "Ese plato no está en el menú" 🤷 |
| **409** | Choca con algo que ya existe | "Esa mesa ya está reservada" ⚠️ |
| **422** | Tu pedido no tiene sentido | "No entiendo 'media pizza y cuarto'" 📝 |
| **429** | Demasiados pedidos seguidos | "Calma, uno a la vez" 🐢 |
| **500** | Algo falló en la cocina | "Se nos quemó algo, disculpe" 🔥 |

**Truco:** los 200 son buenas noticias, los 400 son culpa del cliente y los 500 son culpa del restaurante.

## 🧪 Práctica con Thunder Client

**Paso 1 — Abrir el restaurante.** En la terminal de VS Code, dentro de `backend`:

```powershell
npm run dev
```

Deja esa terminal abierta.

**Paso 2 — Pedido que SÍ existe.**

1. En la barra izquierda de VS Code, haz clic en el **rayo ⚡** (Thunder Client).
2. Pulsa **New Request**.
3. Deja el método en **GET**.
4. URL: `http://localhost:3000/api/health`
5. Pulsa **Send**.

Esperamos **200 OK** y `{"status":"ok"}`.

**Paso 3 — Pedido que NO existe.** Cambia la URL a `http://localhost:3000/api/no-existe` y pulsa **Send**.

Esperamos **404 Not Found** y un texto feo: `Cannot GET /api/no-existe`. Es feo a propósito: en el paso E le enseñaremos al restaurante a responder bonito.

## ✅ Gate CP2-A

```text
[ ] npm run dev abre el restaurante
[ ] /api/health responde 200 con {"status":"ok"}
[ ] /api/no-existe responde 404
[ ] Puedo explicar: petición, respuesta, ruta, req, res
[ ] Puedo explicar: middleware = guardia, next() = "pase, siga"
[ ] Puedo explicar: Mesero → Chef → Bodeguero → Bodega
```

---

# CP2-B — Poner orden en las rutas

## 🩺 Primero: ¿`/api/health` es de ejemplo?

**No: se queda para siempre.** Es como el **letrero de "ABIERTO"** de una tienda: no vende nada, solo responde *"¿Estás funcionando?"*.

```text
Tú:      "¿Estás vivo?"      → GET /api/health
Backend: "¡Sí, estoy bien!"  → { "status": "ok" }
```

*Health* significa **salud**: es tomarle el pulso al backend 💓. Lo usamos primero porque es **la ruta más simple que existe**: no necesita base de datos ni login. Las rutas reales se organizarán **exactamente igual**.

## El problema

Hoy `app.js` hace dos trabajos: **prepara el restaurante** y además **atiende el mostrador de salud**. Con una ruta no pasa nada, pero vendrán unas 25, y `app.js` se volvería una sopa imposible de leer. 🍝

## La idea: un centro comercial 🏬

```text
🏬 Centro comercial "API"        → app.js                  (abre y prepara todo)
   └── 📋 Directorio del mall    → routes/index.js         (qué local está dónde)
         └── 🏪 Local "Health"   → routes/health.routes.js (atiende su pedido)
```

Cuando alguien pide `/api/health`:

```text
/api          → "Bienvenido al centro comercial"   (app.js)
   /health    → "El local Health está por aquí"    (index.js)
      /       → "¡Hola! Sí, estamos abiertos"      (health.routes.js)
```

La dirección se arma **pegando pedacitos**, como una dirección de casa. Y agregar un local nuevo será solo **una línea** en el directorio.

Un **Router** es un **mini-restaurante** que sabe atender solo *su* tema.

## 🛠️ Práctica

`server.js` **no se toca**.

### Archivo 1 (NUEVO): `backend/src/routes/health.routes.js`

```javascript
import { Router } from 'express';

// Un mini-restaurante que solo atiende el tema "salud"
const router = Router();

// GET /api/health → "¿El backend está vivo?"
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
  });
});

export default router;
```

### Archivo 2 (NUEVO): `backend/src/routes/index.js`

```javascript
import { Router } from 'express';
import healthRoutes from './health.routes.js';

// El directorio del centro comercial:
// aquí se anota qué local atiende cada dirección
const router = Router();

router.use('/health', healthRoutes);

// Locales que abriremos más adelante:
// router.use('/auth', authRoutes);
// router.use('/lecturas', lecturasRoutes);

export default router;
```

### Archivo 3 (REEMPLAZAR completo): `backend/src/app.js`

```javascript
import express from 'express';
import rutas from './routes/index.js';

const app = express();

// Guardia que sabe leer comandas en formato JSON
app.use(express.json());

// Todo lo que empiece con /api va al directorio de rutas
app.use('/api', rutas);

export default app;
```

`app.js` ya **no sabe nada** de `health`: solo dice *"todo lo de /api, pregúntale al directorio"*.

## 🧪 Pruebas

Con `npm run dev` corriendo (se reinicia solo al guardar gracias a `--watch`):

| Petición | Esperamos |
|---|---|
| GET `http://localhost:3000/api/health` | **200** y `{"status":"ok"}` |
| GET `http://localhost:3000/api/no-existe` | **404** |

¿Las mismas pruebas de antes? ¡Sí! La lección es que **reorganizamos todo por dentro y el cliente no nota ninguna diferencia**. Eso se llama **refactorizar**: ordenar la casa sin cambiar lo que hace. 🧹

Si sale un error, casi siempre es un nombre de archivo mal escrito o que falta el `.js` en un `import`.

## 💾 Guardar

Desde la raíz del proyecto:

```powershell
git add .
git status
git commit -m "refactor: organizar rutas del backend"
```

## ✅ Gate CP2-B

```text
[ ] Existen routes/health.routes.js y routes/index.js
[ ] app.js ya no tiene la ruta health adentro
[ ] /api/health sigue respondiendo 200 y /api/no-existe 404
[ ] Entiendo: health = "¿estás vivo?", y se queda para siempre
[ ] Entiendo: Router = mini-restaurante de un solo tema
[ ] Entiendo: la URL se arma pegando pedacitos (/api + /health)
[ ] Commit hecho
```

---

# CP2-C — La libreta de configuración

## ¿Qué son las variables de entorno? 📒

Todo restaurante tiene una **libreta con datos importantes** que no se escriben en la pared:

```text
📒 Libreta del restaurante
   - Por qué puerta se atiende      → PORT=3000
   - Dónde está la bodega           → DB_HOST, DB_NAME
   - La llave de la bodega          → DB_USER, DB_PASSWORD
   - Desde qué web nos visitan      → FRONTEND_URL
   - En qué país/hora vivimos       → APP_TIMEZONE
```

Esa libreta es el archivo **`.env`**. Tiene secretos, por eso **nunca va a Git**.

¿Por qué no escribir esos datos en el código? Porque cada compu es distinta: tu contraseña de PostgreSQL no es la de tus compañeros. El código es igual para todos; **la libreta es personal**.

## `env.js`: el portero revisor 🕵️

Antes de abrir el restaurante, un portero revisa la libreta:

```text
🕵️ "¿Está el puerto?"       ✔
🕵️ "¿Es un número válido?"  ✔
🕵️ "¿Está la contraseña?"   ✘ → ¡NO ABRIMOS! Falta DB_PASSWORD
```

**Es mejor que el restaurante no abra a que abra y a medianoche descubra que no tiene la llave de la bodega.** A esto se le dice *fallar rápido*: si algo está mal, se nota **al arrancar** y con un mensaje claro.

> **Regla de oro:** solo `env.js` lee la libreta. El resto del código le pregunta a `env.js`.

## Dos libretas: la real y la de práctica 🎭

```text
.env       → libreta del restaurante real       (consumo_electrico)
.env.test  → libreta del restaurante de juguete (consumo_electrico_test)
```

¿Quién decide cuál usar? La etiqueta **`NODE_ENV`**:

| NODE_ENV | Significa | Libreta |
|---|---|---|
| `development` (por defecto) | Estoy programando | `.env` |
| `test` | Están corriendo las pruebas | `.env.test` |
| `production` | App publicada (fuera del MVP) | `.env` |

`NODE_ENV` **no va dentro de las libretas**, porque es justamente lo que decide *cuál libreta abrir*. Sería como guardar la llave del cofre dentro del cofre. 🔐

**Protección extra:** si estamos en modo test pero la base NO termina en `_test`, el portero no deja pasar. Las pruebas borrarán datos, y no queremos que un error borre tus datos reales. Es como practicar con un muñeco antes de operar a una persona.

## 🛠️ Práctica

### Paso 1 — Completar tus libretas

`backend/.env` (**conserva tu contraseña real**):

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=consumo_electrico
DB_USER=consumo_app
DB_PASSWORD=TU_CONTRASENA_REAL

FRONTEND_URL=http://localhost:5173
APP_TIMEZONE=America/Guayaquil
```

`backend/.env.test` (también con tu contraseña):

```env
PORT=3001

DB_HOST=localhost
DB_PORT=5432
DB_NAME=consumo_electrico_test
DB_USER=consumo_app
DB_PASSWORD=TU_CONTRASENA_REAL

FRONTEND_URL=http://localhost:5173
APP_TIMEZONE=America/Guayaquil
```

Si alguno tenía `NODE_ENV`, `JWT_SECRET` u otras líneas, **quítalas**. Lo de JWT llegará en el CP3.

### Paso 2 — Reemplazar las plantillas (van a Git, sin contraseña)

`backend/.env.example`:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=consumo_electrico
DB_USER=consumo_app
DB_PASSWORD=

FRONTEND_URL=http://localhost:5173
APP_TIMEZONE=America/Guayaquil
```

`backend/.env.test.example`:

```env
PORT=3001

DB_HOST=localhost
DB_PORT=5432
DB_NAME=consumo_electrico_test
DB_USER=consumo_app
DB_PASSWORD=

FRONTEND_URL=http://localhost:5173
APP_TIMEZONE=America/Guayaquil
```

### Paso 3 — El portero: `backend/src/config/env.js` (REEMPLAZAR completo)

```javascript
import dotenv from 'dotenv';

// ─────────────────────────────────────────────
// 1. ¿En qué modo estamos?
//    Si nadie dice nada, estamos programando.
// ─────────────────────────────────────────────
const MODOS_PERMITIDOS = ['development', 'test', 'production'];

const nodeEnv = process.env.NODE_ENV ?? 'development';

if (!MODOS_PERMITIDOS.includes(nodeEnv)) {
  throw new Error(
    `NODE_ENV inválido: "${nodeEnv}". Usa: ${MODOS_PERMITIDOS.join(', ')}`
  );
}

// ─────────────────────────────────────────────
// 2. Abrir la libreta correcta
// ─────────────────────────────────────────────
const archivoEnv = nodeEnv === 'test' ? '.env.test' : '.env';

dotenv.config({ path: archivoEnv, quiet: true });

// ─────────────────────────────────────────────
// 3. Ayudantes del portero
// ─────────────────────────────────────────────

// Revisa que un dato exista y no esté vacío
function requerirTexto(nombre) {
  const valor = process.env[nombre];

  if (!valor || valor.trim() === '') {
    throw new Error(
      `Falta la variable obligatoria ${nombre} en ${archivoEnv}`
    );
  }

  return valor.trim();
}

// Revisa que un puerto sea un número entero entre 1 y 65535
function leerPuerto(nombre, porDefecto) {
  const texto = process.env[nombre] ?? String(porDefecto);
  const numero = Number(texto);

  if (!Number.isInteger(numero) || numero < 1 || numero > 65535) {
    throw new Error(
      `${nombre} debe ser un puerto válido (1-65535). Recibido: "${texto}"`
    );
  }

  return numero;
}

// Revisa que un texto sea una dirección web válida
function leerUrl(nombre) {
  const valor = requerirTexto(nombre);

  try {
    new URL(valor);
  } catch {
    throw new Error(`${nombre} no es una URL válida. Recibido: "${valor}"`);
  }

  return valor;
}

// Revisa que la zona horaria exista de verdad
function leerZonaHoraria(nombre, porDefecto) {
  const valor = process.env[nombre] ?? porDefecto;

  try {
    new Intl.DateTimeFormat('es', { timeZone: valor });
  } catch {
    throw new Error(`${nombre} no es una zona horaria válida: "${valor}"`);
  }

  return valor;
}

// ─────────────────────────────────────────────
// 4. Armar la configuración revisada
// ─────────────────────────────────────────────
const configuracion = {
  nodeEnv,
  esTest: nodeEnv === 'test',
  port: leerPuerto('PORT', 3000),

  db: {
    host: requerirTexto('DB_HOST'),
    port: leerPuerto('DB_PORT', 5432),
    name: requerirTexto('DB_NAME'),
    user: requerirTexto('DB_USER'),
    password: requerirTexto('DB_PASSWORD'),
  },

  frontendUrl: leerUrl('FRONTEND_URL'),
  appTimezone: leerZonaHoraria('APP_TIMEZONE', 'America/Guayaquil'),
};

// ─────────────────────────────────────────────
// 5. Protección: las pruebas NUNCA tocan la base real
// ─────────────────────────────────────────────
if (configuracion.esTest && !configuracion.db.name.endsWith('_test')) {
  throw new Error(
    `Modo test con base "${configuracion.db.name}". ` +
      'Por seguridad, la base de pruebas debe terminar en "_test".'
  );
}

// ─────────────────────────────────────────────
// 6. Candado: nadie puede cambiar la configuración después
// ─────────────────────────────────────────────
export const env = Object.freeze({
  ...configuracion,
  db: Object.freeze(configuracion.db),
});
```

`env.db` tiene **la misma forma que antes**, así que `pool.js` sigue funcionando sin tocarlo.

### Paso 4 — `backend/src/server.js` (REEMPLAZAR completo)

```javascript
import app from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  console.log('⚡ Control de Consumo Eléctrico — API');
  console.log(`   Modo:   ${env.nodeEnv}`);
  console.log(`   Puerto: ${env.port}`);
  console.log(`   Base:   ${env.db.name}`);
  console.log(`   URL:    http://localhost:${env.port}/api/health`);
});
```

Se muestran modo, puerto y base, **pero nunca la contraseña**. Nunca se imprimen secretos en la terminal.

## 🧪 Pruebas

**Prueba 1 — Todo en orden.** Detén el servidor (Ctrl + C) y ábrelo de nuevo, porque los `.env` no se recargan solos:

```powershell
npm run dev
```

Esperamos:

```text
⚡ Control de Consumo Eléctrico — API
   Modo:   development
   Puerto: 3000
   Base:   consumo_electrico
```

Y en Thunder Client, `/api/health` → **200**.

**Prueba 2 — Rompamos cosas a propósito 😈**

1. Detén el servidor.
2. En `.env` cambia `PORT=3000` por `PORT=pizza` y ejecuta `npm run dev`. Esperamos:
   ```text
   PORT debe ser un puerto válido (1-65535). Recibido: "pizza"
   ```
3. Deja `PORT=3000` y borra la línea de `FRONTEND_URL`. Esperamos:
   ```text
   Falta la variable obligatoria FRONTEND_URL en .env
   ```
4. **Restaura todo** y confirma que arranca normal.

El error dice **qué falta y dónde**. Nada de misterios. 🔍

**Prueba 3 — ¿El modo test abre la otra libreta?** Con el servidor detenido:

```powershell
$env:NODE_ENV="test"
node -e "import('./src/config/env.js').then(m => console.log('Base:', m.env.db.name))"
Remove-Item Env:NODE_ENV
```

Esperamos `Base: consumo_electrico_test`. La última línea **quita** la etiqueta `test` para que la terminal vuelva a modo normal: no la olvides.

## 💾 Guardar

```powershell
git status
```

**No** deben aparecer `.env` ni `.env.test`. Solo `env.js`, `server.js` y los dos `.example`.

```powershell
git add .
git commit -m "feat: configuración centralizada y validada del entorno"
```

## ✅ Gate CP2-C

```text
[ ] .env y .env.test completos (sin NODE_ENV)
[ ] Plantillas .example actualizadas sin contraseña
[ ] npm run dev muestra modo, puerto y base (sin contraseña)
[ ] PORT=pizza y la falta de FRONTEND_URL dan errores claros
[ ] En modo test se lee consumo_electrico_test
[ ] Entiendo: .env = libreta, env.js = portero que la revisa
[ ] Entiendo: solo env.js lee process.env
[ ] Commit hecho sin secretos
```

---

# CP2-D — Los carritos de la bodega

## ¿Qué es un pool? 🛒

La **bodega** es PostgreSQL y el **bodeguero** entra a buscar cosas. Para entrar se necesita un **carrito** (una *conexión*).

Si por cada pedido **fabricáramos un carrito nuevo**, lo usáramos una vez y **lo tiráramos**, sería lentísimo: abrir una conexión cuesta tiempo.

Un **pool** es una **fila de carritos listos para usar**. Tomas uno, lo usas y lo **devuelves**:

```text
🛒🛒🛒🛒🛒  ← carritos esperando (máximo 10)

Pedido 1 → toma 🛒 → usa → devuelve 🛒
Pedido 2 → toma 🛒 → usa → devuelve 🛒
```

**Un solo pool para toda la app**: ningún bodeguero fabrica su propio carrito.

## Las 4 mejoras de hoy

| # | Mejora | En el restaurante |
|---|---|---|
| 1 | Límites | "Máximo 10 carritos; si en 5 segundos no hay uno libre, avisa" |
| 2 | Revisar la bodega al abrir | "Antes de abrir, verifica que la bodega abra" |
| 3 | Fechas como texto | "Un cumpleaños no tiene hora" 🎂 |
| 4 | Números grandes como números | "Que 12555 sea un número, no una palabra" 🔢 |

### 🎂 Mejora 3: las fechas

`fecha_lectura` es una **fecha de calendario**: `2026-08-30`, sin hora. Pero `pg`, por defecto, le **inventa una hora** y la convierte en objeto `Date`. En Ecuador (5 horas menos que el reloj mundial) puede terminar mostrando:

```text
2026-08-30T05:00:00.000Z   😵 ¿y esa hora de dónde salió?
```

Y en algunos casos hasta **cambiar el día**. Para una app cuyo corazón es "una lectura por día", sería un desastre. Por eso le decimos a `pg`: **"trae las fechas tal cual, como texto"**.

### 🔢 Mejora 4: los números grandes

Las lecturas son `BIGINT`, y `pg` los entrega como **texto**: `"12555"`. El peligro es que JavaScript compara textos **como palabras**, letra por letra:

```javascript
"9" > "10"   // true 😱  ("9" va después de "1" en el abecedario)
 9  >  10    // false ✅
```

Nuestra regla más importante es *"la lectura nueva no puede ser menor que la anterior"*, y con textos se rompería. Así que los convertimos a números reales. JavaScript maneja con precisión enteros de hasta 9 mil billones (un medidor de casa jamás llegará ahí), y si aparece uno más grande, el código lanza un error en vez de equivocarse en silencio.

## 🛠️ Práctica

### Archivo 1 (REEMPLAZAR completo): `backend/src/db/pool.js`

```javascript
import pg from 'pg';
import { env } from '../config/env.js';

const { Pool, types } = pg;

// ─────────────────────────────────────────────
// 1. Fechas de calendario (DATE) → texto tal cual
//    "Un cumpleaños no tiene hora": 2026-08-30
// ─────────────────────────────────────────────
const TIPO_DATE = 1082;

types.setTypeParser(TIPO_DATE, (texto) => texto);

// ─────────────────────────────────────────────
// 2. Números enteros grandes (BIGINT) → número real
//    Para que 9 < 10 funcione bien
// ─────────────────────────────────────────────
const TIPO_BIGINT = 20;

types.setTypeParser(TIPO_BIGINT, (texto) => {
  const numero = Number(texto);

  if (!Number.isSafeInteger(numero)) {
    throw new Error(
      `El número ${texto} es demasiado grande para JavaScript`
    );
  }

  return numero;
});

// ─────────────────────────────────────────────
// 3. La fila de carritos (un solo pool para toda la app)
// ─────────────────────────────────────────────
export const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,

  max: 10,                        // máximo 10 carritos
  idleTimeoutMillis: 30_000,      // un carrito sin uso 30 s se guarda
  connectionTimeoutMillis: 5_000, // si en 5 s no hay carrito, error
});

// Si un carrito que estaba descansando se rompe, avisamos
// (sin esto, el servidor completo podría caerse)
pool.on('error', (error) => {
  console.error('⚠️ Una conexión inactiva de PostgreSQL falló:', error.message);
});

// ─────────────────────────────────────────────
// 4. Revisar que la bodega abre
// ─────────────────────────────────────────────
export async function verificarConexionBD() {
  const resultado = await pool.query(`
    SELECT
      current_database() AS base,
      current_user       AS usuario
  `);

  return resultado.rows[0];
}
```

### Archivo 2 (REEMPLAZAR completo): `backend/src/server.js`

Ahora el restaurante **revisa la bodega antes de abrir** y, al cerrar, **devuelve todos los carritos con calma**:

```javascript
import app from './app.js';
import { env } from './config/env.js';
import { pool, verificarConexionBD } from './db/pool.js';

// ─────────────────────────────────────────────
// Abrir el restaurante (solo si la bodega responde)
// ─────────────────────────────────────────────
async function iniciar() {
  try {
    const bd = await verificarConexionBD();

    const servidor = app.listen(env.port, () => {
      console.log('⚡ Control de Consumo Eléctrico — API');
      console.log(`   Modo:    ${env.nodeEnv}`);
      console.log(`   Puerto:  ${env.port}`);
      console.log(`   Bodega:  ${bd.base} (usuario ${bd.usuario})`);
      console.log(`   URL:     http://localhost:${env.port}/api/health`);
    });

    prepararCierre(servidor);
  } catch (error) {
    console.error('❌ No se pudo conectar a PostgreSQL. El servidor NO se abrió.');
    console.error(`   Motivo: ${error.message}`);

    await pool.end();
    process.exitCode = 1;
  }
}

// ─────────────────────────────────────────────
// Cerrar con calma: primero la puerta, luego los carritos
// ─────────────────────────────────────────────
function prepararCierre(servidor) {
  let cerrando = false;

  async function cerrar(senal) {
    if (cerrando) return;
    cerrando = true;

    console.log(`\n👋 ${senal} recibido. Cerrando con calma...`);

    servidor.close(async () => {
      await pool.end();
      console.log('✅ Servidor y conexiones cerrados.');
      process.exit(0);
    });
  }

  process.on('SIGINT', () => cerrar('SIGINT'));
  process.on('SIGTERM', () => cerrar('SIGTERM'));
}

iniciar();
```

`SIGINT` es el aviso que manda **Ctrl + C**, y `SIGTERM` es un "por favor, termina" que envía el sistema.

## 🧪 Pruebas

**Prueba 1 — La bodega abre.** `npm run dev` debe mostrar:

```text
   Bodega:  consumo_electrico (usuario consumo_app)
```

¡El usuario es **`consumo_app`**, no `postgres`! La app entra con su llave limitada. 🔑 Y `/api/health` sigue en **200**.

**Prueba 2 — La bodega no abre 😈.** Detén el servidor, cambia tu `DB_PASSWORD` por `claveequivocada` y ejecuta `npm run dev`:

```text
❌ No se pudo conectar a PostgreSQL. El servidor NO se abrió.
   Motivo: password authentication failed for user "consumo_app"
```

El restaurante **se negó a abrir sin bodega**. **Restaura tu contraseña real.**

**Prueba 3 — Fechas y números bien traídos 🎂🔢.** Crea el archivo **temporal** `backend/scripts/probar-pool.js`:

```javascript
import { pool } from '../src/db/pool.js';

const resultado = await pool.query(`
  SELECT
    DATE '2026-08-30'  AS fecha,
    12555::BIGINT      AS lectura,
    9::BIGINT < 10::BIGINT AS nueve_menor_que_diez
`);

const fila = resultado.rows[0];

console.log(fila);
console.log('Tipo de fecha:  ', typeof fila.fecha);
console.log('Tipo de lectura:', typeof fila.lectura);

await pool.end();
```

```powershell
node scripts/probar-pool.js
```

Esperamos:

```text
{ fecha: '2026-08-30', lectura: 12555, nueve_menor_que_diez: true }
Tipo de fecha:   string
Tipo de lectura: number
```

Luego **bórralo**: `Remove-Item scripts\probar-pool.js`

**Prueba 4 — Cierre con calma.** Ejecuta `npm start` (sin `--watch`) y presiona **Ctrl + C**:

```text
👋 SIGINT recibido. Cerrando con calma...
✅ Servidor y conexiones cerrados.
```

En Windows, a veces la terminal cierra tan rápido que **no alcanzas a ver** estos mensajes. No es un error.

## 💾 Guardar

```powershell
git status   # solo pool.js y server.js; NO probar-pool.js ni .env
git add .
git commit -m "feat: pool de PostgreSQL con verificación, tipos y cierre ordenado"
```

## ✅ Gate CP2-D

```text
[ ] npm run dev muestra la bodega y el usuario consumo_app
[ ] Con contraseña equivocada, el servidor NO abre y explica por qué
[ ] Fecha llega como '2026-08-30' (texto, sin hora)
[ ] Lectura llega como número (12555, no "12555")
[ ] probar-pool.js borrado
[ ] Entiendo: pool = fila de carritos reutilizables
[ ] Entiendo: por qué "9" > "10" es peligroso
[ ] Commit hecho
```

---

# CP2-E — El mostrador de reclamos

## El problema

Hoy, cuando algo sale mal, el restaurante responde **cada vez de una forma distinta**:

```text
Ruta que no existe → "Cannot GET /api/no-existe"  (texto HTML feo)
Algo explota       → una página de error con detalles internos 😱
```

Es como un restaurante donde, cuando algo falla, a veces el mesero grita, a veces el chef sale corriendo y a veces nadie dice nada. Y peor: a veces **se ven cosas de la cocina que el cliente no debería ver**.

## La idea: un solo mostrador de reclamos 🛎️

Todos los problemas, vengan de donde vengan, **van a un único mostrador** al final del restaurante, que responde **siempre con el mismo formato**:

```text
Ruta inexistente ─┐
Dato inválido ────┤
Lectura repetida ─┼──→ 🛎️ Mostrador de reclamos ──→ respuesta ordenada
Algo explotó ─────┘
```

```json
{
  "error": {
    "codigo": "RUTA_NO_ENCONTRADA",
    "mensaje": "La ruta solicitada no existe."
  }
}
```

### ¿Por qué `codigo` Y `mensaje`? 🏷️

- **`mensaje`** es para **personas**.
- **`codigo`** es para **la máquina**: React leerá el código, no el mensaje. Si mañana cambiamos la frase, React sigue entendiendo qué pasó. Es la **etiqueta de color** de una caja.

### Dos tipos de errores 🧯

| Tipo | Ejemplo | ¿Qué hacemos? |
|---|---|---|
| **Esperado** 🟡 | "Ya existe una lectura para esa fecha" | Lo sabíamos posible. Le explicamos al cliente qué pasó. |
| **Inesperado** 🔴 | Un bug de programación | Al cliente, un mensaje amable y genérico. **En la terminal**, todos los detalles para arreglarlo. |

¿Por qué no mostrarle el error real al cliente? Porque podría revelar **secretos de la cocina**: nombres de tablas, rutas de archivos, a veces datos. **El cliente ve una disculpa; el programador ve las pistas.** 🕵️

Para los errores esperados usaremos una "ficha de reclamo" especial: **`AppError`**.

## 🛠️ Práctica

### Archivo 1 (NUEVO): `backend/src/errors/app-error.js`

```javascript
// Ficha de reclamo para errores que SÍ esperábamos
// Ejemplo: "ya existe una lectura para esa fecha"
export class AppError extends Error {
  constructor({ status, codigo, mensaje, detalles }) {
    super(mensaje);

    this.name = 'AppError';
    this.status = status;     // número HTTP: 404, 409, 422...
    this.codigo = codigo;     // etiqueta para la máquina
    this.detalles = detalles; // información extra (opcional)
  }
}
```

`extends Error` significa que `AppError` **es un error de verdad**, pero con bolsillos extra.

### Archivo 2 (NUEVO): `backend/src/errors/error-codes.js`

```javascript
// Lista oficial de códigos de error.
// Iremos agregando más cuando los necesitemos, no antes.
export const ERROR_CODES = Object.freeze({
  RUTA_NO_ENCONTRADA: 'RUTA_NO_ENCONTRADA',
  ERROR_INTERNO: 'ERROR_INTERNO',
});
```

**No inventamos códigos que todavía no usamos.**

### Archivo 3 (NUEVO): `backend/src/middlewares/not-found.js`

```javascript
import { AppError } from '../errors/app-error.js';
import { ERROR_CODES } from '../errors/error-codes.js';

// Si una petición llegó hasta aquí, ninguna ruta la atendió
export function rutaNoEncontrada(req, res, next) {
  next(
    new AppError({
      status: 404,
      codigo: ERROR_CODES.RUTA_NO_ENCONTRADA,
      mensaje: 'La ruta solicitada no existe.',
    })
  );
}
```

**No responde él mismo**: pasa el reclamo al mostrador con `next(error)`. Cuando `next()` lleva algo dentro, Express entiende: *"esto es un problema, llévalo al mostrador"*.

### Archivo 4 (NUEVO): `backend/src/middlewares/error-handler.js`

```javascript
import { AppError } from '../errors/app-error.js';
import { ERROR_CODES } from '../errors/error-codes.js';

// Mostrador de reclamos: TODOS los errores terminan aquí.
// Express lo reconoce porque recibe 4 cosas: (error, req, res, next)
export function manejarErrores(error, req, res, next) {
  // Si ya empezamos a responder, no podemos cambiar la respuesta
  if (res.headersSent) {
    return next(error);
  }

  // 🟡 Error ESPERADO: le explicamos al cliente qué pasó
  if (error instanceof AppError) {
    const respuesta = {
      error: {
        codigo: error.codigo,
        mensaje: error.message,
      },
    };

    if (error.detalles !== undefined) {
      respuesta.error.detalles = error.detalles;
    }

    return res.status(error.status).json(respuesta);
  }

  // 🔴 Error INESPERADO: detalles en la terminal, disculpa al cliente
  console.error('💥 Error inesperado:', error);

  return res.status(500).json({
    error: {
      codigo: ERROR_CODES.ERROR_INTERNO,
      mensaje: 'Ocurrió un error inesperado.',
    },
  });
}
```

⚠️ **Los 4 parámetros son obligatorios**, aunque no usemos `next`. Así Express sabe que es el mostrador de reclamos y no un guardia normal.

### Archivo 5 (REEMPLAZAR completo): `backend/src/app.js`

```javascript
import express from 'express';
import rutas from './routes/index.js';
import { rutaNoEncontrada } from './middlewares/not-found.js';
import { manejarErrores } from './middlewares/error-handler.js';

const app = express();

// Guardia que sabe leer comandas en formato JSON
app.use(express.json());

// Todo lo que empiece con /api va al directorio de rutas
app.use('/api', rutas);

// Si nadie atendió el pedido: "ese plato no está en el menú"
app.use(rutaNoEncontrada);

// 🛎️ Mostrador de reclamos: SIEMPRE al final
app.use(manejarErrores);

export default app;
```

¿Por qué **al final**? Express revisa todo **de arriba hacia abajo**. Si `rutaNoEncontrada` estuviera arriba, respondería "no existe" **a todo**, ¡incluso a `/api/health`!

### Archivo 6 (REEMPLAZAR, versión TEMPORAL): `backend/src/routes/index.js`

Tres rutas **de mentira** para ver trabajar al mostrador:

```javascript
import { Router } from 'express';
import healthRoutes from './health.routes.js';
import { AppError } from '../errors/app-error.js';

const router = Router();

router.use('/health', healthRoutes);

// ─────────────────────────────────────────────
// 🧪 TEMPORAL — borrar después de probar CP2-E
// ─────────────────────────────────────────────

// Error ESPERADO (como "lectura duplicada")
router.get('/prueba/error-esperado', () => {
  throw new AppError({
    status: 409,
    codigo: 'DEMO_CONFLICTO',
    mensaje: 'Esto es un error esperado de prueba.',
  });
});

// Error INESPERADO (un bug de programación)
router.get('/prueba/error-inesperado', () => {
  const usuario = undefined;
  return usuario.nombre; // 💥 no se puede leer .nombre de undefined
});

// Error dentro de una función async (como una consulta a la BD)
router.get('/prueba/error-async', async () => {
  await Promise.resolve();
  throw new Error('Falló algo dentro de una función async');
});

export default router;
```

## 🧪 Pruebas con Thunder Client

Todas con `http://localhost:3000` delante:

| # | Método y URL | Status | `codigo` |
|---|---|---|---|
| 1 | GET `/api/health` | **200** | (`{"status":"ok"}`, igual que antes) |
| 2 | GET `/api/no-existe` | **404** | `RUTA_NO_ENCONTRADA` |
| 3 | **POST** `/api/health` | **404** | `RUTA_NO_ENCONTRADA` |
| 4 | GET `/api/prueba/error-esperado` | **409** | `DEMO_CONFLICTO` |
| 5 | GET `/api/prueba/error-inesperado` | **500** | `ERROR_INTERNO` |
| 6 | GET `/api/prueba/error-async` | **500** | `ERROR_INTERNO` |

**Tres cosas para observar:**

- **Prueba 3:** `/api/health` existe, pero **solo para GET**. El método también forma parte de la dirección. 🚪
- **Prueba 5:** mira la **terminal**: aparece `💥 Error inesperado: TypeError...` con el archivo y la línea exacta. En Thunder Client, solo *"Ocurrió un error inesperado."* **Cliente: disculpa. Programador: pistas.**
- **Prueba 6:** el error ocurrió dentro de un `async` y aun así llegó al mostrador. Eso lo hace **Express 5** automáticamente; en versiones viejas había que atraparlo a mano, ¡y era una fuente clásica de bugs!

## 🧹 Limpiar las rutas de mentira

Deja `backend/src/routes/index.js` otra vez así (REEMPLAZAR completo):

```javascript
import { Router } from 'express';
import healthRoutes from './health.routes.js';

// El directorio del centro comercial:
// aquí se anota qué local atiende cada dirección
const router = Router();

router.use('/health', healthRoutes);

// Locales que abriremos más adelante:
// router.use('/auth', authRoutes);
// router.use('/lecturas', lecturasRoutes);

export default router;
```

Confirma que `/api/prueba/error-esperado` ahora da **404**.

## 💾 Guardar

```powershell
git status   # app.js, src/errors/ y 2 middlewares nuevos; NO routes/index.js
git add .
git commit -m "feat: manejo centralizado de errores y 404 uniforme"
```

## ✅ Gate CP2-E

```text
[ ] /api/no-existe → 404 con JSON RUTA_NO_ENCONTRADA
[ ] POST /api/health → 404 (el método también cuenta)
[ ] Error esperado → su status y su código
[ ] Error inesperado → 500 genérico al cliente, detalles en la terminal
[ ] Error async también llega al mostrador
[ ] Rutas de prueba borradas
[ ] Entiendo: codigo = máquina, mensaje = personas
[ ] Entiendo: error esperado vs inesperado
[ ] Entiendo: por qué el mostrador va al final
[ ] Commit hecho
```

---

# CP2-F — El número de ticket y la bitácora

## El problema

Un cliente llama enojado: *"¡Mi pedido falló!"*. ¿Cuál pedido? ¿A qué hora? Si el restaurante atiende 500 pedidos al día, **encontrarlo es imposible**.

## La idea, en dos partes

### 🎫 Parte 1: cada pedido recibe un número de ticket

Como en el banco: al llegar, te dan un **número único** que viaja con tu pedido y **vuelve contigo** en la respuesta. Se llama **Request ID** y usaremos un **UUID**, un código tan largo y aleatorio que es prácticamente imposible que se repita:

```text
a3f9c2e1-7b4d-4e8a-9c1f-2d6b8e0a5f37
```

### 📓 Parte 2: el portero anota todo en su bitácora

Cada vez que un pedido **termina**, el portero escribe **una línea**:

```text
[INFO ] GET /api/health → 200 (2 ms) id=a3f9c2e1-...
[WARN ] GET /api/no-existe → 404 (1 ms) id=7c21b0d4-...
```

Esto es **logging**. Cuando el cliente diga *"mi ticket es 7c21b0d4"*, lo buscamos y **sabemos exactamente qué pasó**. 🔍

| Nivel | Cuándo | Significa |
|---|---|---|
| `INFO` 🟢 | Status 200-399 | Todo normal |
| `WARN` 🟡 | Status 400-499 | El cliente pidió algo mal |
| `ERROR` 🔴 | Status 500+ | Algo falló en la cocina: ¡revisar! |

### ⚠️ Lo que el portero NUNCA anota

```text
❌ El cuerpo del pedido (req.body)   → más adelante traerá contraseñas
❌ Los headers de sesión             → traerán llaves de acceso (tokens)
❌ Los ?parámetros de la URL         → a veces llevan datos sensibles
```

Una bitácora con contraseñas es un **regalo para cualquier ladrón**.

### El orden

El logger va **justo después del ticket**, antes de leer el JSON. Si alguien manda un JSON roto, `express.json` lo rechaza **antes** de llegar al logger, y ese pedido **no quedaría registrado**. Con el portero al principio, **anota absolutamente todo**.

```text
1. 🎫 requestId   → dar ticket
2. 📓 logger      → preparar la bitácora
3. 📄 express.json
4. 🗂️ rutas
5. 🤷 404
6. 🛎️ errores
```

## 🛠️ Práctica

### Archivo 1 (NUEVO): `backend/src/middlewares/request-id.js`

```javascript
import { randomUUID } from 'node:crypto';

// 🎫 Le da a cada pedido un número de ticket único
export function asignarRequestId(req, res, next) {
  const requestId = randomUUID();

  // Para que el resto del backend lo conozca
  req.requestId = requestId;

  // Para que el cliente lo reciba de vuelta
  res.setHeader('X-Request-Id', requestId);

  next();
}
```

### Archivo 2 (NUEVO): `backend/src/middlewares/logger.js`

```javascript
import { env } from '../config/env.js';

// Elige el "color" de la línea según cómo terminó el pedido
function nivelSegunStatus(status) {
  if (status >= 500) return 'ERROR';
  if (status >= 400) return 'WARN ';
  return 'INFO ';
}

// 📓 El portero anota una línea cuando cada pedido TERMINA
export function registrarPeticion(req, res, next) {
  // Durante las pruebas automáticas no llenamos la pantalla
  if (env.esTest) {
    return next();
  }

  const inicio = performance.now(); // ⏱️ arranca el cronómetro

  // 'finish' = "la respuesta ya salió de la cocina"
  res.on('finish', () => {
    const duracion = Math.round(performance.now() - inicio);

    // Quitamos lo que va después de "?" (puede tener datos sensibles)
    const ruta = req.originalUrl.split('?')[0];

    const nivel = nivelSegunStatus(res.statusCode);

    console.log(
      `[${nivel}] ${req.method} ${ruta} → ${res.statusCode} (${duracion} ms) id=${req.requestId}`
    );
  });

  next();
}
```

El portero **no espera** a que termine el pedido para decir `next()`. Deja **preparado** un aviso (`res.on('finish', ...)`) y lo deja pasar: *"pase, y cuando salga, me avisa cómo le fue"*. ⏱️

### Archivo 3 (REEMPLAZAR completo): `backend/src/middlewares/error-handler.js`

Ahora el mostrador también entrega **el número de ticket**:

```javascript
import { AppError } from '../errors/app-error.js';
import { ERROR_CODES } from '../errors/error-codes.js';

// Mostrador de reclamos: TODOS los errores terminan aquí.
// Express lo reconoce porque recibe 4 cosas: (error, req, res, next)
export function manejarErrores(error, req, res, next) {
  // Si ya empezamos a responder, no podemos cambiar la respuesta
  if (res.headersSent) {
    return next(error);
  }

  // 🟡 Error ESPERADO: le explicamos al cliente qué pasó
  if (error instanceof AppError) {
    const respuesta = {
      error: {
        codigo: error.codigo,
        mensaje: error.message,
      },
    };

    if (error.detalles !== undefined) {
      respuesta.error.detalles = error.detalles;
    }

    respuesta.error.requestId = req.requestId;

    return res.status(error.status).json(respuesta);
  }

  // 🔴 Error INESPERADO: detalles en la terminal (con ticket), disculpa al cliente
  console.error(`💥 Error inesperado (id=${req.requestId}):`, error);

  return res.status(500).json({
    error: {
      codigo: ERROR_CODES.ERROR_INTERNO,
      mensaje: 'Ocurrió un error inesperado.',
      requestId: req.requestId,
    },
  });
}
```

Lo más útil del paso: cuando algo explote, el cliente recibe el ticket **y** la terminal muestra el error **con el mismo ticket**. Así se une la queja con la causa. 🔗

### Archivo 4 (REEMPLAZAR completo): `backend/src/app.js`

```javascript
import express from 'express';
import rutas from './routes/index.js';
import { asignarRequestId } from './middlewares/request-id.js';
import { registrarPeticion } from './middlewares/logger.js';
import { rutaNoEncontrada } from './middlewares/not-found.js';
import { manejarErrores } from './middlewares/error-handler.js';

const app = express();

// 🎫 1. Ticket para cada pedido (siempre primero)
app.use(asignarRequestId);

// 📓 2. La bitácora anota todos los pedidos
app.use(registrarPeticion);

// 📄 3. Guardia que sabe leer comandas en formato JSON
app.use(express.json());

// 🗂️ 4. Todo lo que empiece con /api va al directorio de rutas
app.use('/api', rutas);

// 🤷 5. Si nadie atendió el pedido: "ese plato no está en el menú"
app.use(rutaNoEncontrada);

// 🛎️ 6. Mostrador de reclamos: SIEMPRE al final
app.use(manejarErrores);

export default app;
```

## 🧪 Pruebas

**Prueba 1 — El ticket viaja de vuelta.** GET `/api/health` y abre la pestaña **Headers** de la respuesta en Thunder Client: `X-Request-Id: a3f9c2e1-...`. En la terminal: `[INFO ] GET /api/health → 200 (2 ms) id=a3f9c2e1-...`. ¡**El mismo número**! 🎯

**Prueba 2 — Cada pedido, un ticket distinto.** Pulsa **Send** 3 veces: 3 líneas con 3 `id` diferentes.

**Prueba 3 — El ticket en un error.** GET `/api/no-existe` → **404**:

```json
{
  "error": {
    "codigo": "RUTA_NO_ENCONTRADA",
    "mensaje": "La ruta solicitada no existe.",
    "requestId": "7c21b0d4-..."
  }
}
```

Y en la terminal, un `WARN` 🟡 con el mismo id.

**Prueba 4 — Los ? no se anotan 🤫.** GET `/api/health?clave=secreto123` → en la terminal solo aparece `/api/health`.

🎮 **Juego:** un aprendiz hace una petición y solo le dice al otro el `requestId`. El otro debe encontrar en la terminal qué ruta fue, qué status tuvo y cuánto tardó.

## 💾 Guardar

```powershell
git add .
git commit -m "feat: request id y registro de peticiones"
```

## ✅ Gate CP2-F

```text
[ ] Cada respuesta trae el header X-Request-Id
[ ] La terminal muestra una línea por pedido con el mismo id
[ ] Cada pedido tiene un id distinto
[ ] Los errores incluyen requestId en el JSON
[ ] 200 → INFO, 404 → WARN
[ ] Los ?parámetros no aparecen en la bitácora
[ ] Entiendo: requestId = ticket, logging = bitácora
[ ] Entiendo: qué NUNCA se anota
[ ] Commit hecho
```

---

# CP2-G — El casco de seguridad

## Primero: ¿qué son los headers?

Cada respuesta tiene dos partes:

```text
📦 La caja (body)          → { "status": "ok" }
🏷️ Las etiquetas (headers) → información pegada por fuera de la caja
```

Ya viste una etiqueta: `X-Request-Id`. El cliente no siempre las ve, pero **el navegador sí las lee y las obedece**.

## El problema: la caja grita secretos 📢

**Antes de instalar nada**, haz GET `/api/health` en Thunder Client y abre la pestaña **Headers** de la respuesta:

```text
X-Powered-By: Express
```

¡El restaurante le dice a **todo el mundo** qué tecnología usa! Es como poner en la puerta: *"Cerradura marca X, modelo 2019"*. Un ladrón ya sabe qué herramienta traer. 🦹 Y además **faltan** etiquetas que le dicen al navegador cómo protegerse.

## La solución: Helmet 🪖

*Helmet* significa **casco**. Con **una línea**:

1. **Quita** las etiquetas que revelan secretos.
2. **Agrega** etiquetas que protegen al navegador:

| Etiqueta | Explicado fácil |
|---|---|
| `X-Content-Type-Options: nosniff` | "Si la caja dice *jugo*, es jugo: no adivines qué hay dentro" 🧃 |
| `X-Frame-Options: SAMEORIGIN` | "Nadie puede esconder nuestra app debajo de una página falsa con un botón trampa" 🪤 |
| `Content-Security-Policy` | "Solo se aceptan ingredientes de proveedores de la lista" 📋 |
| `Referrer-Policy: no-referrer` | "Al salir hacia otra web, no cuentes de dónde vienes" 🤐 |
| `Strict-Transport-Security` | "Usa siempre la puerta segura (HTTPS)". En local no hace nada todavía, y está bien 🔒 |

## ⚠️ Una verdad importante

Helmet **no hace la app invencible**. Es como el casco para la bici: protege mucho, pero igual hay que mirar al cruzar. 🚲 La seguridad se construye **en capas**:

```text
🪖 Helmet     → etiquetas seguras      (este paso)
🚪 CORS       → quién puede llamarnos  (CP2-H)
📏 Límites    → tamaño de los pedidos  (CP2-I)
🐢 Rate limit → cuántos pedidos        (CP2-J)
✅ Zod        → que los datos tengan sentido (CP2-K)
🔑 Login      → quién eres             (CP3)
```

## 🛠️ Práctica

**Paso 1 — Instalar.** Detén el servidor y, dentro de `backend`:

```powershell
npm install helmet
```

**Paso 2 — `backend/src/app.js` (REEMPLAZAR completo)**

```javascript
import express from 'express';
import helmet from 'helmet';
import rutas from './routes/index.js';
import { asignarRequestId } from './middlewares/request-id.js';
import { registrarPeticion } from './middlewares/logger.js';
import { rutaNoEncontrada } from './middlewares/not-found.js';
import { manejarErrores } from './middlewares/error-handler.js';

const app = express();

// 🎫 1. Ticket para cada pedido (siempre primero)
app.use(asignarRequestId);

// 📓 2. La bitácora anota todos los pedidos
app.use(registrarPeticion);

// 🪖 3. Casco de seguridad: etiquetas seguras en cada respuesta
app.use(helmet());

// 📄 4. Guardia que sabe leer comandas en formato JSON
app.use(express.json());

// 🗂️ 5. Todo lo que empiece con /api va al directorio de rutas
app.use('/api', rutas);

// 🤷 6. Si nadie atendió el pedido: "ese plato no está en el menú"
app.use(rutaNoEncontrada);

// 🛎️ 7. Mostrador de reclamos: SIEMPRE al final
app.use(manejarErrores);

export default app;
```

Helmet va **arriba** para que **todas** las respuestas lleven casco, incluso las de error.

## 🧪 Pruebas

**Prueba 1 — Antes y después.** GET `/api/health` → pestaña **Headers**:

- ❌ Ya **no** está `X-Powered-By: Express`.
- ✅ Aparecen `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: no-referrer`, `Strict-Transport-Security`.
- ✅ `X-Request-Id` **sigue ahí**.

**Prueba 2 — El casco también protege los errores.** GET `/api/no-existe` → **404** con las mismas etiquetas de seguridad.

🎮 **Juego:** cuenta los headers de `/api/health` antes y después de Helmet. Con `git stash` puedes volver atrás un momento para contar, y con `git stash pop` regresas.

## 💾 Guardar

```powershell
git add .
git commit -m "feat: headers de seguridad con Helmet"
```

## ✅ Gate CP2-G

```text
[ ] helmet instalado
[ ] X-Powered-By ya no aparece
[ ] Aparecen nosniff, X-Frame-Options, CSP, Referrer-Policy
[ ] X-Request-Id sigue apareciendo
[ ] Los errores 404 también llevan el casco
[ ] Entiendo: headers = etiquetas pegadas en la caja
[ ] Entiendo: la seguridad va en capas
[ ] Commit hecho
```

---

# CP2-H — CORS: la mamá protectora

Este es el tema que más asusta a los principiantes. Con calma, deja de dar miedo. 😌

## Primero: ¿qué es un "origen"?

Un **origen** es la dirección de una página web, formada por **3 partes**:

```text
http://localhost:5173
 │        │       │
 │        │       └── puerto    (el número de puerta)
 │        └────────── dominio   (la calle)
 └─────────────────── protocolo (el tipo de camino)
```

Si **cualquiera** cambia, es **otro origen**, como dos casas en la misma calle con distinto número:

| Dirección A | Dirección B | ¿Mismo origen? |
|---|---|---|
| `http://localhost:5173` | `http://localhost:5173` | ✅ Sí |
| `http://localhost:5173` | `http://localhost:3000` | ❌ No (otro puerto) |
| `http://localhost:5173` | `https://localhost:5173` | ❌ No (otro protocolo) |
| `http://localhost:5173` | `http://pagina-mala.com` | ❌ No (otro dominio) |

En nuestro proyecto:

```text
🖥️ React (frontend)  → http://localhost:5173
🍳 Express (backend) → http://localhost:3000
```

**¡Son orígenes distintos!** Por eso necesitamos CORS.

## La historia de la mamá protectora 👩

Tu **navegador** es como una **mamá muy protectora**. Tienes la sesión abierta en tu banco y, sin saberlo, entras a una **página mala** que intenta, **usando tu navegador**, pedirle tus datos al banco:

```text
😈 Página mala: "Oye banco, dame los datos de este usuario"
                (y como usa TU navegador, lleva TU sesión)

👩 Mamá: "Un momento... Banco, ¿tú conoces a esta página?"
🏦 Banco: "No, no está en mi lista."
👩 Mamá: "Entonces NO le dejo ver la respuesta." 🚫
```

**Eso es CORS**: el navegador le pregunta al backend si confía en la página que hace el pedido. El backend responde con su **lista de invitados** (headers) y el navegador **obedece**.

## La parte que confunde a todos 🤯

> **El que bloquea NO es el backend. Es el navegador.**

El backend solo **declara** su lista de invitados. **Thunder Client no es una mamá**: eres tú hablando directamente con el backend, sin intermediario.

```text
🧪 Thunder Client → siempre funciona (no hay mamá)
🌐 Navegador      → aplica CORS (la mamá revisa)
```

Esa es la razón de la frase clásica: *"¡En Thunder Client funciona pero en mi página no!"*. 😉

## El "toc toc" antes de entrar 🚪

Para ciertos pedidos (por ejemplo, un POST con JSON o un PATCH), la mamá primero manda un pedido de prueba para **pedir permiso**:

```text
👩 OPTIONS: "Toc toc, ¿esta página puede enviarte un POST?"
🍳 Backend: "Sí, puede usar GET, POST, PATCH y DELETE."
👩 Ahora sí envía el POST de verdad.
```

Se llama **preflight** y usa el método **OPTIONS**. El paquete `cors` lo responde solo.

## ⚠️ CORS NO es login

```text
🚪 CORS  → ¿desde qué página vienes?
🔑 Login → ¿quién eres y qué puedes hacer?  (CP3)
```

## Nuestra lista de invitados 📋

Solo **una** página invitada: la de `FRONTEND_URL` (`http://localhost:5173`). Y si el pedido **no trae origen** (Thunder Client, pruebas automáticas), lo dejamos pasar: no viene de ninguna página, así que no hay nada que proteger.

## 🛠️ Práctica

**Paso 1 — Instalar:**

```powershell
npm install cors
```

**Paso 2 (NUEVO): `backend/src/config/cors.js`**

```javascript
import { env } from './env.js';

// 📋 Lista de invitados del backend
export const opcionesCors = {
  origin(origin, callback) {
    // Sin origen: no viene de una página web (Thunder Client, pruebas)
    if (!origin) {
      return callback(null, true);
    }

    // ✅ Nuestra página invitada: el frontend React
    if (origin === env.frontendUrl) {
      return callback(null, true);
    }

    // 🚫 Cualquier otra página: no la ponemos en la lista.
    // El navegador (la mamá) se encargará de bloquearla.
    return callback(null, false);
  },

  // Permite enviar cookies (las usaremos en el login, CP3)
  credentials: true,

  // Métodos que aceptamos
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],

  // Etiquetas que la página puede enviarnos
  allowedHeaders: ['Content-Type', 'Authorization'],

  // Etiquetas nuestras que React SÍ podrá leer (¡el ticket!)
  exposedHeaders: ['X-Request-Id'],

  // La mamá recuerda el "toc toc" por 10 minutos
  maxAge: 600,
};
```

`callback` es la forma de responder *"sí"* o *"no"*: `null` significa *"no hubo error"* y el segundo valor es la respuesta.

¿Por qué `exposedHeaders`? Por seguridad, la mamá **esconde** casi todas las etiquetas. Sin esta lista, React **no podría leer** el `X-Request-Id`.

**Paso 3 — `backend/src/app.js` (REEMPLAZAR completo)**

```javascript
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rutas from './routes/index.js';
import { opcionesCors } from './config/cors.js';
import { asignarRequestId } from './middlewares/request-id.js';
import { registrarPeticion } from './middlewares/logger.js';
import { rutaNoEncontrada } from './middlewares/not-found.js';
import { manejarErrores } from './middlewares/error-handler.js';

const app = express();

// 🎫 1. Ticket para cada pedido (siempre primero)
app.use(asignarRequestId);

// 📓 2. La bitácora anota todos los pedidos
app.use(registrarPeticion);

// 🪖 3. Casco de seguridad: etiquetas seguras en cada respuesta
app.use(helmet());

// 🚪 4. Lista de invitados: desde qué páginas nos pueden llamar
app.use(cors(opcionesCors));

// 📄 5. Guardia que sabe leer comandas en formato JSON
app.use(express.json());

// 🗂️ 6. Todo lo que empiece con /api va al directorio de rutas
app.use('/api', rutas);

// 🤷 7. Si nadie atendió el pedido: "ese plato no está en el menú"
app.use(rutaNoEncontrada);

// 🛎️ 8. Mostrador de reclamos: SIEMPRE al final
app.use(manejarErrores);

export default app;
```

CORS va **antes de las rutas** porque el "toc toc" debe responderse antes de que el pedido llegue a cualquier ruta.

## 🧪 Pruebas con Thunder Client

Vamos a **fingir ser el navegador** agregando la etiqueta `Origin` a mano: en la pestaña **Headers** de la **petición** (arriba), agrega la fila `Origin`.

**Prueba 1 — Sin origen.** GET `/api/health` sin `Origin` → **200**.

**Prueba 2 — Página invitada ✅.** `Origin: http://localhost:5173` → en los headers de la respuesta:

```text
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: X-Request-Id
```

**Prueba 3 — Página mala 😈.** `Origin: http://pagina-mala.com` → sigue respondiendo **200**. 😮 Pero mira: **NO aparece** `Access-Control-Allow-Origin`.

**Esta es la lección más importante del paso**: el backend respondió, pero **no puso a esa página en la lista**. Thunder Client lo muestra igual porque no es una mamá. Un navegador de verdad **no le dejaría ver la respuesta** a la página mala y mostraría el famoso error rojo de CORS. 🚫

**Prueba 4 — El "toc toc" 🚪.** Método **OPTIONS**, URL `/api/health`, headers:

```text
Origin: http://localhost:5173
Access-Control-Request-Method: POST
```

→ **204** con:

```text
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET,POST,PATCH,DELETE
Access-Control-Max-Age: 600
```

La prueba "de verdad" con navegador llegará al conectar React: si todo está bien, **no verás ningún error**. Y si aparece el error rojo, ya sabes qué revisar: **¿el origen está en la lista de invitados?** 🔍

## 💾 Guardar

```powershell
git add .
git commit -m "feat: CORS con lista de invitados del frontend"
```

## ✅ Gate CP2-H

```text
[ ] cors instalado
[ ] Sin Origin → 200
[ ] Origin 5173 → aparece Access-Control-Allow-Origin
[ ] Origin malo → 200 pero SIN Access-Control-Allow-Origin
[ ] OPTIONS → 204 con los métodos permitidos
[ ] Entiendo: origen = protocolo + dominio + puerto
[ ] Entiendo: quien bloquea es el navegador, no el backend
[ ] Entiendo: CORS no es login
[ ] Commit hecho
```

---

# CP2-I — El buzón y la comanda ilegible

## Dos problemas nuevos

Pronto tendremos pedidos **POST** y **PATCH** que traen una comanda en el **body**:

```json
{
  "fechaLectura": "2026-08-30",
  "valorLectura": 12555
}
```

### 📦 Problema 1: una comanda gigante

Nuestras comandas son chiquitas. Pero alguien podría mandar comandas de **500 páginas** 📚, una tras otra, y el mesero se agotaría leyendo basura. **Solución:** el buzón acepta máximo **100 KB** (la comanda más grande no llega a 1 KB). Si llega algo mayor → **413**.

### 📝 Problema 2: una comanda que no se entiende

```text
{
  "valorLectura": 12555,
```

¡Le falta el `}`! No es JSON válido. **Solución:** responder con calma → **400**.

## 400 vs 422 🤔

| Status | Significa | Ejemplo |
|---|---|---|
| **400** | **No se puede ni leer** ✍️🌀 | `{"valorLectura": 12555,` |
| **422** | **Se lee bien, pero no tiene sentido** 🤨 | `{"valorLectura": 125.5}` (debe ser entero) |

Una carta con **letra ilegible** es un 400. Una carta **perfectamente legible** que dice *"quiero 1,5 hermanos"* es un 422. El 422 llega en el paso K.

## 🧪 Prueba 0 — ANTES de cambiar nada

En Thunder Client:

- Método **POST**, URL `http://localhost:3000/api/health`
- **Body → JSON**, con este contenido roto a propósito:

```text
{
  "valorLectura": 12555,
```

Si Thunder Client se queja del JSON roto, usa **Body → Text** y agrega el header `Content-Type: application/json`.

Hoy responde **500 `ERROR_INTERNO`** 😱, y en la terminal aparece `💥 Error inesperado: SyntaxError...`.

**La culpa fue del cliente**, pero el restaurante dice *"se nos quemó algo"*. ¡Es una **falsa alarma**! 🚨 Un programador perdería tiempo buscando un bug que **no existe**.

## 🛠️ Práctica

### Archivo 1 (REEMPLAZAR completo): `backend/src/errors/error-codes.js`

```javascript
// Lista oficial de códigos de error.
// Iremos agregando más cuando los necesitemos, no antes.
export const ERROR_CODES = Object.freeze({
  RUTA_NO_ENCONTRADA: 'RUTA_NO_ENCONTRADA',
  JSON_INVALIDO: 'JSON_INVALIDO',
  SECURITY_BODY_DEMASIADO_GRANDE: 'SECURITY_BODY_DEMASIADO_GRANDE',
  ERROR_INTERNO: 'ERROR_INTERNO',
});
```

### Archivo 2 (REEMPLAZAR completo): `backend/src/middlewares/error-handler.js`

```javascript
import { AppError } from '../errors/app-error.js';
import { ERROR_CODES } from '../errors/error-codes.js';

// 🔎 Traductor: convierte los errores del lector de JSON
// en errores ESPERADOS (culpa del cliente, no de la cocina)
function traducirErrorDelBody(error) {
  // 📝 La comanda no se puede leer
  if (error.type === 'entity.parse.failed') {
    return new AppError({
      status: 400,
      codigo: ERROR_CODES.JSON_INVALIDO,
      mensaje: 'El cuerpo de la petición no es un JSON válido.',
    });
  }

  // 📦 La comanda es demasiado grande
  if (error.type === 'entity.too.large') {
    return new AppError({
      status: 413,
      codigo: ERROR_CODES.SECURITY_BODY_DEMASIADO_GRANDE,
      mensaje: 'El cuerpo de la petición es demasiado grande.',
    });
  }

  // Cualquier otro error sigue igual
  return error;
}

// Mostrador de reclamos: TODOS los errores terminan aquí.
// Express lo reconoce porque recibe 4 cosas: (error, req, res, next)
export function manejarErrores(errorOriginal, req, res, next) {
  // Si ya empezamos a responder, no podemos cambiar la respuesta
  if (res.headersSent) {
    return next(errorOriginal);
  }

  const error = traducirErrorDelBody(errorOriginal);

  // 🟡 Error ESPERADO: le explicamos al cliente qué pasó
  if (error instanceof AppError) {
    const respuesta = {
      error: {
        codigo: error.codigo,
        mensaje: error.message,
      },
    };

    if (error.detalles !== undefined) {
      respuesta.error.detalles = error.detalles;
    }

    respuesta.error.requestId = req.requestId;

    return res.status(error.status).json(respuesta);
  }

  // 🔴 Error INESPERADO: detalles en la terminal (con ticket), disculpa al cliente
  console.error(`💥 Error inesperado (id=${req.requestId}):`, error);

  return res.status(500).json({
    error: {
      codigo: ERROR_CODES.ERROR_INTERNO,
      mensaje: 'Ocurrió un error inesperado.',
      requestId: req.requestId,
    },
  });
}
```

`'entity.parse.failed'` y `'entity.too.large'` son las **etiquetas** que `express.json` pega a sus errores. Solo las reconocemos y las traducimos a nuestro idioma. 🗣️

### Archivo 3 (REEMPLAZAR completo): `backend/src/app.js`

Solo cambia la línea de `express.json`:

```javascript
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rutas from './routes/index.js';
import { opcionesCors } from './config/cors.js';
import { asignarRequestId } from './middlewares/request-id.js';
import { registrarPeticion } from './middlewares/logger.js';
import { rutaNoEncontrada } from './middlewares/not-found.js';
import { manejarErrores } from './middlewares/error-handler.js';

const app = express();

// 🎫 1. Ticket para cada pedido (siempre primero)
app.use(asignarRequestId);

// 📓 2. La bitácora anota todos los pedidos
app.use(registrarPeticion);

// 🪖 3. Casco de seguridad: etiquetas seguras en cada respuesta
app.use(helmet());

// 🚪 4. Lista de invitados: desde qué páginas nos pueden llamar
app.use(cors(opcionesCors));

// 📄 5. Lector de comandas JSON, con buzón de máximo 100 KB
app.use(express.json({ limit: '100kb' }));

// 🗂️ 6. Todo lo que empiece con /api va al directorio de rutas
app.use('/api', rutas);

// 🤷 7. Si nadie atendió el pedido: "ese plato no está en el menú"
app.use(rutaNoEncontrada);

// 🛎️ 8. Mostrador de reclamos: SIEMPRE al final
app.use(manejarErrores);

export default app;
```

## 🧪 Pruebas — DESPUÉS del cambio

**Prueba 1 — Comanda rota 📝.** Repite la Prueba 0. Ahora: **400** `JSON_INVALIDO`, y en la terminal ya **no hay 💥**, solo un `[WARN ] POST /api/health → 400`. ¡Falsa alarma eliminada! 🎉

**Prueba 2 — Comanda correcta, puerta equivocada 🚪.** Mismo POST con `{"valorLectura": 12555}` → **404**. Esta vez la comanda **sí se leyó**; el problema es que `/api/health` no atiende POST. Demuestra el **orden**: primero se lee la comanda y después se busca la ruta.

**Prueba 3 — Comanda gigante 📦.** Abre una **segunda terminal** (el `+` de la terminal de VS Code) para no detener el servidor:

```powershell
$grande = '{"relleno":"' + ('a' * 200000) + '"}'

try {
  Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method Post -ContentType "application/json" -Body $grande
} catch {
  "Status: " + [int]$_.Exception.Response.StatusCode
  $_.ErrorDetails.Message
}
```

La primera línea fabrica una comanda con 200 000 letras "a" (el doble del límite). Esperamos:

```text
Status: 413
{"error":{"codigo":"SECURITY_BODY_DEMASIADO_GRANDE","mensaje":"El cuerpo de la petición es demasiado grande.","requestId":"..."}}
```

## 💾 Guardar

```powershell
git add .
git commit -m "feat: límite de body y respuesta controlada para JSON inválido"
```

## ✅ Gate CP2-I

```text
[ ] JSON roto → 400 JSON_INVALIDO (antes era 500)
[ ] JSON roto ya NO muestra 💥, solo WARN
[ ] JSON correcto a POST /api/health → 404
[ ] Comanda de 200 KB → 413
[ ] Entiendo: 400 (ilegible) vs 422 (legible pero sin sentido)
[ ] Entiendo: una falsa alarma 500 hace perder tiempo
[ ] Commit hecho
```

---

# CP2-J — "Calma, uno a la vez"

## El problema 🍦

En una heladería, un cliente normal pide uno o dos helados. Pero si alguien pide **1000 por minuto**, la heladería se paraliza y **nadie más** es atendido. ¿Quién haría eso en nuestra app?

| Quién | Qué hace |
|---|---|
| 🤖 **Un robot malicioso** | Prueba miles de contraseñas por minuto |
| 😵 **Un error nuestro** (¡el más común!) | Un bug en React que pide datos **en un bucle infinito** |

## La idea: un contador por cliente 🧮

El guardia cuenta **cuántos pedidos hace cada cliente por minuto** y lo reconoce por su **IP**, el **número de casa** desde donde llega. 🏠

```text
🏠 Casa 192.168.1.5 → pedidos este minuto: 1, 2, 3 ... 120 ✅
                   → pedido 121: 🐢 "Calma, espera un poquito" → 429
                   → al minuto siguiente, el contador vuelve a 0 🔄
```

| Guardia | Límite | ¿Cuándo? |
|---|---|---|
| 🐢 **General** | **120 por minuto** por IP | Este paso |
| 🔐 **Login** | **5 intentos cada 15 minutos** | CP3 |

120 por minuto es **generoso** para humanos (nadie hace 2 clics por segundo durante un minuto entero) y **molesto** para robots.

El guardia también informa **cuántos pedidos quedan**, como el marcador de vidas de un videojuego 🎮:

```text
RateLimit-Limit: 120      → tu límite
RateLimit-Remaining: 117  → te quedan 117
RateLimit-Reset: 42       → el contador se reinicia en 42 segundos
```

Haremos una **fábrica de guardias** 🏭: le dices *"quiero un guardia de X pedidos cada Y minutos"* y lo construye. En el CP3 fabricaremos el del login con la misma máquina.

## 🛠️ Práctica

**Paso 1 — Instalar:**

```powershell
npm install express-rate-limit
```

### Archivo 1 (REEMPLAZAR completo): `backend/src/errors/error-codes.js`

```javascript
// Lista oficial de códigos de error.
// Iremos agregando más cuando los necesitemos, no antes.
export const ERROR_CODES = Object.freeze({
  RUTA_NO_ENCONTRADA: 'RUTA_NO_ENCONTRADA',
  JSON_INVALIDO: 'JSON_INVALIDO',
  SECURITY_BODY_DEMASIADO_GRANDE: 'SECURITY_BODY_DEMASIADO_GRANDE',
  RATE_LIMIT_EXCEDIDO: 'RATE_LIMIT_EXCEDIDO',
  ERROR_INTERNO: 'ERROR_INTERNO',
});
```

### Archivo 2 (NUEVO): `backend/src/middlewares/rate-limit.js`

```javascript
import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';
import { ERROR_CODES } from '../errors/error-codes.js';

// 🏭 Fábrica de guardias "calma, uno a la vez"
// Ejemplo: crearLimitador({ minutos: 1, maximo: 120 })
export function crearLimitador({ minutos, maximo, omitir = () => false }) {
  return rateLimit({
    windowMs: minutos * 60 * 1000, // la ventana de tiempo, en milisegundos
    limit: maximo,                 // cuántos pedidos caben en esa ventana

    standardHeaders: true,  // etiquetas RateLimit-Limit, -Remaining, -Reset
    legacyHeaders: false,   // sin las etiquetas antiguas X-RateLimit-*

    skip: omitir,           // cuándo NO contar

    // 🛎️ En vez de responder él mismo, manda el reclamo a nuestro mostrador.
    // Así el 429 tiene el mismo formato que todos los errores (con ticket).
    handler(req, res, next) {
      next(
        new AppError({
          status: 429,
          codigo: ERROR_CODES.RATE_LIMIT_EXCEDIDO,
          mensaje: 'Demasiadas solicitudes. Intenta nuevamente más tarde.',
        })
      );
    },
  });
}

// 🐢 Guardia general: 120 pedidos por minuto por cada IP.
// En las pruebas automáticas no cuenta (ahí haremos cientos de pedidos
// seguidos a propósito y no queremos que el guardia los frene).
export const limitadorGeneral = crearLimitador({
  minutos: 1,
  maximo: 120,
  omitir: () => env.esTest,
});
```

### Archivo 3 (REEMPLAZAR completo): `backend/src/app.js`

```javascript
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rutas from './routes/index.js';
import { opcionesCors } from './config/cors.js';
import { asignarRequestId } from './middlewares/request-id.js';
import { registrarPeticion } from './middlewares/logger.js';
import { limitadorGeneral } from './middlewares/rate-limit.js';
import { rutaNoEncontrada } from './middlewares/not-found.js';
import { manejarErrores } from './middlewares/error-handler.js';

const app = express();

// 🎫 1. Ticket para cada pedido (siempre primero)
app.use(asignarRequestId);

// 📓 2. La bitácora anota todos los pedidos
app.use(registrarPeticion);

// 🪖 3. Casco de seguridad: etiquetas seguras en cada respuesta
app.use(helmet());

// 🚪 4. Lista de invitados: desde qué páginas nos pueden llamar
app.use(cors(opcionesCors));

// 🐢 5. "Calma, uno a la vez": máximo 120 pedidos por minuto
app.use(limitadorGeneral);

// 📄 6. Lector de comandas JSON, con buzón de máximo 100 KB
app.use(express.json({ limit: '100kb' }));

// 🗂️ 7. Todo lo que empiece con /api va al directorio de rutas
app.use('/api', rutas);

// 🤷 8. Si nadie atendió el pedido: "ese plato no está en el menú"
app.use(rutaNoEncontrada);

// 🛎️ 9. Mostrador de reclamos: SIEMPRE al final
app.use(manejarErrores);

export default app;
```

¿Por qué el guardia 🐢 va **en el paso 5**?

- **Después de CORS:** así el 429 ya lleva las etiquetas de CORS y React **podrá leerlo**. Si fuera antes, la mamá navegador lo escondería y React solo vería un misterioso error de red.
- **Antes de leer el JSON:** frenamos a los robots **sin gastar tiempo leyendo sus comandas**.

## 🧪 Pruebas

**Prueba 1 — El marcador de vidas 🎮.** GET `/api/health` → headers `RateLimit-Limit: 120`, `RateLimit-Remaining: 119`. Pulsa **Send** varias veces: `Remaining` baja.

**Prueba 2 — El robot impaciente 🤖.** En una **segunda terminal**:

```powershell
$resultados = 1..125 | ForEach-Object {
  try {
    Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing | Out-Null
    200
  } catch {
    [int]$_.Exception.Response.StatusCode
  }
}

$resultados | Group-Object | Select-Object Name, Count
```

Esperamos algo así (los números pueden variar un poco, porque tus pedidos anteriores también cuentan):

```text
Name Count
---- -----
200    115
429     10
```

Mientras corre, mira la terminal del servidor: pasan los `[INFO ]` 🟢 y luego empiezan los `[WARN ] ... → 429` 🟡. 📺

**Prueba 3 — El 429 tiene nuestro formato.** Justo después del robot:

```powershell
try {
  Invoke-RestMethod -Uri "http://localhost:3000/api/health"
} catch {
  "Status: " + [int]$_.Exception.Response.StatusCode
  $_.ErrorDetails.Message
}
```

```text
Status: 429
{"error":{"codigo":"RATE_LIMIT_EXCEDIDO","mensaje":"Demasiadas solicitudes. Intenta nuevamente más tarde.","requestId":"..."}}
```

**Prueba 4 — El castigo se acaba 🔄.** Espera **1 minuto** → `/api/health` vuelve a **200**.

> 💡 Si Thunder Client sigue respondiendo 200 mientras PowerShell recibe 429, no es un error: tu compu a veces usa dos "números de casa" para `localhost` (`::1` y `127.0.0.1`), y el guardia los cuenta como clientes distintos.

## 💾 Guardar

```powershell
git add .
git commit -m "feat: rate limit general con respuesta 429 uniforme"
```

## ✅ Gate CP2-J

```text
[ ] express-rate-limit instalado
[ ] Las respuestas traen RateLimit-Limit / Remaining / Reset
[ ] El robot de 125 pedidos recibe 429 después de ~120
[ ] El 429 tiene nuestro formato: codigo + mensaje + requestId
[ ] Después de 1 minuto vuelve a responder 200
[ ] Entiendo: protege de robots Y de nuestros propios bugs
[ ] Entiendo: por qué va después de CORS y antes del JSON
[ ] Commit hecho
```

---

# CP2-K — El inspector de formularios

## El problema

Pronto React mandará comandas para registrar lecturas. Pero ¿qué pasa si llega esto?

```json
{ "fechaLectura": "ayer", "valorLectura": 125.5 }
{ "valorLectura": "doce mil" }
{ "valorLectura": -30 }
{ "valorLectura": 12555, "rol": "ADMIN" }
```

El JSON está **bien escrito** (no es 400), pero lo que dice **no tiene sentido**: ¡el **422**! 🎯

## La idea: un inspector en la ventanilla 🏦

Antes de pasar tu formulario al gerente, un **inspector** revisa que esté bien llenado. Si algo está mal, **te lo devuelve marcando TODAS las casillas malas de una vez**. Ese inspector se llama **Zod**.

## ⚠️ Lo que el inspector NO decide

| 🔍 Inspector (Zod) | 👨‍💼 Gerente (Service) |
|---|---|
| ¿Es un número entero? | ¿Es menor que la lectura anterior? |
| ¿La fecha tiene formato `AAAA-MM-DD`? | ¿Ya existe una lectura para esa fecha? |
| ¿El correo parece un correo? | ¿Ese correo ya está registrado? |
| **Revisa la FORMA** | **Decide las REGLAS del negocio** |

El inspector no sabe nada de la bodega ni de las reglas del hogar. Eso lo deciden los **servicios**.

## Dos superpoderes extra 🦸

**🛡️ Tira los campos que nadie pidió.** Si alguien agrega a escondidas `"rol": "ADMIN"`, el inspector **lo tira a la basura**. Solo pasan los campos que **nosotros** definimos. 😈🗑️

**🔄 Traduce textos a números (solo donde hace falta).** Todo lo que viene **en la URL** llega como texto: en `/api/lecturas/15`, ese `15` es `"15"`. El inspector lo **convierte** (*coerce*). En el **body**, en cambio, somos estrictos: si esperamos un número y llega `"12555"`, **se rechaza**.

```text
URL  → todo llega como texto, por eso se convierte  🔄
Body → JSON ya tiene tipos, se exige el correcto      🎯
```

## El sello de "aprobado" 📮

Si el formulario pasa, el inspector deja la versión limpia en `req.validated`. El controller **solo usa la versión sellada**:

```javascript
req.body              // ❌ el formulario original, tal como llegó
req.validated.body    // ✅ revisado, limpio y sellado
```

## 🛠️ Práctica

**Paso 1 — Instalar:**

```powershell
npm install zod
```

### Archivo 1 (REEMPLAZAR completo): `backend/src/errors/error-codes.js`

```javascript
// Lista oficial de códigos de error.
// Iremos agregando más cuando los necesitemos, no antes.
export const ERROR_CODES = Object.freeze({
  RUTA_NO_ENCONTRADA: 'RUTA_NO_ENCONTRADA',
  JSON_INVALIDO: 'JSON_INVALIDO',
  VALIDACION_DATOS_INVALIDOS: 'VALIDACION_DATOS_INVALIDOS',
  SECURITY_BODY_DEMASIADO_GRANDE: 'SECURITY_BODY_DEMASIADO_GRANDE',
  RATE_LIMIT_EXCEDIDO: 'RATE_LIMIT_EXCEDIDO',
  ERROR_INTERNO: 'ERROR_INTERNO',
});
```

### Archivo 2 (NUEVO): `backend/src/middlewares/validar.js`

```javascript
import { AppError } from '../errors/app-error.js';
import { ERROR_CODES } from '../errors/error-codes.js';

// Las 3 partes del pedido que podemos revisar
const UBICACIONES = ['params', 'query', 'body'];

// 🔍 Fábrica de inspectores.
// Uso: validar({ body: miEsquema }) o validar({ params: otroEsquema })
export function validar(esquemas) {
  return (req, res, next) => {
    const validado = {}; // aquí guardamos lo que pasó la inspección
    const campos = [];   // aquí anotamos TODAS las casillas malas

    for (const ubicacion of UBICACIONES) {
      const esquema = esquemas[ubicacion];

      // Si no nos pidieron revisar esta parte, la saltamos
      if (!esquema) continue;

      // safeParse = "revisa, pero no explotes: dime si pasó o no"
      const resultado = esquema.safeParse(req[ubicacion]);

      if (resultado.success) {
        validado[ubicacion] = resultado.data;
      } else {
        for (const problema of resultado.error.issues) {
          campos.push({
            // "valorLectura", o la parte entera si el problema es general
            campo:
              problema.path.length > 0 ? problema.path.join('.') : ubicacion,
            mensaje: problema.message,
          });
        }
      }
    }

    // ❌ Hubo casillas malas: devolvemos el formulario marcado
    if (campos.length > 0) {
      return next(
        new AppError({
          status: 422,
          codigo: ERROR_CODES.VALIDACION_DATOS_INVALIDOS,
          mensaje: 'Algunos datos no son válidos.',
          detalles: { campos },
        })
      );
    }

    // ✅ Todo bien: sello de aprobado 📮
    req.validated = validado;
    next();
  };
}
```

El inspector **no se detiene en el primer error**: devuelve la **lista completa**, para que React marque en rojo **todas** las casillas malas de una vez. 🟥🟥

### Archivo 3 (NUEVO): `backend/src/validators/common.validators.js`

```javascript
import { z } from 'zod';

// 🔢 Un identificador que llega por la URL: /api/lecturas/15
// Llega como texto ("15"), así que lo convertimos a número (coerce)
export const idSchema = z.coerce
  .number({ error: 'El identificador debe ser un número.' })
  .int({ error: 'El identificador debe ser un número entero.' })
  .positive({ error: 'El identificador debe ser mayor que cero.' });
```

La validación de **fechas reales** (que no exista el 30 de febrero 📅❌) llega en el CP5.

### Archivo 4 (REEMPLAZAR, versión TEMPORAL): `backend/src/routes/index.js`

```javascript
import { Router } from 'express';
import { z } from 'zod';
import healthRoutes from './health.routes.js';
import { validar } from '../middlewares/validar.js';
import { idSchema } from '../validators/common.validators.js';

const router = Router();

router.use('/health', healthRoutes);

// ─────────────────────────────────────────────
// 🧪 TEMPORAL — borrar después de probar CP2-K
// ─────────────────────────────────────────────

// 📋 El formulario de una lectura, tal como lo exigiremos en el CP5
const lecturaDePruebaSchema = z.object(
  {
    fechaLectura: z
      .string({ error: 'fechaLectura debe ser un texto.' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        error: 'fechaLectura debe tener el formato AAAA-MM-DD.',
      }),

    valorLectura: z
      .number({ error: 'valorLectura debe ser un número.' })
      .int({ error: 'valorLectura debe ser un número entero.' })
      .nonnegative({ error: 'valorLectura no puede ser negativo.' }),
  },
  { error: 'El cuerpo debe ser un objeto JSON.' }
);

// Inspección del BODY
router.post(
  '/prueba/lectura',
  validar({ body: lecturaDePruebaSchema }),
  (req, res) => {
    res.json({ recibido: req.validated.body });
  }
);

// Inspección de los PARAMS (lo que va en la URL)
router.get(
  '/prueba/lectura/:id',
  validar({ params: z.object({ id: idSchema }) }),
  (req, res) => {
    res.json({
      recibido: req.validated.params,
      tipoDelId: typeof req.validated.params.id,
    });
  }
);

export default router;
```

La ruta del POST se lee: *"cuando llegue POST a /prueba/lectura, **primero** pasa por el inspector y, **si aprueba**, responde"*.

## 🧪 Pruebas con Thunder Client

Pruebas 1 a 7: **POST** `http://localhost:3000/api/prueba/lectura`, con **Body → JSON**:

| # | Body | Status | Qué observar |
|---|---|---|---|
| 1 | `{"fechaLectura":"2026-08-30","valorLectura":12555}` | **200** | ✅ Pasa la inspección |
| 2 | `{"fechaLectura":"2026-08-30","valorLectura":125.5}` | **422** | "debe ser un número entero" |
| 3 | `{"fechaLectura":"2026-08-30","valorLectura":"12555"}` | **422** | En el body se exige el tipo exacto 🎯 |
| 4 | `{"fechaLectura":"2026-08-30","valorLectura":-30}` | **422** | "no puede ser negativo" |
| 5 | `{"fechaLectura":"30/08/2026","valorLectura":"hola"}` | **422** | ¡**Dos** errores de una vez! 🟥🟥 |
| 6 | `{"fechaLectura":"2026-08-30","valorLectura":12555,"rol":"ADMIN"}` | **200** | 🛡️ En `recibido` **no aparece** `rol` |
| 7 | Sin body | **422** | campo `body`: "El cuerpo debe ser un objeto JSON." |

La prueba 5 se ve así:

```json
{
  "error": {
    "codigo": "VALIDACION_DATOS_INVALIDOS",
    "mensaje": "Algunos datos no son válidos.",
    "detalles": {
      "campos": [
        { "campo": "fechaLectura", "mensaje": "fechaLectura debe tener el formato AAAA-MM-DD." },
        { "campo": "valorLectura", "mensaje": "valorLectura debe ser un número." }
      ]
    },
    "requestId": "..."
  }
}
```

Y dos pruebas **GET**:

| # | URL | Status | Qué observar |
|---|---|---|---|
| 8 | `/api/prueba/lectura/15` | **200** | `tipoDelId: "number"` 🔄 |
| 9 | `/api/prueba/lectura/abc` | **422** | "El identificador debe ser un número." |

🤔 **Pregunta para la clase:** en la prueba 6, ¿por qué es bueno que responda 200? Porque el inspector no se enoja por el campo extra: **lo ignora**. Nadie puede colarlo, y React no se rompe si algún día manda un dato de más.

## 🧹 Limpiar las rutas de mentira

Deja `backend/src/routes/index.js` otra vez así (REEMPLAZAR completo):

```javascript
import { Router } from 'express';
import healthRoutes from './health.routes.js';

// El directorio del centro comercial:
// aquí se anota qué local atiende cada dirección
const router = Router();

router.use('/health', healthRoutes);

// Locales que abriremos más adelante:
// router.use('/auth', authRoutes);
// router.use('/lecturas', lecturasRoutes);

export default router;
```

`validar.js` y `common.validators.js` **se quedan**: se prueban automáticamente en el paso N y se usan desde el CP3.

## 💾 Guardar

```powershell
git status   # NO debe aparecer routes/index.js
git add .
git commit -m "feat: validación de entrada con Zod y respuesta 422 uniforme"
```

## ✅ Gate CP2-K

```text
[ ] zod instalado
[ ] Lectura correcta → 200
[ ] 125.5, "12555" y -30 → 422 con el mensaje correcto
[ ] Varios errores → todos juntos en "campos"
[ ] Campo extra "rol" → descartado en silencio
[ ] /prueba/lectura/15 → id como número; /abc → 422
[ ] Rutas de prueba borradas
[ ] Entiendo: Zod revisa la FORMA, el servicio decide las REGLAS
[ ] Entiendo: req.validated = versión sellada
[ ] Commit hecho
```

---

# CP2-L — Todo o nada

## La historia de las alcancías 🐷🐷

Ana tiene **10 monedas** y Beto **0**. Ana le regala **5**. Son **2 pasos**:

```text
Paso 1: sacar 5 de la alcancía de Ana  → Ana: 5
Paso 2: meter 5 en la alcancía de Beto → Beto: 5
```

Total antes: 10. Total después: 10. ✅ Pero si **entre el paso 1 y el 2 se corta la luz** ⚡💥:

```text
Paso 1: ✅ Ana: 5
        ⚡ ¡SE CORTÓ LA LUZ!
Paso 2: ❌ nunca ocurrió → Beto: 0
```

Total: **5**. 😱 ¡**5 monedas desaparecieron del universo**!

## La idea: una transacción

> **"O se hacen TODOS los pasos, o no se hace NINGUNO."**

Como armar LEGO en una bandeja: si una pieza no encaja, **toda la bandeja vuelve a la caja**. 🧱↩️

| Palabra | Significa | En la historia |
|---|---|---|
| `BEGIN` | "Empiezo algo que es todo o nada" | 📝 Abro el cuaderno de borrador |
| `COMMIT` | "Todo salió bien, hazlo definitivo" | ✅ Paso todo al cuaderno oficial |
| `ROLLBACK` | "Algo falló, deshaz todo" | 🗑️ Arranco la hoja de borrador |

Mientras no hay `COMMIT`, los cambios están **a lápiz en un borrador**: nadie más los ve y se pueden borrar.

**¿Dónde la usaremos?** Registrar una lectura (CP5) tendrá varios pasos: mirar la última lectura, revisar que la nueva no sea menor y guardarla. Si dos personas registran a la vez, sin transacción podría colarse una lectura inválida.

## ⚠️ La regla de oro: UN solo carrito 🛒

Cada `pool.query(...)` presta **un carrito cualquiera**. Pero **la transacción vive dentro de UN carrito**:

```text
❌ MAL:
pool.query('BEGIN')        → 🛒1 abre el borrador
pool.query('UPDATE ...')   → 🛒3 escribe directo en el oficial 😱
pool.query('COMMIT')       → 🛒2 no entiende nada

✅ BIEN:
tomar 🛒1 y quedárselo:
  BEGIN → UPDATE → UPDATE → COMMIT   (todo en 🛒1)
devolver 🛒1 a la fila
```

Por eso haremos un **ayudante** que toma **un** carrito, abre el borrador, hace tu trabajo, confirma o deshace y **siempre** devuelve el carrito.

## 🛠️ Práctica

### Archivo 1 (NUEVO): `backend/src/db/transaction.js`

```javascript
import { pool } from './pool.js';

// 🤝 Ayudante "todo o nada".
// Uso:
//   await ejecutarTransaccion(async (client) => {
//     await client.query(...);   // ⚠️ SIEMPRE client, nunca pool
//     await client.query(...);
//   });
export async function ejecutarTransaccion(trabajo) {
  // 🛒 1. Tomar UN carrito y quedárnoslo hasta el final
  const client = await pool.connect();
  let carritoRoto = false;

  try {
    // 📝 2. Abrir el cuaderno de borrador
    await client.query('BEGIN');

    // 🧱 3. Hacer todos los pasos del trabajo
    const resultado = await trabajo(client);

    // ✅ 4. Todo salió bien: pasar al cuaderno oficial
    await client.query('COMMIT');

    return resultado;
  } catch (error) {
    // 🗑️ 5. Algo falló: arrancar la hoja de borrador
    try {
      await client.query('ROLLBACK');
    } catch (errorAlDeshacer) {
      carritoRoto = true;
      console.error('⚠️ No se pudo deshacer la transacción:', errorAlDeshacer.message);
    }

    // El error original sigue su camino (hasta el mostrador de reclamos)
    throw error;
  } finally {
    // 🛒 6. SIEMPRE devolver el carrito, pase lo que pase.
    //    Si se rompió, no vuelve a la fila: se manda a reciclar.
    client.release(carritoRoto);
  }
}
```

Tres detalles:

- **`finally`** = *"esto se hace SIEMPRE"*. Si olvidáramos devolver el carrito, después de 10 errores **se acabarían** y el backend se congelaría. 🥶
- **`throw error`** después del `ROLLBACK`: el ayudante **no esconde** el problema; lo deja llegar al mostrador de reclamos.
- **`carritoRoto`**: si ni el `ROLLBACK` funcionó, `release(true)` le dice al pool *"no lo reutilices, fabrica uno nuevo"*. ♻️

### Archivo 2 (TEMPORAL): `backend/scripts/probar-transaccion.js`

```javascript
import { env } from '../src/config/env.js';
import { pool } from '../src/db/pool.js';
import { ejecutarTransaccion } from '../src/db/transaction.js';

// 🛡️ Los experimentos se hacen SOLO en la base de pruebas
if (!env.esTest) {
  throw new Error('Ejecuta este experimento en modo test: $env:NODE_ENV="test"');
}

// 👀 Mostrar cómo están las alcancías
async function mostrar(titulo) {
  const { rows } = await pool.query(
    'SELECT nombre, monedas FROM demo_alcancias ORDER BY nombre'
  );
  const total = rows.reduce((suma, fila) => suma + fila.monedas, 0);

  console.log(`\n${titulo}`);
  for (const fila of rows) {
    console.log(`   🐷 ${fila.nombre}: ${fila.monedas} monedas`);
  }
  console.log(`   💰 Total: ${total}`);
}

// 🔄 Dejar las alcancías como al inicio: Ana 10, Beto 0
async function reiniciar() {
  await pool.query('DELETE FROM demo_alcancias');
  await pool.query(
    "INSERT INTO demo_alcancias (nombre, monedas) VALUES ('Ana', 10), ('Beto', 0)"
  );
}

// Preparar el experimento
await pool.query('DROP TABLE IF EXISTS demo_alcancias');
await pool.query(`
  CREATE TABLE demo_alcancias (
    nombre  TEXT PRIMARY KEY,
    monedas INTEGER NOT NULL
  )
`);
await reiniciar();
await mostrar('🎬 INICIO');

// Experimento 1: SIN transacción, se corta la luz
try {
  await pool.query("UPDATE demo_alcancias SET monedas = monedas - 5 WHERE nombre = 'Ana'");
  throw new Error('⚡ ¡Se cortó la luz!');
} catch (error) {
  console.log(`\n${error.message}`);
}
await mostrar('😱 Experimento 1 — SIN transacción');

// Experimento 2: CON transacción, se corta la luz
await reiniciar();

try {
  await ejecutarTransaccion(async (client) => {
    await client.query("UPDATE demo_alcancias SET monedas = monedas - 5 WHERE nombre = 'Ana'");
    throw new Error('⚡ ¡Se cortó la luz!');
  });
} catch (error) {
  console.log(`\n${error.message}`);
}
await mostrar('🛡️ Experimento 2 — CON transacción (falló a la mitad)');

// Experimento 3: CON transacción, todo sale bien
await reiniciar();

await ejecutarTransaccion(async (client) => {
  await client.query("UPDATE demo_alcancias SET monedas = monedas - 5 WHERE nombre = 'Ana'");
  await client.query("UPDATE demo_alcancias SET monedas = monedas + 5 WHERE nombre = 'Beto'");
});
await mostrar('✅ Experimento 3 — CON transacción (todo bien)');

// Limpiar
await pool.query('DROP TABLE demo_alcancias');
await pool.end();
console.log('\n🧹 Experimento terminado y tabla borrada.');
```

## 🧪 Ejecutar el experimento

Dentro de `backend` (no hace falta el servidor):

```powershell
$env:NODE_ENV="test"
node scripts/probar-transaccion.js
Remove-Item Env:NODE_ENV
```

Esperamos:

```text
🎬 INICIO
   🐷 Ana: 10 monedas
   🐷 Beto: 0 monedas
   💰 Total: 10

😱 Experimento 1 — SIN transacción
   🐷 Ana: 5 monedas
   🐷 Beto: 0 monedas
   💰 Total: 5              ← ¡desaparecieron 5 monedas!

🛡️ Experimento 2 — CON transacción (falló a la mitad)
   🐷 Ana: 10 monedas       ← ¡el ROLLBACK le devolvió todo!
   🐷 Beto: 0 monedas
   💰 Total: 10

✅ Experimento 3 — CON transacción (todo bien)
   🐷 Ana: 5 monedas
   🐷 Beto: 5 monedas
   💰 Total: 10
```

**Mira el total** 💰: sin transacción baja a 5; con transacción **siempre es 10**.

**Prueba de seguridad 🛡️:** ejecuta `node scripts/probar-transaccion.js` **sin** el modo test → debe negarse. Los experimentos nunca tocan tu base real.

Después, **borra el script**: `Remove-Item scripts\probar-transaccion.js`

🤔 **Pregunta para la clase:** en el Experimento 2, ¿qué pasaría si dentro del trabajo usáramos `pool.query` en lugar de `client.query`? Respuesta: el `UPDATE` iría en **otro carrito**, fuera del borrador; el `ROLLBACK` no lo desharía y Ana perdería sus monedas igual que en el Experimento 1.

## 💾 Guardar

```powershell
git status   # solo src/db/transaction.js, sin el script
git add .
git commit -m "feat: helper de transacciones todo o nada"
```

## ✅ Gate CP2-L

```text
[ ] Existe src/db/transaction.js
[ ] Experimento 1: total 5 · Experimento 2: total 10 · Experimento 3: Ana 5, Beto 5
[ ] Sin modo test, el script se niega
[ ] Script borrado
[ ] Entiendo: transacción = todo o nada (BEGIN, COMMIT, ROLLBACK)
[ ] Entiendo: dentro de la transacción SIEMPRE client, nunca pool
[ ] Entiendo: finally siempre devuelve el carrito
[ ] Commit hecho
```

---

# CP2-M — El robot probador

## El problema: los clics infinitos 😩

En el CP2 hicimos **más de 30 pruebas a mano**. Si en el CP5 cambias algo en `app.js`, ¿rompiste algo del CP2? **Tendrías que repetir las 30 pruebas.** Nadie lo hace, y así se cuelan los bugs. 🐛

## La idea: un robot que lo repite todo 🤖

Cada prueba se escribe **una sola vez**, como una receta. Con **un comando**, un robot las ejecuta **todas en 2 segundos**:

```text
✅ 28 pruebas pasaron
❌ 2 pruebas fallaron → aquí está exactamente cuál y por qué
```

Esto son las **pruebas automatizadas**, y además forman parte del criterio de éxito del MVP.

| Robot | Qué hace | En el restaurante |
|---|---|---|
| **Vitest** 🧑‍🏫 | Ejecuta las pruebas y dice ✅ o ❌ | El inspector de calidad con su lista |
| **Supertest** 🧑‍🍳 | Hace pedidos al backend, como Thunder Client | Un cliente de prueba que entra por la **puerta de servicio** |

### 🚪 La puerta de servicio

¿Recuerdas que en el CP0 separamos `app.js` (el restaurante) y `server.js` (abrir la puerta a la calle)? **Supertest entra directo a `app.js`**, sin abrir el puerto 3000. Por eso no necesitas `npm run dev`, no choca con tu servidor y es rapidísimo. ¡Esa separación era para esto! 🎁

## La forma de una prueba 🔬

```javascript
describe('La calculadora', () => {          // 📁 tema de las pruebas
  it('suma 2 + 2 y da 4', () => {           // 🧪 una prueba (se lee como frase)
    const resultado = 2 + 2;                // 1️⃣ hacer algo
    expect(resultado).toBe(4);              // 2️⃣ "espero que sea 4"
  });
});
```

- **`describe`**: la **carpeta** que agrupa pruebas del mismo tema.
- **`it`**: **una prueba**, escrita como frase.
- **`expect(...).toBe(...)`**: la **pregunta de sí o no**.

## 🛠️ Práctica

### Paso 1 — Instalar

```powershell
npm install -D vitest supertest
```

**`-D`** = herramientas **de desarrollo**: las usa el programador, pero **no viajan** con la app publicada. Aparecen en `devDependencies`.

### Paso 2 — Los comandos del robot en `package.json`

Aquí la excepción a la regla del archivo completo: si copiaras todo `package.json`, podrías pisar las versiones que npm instaló en tu compu. Reemplaza **solo el bloque `"scripts"`**:

```json
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",
    "test": "cross-env NODE_ENV=test vitest run",
    "test:watch": "cross-env NODE_ENV=test vitest",
    "db:check": "node --env-file=.env scripts/db-check.js",
    "db:migrate": "node --env-file=.env scripts/db-migrate.js",
    "db:seed": "node --env-file=.env scripts/db-seed.js",
    "db:status": "node --env-file=.env scripts/db-status.js",
    "db:check:test": "node --env-file=.env.test scripts/db-check.js",
    "db:migrate:test": "node --env-file=.env.test scripts/db-migrate.js",
    "db:seed:test": "node --env-file=.env.test scripts/db-seed.js",
    "db:status:test": "node --env-file=.env.test scripts/db-status.js"
  },
```

| Comando | Qué hace |
|---|---|
| `npm test` | Ejecuta **todas** las pruebas **una vez** |
| `npm run test:watch` | Se queda vigilando: al guardar, **repite las pruebas solito** 👀 |

`cross-env NODE_ENV=test` le dice al portero `env.js` *"estamos en modo prueba, abre `.env.test`"*. Así el robot **siempre** usa la base de juguete. `cross-env` hace que funcione igual en Windows, Mac y Linux. (Vitest suele poner `NODE_ENV=test` por su cuenta, pero lo escribimos explícito para que se lea en el comando). Si `cross-env` no está instalado, instálalo con `npm install -D cross-env`.

### Paso 3 (NUEVO): `backend/vitest.config.js`

Al lado de `package.json`:

```javascript
import { defineConfig } from 'vitest/config';

// ⚙️ Instrucciones para el robot probador
export default defineConfig({
  test: {
    // Somos un backend: probamos con Node, no con un navegador
    environment: 'node',

    // Dónde buscar las pruebas: cualquier archivo que termine en .test.js
    include: ['tests/**/*.test.js'],

    // Un archivo de pruebas a la vez.
    // Más adelante varias pruebas usarán la MISMA base de datos de test,
    // y si corren al mismo tiempo se pisarían entre ellas.
    fileParallelism: false,

    // Si una prueba tarda más de 10 segundos, algo está mal
    testTimeout: 10_000,
  },
});
```

### Paso 4 (NUEVO): `backend/tests/unit/entorno.test.js`

La primera prueba verifica **lo más importante de todo**: *¿el robot usa la base de juguete?*

```javascript
import { describe, expect, it } from 'vitest';
import { env } from '../../src/config/env.js';

describe('Entorno de pruebas', () => {
  it('el robot corre en modo test', () => {
    expect(env.nodeEnv).toBe('test');
    expect(env.esTest).toBe(true);
  });

  it('usa la base de datos de juguete, nunca la real', () => {
    expect(env.db.name).toBe('consumo_electrico_test');
  });

  it('usa el puerto de pruebas', () => {
    expect(env.port).toBe(3001);
  });
});
```

Es el **cinturón de seguridad** de todas las demás: si algún día el robot apunta a la base real, **esta prueba falla primero**. 🛡️

```text
tests/
├── unit/          → prueba UNA pieza sola
└── integration/   → prueba VARIAS piezas juntas (paso N)
```

## 🧪 ¡A probar al robot!

**Prueba 1:**

```powershell
npm test
```

```text
 ✓ tests/unit/entorno.test.js (3 tests)

 Test Files  1 passed (1)
      Tests  3 passed (3)
```

**Prueba 2 — Hacer fallar al robot a propósito 😈.** Cambia `toBe(3001)` por `toBe(9999)` y ejecuta `npm test`:

```text
 × Entorno de pruebas > usa el puerto de pruebas

AssertionError: expected 3001 to be 9999

- Expected   9999
+ Received   3001
```

Cómo leer un fallo, en 3 preguntas 🔍:

1. **¿Cuál prueba?** → "usa el puerto de pruebas"
2. **¿Qué esperaba?** → `Expected 9999`
3. **¿Qué recibió?** → `Received 3001`

Un fallo **no es un regaño**: es el robot diciéndote **dónde mirar**. 🧭 **Vuelve a poner `3001`.**

**Prueba 3 — El modo vigilante 👀.** `npm run test:watch`, cambia algo en el archivo de prueba y guarda: el robot repite solito. Para salir, presiona **`q`**.

## 💾 Guardar

```powershell
git add .
git commit -m "test: configurar Vitest y Supertest con primera prueba de entorno"
```

## ✅ Gate CP2-M

```text
[ ] vitest y supertest en devDependencies
[ ] Existe vitest.config.js
[ ] npm test → 3 pruebas en verde
[ ] Vi un fallo a propósito y supe leerlo (Expected / Received)
[ ] npm run test:watch repite solo al guardar
[ ] Entiendo: Supertest entra por la puerta de servicio (app.js)
[ ] Entiendo: describe, it, expect
[ ] Commit hecho
```

---

# CP2-N — Enseñarle al robot todas las pruebas

## La idea

Convertir **todas las pruebas manuales** del CP2 en recetas para el robot.

## Dos herramientas nuevas 🧰

**🧪 El mini restaurante de laboratorio.** Algunas piezas son difíciles de probar en el restaurante completo (el guardia 🐢 general está apagado en modo test; el inspector 🔍 aún no tiene rutas reales). Así que armamos un **mini restaurante** con lo mínimo (ticket, lector JSON y mostrador) y **en el medio ponemos solo la pieza a estudiar**, como estudiar **una planta** en una maceta en vez de todo el bosque. 🌱

**⏰ Preparar y limpiar:**

| Función | Cuándo | En la clase de cocina |
|---|---|---|
| `beforeAll` | Una vez, antes de todo el archivo | 🍳 Sacar los utensilios |
| `beforeEach` | Antes de **cada** prueba | 🧽 Limpiar la mesa antes de cada receta |
| `afterAll` | Una vez, al terminar | 🧹 Guardar todo y dejar la cocina limpia |

`beforeEach` hace que cada prueba empiece **desde cero**, sin "contaminarse" con la anterior.

## El mapa 🗺️

```text
tests/
├── helpers/
│   └── app-de-prueba.js        🧪 el mini restaurante
├── unit/
│   ├── entorno.test.js         ✅ (paso M)
│   ├── validar.test.js         🔍 el inspector
│   └── error-handler.test.js   🛎️ el mostrador
└── integration/
    ├── app.test.js             🍽️ el restaurante completo
    ├── rate-limit.test.js      🐢 la fábrica de limitadores
    └── transaction.test.js     🐷 las alcancías
```

## 🛠️ Práctica (todos los archivos son NUEVOS)

### Archivo 1: `backend/tests/helpers/app-de-prueba.js`

```javascript
import express from 'express';
import { asignarRequestId } from '../../src/middlewares/request-id.js';
import { rutaNoEncontrada } from '../../src/middlewares/not-found.js';
import { manejarErrores } from '../../src/middlewares/error-handler.js';

// 🧪 Mini restaurante de laboratorio.
// Trae lo mínimo: ticket, lector JSON y mostrador de reclamos.
// En el medio, cada prueba pone SOLO la pieza que quiere estudiar.
export function crearAppDePrueba(prepararRutas) {
  const app = express();

  app.use(asignarRequestId);
  app.use(express.json());

  prepararRutas(app); // 🌱 aquí va la pieza a estudiar

  app.use(rutaNoEncontrada);
  app.use(manejarErrores);

  return app;
}
```

### Archivo 2: `backend/tests/integration/app.test.js`

```javascript
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { env } from '../../src/config/env.js';

// Forma de un ticket UUID: 8-4-4-4-12 caracteres
const FORMATO_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('🩺 Health', () => {
  it('GET /api/health responde 200 con status ok', async () => {
    const respuesta = await request(app).get('/api/health');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ status: 'ok' });
  });
});

describe('🎫 Request ID', () => {
  it('cada respuesta trae un X-Request-Id con formato UUID', async () => {
    const respuesta = await request(app).get('/api/health');

    expect(respuesta.headers['x-request-id']).toMatch(FORMATO_UUID);
  });

  it('dos pedidos reciben tickets distintos', async () => {
    const primero = await request(app).get('/api/health');
    const segundo = await request(app).get('/api/health');

    expect(primero.headers['x-request-id']).not.toBe(
      segundo.headers['x-request-id']
    );
  });
});

describe('🤷 Rutas inexistentes', () => {
  it('GET /api/no-existe responde 404 con nuestro formato y el mismo ticket', async () => {
    const respuesta = await request(app).get('/api/no-existe');

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.error.codigo).toBe('RUTA_NO_ENCONTRADA');
    expect(respuesta.body.error.requestId).toBe(
      respuesta.headers['x-request-id']
    );
  });

  it('POST /api/health responde 404 (el método también cuenta)', async () => {
    const respuesta = await request(app).post('/api/health');

    expect(respuesta.status).toBe(404);
  });
});

describe('🪖 Helmet', () => {
  it('agrega headers de seguridad y oculta X-Powered-By', async () => {
    const respuesta = await request(app).get('/api/health');

    expect(respuesta.headers['x-content-type-options']).toBe('nosniff');
    expect(respuesta.headers['x-powered-by']).toBeUndefined();
  });
});

describe('🚪 CORS', () => {
  it('pone en la lista al frontend invitado', async () => {
    const respuesta = await request(app)
      .get('/api/health')
      .set('Origin', env.frontendUrl);

    expect(respuesta.headers['access-control-allow-origin']).toBe(
      env.frontendUrl
    );
    expect(respuesta.headers['access-control-expose-headers']).toContain(
      'X-Request-Id'
    );
  });

  it('NO pone en la lista a una página desconocida', async () => {
    const respuesta = await request(app)
      .get('/api/health')
      .set('Origin', 'http://pagina-mala.com');

    expect(respuesta.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('responde el "toc toc" (preflight) con los métodos permitidos', async () => {
    const respuesta = await request(app)
      .options('/api/health')
      .set('Origin', env.frontendUrl)
      .set('Access-Control-Request-Method', 'POST');

    expect(respuesta.status).toBe(204);
    expect(respuesta.headers['access-control-allow-methods']).toContain('POST');
  });
});

describe('📏 Body', () => {
  it('JSON roto → 400 JSON_INVALIDO', async () => {
    const respuesta = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"valorLectura": 12555,');

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error.codigo).toBe('JSON_INVALIDO');
  });

  it('body de 200 KB → 413 SECURITY_BODY_DEMASIADO_GRANDE', async () => {
    const respuesta = await request(app)
      .post('/api/health')
      .send({ relleno: 'a'.repeat(200_000) });

    expect(respuesta.status).toBe(413);
    expect(respuesta.body.error.codigo).toBe('SECURITY_BODY_DEMASIADO_GRANDE');
  });
});

describe('🐢 Rate limit general', () => {
  it('está apagado en modo test (125 pedidos seguidos pasan)', async () => {
    for (let i = 0; i < 125; i++) {
      const respuesta = await request(app).get('/api/health');
      expect(respuesta.status).toBe(200);
    }
  });
});
```

Cada prueba **se lee como una frase**: leyendo solo los `it(...)` ya se entiende qué hace el backend. ¡Las pruebas también son **documentación**! 📖

### Archivo 3: `backend/tests/integration/rate-limit.test.js`

Como el guardia general está apagado en test, probamos **la fábrica** con un límite de **2**:

```javascript
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { crearLimitador } from '../../src/middlewares/rate-limit.js';
import { crearAppDePrueba } from '../helpers/app-de-prueba.js';

// Un mini restaurante NUEVO en cada prueba (contador desde cero)
function appConLimiteDeDos() {
  return crearAppDePrueba((app) => {
    app.use(crearLimitador({ minutos: 1, maximo: 2 }));
    app.get('/ping', (req, res) => res.json({ pong: true }));
  });
}

describe('🐢 Fábrica de limitadores', () => {
  it('deja pasar 2 pedidos y frena el 3.º con 429', async () => {
    const app = appConLimiteDeDos();

    const primero = await request(app).get('/ping');
    const segundo = await request(app).get('/ping');
    const tercero = await request(app).get('/ping');

    expect(primero.status).toBe(200);
    expect(segundo.status).toBe(200);
    expect(tercero.status).toBe(429);
    expect(tercero.body.error.codigo).toBe('RATE_LIMIT_EXCEDIDO');
    expect(tercero.body.error.requestId).toBeDefined();
  });

  it('informa cuántos pedidos quedan (el marcador de vidas)', async () => {
    const app = appConLimiteDeDos();

    const respuesta = await request(app).get('/ping');

    expect(respuesta.headers['ratelimit-limit']).toBe('2');
    expect(respuesta.headers['ratelimit-remaining']).toBe('1');
  });
});
```

¿Por qué no 121 pedidos? **La fábrica es la misma** para 2 que para 120. Si funciona con 2, funciona con 120, y tarda milisegundos. ⚡

### Archivo 4: `backend/tests/unit/validar.test.js`

```javascript
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { validar } from '../../src/middlewares/validar.js';
import { idSchema } from '../../src/validators/common.validators.js';
import { crearAppDePrueba } from '../helpers/app-de-prueba.js';

const lecturaSchema = z.object(
  {
    fechaLectura: z
      .string({ error: 'fechaLectura debe ser un texto.' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        error: 'fechaLectura debe tener el formato AAAA-MM-DD.',
      }),
    valorLectura: z
      .number({ error: 'valorLectura debe ser un número.' })
      .int({ error: 'valorLectura debe ser un número entero.' }),
  },
  { error: 'El cuerpo debe ser un objeto JSON.' }
);

// 🧪 Mini restaurante con el inspector en dos ventanillas
const app = crearAppDePrueba((app) => {
  app.post('/lectura', validar({ body: lecturaSchema }), (req, res) => {
    res.json(req.validated.body);
  });

  app.get('/cosas/:id', validar({ params: z.object({ id: idSchema }) }), (req, res) => {
    res.json(req.validated.params);
  });
});

describe('🔍 Inspector de body', () => {
  it('aprueba un formulario correcto y descarta los campos extra', async () => {
    const respuesta = await request(app).post('/lectura').send({
      fechaLectura: '2026-08-30',
      valorLectura: 12555,
      rol: 'ADMIN', // 😈 intento de colarse
    });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({
      fechaLectura: '2026-08-30',
      valorLectura: 12555,
    });
  });

  it('rechaza un decimal con 422 y dice qué campo está mal', async () => {
    const respuesta = await request(app).post('/lectura').send({
      fechaLectura: '2026-08-30',
      valorLectura: 125.5,
    });

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error.codigo).toBe('VALIDACION_DATOS_INVALIDOS');
    expect(respuesta.body.error.detalles.campos).toEqual([
      { campo: 'valorLectura', mensaje: 'valorLectura debe ser un número entero.' },
    ]);
  });

  it('devuelve TODOS los errores de una vez', async () => {
    const respuesta = await request(app).post('/lectura').send({
      fechaLectura: '30/08/2026',
      valorLectura: 'hola',
    });

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error.detalles.campos).toHaveLength(2);
  });

  it('rechaza un pedido sin body', async () => {
    const respuesta = await request(app).post('/lectura');

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error.detalles.campos[0].campo).toBe('body');
  });
});

describe('🔍 Inspector de params', () => {
  it('convierte el id de texto a número', async () => {
    const respuesta = await request(app).get('/cosas/15');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ id: 15 });
  });

  it('rechaza un id que no es número', async () => {
    const respuesta = await request(app).get('/cosas/abc');

    expect(respuesta.status).toBe(422);
  });
});
```

### Archivo 5: `backend/tests/unit/error-handler.test.js`

```javascript
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../src/errors/app-error.js';
import { crearAppDePrueba } from '../helpers/app-de-prueba.js';

// 🧪 Mini restaurante con rutas que fallan a propósito
const app = crearAppDePrueba((app) => {
  app.get('/esperado', () => {
    throw new AppError({
      status: 409,
      codigo: 'DEMO_CONFLICTO',
      mensaje: 'Error esperado de prueba.',
      detalles: { motivo: 'demo' },
    });
  });

  app.get('/inesperado', () => {
    throw new Error('Secreto de la cocina: tabla usuarios, línea 42');
  });

  app.get('/async', async () => {
    await Promise.resolve();
    throw new Error('Falló dentro de un async');
  });
});

describe('🛎️ Mostrador de reclamos', () => {
  // 🤫 Silenciamos el console.error del mostrador para que la
  // pantalla del robot no se llene de 💥. Y al final lo restauramos.
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('error ESPERADO → su status, código, detalles y ticket', async () => {
    const respuesta = await request(app).get('/esperado');

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.error).toEqual({
      codigo: 'DEMO_CONFLICTO',
      mensaje: 'Error esperado de prueba.',
      detalles: { motivo: 'demo' },
      requestId: respuesta.headers['x-request-id'],
    });
  });

  it('error INESPERADO → 500 genérico, sin revelar secretos', async () => {
    const respuesta = await request(app).get('/inesperado');

    expect(respuesta.status).toBe(500);
    expect(respuesta.body.error.codigo).toBe('ERROR_INTERNO');
    expect(respuesta.body.error.mensaje).toBe('Ocurrió un error inesperado.');

    // 🕵️ El secreto NO debe aparecer en ninguna parte de la respuesta
    expect(JSON.stringify(respuesta.body)).not.toContain('Secreto');

    // ...pero SÍ se anotó en la terminal para el programador
    expect(console.error).toHaveBeenCalled();
  });

  it('error dentro de un async también llega al mostrador', async () => {
    const respuesta = await request(app).get('/async');

    expect(respuesta.status).toBe(500);
    expect(respuesta.body.error.codigo).toBe('ERROR_INTERNO');
  });
});
```

`vi.spyOn(...)` pone un **espía** 🕵️ sobre `console.error`: lo silencia y además **anota si alguien lo llamó**.

### Archivo 6: `backend/tests/integration/transaction.test.js`

Las alcancías del paso L, ahora como receta permanente. **Sí usa PostgreSQL** (la base de juguete):

```javascript
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { pool } from '../../src/db/pool.js';
import { ejecutarTransaccion } from '../../src/db/transaction.js';

async function monedasDe(nombre) {
  const { rows } = await pool.query(
    'SELECT monedas FROM test_alcancias WHERE nombre = $1',
    [nombre]
  );
  return rows[0].monedas;
}

const sacarDeAna = "UPDATE test_alcancias SET monedas = monedas - 5 WHERE nombre = 'Ana'";
const darABeto = "UPDATE test_alcancias SET monedas = monedas + 5 WHERE nombre = 'Beto'";

// 🍳 Una vez: sacar los utensilios
beforeAll(async () => {
  await pool.query('DROP TABLE IF EXISTS test_alcancias');
  await pool.query(`
    CREATE TABLE test_alcancias (
      nombre  TEXT PRIMARY KEY,
      monedas INTEGER NOT NULL
    )
  `);
});

// 🧽 Antes de cada prueba: Ana 10, Beto 0
beforeEach(async () => {
  await pool.query('DELETE FROM test_alcancias');
  await pool.query(
    "INSERT INTO test_alcancias (nombre, monedas) VALUES ('Ana', 10), ('Beto', 0)"
  );
});

// 🧹 Al final: dejar la cocina limpia y cerrar los carritos
afterAll(async () => {
  await pool.query('DROP TABLE IF EXISTS test_alcancias');
  await pool.end();
});

describe('🤝 Transacciones todo o nada', () => {
  it('COMMIT: si todo sale bien, se guardan todos los pasos', async () => {
    await ejecutarTransaccion(async (client) => {
      await client.query(sacarDeAna);
      await client.query(darABeto);
    });

    expect(await monedasDe('Ana')).toBe(5);
    expect(await monedasDe('Beto')).toBe(5);
  });

  it('ROLLBACK: si algo falla, no se guarda NINGÚN paso', async () => {
    await expect(
      ejecutarTransaccion(async (client) => {
        await client.query(sacarDeAna);
        throw new Error('⚡ ¡Se cortó la luz!');
      })
    ).rejects.toThrow('Se cortó la luz');

    expect(await monedasDe('Ana')).toBe(10); // 🐷 ¡nada se perdió!
    expect(await monedasDe('Beto')).toBe(0);
  });

  it('devuelve el resultado del trabajo', async () => {
    const resultado = await ejecutarTransaccion(async () => 'listo');

    expect(resultado).toBe('listo');
  });

  it('siempre devuelve el carrito: 15 fallos seguidos no agotan el pool', async () => {
    for (let i = 0; i < 15; i++) {
      await expect(
        ejecutarTransaccion(async () => {
          throw new Error('falla');
        })
      ).rejects.toThrow('falla');
    }

    // Si algún carrito no se hubiera devuelto, aquí nos quedaríamos sin carritos 🥶
    const uno = await ejecutarTransaccion(async (client) => {
      const { rows } = await client.query('SELECT 1 AS uno');
      return rows[0].uno;
    });

    expect(uno).toBe(1);
  });
});
```

La última prueba es ingeniosa: el pool tiene **máximo 10 carritos**. Si el ayudante no los devolviera al fallar, tras 10 fallos no quedaría ninguno. Hacemos **15** para demostrar que **todos** vuelven a la fila. 🛒

## 🧪 ¡Que corra el robot!

PostgreSQL debe estar encendido. **No hace falta** `npm run dev`.

```powershell
npm test
```

```text
 ✓ tests/integration/app.test.js (12 tests)
 ✓ tests/integration/rate-limit.test.js (2 tests)
 ✓ tests/integration/transaction.test.js (4 tests)
 ✓ tests/unit/entorno.test.js (3 tests)
 ✓ tests/unit/error-handler.test.js (3 tests)
 ✓ tests/unit/validar.test.js (6 tests)

 Test Files  6 passed (6)
      Tests  30 passed (30)
```

🎉 **30 pruebas en unos 2 segundos.**

### 😈 El robot guardián

En `src/app.js`, **comenta** la línea de Helmet: `// app.use(helmet());`. Ejecuta `npm test`:

```text
 × 🪖 Helmet > agrega headers de seguridad y oculta X-Powered-By

AssertionError: expected undefined to be 'nosniff'
```

¡**El robot atrapó el error** en segundos! 🦸 **Descomenta la línea** y confirma que todo vuelve a verde.

> 💡 Si la prueba de transacciones falla con un error de conexión, revisa que `.env.test` tenga tu contraseña real y que `npm run db:check:test` funcione.

## 💾 Guardar

```powershell
git status   # tests/helpers, tests/integration y 2 archivos en tests/unit; NO src/app.js
git add .
git commit -m "test: pruebas automáticas del pipeline, validación, errores y transacciones"
```

## ✅ Gate CP2-N

```text
[ ] npm test → 6 archivos, 30 pruebas en verde
[ ] Al comentar Helmet, el robot lo detecta; restaurado y todo en verde
[ ] Entiendo: el mini restaurante de laboratorio
[ ] Entiendo: beforeAll / beforeEach / afterAll
[ ] Entiendo: por qué probar el limitador con 2 y no con 120
[ ] Entiendo: el espía (vi.spyOn)
[ ] Commit hecho
```

---

# CP2-O — Gate final

Este paso no agrega funciones: es la **revisión final antes de entregar**.

## 1. La revisión completa en 3 comandos 🔍

Dentro de `backend`:

```powershell
npm test
```

→ **30 pruebas en verde**.

```powershell
npm run dev
```

→ Modo `development`, puerto `3000`, bodega `consumo_electrico (usuario consumo_app)`. `/api/health` → **200**. Cierra con Ctrl + C.

```powershell
git log --oneline
```

→ La historia del CP2, **un commit por paso**. Esa lista **es la película** de cómo creció el proyecto. 🎬

## 2. Así quedó el restaurante 🍽️

```text
PEDIDO
  ▼
🎫 1. requestId      → número de ticket
📓 2. logger         → bitácora del portero
🪖 3. helmet         → casco de seguridad
🚪 4. cors           → lista de invitados
🐢 5. rate limit     → "calma, uno a la vez"
📄 6. express.json   → lector de comandas (máx. 100 KB)
🗂️ 7. rutas          → directorio del centro comercial
         └── 🔍 validar → inspector (por ruta)
🤷 8. 404            → "ese plato no está en el menú"
🛎️ 9. errores        → mostrador de reclamos
  ▼
RESPUESTA (con ticket, casco y formato uniforme)
```

```text
backend/
├── database/
│   ├── migrations/        001_esquema_inicial.sql, 002_sesiones.sql
│   └── seeds/             001_medidor_principal.sql
├── scripts/               db-check, db-migrate, db-seed, db-status
├── src/
│   ├── config/            env.js, cors.js
│   ├── db/                pool.js, transaction.js
│   ├── errors/            app-error.js, error-codes.js
│   ├── middlewares/       error-handler, logger, not-found,
│   │                      rate-limit, request-id, validar
│   ├── routes/            index.js, health.routes.js
│   ├── validators/        common.validators.js
│   ├── app.js             el restaurante
│   └── server.js          abrir la puerta a la calle
├── tests/
│   ├── helpers/           app-de-prueba.js
│   ├── unit/              entorno, validar, error-handler
│   └── integration/       app, rate-limit, transaction
├── vitest.config.js
├── .env.example
└── .env.test.example
```

### Catálogo de errores

| Status | Código |
|---|---|
| 400 | `JSON_INVALIDO` |
| 404 | `RUTA_NO_ENCONTRADA` |
| 413 | `SECURITY_BODY_DEMASIADO_GRANDE` |
| 422 | `VALIDACION_DATOS_INVALIDOS` (con `detalles.campos`) |
| 429 | `RATE_LIMIT_EXCEDIDO` |
| 500 | `ERROR_INTERNO` |

Toda respuesta de error trae `codigo`, `mensaje`, `detalles` (opcional) y `requestId`.

## 3. Anotar lo que decidimos 📝

En SDD, **la documentación es la fuente de verdad**. Durante el CP1 y el CP2 se tomaron decisiones que **no estaban** en las specs originales, o que las ajustan: fechas como texto, BIGINT como número, el orden del pipeline, qué registra el logger, cómo responde CORS, etc.

Se anotan en un **registro de decisiones**: [`docs/DECISIONES.md`](../DECISIONES.md). Cada decisión tiene número, checkpoint, motivo y spec afectada. Así, dentro de 3 meses, cualquiera sabrá **por qué** el código es así.

```powershell
cd ..
git add docs/DECISIONES.md
git commit -m "docs: registro de decisiones técnicas del CP1 y CP2"
```

## 4. Cerrar con la etiqueta 🏷️

```powershell
git tag -a cp2 -m "CHECKPOINT 2 — Backend base, seguridad, validación y pruebas"
git push
git push origin --tags
```

---

## ✅ Gate final del CHECKPOINT 2

```text
BACKEND BASE
[ ] Rutas organizadas (routes/index.js + health.routes.js)
[ ] Configuración centralizada y validada (env.js)
[ ] Pool con verificación, tipos DATE/BIGINT y cierre ordenado
[ ] Helper de transacciones todo o nada

SEGURIDAD Y CALIDAD
[ ] Errores uniformes con codigo + mensaje + requestId
[ ] Request ID y logging sin datos sensibles
[ ] Helmet, CORS, límite de body y rate limit
[ ] Validación con Zod (422)

PRUEBAS
[ ] npm test → 30 pruebas en verde
[ ] El robot detecta cuando se rompe algo

DOCUMENTACIÓN
[ ] docs/DECISIONES.md creado
[ ] Un commit por paso, historia limpia
[ ] Tag cp2 creado y subido
```

```text
🏆 CHECKPOINT 2 → CERRADO
```

---

## 🎮 Preguntas de repaso

Úsalas en clase. Las respuestas están debajo de cada pregunta.

**1. En Express, ¿qué hace `next()` dentro de un middleware?**

> Le dice al pedido **"pase, siga"** hacia el siguiente guardia. Si un middleware no llama `next()` ni responde, el cliente se queda esperando para siempre.

**2. Llega `{"valorLectura": 125.5}` y exigimos un entero. ¿Qué status corresponde?**

> **422**: el JSON se lee bien, pero no tiene sentido. 400 sería si ni siquiera se pudiera leer.

**3. ¿Por qué en Thunder Client "siempre funciona" aunque CORS no permita el origen?**

> Porque quien bloquea es el **navegador** (la mamá protectora), y Thunder Client no es un navegador. El backend solo declara su lista de invitados.

**4. Dentro de `ejecutarTransaccion(async (client) => { ... })`, ¿qué se usa para las consultas?**

> **`client.query`**, porque la transacción vive dentro de un solo carrito. `pool.query` prestaría otro carrito que no sabe nada del borrador.

**5. Un bug inesperado explota en la cocina. ¿Qué recibe el cliente?**

> Un **500** con un mensaje amable y el `requestId`. Los detalles van **solo a la terminal**, para no revelar secretos de la cocina.

**6. ¿Por qué Supertest puede probar el backend sin `npm run dev`?**

> Porque entra directo a `app.js` por la **puerta de servicio**, gracias a que `app.js` y `server.js` están separados desde el CP0.

**7. ¿Por qué `"9" > "10"` es peligroso para nuestras lecturas?**

> Porque al comparar textos, JavaScript compara letra por letra y da `true`. La regla "la lectura nueva no puede ser menor que la anterior" se rompería. Por eso `BIGINT` se convierte a número.

**8. ¿Por qué el rate limit va después de CORS y antes de `express.json`?**

> Después de CORS, para que React pueda leer el 429. Antes del JSON, para no gastar tiempo leyendo pedidos que se van a rechazar.

---

## ➡️ Siguiente

**CHECKPOINT 3 — Autenticación, sesiones y roles** 🔐: login con correo y contraseña, access token y refresh token, primer administrador, roles ADMIN y USUARIO.
