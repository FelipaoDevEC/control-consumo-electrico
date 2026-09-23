# CHECKPOINT 2 — Backend base, seguridad transversal y pruebas

## 1. Objetivo

Construir la infraestructura común del backend antes de implementar autenticación o reglas funcionales.

Al finalizar tendremos:

* configuración de entorno completa;
* Express organizado;
* headers de seguridad;
* CORS controlado;
* validación de `Origin`;
* límite de tamaño JSON;
* identificador por petición;
* logging HTTP seguro;
* rate limiting general;
* validación reutilizable;
* errores de aplicación;
* manejo centralizado de errores;
* respuesta 404 uniforme;
* helper de transacciones PostgreSQL;
* endpoint `/api/health`;
* Vitest;
* Supertest;
* infraestructura de pruebas;
* primeras pruebas automatizadas.

Todavía NO tendremos:

```text
login
JWT
bcrypt
Refresh Token funcional
usuarios administrativos
lecturas
estadísticas
dashboard
```

---

# 2. Precondiciones

Deben estar cerrados:

```text
CHECKPOINT 0 → CERRADO
CHECKPOINT 1 → CERRADO
```

Debe funcionar:

```bash
npm run db:check
npm run db:migrate
npm run db:seed
npm run db:status
```

y existir:

```text
usuarios
medidores
lecturas_medidor
sesiones
schema_migrations
```

---

# 3. SPEC relacionadas

Principalmente:

```text
SPEC-010 → Seguridad transversal
SPEC-011 → Arquitectura
SPEC-012 → Pruebas
```

Además prepara:

```text
SPEC-003 → Autenticación
SPEC-004 → Lecturas
SPEC-009 → Administración
```

---

# 4. Arquitectura después del checkpoint

```text
HTTP
 ↓
Request ID
 ↓
Helmet
 ↓
CORS
 ↓
JSON limitado
 ↓
Logging
 ↓
Rate Limit
 ↓
Rutas
 ↓
Validación
 ↓
Controlador
 ↓
Servicio
 ↓
Repositorio
 ↓
PostgreSQL
 ↓
404 / Error Handler
```

---

# 5. Dependencias nuevas

Desde:

```text
backend/
```

instalar:

```bash
npm install cors helmet express-rate-limit zod
```

---

# 6. Dependencias de desarrollo

```bash
npm install -D vitest supertest
```

Después tendremos aproximadamente:

```text
express
pg
dotenv
cors
helmet
express-rate-limit
zod
```

y desarrollo:

```text
vitest
supertest
```

---

# 7. ¿Por qué Zod?

Necesitamos una estrategia única para validar:

```text
body
params
query
```

Utilizaremos:

```text
Zod
```

durante el MVP.

Esto congela una decisión que SPEC-010 había dejado abierta.

---

# 8. Qué hará Zod

Ejemplo conceptual:

```text
valorLectura debe ser entero
fecha debe tener formato válido
rol debe pertenecer a una lista
correo debe tener formato válido
```

---

# 9. Qué NO hará Zod

No decidirá:

```text
¿el usuario puede editar esta lectura?
¿la lectura es menor que la anterior?
¿queda algún ADMIN activo?
```

Eso pertenece a servicios.

---

# 10. Configuración completa

Actualizar:

```text
backend/src/config/env.js
```

para validar toda configuración actualmente conocida.

Variables:

```text
PORT

DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD

JWT_SECRET
JWT_ACCESS_EXPIRES_IN
REFRESH_TOKEN_DAYS

FRONTEND_URL
APP_TIMEZONE

NODE_ENV
```

---

# 11. JWT_SECRET todavía no se utiliza

Aunque CHECKPOINT 3 implementará JWT, desde este checkpoint podemos validar la estructura general del entorno.

Sin embargo, para no bloquear el backend antes de usar autenticación, tenemos dos opciones.

Decisión:

```text
JWT_SECRET será obligatorio a partir de CHECKPOINT 3.
```

En CHECKPOINT 2 puede permanecer opcional.

---

# 12. NODE_ENV

Valores permitidos:

```text
development
test
production
```

Cualquier otro deberá rechazarse.

---

# 13. PORT

Debe ser:

```text
entero
1–65535
```

---

# 14. DB_PORT

También:

```text
entero
1–65535
```

---

# 15. APP_TIMEZONE

Valor inicial:

```text
America/Guayaquil
```

---

# 16. FRONTEND_URL

Desarrollo:

```text
http://localhost:5173
```

Debe poder convertirse en una URL válida.

---

# 17. Estructura conceptual de `env.js`

```javascript
import 'dotenv/config';

function obtenerVariable(nombre) {
    const valor = process.env[nombre];

    if (!valor) {
        throw new Error(
            `Falta la variable de entorno obligatoria: ${nombre}`
        );
    }

    return valor;
}

function obtenerPuerto(nombre, valorPorDefecto) {
    const valor = Number(
        process.env[nombre] ?? valorPorDefecto
    );

    if (
        !Number.isInteger(valor) ||
        valor < 1 ||
        valor > 65535
    ) {
        throw new Error(
            `${nombre} debe ser un puerto válido`
        );
    }

    return valor;
}
```

La versión final puede utilizar Zod también para configurar el entorno.

