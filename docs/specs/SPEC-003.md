# SPEC-003 — Usuarios, autenticación y roles

## 1. Objetivo

Definir cómo los usuarios accederán al sistema, cómo se protegerán las contraseñas, cómo se crearán y renovarán las sesiones y cómo se aplicarán los permisos de:

* `ADMIN`
* `USUARIO`

Esta especificación introduce por primera vez el comportamiento de la API relacionado con autenticación.

Tecnologías previstas:

```text
Node.js
Express
PostgreSQL
pg
JWT
bcrypt
```

El frontend será React, pero la seguridad real deberá aplicarse siempre en el backend.

---

# 2. Principios de autenticación

El sistema seguirá estas reglas:

1. No existe registro público.
2. El primer administrador se crea mediante un proceso de inicialización local.
3. Los administradores crean los demás usuarios.
4. Los usuarios inician sesión con correo y contraseña.
5. Las contraseñas nunca se almacenan en texto plano.
6. Se utilizará un Access Token JWT de corta duración.
7. Se utilizará un Refresh Token para renovar la sesión.
8. El Refresh Token no se almacenará en `localStorage`.
9. Cerrar sesión invalidará la sesión correspondiente.
10. Desactivar un usuario invalidará sus sesiones.
11. Cambiar una contraseña invalidará las sesiones existentes.
12. React nunca será responsable de decidir realmente si una operación está autorizada.

---

# 3. Flujo general

```text
Usuario
   │
   │ correo + contraseña
   ▼
POST /api/auth/login
   │
   ▼
Backend valida credenciales
   │
   ├── inválidas → 401
   │
   ▼
Crear sesión
   │
   ├── Access Token JWT
   └── Refresh Token
          │
          ▼
React puede consumir la API
```

Cuando el Access Token expire:

```text
Access Token expirado
        │
        ▼
POST /api/auth/refresh
        │
        ▼
Validar Refresh Token
        │
        ▼
Nuevo Access Token
```

---

# 4. Access Token

El Access Token será un:

```text
JWT
```

Su función será identificar temporalmente una sesión autenticada.

Duración inicial:

```text
15 minutos
```

Este valor será configurable mediante variables de entorno.

---

# 5. Información del JWT

El Access Token contendrá únicamente información necesaria.

Ejemplo conceptual:

```json
{
  "sub": "2",
  "sid": "15",
  "rol": "USUARIO",
  "iat": 1788120000,
  "exp": 1788120900
}
```

Donde:

```text
sub = identificador del usuario
sid = identificador de la sesión
rol = rol del usuario
iat = momento de creación
exp = momento de expiración
```

No se almacenará en el JWT:

* contraseña;
* password hash;
* refresh token;
* información sensible innecesaria.

---

# 6. Firma del JWT

El JWT será firmado por el backend utilizando un secreto.

Conceptualmente:

```text
JWT_SECRET
```

El secreto:

* nunca estará escrito directamente en el código;
* nunca se enviará al frontend;
* nunca se guardará en Git;
* se obtendrá desde variables de entorno.

---

# 7. Refresh Token

El Refresh Token permitirá obtener un nuevo Access Token sin obligar al usuario a iniciar sesión cada 15 minutos.

Duración inicial:

```text
7 días
```

El valor será configurable.

---

# 8. El Refresh Token no necesita ser otro JWT

Para el MVP utilizaremos un token aleatorio criptográficamente seguro.

Ejemplo conceptual:

```text
u3K9....valor aleatorio largo....X91
```

Será generado utilizando:

```text
crypto
```

de Node.js.

Por ejemplo:

```text
64 bytes aleatorios
```

El token enviado al navegador será diferente del valor almacenado en PostgreSQL.

---

# 9. Protección del Refresh Token

Nunca almacenaremos el Refresh Token original en la base de datos.

El backend calculará un hash mediante:

```text
SHA-256
```

Ejemplo conceptual:

```text
Refresh Token
      │
      ▼
SHA-256
      │
      ▼
token_hash
```

La base de datos almacenará únicamente:

```text
token_hash
```

Esto es diferente del tratamiento de las contraseñas.

---

# 10. ¿Por qué bcrypt para contraseñas y SHA-256 para Refresh Tokens?

Una contraseña puede ser débil:

```text
micasa123
```

Por eso necesita una función diseñada específicamente para contraseñas:

```text
bcrypt
```

Un Refresh Token será generado aleatoriamente con alta entropía.

Por ello puede almacenarse utilizando:

```text
SHA-256
```

y además necesitamos poder buscar eficientemente su hash.

---

# 11. Dónde se almacenará el Refresh Token en el navegador

El Refresh Token será enviado mediante una cookie:

```text
HttpOnly
```

