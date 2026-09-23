# CHECKPOINT 3 — Autenticación, sesiones y primer administrador

## 1. Objetivo

Implementar completamente la autenticación definida en `SPEC-003`.

Al finalizar este checkpoint tendremos:

* primer ADMIN creado de forma segura;
* contraseñas protegidas con bcrypt;
* login mediante correo y contraseña;
* Access Token JWT;
* Refresh Token opaco;
* hash SHA-256 del Refresh Token en PostgreSQL;
* cookie HttpOnly;
* rotación de Refresh Token;
* logout real;
* sesiones revocables;
* `GET /api/auth/me`;
* cambio de contraseña propia;
* middleware `autenticar`;
* middleware `requerirRol`;
* comprobación de usuario activo;
* comprobación de sesión activa;
* rate limit específico de login;
* pruebas unitarias, integración y API.

Todavía NO implementaremos:

```text
CRUD administrativo completo de usuarios
lecturas
estadísticas
dashboard
frontend de login
```

---

# 2. Precondiciones

Deben estar cerrados:

```text
CHECKPOINT 0 → CERRADO
CHECKPOINT 1 → CERRADO
CHECKPOINT 2 → CERRADO
```

Debe funcionar:

```bash
npm run db:check
npm run db:status
npm run lint
npm test
```

---

# 3. SPEC relacionadas

Principalmente:

```text
SPEC-003 → Usuarios, autenticación y roles
SPEC-010 → Seguridad
SPEC-011 → Arquitectura
SPEC-012 → Pruebas
```

---

# 4. Arquitectura de autenticación

```text
Cliente
   │
   │ correo + contraseña
   ▼
POST /api/auth/login
   │
   ▼
AuthController
   │
   ▼
AuthService
   │
   ├── UsuarioRepository
   ├── bcrypt
   ├── SesionRepository
   ├── JWT
   └── crypto
          │
          ▼
      PostgreSQL
```

---

# 5. Dependencias nuevas

Desde:

```text
backend/
```

instalar:

```bash
npm install bcrypt jsonwebtoken
```

Node ya proporciona:

```text
node:crypto
```

por lo que no necesitamos una dependencia adicional para:

```text
randomBytes
createHash
```

---

# 6. Dependencias resultantes relevantes

```text
express
pg
dotenv
cors
helmet
express-rate-limit
zod
bcrypt
jsonwebtoken
```

---

# 7. Configuración JWT

Ahora sí:

```text
JWT_SECRET
```

se vuelve obligatorio.

Actualizar:

```text
backend/src/config/env.js
```

---

# 8. Variables obligatorias

```text
JWT_SECRET
JWT_ACCESS_EXPIRES_IN
REFRESH_TOKEN_DAYS
```

Valores iniciales:

```text
JWT_ACCESS_EXPIRES_IN=15m
REFRESH_TOKEN_DAYS=7
```

---

# 9. JWT_SECRET

Debe ser:

```text
aleatorio
largo
privado
```

No utilizar:

```text
123456
secret
mi_clave
```

---

# 10. Desarrollo local

Puede generarse un secreto utilizando Node:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

El resultado se guarda únicamente en:

```text
backend/.env
```

Nunca en documentación ni Git.

---

# 11. `.env.example`

Mantendrá:

```text
JWT_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
REFRESH_TOKEN_DAYS=7
```

sin un secreto real.

---

# 12. Contraseñas

Utilizaremos:

```text
bcrypt
```

---

# 13. Cost factor

Configuración inicial:

```text
12
```

Podemos centralizar:

```text
BCRYPT_ROUNDS=12
```

o mantenerlo como constante interna.

---

# 14. Decisión

Para hacer visible la configuración:

```text
BCRYPT_ROUNDS=12
```

se añadirá al entorno.

---

# 15. Validación

Debe ser:

```text
entero
entre un rango razonable
```

Por ejemplo:

```text
10–15
```

durante el proyecto.

---

# 16. Regla de contraseña

Debe cumplir:

```text
mínimo 8 caracteres
máximo 72 bytes UTF-8
```

como definió SPEC-010.

---

# 17. Helper de contraseña

Crear:

```text
backend/src/utils/password.js
```

Responsabilidades:

```text
validar longitud segura
generar hash
comparar contraseña
```

---

# 18. Conceptualmente

```javascript
export async function hashPassword(password) {
    validarPassword(password);

    return bcrypt.hash(
        password,
        env.bcryptRounds
    );
}
```

---

# 19. Comparación

```javascript
export async function verifyPassword(
    password,
    hash
) {
    return bcrypt.compare(
        password,
        hash
    );
}
```

---

# 20. No registrar contraseña

Nunca:

```javascript
console.log(password);
```

---

# 21. Refresh Token

No será JWT.

Será:

```text
token opaco
aleatorio
criptográficamente seguro
```

---

# 22. Generación

Crear:

```text
backend/src/utils/tokens.js
```

Utilizar:

```javascript
randomBytes(64)
```

---

# 23. Token original

Conceptualmente:

```text
64 bytes aleatorios
↓
hex/base64url
↓
Refresh Token
```

