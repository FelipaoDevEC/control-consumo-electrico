# SPEC-010 — Seguridad transversal, validación y manejo de errores

## 1. Objetivo

Definir las reglas de seguridad que afectan a toda la aplicación y que no pertenecen exclusivamente a un módulo.

Esta especificación establece:

* validación de entradas;
* normalización de datos;
* consultas SQL seguras;
* protección contra inyección SQL;
* control de campos permitidos;
* protección de contraseñas;
* protección de tokens;
* CORS;
* CSRF;
* headers HTTP de seguridad;
* rate limiting;
* límites de peticiones;
* manejo centralizado de errores;
* logging seguro;
* variables de entorno;
* secretos;
* configuración segura;
* diferencias entre desarrollo y producción.

La seguridad deberá aplicarse en:

```text
Frontend
   ↓
API
   ↓
Servicios
   ↓
Repositorios
   ↓
PostgreSQL
```

pero el backend será la principal frontera de confianza.

---

# 2. Principio fundamental

Nunca confiaremos en datos enviados por el cliente.

Aunque React:

```text
oculte un botón
limite un campo
valide una fecha
deshabilite una opción
```

un usuario puede llamar directamente a la API.

Por tanto:

> Toda regla importante deberá validarse nuevamente en el backend.

---

# 3. Modelo de confianza

Conceptualmente:

```text
NAVEGADOR
   │
   │ NO CONFIABLE
   ▼
────────────────────────────
       FRONTERA API
────────────────────────────
   ▼
EXPRESS
   │
   ├── valida
   ├── autentica
   ├── autoriza
   ├── normaliza
   ▼
SERVICIOS
   │
   ├── reglas de negocio
   ▼
REPOSITORIOS
   │
   ├── SQL parametrizado
   ▼
POSTGRESQL
   │
   └── integridad final
```

---

# 4. Defensa en profundidad

No dependeremos de una sola capa.

Ejemplo:

Para impedir dos lecturas del mismo día:

```text
React
   ↓
evita doble envío accidental

Express
   ↓
valida existencia

Servicio
   ↓
transacción y bloqueo

PostgreSQL
   ↓
UNIQUE
```

Cada capa aporta una protección diferente.

---

# 5. Validación de entrada

Toda entrada procedente de:

```text
req.body
req.params
req.query
cookies
headers
```

debe considerarse no confiable.

---

# 6. Validaciones antes del negocio

Antes de ejecutar reglas de dominio deberán comprobarse:

```text
tipo
formato
presencia
longitud
rango
valores permitidos
```

---

# 7. Ejemplo de lectura

Entrada:

```json
{
  "fechaLectura": "2026-08-30",
  "valorLectura": 12555
}
```

Validación estructural:

```text
fechaLectura existe
fechaLectura es texto con formato válido

valorLectura existe
valorLectura es número
valorLectura es entero
valorLectura >= 0
```

Después se ejecutan reglas de negocio:

```text
¿fecha futura?
¿usuario puede registrar esa fecha?
¿ya existe?
¿respeta lectura anterior?
¿respeta lectura siguiente?
```

---

# 8. Validación y negocio no son lo mismo

Ejemplo:

```text
valorLectura = -5
```

es un problema de validación.

Mientras:

```text
valorLectura = 1000
lecturaAnterior = 1200
```

puede tener tipo correcto pero viola una:

```text
regla de negocio.
```

Esta diferencia deberá mantenerse clara.

---

# 9. Esquemas de validación

La implementación utilizará validaciones centralizadas y reutilizables.

Conceptualmente:

```text
esquemaLogin
esquemaCrearUsuario
esquemaRegistrarLectura
esquemaCorregirLectura
esquemaCambiarTema
```

Podrá utilizarse una librería de esquemas compatible con Node.js o validaciones propias organizadas.

La elección concreta se realizará al iniciar la implementación.

---

# 10. No duplicar validaciones manualmente

No queremos:

```text
controlador A valida correo de una forma
controlador B de otra
controlador C de otra
```

Las reglas estructurales compartidas deberán reutilizarse.

---

# 11. Rechazo de campos inesperados

Las operaciones sensibles utilizarán una lista explícita de campos aceptados.

Ejemplo:

`POST /api/admin/usuarios`

acepta:

```text
nombre
correo
password
rol
```

No:

```text
idUsuario
estado
passwordHash
creadoEn
esSuperAdmin
```

---

# 12. Prevención de mass assignment

Nunca realizaremos algo equivalente a:

```javascript
actualizarUsuario(req.body);
```

permitiendo que cualquier campo enviado sea actualizado.

Utilizaremos explícitamente:

```text
nombre
correo
rol
```

cuando esos sean los campos permitidos.

---

# 13. IDs

Los identificadores recibidos por URL deberán validarse.

Ejemplo:

```http
GET /api/lecturas/25
```

válido.

Ejemplo:

```http
GET /api/lecturas/abc
```

inválido.

---

# 14. Validación de IDs

Los IDs deberán representar:

```text
enteros positivos
```

Ejemplos inválidos:

```text
0
-1
1.5
abc
```

---

# 15. Fechas

Las fechas del dominio utilizan:

```text
YYYY-MM-DD
```

Ejemplo válido:

```text
2026-08-30
```

---

# 16. No confiar únicamente en patrón textual

