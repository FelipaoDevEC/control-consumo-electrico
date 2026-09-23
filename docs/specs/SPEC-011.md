# SPEC-011 — Arquitectura técnica y estructura del proyecto

## 1. Objetivo

Definir la arquitectura técnica del proyecto antes de comenzar la implementación.

Esta especificación establece:

* estructura general del repositorio;
* separación frontend/backend;
* organización del backend;
* organización del frontend;
* flujo de dependencias;
* acceso a PostgreSQL;
* migraciones;
* seeds;
* configuración;
* variables de entorno;
* estructura de rutas;
* nomenclatura;
* pruebas;
* responsabilidades de cada capa.

El objetivo será mantener una arquitectura:

* simple;
* educativa;
* predecible;
* mantenible;
* suficientemente escalable para el MVP;
* sin sobreingeniería.

---

# 2. Arquitectura general

La aplicación utilizará:

```text
React
   ↓
HTTP / REST
   ↓
Express
   ↓
Controlador
   ↓
Servicio
   ↓
Repositorio
   ↓
pg
   ↓
PostgreSQL
```

Cada capa tendrá una responsabilidad concreta.

---

# 3. Repositorio

Utilizaremos inicialmente un único repositorio con dos aplicaciones principales.

Estructura:

```text
control-consumo-electrico/
│
├── backend/
├── frontend/
├── docs/
├── .gitignore
├── README.md
└── package.json
```

---

# 4. Monorepo sencillo

No utilizaremos herramientas complejas de monorepo.

No necesitamos inicialmente:

```text
Nx
Turborepo
Lerna
```

El proyecto tendrá simplemente:

```text
backend/
frontend/
```

dentro del mismo repositorio.

---

# 5. Motivo

Esto permite que los estudiantes comprendan claramente:

```text
una aplicación frontend
+
una aplicación backend
```

sin introducir herramientas adicionales que todavía no aportan valor.

---

# 6. Carpeta `docs`

Las especificaciones SDD formarán parte del proyecto.

Estructura:

```text
docs/
└── specs/
    ├── SPEC-000-vision-alcance.md
    ├── SPEC-001-dominio-reglas.md
    ├── SPEC-002-modelo-datos.md
    ├── SPEC-003-autenticacion-roles.md
    ├── SPEC-004-lecturas.md
    ├── SPEC-005-estadisticas.md
    ├── SPEC-006-historial.md
    ├── SPEC-007-dashboard.md
    ├── SPEC-008-diseno-visual.md
    ├── SPEC-009-administracion-usuarios.md
    ├── SPEC-010-seguridad.md
    └── SPEC-011-arquitectura.md
```

---

# 7. Principio SDD

El código deberá poder relacionarse con una especificación.

Ejemplo:

```text
SPEC-004
Registro de lecturas
```

se implementará principalmente en:

```text
routes/lecturas.routes.js
controllers/lecturas.controller.js
services/lecturas.service.js
repositories/lecturas.repository.js
```

---

# 8. Backend

Ubicación:

```text
backend/
```

Tecnologías:

```text
Node.js
Express
pg
PostgreSQL
```

---

# 9. Backend — estructura general

Propuesta:

```text
backend/
│
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   ├── validators/
│   ├── utils/
│   ├── errors/
│   ├── db/
│   ├── app.js
│   └── server.js
│
├── database/
│   ├── migrations/
│   └── seeds/
│
├── scripts/
│
├── tests/
│
├── .env.example
├── package.json
└── README.md
```

---

# 10. `server.js`

Responsabilidad:

```text
arrancar servidor HTTP
```

Conceptualmente:

```text
cargar configuración
↓
crear aplicación Express
↓
escuchar puerto
```

No contendrá lógica de negocio.

---

# 11. `app.js`

Responsabilidad:

```text
configurar Express
```

Por ejemplo:

```text
middlewares globales
rutas
404
middleware de errores
```

Conceptualmente:

```text
Express
↓
security headers
↓
CORS
↓
JSON parser
↓
request ID
↓
logging
↓
routes
↓
404
↓
error handler
```

---

# 12. Separar `app.js` de `server.js`

Esto facilitará pruebas.

Podremos importar:

```text
app
```

en tests sin iniciar realmente un puerto HTTP.

---

# 13. `config/`

Contendrá configuración de la aplicación.

Ejemplo:

```text
config/
├── env.js
├── database.js
├── cors.js
└── constants.js
```

---

# 14. `env.js`

Responsabilidad:

```text
leer
validar
normalizar
```

variables de entorno.

Ejemplo conceptual:

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

# 15. Regla de configuración

El resto del proyecto no debería consultar:

```text
process.env
```

arbitrariamente por todas partes.

Preferiremos centralizarlo mediante:

```text
config
```

---

# 16. Beneficio

En lugar de:

```text
servicio A → process.env
servicio B → process.env
repositorio → process.env
middleware → process.env
```

tendremos:

```text
env.js
  ↓
configuración validada
```

---

# 17. `db/`

Responsabilidad:

```text
infraestructura PostgreSQL
```

Ejemplo:

```text
db/
├── pool.js
└── transaction.js
```

---

# 18. `pool.js`

Creará:

```text
pg.Pool
```

utilizando la configuración validada.

---

# 19. Regla

Solo existirá una configuración central del pool.

No crear:

```text
new Pool()
```

en cada repositorio.

---

# 20. `transaction.js`

Podrá proporcionar una ayuda para operaciones como:

```text
BEGIN
COMMIT
ROLLBACK
release
```

sin esconder excesivamente lo que sucede.

---

# 21. Objetivo educativo

Los estudiantes deberán comprender:

```text
qué es una transacción
```

antes de crear abstracciones complejas.

---

# 22. `routes/`

Responsabilidad:

```text
definir URLs
métodos HTTP
middlewares asociados
controlador final
```

Ejemplo:

```text
routes/
├── auth.routes.js
├── lecturas.routes.js
├── estadisticas.routes.js
└── usuarios-admin.routes.js
```

---

# 23. Ejemplo conceptual

```text
POST /api/lecturas
    ↓
autenticar
    ↓
validarRegistroLectura
    ↓
lecturasController.registrar
```

La ruta no contiene SQL ni reglas complejas.

---

# 24. `controllers/`

Responsabilidad:

```text
traducir HTTP ↔ aplicación
```

Ejemplo:

```text
controllers/
├── auth.controller.js
├── lecturas.controller.js
├── estadisticas.controller.js
└── usuarios-admin.controller.js
```

---

# 25. Controlador delgado

Un controlador debería hacer algo conceptualmente similar a:

```text
obtener datos validados
↓
obtener usuario autenticado
↓
llamar servicio
↓
devolver HTTP
```

---

# 26. El controlador NO debe

```text
escribir SQL
calcular bcrypt
implementar reglas cronológicas
gestionar transacciones complejas
calcular estadísticas
```

---

# 27. `services/`

Esta será la capa principal de negocio.

Estructura:

```text
services/
├── auth.service.js
├── usuarios.service.js
├── lecturas.service.js
└── estadisticas.service.js
```

---

# 28. Responsabilidad del servicio

Ejemplo `lecturas.service.js`:

```text
comprobar permisos
↓
abrir transacción
↓
bloquear medidor
↓
buscar anterior/siguiente
↓
validar regla
↓
pedir inserción al repositorio
↓
commit
```

---

# 29. Regla de negocio

Las decisiones como:

```text
USUARIO solo puede registrar hoy
```

pertenecen al:

```text
servicio
```

no al repositorio.

---

# 30. `repositories/`

Responsabilidad:

```text
SQL
```

Estructura:

```text
repositories/
├── usuarios.repository.js
├── sesiones.repository.js
├── medidores.repository.js
└── lecturas.repository.js
```

---

# 31. Repositorio

Un repositorio conoce:

```text
tabla
columnas
consultas
joins
parámetros
```

Pero no debería conocer reglas como:

```text
el último ADMIN no puede desactivarse
```

---

# 32. Ejemplo

`lecturas.repository.js` puede contener operaciones como:

```text
buscarPorFecha
buscarAnterior
buscarSiguiente
buscarUltima
crear
actualizarValor
listar
bloquearMedidor
```

---

# 33. SQL explícito

No utilizaremos ORM.

Ejemplo conceptual:

```javascript
await client.query(
    `
    SELECT id_lectura, fecha_lectura, valor_lectura
    FROM lecturas_medidor
    WHERE id_medidor = $1
      AND fecha_lectura < $2
    ORDER BY fecha_lectura DESC
    LIMIT 1
    `,
    [idMedidor, fecha]
);
```

---

# 34. Ventaja educativa

Los estudiantes aprenderán directamente:

```text
SELECT
INSERT
UPDATE
JOIN
WHERE
ORDER BY
GROUP BY
LAG
transacciones
índices
constraints
```

---

# 35. `middlewares/`

Estructura:

```text
middlewares/
├── auth.middleware.js
├── roles.middleware.js
├── validation.middleware.js
├── rate-limit.middleware.js
├── request-id.middleware.js
├── origin.middleware.js
├── not-found.middleware.js
└── error.middleware.js
```

---

# 36. `auth.middleware.js`

Responsabilidad:

```text
validar Access Token
validar sesión
validar usuario activo
```

---

# 37. `roles.middleware.js`

Responsabilidad:

```text
requerirRol('ADMIN')
```

para permisos globales.

---

# 38. Permisos contextuales

Una regla como:

```text
USUARIO puede editar la lectura de hoy
```

NO pertenece a `roles.middleware.js`.

Pertenece al:

```text
lecturas.service.js
```

---

# 39. `validators/`

Contendrá esquemas de entrada.

Ejemplo:

```text
validators/
├── auth.validators.js
├── lecturas.validators.js
└── usuarios.validators.js
```

---

# 40. Ejemplo

`lecturas.validators.js` podrá definir:

```text
registrarLecturaSchema
corregirLecturaSchema
listarLecturasQuerySchema
```