---

# 24. Hash

Antes de almacenar:

```text
SHA-256
```

---

# 25. Función conceptual

```javascript
export function hashRefreshToken(token) {
    return createHash('sha256')
        .update(token)
        .digest('hex');
}
```

---

# 26. PostgreSQL

Guardaremos:

```text
token_hash
```

Nunca:

```text
token original
```

---

# 27. Access Token

Será JWT firmado.

Crear:

```text
backend/src/utils/jwt.js
```

---

# 28. Payload

```json
{
  "sub": "2",
  "sid": "15",
  "rol": "USUARIO"
}
```

---

# 29. Campos

```text
sub → idUsuario
sid → idSesion
rol → rol actual al emitir
```

---

# 30. Claims automáticos

JWT incluirá:

```text
iat
exp
```

---

# 31. Firmado

Conceptualmente:

```javascript
jwt.sign(
    payload,
    env.jwtSecret,
    {
        expiresIn:
            env.jwtAccessExpiresIn
    }
);
```

---

# 32. Verificación

```javascript
jwt.verify(
    token,
    env.jwtSecret
);
```

---

# 33. No confiar únicamente en rol del JWT

Aunque el token contiene:

```text
rol
```

el middleware también comprobará:

```text
usuario actual
sesión actual
estado actual
```

---

# 34. Repositorio de usuarios

Crear:

```text
backend/src/repositories/usuarios.repository.js
```

Operaciones iniciales:

```text
buscarPorCorreo
buscarPorId
crear
actualizarPassword
```

---

# 35. Buscar por correo

Debe respetar normalización:

```text
LOWER(BTRIM(correo))
```

---

# 36. No retornar columnas innecesarias

Para login sí necesitamos:

```text
password_hash
```

internamente.

Pero esa fila jamás se serializa directamente.

---

# 37. Repositorio de sesiones

Crear:

```text
backend/src/repositories/sesiones.repository.js
```

Operaciones:

```text
crear
buscarPorTokenHash
buscarPorId
rotarToken
revocar
revocarTodasUsuario
actualizarUltimoUso
```

---

# 38. Sesión activa

Una sesión es válida si:

```text
revocada_en IS NULL
AND expira_en > CURRENT_TIMESTAMP
```

---

# 39. Crear primer ADMIN

Implementar:

```text
backend/scripts/crear-admin.js
```

---

# 40. Ejecución

```bash
npm run crear-admin
```

---

# 41. Entrada

Solicitar:

```text
Nombre
Correo
Contraseña
```

---

# 42. Password oculta

Idealmente la contraseña no deberá mostrarse en pantalla mientras se escribe.

Si hacerlo complica excesivamente el script inicial, como mínimo:

```text
no imprimirla después
no guardarla en logs
```

---

# 43. Validaciones

El script deberá validar:

```text
nombre
correo
password
```

utilizando las mismas reglas del backend.

---

# 44. Correo normalizado

Ejemplo:

```text
 Admin@Casa.Local 
```

se guarda como:

```text
admin@casa.local
```

---

# 45. Rol fijo

El script crea:

```text
rol = ADMIN
estado = ACTIVO
tema = SISTEMA
```

---

# 46. No aceptar rol como input

No necesitamos preguntar:

```text
¿Qué rol desea?
```

El propósito del script es explícito:

```text
crear primer administrador
```

---

# 47. Evitar administradores iniciales duplicados

Si ya existe un usuario con ese correo:

```text
error controlado
```

---

# 48. Regla recomendada

El script puede permitir crear un nuevo ADMIN incluso si ya existe otro, pero debe dejar claro que:

```text
es una herramienta administrativa local
```

No es registro público.

---

# 49. Script npm

```json
"crear-admin": "node scripts/crear-admin.js"
```

---

# 50. Login

Endpoint:

```http
POST /api/auth/login
```

---

# 51. Ruta

Crear:

```text
backend/src/routes/auth.routes.js
```

---

# 52. Controlador

Crear:

```text
backend/src/controllers/auth.controller.js
```

---

# 53. Servicio

Crear:

```text
backend/src/services/auth.service.js
```

---

# 54. Validator

Crear:

```text
backend/src/validators/auth.validators.js
```

---

# 55. Login schema

Entrada:

```json
{
  "correo": "usuario@correo.com",
  "password": "MiClave"
}
```

---

# 56. Validaciones estructurales

```text
correo → string + email
password → string
```

No verificar contraseña mediante Zod contra PostgreSQL.

---

# 57. Rate limit login

Crear limitador específico:

```text
5 intentos / 15 minutos
```

---

# 58. Ruta conceptual

```text
POST /auth/login
↓
loginRateLimit
↓
validar body
↓
controller
↓
service
```

---

# 59. Flujo del servicio

```text
normalizar correo
↓
buscar usuario
↓
comparar contraseña
↓
comprobar estado ACTIVO
↓
generar Refresh Token
↓
hash Refresh Token
↓
crear sesión
↓
generar JWT
↓
retornar
```

---

# 60. Credenciales inválidas