Una cadena como:

```text
2026-02-31
```

puede parecer cumplir:

```text
YYYY-MM-DD
```

pero no representa una fecha real.

La validación deberá comprobar también:

```text
validez calendario
```

---

# 17. Fecha de negocio

Las comparaciones con:

```text
hoy
```

utilizarán:

```text
America/Guayaquil
```

durante el MVP.

---

# 18. Números

No se aceptará silenciosamente:

```text
"12555abc"
```

como:

```text
12555
```

mediante conversiones permisivas.

---

# 19. Conversión explícita

Cuando sea necesario convertir parámetros como:

```text
pagina
limite
id
```

la conversión deberá comprobar que todo el valor sea válido.

---

# 20. Paginación

Reglas:

```text
pagina >= 1
limite >= 1
limite <= máximo definido
```

---

# 21. Correo

Antes de almacenar o buscar:

```text
trim
+
lowercase
```

Ejemplo:

```text
" Usuario@Correo.com "
```

se normaliza a:

```text
usuario@correo.com
```

---

# 22. Validación de correo

La aplicación comprobará una estructura razonable de dirección de correo.

No intentaremos implementar mediante una expresión regular gigantesca todas las posibilidades del estándar mundial de correo.

---

# 23. Nombre

El nombre:

* se limpia de espacios exteriores;
* no puede quedar vacío;
* máximo 100 caracteres.

No eliminaremos arbitrariamente caracteres legítimos del nombre.

---

# 24. Contraseñas

Las contraseñas jamás se normalizarán mediante:

```text
trim automático
lowercase
```

porque:

```text
" Mi clave "
```

puede ser intencionalmente distinta de:

```text
"Mi clave"
```

---

# 25. Contraseña y bcrypt

SPEC-003 estableció:

```text
bcrypt
```

como mecanismo para almacenar contraseñas.

---

# 26. Corrección importante sobre longitud

`bcrypt` procesa únicamente una cantidad limitada de bytes de entrada.

Por eso no basta con validar:

```text
máximo 64 caracteres
```

si los caracteres Unicode pueden ocupar varios bytes.

---

# 27. Regla PASSWORD-001

La contraseña deberá:

```text
tener al menos 8 caracteres
```

y además:

```text
no superar 72 bytes UTF-8
```

para evitar truncamiento silencioso por bcrypt.

---

# 28. Límite de interfaz

La interfaz puede recomendar:

```text
8–64 caracteres
```

pero el backend comprobará también:

```text
Buffer.byteLength(password, 'utf8') <= 72
```

o equivalente.

---

# 29. Contraseña demasiado larga

Respuesta:

```http
422 Unprocessable Content
```

Código:

```text
USUARIO_PASSWORD_INVALIDO
```

---

# 30. Comparación de contraseña

Se utilizará:

```text
bcrypt.compare()
```

o equivalente.

Nunca:

```text
password === passwordHash
```

---

# 31. No registrar contraseñas

Nunca en logs:

```text
password
passwordActual
passwordNueva
```

---

# 32. SQL seguro

Todas las consultas deberán utilizar:

```text
parámetros
```

---

# 33. Ejemplo correcto

Conceptualmente:

```javascript
await cliente.query(
    'SELECT * FROM usuarios WHERE correo = $1',
    [correo]
);
```

---

# 34. Ejemplo prohibido

```javascript
const sql =
    "SELECT * FROM usuarios WHERE correo = '" +
    correo +
    "'";
```

Esto abre la puerta a:

```text
SQL Injection
```

---

# 35. SQL dinámico

Cuando necesitemos filtros opcionales:

```text
desde
hasta
estado
rol
buscar
```

los valores continuarán utilizando parámetros.

---

# 36. No parametrizar identificadores arbitrarios del usuario

Los parámetros PostgreSQL sirven para valores, no para permitir que el usuario elija directamente:

```text
nombre de tabla
nombre de columna
ORDER BY arbitrario
```

---

# 37. Ordenamiento

Si en el futuro se permite:

```text
orden=fecha
```

deberá utilizar una:

```text
lista blanca
```

como:

```text
fecha
nombre
correo
```

Nunca insertar directamente el texto del cliente en el SQL.

---

# 38. Cuenta PostgreSQL

La aplicación utilizará una cuenta propia de PostgreSQL.

No debería conectarse normalmente como:

```text
postgres
```

o un superusuario equivalente.

---

# 39. Menor privilegio

La cuenta de la aplicación deberá poseer únicamente los permisos necesarios sobre su base de datos.

---

# 40. Variables de conexión

No se escribirán credenciales directamente en:

```javascript
db.js
```

---

# 41. Variables de entorno

Se utilizarán valores como:

```text
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
```

---

# 42. Archivo `.env`

Durante desarrollo podrá existir:

```text
.env
```

pero:

```text
NO se versiona en Git
```

---

# 43. Archivo de ejemplo

Sí podrá existir:

```text
.env.example
```

con:

```text
nombres de variables
valores ficticios
```

Nunca secretos reales.

---

# 44. Validación del entorno al iniciar

El servidor deberá verificar que existan configuraciones obligatorias.

Ejemplo:

```text
JWT_SECRET ausente
```

No queremos que Express arranque parcialmente y falle posteriormente.

---

# 45. Fallo rápido

