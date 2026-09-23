# CHECKPOINT 4 — Administración de usuarios y protección del último ADMIN

## 1. Objetivo

Implementar el módulo administrativo definido en `SPEC-009`.

Al finalizar este checkpoint un `ADMIN` podrá:

* listar usuarios;
* buscar usuarios;
* filtrar por rol;
* filtrar por estado;
* consultar un usuario;
* crear usuarios;
* editar nombre y correo;
* cambiar rol;
* activar usuarios;
* desactivar usuarios;
* restablecer contraseñas;
* revocar sesiones cuando corresponda.

Además, el sistema garantizará que:

> siempre exista al menos un `ADMIN` activo.

Todavía NO implementaremos:

```text
frontend administrativo
lecturas
estadísticas
dashboard
historial visual
```

---

# 2. Precondiciones

Deben estar cerrados:

```text
CHECKPOINT 0 → CERRADO
CHECKPOINT 1 → CERRADO
CHECKPOINT 2 → CERRADO
CHECKPOINT 3 → CERRADO
```

Debe existir al menos:

```text
1 ADMIN ACTIVO
```

creado mediante:

```bash
npm run crear-admin
```

---

# 3. SPEC relacionadas

Principalmente:

```text
SPEC-003 → roles y sesiones
SPEC-009 → administración de usuarios
SPEC-010 → seguridad
SPEC-012 → pruebas
```

---

# 4. Arquitectura

```text
ADMIN
  │
  ▼
/api/admin/usuarios
  │
  ▼
autenticar
  │
  ▼
requerirRol('ADMIN')
  │
  ▼
validar
  │
  ▼
usuariosAdminController
  │
  ▼
usuariosAdminService
  │
  ├── usuariosRepository
  ├── sesionesRepository
  └── bcrypt
         │
         ▼
     PostgreSQL
```

---

# 5. Endpoints

Implementaremos:

```http
GET    /api/admin/usuarios
GET    /api/admin/usuarios/:id
POST   /api/admin/usuarios
PATCH  /api/admin/usuarios/:id
PATCH  /api/admin/usuarios/:id/estado
PUT    /api/admin/usuarios/:id/password
```

Todos requieren:

```text
autenticar
+
requerirRol('ADMIN')
```

---

# 6. Archivos principales

Crear:

```text
backend/src/controllers/
└── usuarios-admin.controller.js

backend/src/services/
└── usuarios-admin.service.js

backend/src/routes/
└── usuarios-admin.routes.js

backend/src/validators/
└── usuarios-admin.validators.js
```

Ampliaremos:

```text
usuarios.repository.js
sesiones.repository.js
error-codes.js
```

---

# 7. Listar usuarios

Endpoint:

```http
GET /api/admin/usuarios
```

---

# 8. Parámetros

Permitirá:

```text
pagina
limite
buscar
rol
estado
```

Ejemplo:

```http
GET /api/admin/usuarios
    ?pagina=1
    &limite=20
    &buscar=maria
    &rol=USUARIO
    &estado=ACTIVO
```

---

# 9. Valores por defecto

```text
pagina = 1
limite = 20
```

Máximo:

```text
100
```

---

# 10. Filtro `rol`

Permitidos:

```text
ADMIN
USUARIO
```

---

# 11. Filtro `estado`

Permitidos:

```text
ACTIVO
INACTIVO
```

---

# 12. Búsqueda

Buscará por:

```text
nombre
correo
```

ignorando mayúsculas/minúsculas.

---

# 13. SQL parametrizado

Conceptualmente:

```sql
WHERE (
    LOWER(nombre) LIKE $1
    OR LOWER(correo) LIKE $1
)
```

Nunca concatenaremos directamente:

```text
buscar
```

dentro del SQL.

---

# 14. Orden

Por defecto:

```text
ADMIN primero
USUARIO después
nombre ascendente
```

SQL conceptual:

```sql
ORDER BY
    CASE
        WHEN rol = 'ADMIN' THEN 0
        ELSE 1
    END,
    nombre ASC
```

---

# 15. Respuesta