Esto significa que JavaScript del frontend no podrá leer directamente su contenido.

Configuración conceptual:

```text
HttpOnly = true
SameSite = Strict
Path = /api/auth
```

En producción:

```text
Secure = true
```

En desarrollo local sobre HTTP:

```text
Secure = false
```

La configuración deberá depender del entorno.

---

# 12. Dónde se almacenará el Access Token

El Access Token se devolverá al frontend.

React lo mantendrá inicialmente:

```text
en memoria
```

No utilizaremos:

```text
localStorage
```

como almacén permanente del token.

Cuando la página se recargue, React podrá intentar recuperar la sesión mediante:

```text
POST /api/auth/refresh
```

---

# 13. Evolución de SPEC-002

SPEC-002 definió inicialmente tres tablas:

```text
usuarios
medidores
lecturas_medidor
```

SPEC-003 introduce una necesidad nueva:

```text
sesiones
```

Por lo tanto, el modelo pasa a tener:

```text
usuarios
medidores
lecturas_medidor
sesiones
```

Esto no es un error del proceso.

Es una evolución natural provocada por una nueva especificación.

En SDD:

> una especificación posterior puede refinar el diseño anterior cuando aparece una necesidad legítima.

---

# 14. Tabla `sesiones`

Estructura:

| Campo         | Tipo        |
| ------------- | ----------- |
| id_sesion     | BIGINT      |
| id_usuario    | BIGINT      |
| token_hash    | VARCHAR(64) |
| expira_en     | TIMESTAMPTZ |
| ultimo_uso_en | TIMESTAMPTZ |
| revocada_en   | TIMESTAMPTZ |
| creada_en     | TIMESTAMPTZ |

---

# 15. `id_sesion`

Será:

```sql
BIGINT GENERATED ALWAYS AS IDENTITY
```

Clave primaria.

---

# 16. `id_usuario`

Relacionará la sesión con:

```text
usuarios.id_usuario
```

Un usuario podrá tener más de una sesión activa.

Ejemplo:

```text
Computadora
Teléfono
```

No estableceremos todavía un límite de dispositivos.

---

# 17. `token_hash`

Contendrá el SHA-256 del Refresh Token.

Tipo:

```sql
VARCHAR(64)
```

cuando se almacene como hexadecimal.

Será único.

---

# 18. `expira_en`

Indica cuándo deja de ser válida la sesión.

Ejemplo conceptual:

```text
30/08/2026 17:00
        ↓
06/09/2026 17:00
```

---

# 19. `ultimo_uso_en`

Permitirá conocer cuándo se utilizó por última vez el Refresh Token.

Inicialmente puede contener:

```text
NULL
```

Después de renovar:

```text
2026-08-31 10:31:25
```

---

# 20. `revocada_en`

Una sesión válida tendrá:

```text
NULL
```

Una sesión cerrada o invalidada tendrá:

```text
fecha y hora de revocación
```

Ejemplo:

```text
2026-08-30 20:15:01
```

No eliminaremos necesariamente la fila inmediatamente.

Esto permite conservar un historial mínimo.

---

# 21. SQL conceptual de `sesiones`

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
        UNIQUE (token_hash)
);
```

---

# 22. Relación actualizada

```text
┌───────────────┐
│   usuarios    │
└───────┬───────┘
        │
        ├────────────────┐
        │                │
        ▼                ▼
┌───────────────┐   ┌───────────────┐
│   sesiones    │   │   lecturas    │
└───────────────┘   └───────┬───────┘
                             │
                             ▼
                       ┌─────────────┐
                       │  medidores  │
                       └─────────────┘
```

---

# 23. Contraseñas

Las contraseñas utilizarán:

```text
bcrypt
```

Nunca se almacenará:

```text
MiClave123
```

Se almacenará algo conceptualmente similar a:

```text
$2b$12$...
```

---

# 24. Factor inicial de bcrypt

Para el proyecto utilizaremos inicialmente:

```text
12 rondas
```

El valor deberá quedar configurable.

Más adelante podrá ajustarse según el rendimiento del equipo.

---

# 25. Política inicial de contraseña

Para mantener el MVP educativo y razonable:

```text
mínimo 8 caracteres
máximo 64 caracteres
```

No exigiremos reglas artificiales como:

```text
1 mayúscula obligatoria
1 símbolo obligatorio
1 número obligatorio
```

El usuario podrá utilizar una contraseña larga.

Ejemplo válido:

```text
Mi casa usa poca energia 2026
```

La seguridad no debe depender únicamente de convertir:

```text
password
```

en:

```text
Password1!
```

---

# 26. Password Hash

La tabla `usuarios` continuará almacenando:

```text
password_hash
```

Nunca:

```text
password
```

La API tampoco deberá devolver:

```text
password_hash
```

en ninguna respuesta.

---

# 27. Creación del primer administrador

Existe un problema inicial:

```text
No hay usuarios
        ↓