---

# 18. Recomendación

Ya que instalamos Zod, podemos utilizarlo para:

```text
variables de entorno
requests HTTP
```

sin mantener dos sistemas de validación.

---

# 19. `envSchema`

Conceptualmente:

```javascript
const envSchema = z.object({
    NODE_ENV: z
        .enum(['development', 'test', 'production'])
        .default('development'),

    PORT: z.coerce
        .number()
        .int()
        .min(1)
        .max(65535)
        .default(3000),

    DB_HOST: z.string().min(1),

    DB_PORT: z.coerce
        .number()
        .int()
        .min(1)
        .max(65535)
        .default(5432),

    DB_NAME: z.string().min(1),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string(),

    FRONTEND_URL: z.string().url(),

    APP_TIMEZONE: z
        .string()
        .default('America/Guayaquil')
});
```

---

# 20. No imprimir configuración sensible

Podemos mostrar al iniciar:

```text
Entorno: development
Puerto: 3000
Base: consumo_electrico
```

Pero no:

```text
DB_PASSWORD
JWT_SECRET
```

---

# 21. `app.js`

Ahora `app.js` dejará de ser solamente:

```text
express()
express.json()
health
```

y pasará a construir el pipeline común.

---

# 22. Orden recomendado

```text
requestId
↓
helmet
↓
cors
↓
express.json
↓
logger
↓
rate limit general
↓
rutas
↓
404
↓
error handler
```

---

# 23. Request ID

Crear:

```text
backend/src/middlewares/request-id.middleware.js
```

Cada petición recibirá un identificador.

Ejemplo:

```text
req_c961ce...
```

---

# 24. Generación

Podemos utilizar Node:

```javascript
import { randomUUID } from 'node:crypto';
```

---

# 25. Middleware conceptual

```javascript
export function asignarRequestId(req, res, next) {
    const requestId = randomUUID();

    req.requestId = requestId;

    res.setHeader(
        'X-Request-Id',
        requestId
    );

    next();
}
```

---

# 26. Por qué usar UUID

No necesitamos:

```text
1
2
3
4
```

y mantener estado global.

Un UUID es suficientemente simple para identificar peticiones.

---

# 27. Helmet

En:

```text
app.js
```

utilizar:

```javascript
app.use(helmet());
```

Esto añade headers defensivos.

---

# 28. Qué NO significa Helmet

No significa:

```text
“la aplicación ya es segura”
```

Solo añade una capa de seguridad HTTP.

---

# 29. Content Security Policy

Durante CHECKPOINT 2 el backend sirve principalmente JSON.

La configuración predeterminada de Helmet es suficiente como base.

Cuando publiquemos frontend/backend bajo una arquitectura concreta revisaremos CSP nuevamente.

---

# 30. CORS

Crear:

```text
backend/src/config/cors.js
```

---

# 31. Origen permitido

Únicamente:

```text
env.frontendUrl
```

---

# 32. Configuración conceptual

```javascript
export const corsOptions = {
    origin(origin, callback) {
        if (!origin) {
            return callback(null, true);
        }

        if (origin === env.frontendUrl) {
            return callback(null, true);
        }

        return callback(
            new Error('Origen CORS no permitido')
        );
    },

    credentials: true,
};
```

---

# 33. Peticiones sin `Origin`

Herramientas como:

```text
curl
Supertest
Thunder Client
```

pueden no enviar `Origin`.

No debemos rechazarlas únicamente por eso en CORS.

---

# 34. CORS no sustituye autenticación

Incluso:

```text
Origin permitido
```

no significa:

```text
usuario autorizado
```

---

# 35. Validación específica de Origin

Crear:

```text
backend/src/middlewares/origin.middleware.js
```

Este middleware se utilizará posteriormente en:

```text
POST /api/auth/refresh
POST /api/auth/logout
```

porque utilizarán cookie.

---

# 36. Todavía no activar Origin globalmente

No queremos exigir `Origin` a:

```text
GET /api/health
```

ni a todas las peticiones API.

---

# 37. Función prevista

Conceptualmente:

```javascript
export function validarOrigin(req, res, next) {
    const origin = req.get('origin');

    if (!origin) {
        return next();
    }

    if (origin !== env.frontendUrl) {
        throw new AppError({
            status: 403,
            codigo: 'SECURITY_ORIGIN_INVALIDO',
            mensaje: 'Origen de la petición no permitido.',
        });
    }

    next();
}
```

---

# 38. Body limit

Actualmente:

```javascript
express.json()
```

acepta un tamaño predeterminado que no necesitamos.

Usaremos:

```javascript
app.use(
    express.json({
        limit: '100kb',
    })
);
```

---

# 39. Por qué 100 KB

Nuestros requests serán pequeños.

Ejemplo:

```json
{
  "fechaLectura": "2026-08-30",
  "valorLectura": 12555
}
```

No necesitamos aceptar archivos ni megabytes de JSON.

---

# 40. JSON inválido

Un JSON mal formado debe producir una respuesta controlada.

Ejemplo:

```text
{
  "valor": 1255,
```

No debe devolver un stack trace.

---

# 41. Logging

Crear:

```text
backend/src/middlewares/logger.middleware.js
```

No instalaremos todavía una librería pesada de logging.