---

# 41. Validación estructural

El validator comprueba:

```text
tipo
campo requerido
formato
longitud
```

No decide:

```text
si la lectura rompe la secuencia del medidor
```

---

# 42. `errors/`

Permitirá modelar errores esperados.

Ejemplo:

```text
errors/
├── AppError.js
└── error-codes.js
```

---

# 43. `AppError`

Conceptualmente podrá contener:

```text
codigo
mensaje
status
detalles
```

---

# 44. Ejemplo

```text
codigo:
LECTURA_FECHA_DUPLICADA

status:
409
```

---

# 45. Error inesperado

No deberá convertirse manualmente en `AppError` solo para ocultarlo.

Los errores de programación deben terminar en:

```text
500
```

y ser corregidos.

---

# 46. `utils/`

Solo para funciones realmente genéricas.

Ejemplos posibles:

```text
utils/
├── date.js
├── crypto.js
└── pagination.js
```

---

# 47. Evitar cajón de sastre

No queremos un:

```text
utils.js
```

de 2000 líneas.

---

# 48. Utilidades de fecha

Podrán encapsular:

```text
fecha actual America/Guayaquil
validación calendario
formato ISO de fecha
```

---

# 49. Utilidades criptográficas

Podrán contener:

```text
generar refresh token
hash SHA-256
```

No deberían mezclar lógica de autenticación completa.

---

# 50. Base de datos

La carpeta:

```text
backend/database/
```

contendrá scripts persistentes de base de datos.

---

# 51. Migraciones

Estructura:

```text
database/
└── migrations/
    ├── 001_esquema_inicial.sql
    └── 002_sesiones.sql
```

---

# 52. Evolución documentada

Esto refleja exactamente nuestras SPEC:

```text
SPEC-002
↓
usuarios
medidores
lecturas_medidor

SPEC-003
↓
sesiones
```

---

# 53. Migración `001`

Contendrá:

```text
usuarios
medidores
lecturas_medidor
índices iniciales
constraints
```

---

# 54. Migración `002`

Contendrá:

```text
sesiones
```

---

# 55. Migraciones inmutables

Una vez aplicada y compartida una migración:

```text
no se edita retroactivamente
```

Si aparece un cambio:

```text
003_nuevo_cambio.sql
```

---

# 56. Motivo

Esto permite reproducir la evolución real del esquema.

---

# 57. No depender de `schema.sql` mutable únicamente

Podrá existir una referencia consolidada futura, pero las migraciones serán la historia oficial del modelo.

---

# 58. Seeds

Estructura:

```text
database/
└── seeds/
    └── 001_medidor_principal.sql
```

---

# 59. Seed inicial

Insertará:

```text
Medidor principal
```

---

# 60. No crear ADMIN mediante seed SQL

Porque necesitaríamos:

```text
password_hash
```

y terminaríamos tentados a guardar credenciales conocidas.

---

# 61. `scripts/`

Contendrá scripts de administración local.

Ejemplo:

```text
scripts/
└── crear-admin.js
```

---

# 62. Script `crear-admin`

Responsabilidad:

```text
pedir nombre
pedir correo
pedir contraseña
validar
hash bcrypt
crear primer ADMIN
```

---

# 63. Seguridad del script

La contraseña no debe:

```text
escribirse en el código
imprimirse en consola
guardarse en logs
```

---

# 64. Frontend

Ubicación:

```text
frontend/
```

Tecnología:

```text
React
```

Recomendamos iniciar mediante:

```text
Vite
```

por simplicidad.

---

# 65. Frontend — estructura general

Propuesta:

```text
frontend/
│
├── src/
│   ├── api/
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   ├── routes/
│   ├── styles/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
│
├── public/
├── tests/
├── .env.example
├── package.json
└── README.md
```

---

# 66. `main.jsx`

Responsabilidad:

```text
arrancar React
```

y conectar proveedores globales necesarios.

---

# 67. `App.jsx`

No debe convertirse en toda la aplicación.

Su responsabilidad principal será:

```text
composición global
router
providers
```

---

# 68. `pages/`

Estructura prevista:

```text
pages/
├── LoginPage.jsx
├── DashboardPage.jsx
├── HistorialPage.jsx
├── PerfilPage.jsx
├── UsuariosPage.jsx
├── UsuarioFormPage.jsx
├── NotFoundPage.jsx
└── ForbiddenPage.jsx
```

---

# 69. Página

Una página representa:

```text
una ruta principal
```

No necesariamente toda la lógica que aparece en ella.

---

# 70. `components/`

Ejemplo:

```text
components/
├── ui/
├── dashboard/
├── lecturas/
├── usuarios/
└── layout/
```

---

# 71. `components/ui/`

Podrá contener:

```text
Button.jsx
Input.jsx
Modal.jsx
Badge.jsx
Toast.jsx
EmptyState.jsx
Skeleton.jsx
```

---

# 72. Componentes de dominio

Ejemplo:

```text
dashboard/
├── MetricCard.jsx
├── ConsumptionChart.jsx
└── TodayReadingCard.jsx
```

---

# 73. Lecturas

```text
lecturas/
├── ReadingForm.jsx
├── ReadingCard.jsx
├── ReadingTable.jsx
└── ReadingDetails.jsx
```

---

# 74. Usuarios

```text
usuarios/
├── UserForm.jsx
├── UserTable.jsx
├── UserCard.jsx
└── UserActions.jsx
```

---

# 75. `layouts/`

Ejemplo:

```text
layouts/
├── AuthLayout.jsx
└── AppLayout.jsx
```

---

# 76. `AuthLayout`

Para:

```text
login
```

---

# 77. `AppLayout`

Para:

```text
dashboard
historial
perfil
usuarios
```

e incluir:

```text
sidebar desktop
navegación móvil
header
contenido
```

---

# 78. `routes/`

Estructura conceptual:

```text
routes/
├── AppRouter.jsx
├── ProtectedRoute.jsx
└── AdminRoute.jsx
```

---

# 79. `ProtectedRoute`

Comprueba:

```text
sesión frontend disponible
```

y controla navegación.

---

# 80. `AdminRoute`

Oculta/protege navegación administrativa en React.

Pero nuevamente:

```text
no sustituye la autorización del backend
```

---

# 81. `contexts/`

Podremos utilizar pocos contextos globales.

Inicialmente:

```text
contexts/
├── AuthContext.jsx
└── ThemeContext.jsx
```

---

# 82. AuthContext

Responsabilidad:

```text
usuario actual
Access Token en memoria
login
logout
refresh
estado de autenticación
```

---

# 83. No almacenar datos de negocio globalmente sin necesidad

No utilizaremos un contexto gigante con:

```text
usuarios
lecturas
dashboard
tema
auth
formularios
```

todo junto.

---

# 84. ThemeContext

Responsabilidad:

```text
tema preferido
tema efectivo
cambiar tema
escuchar prefers-color-scheme
```

---

# 85. `hooks/`

Hooks reutilizables específicos.

Ejemplo:

```text
hooks/
├── useAuth.js
├── useTheme.js
└── useMediaQuery.js
```

---

# 86. No crear hooks innecesarios

Si una lógica solo se utiliza una vez y es simple, no necesita convertirse automáticamente en hook.

---

# 87. `api/`

Responsabilidad:

```text
comunicación HTTP con backend
```

Estructura posible:

```text
api/
├── client.js
├── auth.api.js
├── lecturas.api.js
├── estadisticas.api.js
└── usuarios.api.js
```

---

# 88. `client.js`

Contendrá la configuración común del cliente HTTP.

Conceptualmente:

```text
baseURL
credentials
Authorization
manejo de 401
refresh coordinado
```

---

# 89. No llamar `fetch`/Axios arbitrariamente por toda la UI

Preferimos:

```text
lecturas.api.js
```

para las operaciones de lecturas.

---

# 90. Ejemplo

Página:

```text
DashboardPage
```

llama:

```text
estadisticasApi.obtenerResumen()
```

en lugar de escribir la URL manualmente dentro del componente.

---

# 91. Dependencia de React

Flujo recomendado:

```text
Page
↓
Hook / función de carga
↓
API module
↓
HTTP
```

---

# 92. React no conoce PostgreSQL

Nunca deberá existir:

```text
React → PostgreSQL
```

directamente.

Siempre:

```text
React → Express → PostgreSQL
```

---

# 93. `styles/`

Según SPEC-008:

```text
styles/
├── tokens.css
├── themes.css
└── global.css
```

---

# 94. CSS por componente

Los componentes podrán usar:

```text
Component.module.css
```

cuando corresponda.

---

# 95. No duplicar tokens visuales

Los colores y espaciamientos compartidos proceden de:

```text
tokens.css
themes.css
```

---

# 96. Rutas frontend

Inicialmente:

```text
/login
/dashboard
/historial
/perfil
/admin/usuarios
/admin/usuarios/nuevo
/admin/usuarios/:id
```

---

# 97. Ruta inicial

Si no está autenticado:

```text
/
→ /login
```

Si está autenticado:

```text
/
→ /dashboard
```

---

# 98. Ruta protegida

Ejemplo:

```text
/dashboard
```

requiere sesión.

---

# 99. Ruta administrativa

```text
/admin/usuarios
```

requiere:

```text
ADMIN
```

---

# 100. API backend

Prefijo:

```text
/api
```

---

# 101. Rutas de autenticación

```text
POST  /api/auth/login
POST  /api/auth/refresh
POST  /api/auth/logout
GET   /api/auth/me
PATCH /api/auth/password
PATCH /api/auth/tema
```

---

# 102. Rutas de lecturas

```text
POST  /api/lecturas
GET   /api/lecturas
GET   /api/lecturas/ultima
GET   /api/lecturas/:id
PATCH /api/lecturas/:id
```

---

# 103. Rutas estadísticas

```text
GET /api/estadisticas/resumen
GET /api/estadisticas/serie
```