Si:

```text
correo no existe
```

o:

```text
password incorrecta
```

mismo error:

```text
AUTH_CREDENCIALES_INVALIDAS
```

---

# 61. HTTP

```text
401 Unauthorized
```

---

# 62. Respuesta

```json
{
  "error": {
    "codigo":
      "AUTH_CREDENCIALES_INVALIDAS",
    "mensaje":
      "Correo o contraseña incorrectos.",
    "requestId": "..."
  }
}
```

---

# 63. No enumeración

No responder:

```text
“El correo existe.”
```

o:

```text
“La contraseña está incorrecta.”
```

por separado.

---

# 64. Usuario inactivo

Si contraseña es correcta pero:

```text
estado = INACTIVO
```

responder:

```text
403
AUTH_USUARIO_INACTIVO
```

---

# 65. Crear sesión

Duración:

```text
7 días
```

---

# 66. `expira_en`

Se calcula desde:

```text
fecha actual + REFRESH_TOKEN_DAYS
```

---

# 67. Cookie

Nombre recomendado:

```text
refresh_token
```

---

# 68. Configuración

```text
HttpOnly = true
SameSite = Strict
Path = /api/auth
```

---

# 69. Secure

```text
development → false
production  → true
test        → false
```

---

# 70. MaxAge

Debe corresponder aproximadamente con:

```text
REFRESH_TOKEN_DAYS
```

---

# 71. No devolver refresh en JSON

Incorrecto:

```json
{
  "refreshToken": "..."
}
```

Correcto:

```text
cookie HttpOnly
```

---

# 72. Respuesta login

```json
{
  "usuario": {
    "idUsuario": 1,
    "nombre": "Administrador",
    "correo": "admin@casa.local",
    "rol": "ADMIN",
    "tema": "SISTEMA"
  },
  "accessToken": "eyJ...",
  "expiresIn": 900
}
```

---

# 73. `expiresIn`

Preferimos devolver:

```text
segundos
```

Ejemplo:

```text
900
```

---

# 74. Configuración central de cookies

Crear opcionalmente:

```text
backend/src/config/cookies.js
```

para no duplicar opciones entre:

```text
login
refresh
logout
```

---

# 75. Refresh

Endpoint:

```http
POST /api/auth/refresh
```

---

# 76. Middleware Origin

Esta ruta utilizará:

```text
validarOrigin
```

porque depende de cookie.

---

# 77. Flujo

```text
leer refresh_token cookie
↓
SHA-256
↓
buscar sesión
↓
validar no revocada
↓
validar no expirada
↓
buscar usuario
↓
validar ACTIVO
↓
generar nuevo Refresh Token
↓
generar nuevo hash
↓
rotar token en misma sesión
↓
actualizar ultimo_uso_en
↓
generar nuevo JWT
↓
establecer nueva cookie
```

---

# 78. Necesitamos parser de cookies

Express no interpreta cookies automáticamente.

Instalar:

```bash
npm install cookie-parser
```

---

# 79. `app.js`

Agregar:

```javascript
app.use(cookieParser());
```

antes de las rutas.

---

# 80. No loggear cookies

El logger global continúa sin imprimirlas.

---

# 81. Refresh sin cookie

Respuesta:

```text
401
AUTH_SESION_INVALIDA
```

---

# 82. Refresh hash inexistente

Igual:

```text
401
AUTH_SESION_INVALIDA
```

---

# 83. Refresh revocado

Igual:

```text
401
AUTH_SESION_INVALIDA
```

---

# 84. Refresh expirado

Igual:

```text
401
AUTH_SESION_INVALIDA
```

---

# 85. Rotación

Refresh A:

```text
A
```

se usa.

Se genera:

```text
B
```

PostgreSQL pasa de:

```text
hash(A)
```

a:

```text
hash(B)
```

---

# 86. Token A después

No vuelve a funcionar.

---

# 87. ¿Nueva sesión en cada refresh?

No.

Mantendremos:

```text
mismo id_sesion
```

y rotaremos:

```text
token_hash
```

---

# 88. Beneficio

El JWT conserva:

```text
sid
```

estable durante la sesión lógica.

---

# 89. Refresh transaccional

La rotación debe ejecutarse dentro de una transacción.

Objetivo:

```text
validar token actual
↓
reemplazarlo
```

de forma atómica.

---

# 90. Concurrencia de refresh

Dos peticiones simultáneas con el mismo Refresh Token:

```text
A
A
```

No queremos que ambas generen tokens válidos.

---

# 91. Estrategia

Bloquear la fila de sesión:

```sql
SELECT ...
FROM sesiones
WHERE token_hash = $1
FOR UPDATE;
```

---

# 92. Resultado

Primera petición:

```text
A → B
COMMIT
```

Segunda:

```text
espera
↓
vuelve a validar
↓
A ya no existe
↓
401
```

---

# 93. Esto complementa frontend

SPEC-010 indicó que React deberá evitar múltiples refresh simultáneos.

Pero backend también debe permanecer consistente.

---

# 94. Logout

Endpoint:

```http
POST /api/auth/logout
```

---

# 95. Origin

También:

```text
validarOrigin
```

---

# 96. Flujo

```text
leer cookie
↓
si existe token:
    hash
    localizar sesión
    revocar
↓
limpiar cookie
↓
204
```

---

# 97. Logout tolerante

Si la cookie:

```text
no existe
```

o ya es inválida:

```text
la operación puede continuar
```

y responder:

```text
204
```

---

# 98. Motivo

Logout debe ser:

```text
idempotente desde perspectiva del cliente
```

---

# 99. Cookie eliminada

Utilizar las mismas opciones:

```text
Path
SameSite
Secure
```

que al crearla.

---

# 100. `/auth/me`

Endpoint:

```http
GET /api/auth/me
```

requiere:

```text
Authorization: Bearer <token>
```

---

# 101. Middleware autenticar

Crear:

```text
backend/src/middlewares/auth.middleware.js
```

---

# 102. Flujo

```text
obtener Authorization
↓
comprobar Bearer
↓
verificar JWT
↓
obtener sub
↓
obtener sid
↓
buscar usuario
↓
validar ACTIVO
↓
buscar sesión
↓
validar sesión activa
↓
req.usuario
↓
next
```

---

# 103. Sesión activa

Debe cumplir:

```text
revocada_en IS NULL
expira_en > ahora
id_usuario coincide
```

---

# 104. `req.usuario`

Conceptualmente:

```javascript
req.usuario = {
    idUsuario: 1,
    nombre: 'Administrador',
    correo: 'admin@casa.local',
    rol: 'ADMIN',
    tema: 'SISTEMA',
    idSesion: 4,
};
```

---

# 105. No incluir password hash

Nunca.

---

# 106. Authorization ausente

```text
401
AUTH_TOKEN_AUSENTE
```

---

# 107. Formato incorrecto

```text
Authorization: Basic ...
```

respuesta:

```text
401
AUTH_TOKEN_INVALIDO
```

---

# 108. JWT inválido

```text
401
AUTH_TOKEN_INVALIDO
```

---

# 109. JWT expirado

```text
401
AUTH_TOKEN_EXPIRADO
```

---

# 110. Sesión revocada

```text
401
AUTH_SESION_INVALIDA
```

---

# 111. Usuario inactivo después del login

Ejemplo:

```text
20:00 inicia sesión
20:05 ADMIN lo desactiva
```

La siguiente petición protegida debe fallar.

---

# 112. Respuesta

```text
403
AUTH_USUARIO_INACTIVO
```

o sesión inválida según la política elegida.

---

# 113. Decisión

Utilizaremos:

```text
AUTH_USUARIO_INACTIVO
```

porque describe el estado real.

Las sesiones serán además revocadas cuando se implemente la desactivación en CHECKPOINT 4.

---

# 114. `/auth/me` respuesta

```json
{
  "idUsuario": 1,
  "nombre": "Administrador",
  "correo": "admin@casa.local",
  "rol": "ADMIN",
  "estado": "ACTIVO",
  "tema": "SISTEMA"
}
```

---

# 115. Middleware de roles

Crear:

```text
backend/src/middlewares/roles.middleware.js
```

---

# 116. API

Conceptualmente:

```javascript
requerirRol('ADMIN')
```

---

# 117. Flujo

```text
req.usuario
↓
¿rol permitido?
↓
sí → next
no → 403
```

---

# 118. Error

```text
AUTH_SIN_PERMISO
```

---

# 119. Ruta de prueba real

No crearemos:

```text
/api/admin/test
```

solo para probar roles.

Los tests podrán montar una app/router temporal o esperar CHECKPOINT 4.

---

# 120. Pero middleware sí tendrá unit tests

Probar:

```text
ADMIN permitido
USUARIO rechazado
sin usuario rechazado
```

---

# 121. Cambiar contraseña propia

Endpoint:

```http
PATCH /api/auth/password
```

requiere:

```text
autenticar
```

---

# 122. Entrada

```json
{
  "passwordActual": "Actual123",
  "passwordNueva": "NuevaClave123"
}
```

---

# 123. Validator

Debe comprobar:

```text
passwordActual string
passwordNueva válida
```

---

# 124. Flujo

```text
obtener usuario real
↓
comparar passwordActual
↓
validar passwordNueva
↓
hash nueva
↓
actualizar usuario
↓
revocar todas sus sesiones
↓
limpiar cookie
↓
204 o respuesta controlada
```

---

# 125. Decisión de respuesta

Usaremos:

```text
204 No Content
```

y el frontend deberá volver al login.

---

# 126. Sesión actual

También queda revocada.

Esto está definido en SPEC-003.

---

# 127. Motivo

Mantiene el comportamiento simple:

```text
cambio contraseña
→ todas las sesiones cerradas
→ login nuevamente
```

---

# 128. Contraseña actual incorrecta

```text
401
AUTH_CREDENCIALES_INVALIDAS
```

Podemos usar un código más específico internamente, pero no es necesario.

---

# 129. Cambiar tema

SPEC-003 definió:

```http
PATCH /api/auth/tema
```

¿Lo implementamos aquí?

Sí.

Aunque es una preferencia de perfil, el endpoint pertenece a identidad y es muy pequeño.

---

# 130. Entrada

```json
{
  "tema": "OSCURO"
}
```

---

# 131. Valores

```text
SISTEMA
CLARO
OSCURO
```

---

# 132. Repositorio

Agregar:

```text
actualizarTema
```

a usuarios.

---

# 133. Respuesta

```json
{
  "tema": "OSCURO"
}
```

---

# 134. No revocar sesiones

Cambiar tema:

```text
NO cambia permisos
NO cambia seguridad
```

por tanto sesiones permanecen activas.

---

# 135. Router auth

Al terminar:

```text
POST  /api/auth/login
POST  /api/auth/refresh
POST  /api/auth/logout
GET   /api/auth/me
PATCH /api/auth/password
PATCH /api/auth/tema
```

---

# 136. Protección de rutas

```text
/login
→ pública + rate limit

/refresh
→ cookie + origin

/logout
→ cookie/origin + tolerante

/me
→ JWT

/password
→ JWT

/tema
→ JWT
```

---

# 137. Códigos de error nuevos

Añadir:

```text
AUTH_CREDENCIALES_INVALIDAS
AUTH_USUARIO_INACTIVO
AUTH_TOKEN_AUSENTE
AUTH_TOKEN_INVALIDO
AUTH_TOKEN_EXPIRADO
AUTH_SESION_INVALIDA
AUTH_SIN_PERMISO

USUARIO_PASSWORD_INVALIDO
USUARIO_CORREO_DUPLICADO
```

---

# 138. Reutilización

No crear strings sueltos como:

```javascript
'auth_invalid'
```

dispersos.

Usar:

```text
error-codes.js
```

---

# 139. Seguridad de tiempos de login

Para correo inexistente, comparar contraseña directamente no es posible.

Existe un pequeño riesgo de diferencia temporal.

Durante el MVP podemos utilizar un:

```text
hash bcrypt dummy
```

precalculado para realizar una comparación incluso cuando el correo no existe.

---

# 140. Motivo

Hace menos evidente:

```text
correo existe
vs
correo no existe
```

por tiempo de respuesta.

---

# 141. ¿Es obligatorio?

Para un MVP local de dos usuarios no es crítico, pero es una buena práctica educativa.

Decisión:

```text
SÍ implementarlo
```

sin exagerar complejidad.

---

# 142. Dummy hash

Debe generarse una sola vez o mantenerse como constante de hash no secreto.

No debe corresponder a una contraseña real utilizada por usuarios.

---

# 143. Login rate limit

Configuración:

```text
5 intentos
15 minutos
```

---

# 144. Respuesta

```text
429
RATE_LIMIT_EXCEDIDO
```

---

# 145. Keying

Inicialmente por:

```text
IP
```

No necesitamos construir un sistema avanzado por correo + IP.

---

# 146. Tests y rate limit

En tests específicos podremos configurar una app aislada o limpiar el store entre casos.

---

# 147. No bloquear pruebas completas

El resto de tests no debería consumir accidentalmente los cinco intentos de la misma instancia.

---

# 148. Sesiones simultáneas

SPEC-003 permite más de una sesión.

Por tanto:

```text
PC
teléfono
```

pueden tener sesiones distintas.

---

# 149. Cada login

Crea:

```text
nueva fila sesiones
```

---

# 150. Logout

Revoca:

```text
solo la sesión actual asociada al refresh token
```

---

# 151. Cambio de password

Revoca:

```text
todas las sesiones del usuario
```

---

# 152. Revocar todas

Repositorio:

```text
revocarTodasUsuario(idUsuario)
```

---

# 153. Sesiones expiradas

No es obligatorio eliminarlas físicamente durante el MVP.

Pueden permanecer como historial técnico.

---

# 154. Limpieza futura

Más adelante podría existir un job:

```text
eliminar sesiones expiradas antiguas
```

pero no entra aquí.

---

# 155. Refresh Token reutilizado

Después de rotación, token viejo simplemente:

```text
no encuentra sesión por hash
```

y responde:

```text
401
```

---

# 156. Detección avanzada de reuse

No implementaremos todavía:

```text
familias de tokens
reuse detection con revocación de familia
```

porque sería complejidad excesiva para el MVP.

---

# 157. Cookie parser

`app.js` deberá incluir:

```text
cookie-parser
```

antes de rutas.

---

# 158. CORS

Continúa:

```text
credentials: true
```

---

# 159. Tests de cookie

Supertest deberá comprobar:

```text
Set-Cookie
HttpOnly
SameSite=Strict
Path=/api/auth
```

---

# 160. Secure en tests

Como tests no utilizan HTTPS:

```text
Secure=false
```

---

# 161. Producción

Test unitario/configuración deberá comprobar que:

```text
NODE_ENV=production
→ Secure=true
```

---

# 162. Test del script crear-admin

No necesitamos automatizar la interacción completa de terminal inicialmente.