Usaremos un logger pequeño y explícito para enseñar qué registramos.

---

# 42. Datos permitidos

Por petición:

```text
requestId
método
ruta
status
duración
idUsuario posteriormente
```

---

# 43. Ejemplo

```text
[INFO]
requestId=...
GET /api/health
status=200
duration=3ms
```

---

# 44. No registrar body completo

No hacer:

```javascript
console.log(req.body);
```

globalmente.

Más adelante podría contener:

```text
password
passwordNueva
```

---

# 45. No registrar headers completos

Especialmente:

```text
Authorization
Cookie
```

---

# 46. Tiempo de respuesta

Middleware:

```text
inicio = performance.now()
↓
respuesta termina
↓
duración
```

Podemos escuchar:

```text
res.on('finish')
```

---

# 47. Rate limit general

Crear:

```text
backend/src/middlewares/rate-limit.middleware.js
```

---

# 48. Límite general

SPEC-010 propuso:

```text
120 solicitudes / minuto / IP
```

Lo utilizaremos como base.

---

# 49. Configuración

Conceptualmente:

```javascript
rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
});
```

---

# 50. Login tendrá otro rate limit

No implementar todavía:

```text
5 / 15 min
```

Ese limitador específico llegará en CHECKPOINT 3.

---

# 51. Tests y rate limit

El rate limiting general no deberá dificultar innecesariamente las pruebas.

En:

```text
NODE_ENV=test
```

podemos:

```text
desactivarlo
```

o utilizar límites muy altos.

Decisión:

```text
rate limit general desactivado durante tests automatizados
```

para evitar pruebas frágiles.

Las pruebas específicas del rate limiter utilizarán una configuración controlada.

---

# 52. Error base de aplicación

Crear:

```text
backend/src/errors/app-error.js
```

---

# 53. Estructura

```javascript
export class AppError extends Error {
    constructor({
        status = 500,
        codigo,
        mensaje,
        detalles,
    }) {
        super(mensaje);

        this.name = 'AppError';
        this.status = status;
        this.codigo = codigo;
        this.detalles = detalles;
    }
}
```

---

# 54. Códigos de error

Crear:

```text
backend/src/errors/error-codes.js
```

Inicialmente:

```javascript
export const ERROR_CODES = {
    VALIDACION_DATOS_INVALIDOS:
        'VALIDACION_DATOS_INVALIDOS',

    SECURITY_ORIGIN_INVALIDO:
        'SECURITY_ORIGIN_INVALIDO',

    RUTA_NO_ENCONTRADA:
        'RUTA_NO_ENCONTRADA',

    ERROR_INTERNO:
        'ERROR_INTERNO',
};
```

---

# 55. ¿Por qué códigos?

React podrá interpretar:

```text
VALIDACION_DATOS_INVALIDOS
```

sin depender del mensaje:

```text
“Algunos datos no son válidos.”
```

---

# 56. Middleware de validación

Crear:

```text
backend/src/middlewares/validation.middleware.js
```

---

# 57. Objetivo

Poder escribir posteriormente algo como:

```javascript
validar({
    body: crearUsuarioSchema,
});
```

o:

```javascript
validar({
    params: lecturaIdSchema,
    body: corregirLecturaSchema,
});
```

---

# 58. Resultado de Zod

Nunca debemos utilizar directamente valores no validados después.

Preferimos que middleware coloque:

```text
req.validated
```

o equivalente.

---

# 59. Estructura recomendada

```javascript
req.validated = {
    body,
    params,
    query,
};
```

---

# 60. Ventaja

El controlador utiliza:

```javascript
req.validated.body
```

y sabe que ya pasó validación estructural.

---

# 61. Error de validación

Respuesta:

```http
422 Unprocessable Content
```

---

# 62. Formato

```json
{
  "error": {
    "codigo": "VALIDACION_DATOS_INVALIDOS",
    "mensaje": "Algunos datos no son válidos.",
    "detalles": {
      "campos": [
        {
          "campo": "correo",
          "mensaje": "El correo no es válido."
        }
      ]
    }
  }
}
```

---

# 63. No devolver internals de Zod completos

Zod contiene información técnica que no necesitamos enviar directamente.

La transformaremos a nuestro contrato.

---

# 64. Helper de schemas comunes

Crear:

```text
backend/src/validators/common.validators.js
```

---

# 65. ID positivo

Por ejemplo:

```javascript
export const idSchema = z.coerce
    .number()
    .int()
    .positive();
```

---

# 66. Paginación

```text
pagina >= 1
limite >= 1
limite <= 100
```

Podremos crear:

```text
paginationSchema
```

reutilizable.

---

# 67. Fechas

La validación estricta de:

```text
YYYY-MM-DD
+
fecha calendario real
```

se implementará en una utilidad/validator común antes de CHECKPOINT 5.

En este checkpoint dejaremos preparado el lugar.

---

# 68. 404 API

Crear:

```text
backend/src/middlewares/not-found.middleware.js
```

---

# 69. Respuesta

```http
404 Not Found
```

```json
{
  "error": {
    "codigo": "RUTA_NO_ENCONTRADA",
    "mensaje": "El recurso solicitado no existe."
  }
}
```

---

# 70. Ejemplo