No hay ADMIN
        ↓
¿Quién crea el primer ADMIN?
```

No resolveremos esto mediante registro público.

---

# 28. Bootstrap administrativo

El proyecto tendrá un script local.

Ejemplo conceptual:

```text
npm run crear-admin
```

El script solicitará:

```text
Nombre:
Correo:
Contraseña:
```

Después:

```text
validar
   ↓
generar bcrypt hash
   ↓
INSERT usuario
   ↓
rol = ADMIN
   ↓
estado = ACTIVO
```

---

# 29. El script no deberá tener credenciales quemadas

No debemos tener:

```javascript
const correo = "admin@gmail.com";
const password = "123456";
```

dentro del repositorio.

Las credenciales serán introducidas durante la ejecución.

---

# 30. Resultado conceptual

```text
$ npm run crear-admin

Nombre: Administrador
Correo: admin@casa.local
Contraseña: ********

Administrador creado correctamente.
```

Una vez creado el primer administrador ya no necesitaremos registro público.

---

# 31. Login

Endpoint:

```text
POST /api/auth/login
```

Entrada:

```json
{
  "correo": "usuario@correo.com",
  "password": "MiClaveSegura"
}
```

---

# 32. Proceso de login

El backend deberá:

```text
1. validar estructura
2. normalizar correo
3. buscar usuario
4. comprobar estado
5. comparar contraseña con bcrypt
6. crear Refresh Token
7. crear sesión
8. crear Access Token
9. establecer cookie HttpOnly
10. devolver usuario + Access Token
```

---

# 33. Normalización de correo

Antes de buscar:

```text
" Usuario@Correo.com "
```

se transformará a:

```text
usuario@correo.com
```

mediante:

```text
trim
lowercase
```

Esta regla coincide con el índice único definido en SPEC-002.

---

# 34. Login correcto

Respuesta conceptual:

```json
{
  "usuario": {
    "idUsuario": 2,
    "nombre": "Usuario Casa",
    "correo": "usuario@correo.com",
    "rol": "USUARIO",
    "tema": "SISTEMA"
  },
  "accessToken": "eyJ...",
  "expiresIn": 900
}
```

El Refresh Token no aparece en el JSON.

Se entrega mediante cookie HttpOnly.

---

# 35. Credenciales incorrectas

Si:

* el correo no existe;
* o la contraseña es incorrecta;

la respuesta deberá ser la misma.

```http
401 Unauthorized
```

Ejemplo:

```json
{
  "error": {
    "codigo": "AUTH_CREDENCIALES_INVALIDAS",
    "mensaje": "Correo o contraseña incorrectos."
  }
}
```

No debemos revelar:

```text
Ese correo sí existe pero la contraseña está mal.
```

---

# 36. Usuario inactivo

Si las credenciales son correctas pero:

```text
estado = INACTIVO
```

el login será rechazado.

```http
403 Forbidden
```

Ejemplo:

```json
{
  "error": {
    "codigo": "AUTH_USUARIO_INACTIVO",
    "mensaje": "La cuenta se encuentra inactiva."
  }
}
```

---

# 37. Refresh

Endpoint:

```text
POST /api/auth/refresh
```

No necesita recibir el Refresh Token en JSON.

El navegador lo enviará mediante cookie.

---

# 38. Proceso de Refresh

```text
leer cookie
    ↓
calcular SHA-256
    ↓
buscar sesión
    ↓
¿existe?
    ↓
¿no está revocada?
    ↓
¿no expiró?
    ↓
¿usuario sigue activo?
    ↓
generar nuevo Refresh Token
    ↓
reemplazar token_hash
    ↓
actualizar ultimo_uso_en
    ↓
generar nuevo Access Token
```

---

# 39. Rotación del Refresh Token

Cada vez que un Refresh Token sea utilizado:

```text
token antiguo
     ↓
deja de ser válido
     ↓
nuevo token
```

Ejemplo:

```text
REFRESH-A
   ↓ usar
REFRESH-B
```

`REFRESH-A` ya no podrá utilizarse posteriormente.

---

# 40. Respuesta del Refresh

Ejemplo:

```json
{
  "usuario": {
    "idUsuario": 2,
    "nombre": "Usuario Casa",
    "correo": "usuario@correo.com",
    "rol": "USUARIO",
    "tema": "OSCURO"
  },
  "accessToken": "eyJ...",
  "expiresIn": 900
}
```

También se reemplazará la cookie HttpOnly.

---

# 41. Refresh inválido

Si el token:

* no existe;
* expiró;
* fue revocado;
* ya fue rotado;

respuesta:

```http
401 Unauthorized
```

```json
{
  "error": {
    "codigo": "AUTH_SESION_INVALIDA",
    "mensaje": "La sesión no es válida o ha expirado."
  }
}
```

---

# 42. Logout

Endpoint:

```text
POST /api/auth/logout
```

Proceso:

```text
identificar sesión
     ↓