Si falta una configuración crítica:

```text
servidor no inicia
+
mensaje técnico claro en consola local
```

Sin revelar otros secretos.

---

# 46. JWT_SECRET

Debe ser:

```text
aleatorio
suficientemente largo
privado
```

Nunca:

```text
mi_clave_secreta
123456
secret
```

en producción.

---

# 47. Refresh Tokens

Como definió SPEC-003:

```text
Refresh Token original
```

solo existe en:

```text
navegador
+
memoria temporal del backend durante la operación
```

PostgreSQL almacena:

```text
SHA-256(token)
```

---

# 48. Tokens en logs

Nunca registrar:

```text
Authorization completo
Access Token
Refresh Token
Cookie completa
```

---

# 49. Access Token

React lo mantiene:

```text
en memoria
```

durante la sesión activa.

---

# 50. Prohibido para autenticación

No almacenaremos el Access Token o Refresh Token en:

```text
localStorage
sessionStorage
IndexedDB
```

durante el MVP.

---

# 51. Cookie Refresh

La cookie será:

```text
HttpOnly
SameSite=Strict
Path=/api/auth
```

---

# 52. Secure

Producción HTTPS:

```text
Secure=true
```

Desarrollo local HTTP:

```text
Secure=false
```

---

# 53. Cookie y JavaScript

Por:

```text
HttpOnly
```

React no podrá hacer:

```javascript
document.cookie
```

para obtener el Refresh Token.

Ese es el comportamiento deseado.

---

# 54. CORS

El backend no utilizará:

```text
Access-Control-Allow-Origin: *
```

cuando se utilicen credenciales.

---

# 55. Origen permitido

Durante desarrollo:

```text
FRONTEND_URL=http://localhost:5173
```

o el origen configurado.

Solo ese origen estará autorizado.

---

# 56. Credenciales

CORS utilizará:

```text
credentials: true
```

porque el navegador necesita enviar la cookie HttpOnly en las operaciones correspondientes.

---

# 57. Orígenes no autorizados

Una petición desde otro origen no deberá recibir autorización CORS.

---

# 58. CORS no es autenticación

Que un origen esté permitido no significa:

```text
usuario autenticado
```

CORS y autenticación resuelven problemas distintos.

---

# 59. CSRF

Los endpoints protegidos mediante:

```text
Authorization: Bearer
```

no dependen de una cookie enviada automáticamente para autenticarse.

Por ello su riesgo CSRF tradicional es menor.

---

# 60. Endpoints sensibles a cookie

El Refresh Token sí se envía automáticamente mediante cookie.

Especial atención a:

```text
POST /api/auth/refresh
POST /api/auth/logout
```

---

# 61. Protección CSRF del MVP

Utilizaremos varias capas:

```text
SameSite=Strict
+
CORS con origen explícito
+
validación del header Origin
```

para endpoints autenticados mediante cookie.

---

# 62. Origin permitido

Para:

```text
refresh
logout
```

el backend comprobará que:

```text
Origin
```

coincida con:

```text
FRONTEND_URL
```

cuando el navegador lo envíe.

---

# 63. Petición desde origen inesperado

Debe rechazarse.

Código conceptual:

```text
SECURITY_ORIGIN_INVALIDO
```

---

# 64. Token CSRF independiente

Durante el MVP local no añadiremos inicialmente un sistema adicional de:

```text
CSRF token sincronizado
```

porque:

```text
SameSite Strict
+
Origin validation
+
origen único
```

son suficientes para el alcance definido.

Si la arquitectura de despliegue cambia, esta decisión deberá revisarse.

---

# 65. XSS

La protección contra CSRF no protege contra:

```text
Cross-Site Scripting
```

Son problemas distintos.

---

# 66. React y XSS

React escapa contenido textual por defecto.

Por eso evitaremos:

```text
dangerouslySetInnerHTML
```

durante el MVP.

---

# 67. Datos introducidos por usuarios

Valores como:

```text
nombre
correo
```

deberán renderizarse como texto normal.

Nunca interpretarlos como HTML.

---

# 68. Ejemplo

Si un nombre malicioso contiene:

```html
<script>alert(1)</script>
```

la interfaz deberá mostrarlo como texto o rechazarlo según validación, pero nunca ejecutarlo.

---

# 69. Headers de seguridad

Express configurará headers HTTP de seguridad apropiados.

Podrá utilizarse:

```text
Helmet
```

o configuración equivalente.

---

# 70. Headers esperados

Entre otros, deberá considerarse:

```text
Content-Security-Policy
X-Content-Type-Options
Referrer-Policy
protecciones relacionadas con framing
```

según corresponda.

---

# 71. CSP

La Política de Seguridad de Contenido deberá limitar, cuando sea posible:

```text
scripts
estilos
imágenes
conexiones
```

a fuentes necesarias.

---

# 72. Desarrollo vs producción

Vite y herramientas de desarrollo pueden necesitar una configuración CSP diferente.

No desactivaremos permanentemente las protecciones solo porque dificulten el entorno de desarrollo.

---

# 73. Clickjacking

La aplicación no necesita ejecutarse embebida en sitios externos.

Por tanto deberá impedirse su inclusión arbitraria en:

```text
iframe
```

de terceros.

---

# 74. MIME sniffing

Se deshabilitará el sniffing inseguro mediante headers apropiados.

