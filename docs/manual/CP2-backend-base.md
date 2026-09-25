# CHECKPOINT 2 — Backend base: el restaurante 🍽️

> **Etiqueta Git:** `cp2` · **Ver todos los pasos:** `git log --oneline cp1..cp2`

## 🎯 Objetivo

Convertir el backend mínimo del CP0 en un restaurante **ordenado, seguro y probado**, listo para recibir las funciones reales (login, lecturas, estadísticas) en los siguientes checkpoints.

El CP2 se divide en **15 pasos pequeños** (A → O). Cada paso agrega **una sola idea** y termina con su commit.

| Paso | Tema | Commit |
|---|---|---|
| [A](#cp2-a--cómo-viaja-una-petición) | Cómo viaja una petición | *(solo teoría)* |
| [B](#cp2-b--organizar-las-rutas) | Organizar las rutas | `refactor: organizar rutas del backend` |
| [C](#cp2-c--la-libreta-de-configuración) | Configuración centralizada | `feat: configuración centralizada y validada del entorno` |
| [D](#cp2-d--los-carritos-de-la-bodega) | Pool de PostgreSQL | `feat: pool de PostgreSQL con verificación, tipos y cierre ordenado` |
| [E](#cp2-e--el-mostrador-de-reclamos) | Manejo de errores | `feat: manejo centralizado de errores y 404 uniforme` |
| [F](#cp2-f--el-número-de-ticket-y-la-bitácora) | Request ID y logging | `feat: request id y registro de peticiones` |
| [G](#cp2-g--el-casco-de-seguridad) | Helmet | `feat: headers de seguridad con Helmet` |
| [H](#cp2-h--cors-la-mamá-protectora) | CORS | `feat: CORS con lista de invitados del frontend` |
| [I](#cp2-i--el-buzón-y-la-comanda-ilegible) | Límite de body y JSON roto | `feat: límite de body y respuesta controlada para JSON inválido` |
| [J](#cp2-j--calma-uno-a-la-vez) | Rate limiting | `feat: rate limit general con respuesta 429 uniforme` |
| [K](#cp2-k--el-inspector-de-formularios) | Validación con Zod | `feat: validación de entrada con Zod y respuesta 422 uniforme` |
| [L](#cp2-l--todo-o-nada) | Transacciones | `feat: helper de transacciones todo o nada` |
| [M](#cp2-m--el-robot-probador) | Vitest + Supertest | `test: configurar Vitest y Supertest con primera prueba de entorno` |
| [N](#cp2-n--enseñarle-al-robot-todas-las-pruebas) | Pruebas automáticas | `test: pruebas automáticas del pipeline, validación, errores y transacciones` |
| [O](#cp2-o--gate-final) | Gate final | `docs: registro de decisiones técnicas del CP1 y CP2` |

> 💡 Para ver el código exacto de cualquier paso: `git log --oneline cp1..cp2`, copia el código del commit y ejecuta `git show <código>`.

---

## CP2-A — Cómo viaja una petición

**Solo teoría, sin código.** Todo pedido al backend funciona como en un restaurante: llega una comanda, pasa por guardias, se atiende y vuelve una bandeja.

### Los métodos: ¿qué quieres hacer?

| Método | En el restaurante | En nuestra app |
|---|---|---|
| **GET** | "¿Me muestras el menú?" 👀 | Ver lecturas, ver el dashboard |
| **POST** | "Quiero pedir algo nuevo" 🆕 | Registrar una lectura, iniciar sesión |
| **PATCH** | "Cámbiale solo la salsa" ✏️ | Corregir una lectura, cambiar el tema |
| **DELETE** | "Cancela mi pedido" ❌ | Casi no se usa: no se borran lecturas ni usuarios |

### Middlewares y `next()`

Los **middlewares** son guardias en la entrada. Cada uno revisa algo y tiene dos opciones:

- Todo bien → **"pase, siga"** → `next()`
- Algo mal → detiene el pedido y responde con un error.

⚠️ Un guardia que no llama `next()` ni responde deja al cliente **esperando para siempre**. Y el **orden** de los guardias importa.

### Separar responsabilidades

```text
🧑‍💼 Mesero   → Controller  (recibe el pedido, entrega la bandeja)
👨‍🍳 Chef     → Service     (conoce las reglas del negocio)
📦 Bodeguero → Repository  (el único que escribe SQL)
🏪 Bodega    → PostgreSQL
```

### Los códigos de estado 🚦

| Código | Significa | En el restaurante |
|---|---|---|
| 200 | Todo bien | "Aquí está su plato" 😊 |
| 201 | Se creó algo | "Pedido registrado" 🆕 |
| 204 | Hecho, sin contenido | "Listo" 👍 |
| 400 | Pedido ilegible | "No entiendo su letra" ✍️ |
| 401 | No sé quién eres | "¿Tiene reservación?" 🤔 |
| 403 | Sé quién eres, pero no puedes | "La cocina es solo para personal" 🚫 |
| 404 | No existe | "Ese plato no está en el menú" 🤷 |
| 409 | Choca con algo existente | "Esa mesa ya está reservada" ⚠️ |
| 413 | Pedido demasiado grande | "Su comanda no cabe en el buzón" 📦 |
| 422 | Legible pero sin sentido | "¿Media pizza y cuarto?" 🤨 |
| 429 | Demasiados pedidos | "Calma, uno a la vez" 🐢 |
| 500 | Falló la cocina | "Se nos quemó algo" 🔥 |

**Truco:** 2xx = buenas noticias · 4xx = culpa del cliente · 5xx = culpa del restaurante.

### 🧪 Prueba

Con `npm run dev`, en Thunder Client:

- GET `http://localhost:3000/api/health` → **200**
- GET `http://localhost:3000/api/no-existe` → **404** (con un feo `Cannot GET`, que se arregla en el paso E)

---

## CP2-B — Organizar las rutas

### El problema

`app.js` hacía dos trabajos: preparar el restaurante **y** atender `/api/health`. Con 25 rutas futuras, sería una sopa ilegible. 🍝

### La idea: un centro comercial 🏬

```text
app.js              → el centro comercial "API"
routes/index.js     → el directorio del mall
health.routes.js    → el local "Health"
```

La URL se arma **pegando pedacitos**: `/api` + `/health` + `/` = `/api/health`.

> 🩺 `/api/health` **no es de ejemplo**: se queda para siempre. Es el letrero de "ABIERTO" que responde *"¿estás vivo?"*.

Un **Router** es un mini-restaurante que atiende solo *su* tema.

### Archivos

- ➕ [`src/routes/health.routes.js`](../../backend/src/routes/health.routes.js)
- ➕ [`src/routes/index.js`](../../backend/src/routes/index.js)
- ✏️ `src/app.js`: ya no conoce `health`, solo dice `app.use('/api', rutas)`

```javascript
// routes/index.js — el directorio
const router = Router();
router.use('/health', healthRoutes);
// Más adelante: router.use('/lecturas', lecturasRoutes);
```

### 🧪 Prueba

Las mismas dos del paso A, con el mismo resultado. **Reorganizamos por dentro y el cliente no nota nada**: eso es **refactorizar**. 🧹

---

## CP2-C — La libreta de configuración

### La idea 📒🕵️

- `.env` es la **libreta** con datos y secretos (puerto, llave de la bodega…).
- `env.js` es el **portero** que revisa la libreta **antes de abrir**. Si falta algo, el restaurante **no abre** y dice exactamente qué falta. Esto se llama **fallar rápido**.
- **Regla de oro:** solo `env.js` lee `process.env`. El resto del código le pregunta a `env.js`.

### Dos libretas

| `NODE_ENV` | Libreta | Base |
|---|---|---|
| `development` (por defecto) | `.env` | `consumo_electrico` |
| `test` | `.env.test` | `consumo_electrico_test` |

`NODE_ENV` **no va dentro** de las libretas: es lo que decide cuál abrir (no se guarda la llave del cofre dentro del cofre 🔐).

**Protección extra:** en modo test, si la base **no termina en `_test`**, el portero no deja pasar. Las pruebas nunca tocan datos reales.

### Archivos

- ✏️ `.env` y `.env.test`: agregan `PORT` (3000 / 3001), `FRONTEND_URL` y `APP_TIMEZONE`
- ✏️ `.env.example` y `.env.test.example`: lo mismo, sin contraseña
- ✏️ [`src/config/env.js`](../../backend/src/config/env.js): valida puerto, URL, zona horaria y datos de la base; congela el resultado con `Object.freeze`
- ✏️ [`src/server.js`](../../backend/src/server.js): muestra modo, puerto y base al arrancar (**nunca** la contraseña)

### 🧪 Pruebas

1. `npm run dev` muestra modo `development`, puerto 3000 y base `consumo_electrico`.
2. 😈 En `.env` pon `PORT=pizza` → error claro: *"PORT debe ser un puerto válido"*. Restaura.
3. 😈 Borra `FRONTEND_URL` → *"Falta la variable obligatoria FRONTEND_URL en .env"*. Restaura.
4. Modo test en PowerShell:

```powershell
$env:NODE_ENV="test"
node -e "import('./src/config/env.js').then(m => console.log('Base:', m.env.db.name))"
Remove-Item Env:NODE_ENV
```

Esperado: `Base: consumo_electrico_test`.

---

## CP2-D — Los carritos de la bodega

### La idea 🛒

Abrir una conexión a PostgreSQL cuesta tiempo. Un **pool** es una **fila de carritos listos**: tomas uno, lo usas y lo devuelves. **Un solo pool para toda la app.**

### Las 4 mejoras

| Mejora | Por qué |
|---|---|
| Límites (máx. 10 carritos, 5 s de espera) | Evitar esperas infinitas |
| Verificar la bodega **antes de abrir** | Si PostgreSQL no responde, el servidor no abre |
| 🎂 `DATE` como texto `'2026-08-30'` | Por defecto `pg` inventa una hora y puede **cambiar el día** por la zona horaria |
| 🔢 `BIGINT` como número | Por defecto llega como texto, y `"9" > "10"` es `true` 😱 |

Además, al cerrar (Ctrl + C), el servidor **primero cierra la puerta y luego devuelve los carritos**.

### Archivos

- ✏️ [`src/db/pool.js`](../../backend/src/db/pool.js): `types.setTypeParser` para `DATE` (1082) y `BIGINT` (20), límites, `pool.on('error')` y `verificarConexionBD()`
- ✏️ [`src/server.js`](../../backend/src/server.js): verifica la bodega antes de `listen` y cierra con calma ante `SIGINT`/`SIGTERM`

### 🧪 Pruebas

1. `npm run dev` → `Bodega: consumo_electrico (usuario consumo_app)`. ¡La app entra con su llave limitada! 🔑
2. 😈 Contraseña equivocada en `.env` → *"No se pudo conectar a PostgreSQL. El servidor NO se abrió."* Restaura.
3. Script temporal que consulta `DATE '2026-08-30'` y `12555::BIGINT` → `fecha: '2026-08-30'` (string) y `lectura: 12555` (number). Borrar el script después.
4. `npm start` + Ctrl + C → mensajes de cierre (en Windows a veces no alcanzan a verse; no es un error).

---

## CP2-E — El mostrador de reclamos

### La idea 🛎️

Todos los problemas, vengan de donde vengan, van a **un único mostrador** al final, que responde **siempre igual**:

```json
{
  "error": {
    "codigo": "RUTA_NO_ENCONTRADA",
    "mensaje": "La ruta solicitada no existe."
  }
}
```

- `codigo` → para la **máquina** (React lo leerá) 🏷️
- `mensaje` → para las **personas**

### Dos tipos de errores 🧯

| Tipo | Ejemplo | Qué recibe el cliente |
|---|---|---|
| 🟡 **Esperado** (`AppError`) | "Ya existe una lectura para esa fecha" | Su status, código y mensaje |
| 🔴 **Inesperado** (un bug) | Leer `.nombre` de `undefined` | 500 genérico. Los detalles van **solo a la terminal** |

**El cliente ve una disculpa; el programador ve las pistas.** 🕵️ Nunca se revelan secretos de la cocina.

### Archivos

- ➕ [`src/errors/app-error.js`](../../backend/src/errors/app-error.js): la ficha de error esperado (`status`, `codigo`, `mensaje`, `detalles`)
- ➕ [`src/errors/error-codes.js`](../../backend/src/errors/error-codes.js): lista oficial de códigos (se agregan **solo cuando se necesitan**)
- ➕ [`src/middlewares/not-found.js`](../../backend/src/middlewares/not-found.js): "ese plato no está en el menú"
- ➕ [`src/middlewares/error-handler.js`](../../backend/src/middlewares/error-handler.js): el mostrador (recibe **4 parámetros**: así Express lo reconoce)
- ✏️ `src/app.js`: 404 y mostrador **al final** (Express revisa de arriba hacia abajo)

### 🧪 Pruebas (con rutas temporales, borradas al final)

| Pedido | Esperado |
|---|---|
| GET `/api/no-existe` | 404 `RUTA_NO_ENCONTRADA` |
| POST `/api/health` | 404 (el método también cuenta) |
| Error esperado | Su status y código |
| Error inesperado | 500 `ERROR_INTERNO` + 💥 con detalles en la terminal |
| Error dentro de `async` | 500 (Express 5 lo atrapa solo) |

---

## CP2-F — El número de ticket y la bitácora

### La idea 🎫📓

- Cada pedido recibe un **ticket único** (UUID) que vuelve en el header `X-Request-Id` y en toda respuesta de error.
- El portero anota **una línea** en su bitácora cuando cada pedido termina:

```text
[INFO ] GET /api/health → 200 (2 ms) id=a3f9c2e1-...
[WARN ] GET /api/no-existe → 404 (1 ms) id=7c21b0d4-...
```

| Nivel | Status |
|---|---|
| `INFO` 🟢 | 200–399 |
| `WARN` 🟡 | 400–499 (culpa del cliente) |
| `ERROR` 🔴 | 500+ (revisar la cocina) |

**Nunca se anota:** el body, los headers de sesión ni los `?parámetros` de la URL. Una bitácora con contraseñas es un regalo para un ladrón.

### Archivos

- ➕ [`src/middlewares/request-id.js`](../../backend/src/middlewares/request-id.js)
- ➕ [`src/middlewares/logger.js`](../../backend/src/middlewares/logger.js): apagado en modo test
- ✏️ `error-handler.js`: incluye `requestId` en las respuestas de error
- ✏️ `app.js`: ticket primero, bitácora segunda

### 🧪 Pruebas

1. El `X-Request-Id` de la respuesta coincide con el `id=` de la terminal.
2. Cada pedido tiene un ticket distinto.
3. `/api/health?clave=secreto123` → la terminal **no** muestra `?clave=...`.

🎮 **Juego:** un aprendiz hace un pedido y solo le dice al otro el `requestId`. El otro debe encontrar en la terminal qué ruta fue, qué status tuvo y cuánto tardó.

---

## CP2-G — El casco de seguridad

### La idea 🪖

Los **headers** son etiquetas pegadas por fuera de la caja de la respuesta. Antes, la respuesta decía `X-Powered-By: Express`: ¡le contaba a cualquiera qué cerradura usamos! 🦹

**Helmet**, con una línea, quita esa etiqueta y agrega otras que protegen al navegador:

| Header | Explicado fácil |
|---|---|
| `X-Content-Type-Options: nosniff` | "Si la caja dice jugo, es jugo; no adivines" 🧃 |
| `X-Frame-Options: SAMEORIGIN` | "Nadie me esconde debajo de una página falsa" 🪤 |
| `Content-Security-Policy` | "Solo proveedores de la lista" 📋 |
| `Referrer-Policy: no-referrer` | "No cuentes de dónde vienes" 🤐 |

> Helmet es **una capa**, no una armadura invencible. La seguridad se construye en capas.

### Archivos

- 📦 `npm install helmet`
- ✏️ `app.js`: `app.use(helmet())` **arriba**, para que hasta los errores lleven casco

### 🧪 Pruebas

- `/api/health` → sin `X-Powered-By`; con `nosniff`, `X-Frame-Options`, etc.
- `/api/no-existe` → también con casco.

---

## CP2-H — CORS: la mamá protectora

### Origen

Un **origen** = protocolo + dominio + puerto. Si cambia cualquiera, es otro origen:

```text
React   → http://localhost:5173
Express → http://localhost:3000     ← ¡orígenes distintos!
```

### La idea 👩

El **navegador** es una mamá protectora. Cuando una página intenta pedirle datos a nuestro backend, la mamá pregunta: *"¿Conoces a esta página?"*. El backend responde con su **lista de invitados** (headers) y **la mamá obedece**.

> 🤯 **Quien bloquea es el navegador, no el backend.** Thunder Client no es una mamá: por eso "siempre funciona". Esa es la razón del clásico *"¡en Thunder Client funciona pero en mi página no!"*.

- **Preflight** 🚪: antes de ciertos pedidos, la mamá hace un "toc toc" con `OPTIONS` para pedir permiso.
- **CORS no es login:** solo dice desde qué página vienes, no quién eres.

### Nuestra lista

- ✅ Sin `Origin` (Thunder Client, pruebas): permitido.
- ✅ `FRONTEND_URL` (`http://localhost:5173`): invitado.
- 🚫 Cualquier otro: no se agrega a la lista (el navegador lo bloqueará).
- `exposedHeaders: ['X-Request-Id']` para que React pueda leer el ticket.

### Archivos

- 📦 `npm install cors`
- ➕ [`src/config/cors.js`](../../backend/src/config/cors.js)
- ✏️ `app.js`: CORS antes de las rutas

### 🧪 Pruebas (agregando el header `Origin` en Thunder Client)

| Origin | Esperado |
|---|---|
| (ninguno) | 200 normal |
| `http://localhost:5173` | `Access-Control-Allow-Origin: http://localhost:5173` |
| `http://pagina-mala.com` | 200 pero **sin** `Access-Control-Allow-Origin` 💡 |
| OPTIONS + `Access-Control-Request-Method: POST` | 204 con los métodos permitidos |

---

## CP2-I — El buzón y la comanda ilegible

### La idea 📦📝

- **Buzón con tamaño:** máximo **100 KB** por pedido. Así nadie agota al mesero con comandas de 500 páginas → **413**.
- **Comanda ilegible:** un JSON roto ya no provoca una falsa alarma 500, sino un tranquilo **400 `JSON_INVALIDO`**.

| Status | Significa | Ejemplo |
|---|---|---|
| **400** | No se puede ni leer ✍️🌀 | `{"valorLectura": 12555,` |
| **422** | Se lee, pero no tiene sentido 🤨 | `{"valorLectura": 125.5}` |

### Archivos

- ✏️ `error-codes.js`: `JSON_INVALIDO`, `SECURITY_BODY_DEMASIADO_GRANDE`
- ✏️ `error-handler.js`: traductor de los errores `entity.parse.failed` y `entity.too.large`
- ✏️ `app.js`: `express.json({ limit: '100kb' })`

### 🧪 Pruebas

1. **Antes del cambio:** POST `/api/health` con JSON roto → 500 y 💥 (¡falsa alarma!).
2. **Después:** → 400 `JSON_INVALIDO`, solo un `WARN` en la terminal.
3. JSON correcto a POST `/api/health` → 404 (se leyó bien; la ruta no existe para POST).
4. Comanda de 200 KB desde PowerShell:

```powershell
$grande = '{"relleno":"' + ('a' * 200000) + '"}'
try {
  Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method Post -ContentType "application/json" -Body $grande
} catch {
  "Status: " + [int]$_.Exception.Response.StatusCode
  $_.ErrorDetails.Message
}
```

Esperado: `Status: 413`.

---

## CP2-J — "Calma, uno a la vez"

### La idea 🐢

Un guardia cuenta cuántos pedidos hace cada IP por minuto. Protege de **robots** que prueban contraseñas… y de **nuestros propios bugs** (el clásico bucle infinito de peticiones en React).

| Guardia | Límite |
|---|---|
| General | 120 por minuto por IP (apagado en modo test) |
| Login (CP3) | 5 intentos cada 15 minutos |

Las respuestas traen el "marcador de vidas" 🎮: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`.

Una **fábrica** (`crearLimitador`) construye guardias con distintos límites. El 429 pasa por nuestro mostrador, así que tiene el formato uniforme con ticket.

**Posición:** después de CORS (para que React pueda leer el 429) y antes de `express.json` (no gastar tiempo leyendo pedidos que se rechazarán).

### Archivos

- 📦 `npm install express-rate-limit`
- ➕ [`src/middlewares/rate-limit.js`](../../backend/src/middlewares/rate-limit.js)
- ✏️ `error-codes.js`: `RATE_LIMIT_EXCEDIDO`
- ✏️ `app.js`

### 🧪 Prueba: el robot impaciente 🤖

En una segunda terminal, con el servidor corriendo:

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

Esperado: unos 120 con `200` y el resto con `429`. Al minuto siguiente, todo vuelve a 200.

---

## CP2-K — El inspector de formularios

### La idea 🔍

**Zod** revisa que cada formulario esté bien llenado y devuelve **todos** los errores de una vez → **422**.

| 🔍 Inspector (Zod) revisa la FORMA | 👨‍🍳 Chef (Service) decide las REGLAS |
|---|---|
| ¿Es un número entero? | ¿Es menor que la lectura anterior? |
| ¿La fecha tiene formato `AAAA-MM-DD`? | ¿Ya existe una lectura para esa fecha? |

### Superpoderes

- 🛡️ **Descarta los campos que nadie pidió** (por ejemplo, un `"rol": "ADMIN"` colado).
- 🔄 En la **URL** todo llega como texto y se convierte (`coerce`); en el **body** se exige el tipo exacto.
- 📮 La versión aprobada queda sellada en `req.validated`. El controller **solo usa la versión sellada**.

```json
{
  "error": {
    "codigo": "VALIDACION_DATOS_INVALIDOS",
    "mensaje": "Algunos datos no son válidos.",
    "detalles": {
      "campos": [
        { "campo": "valorLectura", "mensaje": "valorLectura debe ser un número entero." }
      ]
    },
    "requestId": "..."
  }
}
```

### Archivos

- 📦 `npm install zod`
- ➕ [`src/middlewares/validar.js`](../../backend/src/middlewares/validar.js): uso `validar({ body, params, query })`
- ➕ [`src/validators/common.validators.js`](../../backend/src/validators/common.validators.js): `idSchema`
- ✏️ `error-codes.js`: `VALIDACION_DATOS_INVALIDOS`

### 🧪 Pruebas (con rutas temporales, borradas al final)

| Body | Esperado |
|---|---|
| `{"fechaLectura":"2026-08-30","valorLectura":12555}` | 200 |
| `valorLectura: 125.5` / `"12555"` / `-30` | 422 con el mensaje correcto |
| Fecha y valor malos a la vez | 422 con **dos** campos |
| Con `"rol":"ADMIN"` extra | 200, sin `rol` en lo recibido |
| `/prueba/lectura/15` · `/prueba/lectura/abc` | id numérico · 422 |

> La validación de **fechas reales** (que no exista el 30 de febrero) llega en el CP5.

---

## CP2-L — Todo o nada

### La idea 🐷🐷

Ana tiene 10 monedas y le regala 5 a Beto: **sacar** de Ana y **meter** en Beto. Si se corta la luz entre los dos pasos, ¡5 monedas desaparecen!

Una **transacción** promete: **o se hacen todos los pasos, o ninguno.**

| Palabra | Significa |
|---|---|
| `BEGIN` | 📝 Abro el cuaderno de borrador |
| `COMMIT` | ✅ Paso todo al cuaderno oficial |
| `ROLLBACK` | 🗑️ Arranco la hoja de borrador |

### ⚠️ Regla de oro: un solo carrito

La transacción vive **dentro de un carrito**. Dentro del trabajo se usa **siempre `client.query`**, nunca `pool.query` (que prestaría otro carrito que no sabe nada del borrador).

```javascript
await ejecutarTransaccion(async (client) => {
  await client.query(/* paso 1 */);
  await client.query(/* paso 2 */);
});
```

El ayudante **siempre** devuelve el carrito (`finally`). Si olvidara hacerlo, tras 10 errores no quedarían carritos y el backend se congelaría. 🥶

### Archivos

- ➕ [`src/db/transaction.js`](../../backend/src/db/transaction.js)

### 🧪 Experimento de las alcancías (script temporal, en modo test)

| Experimento | Total de monedas |
|---|---|
| Sin transacción, se corta la luz | 😱 5 |
| Con transacción, se corta la luz | 🛡️ 10 (ROLLBACK) |
| Con transacción, todo bien | ✅ 10 (Ana 5, Beto 5) |

Esta demostración quedó como prueba permanente en el paso N.

---

## CP2-M — El robot probador

### La idea 🤖

En el CP2 hicimos más de 30 pruebas a mano. Repetirlas tras cada cambio es imposible, y así se cuelan los bugs. 🐛 Un robot las ejecuta **todas en 2 segundos**.

| Robot | Qué hace |
|---|---|
| **Vitest** 🧑‍🏫 | Ejecuta las pruebas y dice ✅ o ❌ |
| **Supertest** 🧑‍🍳 | Hace pedidos entrando por la **puerta de servicio** (`app.js`), sin abrir el puerto. ¡Para eso separamos `app.js` y `server.js` en el CP0! 🎁 |

```javascript
describe('La calculadora', () => {        // 📁 tema
  it('suma 2 + 2 y da 4', () => {         // 🧪 una prueba, escrita como frase
    expect(2 + 2).toBe(4);                // ¿esto es igual a aquello?
  });
});
```

### Archivos

- 📦 `npm install -D vitest supertest` (`-D` = herramientas del taller, no viajan con la app)
- ✏️ `package.json`: `"test": "cross-env NODE_ENV=test vitest run"` y `"test:watch": "cross-env NODE_ENV=test vitest"`
- ➕ [`vitest.config.js`](../../backend/vitest.config.js): `fileParallelism: false` (las pruebas comparten la base de test)
- ➕ [`tests/unit/entorno.test.js`](../../backend/tests/unit/entorno.test.js): el **cinturón de seguridad**; comprueba que el robot usa la base `_test`

### 🧪 Pruebas

1. `npm test` → 3 en verde.
2. 😈 Cambia `toBe(3001)` por `toBe(9999)` y aprende a leer el fallo: **¿cuál prueba?**, **Expected** (lo esperado) y **Received** (lo recibido). Un fallo no es un regaño: es el robot diciéndote dónde mirar. 🧭
3. `npm run test:watch` repite solo al guardar (salir con `q`).

---

## CP2-N — Enseñarle al robot todas las pruebas

### Herramientas nuevas

- 🧪 **Mini restaurante de laboratorio** ([`tests/helpers/app-de-prueba.js`](../../backend/tests/helpers/app-de-prueba.js)): ticket + JSON + mostrador, y en el medio **solo la pieza que se quiere estudiar**.
- ⏰ `beforeAll` (una vez al inicio), `beforeEach` (antes de cada prueba: todo desde cero) y `afterAll` (limpiar al final).
- 🕵️ `vi.spyOn(console, 'error')`: silencia la terminal y comprueba que el mostrador sí avisó.

### Mapa de pruebas

```text
tests/
├── helpers/app-de-prueba.js
├── unit/
│   ├── entorno.test.js        ✅ base de juguete
│   ├── validar.test.js        🔍 inspector
│   └── error-handler.test.js  🛎️ mostrador
└── integration/
    ├── app.test.js            🍽️ restaurante completo
    ├── rate-limit.test.js     🐢 fábrica con límite 2
    └── transaction.test.js    🐷 alcancías (usa PostgreSQL)
```

> ¿Por qué probar el limitador con **2** y no con 120? Porque la fábrica es la misma: si funciona con 2, funciona con 120, y tarda milisegundos.
>
> La última prueba de transacciones hace **15 fallos seguidos** (el pool tiene 10 carritos) para demostrar que todos los carritos vuelven a la fila.

### 🧪 Resultado

```powershell
npm test
```

```text
 Test Files  6 passed (6)
      Tests  30 passed (30)
```

😈 **El robot guardián:** comenta `app.use(helmet())` en `app.js` y ejecuta `npm test`. El robot lo detecta en segundos. Restaura la línea.

> Las pruebas también son **documentación**: leyendo solo los `it(...)` se entiende qué hace el backend. 📖

---

## CP2-O — Gate final

### El pipeline completo

```text
PEDIDO
  ▼
🎫 1. requestId      → número de ticket
📓 2. logger         → bitácora
🪖 3. helmet         → casco de seguridad
🚪 4. cors           → lista de invitados
🐢 5. rate limit     → "calma, uno a la vez"
📄 6. express.json   → lector de comandas (máx. 100 KB)
🗂️ 7. rutas          → directorio (+ 🔍 validar por ruta)
🤷 8. 404            → "ese plato no está en el menú"
🛎️ 9. errores        → mostrador de reclamos
  ▼
RESPUESTA
```

### Catálogo de errores

| Status | Código |
|---|---|
| 400 | `JSON_INVALIDO` |
| 404 | `RUTA_NO_ENCONTRADA` |
| 413 | `SECURITY_BODY_DEMASIADO_GRANDE` |
| 422 | `VALIDACION_DATOS_INVALIDOS` |
| 429 | `RATE_LIMIT_EXCEDIDO` |
| 500 | `ERROR_INTERNO` |

### Registro de decisiones

Las decisiones tomadas durante la implementación que complementan las specs quedaron en [`docs/DECISIONES.md`](../DECISIONES.md). En SDD, **la documentación es la fuente de verdad**: si una decisión no se anota, en tres meses nadie sabrá por qué el código es así.

---

## ✅ Gate CP2

```text
BACKEND BASE
[ ] Rutas organizadas (index.js + health.routes.js)
[ ] Configuración centralizada y validada (env.js)
[ ] Pool con verificación, tipos DATE/BIGINT y cierre ordenado
[ ] Helper de transacciones

SEGURIDAD Y CALIDAD
[ ] Errores uniformes con codigo + mensaje + requestId
[ ] Request ID y logging sin datos sensibles
[ ] Helmet, CORS, límite de body y rate limit
[ ] Validación con Zod (422)

PRUEBAS
[ ] npm test → 30 pruebas en verde

DOCUMENTACIÓN
[ ] docs/DECISIONES.md
[ ] Un commit por paso
```

## 🧠 Lo que debes poder explicar

- Qué es un middleware y qué hace `next()`.
- La diferencia entre 400, 422 y 500.
- Por qué el cliente nunca ve el detalle de un error inesperado.
- Por qué Thunder Client "siempre funciona" aunque CORS no lo permita.
- Por qué `"9" > "10"` es peligroso para nuestras lecturas.
- Por qué dentro de una transacción se usa `client` y no `pool`.
- Por qué Supertest no necesita `npm run dev`.

⬅️ Anterior: [CP1](CP1-postgresql.md) · ➡️ Siguiente: CHECKPOINT 3 — Autenticación, sesiones y roles *(próximamente)*