```text
GET /api/no-existe
```

debe producir el contrato anterior.

---

# 71. Error handler

Crear:

```text
backend/src/middlewares/error.middleware.js
```

Será:

```text
el último middleware
```

---

# 72. AppError

Si recibe:

```text
AppError
```

devolverá:

```text
status
codigo
mensaje
detalles seguros
```

---

# 73. Error inesperado

Si recibe:

```text
TypeError
ReferenceError
error PostgreSQL no mapeado
```

en producción:

```http
500
```

```json
{
  "error": {
    "codigo": "ERROR_INTERNO",
    "mensaje": "Ocurrió un error inesperado."
  }
}
```

---

# 74. Request ID en errores

Podemos incluir:

```json
{
  "error": {
    "codigo": "ERROR_INTERNO",
    "mensaje": "Ocurrió un error inesperado.",
    "requestId": "..."
  }
}
```

Esto puede facilitar soporte.

---

# 75. Decisión

Incluiremos:

```text
requestId
```

en respuestas de error.

No contiene información sensible.

---

# 76. Ejemplo completo

```json
{
  "error": {
    "codigo": "RUTA_NO_ENCONTRADA",
    "mensaje": "El recurso solicitado no existe.",
    "requestId": "c8..."
  }
}
```

---

# 77. Error interno en logs

El backend sí podrá registrar:

```text
requestId
nombre del error
mensaje técnico
stack en development
```

sin enviar el stack al navegador.

---

# 78. Producción vs desarrollo

En:

```text
development
```

logs técnicos pueden ser más detallados.

En:

```text
production
```

menos información sensible.

---

# 79. Parser JSON malformado

Express puede generar un error al parsear JSON.

El error handler deberá reconocerlo y responder:

```http
400 Bad Request
```

Código:

```text
JSON_INVALIDO
```

---

# 80. Añadir código

```text
JSON_INVALIDO
```

a:

```text
error-codes.js
```

---

# 81. Body demasiado grande

Debe devolver:

```http
413 Payload Too Large
```

Código:

```text
SECURITY_BODY_DEMASIADO_GRANDE
```

---

# 82. Content-Type

Cuando una ruta espera JSON y existe body, deberá utilizar:

```text
application/json
```

No necesitaremos todavía un middleware global agresivo para GET sin body.

---

# 83. Helper de transacciones

Crear:

```text
backend/src/db/transaction.js
```

---

# 84. Objetivo

No repetir en cada servicio:

```javascript
const client = await pool.connect();

try {
    await client.query('BEGIN');

    // ...

    await client.query('COMMIT');
} catch (error) {
    await client.query('ROLLBACK');
    throw error;
} finally {
    client.release();
}
```

---

# 85. Helper

Conceptualmente:

```javascript
export async function ejecutarTransaccion(callback) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const resultado =
            await callback(client);

        await client.query('COMMIT');

        return resultado;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}
```

---

# 86. Importante

El helper no debe esconder el concepto.

Los estudiantes deben entender:

```text
BEGIN
COMMIT
ROLLBACK
release
```

---

# 87. Uso futuro

```javascript
await ejecutarTransaccion(
    async (client) => {
        // buscar
        // bloquear
        // validar
        // insertar
    }
);
```

---

# 88. Health endpoint

Mantendremos:

```http
GET /api/health
```

---

# 89. Respuesta mínima

```json
{
  "status": "ok"
}
```

---

# 90. Health no expone

```text
DB_HOST
DB_USER
DB_PASSWORD
JWT_SECRET
versiones internas
```

---

# 91. ¿Debe comprobar PostgreSQL?

Podríamos hacer:

```text
GET /health
→ SELECT 1
```

Pero cada llamada a health generaría una consulta.

Para el MVP podemos separar:

```text
/api/health
```

como estado HTTP básico.

---

# 92. Health DB

Podemos añadir opcionalmente:

```text
/api/health/db
```

pero no es necesario todavía.

Ya existe:

```bash
npm run db:check
```

para diagnóstico local.

---

# 93. Router principal

Crear:

```text
backend/src/routes/index.js
```

---

# 94. Responsabilidad

Agrupar:

```text
health
futuro auth
futuro lecturas
futuro estadísticas
futuro admin
```

---

# 95. Ejemplo conceptual

```javascript
const router = Router();

router.get('/health', ...);

export default router;
```

En `app.js`:

```javascript
app.use('/api', router);
```

---

# 96. No dejar rutas dispersas

No queremos:

```text
app.js
├── login
├── usuarios
├── lecturas
├── dashboard
├── ...
```

El `app.js` debe seguir siendo infraestructura.

---

# 97. Testing — configuración

Actualizar:

```text
backend/package.json
```

---

# 98. Scripts

Agregar:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

---

# 99. Coverage

Para `test:coverage` necesitaremos posteriormente:

```bash
npm install -D @vitest/coverage-v8
```

Podemos instalarlo ahora:

```bash
npm install -D @vitest/coverage-v8
```

---

# 100. No exigir 100 %

La cobertura es una herramienta.

No es el criterio de éxito principal.

---

# 101. Configuración Vitest

Crear:

```text
backend/vitest.config.js
```

Conceptualmente:

```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
    },
});
```

---

# 102. Variables para test