---

# 75. Rate limiting

Existirá protección contra abuso de endpoints.

---

# 76. Login

Como ya definimos:

```text
5 intentos
por 15 minutos
```

como punto de partida.

---

# 77. Respuesta al superar límite

```http
429 Too Many Requests
```

Código:

```text
RATE_LIMIT_EXCEDIDO
```

---

# 78. Mensaje

```text
Demasiados intentos. Intenta nuevamente más tarde.
```

No informar detalles que permitan enumerar usuarios.

---

# 79. Refresh

El endpoint de refresh también tendrá un límite suficientemente amplio para uso legítimo, pero que evite abuso masivo.

Ejemplo inicial:

```text
60 solicitudes
por 15 minutos
```

por origen/IP/sesión según permita la implementación.

---

# 80. API general

Podrá existir además un límite general defensivo.

Ejemplo inicial:

```text
120 solicitudes por minuto por IP
```

para el MVP.

Estos valores serán configurables.

---

# 81. Rate limit no reemplaza autenticación

Un endpoint administrativo sigue necesitando:

```text
JWT
+
sesión válida
+
rol ADMIN
```

aunque tenga rate limiting.

---

# 82. Fuerza bruta

El login no deberá revelar si el correo existe mediante:

```text
tiempo
mensaje
código diferente
```

en los casos normales de credenciales incorrectas.

---

# 83. Usuario inactivo

SPEC-003 sí permite distinguir:

```text
AUTH_USUARIO_INACTIVO
```

después de credenciales válidas.

Esta es una decisión explícita del producto.

---

# 84. Tamaño de body

Express no aceptará cuerpos JSON ilimitados.

---

# 85. Límite inicial

Como esta aplicación maneja datos pequeños:

```text
100 KB
```

será más que suficiente para el MVP.

---

# 86. Petición demasiado grande

Respuesta:

```http
413 Payload Too Large
```

---

# 87. Content-Type

Endpoints JSON deberán esperar:

```text
application/json
```

cuando reciban body JSON.

---

# 88. JSON inválido

Un body malformado:

```text
{"valor": 12,
```

deberá producir un error controlado.

No un stack trace.

---

# 89. Manejo centralizado de errores

Express tendrá un middleware final de errores.

Conceptualmente:

```text
rutas
 ↓
controladores
 ↓
servicios
 ↓
repositorios
 ↓
ERROR
 ↓
middlewareErrores
```

---

# 90. Estructura de error

Como definimos previamente:

```json
{
  "error": {
    "codigo": "LECTURA_FECHA_DUPLICADA",
    "mensaje": "Ya existe una lectura registrada para esta fecha."
  }
}
```

---

# 91. Detalles opcionales

Cuando sean seguros y útiles:

```json
{
  "error": {
    "codigo": "LECTURA_MENOR_QUE_ANTERIOR",
    "mensaje": "La lectura no puede ser inferior a la anterior.",
    "detalles": {
      "lecturaAnterior": 12547
    }
  }
}
```

---

# 92. No filtrar errores internos

Nunca devolver al navegador:

```text
stack trace
consulta SQL
ruta absoluta del servidor
contraseña de BD
nombre interno de host
JWT secret
```

---

# 93. Error inesperado

En producción:

```http
500 Internal Server Error
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

# 94. Desarrollo

En desarrollo se podrán registrar más detalles en consola/logs.

Pero tampoco se devolverán secretos.

---

# 95. Mapeo de PostgreSQL

El repositorio o capa de errores deberá traducir errores conocidos.

Ejemplo PostgreSQL:

```text
unique violation
```

puede transformarse en:

```text
LECTURA_FECHA_DUPLICADA
```

o:

```text
USUARIO_CORREO_DUPLICADO
```

según la restricción afectada.

---

# 96. No exponer código PostgreSQL directamente

El frontend no necesita conocer:

```text
23505
23503
```

---

# 97. Errores de programación

Un:

```text
TypeError
```

no debe transformarse artificialmente en:

```text
400
```

Debe considerarse error interno y corregirse.

---

# 98. Logging

El backend tendrá logs suficientes para diagnosticar problemas.

---

# 99. Qué registrar

Podemos registrar:

```text
fecha/hora
nivel
método HTTP
ruta
status HTTP
duración
identificador de petición
idUsuario cuando exista
código de error
```

---

# 100. Qué no registrar

Nunca:

```text
password
passwordHash
accessToken
refreshToken
tokenHash
JWT_SECRET
DB_PASSWORD
cookie completa
Authorization completo
```

---

# 101. Identificador de petición

Cada solicitud podrá recibir:

```text
requestId
```

---

# 102. Ejemplo

```text
req_abc123
```

Permite relacionar:

```text
petición
error
logs
respuesta
```

sin revelar información sensible.

---

# 103. Header opcional

Puede devolverse:

```text
X-Request-Id
```

para facilitar diagnóstico.

---

# 104. Logging de lecturas

Podemos registrar:

```text
usuario 2 registró lectura 25
```

pero no necesitamos duplicar en logs todo el contenido de cada petición.

---

# 105. Logging y datos personales

Aunque los datos de esta app son limitados, aplicaremos minimización.

No registrar información innecesaria.

---

# 106. Logs de autenticación

Permitidos:

```text
login exitoso para idUsuario=2
login rechazado
sesión revocada
```

Evitar registrar:

```text
correo + contraseña
token
```

---

# 107. No enumeración en logs públicos

Los logs del servidor son internos.

Nunca se enviarán directamente al frontend.

---

# 108. Excepciones de negocio

Los servicios podrán lanzar errores de dominio conceptuales.

Ejemplo:

```text
LecturaFechaDuplicada
LecturaMenorQueAnterior
UsuarioUltimoAdmin
```

o una estructura equivalente.

---

# 109. Controladores delgados

No deberían tener:

```text
20 ifs
SQL
bcrypt
JWT
transacciones
```

todos mezclados.

---

# 110. Controlador

Responsabilidad:

```text
recibir HTTP
obtener datos validados
llamar servicio
devolver respuesta
```

---

# 111. Middleware de validación

Responsabilidad:

```text
validar estructura
```

---

# 112. Servicio

Responsabilidad:

```text
reglas de negocio
transacciones
coordinación
```

---

# 113. Repositorio

Responsabilidad:

```text
consultas parametrizadas
```

---

# 114. Middleware de errores

Responsabilidad:

```text
convertir errores conocidos a HTTP
ocultar errores internos
```

---

# 115. Autenticación

Middleware:

```text
autenticar
```

seguirá comprobando:

```text
JWT
sesión
usuario ACTIVO
```

---

# 116. Autorización

Middleware:

```text
requerirRol('ADMIN')
```

controlará permisos globales de rol.

---

# 117. Permisos contextuales

No todo puede resolverse mediante:

```text
requerirRol
```

Ejemplo:

```text
USUARIO puede editar lectura de hoy
pero no histórica
```

se valida en el servicio de lecturas.

---

# 118. Seguridad en transacciones

Toda transacción deberá:

```text
COMMIT
```

si finaliza correctamente.

Ante cualquier error:

```text
ROLLBACK
```

---

# 119. Liberación de conexiones

Una conexión obtenida del pool deberá liberarse:

```text
también cuando ocurre una excepción
```

Conceptualmente mediante:

```text
try
catch
finally
```

---

# 120. Pool PostgreSQL

Utilizaremos:

```text
Pool
```

del paquete `pg`.

No se abrirá una conexión nueva manualmente para cada consulta sin gestión.

---

# 121. Timeout

Las conexiones y consultas deberán tener límites razonables.

No queremos operaciones esperando indefinidamente.

La configuración concreta se definirá durante implementación.

---

# 122. Consultas costosas

El volumen del MVP será pequeño.

No necesitamos optimizaciones agresivas.

Pero evitaremos:

```text
N+1 queries
consultas sin necesidad
recuperar columnas sensibles
```

---

# 123. SELECT explícito

Preferiremos:

```sql
SELECT id_usuario, nombre, correo, rol
```

sobre:

```sql
SELECT *
```

cuando una respuesta no necesita todas las columnas.

Especialmente evita traer:

```text
password_hash
```

sin motivo.

---

# 124. Usuario en respuestas

Nunca devolver accidentalmente:

```text
password_hash
```

porque se utilizó:

```text
SELECT *
```

y luego se serializó toda la fila.

---

# 125. Protección del endpoint de health

Si posteriormente existe:

```text
GET /health
```

deberá devolver información mínima.

Ejemplo:

```json
{
  "status": "ok"
}
```

No:

```text
host PostgreSQL
usuario DB
variables de entorno
versiones internas detalladas
```

---

# 126. Desarrollo local

Durante el MVP:

```text
React → localhost
Express → localhost
PostgreSQL → local
```

Pero mantendremos reglas que permitan una transición segura a producción.

---

# 127. Producción futura

Antes de despliegue público deberán revisarse específicamente:

```text
HTTPS
Secure cookies
proxy confiable
CSP
rate limits
logs
secretos
backups
configuración PostgreSQL
```

El MVP local no debe confundirse con una certificación automática para Internet.

---

# 128. HTTPS

No será obligatorio en:

```text
localhost
```

pero sí en:

```text
producción pública
```

---

# 129. Refresh Cookie en producción

Nunca deberá enviarse por HTTP sin cifrar cuando la aplicación esté publicada.

---

# 130. Errores del frontend

React deberá distinguir:

```text
401
403
404
409
422
429
500
```

cuando sea útil.

---

# 131. 401

Puede intentar:

```text
refresh
```

si corresponde.

---

# 132. Refresh fallido

Si también falla:

```text
limpiar sesión en memoria
↓
mostrar login
```

---

# 133. 403

No debe intentar refrescar infinitamente.

Significa:

```text
autenticado pero sin permiso
```

o cuenta deshabilitada según el caso.

---

# 134. 422

Debe mostrar errores relacionados con los datos enviados.

---

# 135. 409

Representa conflictos como:

```text
lectura duplicada
correo duplicado
último administrador
```

---

# 136. 429

Mostrar:

```text
Demasiados intentos. Intenta nuevamente más tarde.
```

---

# 137. 500

Mostrar:

```text
Ocurrió un problema. Intenta nuevamente.
```

sin detalles técnicos.

---

# 138. Bucle de refresh

React deberá evitar:

```text
401
↓
refresh
↓
401
↓
refresh
↓
401
...
```

---

# 139. Regla frontend de refresh

Por cada fallo de autenticación:

```text
máximo un intento controlado de renovación
```

antes de considerar la sesión terminada.

---

# 140. Refresh concurrente

Puede ocurrir:

```text
5 peticiones
↓
Access Token expiró
↓
5 reciben 401
```

No queremos:

```text
5 refresh simultáneos
```

porque SPEC-003 rota el Refresh Token.

---

# 141. Regla AUTH-CLIENT-001

React deberá coordinar la renovación para que:

```text
solo exista un refresh activo
```

y las otras peticiones esperen su resultado.

---

# 142. Motivo

Si cinco solicitudes utilizan simultáneamente el mismo Refresh Token rotatorio, podrían invalidarse entre ellas.

---

# 143. Después del refresh

Las peticiones pendientes podrán reintentarse una vez utilizando el nuevo Access Token.

---

# 144. Logout

Después de logout:

```text
revocar sesión backend
eliminar cookie
eliminar Access Token en memoria
limpiar estado de usuario
redirigir a login
```

---

# 145. Datos en caché frontend

Al cerrar sesión deberán limpiarse datos relacionados con:

```text
usuario
dashboard
historial
usuarios administrativos
```

para evitar mostrar información de la cuenta anterior.

---

# 146. Cambio entre usuarios

Caso:

```text
Usuario A logout
Usuario B login
```

B nunca debe ver temporalmente datos cacheados de A.

---

# 147. Seguridad del tema

La preferencia visual sí puede permanecer localmente porque no es un dato de autenticación.

Puede incluso conservarse al cerrar sesión.

---

# 148. Dependencias

Toda dependencia añadida deberá tener una razón clara.

Ejemplos posibles:

```text
bcrypt
jsonwebtoken
helmet
cors
rate limiter
```

No instalaremos paquetes innecesarios.

---

# 149. Auditoría de dependencias

Durante el desarrollo deberán revisarse vulnerabilidades conocidas de las dependencias.

No implica actualizar ciegamente una versión mayor sin pruebas.

---

# 150. Lockfile

El proyecto deberá versionar su:

```text
package-lock.json
```

o lockfile correspondiente.

Esto ayuda a reproducir instalaciones.

---

# 151. Versiones

La implementación deberá definir versiones compatibles de:

```text
Node.js
PostgreSQL
```

y documentarlas.

No dependeremos accidentalmente de la máquina de un estudiante.

---

# 152. `.gitignore`

Deberá excluir como mínimo:

```text
node_modules
.env
logs locales
builds temporales
archivos del editor innecesarios
```

según corresponda.

---

# 153. Secretos en Git

Si accidentalmente se versiona:

```text
JWT_SECRET
DB_PASSWORD
```

borrarlo del archivo actual no es suficiente.

El secreto deberá considerarse comprometido y:

```text
rotarse
```

---

# 154. Seed de desarrollo

Nunca contendrá contraseñas reales.

Si necesitamos cuentas de prueba, se generarán mediante mecanismos claramente identificados como desarrollo.

---

# 155. Primer ADMIN

Como estableció SPEC-003:

```text
npm run crear-admin
```

o equivalente solicitará la contraseña en ejecución.

No estará escrita en el repositorio.

---

# 156. Seguridad del historial

Los dos usuarios autorizados pueden consultar las lecturas del único medidor.

No necesitamos aislamiento entre usuarios porque ambos pertenecen al mismo hogar y comparten los mismos datos.

---

# 157. Futuro multi-hogar

Si posteriormente aparecen:

```text
múltiples hogares
múltiples medidores
```

esta especificación deberá ampliarse con aislamiento por propietario/organización.

No asumiremos que el modelo actual ya proporciona multi-tenancy.

---

# 158. Cabeceras de caché

Respuestas autenticadas sensibles no deberán almacenarse indiscriminadamente en caches compartidas.

Se configurará comportamiento apropiado cuando sea necesario.

---

# 159. Login

La respuesta de autenticación deberá evitar cacheo inapropiado.

---

# 160. Tokens y URLs

Nunca enviar:

```text
accessToken
refreshToken
password
```

como query parameters.

Ejemplo prohibido:

```text
/dashboard?token=...
```

---

# 161. Motivo

Las URLs pueden aparecer en:

```text
historial
logs
analytics
referers
```

---

# 162. Códigos de seguridad

Inicialmente:

```text
SECURITY_ORIGIN_INVALIDO
SECURITY_BODY_DEMASIADO_GRANDE
SECURITY_CONTENT_TYPE_INVALIDO