---

# 104. Rutas administrativas

```text
GET   /api/admin/usuarios
GET   /api/admin/usuarios/:id
POST  /api/admin/usuarios
PATCH /api/admin/usuarios/:id
PATCH /api/admin/usuarios/:id/estado
PUT   /api/admin/usuarios/:id/password
```

---

# 105. Convención de respuesta

Datos normales:

```json
{
  "idLectura": 25,
  "valorLectura": 12555
}
```

No necesitamos envolver todo artificialmente en:

```json
{
  "success": true,
  "data": {},
  "message": ""
}
```

si no aporta valor.

---

# 106. Respuestas paginadas

Sí tendrán estructura:

```json
{
  "datos": [],
  "paginacion": {}
}
```

---

# 107. Errores

Siempre:

```json
{
  "error": {
    "codigo": "...",
    "mensaje": "..."
  }
}
```

---

# 108. Nomenclatura backend

Archivos:

```text
kebab-case
```

o:

```text
camelCase
```

de forma consistente.

Para este proyecto recomendamos:

```text
kebab-case
```

en nombres de archivos.

Ejemplo:

```text
auth.service.js
lecturas.repository.js
error.middleware.js
```

---

# 109. Código JavaScript

Variables y funciones:

```text
camelCase
```

Ejemplo:

```text
idUsuario
fechaLectura
obtenerLecturaAnterior
```

---

# 110. Clases

Si se utilizan:

```text
PascalCase
```

Ejemplo:

```text
AppError
```

---

# 111. SQL

Como ya congelamos:

```text
snake_case
```

Ejemplo:

```text
id_usuario
fecha_lectura
valor_lectura
```

---

# 112. Traducción entre capas

Repositorio:

```text
fecha_lectura
```

puede mapear a dominio/API:

```text
fechaLectura
```

---

# 113. No filtrar nombres SQL al frontend

La API utilizará nombres JavaScript:

```json
{
  "fechaLectura": "2026-08-30"
}
```

no:

```json
{
  "fecha_lectura": "2026-08-30"
}
```

---

# 114. Mapeadores

Si la conversión empieza a repetirse mucho, podremos utilizar funciones privadas o mapeadores sencillos.

No crearemos una capa compleja de DTOs desde el primer día.

---

# 115. JavaScript vs TypeScript

Para enseñar desde cero y mantener el foco en:

```text
SDD
React
Express
PostgreSQL
arquitectura
```

el MVP puede desarrollarse inicialmente en:

```text
JavaScript moderno
```

---

# 116. Decisión inicial

Utilizaremos:

```text
JavaScript
ES Modules
```

durante el MVP.

---

# 117. Motivo

Evita introducir simultáneamente:

```text
TypeScript
tipos genéricos
configuración adicional
```

mientras los aprendices todavía están comprendiendo la arquitectura.

---

# 118. Evolución futura

Después del MVP puede realizarse un ejercicio:

```text
migrar backend/frontend a TypeScript
```

para comparar ventajas.

---

# 119. ES Modules

Utilizaremos:

```javascript
import ...
export ...
```

en lugar de mezclar:

```text
require
module.exports
```

---

# 120. `package.json` raíz

Podrá contener scripts de comodidad.

Ejemplo conceptual:

```text
npm run dev
npm run dev:backend
npm run dev:frontend
npm run test
```

---

# 121. No esconder demasiado

Los estudiantes deberán aprender primero a ejecutar:

```text
backend
frontend
```

por separado.

Los scripts raíz serán comodidad, no magia.

---

# 122. Backend scripts previstos

```text
npm run dev
npm start
npm test
npm run crear-admin
npm run db:migrate
npm run db:seed
```

---

# 123. Frontend scripts previstos

```text
npm run dev
npm run build
npm run test
```

---

# 124. Migraciones — ejecutor

Como no utilizaremos ORM, tendremos un mecanismo sencillo para aplicar SQL.

Podrá ser:

```text
script Node propio
```

que:

```text
lee migraciones
↓
comprueba cuáles fueron aplicadas
↓
ejecuta pendientes
```

---

# 125. Tabla de migraciones

Para hacerlo correctamente necesitaremos una tabla técnica:

```text
schema_migrations
```

---

# 126. Evolución de SPEC-002

Esta tabla no representa dominio.

Es infraestructura.

Estructura conceptual:

```text
schema_migrations
├── version
├── nombre
└── aplicada_en
```

---

# 127. Ejemplo

```text
001 | esquema_inicial | 2026-08-30...
002 | sesiones        | 2026-08-30...
```

---

# 128. Motivo

Evita ejecutar la misma migración dos veces.

---

# 129. No confundir con tabla de negocio

`schema_migrations` no forma parte del modelo funcional del consumo eléctrico.

Es una tabla técnica.

---

# 130. Seeds separados de migraciones

Migración:

```text
crea estructura
```

Seed:

```text
crea datos iniciales
```

Ejemplo:

```text
Medidor principal
```

---

# 131. Tests backend

Estructura:

```text
tests/
├── unit/
├── integration/
└── helpers/
```

---

# 132. Unit tests

Para lógica pura.

Ejemplos:

```text
validación de fechas
cálculos
utilidades
```

---

# 133. Integration tests

Para:

```text
Express
+
servicio
+
PostgreSQL de prueba
```

cuando corresponda.

---

# 134. API tests

Usaremos posteriormente:

```text
Vitest
+
Supertest
```

como opción recomendada.

---

# 135. Tests frontend

Podremos utilizar:

```text
Vitest
React Testing Library
```

---

# 136. E2E

Después del MVP funcional:

```text
Playwright
```

para flujos completos.

Ejemplo:

```text
login
↓
registrar lectura
↓
ver dashboard
↓
ver historial
```

---

# 137. Base de datos de pruebas

Las pruebas de integración no utilizarán la misma base de datos de desarrollo.

Tendremos:

```text
DB_NAME_TEST
```

o configuración equivalente.

---

# 138. Regla crítica

Un test nunca deberá:

```text
borrar
modificar
reiniciar
```

la base de desarrollo del estudiante.

---

# 139. Configuraciones separadas

Entornos:

```text
development
test
production
```

---

# 140. Desarrollo

```text
NODE_ENV=development
```

---

# 141. Tests

```text
NODE_ENV=test
```

---

# 142. Producción

```text
NODE_ENV=production
```

---

# 143. Logs según entorno

Desarrollo:

```text
más información técnica
```

Producción:

```text
información controlada
```

Tests:

```text
mínimo ruido
```

---

# 144. `.env.example` backend

Conceptualmente:

```text
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=consumo_electrico
DB_USER=app_user
DB_PASSWORD=

JWT_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
REFRESH_TOKEN_DAYS=7

FRONTEND_URL=http://localhost:5173
APP_TIMEZONE=America/Guayaquil

NODE_ENV=development
```

---

# 145. Frontend `.env.example`

Conceptualmente:

```text
VITE_API_URL=http://localhost:3000/api
```

---

# 146. Regla frontend

Nunca colocar secretos en variables:

```text
VITE_*
```

porque terminan disponibles en el navegador.

---

# 147. Lo que sí puede estar

```text
URL pública de la API
```

---

# 148. Lo que no puede estar

```text
JWT_SECRET
DB_PASSWORD
Refresh Token secret
```

---

# 149. Flujo de una petición

Ejemplo:

```text
Usuario escribe 12555
↓
ReadingForm
↓
lecturas.api.js
↓
POST /api/lecturas
↓
routes
↓
auth middleware
↓
validation middleware
↓
controller
↓
service
↓
repository
↓
PostgreSQL
↓
response
↓
React actualiza dashboard
```

---

# 150. Flujo de autenticación

```text
LoginPage
↓
auth.api
↓
POST /auth/login
↓
auth controller
↓
auth service
↓
usuarios repository
↓
bcrypt
↓
sesiones repository
↓
JWT
↓
respuesta
↓
AuthContext
```

---

# 151. Flujo de estadísticas

```text
DashboardPage
↓
estadisticas.api
↓
GET /estadisticas/resumen
↓
controller
↓
service
↓
repository
↓
PostgreSQL
↓
cálculo
↓
JSON
↓
tarjetas
```

---

# 152. Regla de dependencia

El flujo debe ir:

```text
routes
→ controllers
→ services
→ repositories
→ db
```

---

# 153. Dependencias prohibidas

No queremos:

```text
repository → controller
repository → React
service → route
db → service
```

---

# 154. Motivo

Las capas inferiores no deberían conocer detalles de las superiores.

---

# 155. Regla ARCH-001

Los repositorios no importan controladores.

---

# 156. Regla ARCH-002

Los servicios no importan rutas.

---

# 157. Regla ARCH-003

Los controladores no ejecutan SQL.

---

# 158. Regla ARCH-004

Las rutas no implementan reglas de negocio.

---

# 159. Regla ARCH-005

React nunca accede directamente a PostgreSQL.

---

# 160. Simplicidad antes que patrón

No introduciremos inicialmente:

```text
CQRS
Event Sourcing
Microservices
Clean Architecture completa
Hexagonal con múltiples adapters
Domain Events
Message Broker
```

---

# 161. Motivo

No aportan valor al problema actual y dificultarían la enseñanza desde cero.

---

# 162. Arquitectura suficiente

Nuestro patrón:

```text
Route
Controller
Service
Repository
Database
```

es suficiente para enseñar:

```text
separación de responsabilidades
dependencias
reglas de negocio
persistencia
```

---

# 163. README raíz

Debe explicar:

```text
qué es el proyecto
stack
requisitos
cómo instalar
cómo configurar
cómo ejecutar
cómo correr migraciones
cómo crear primer ADMIN
cómo ejecutar tests
```

---

# 164. README backend

Puede explicar específicamente:

```text
estructura de capas
variables de entorno
migraciones
scripts
```

---

# 165. README frontend

Puede explicar:

```text
estructura React
temas
rutas
API
```

---

# 166. Documentación viva

Cuando una decisión cambie:

```text
spec
+
código
+
README relevante
```

deberán mantenerse coherentes.

---

# 167. No documentar algo inexistente como implementado

Una SPEC puede definir algo futuro.

El README de implementación deberá distinguir:

```text
planificado
implementado
```

---

# 168. Orden recomendado de implementación

Después de congelar las especificaciones:

```text
1. Inicializar Git
2. Crear estructura del repositorio
3. Backend base
4. Configuración
5. PostgreSQL
6. Migraciones
7. Primer ADMIN
8. Autenticación
9. Usuarios
10. Lecturas
11. Estadísticas
12. Frontend base
13. Login
14. Layout
15. Dashboard
16. Registro de lectura
17. Historial
18. Perfil/tema
19. Administración usuarios
20. Responsive
21. Accesibilidad
22. E2E
```

---

# 169. No crear todo de golpe

El objetivo educativo será trabajar en verticales pequeñas.

Ejemplo:

```text
Login SPEC
↓
backend login
↓
test login
↓
frontend login
↓
probar flujo completo
```

antes de saltar a diez módulos a medias.

---

# 170. Estrategia de vertical slices

Podremos construir en bloques como:

### Bloque A

```text
Infraestructura + DB
```

### Bloque B

```text
Autenticación completa
```

### Bloque C

```text
Lecturas
```

### Bloque D

```text
Estadísticas
```

### Bloque E

```text
UI principal
```

### Bloque F

```text
Administración
```

---

# 171. Git

Desde el primer día se utilizará:

```text
Git
```

---

# 172. Commits

Los commits deberán representar cambios coherentes.

Ejemplos:

```text
chore: inicializar estructura del proyecto

feat: crear migración inicial

feat: implementar login

feat: registrar lecturas

test: cubrir reglas de lectura
```

---

# 173. Evitar commits gigantes

No hacer:

```text
feat: terminar toda la aplicación
```

con 200 archivos.

---

# 174. Branch inicial

Para el proyecto educativo puede utilizarse:

```text
main
```

y ramas por funcionalidad cuando los estudiantes ya comprendan Git.

---

# 175. Formato de código

Utilizaremos una configuración consistente.

Podremos incorporar:

```text
ESLint
Prettier
```

o equivalente.

---

# 176. Objetivo

Evitar discusiones constantes sobre:

```text
comillas
indentación
punto y coma
espacios
```

y concentrarnos en arquitectura.

---

# 177. No convertir lint en objetivo principal

El lint ayuda al proyecto.

No sustituye:

```text
buen diseño
buenas pruebas
reglas correctas
```

---

# 178. Dependencias backend previstas

Conceptualmente:

```text
express
pg
bcrypt
jsonwebtoken
cors
helmet
```

y herramientas de validación/rate limit según implementación.

---

# 179. Dependencias frontend previstas

Conceptualmente:

```text
react
react-dom
react-router
recharts
```

más la solución HTTP elegida.

---

# 180. Axios vs fetch

Ambos son válidos.

Por simplicidad podemos utilizar:

```text
Axios
```

porque facilita:

```text
baseURL
interceptores
credentials
coordinación de refresh
```

---

# 181. Decisión inicial

Utilizaremos:

```text
Axios
```

durante el MVP.

---

# 182. No acoplar toda la UI a Axios

Solo:

```text
api/
```

deberá conocer directamente detalles de Axios.

---

# 183. Estado global

No utilizaremos inicialmente:

```text
Redux
Zustand
MobX
```

porque el volumen de estado global es pequeño.

---

# 184. Estado global necesario

Principalmente:

```text
auth
tema
```

puede manejarse con Context.

---

# 185. Estado de servidor

Lecturas y estadísticas podrán cargarse desde sus páginas.

No necesitamos una librería de cache avanzada inicialmente.

---

# 186. Evolución futura

Más adelante podrá enseñarse:

```text
TanStack Query
```

como optimización de manejo de estado servidor.

No entra en el MVP inicial.

---

# 187. Diagrama completo

```text
┌────────────────────────────────────────────┐
│                  React                     │
│                                            │
│ Pages                                      │
│ Components                                 │
│ Contexts                                   │
│ API modules                                │
└──────────────────┬─────────────────────────┘
                   │ HTTP REST
                   ▼
┌────────────────────────────────────────────┐
│                 Express                    │
│                                            │
│ Routes                                     │
│ Middlewares                                │
│ Controllers                                │
│ Services                                   │
│ Repositories                               │
└──────────────────┬─────────────────────────┘
                   │ pg
                   ▼
┌────────────────────────────────────────────┐
│               PostgreSQL                   │
│                                            │
│ usuarios                                   │
│ sesiones                                   │
│ medidores                                  │
│ lecturas_medidor                           │
│ schema_migrations                          │
└────────────────────────────────────────────┘
```

---

# 188. Estructura final conceptual