No utilizar:

```text
backend/.env
```

de desarrollo durante pruebas.

---

# 103. Archivo de ejemplo

Podemos documentar:

```text
backend/.env.test.example
```

con:

```text
NODE_ENV=test

DB_HOST=localhost
DB_PORT=5432
DB_NAME=consumo_electrico_test
DB_USER=
DB_PASSWORD=

FRONTEND_URL=http://localhost:5173
APP_TIMEZONE=America/Guayaquil
```

---

# 104. `.env.test`

Si se utiliza localmente:

```text
NO se versiona
```

---

# 105. `.gitignore`

Asegurar:

```text
.env
.env.test
.env.local
.env.*.local
```

sin excluir:

```text
.env.example
.env.test.example
```

---

# 106. Primer test — health

Crear:

```text
backend/tests/integration/health.test.js
```

---

# 107. Supertest

Conceptualmente:

```javascript
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app.js';

describe('GET /api/health', () => {
    it('responde 200', async () => {
        const response =
            await request(app)
                .get('/api/health');

        expect(response.status).toBe(200);

        expect(response.body).toEqual({
            status: 'ok',
        });
    });
});
```

---

# 108. Ventaja de separar app/server

Este test no necesita:

```text
localhost:3000
```

ni iniciar manualmente:

```bash
npm run dev
```

Supertest usa:

```text
app
```

directamente.

---

# 109. Test 404

Crear caso:

```text
GET /api/no-existe
```

Esperado:

```text
404
RUTA_NO_ENCONTRADA
requestId presente
```

---

# 110. Test Request ID

Comprobar:

```text
X-Request-Id
```

en respuesta.

---

# 111. Test headers

Verificar al menos alguno generado por Helmet, por ejemplo:

```text
X-Content-Type-Options
```

sin acoplar excesivamente el test a cada header interno.

---

# 112. Test CORS permitido

Enviar:

```text
Origin: http://localhost:5173
```

esperado:

```text
Access-Control-Allow-Origin
```

correcto.

---

# 113. Test CORS no permitido

Enviar:

```text
Origin: https://malicioso.example
```

No deberá recibir autorización CORS válida.

---

# 114. Test JSON inválido

Enviar JSON malformado.

Esperado:

```text
400
JSON_INVALIDO
```

---

# 115. Test body grande

Puede probarse de forma controlada.

Esperado:

```text
413
SECURITY_BODY_DEMASIADO_GRANDE
```

---

# 116. Test de validación

Como todavía no tenemos endpoints funcionales, crearemos una ruta exclusivamente dentro de tests o probaremos directamente el middleware/schema.

Preferimos:

```text
test unitario del middleware
```

antes que añadir una ruta `/api/test`.

---

# 117. No crear endpoints de prueba en producción

No queremos:

```text
/api/test-error
/api/test-validation
```

dentro de la aplicación real.

---

# 118. Unit test AppError

Probar que:

```text
status
codigo
mensaje
detalles
```

se conservan.

---

# 119. Unit test validación

Crear un schema pequeño dentro del test:

```text
nombre requerido
```

y comprobar que el middleware transforma el error correctamente.

---

# 120. Unit test transaction helper

Este helper se probará mejor más adelante con PostgreSQL test real.

En CHECKPOINT 2 basta con:

```text
implementación
+
revisión
```

La cobertura completa llegará con servicios de CHECKPOINT 3–5.

---

# 121. Base de datos de test

Debe existir:

```text
consumo_electrico_test
```

como definimos en CHECKPOINT 1.

---

# 122. Migraciones en test

Antes de futuras pruebas de integración, debe poder ejecutarse:

```text
migraciones sobre consumo_electrico_test
```

sin afectar desarrollo.

---

# 123. Script opcional

Podemos añadir:

```text
db:migrate:test
```

pero no queremos duplicar el migrador.

Mejor:

```text
NODE_ENV=test
```

con configuración de test.

---

# 124. Compatibilidad Windows

Como queremos enseñar en distintas máquinas, evitaremos scripts npm dependientes de:

```text
NODE_ENV=test comando
```

porque en Windows CMD puede comportarse diferente.

---

# 125. Opción recomendable

Instalar:

```bash
npm install -D cross-env
```

---

# 126. Scripts portables

Por ejemplo:

```json
"test": "cross-env NODE_ENV=test vitest run"
```

---

# 127. Decisión

Usaremos:

```text
cross-env
```

para scripts que establezcan variables de entorno.

---

# 128. Dependencias de desarrollo completas

```bash
npm install -D vitest supertest @vitest/coverage-v8 cross-env
```

---

# 129. Configuración test segura

`env.js` deberá cargar el archivo correspondiente o depender de las variables ya definidas.

Podremos utilizar:

```text
.env.test
```

cuando:

```text
NODE_ENV=test
```

pero `dotenv/config` por sí solo carga `.env`.

---

# 130. Estrategia elegida

Crearemos:

```text
backend/src/config/load-env.js
```

o haremos que `env.js` determine:

```text
.env
.env.test
```

según `NODE_ENV`.

---

# 131. Conceptualmente

```javascript
const nombreArchivo =
    process.env.NODE_ENV === 'test'
        ? '.env.test'
        : '.env';

dotenv.config({
    path: nombreArchivo,
});
```