```json
{
  "datos": [
    {
      "idUsuario": 1,
      "nombre": "Administrador",
      "correo": "admin@casa.local",
      "rol": "ADMIN",
      "estado": "ACTIVO",
      "tema": "SISTEMA",
      "creadoEn": "2026-08-31T..."
    }
  ],
  "paginacion": {
    "pagina": 1,
    "limite": 20,
    "total": 1,
    "totalPaginas": 1
  }
}
```

---

# 16. No devolver

Nunca:

```text
passwordHash
tokenHash
sesiones
refreshToken
```

---

# 17. Obtener usuario

Endpoint:

```http
GET /api/admin/usuarios/:id
```

---

# 18. ID inválido

Ejemplo:

```text
abc
-1
0
```

Resultado:

```text
422
VALIDACION_DATOS_INVALIDOS
```

---

# 19. Usuario inexistente

Resultado:

```http
404 Not Found
```

Código:

```text
USUARIO_NO_ENCONTRADO
```

---

# 20. Crear usuario

Endpoint:

```http
POST /api/admin/usuarios
```

Entrada:

```json
{
  "nombre": "María López",
  "correo": "maria@correo.com",
  "password": "ClaveInicialSegura",
  "rol": "USUARIO"
}
```

---

# 21. Campos aceptados

Solamente:

```text
nombre
correo
password
rol
```

---

# 22. Campos automáticos

El backend define:

```text
estado = ACTIVO
tema = SISTEMA
```

---

# 23. No aceptar desde cliente

```text
idUsuario
passwordHash
estado
tema
creadoEn
actualizadoEn
```

---

# 24. Validación

Nombre:

```text
obligatorio
trim
1–100 caracteres
```

Correo:

```text
obligatorio
formato válido
normalizado
máximo 254
```

Password:

```text
mínimo 8 caracteres
máximo 72 bytes UTF-8
```

Rol:

```text
ADMIN
USUARIO
```

---

# 25. Flujo creación

```text
validar ADMIN
↓
validar body
↓
normalizar correo
↓
buscar duplicado
↓
bcrypt
↓
INSERT usuario
↓
201
```

---

# 26. Contraseña

Debe reutilizar:

```text
hashPassword()
```

de CHECKPOINT 3.

No duplicar lógica bcrypt.

---

# 27. Correo duplicado

Respuesta:

```text
409
USUARIO_CORREO_DUPLICADO
```

---

# 28. Doble protección

Backend:

```text
consulta previa
```

PostgreSQL:

```text
ux_usuarios_correo_normalizado
```

---

# 29. Condición de carrera

Dos ADMIN pueden intentar crear simultáneamente:

```text
maria@correo.com
```

Ambos podrían pasar la consulta previa.

PostgreSQL seguirá protegiendo el `UNIQUE`.

---

# 30. Mapeo PostgreSQL

La violación del índice:

```text
ux_usuarios_correo_normalizado
```

debe convertirse en:

```text
409
USUARIO_CORREO_DUPLICADO
```

No devolver:

```text
23505
```

al cliente.

---

# 31. Creación exitosa

```http
201 Created
```

Respuesta:

```json
{
  "idUsuario": 2,
  "nombre": "María López",
  "correo": "maria@correo.com",
  "rol": "USUARIO",
  "estado": "ACTIVO",
  "tema": "SISTEMA"
}
```

---

# 32. Editar usuario

Endpoint:

```http
PATCH /api/admin/usuarios/:id
```

---

# 33. Campos permitidos

```text
nombre
correo
rol
```

---

# 34. PATCH real

No obliga a enviar los tres.

Ejemplo:

```json
{
  "nombre": "María Elena López"
}
```

---

# 35. Body vacío

Un:

```json
{}
```

deberá rechazarse.

Código:

```text
VALIDACION_DATOS_INVALIDOS
```

---

# 36. Mass assignment

Enviar:

```json
{
  "nombre": "María",
  "estado": "INACTIVO",
  "tema": "OSCURO",
  "password_hash": "..."
}
```

no debe modificar campos prohibidos.

Preferiblemente:

```text
422
```

por propiedades inesperadas.

---

# 37. Recomendación Zod

Utilizar:

```text
.strict()
```

en schemas sensibles.