```text
control-consumo-electrico/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── errors/
│   │   ├── middlewares/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── database/
│   │   ├── migrations/
│   │   └── seeds/
│   │
│   ├── scripts/
│   ├── tests/
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── styles/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── tests/
│   ├── .env.example
│   └── package.json
│
├── docs/
│   └── specs/
│
├── .gitignore
├── package.json
└── README.md
```

---

# 189. Invariantes de arquitectura

### ARCH-INV-001

React nunca accede directamente a PostgreSQL.

### ARCH-INV-002

Las rutas backend no contienen SQL.

### ARCH-INV-003

Los controladores no contienen reglas complejas de negocio.

### ARCH-INV-004

Los servicios contienen la coordinación de negocio.

### ARCH-INV-005

Los repositorios contienen acceso SQL.

### ARCH-INV-006

Las consultas SQL utilizan parámetros.

### ARCH-INV-007

La configuración se centraliza.

### ARCH-INV-008

Los secretos no están en el código.

### ARCH-INV-009

Las migraciones son incrementales e inmutables una vez compartidas.

### ARCH-INV-010

Los seeds no contienen credenciales reales.

### ARCH-INV-011

El primer ADMIN se crea mediante script seguro.

### ARCH-INV-012

Frontend y backend mantienen responsabilidades independientes.

### ARCH-INV-013

Las páginas React no deberán comunicarse directamente con PostgreSQL ni conocer SQL.

### ARCH-INV-014

El cliente HTTP se centraliza.

### ARCH-INV-015

Solo autenticación y tema requieren estado global inicial.

### ARCH-INV-016

No se introduce infraestructura compleja sin una necesidad real.

### ARCH-INV-017

Las pruebas utilizan una base de datos separada.

### ARCH-INV-018

La documentación debe distinguir lo diseñado de lo implementado.

---

# 190. Decisiones congeladas por SPEC-011

1. Un solo repositorio.
2. Carpetas `backend`, `frontend` y `docs`.
3. Sin herramientas complejas de monorepo.
4. Backend Node.js + Express.
5. Frontend React + Vite.
6. PostgreSQL mediante `pg`.
7. Sin ORM.
8. JavaScript moderno.
9. ES Modules.
10. Arquitectura backend Route → Controller → Service → Repository → DB.
11. Controladores delgados.
12. Servicios contienen negocio.
13. Repositorios contienen SQL.
14. Configuración centralizada.
15. Pool PostgreSQL único.
16. Migraciones SQL incrementales.
17. Nueva tabla técnica `schema_migrations`.
18. Seeds separados.
19. Primer ADMIN mediante script.
20. Frontend organizado por páginas, componentes, layouts, contexts y API.
21. Context únicamente para estado global necesario.
22. AuthContext.
23. ThemeContext.
24. Axios como cliente HTTP inicial.
25. Cliente HTTP centralizado.
26. Sin Redux durante el MVP.
27. Sin TanStack Query durante el MVP.
28. Recharts para gráficos.
29. CSS moderno + CSS Modules/organización equivalente.
30. Tests backend con Vitest + Supertest.
31. Tests frontend con Vitest + React Testing Library.
32. E2E posteriores con Playwright.
33. Base de pruebas separada.
34. Git desde el inicio.
35. Commits pequeños y coherentes.
36. ESLint/Prettier o equivalente para consistencia.
37. No microservicios.
38. No CQRS.
39. No Event Sourcing.
40. No arquitectura compleja sin necesidad.

---

# 191. Criterio de finalización de SPEC-011

Un aprendiz deberá poder explicar:

1. ¿Por qué separamos frontend y backend?
2. ¿Qué responsabilidad tiene una ruta?
3. ¿Qué responsabilidad tiene un controlador?
4. ¿Qué responsabilidad tiene un servicio?
5. ¿Qué responsabilidad tiene un repositorio?
6. ¿Dónde vive el SQL?
7. ¿Dónde viven las reglas de negocio?
8. ¿Por qué `server.js` y `app.js` están separados?
9. ¿Para qué sirve el pool PostgreSQL?
10. ¿Qué es una migración?
11. ¿Qué es un seed?
12. ¿Por qué no editamos migraciones antiguas?
13. ¿Para qué sirve `schema_migrations`?
14. ¿Por qué el primer ADMIN no es un seed SQL?
15. ¿Qué hace `AuthContext`?
16. ¿Qué hace `ThemeContext`?
17. ¿Por qué centralizamos las peticiones HTTP?
18. ¿Por qué React no debe conocer SQL?
19. ¿Por qué no necesitamos Redux?
20. ¿Por qué no utilizamos ORM?
21. ¿Por qué comenzamos con JavaScript?
22. ¿Qué diferencia existe entre prueba unitaria, integración y E2E?
23. ¿Por qué los tests necesitan otra base de datos?
24. ¿Qué significa flujo de dependencias?
25. ¿Por qué evitamos microservicios en este proyecto?
26. ¿Cómo se relacionan las SPEC con los archivos del proyecto?

Cuando estas respuestas estén claras, `SPEC-011` queda definida.