revocada_en = CURRENT_TIMESTAMP
     ↓
eliminar cookie
```

Respuesta:

```http
204 No Content
```

---

# 43. Logout real

Cerrar sesión no consistirá únicamente en que React borre información visual.

El backend deberá marcar la sesión como revocada.

Por tanto:

```text
Refresh Token anterior
```

dejará de funcionar.

---

# 44. Obtener usuario autenticado

Endpoint:

```text
GET /api/auth/me
```

Requiere:

```text
Authorization: Bearer <accessToken>
```

Respuesta:

```json
{
  "idUsuario": 2,
  "nombre": "Usuario Casa",
  "correo": "usuario@correo.com",
  "rol": "USUARIO",
  "estado": "ACTIVO",
  "tema": "SISTEMA"
}
```

Nunca devuelve:

```text
password_hash
```

---

# 45. Middleware de autenticación

Crearemos conceptualmente:

```text
autenticar
```

Responsabilidades:

```text
1. obtener Authorization
2. comprobar Bearer
3. verificar firma JWT
4. verificar expiración
5. obtener sub y sid
6. comprobar usuario
7. comprobar estado ACTIVO
8. comprobar sesión válida
9. adjuntar usuario a la petición
```

---

# 46. Ejemplo conceptual

```javascript
req.usuario = {
    idUsuario: 2,
    rol: "USUARIO"
};
```

Los controladores posteriores podrán utilizar esta información.

---

# 47. ¿Por qué comprobar también el usuario en PostgreSQL?

Supongamos:

```text
16:00 usuario inicia sesión
16:02 ADMIN lo desactiva
```

Su JWT todavía podría tener validez hasta:

```text
16:15
```

Si solo confiáramos en el contenido del JWT, podría continuar utilizando el sistema.

Nuestro middleware comprobará el estado actual.

Así:

```text
estado = INACTIVO
```

produce acceso denegado inmediatamente.

Para este proyecto el pequeño costo de una consulta adicional es irrelevante.

---

# 48. Sesión revocada

El middleware también podrá comprobar:

```text
sid
```

contra la tabla:

```text
sesiones
```

Si:

```text
revocada_en IS NOT NULL
```

la petición será rechazada.

Esto permite que logout tenga efecto inmediato.

---

# 49. Middleware de roles

Tendremos conceptualmente:

```text
requerirRol
```

Ejemplo:

```text
requerirRol('ADMIN')
```

---

# 50. Ejemplo de ruta administrativa

Conceptualmente:

```javascript
router.post(
    '/admin/usuarios',
    autenticar,
    requerirRol('ADMIN'),
    crearUsuario
);
```

Flujo:

```text
petición
   ↓
autenticar
   ↓
¿es ADMIN?
   ↓
controlador
```

---

# 51. El frontend no es una barrera de seguridad

React podrá ocultar:

```text
Administrar usuarios
```

para un usuario normal.

Pero eso solo mejora la interfaz.

Un usuario podría intentar manualmente:

```text
POST /api/admin/usuarios
```

Por eso el backend debe responder:

```http
403 Forbidden
```

---

# 52. Crear usuario

Endpoint:

```text
POST /api/admin/usuarios
```

Requiere:

```text
ADMIN
```

Entrada:

```json
{
  "nombre": "María",
  "correo": "maria@correo.com",
  "password": "ClaveInicialSegura",
  "rol": "USUARIO"
}
```

---

# 53. Proceso

```text
validar ADMIN
    ↓
validar datos
    ↓
normalizar correo
    ↓
comprobar duplicado
    ↓
hash bcrypt
    ↓