Pero sí debemos probar la lógica reutilizable que utiliza.

---

# 163. Mejor diseño

El script no debe contener todo el negocio.

Puede llamar a:

```text
usuariosService.crearAdminInicial(...)
```

o una función específica reusable.

---

# 164. Evitar dependencia circular

No reutilizar el servicio administrativo futuro si todavía no existe.

Podemos crear:

```text
auth.service → crearAdminInicial
```

o:

```text
bootstrap.service.js
```

---

# 165. Decisión

Crear:

```text
backend/src/services/bootstrap.service.js
```

con:

```text
crearAdministradorInicial
```

---

# 166. Script

Solo:

```text
lee inputs
↓
llama servicio
↓
muestra resultado
```

---

# 167. Tests de bootstrap

Probar:

```text
crea ADMIN
hash no es password original
correo normalizado
estado ACTIVO
tema SISTEMA
correo duplicado rechazado
```

---

# 168. Tests unitarios password

Probar:

```text
7 caracteres → inválida
8 caracteres → válida
>72 bytes → inválida
Unicode límite → correcto
```

---

# 169. Tests token utils

Probar:

```text
Refresh Token aleatorio
dos tokens distintos
hash SHA-256 64 caracteres
mismo token → mismo hash
tokens distintos → hash distinto
```

---

# 170. Tests JWT

Probar:

```text
firma
verificación
expiración
payload esperado
```

---

# 171. Tests login API

Como mínimo:

```text
login correcto
correo incorrecto
password incorrecta
usuario inactivo
body inválido
rate limit
```

---

# 172. Login correcto

Esperar:

```text
200
accessToken presente
usuario presente
refresh NO en JSON
Set-Cookie presente
```

---

# 173. Password incorrecta

Esperar:

```text
401
AUTH_CREDENCIALES_INVALIDAS
```

---

# 174. Correo inexistente

Misma respuesta.

---

# 175. Usuario inactivo

```text
403
AUTH_USUARIO_INACTIVO
```

---

# 176. Test Refresh

Probar:

```text
cookie válida
```

Esperar:

```text
200
nuevo Access Token
nueva cookie
```

---

# 177. Rotación

Cookie/token anterior debe dejar de funcionar.

---

# 178. Test refresh sin cookie

```text
401
```

---

# 179. Test refresh expirado

Crear sesión expirada en DB.

Esperar:

```text
401
AUTH_SESION_INVALIDA
```

---

# 180. Test refresh revocado

Igual.

---

# 181. Test refresh concurrente

Dos requests simultáneos usando el mismo token.

Esperado:

```text
1 → 200
1 → 401
```

No:

```text
2 → 200
```

---

# 182. Test logout

Después de logout:

```text
204
cookie limpiada
sesión revocada
```

---

# 183. Refresh después de logout

Debe producir:

```text
401
```

---

# 184. Test `/me`

JWT válido:

```text
200
usuario
```

---

# 185. Token ausente

```text
401
AUTH_TOKEN_AUSENTE
```

---

# 186. JWT expirado

```text
401
AUTH_TOKEN_EXPIRADO
```

---

# 187. Sesión revocada con JWT todavía válido

```text
401
AUTH_SESION_INVALIDA
```

---

# 188. Usuario inactivo con JWT válido

```text
403
AUTH_USUARIO_INACTIVO
```

---

# 189. Test cambiar password

Correcta:

```text
204
hash cambia
sesiones revocadas
```

---

# 190. Password anterior

Después:

```text
login con anterior → 401
login con nueva → 200
```

---

# 191. Test tema

```text
SISTEMA → 200
CLARO → 200
OSCURO → 200
INVALIDO → 422
```

---

# 192. Test roles middleware

```text
ADMIN → pasa
USUARIO → 403
```

---

# 193. Base de test

Todos los tests de integración usarán:

```text
consumo_electrico_test
```

---

# 194. Setup

Necesitamos helper:

```text
tests/helpers/db.js
```

para:

```text
limpiar tablas
crear usuarios de prueba
crear sesiones
```

---

# 195. Orden de limpieza

Por FK:

```text
sesiones
lecturas_medidor
usuarios
medidores cuando sea necesario
```

---

# 196. Medidor seed

Las pruebas de autenticación no necesitan eliminar:

```text
Medidor principal
```

constantemente.

---

# 197. No usar datos reales

Fixtures:

```text
admin@test.local
usuario@test.local
```

---

# 198. Passwords de test

Pueden ser conocidas porque:

```text
solo existen en entorno test
```

Ejemplo:

```text
AdminTest123
```

No confundir con credenciales de desarrollo.

---

# 199. Test isolation

Cada suite deberá preparar lo necesario.

No depender de:

```text
“el test anterior ya creó el admin”
```

---

# 200. Integración del router

En:

```text
routes/index.js
```

montar:

```javascript
router.use(
    '/auth',
    authRouter
);
```

---

# 201. Estructura backend después del checkpoint