---

# 132. Importante

`NODE_ENV` debe conocerse antes de cargar el archivo.

Los scripts de test utilizan:

```text
cross-env NODE_ENV=test
```

---

# 133. No mezclar DB test y desarrollo

Al arrancar tests podremos añadir una protección:

```text
si NODE_ENV=test
y DB_NAME no contiene "_test"
→ abortar
```

---

# 134. Regla TEST-DB-001 reforzada

Conceptualmente:

```javascript
if (
    env.nodeEnv === 'test' &&
    !env.db.name.endsWith('_test')
) {
    throw new Error(
        'Las pruebas requieren una base _test'
    );
}
```

---

# 135. Por qué

Queremos que sea difícil ejecutar accidentalmente pruebas destructivas sobre:

```text
consumo_electrico
```

---

# 136. Scripts finales aproximados

`backend/package.json`:

```json
{
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",

    "db:check": "node scripts/db-check.js",
    "db:migrate": "node scripts/migrate.js",
    "db:seed": "node scripts/seed.js",
    "db:status": "node scripts/db-status.js",

    "test": "cross-env NODE_ENV=test vitest run",
    "test:watch": "cross-env NODE_ENV=test vitest",
    "test:coverage": "cross-env NODE_ENV=test vitest run --coverage"
  }
}
```

---

# 137. ESLint

SPEC-011 previó:

```text
ESLint / Prettier
```

Podemos incorporar ESLint en este checkpoint porque estamos construyendo infraestructura backend.

---

# 138. Instalar

```bash
npm install -D eslint
```

---

# 139. Configuración mínima

No necesitamos una configuración gigantesca.

Objetivo:

```text
errores básicos
variables no utilizadas
consistencia
```

---

# 140. Script

```json
"lint": "eslint ."
```

---

# 141. Prettier

Puede incorporarse posteriormente cuando trabajemos frontend también.

Para no convertir CHECKPOINT 2 en un proyecto de tooling:

```text
Prettier → CHECKPOINT 7
```

o integrarlo luego de forma global.

---

# 142. Server.js

Debe utilizar:

```text
env.port
```

en lugar de:

```javascript
const PORT = 3000;
```

---

# 143. Antes

```javascript
const PORT = 3000;
```

---

# 144. Después

```javascript
import { env } from './config/env.js';

app.listen(env.port, () => {
    console.log(
        `API ejecutándose en puerto ${env.port}`
    );
});
```

---

# 145. No imprimir URL con datos sensibles

Puerto es seguro.

Credenciales DB no.

---

# 146. Manejo de cierre

Podemos preparar un cierre limpio.

Señales:

```text
SIGINT
SIGTERM
```

---

# 147. Cierre básico

Al cerrar servidor:

```text
detener HTTP
cerrar pool PostgreSQL
```

---

# 148. ¿Es obligatorio en MVP?

No es crítico localmente, pero es una buena práctica sencilla.

La implementaremos si no complica el ejemplo.

---

# 149. Estructura backend después de CHECKPOINT 2

```text
backend/
├── src/
│   ├── config/
│   │   ├── env.js
│   │   └── cors.js
│   │
│   ├── controllers/
│   │
│   ├── db/
│   │   ├── pool.js
│   │   └── transaction.js
│   │
│   ├── errors/
│   │   ├── app-error.js
│   │   └── error-codes.js
│   │
│   ├── middlewares/
│   │   ├── error.middleware.js
│   │   ├── logger.middleware.js
│   │   ├── not-found.middleware.js
│   │   ├── origin.middleware.js
│   │   ├── rate-limit.middleware.js
│   │   ├── request-id.middleware.js
│   │   └── validation.middleware.js
│   │
│   ├── repositories/
│   ├── routes/
│   │   └── index.js
│   │
│   ├── services/
│   ├── utils/
│   ├── validators/
│   │   └── common.validators.js
│   │
│   ├── app.js
│   └── server.js
│
├── database/
├── scripts/
├── tests/
│   ├── unit/
│   ├── integration/
│   │   └── health.test.js
│   └── helpers/
│
├── .env.example
├── .env.test.example
├── vitest.config.js
└── package.json
```

---

# 150. `app.js` conceptual final

```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { corsOptions }
    from './config/cors.js';

import { asignarRequestId }
    from './middlewares/request-id.middleware.js';

import { loggerHttp }
    from './middlewares/logger.middleware.js';

import { rateLimitGeneral }
    from './middlewares/rate-limit.middleware.js';

import { rutaNoEncontrada }
    from './middlewares/not-found.middleware.js';

import { manejarError }
    from './middlewares/error.middleware.js';

import router from './routes/index.js';

const app = express();

app.use(asignarRequestId);
app.use(helmet());
app.use(cors(corsOptions));

app.use(
    express.json({
        limit: '100kb',
    })
);

app.use(loggerHttp);
app.use(rateLimitGeneral);

app.use('/api', router);

app.use(rutaNoEncontrada);
app.use(manejarError);

export default app;
```

La implementación real deberá manejar correctamente errores generados por CORS/parsing.

---

# 151. Ruta health

En:

```text
routes/index.js
```

podemos mantener:

```javascript
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
    });
});
```

---