INSERT usuario
```

---

# 54. Respuesta

```http
201 Created
```

```json
{
  "idUsuario": 3,
  "nombre": "María",
  "correo": "maria@correo.com",
  "rol": "USUARIO",
  "estado": "ACTIVO",
  "tema": "SISTEMA"
}
```

---

# 55. Usuario duplicado

Si ya existe:

```text
maria@correo.com
```

respuesta:

```http
409 Conflict
```

```json
{
  "error": {
    "codigo": "USUARIO_CORREO_DUPLICADO",
    "mensaje": "Ya existe un usuario con ese correo."
  }
}
```

PostgreSQL seguirá siendo la última barrera mediante su índice único.

---

# 56. Listar usuarios

Endpoint:

```text
GET /api/admin/usuarios
```

Solo:

```text
ADMIN
```

Respuesta conceptual:

```json
[
  {
    "idUsuario": 1,
    "nombre": "Administrador",
    "correo": "admin@casa.local",
    "rol": "ADMIN",
    "estado": "ACTIVO",
    "tema": "SISTEMA"
  },
  {
    "idUsuario": 2,
    "nombre": "Usuario Casa",
    "correo": "usuario@casa.local",
    "rol": "USUARIO",
    "estado": "ACTIVO",
    "tema": "OSCURO"
  }
]
```

---

# 57. Obtener usuario

Endpoint:

```text
GET /api/admin/usuarios/:id
```

Solo:

```text
ADMIN
```

---

# 58. Editar usuario

Endpoint:

```text
PATCH /api/admin/usuarios/:id
```

Permitirá inicialmente modificar:

```text
nombre
correo
rol
```

No utilizará este endpoint para modificar:

```text
password
tema
```

Cada responsabilidad tendrá su propia operación.

---

# 59. Activar o desactivar usuario

Endpoint:

```text
PATCH /api/admin/usuarios/:id/estado
```

Entrada:

```json
{
  "estado": "INACTIVO"
}
```

---

# 60. Desactivar usuario

Cuando un usuario pase a:

```text
INACTIVO
```

deberán revocarse todas sus sesiones activas.

Conceptualmente:

```sql
UPDATE sesiones
SET revocada_en = CURRENT_TIMESTAMP
WHERE id_usuario = $1
  AND revocada_en IS NULL;
```

---

# 61. Cambiar contraseña propia

Endpoint:

```text
PATCH /api/auth/password
```

Entrada:

```json
{
  "passwordActual": "ClaveActual",
  "passwordNueva": "NuevaClaveSegura"
}
```

---

# 62. Cambio de contraseña

El backend:

```text
comprueba contraseña actual
     ↓
valida contraseña nueva
     ↓
genera bcrypt hash
     ↓
actualiza password_hash
     ↓
revoca sesiones
```

Por seguridad, todas las sesiones anteriores deberán invalidarse.

La aplicación podrá iniciar una nueva sesión inmediatamente o solicitar nuevo login.

Para el MVP utilizaremos:

```text
cambiar contraseña
        ↓
cerrar todas las sesiones
        ↓
volver al login
```

Esto es más simple de entender.

---

# 63. Restablecimiento administrativo

Como no existe:

```text
Olvidé mi contraseña
```

ni envío de correo, un ADMIN podrá establecer una contraseña nueva para otro usuario.

Endpoint:

```text
PUT /api/admin/usuarios/:id/password
```

Entrada:

```json
{
  "passwordNueva": "NuevaClaveTemporal"
}
```

Después:

```text
actualizar contraseña
     ↓
revocar todas las sesiones del usuario
```

---

# 64. No existe recuperación pública

Durante el MVP no habrá:

```text
¿Olvidaste tu contraseña?
```

mediante:

* correo;
* SMS;
* códigos;
* enlaces temporales.

Si un usuario olvida su contraseña:

```text
ADMIN
   ↓
restablece contraseña
```

Esto es coherente con una aplicación local de dos usuarios.

---

# 65. Cambiar tema

Endpoint:

```text
PATCH /api/auth/tema
```

Entrada:

```json
{
  "tema": "OSCURO"
}
```

Valores:

```text
SISTEMA
CLARO
OSCURO
```

Respuesta:

```json
{
  "tema": "OSCURO"
}
```

Esta operación no requiere rol ADMIN.

---

# 66. Regla del último administrador

Debemos evitar dejar el sistema sin administradores.

Supongamos que existe únicamente:

```text
ADMIN 1
```

No deberá permitirse:

```text
desactivar ADMIN 1
```

ni:

```text
cambiar ADMIN 1 → USUARIO
```

si es el último administrador activo.

---

# 67. AUTH-ADMIN-001

Siempre deberá existir al menos:

```text
1 ADMIN ACTIVO
```

---

# 68. Operaciones que deben validar esta regla

Antes de:

```text
ADMIN → USUARIO
```

o:

```text
ADMIN ACTIVO → INACTIVO
```

el backend deberá comprobar cuántos administradores activos existen.

---

# 69. Uso de transacción

La comprobación y modificación deberán ejecutarse dentro de una transacción.

Conceptualmente:

```text
BEGIN
   ↓
comprobar administradores activos
   ↓
validar operación
   ↓
actualizar usuario
   ↓