```text
backend/src/
├── config/
│   ├── env.js
│   ├── cors.js
│   └── cookies.js
│
├── controllers/
│   └── auth.controller.js
│
├── db/
│   ├── pool.js
│   └── transaction.js
│
├── errors/
│   ├── app-error.js
│   └── error-codes.js
│
├── middlewares/
│   ├── auth.middleware.js
│   ├── roles.middleware.js
│   ├── validation.middleware.js
│   ├── origin.middleware.js
│   ├── rate-limit.middleware.js
│   └── ...
│
├── repositories/
│   ├── usuarios.repository.js
│   └── sesiones.repository.js
│
├── routes/
│   ├── auth.routes.js
│   └── index.js
│
├── services/
│   ├── auth.service.js
│   └── bootstrap.service.js
│
├── utils/
│   ├── password.js
│   ├── tokens.js
│   └── jwt.js
│
└── validators/
    └── auth.validators.js
```

---

# 202. No migración nueva

En principio:

```text
NO necesitamos 003
```

porque:

```text
usuarios
sesiones
```

ya existen.

---

# 203. Posible migración solo si encontramos una necesidad real

Si durante implementación descubrimos que la tabla `sesiones` necesita un campo indispensable no especificado, no editamos:

```text
002_sesiones.sql
```

si ya fue aplicada/compartida.

Creamos:

```text
003_...
```

---

# 204. No hacer cambios “porque sería bonito”

Solo migración si:

```text
requisito real
```

lo exige.

---

# 205. Seguridad — secretos

Antes del commit:

```text
buscar
JWT_SECRET
DB_PASSWORD
password reales
tokens
```

en archivos versionados.

---

# 206. Logs

Durante tests/login revisar que no aparezcan:

```text
password
Access Token
Refresh Token
Cookie completa
Authorization completo
```

---

# 207. Health regression

Debe seguir:

```text
GET /api/health → 200
```

---

# 208. DB regression

```bash
npm run db:check
npm run db:status
```

PASS.

---

# 209. Backend gate

Ejecutar:

```bash
npm run lint
npm test
```

PASS.

---

# 210. Coverage

Ejecutar:

```bash
npm run test:coverage
```

No exigimos 100 %, pero revisar especialmente:

```text
auth.service
auth.middleware
tokens
password
```

---

# 211. Frontend regresión

Aunque frontend sigue prácticamente sin funcionalidad:

```bash
cd ../frontend
npm run build
```

PASS.

---

# 212. Smoke test manual

Con backend activo:

```text
1. crear ADMIN
2. login
3. copiar Access Token
4. GET /auth/me
5. refresh
6. logout
7. intentar refresh de nuevo
```

---

# 213. Resultado esperado

```text
crear admin → PASS
login → 200
me → 200
refresh → 200
logout → 204
refresh posterior → 401
```

---

# 214. No usar navegador todavía

Puede probarse con:

```text
Thunder Client
Postman
curl
```

o equivalente.

Frontend de login llegará más adelante.

---

# 215. Nota sobre cookie

Para probar correctamente refresh/logout:

```text
el cliente debe conservar cookies
```

Thunder Client/Postman normalmente puede hacerlo.

---

# 216. Commit

Después de gate verde:

```bash
git add .
git status
```

Revisar.

Luego:

```bash
git commit -m "feat: implementar autenticacion y sesiones"
```

---

# 217. Working tree

```bash
git status
```

Esperado:

```text
nothing to commit, working tree clean
```

---

# 218. Gate CHECKPOINT 3

### CP3-001

bcrypt instalado.

### CP3-002

jsonwebtoken instalado.

### CP3-003

cookie-parser instalado.

### CP3-004

JWT_SECRET obligatorio.

### CP3-005

BCRYPT_ROUNDS configurado.

### CP3-006

Password mínimo 8 caracteres.

### CP3-007

Password máximo 72 bytes UTF-8.

### CP3-008

Contraseñas se almacenan solo como hash.

### CP3-009

Existe `crear-admin`.

### CP3-010

Primer ADMIN queda ACTIVO.

### CP3-011

Primer ADMIN queda con tema SISTEMA.

### CP3-012

Correo se normaliza.

### CP3-013

Login existe.

### CP3-014

Credenciales incorrectas responden 401 uniforme.

### CP3-015

Usuario inactivo responde 403.

### CP3-016

Access Token es JWT firmado.

### CP3-017

JWT contiene `sub`.

### CP3-018

JWT contiene `sid`.

### CP3-019

JWT contiene rol.

### CP3-020

Access Token expira.

### CP3-021

Refresh Token es aleatorio.

### CP3-022

Refresh Token no es JWT.

### CP3-023

DB almacena únicamente SHA-256.

### CP3-024

Hash tiene 64 caracteres.

### CP3-025

Refresh Cookie es HttpOnly.

### CP3-026

SameSite es Strict.

### CP3-027

Path es `/api/auth`.

### CP3-028

Secure depende del entorno.

### CP3-029

Refresh Token no aparece en JSON.

### CP3-030

Existe endpoint refresh.

### CP3-031

Refresh valida Origin.

### CP3-032

Refresh rota token.

### CP3-033