RATE_LIMIT_EXCEDIDO

VALIDACION_DATOS_INVALIDOS

ERROR_INTERNO
```

además de los códigos definidos en las especificaciones anteriores.

---

# 163. Formato para múltiples errores de validación

Podrá utilizarse:

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
        },
        {
          "campo": "password",
          "mensaje": "La contraseña debe tener al menos 8 caracteres."
        }
      ]
    }
  }
}
```

---

# 164. No enviar información sensible en `detalles`

Ejemplo prohibido:

```json
{
  "passwordHashEsperado": "..."
}
```

---

# 165. Orden del pipeline Express

Conceptualmente:

```text
1. requestId
2. headers de seguridad
3. CORS
4. parser JSON limitado
5. logging seguro
6. rate limiting general
7. rutas
8. 404
9. middleware central de errores
```

Dentro de una ruta:

```text
autenticar
↓
autorizar
↓
validar
↓
controlador
↓
servicio
```

El orden exacto podrá variar justificadamente durante implementación.

---

# 166. Ruta inexistente

Respuesta:

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

# 167. Métodos no soportados

La aplicación deberá comportarse de forma predecible si se intenta, por ejemplo:

```http
DELETE /api/lecturas/25
```

cuando el MVP no lo permite.

No deberá ejecutar una operación accidental.