# 152. ¿Controlador Health?

Todavía no necesitamos crear:

```text
health.controller.js
health.service.js
health.repository.js
```

para una respuesta estática.

Esto sería sobrearquitectura.

---

# 153. Principio

La arquitectura debe ayudar.

No convertir cada tres líneas en cuatro capas.

---

# 154. Test suite mínima del checkpoint

Al cerrar deben existir pruebas automáticas para:

```text
health 200
404 uniforme
request ID
headers de seguridad
CORS permitido
CORS no permitido
JSON inválido
body demasiado grande
AppError
validación Zod
```

---

# 155. Rate limit

Debe existir al menos una prueba específica.

Podemos probar directamente el middleware con una app Express de test y límite reducido.

No necesitamos hacer:

```text
121 peticiones
```

en cada ejecución normal.

---

# 156. Test helper

Dentro del test podemos configurar:

```text
limit = 2
```

y comprobar que la tercera produce:

```text
429
```

---

# 157. Error 429 uniforme

Aunque `express-rate-limit` puede devolver texto/JSON propio, queremos nuestro contrato.

Respuesta:

```json
{
  "error": {
    "codigo": "RATE_LIMIT_EXCEDIDO",
    "mensaje": "Demasiadas solicitudes. Intenta nuevamente más tarde."
  }
}
```

---

# 158. Añadir código

```text
RATE_LIMIT_EXCEDIDO
```

a:

```text
error-codes.js
```

---

# 159. Content-Type

El backend debe responder JSON con:

```text
application/json
```

para los contratos API.

---

# 160. Security smoke test

Después de iniciar backend:

```bash
npm run dev
```

consultar:

```text
GET /api/health
```

y revisar headers.

---

# 161. Ejemplo esperado

```text
HTTP 200
X-Request-Id: ...
X-Content-Type-Options: nosniff
...
```

Los headers exactos dependen de Helmet.

---

# 162. CORS smoke test

Desde frontend autorizado:

```text
http://localhost:5173
```

la petición debe ser permitida.

---

# 163. Origen distinto

Por ejemplo:

```text
http://localhost:9999
```

no debe recibir autorización CORS.

---

# 164. No confundir error CORS del navegador

Cuando CORS bloquea una petición, el navegador puede no mostrar al frontend el body de respuesta.

Esto es normal.

---

# 165. Logging seguro — prueba manual

Ejecutar health.

Log permitido:

```text
GET /api/health 200 3ms
```

---

# 166. Más adelante login

No deberán aparecer:

```text
password
Authorization Bearer ...
Cookie ...
```

Nuestro logger ya debe estar diseñado para no registrarlos.

---

# 167. Base de datos

CHECKPOINT 2 no agrega migraciones de negocio.

Esperado:

```text
001_esquema_inicial
002_sesiones
```

siguen siendo las últimas.

---

# 168. No crear migración 003 sin necesidad

Infraestructura Express no requiere modificar PostgreSQL.

---

# 169. README

Actualizar documentación.

Agregar:

```text
## Backend
## Seguridad base
## Tests
```

---

# 170. Comandos documentados

```bash
cd backend

npm run dev
npm run lint
npm test
npm run test:coverage
```

---

# 171. No afirmar autenticación implementada

README debe indicar:

```text
Seguridad HTTP base → implementada
Autenticación → pendiente
```

---

# 172. Gate técnico

Ejecutar:

```bash
npm run lint
npm test
```

Ambos:

```text
PASS
```

---

# 173. DB continúa sana

También:

```bash
npm run db:check
npm run db:status
```

deben seguir funcionando.

---

# 174. Health

```text
GET /api/health
→ 200
```

---

# 175. Build frontend

CHECKPOINT 2 no modifica frontend, pero como regresión:

```bash
cd ../frontend
npm run build
```

debe seguir pasando.

---

# 176. Git status

Desde raíz:

```bash
git status
```

Verificar:

```text
.env NO aparece
.env.test NO aparece
coverage NO aparece
node_modules NO aparece
```

---

# 177. `.gitignore`

Asegurar:

```text
coverage/
```

esté excluido.

---

# 178. Commit

Después de gate verde:

```bash
git add .
git status
```

Revisar.

Luego:

```bash
git commit -m "feat: establecer seguridad base del backend"
```

---

# 179. Working tree

```bash
git status
```

Esperado:

```text
nothing to commit, working tree clean
```

---

# 180. Gate CHECKPOINT 2

### CP2-001

Configuración centralizada.

### CP2-002

Variables de entorno validadas.

### CP2-003

`server.js` utiliza configuración.

### CP2-004

Helmet instalado.

### CP2-005

CORS restringido.

### CP2-006

`credentials: true`.

### CP2-007

Existe middleware reutilizable de Origin.

### CP2-008

JSON limitado a 100 KB.

### CP2-009

Existe Request ID.

### CP2-010

`X-Request-Id` se devuelve.

### CP2-011

Existe logging HTTP seguro.

### CP2-012

Logger no registra body globalmente.

### CP2-013

Logger no registra Authorization ni cookies.

### CP2-014

Existe rate limit general.

### CP2-015

Rate limit tiene respuesta uniforme 429.

### CP2-016

Zod instalado.

### CP2-017