Así los campos no permitidos son rechazados explícitamente.

---

# 38. Editar nombre

No afecta:

```text
sesiones
rol
password
```

---

# 39. Editar correo

Debe:

```text
normalizar
comprobar unicidad
```

---

# 40. Correo igual al actual

No debe considerarse conflicto.

Ejemplo:

```text
Maria@Correo.com
→
maria@correo.com
```

puede normalizarse sin error.

---

# 41. Cambio de rol

Puede ser:

```text
USUARIO → ADMIN
ADMIN → USUARIO
```

---

# 42. Efecto de cambiar rol

Después del cambio:

```text
revocar todas las sesiones del usuario
```

---

# 43. Por qué

Puede existir un JWT con:

```text
rol anterior
```

---

# 44. Operación transaccional

Cambio de rol debe ser:

```text
BEGIN
↓
bloqueos necesarios
↓
validar último ADMIN
↓
UPDATE rol
↓
revocar sesiones
↓
COMMIT
```

---

# 45. Regla del último ADMIN

Debe cumplirse siempre:

```text
cantidad ADMIN ACTIVO >= 1
```

---

# 46. Caso simple

Existe:

```text
José
ADMIN
ACTIVO
```

únicamente.

Intentar:

```text
José
ADMIN → USUARIO
```

Resultado:

```text
409
USUARIO_ULTIMO_ADMIN
```

---

# 47. Caso permitido

Existen:

```text
José  ADMIN ACTIVO
María ADMIN ACTIVO
```

José puede pasar a:

```text
USUARIO
```

---

# 48. Problema de concurrencia

Este código sería insuficiente:

```text
SELECT COUNT(*) ADMIN activos
↓
si count > 1
↓
UPDATE
```

sin bloqueo.

---

# 49. Ejemplo de carrera

Estado:

```text
José  ADMIN ACTIVO
María ADMIN ACTIVO
```

Petición A:

```text
José → USUARIO
```

Petición B:

```text
María → USUARIO
```

Ambas consultan:

```text
count = 2
```

Ambas podrían continuar.

Resultado incorrecto:

```text
0 ADMIN
```

---

# 50. Estrategia de bloqueo

Antes de cambiar rol o desactivar un ADMIN, la transacción deberá serializar la decisión.

Para este MVP podemos bloquear todos los usuarios ADMIN activos relevantes:

```sql
SELECT id_usuario
FROM usuarios
WHERE rol = 'ADMIN'
  AND estado = 'ACTIVO'
ORDER BY id_usuario
FOR UPDATE;
```

---

# 51. Por qué `ORDER BY`

Cuando múltiples transacciones bloquean varias filas es conveniente mantener un orden consistente.

Ayuda a reducir riesgo de deadlocks.

---

# 52. Después del bloqueo

Contar filas bloqueadas.

Si:

```text
cantidad <= 1
```

y el usuario objetivo dejará de ser ADMIN activo:

```text
rechazar
```

---

# 53. Resultado concurrente

Con dos administradores:

Primera transacción:

```text
bloquea ambos
↓
count = 2
↓
degrada uno
↓
COMMIT
```

Segunda:

```text
espera
↓
obtiene estado actualizado
↓
count = 1
↓
rechaza
```

Resultado:

```text
1 ADMIN ACTIVO
```

---

# 54. Protección centralizada

Crear en servicio una función conceptual:

```text
protegerUltimoAdministrador(...)
```

No duplicar la lógica entre:

```text
cambio de rol
desactivación
```

---

# 55. Desactivar usuario

Endpoint:

```http
PATCH /api/admin/usuarios/:id/estado
```

Entrada:

```json
{
  "estado": "INACTIVO"
}
```

---

# 56. Valores

Solo:

```text
ACTIVO
INACTIVO
```

---

# 57. Desactivar USUARIO

Flujo:

```text
BEGIN
↓
bloquear usuario
↓
estado = INACTIVO
↓
revocar sesiones
↓
COMMIT
```

---

# 58. Desactivar ADMIN

Además:

```text
bloquear ADMIN activos
↓
proteger último ADMIN
```

---

# 59. Estado ya igual

Si:

```text
usuario = INACTIVO
```

y se solicita:

```text
INACTIVO
```

recomendación:

```text
devolver estado actual
sin modificar actualizado_en innecesariamente
```

---

# 60. Activar usuario

```text
INACTIVO → ACTIVO
```

No restaura:

```text
sesiones antiguas
```

---

# 61. Después de activar

El usuario debe:

```text
login nuevamente
```

---

# 62. Desactivación de sesión actual propia

Si un ADMIN se desactiva a sí mismo y existe otro ADMIN:

```text
operación permitida
```

Pero:

```text
todas sus sesiones se revocan
```

incluida la actual.

---

# 63. Respuesta posterior

El `PATCH` actual puede completar correctamente.

La siguiente petición autenticada:

```text
fallará
```

---

# 64. Cambio de rol propio

Mismo principio.

Si:

```text
ADMIN → USUARIO
```

y hay otro ADMIN activo:

```text
permitido
```

pero la sesión actual se revoca.

---

# 65. Actualización de `actualizado_en`

Todo cambio real en usuario debe ejecutar:

```sql
actualizado_en = CURRENT_TIMESTAMP
```

---

# 66. Restablecer contraseña

Endpoint:

```http
PUT /api/admin/usuarios/:id/password
```

---

# 67. Entrada

```json
{
  "passwordNueva": "NuevaClaveSegura"
}
```

---

# 68. No recibir confirmación

El backend solo necesita:

```text
passwordNueva
```

La confirmación será responsabilidad del frontend.

---

# 69. Validaciones

Las mismas reglas:

```text
>= 8 caracteres
<= 72 bytes UTF-8
```

---

# 70. Flujo

```text
validar ADMIN
↓
buscar usuario
↓
hash password
↓
BEGIN
↓
actualizar password_hash
↓
actualizar actualizado_en
↓
revocar todas las sesiones
↓
COMMIT
```

---

# 71. No revelar password

Respuesta:

```text
204 No Content
```

---

# 72. Sesiones

Después:

```text
todas revocadas
```

---

# 73. Contraseña antigua

Debe dejar de funcionar.

---

# 74. Nueva contraseña

Debe permitir login si usuario sigue:

```text
ACTIVO
```

---

# 75. Reset propio

La API podría técnicamente permitir que un ADMIN use:

```text
/admin/usuarios/:suId/password
```

para sí mismo.

Pero según SPEC-009 preferimos:

```text
Perfil → /auth/password
```

---

# 76. Decisión

Backend rechazará el restablecimiento administrativo de la propia contraseña.

Código:

```text
USUARIO_PASSWORD_PROPIO_USAR_PERFIL
```

HTTP:

```text
409
```

Esto mantiene responsabilidades claras.

---

# 77. Alternativa

Si durante implementación esta regla añade ruido innecesario, puede permitirse técnicamente, pero la UI no la expondrá.

Para mantener la SPEC estricta:

```text
la rechazaremos.
```

---

# 78. Borrado de usuarios

No existe:

```http
DELETE /api/admin/usuarios/:id
```

---

# 79. Ruta inexistente

Intentar DELETE producirá:

```text
404
RUTA_NO_ENCONTRADA
```

o método no soportado según la configuración futura.

Nunca eliminará datos.

---

# 80. Repositorio de usuarios — operaciones nuevas

Agregar:

```text
listar
contar
buscarPorId
buscarPorCorreo
crear
actualizarDatos
actualizarRol
actualizarEstado
actualizarPassword
bloquearPorId
bloquearAdminsActivos
```

---

# 81. No crear función gigante

Evitar:

```text
actualizarUsuario(id, cualquierCosa)
```

que permita tocar columnas arbitrarias.

---

# 82. Queries explícitas

Ejemplo:

```text
actualizarEstado()
```

solo modifica:

```text
estado
actualizado_en
```

---

# 83. Servicio administrativo

Responsabilidades:

```text
crear usuario
listar
consultar
editar
cambiar estado
restablecer contraseña
proteger último ADMIN
revocar sesiones
```

---

# 84. Controlador

Responsabilidades:

```text
leer req.validated
leer req.usuario
llamar servicio
responder HTTP
```