COMMIT
```

Si dejaría cero administradores:

```text
ROLLBACK
```

---

# 70. Error último administrador

```http
409 Conflict
```

```json
{
  "error": {
    "codigo": "USUARIO_ULTIMO_ADMIN",
    "mensaje": "El sistema debe conservar al menos un administrador activo."
  }
}
```

---

# 71. Autodesactivación

Un administrador no podrá desactivarse a sí mismo si eso deja al sistema sin administradores activos.

Si existe otro administrador activo, técnicamente podrá hacerse.

---

# 72. Cambio de rol propio

La misma regla aplica.

No se permitirá que el último ADMIN activo se convierta en:

```text
USUARIO
```

---

# 73. Rutas públicas

Serán públicas únicamente:

```text
POST /api/auth/login
POST /api/auth/refresh
```

El logout requiere identificar una sesión, aunque deberá ser tolerante si la cookie ya no existe.

---

# 74. Rutas autenticadas

```text
POST  /api/auth/logout
GET   /api/auth/me
PATCH /api/auth/password
PATCH /api/auth/tema
```

---

# 75. Rutas administrativas

```text
POST  /api/admin/usuarios
GET   /api/admin/usuarios
GET   /api/admin/usuarios/:id
PATCH /api/admin/usuarios/:id
PATCH /api/admin/usuarios/:id/estado
PUT   /api/admin/usuarios/:id/password
```

Todas requerirán:

```text
ADMIN
```

---

# 76. Matriz de permisos

| Endpoint                | Sin login | USUARIO | ADMIN |
| ----------------------- | --------: | ------: | ----: |
| Login                   |        Sí |      Sí |    Sí |
| Refresh                 |       Sí* |     Sí* |   Sí* |
| Logout                  |        No |      Sí |    Sí |
| `/auth/me`              |        No |      Sí |    Sí |
| Cambiar password propio |        No |      Sí |    Sí |
| Cambiar tema propio     |        No |      Sí |    Sí |
| Crear usuario           |        No |      No |    Sí |
| Listar usuarios         |        No |      No |    Sí |
| Editar usuario          |        No |      No |    Sí |
| Cambiar estado          |        No |      No |    Sí |
| Resetear password       |        No |      No |    Sí |

`*` requiere una cookie de Refresh Token válida.

---

# 77. Códigos HTTP básicos

Utilizaremos:

```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Content
500 Internal Server Error
```

---

# 78. Diferencia entre 401 y 403

## 401

Significa:

```text
No estás correctamente autenticado.
```

Ejemplos:

* JWT inexistente;
* JWT inválido;
* JWT expirado;
* Refresh Token inválido.

## 403

Significa:

```text
Sabemos quién eres, pero no tienes permiso.
```

Ejemplo:

```text
USUARIO intenta crear otro usuario.
```

---

# 79. Formato de errores

Utilizaremos una estructura uniforme.

Ejemplo:

```json
{
  "error": {
    "codigo": "AUTH_TOKEN_EXPIRADO",
    "mensaje": "La sesión necesita renovarse."
  }
}
```

Esto permitirá a React reaccionar utilizando:

```text
codigo
```

sin depender del texto humano del mensaje.

---

# 80. Códigos de error iniciales

```text
AUTH_CREDENCIALES_INVALIDAS
AUTH_USUARIO_INACTIVO
AUTH_TOKEN_AUSENTE
AUTH_TOKEN_INVALIDO
AUTH_TOKEN_EXPIRADO
AUTH_SESION_INVALIDA
AUTH_SESION_REVOCADA
AUTH_SIN_PERMISO

USUARIO_NO_ENCONTRADO
USUARIO_CORREO_DUPLICADO
USUARIO_PASSWORD_INVALIDO
USUARIO_ULTIMO_ADMIN
```

---

# 81. Datos que jamás deberán aparecer en respuestas

No devolver:

```text
password
password_hash
refresh_token
token_hash
JWT_SECRET
```

---

# 82. Datos que jamás deberán aparecer en logs

No registrar:

```text
contraseña
password_hash
Refresh Token completo
Access Token completo
JWT_SECRET
```

---

# 83. Variables de entorno previstas

Conceptualmente:

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

NODE_ENV
```

Valores sensibles estarán únicamente fuera del repositorio.

---

# 84. CORS

Durante desarrollo local tendremos típicamente:

```text
React
http://localhost:5173
```

y:

```text
Express
http://localhost:3000
```

Express permitirá únicamente el origen configurado.

Ejemplo conceptual:

```text
FRONTEND_URL=http://localhost:5173
```

Como utilizaremos cookie para Refresh Token:

```text
credentials = true
```

---

# 85. React deberá enviar credenciales

Las peticiones relacionadas con la cookie deberán habilitar credenciales.

Con Axios conceptualmente:

```text
withCredentials: true
```

No significa que todas las credenciales estarán visibles en JavaScript.

La cookie HttpOnly continuará protegida.

---

# 86. Protección básica contra fuerza bruta

El endpoint:

```text
POST /api/auth/login
```

deberá tener limitación básica de intentos.

Configuración inicial propuesta:

```text
5 intentos
por 15 minutos
```

La implementación concreta podrá utilizar middleware específico.

El objetivo es evitar intentos ilimitados.

---

# 87. Sesiones y cambio de rol

Si un ADMIN cambia:

```text
USUARIO → ADMIN
```

o:

```text
ADMIN → USUARIO
```

las sesiones existentes del usuario deberán revocarse.

Esto obliga a iniciar nuevamente sesión y evita conservar permisos antiguos.

---

# 88. Sesiones y desactivación

```text
ACTIVO → INACTIVO
```

produce:

```text
revocar todas las sesiones
```

---

# 89. Sesiones y cambio de contraseña

```text
password cambia
```

produce:

```text
revocar todas las sesiones
```

---

# 90. Sesiones y correo

Cambiar el correo no requiere necesariamente revocar sesiones, porque la identidad interna del usuario continúa siendo:

```text
id_usuario
```

Para el MVP mantendremos las sesiones.

---

# 91. Identidad real

Nunca utilizaremos el correo como clave interna principal.

Utilizaremos:

```text
id_usuario
```

El correo puede cambiar.

El identificador no.

---

# 92. Casos válidos

## Caso A — Login

```text
Correo correcto
Contraseña correcta
Usuario ACTIVO
```

Resultado:

```text
Access Token
Refresh Token
sesión creada
```

---

## Caso B — Refresh

```text
Access Token expiró
Refresh Token válido
Usuario activo
Sesión activa
```

Resultado:

```text
nuevo Access Token
nuevo Refresh Token
```

---

## Caso C — Logout

```text
Usuario autenticado
```

Resultado:

```text
sesión revocada
cookie eliminada
```

---

## Caso D — ADMIN crea usuario

```text
ADMIN
   ↓
POST /admin/usuarios
```

Resultado:

```text
201
```

---

## Caso E — USUARIO cambia tema

```text
SISTEMA → OSCURO
```

Resultado:

```text
preferencia guardada
```

---

# 93. Casos inválidos

## Caso A

Contraseña incorrecta.

Resultado:

```text
401
AUTH_CREDENCIALES_INVALIDAS
```

---

## Caso B

Usuario inactivo intenta login.

Resultado:

```text
403
AUTH_USUARIO_INACTIVO
```

---

## Caso C

USUARIO intenta:

```text
POST /api/admin/usuarios
```

Resultado:

```text
403
AUTH_SIN_PERMISO
```

---

## Caso D

JWT expirado.

Resultado:

```text
401
AUTH_TOKEN_EXPIRADO
```

React podrá intentar:

```text
/api/auth/refresh
```

---

## Caso E

Refresh Token revocado.

Resultado:

```text
401
AUTH_SESION_INVALIDA
```

---

## Caso F

ADMIN intenta desactivar al único ADMIN activo.

Resultado:

```text
409
USUARIO_ULTIMO_ADMIN
```

---

# 94. Pruebas derivadas de esta especificación

Cuando implementemos SPEC-003 deberán existir pruebas para, como mínimo:

```text
login correcto
contraseña incorrecta
correo inexistente
usuario inactivo
JWT válido
JWT inválido
JWT expirado
Refresh válido
Refresh expirado
Refresh revocado
rotación de Refresh Token
logout
ruta protegida sin token
ruta ADMIN con usuario normal
ruta ADMIN con administrador
crear usuario
correo duplicado
cambiar contraseña
revocar sesiones al cambiar contraseña
desactivar usuario
revocar sesiones al desactivar
cambiar rol
proteger último administrador
cambiar tema
```

---

# 95. Lo que todavía NO implementamos

Esta especificación no desarrolla todavía:

* formulario React;
* pantalla de login;
* sidebar;
* rutas React;
* código Express;
* código JWT;
* código bcrypt;
* middleware real;
* SQL ejecutado;
* CSS.

Primero dejamos claro:

```text
qué debe ocurrir
```

Después implementaremos:

```text
cómo ocurre
```

---

# 96. Cambios oficiales sobre SPEC-002

SPEC-003 introduce:

## Nueva tabla

```text
sesiones
```

## Nueva relación

```text
usuarios 1 ─── N sesiones
```

No modifica las tablas:

```text
medidores
lecturas_medidor
```

La tabla `usuarios` conserva su estructura definida en SPEC-002.

---

# 97. Arquitectura conceptual de autenticación