Existe middleware reutilizable de validación.

### CP2-018

Existe `AppError`.

### CP2-019

Existen códigos de error centralizados.

### CP2-020

404 tiene contrato uniforme.

### CP2-021

Errores 500 no exponen stack.

### CP2-022

JSON inválido se maneja.

### CP2-023

Body demasiado grande se maneja.

### CP2-024

Existe helper de transacción.

### CP2-025

Helper garantiza `ROLLBACK`.

### CP2-026

Helper garantiza `release`.

### CP2-027

Vitest instalado.

### CP2-028

Supertest instalado.

### CP2-029

Existe entorno de test separado.

### CP2-030

Existe protección contra usar DB de desarrollo en tests.

### CP2-031

Health tiene prueba automatizada.

### CP2-032

404 tiene prueba.

### CP2-033

CORS tiene pruebas.

### CP2-034

Request ID tiene prueba.

### CP2-035

Headers de seguridad tienen smoke test.

### CP2-036

Validación tiene pruebas.

### CP2-037

Rate limit tiene prueba.

### CP2-038

`npm run lint` pasa.

### CP2-039

`npm test` pasa.

### CP2-040

Frontend build sigue pasando.

### CP2-041

No existen nuevos secretos versionados.

### CP2-042

Existe commit del checkpoint.

### CP2-043

Working tree limpio.

---

# 181. Estado de las SPEC

Después de cerrar:

```text
SPEC-010
Seguridad transversal
→ IMPLEMENTADA PARCIALMENTE
```

Porque todavía faltan elementos dependientes de autenticación:

```text
cookie Refresh real
JWT
login rate limit
logout
refresh
```

---

# 182. SPEC-011

La arquitectura backend base ya está materializada, pero todavía faltan módulos funcionales.

Por tanto:

```text
SPEC-011 → IMPLEMENTADA PARCIALMENTE
```

---

# 183. SPEC-012

Ya existe infraestructura inicial de testing.

Pero falta gran parte de la matriz.

Por tanto:

```text
SPEC-012 → IMPLEMENTADA PARCIALMENTE
```

---

# 184. No declarar SPEC cerradas todavía

Estamos construyendo por capas.

Esto es exactamente lo que definimos:

```text
DISEÑADA
↓
EN IMPLEMENTACIÓN
↓
IMPLEMENTADA
↓
PROBADA
↓
CERRADA
```

---

# 185. Estado del roadmap

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
→ CERRADO

CHECKPOINT 3
Autenticación
→ SIGUIENTE

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

# 186. Qué todavía NO existe

Incluso al cerrar CHECKPOINT 2:

```text
NO login
NO JWT
NO bcrypt
NO usuario autenticado
NO Refresh Token
NO middleware auth
NO middleware roles
NO API usuarios
NO API lecturas
NO estadísticas
NO dashboard
```

---

# 187. Qué sí tendremos

```text
Express organizado
configuración segura
errores uniformes
validación reutilizable
seguridad HTTP básica
CORS
rate limiting
logging seguro
transacciones reutilizables
Vitest
Supertest
```

Es decir:

> una base suficientemente sólida para empezar autenticación sin improvisar infraestructura.

---

# 188. Siguiente checkpoint

```text
CHECKPOINT 3
Autenticación, sesiones y primer ADMIN
```

Ahí implementaremos:

```text
bcrypt
JWT
Refresh Token
SHA-256
cookie HttpOnly
crear-admin
login
refresh
rotación
logout
/auth/me
cambiar contraseña
middleware autenticar
middleware requerirRol
rate limit de login
tests de autenticación
```

Al cerrar CHECKPOINT 3 tendremos por primera vez un usuario real capaz de iniciar y cerrar sesión de manera segura.

---

# 189. Criterio pedagógico

Un aprendiz deberá poder responder:

1. ¿Qué hace Helmet?
2. ¿Qué diferencia existe entre CORS y autenticación?
3. ¿Para qué sirve `Origin`?
4. ¿Por qué no validamos Origin globalmente?
5. ¿Por qué limitamos el tamaño del JSON?
6. ¿Qué es un Request ID?
7. ¿Qué datos puede registrar nuestro logger?
8. ¿Qué datos nunca debe registrar?
9. ¿Qué problema resuelve rate limiting?
10. ¿Qué diferencia existe entre rate limit general y el de login?
11. ¿Qué es Zod?
12. ¿Qué valida Zod?
13. ¿Qué no debe validar Zod?
14. ¿Qué es `AppError`?
15. ¿Por qué usamos códigos de error?
16. ¿Cómo manejamos un 404?
17. ¿Cómo manejamos un error inesperado?
18. ¿Por qué el navegador no debe recibir stack traces?
19. ¿Qué hace nuestro helper de transacción?
20. ¿Por qué `release()` debe ejecutarse incluso si falla la operación?
21. ¿Por qué separamos `app.js` de `server.js`?
22. ¿Qué hace Supertest?
23. ¿Por qué los tests utilizan `NODE_ENV=test`?
24. ¿Por qué protegemos explícitamente la DB de desarrollo?
25. ¿Por qué todavía no implementamos login en este checkpoint?

Cuando todos los `CP2-*` estén verdes:

```text
CHECKPOINT 2 → CERRADO
```