---

# 168. Pruebas de validación

La implementación deberá probar:

```text
body vacío
body malformado
tipo incorrecto
campo obligatorio ausente
campo extra sensible
id inválido
fecha inválida
fecha inexistente en calendario
valor decimal
valor negativo
paginación inválida
```

---

# 169. Pruebas SQL

Como mínimo demostrar que entradas como:

```text
' OR 1=1 --
```

no alteran la consulta.

Las consultas deben permanecer parametrizadas.

---

# 170. Pruebas de mass assignment

Enviar:

```json
{
  "nombre": "María",
  "rol": "USUARIO",
  "estado": "ACTIVO",
  "password_hash": "hack",
  "id_usuario": 1
}
```

no debe permitir modificar campos prohibidos.

---

# 171. Pruebas de autenticación

```text
sin Authorization
Bearer vacío
JWT inválido
JWT expirado
sesión revocada
usuario inactivo
```

---

# 172. Pruebas CORS

```text
origen permitido
origen no permitido
credenciales
```

---

# 173. Pruebas CSRF/origen

Para endpoints de Refresh Cookie:

```text
Origin correcto
Origin incorrecto
```

El origen incorrecto deberá rechazarse.

---

# 174. Pruebas de cookies

En entorno apropiado:

```text
HttpOnly
SameSite
Path
Secure según entorno
```

---

# 175. Pruebas de rate limit

Ejemplo login:

```text
primeros intentos permitidos
límite alcanzado
respuesta 429
```

---

# 176. Pruebas de errores

Verificar que un error interno:

```text
no devuelve stack
no devuelve SQL
no devuelve secretos
```

---

# 177. Pruebas de logs

Asegurar que no aparecen:

```text
contraseñas
Authorization completo
Refresh Tokens
DB_PASSWORD
JWT_SECRET
```

---

# 178. Prueba crítica — bcrypt

Contraseña con caracteres Unicode que supere:

```text
72 bytes UTF-8
```

debe ser rechazada.

No deberá permitirse que bcrypt la trunque silenciosamente.

---

# 179. Prueba crítica — refresh concurrente

Access Token expirado.

Cinco llamadas frontend reciben 401.

Resultado esperado:

```text
1 refresh
```

no:

```text
5 refresh simultáneos
```

---

# 180. Prueba crítica — logout

Después de:

```text
POST /api/auth/logout
```

el Refresh Token anterior no puede generar una nueva sesión.

---

# 181. Prueba crítica — desactivación

ADMIN desactiva a un usuario que tiene Access Token vigente.

Su siguiente petición deberá fallar porque el backend vuelve a comprobar:

```text
estado actual
+
sesión
```

---

# 182. Prueba crítica — SQL Injection

Entrada de búsqueda:

```text
%' OR 1=1 --
```

debe tratarse como un valor de búsqueda y nunca modificar la estructura SQL.

---

# 183. Invariantes

### SEC-INV-001

Todo dato externo se considera no confiable.

### SEC-INV-002

Toda entrada importante se valida en backend.

### SEC-INV-003

Toda consulta utiliza parámetros para valores externos.

### SEC-INV-004

No existe mass assignment de campos sensibles.

### SEC-INV-005

Nunca se almacenan contraseñas en texto plano.

### SEC-INV-006

Las contraseñas para bcrypt no superan su límite seguro de entrada.

### SEC-INV-007

Nunca se registran tokens o contraseñas en logs.

### SEC-INV-008

Nunca se exponen secretos en respuestas.

### SEC-INV-009

La cookie de Refresh Token es HttpOnly.

### SEC-INV-010

En producción, la cookie de Refresh Token utiliza Secure.

### SEC-INV-011

CORS solo acepta orígenes configurados.

### SEC-INV-012

Los endpoints autenticados por cookie validan origen.

### SEC-INV-013

La UI nunca sustituye controles de autorización backend.

### SEC-INV-014

Los errores inesperados no revelan detalles internos.

### SEC-INV-015

Las transacciones siempre hacen rollback ante error.

### SEC-INV-016

Las conexiones PostgreSQL siempre se liberan.

### SEC-INV-017

Los secretos nunca se versionan.

### SEC-INV-018

Cerrar sesión invalida realmente la sesión backend.

### SEC-INV-019

Cambiar usuario no conserva datos privados cacheados de la sesión anterior.

### SEC-INV-020

Una renovación de token no genera bucles infinitos ni múltiples rotaciones concurrentes desde el frontend.

---

# 184. Decisiones congeladas por SPEC-010