```text
┌─────────────────────────┐
│         React           │
│                         │
│ Access Token en memoria │
└───────────┬─────────────┘
            │
            │ Authorization Bearer
            ▼
┌─────────────────────────┐
│        Express          │
│                         │
│ autenticación           │
│ autorización            │
│ JWT                     │
│ bcrypt                  │
└───────────┬─────────────┘
            │
            │ pg
            ▼
┌─────────────────────────┐
│       PostgreSQL        │
│                         │
│ usuarios                │
│ sesiones                │
└─────────────────────────┘

Navegador
   │
   └──── Cookie HttpOnly ────► Refresh Token
```

---

# 98. Invariantes de autenticación

### AUTH-INV-001

Una contraseña nunca se almacena en texto plano.

### AUTH-INV-002

Un Refresh Token original nunca se almacena en PostgreSQL.

### AUTH-INV-003

Un usuario inactivo nunca puede autenticarse.

### AUTH-INV-004

Una sesión revocada no puede renovarse.

### AUTH-INV-005

Una sesión expirada no puede renovarse.

### AUTH-INV-006

Un usuario normal nunca puede ejecutar operaciones administrativas.

### AUTH-INV-007

Siempre debe existir al menos un ADMIN activo.

### AUTH-INV-008

Cambiar contraseña invalida las sesiones anteriores.

### AUTH-INV-009

Desactivar un usuario invalida sus sesiones.

### AUTH-INV-010

Cambiar el rol invalida las sesiones anteriores.

### AUTH-INV-011

El frontend nunca es la autoridad final de permisos.

### AUTH-INV-012

Los secretos nunca forman parte del repositorio.

---

# 99. Estado final después de SPEC-003

El sistema ya tiene definidos conceptualmente:

```text
USUARIO
   │
   ├── credenciales
   ├── rol
   ├── estado
   ├── tema
   │
   └── sesiones
           │
           ├── Access Token
           └── Refresh Token
```

Y disponemos de los siguientes módulos conceptuales:

```text
Autenticación
Usuarios
Roles
Sesiones
Medidores
Lecturas
```

---

# 100. Decisiones congeladas por SPEC-003

1. No hay registro público.
2. El primer ADMIN se crea mediante script local.
3. ADMIN crea los demás usuarios.
4. Login mediante correo y contraseña.
5. Contraseñas protegidas con bcrypt.
6. Factor inicial bcrypt: 12.
7. Access Token mediante JWT.
8. Access Token inicial: 15 minutos.
9. Refresh Token inicial: 7 días.
10. Refresh Token aleatorio y opaco.
11. Refresh Token guardado como hash SHA-256.
12. Refresh Token entregado mediante cookie HttpOnly.
13. Access Token mantenido en memoria por React.
14. No almacenar tokens en `localStorage`.
15. Refresh Token rota después de cada uso.
16. Logout revoca la sesión.
17. Cambio de contraseña revoca sesiones.
18. Desactivación revoca sesiones.
19. Cambio de rol revoca sesiones.
20. Middleware verifica usuario activo.
21. Middleware verifica sesión activa.
22. El backend controla todos los permisos.
23. Siempre debe existir al menos un ADMIN activo.
24. Sin recuperación de contraseña mediante correo durante el MVP.
25. ADMIN puede restablecer la contraseña de otro usuario.
26. Usuario puede cambiar su propia contraseña.
27. Usuario puede cambiar su propio tema.
28. Nueva tabla PostgreSQL `sesiones`.

---

# 101. Criterio de finalización de SPEC-003

Un aprendiz deberá poder responder correctamente:

1. ¿Por qué no almacenamos contraseñas?
2. ¿Para qué sirve bcrypt?
3. ¿Qué diferencia existe entre Access Token y Refresh Token?
4. ¿Por qué el Access Token dura poco?
5. ¿Por qué existe una tabla de sesiones?
6. ¿Por qué no guardamos el Refresh Token original?
7. ¿Por qué utilizamos SHA-256 para el Refresh Token?
8. ¿Dónde se guarda el Access Token?
9. ¿Dónde se guarda el Refresh Token?
10. ¿Qué significa HttpOnly?
11. ¿Qué ocurre al cerrar sesión?
12. ¿Qué ocurre al desactivar un usuario?
13. ¿Qué ocurre al cambiar una contraseña?
14. ¿Quién puede crear usuarios?
15. ¿Por qué React no puede ser nuestra barrera de seguridad?
16. ¿Cuál es la diferencia entre `401` y `403`?
17. ¿Por qué debemos mantener al menos un ADMIN activo?
18. ¿Cómo se crea el primer administrador?

Si estas respuestas están claras, SPEC-003 está lista para convertirse posteriormente en código.