---

# 85. Controlador NO hace

```text
bcrypt
SQL
COUNT admin
FOR UPDATE
```

---

# 86. Router

Conceptualmente:

```text
router.use(autenticar);
router.use(requerirRol('ADMIN'));
```

Después:

```text
GET /
GET /:id
POST /
PATCH /:id
PATCH /:id/estado
PUT /:id/password
```

---

# 87. Montaje

En:

```text
routes/index.js
```

```text
/api/admin/usuarios
```

---

# 88. Error codes nuevos

Agregar:

```text
USUARIO_NO_ENCONTRADO
USUARIO_CORREO_DUPLICADO
USUARIO_NOMBRE_INVALIDO
USUARIO_CORREO_INVALIDO
USUARIO_ROL_INVALIDO
USUARIO_ESTADO_INVALIDO
USUARIO_PASSWORD_INVALIDO
USUARIO_ULTIMO_ADMIN
USUARIO_PASSWORD_PROPIO_USAR_PERFIL
```

---

# 89. No duplicar validación

Algunos códigos pueden quedar absorbidos por:

```text
VALIDACION_DATOS_INVALIDOS
```

para errores estructurales.

---

# 90. Decisión

Usaremos:

```text
VALIDACION_DATOS_INVALIDOS
```

para:

```text
nombre inválido
correo con formato inválido
rol fuera de enum
estado fuera de enum
password estructural inválida
```

Y códigos específicos para conflictos:

```text
USUARIO_NO_ENCONTRADO
USUARIO_CORREO_DUPLICADO
USUARIO_ULTIMO_ADMIN
USUARIO_PASSWORD_PROPIO_USAR_PERFIL
```

Esto evita una explosión innecesaria de códigos.

---

# 91. SQL `SELECT *`

Continuamos evitando:

```sql
SELECT *
```

en respuestas administrativas.

---

# 92. Listado

Seleccionar solo:

```text
id_usuario
nombre
correo
rol
estado
tema
creado_en
actualizado_en
```

---

# 93. Password hash

Solo se selecciona en operaciones que realmente lo necesiten.

Administración normal:

```text
NO
```

---

# 94. Paginación SQL

Conceptualmente:

```text
LIMIT
OFFSET
```

Offset:

```text
(pagina - 1) * limite
```

---

# 95. Total

Se realizará consulta:

```text
COUNT(*)
```

con los mismos filtros.

---

# 96. No mezclar filtros

La consulta de datos y la de conteo deben aplicar:

```text
los mismos filtros
```

---

# 97. Pruebas de listado

Como mínimo:

```text
ADMIN lista → 200
USUARIO lista → 403
sin token → 401
paginación
búsqueda nombre
búsqueda correo
filtro rol
filtro estado
combinación filtros
```

---

# 98. Pruebas de creación

```text
crear USUARIO
crear ADMIN
correo normalizado
password almacenada como hash
estado ACTIVO
tema SISTEMA
correo duplicado
body inválido
campo inesperado
```

---

# 99. Test de password

Después de crear:

```text
password_hash != password original
```

y:

```text
bcrypt.compare(original, hash) = true
```

---

# 100. Tests de edición

```text
editar nombre
editar correo
editar ambos
cambiar rol
body vacío
campo prohibido
usuario inexistente
correo duplicado
```

---

# 101. Test sesiones por rol

Usuario tiene sesión activa.

ADMIN cambia:

```text
USUARIO → ADMIN
```

Esperado:

```text
sesión revocada
```

---

# 102. Test inverso

```text
ADMIN → USUARIO
```

con otro ADMIN activo.

Esperado:

```text
sesión revocada
```

---

# 103. Tests de último ADMIN

Caso:

```text
1 ADMIN activo
```

Intentar degradar:

```text
409
USUARIO_ULTIMO_ADMIN
```

---

# 104. Desactivar último ADMIN

También:

```text
409
```

---

# 105. Dos ADMIN

Desactivar uno:

```text
200
```

y queda:

```text
1 ADMIN activo
```

---

# 106. Concurrencia crítica

Crear:

```text
ADMIN A
ADMIN B
```