Token anterior queda inválido.

### CP3-034

Rotación es transaccional.

### CP3-035

Rotación protege concurrencia.

### CP3-036

Existe logout.

### CP3-037

Logout revoca sesión.

### CP3-038

Logout limpia cookie.

### CP3-039

Logout tolera sesión ya inválida.

### CP3-040

Existe `/auth/me`.

### CP3-041

Existe middleware `autenticar`.

### CP3-042

Middleware comprueba JWT.

### CP3-043

Middleware comprueba sesión.

### CP3-044

Middleware comprueba usuario ACTIVO.

### CP3-045

Existe `requerirRol`.

### CP3-046

USUARIO puede ser rechazado con 403.

### CP3-047

Existe cambio de contraseña propia.

### CP3-048

Cambio de password revoca todas las sesiones.

### CP3-049

Existe cambio de tema.

### CP3-050

Tema no revoca sesiones.

### CP3-051

Login tiene rate limit 5/15 min.

### CP3-052

No se enumeran correos mediante mensaje de login.

### CP3-053

Logs no contienen passwords.

### CP3-054

Logs no contienen tokens.

### CP3-055

Tests login pasan.

### CP3-056

Tests refresh pasan.

### CP3-057

Test de refresh concurrente pasa.

### CP3-058

Tests logout pasan.

### CP3-059

Tests `/me` pasan.

### CP3-060

Tests de password pasan.

### CP3-061

Tests de tema pasan.

### CP3-062

Tests de rol pasan.

### CP3-063

`npm run lint` pasa.

### CP3-064

`npm test` pasa.

### CP3-065

Frontend build sigue pasando.

### CP3-066

No hay secretos versionados.

### CP3-067

Existe commit del checkpoint.

### CP3-068

Working tree limpio.

---

# 219. Estado de SPEC-003

Después del gate:

```text
SPEC-003
Usuarios, autenticación y roles
→ IMPLEMENTADA
→ PROBADA
```

Todavía evitaremos marcarla:

```text
CERRADA
```

hasta que administración de usuarios de CHECKPOINT 4 complete todas las partes asociadas al rol ADMIN.

---

# 220. SPEC-010

Avanza considerablemente:

```text
cookie Refresh
Origin
rate limit login
JWT
logs
```

pero seguridad global seguirá validándose hasta el gate final.

---

# 221. Estado roadmap

```text
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
Autenticación y sesiones
→ CERRADO

CHECKPOINT 4
Administración de usuarios
→ SIGUIENTE

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

# 222. Qué podremos hacer al cerrar

Por primera vez tendremos este flujo real:

```text
ADMIN creado
   ↓
Login
   ↓
Access Token
   ↓
GET /auth/me
   ↓
Access Token expira
   ↓
Refresh
   ↓
Nuevo Access Token
   ↓
Logout
   ↓
Sesión inválida
```

---

# 223. Qué todavía NO tendremos

```text
ADMIN no puede crear usuarios desde API todavía
no puede listar usuarios
no puede desactivarlos
no existe API de lecturas
no existe dashboard
```

Eso corresponde a los siguientes checkpoints.

---

# 224. Siguiente checkpoint

```text
CHECKPOINT 4
Administración de usuarios
```

Implementará:

```text
GET usuarios
POST usuario
PATCH usuario
activar/desactivar
cambiar rol
restablecer contraseña
revocar sesiones
proteger último ADMIN
búsqueda
filtros
paginación
concurrencia del último administrador
tests
```

---

# 225. Criterio pedagógico

Un aprendiz deberá poder responder:

1. ¿Por qué usamos bcrypt?
2. ¿Por qué una contraseña no se guarda directamente?
3. ¿Qué diferencia existe entre Access Token y Refresh Token?
4. ¿Por qué el Access Token dura poco?
5. ¿Por qué el Refresh Token no es JWT?
6. ¿Por qué guardamos SHA-256 y no el Refresh Token?
7. ¿Qué contiene el JWT?
8. ¿Qué significa `sub`?
9. ¿Qué significa `sid`?
10. ¿Por qué la cookie es HttpOnly?
11. ¿Qué hace SameSite?
12. ¿Cuándo usamos Secure?
13. ¿Cómo funciona el login?
14. ¿Por qué correo inexistente y contraseña incorrecta devuelven el mismo error?
15. ¿Qué es rotación de Refresh Token?
16. ¿Por qué la rotación necesita transacción?
17. ¿Por qué utilizamos `FOR UPDATE` durante refresh concurrente?
18. ¿Qué hace logout realmente?
19. ¿Por qué borrar React no basta para hacer logout?
20. ¿Qué verifica `autenticar`?
21. ¿Por qué el middleware vuelve a consultar usuario y sesión?
22. ¿Qué hace `requerirRol`?
23. ¿Qué ocurre al cambiar la contraseña?
24. ¿Por qué cambiar tema no revoca sesiones?
25. ¿Cómo se crea el primer ADMIN sin registro público?

Cuando todos los `CP3-*` estén verdes:

```text
CHECKPOINT 3 → CERRADO
```