1. El backend es la principal frontera de confianza.
2. Toda entrada externa se valida.
3. Se separan validaciones estructurales de reglas de negocio.
4. Se utilizarán esquemas de validación reutilizables.
5. Se controlarán explícitamente los campos permitidos.
6. No habrá mass assignment.
7. Los IDs serán enteros positivos.
8. Las fechas tendrán validación sintáctica y calendario real.
9. La fecha de negocio utiliza `America/Guayaquil`.
10. Las contraseñas no se normalizan.
11. Contraseña mínima: 8 caracteres.
12. Contraseña para bcrypt: máximo 72 bytes UTF-8.
13. Todo SQL externo será parametrizado.
14. Ordenamientos dinámicos utilizarán listas blancas.
15. PostgreSQL utilizará una cuenta de aplicación sin privilegios innecesarios.
16. Secretos estarán en variables de entorno.
17. `.env` no se versionará.
18. Existirá `.env.example`.
19. Las variables críticas se validarán al arrancar.
20. Los Refresh Tokens se almacenan solo como hash.
21. Los tokens nunca aparecen en logs.
22. Access y Refresh Tokens no se guardan en almacenamiento web persistente.
23. Refresh Token utiliza cookie HttpOnly.
24. SameSite será `Strict` durante el MVP.
25. Secure será obligatorio en producción.
26. CORS tendrá origen explícito.
27. Se validará `Origin` en endpoints autenticados por cookie.
28. No añadiremos un token CSRF adicional durante el MVP local salvo cambio de arquitectura.
29. Se evitará `dangerouslySetInnerHTML`.
30. Se utilizarán headers HTTP de seguridad.
31. Se aplicará rate limiting.
32. Login: 5 intentos / 15 minutos como base.
33. Refresh tendrá un límite independiente.
34. Existirá límite de tamaño de body.
35. Se utilizará manejo centralizado de errores.
36. No se expondrán errores PostgreSQL ni stack traces.
37. Existirá logging seguro.
38. Cada petición podrá tener `requestId`.
39. Se utilizará un pool PostgreSQL.
40. Se liberarán conexiones en todos los caminos.
41. Se evitará `SELECT *` cuando pueda exponer datos innecesarios.
42. El frontend hará como máximo una renovación coordinada del Access Token.
43. Peticiones concurrentes esperarán esa renovación.
44. Logout limpia sesión y cachés de usuario.
45. Se versionará el lockfile de dependencias.
46. La seguridad deberá volver a revisarse antes de despliegue público.

---

# 185. Arquitectura transversal resultante

```text
┌─────────────────────────────────────┐
│                React                │
│                                     │
│ validación UX                       │
│ Access Token en memoria             │
│ refresh coordinado                  │
└────────────────┬────────────────────┘
                 │
                 │ HTTPS en producción
                 ▼
┌─────────────────────────────────────┐
│               Express               │
│                                     │
│ Request ID                          │
│ Headers de seguridad                │
│ CORS                                │
│ Origin / CSRF                       │
│ Rate limit                          │
│ Validación                          │
│ Autenticación                       │
│ Autorización                        │
│ Controladores                       │
│ Servicios                           │
│ Manejo central de errores           │
└────────────────┬────────────────────┘
                 │
                 │ SQL parametrizado
                 ▼
┌─────────────────────────────────────┐
│              PostgreSQL             │
│                                     │
│ PK / FK                             │
│ UNIQUE                              │
│ CHECK                               │
│ transacciones                       │
│ integridad                          │
└─────────────────────────────────────┘
```

---

# 186. Criterio de finalización de SPEC-010

Un aprendiz deberá poder explicar:

1. ¿Por qué no podemos confiar en React?
2. ¿Qué diferencia existe entre validación estructural y regla de negocio?
3. ¿Qué es mass assignment?
4. ¿Por qué se utiliza SQL parametrizado?
5. ¿Qué es SQL Injection?
6. ¿Por qué no concatenamos valores en SQL?
7. ¿Por qué una contraseña no debe normalizarse?
8. ¿Qué problema tiene bcrypt con entradas demasiado largas?
9. ¿Por qué hablamos de bytes UTF-8 y no solo caracteres?
10. ¿Dónde se almacenan los secretos?
11. ¿Por qué `.env` no se sube a Git?
12. ¿Qué diferencia existe entre CORS y autenticación?
13. ¿Qué es CSRF?
14. ¿Por qué Refresh necesita atención especial frente a CSRF?
15. ¿Qué hace HttpOnly?
16. ¿Qué hace SameSite?
17. ¿Cuándo debe utilizarse Secure?
18. ¿Qué es XSS?
19. ¿Por qué evitamos `dangerouslySetInnerHTML`?
20. ¿Para qué sirven los headers de seguridad?
21. ¿Qué es rate limiting?
22. ¿Qué significa HTTP 429?
23. ¿Por qué limitamos el tamaño del body?
24. ¿Por qué necesitamos un middleware central de errores?
25. ¿Qué información nunca debe llegar al navegador?
26. ¿Qué información nunca debe escribirse en logs?
27. ¿Qué es un request ID?
28. ¿Por qué utilizamos un pool PostgreSQL?
29. ¿Por qué siempre debemos liberar una conexión?
30. ¿Por qué un refresh rotatorio requiere coordinación en React?
31. ¿Qué debe ocurrir con los datos frontend después de logout?
32. ¿Por qué la seguridad deberá revisarse nuevamente antes de publicar la aplicación?

Cuando estas respuestas sean claras, `SPEC-010` queda definida.