ambos activos.

Ejecutar simultáneamente:

```text
A → USUARIO
B → USUARIO
```

Resultado:

```text
una operación exitosa
una rechazada
```

---

# 107. Verificación DB

Después:

```sql
SELECT COUNT(*)
FROM usuarios
WHERE rol = 'ADMIN'
  AND estado = 'ACTIVO';
```

Esperado:

```text
1
```

---

# 108. Segunda concurrencia crítica

Dos operaciones simultáneas:

```text
desactivar A
desactivar B
```

Resultado también:

```text
1 ADMIN activo
```

---

# 109. Tercera combinación

```text
A → USUARIO
B → INACTIVO
```

simultáneamente.

Debe permanecer:

```text
>= 1 ADMIN activo
```

---

# 110. Esto es importante

No basta con probar:

```text
degradar/degradar
```

La invariante real es:

> ninguna combinación concurrente puede producir cero ADMIN activos.

---

# 111. Test activar usuario

Estado:

```text
INACTIVO
```

Cambiar:

```text
ACTIVO
```

Esperado:

```text
200
```

---

# 112. Sesiones anteriores

Siguen:

```text
revocadas
```

---

# 113. Test desactivar usuario

Usuario con sesión.

Después:

```text
estado = INACTIVO
sesión = revocada
```

---

# 114. JWT anterior

Intentar:

```text
GET /auth/me
```

debe fallar.

---

# 115. Test reset password

Después de reset:

```text
sesiones revocadas
```

Login:

```text
password anterior → 401
password nueva → 200
```

---

# 116. Usuario inactivo + reset

Restablecer password de un usuario inactivo:

```text
permitido
```

Pero sigue sin poder iniciar sesión hasta:

```text
ACTIVO
```

---

# 117. Test reset propio

ADMIN llama sobre su propio ID:

Esperado:

```text
409
USUARIO_PASSWORD_PROPIO_USAR_PERFIL
```

---

# 118. Test no DELETE

```text
DELETE /api/admin/usuarios/:id
```

no elimina el usuario.

---

# 119. Test trazabilidad

Usuario registrador futuro puede estar:

```text
INACTIVO
```

sin que se elimine su fila.

Todavía no hay lecturas reales, pero la FK ya protege este comportamiento.

---

# 120. No editar tema ajeno

Enviar:

```json
{
  "tema": "OSCURO"
}
```

a:

```text
PATCH /api/admin/usuarios/:id
```

debe ser rechazado.

---

# 121. No editar estado en PATCH general

Igual:

```json
{
  "estado": "INACTIVO"
}
```

debe rechazarse.

Usar:

```text
PATCH /:id/estado
```

---

# 122. No editar password general

```json
{
  "password": "..."
}
```

en PATCH general:

```text
rechazado
```

---

# 123. Ventaja

Cada operación tiene:

```text
una responsabilidad clara
```

---

# 124. Logging

Operaciones administrativas pueden registrar:

```text
requestId
idUsuarioActor
operación
idUsuarioObjetivo
resultado
```

---

# 125. Ejemplo permitido

```text
admin=1
action=USER_DEACTIVATED
target=2
```

---

# 126. No loggear

```text
passwordNueva
password_hash
```

---

# 127. Auditoría completa

No crearemos todavía:

```text
auditoria_usuarios
```

---

# 128. Motivo

SPEC no lo exige para el MVP.

Los logs y timestamps actuales son suficientes para este nivel.

---

# 129. Actualización del README

Documentar rutas administrativas.

Pero marcar:

```text
Backend implementado
Frontend pendiente
```

---

# 130. Ejemplo de documentación

```text
## Administración de usuarios

Requiere Access Token de ADMIN.

GET /api/admin/usuarios
POST /api/admin/usuarios
...
```

---

# 131. Smoke test manual

Usando ADMIN:

```text
1. login
2. crear USUARIO
3. listar
4. consultar
5. editar nombre
6. cambiar rol
7. login nuevamente con usuario
8. desactivar
9. comprobar login rechazado
10. activar
11. reset password
12. login con nueva password
```

---

# 132. Escenario doméstico final

Al cerrar este checkpoint podemos tener:

```text
Usuario 1:
Administrador
ADMIN
ACTIVO

Usuario 2:
Usuario Casa
USUARIO
ACTIVO
```

Esto coincide con el alcance inicial.

---

# 133. No necesitamos más usuarios

La arquitectura puede soportarlos.

El MVP real puede quedarse con:

```text
2 usuarios
```

---

# 134. Regresión autenticación

Ejecutar todas las pruebas de CHECKPOINT 3.

Deben seguir:

```text
PASS
```

---

# 135. Regresión DB

```bash
npm run db:check
npm run db:status
```

PASS.

---

# 136. Gate backend

```bash
npm run lint
npm test
```

PASS.

---

# 137. Coverage

Revisar especialmente:

```text
usuarios-admin.service.js
usuarios.repository.js
protección último ADMIN
```

---

# 138. Frontend

Como regresión:

```bash
cd ../frontend
npm run build
```

PASS.

---

# 139. No migración esperada

CHECKPOINT 4 debería poder implementarse con:

```text
usuarios
sesiones
```

existentes.

---

# 140. Si hace falta migración

Solo si aparece una necesidad legítima no cubierta.

No editar retroactivamente:

```text
001
002
```

---

# 141. Git status

Revisar:

```bash
git status
```

No debe aparecer:

```text
.env
.env.test
coverage
node_modules
```

---

# 142. Commit

Después del gate:

```bash
git add .
git status
```

Luego:

```bash
git commit -m "feat: implementar administracion de usuarios"
```

---

# 143. Working tree

Esperado:

```text
nothing to commit, working tree clean
```

---

# 144. Gate CHECKPOINT 4

### CP4-001

Existe router administrativo.

### CP4-002

Todas las rutas requieren autenticación.

### CP4-003

Todas requieren rol ADMIN.

### CP4-004

USUARIO recibe 403.

### CP4-005

Existe listado paginado.

### CP4-006

Existe búsqueda por nombre.

### CP4-007

Existe búsqueda por correo.

### CP4-008

Existe filtro por rol.

### CP4-009

Existe filtro por estado.

### CP4-010

Los filtros son parametrizados.

### CP4-011

Existe detalle de usuario.

### CP4-012

Usuario inexistente devuelve 404.

### CP4-013

ADMIN puede crear USUARIO.

### CP4-014

ADMIN puede crear ADMIN.

### CP4-015

Correo se normaliza.

### CP4-016

Password se almacena con bcrypt.

### CP4-017

Usuario nuevo nace ACTIVO.

### CP4-018

Usuario nuevo nace con tema SISTEMA.

### CP4-019

Correo duplicado devuelve 409.

### CP4-020

La DB sigue protegiendo duplicidad concurrente.

### CP4-021

PATCH permite nombre.

### CP4-022

PATCH permite correo.

### CP4-023

PATCH permite rol.

### CP4-024

PATCH no permite estado.

### CP4-025

PATCH no permite tema.

### CP4-026

PATCH no permite password/hash.

### CP4-027

Body vacío es rechazado.

### CP4-028

Campos inesperados son rechazados.

### CP4-029

Cambiar rol revoca sesiones.

### CP4-030

Existe endpoint de estado.

### CP4-031

Desactivar revoca sesiones.

### CP4-032

Activar no restaura sesiones antiguas.

### CP4-033

Último ADMIN no puede degradarse.

### CP4-034

Último ADMIN no puede desactivarse.

### CP4-035

Dos ADMIN permiten modificar uno.

### CP4-036

Protección último ADMIN es transaccional.

### CP4-037

Protección usa bloqueo.

### CP4-038

Concurrencia degradar/degradar conserva un ADMIN.

### CP4-039

Concurrencia desactivar/desactivar conserva un ADMIN.

### CP4-040

Concurrencia mixta conserva un ADMIN.

### CP4-041

Existe restablecimiento de contraseña.

### CP4-042

Password nueva utiliza bcrypt.

### CP4-043

Reset revoca sesiones.

### CP4-044

Password anterior deja de funcionar.

### CP4-045

Password nueva funciona.

### CP4-046

Reset no activa usuario inactivo.

### CP4-047

Reset administrativo propio es rechazado.

### CP4-048

No existe DELETE funcional de usuarios.

### CP4-049

No se devuelve `password_hash`.

### CP4-050

No se registran passwords en logs.

### CP4-051

Tests de listado pasan.

### CP4-052

Tests de creación pasan.

### CP4-053

Tests de edición pasan.

### CP4-054

Tests de estado pasan.

### CP4-055

Tests de último ADMIN pasan.

### CP4-056

Tests de concurrencia pasan.

### CP4-057

Tests de password pasan.

### CP4-058

Regresión de autenticación pasa.

### CP4-059

`npm run lint` pasa.

### CP4-060

`npm test` pasa.

### CP4-061

Frontend build sigue pasando.

### CP4-062

No existen secretos versionados.

### CP4-063

Existe commit del checkpoint.

### CP4-064

Working tree limpio.

---

# 145. Estado de SPEC-009

Después del gate:

```text
SPEC-009
Administración de usuarios
→ IMPLEMENTADA
→ PROBADA
```

Como todavía falta frontend administrativo:

```text
NO CERRADA
```

La parte backend estará completa.

---

# 146. Estado de SPEC-003

Ahora sí quedan implementadas las partes backend principales de:

```text
usuarios
roles
autenticación
sesiones
```

Podemos considerar:

```text
SPEC-003
→ IMPLEMENTADA
→ PROBADA
```

Su cierre final llegará después de integrar frontend y E2E.

---

# 147. Estado del roadmap

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
→ CERRADO

CHECKPOINT 5
Lecturas
→ SIGUIENTE

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

# 148. Qué podemos hacer al cerrar

El ADMIN puede:

```text
login
↓
crear segundo usuario
↓
editarlo
↓
cambiar rol
↓
desactivarlo
↓
activarlo
↓
restablecer contraseña
```

y el sistema conserva:

```text
al menos un ADMIN activo
```

---

# 149. Qué todavía falta

El sistema todavía no sabe:

```text
registrar una lectura
calcular consumo
mostrar dashboard
```

---

# 150. Siguiente checkpoint

```text
CHECKPOINT 5
Registro, consulta y corrección de lecturas
```

Será el bloque central del dominio.

Implementaremos:

```text
POST /api/lecturas
GET /api/lecturas
GET /api/lecturas/ultima
GET /api/lecturas/:id
PATCH /api/lecturas/:id

medidor principal
lectura anterior
lectura siguiente
una lectura por día
lecturas enteras
fecha local
ADMIN histórico
USUARIO solo hoy
FOR UPDATE
concurrencia
intervalos sin lectura
trazabilidad
tests
```

---

# 151. Criterio pedagógico

Un aprendiz deberá poder explicar:

1. ¿Por qué todas las rutas administrativas requieren dos middlewares?
2. ¿Por qué ADMIN crea las cuentas?
3. ¿Qué es un PATCH parcial?
4. ¿Qué es mass assignment?
5. ¿Por qué usamos schemas `.strict()`?
6. ¿Por qué el estado tiene un endpoint separado?
7. ¿Por qué el password tiene una operación separada?
8. ¿Por qué cambiar rol revoca sesiones?
9. ¿Por qué desactivar revoca sesiones?
10. ¿Por qué activar no recupera sesiones anteriores?
11. ¿Por qué no eliminamos usuarios físicamente?
12. ¿Qué significa “último ADMIN”?
13. ¿Por qué `COUNT(*)` sin transacción no es suficiente?
14. ¿Qué hace `FOR UPDATE`?
15. ¿Por qué bloqueamos los ADMIN en un orden consistente?
16. ¿Cómo evitamos que dos operaciones simultáneas dejen cero administradores?
17. ¿Por qué PostgreSQL sigue protegiendo correos duplicados aunque el backend valide antes?
18. ¿Por qué un ADMIN no modifica el tema de otro usuario?
19. ¿Qué ocurre al restablecer una contraseña?
20. ¿Por qué un usuario inactivo conserva sus datos históricos?

Cuando todos los `CP4-*` estén verdes:

```text
CHECKPOINT 4 → CERRADO
```
