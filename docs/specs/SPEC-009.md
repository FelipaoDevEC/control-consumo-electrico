# SPEC-009 — Administración de usuarios

## 1. Objetivo

Definir cómo un usuario con rol `ADMIN` podrá administrar las cuentas del sistema.

Esta especificación establece:

* listado de usuarios;
* creación de usuarios;
* edición de información básica;
* cambio de rol;
* activación;
* desactivación;
* restablecimiento administrativo de contraseña;
* protección del último administrador;
* permisos;
* experiencia responsive;
* estados de carga, vacío y error.

La administración de usuarios estará separada del perfil personal.

---

# 2. Principio principal

Solo un usuario con rol:

```text
ADMIN
```

puede administrar otras cuentas.

Un usuario con rol:

```text
USUARIO
```

no podrá acceder a este módulo ni ejecutar sus endpoints.

---

# 3. Ruta frontend

La sección administrativa utilizará:

```text
/admin/usuarios
```

Solo deberá ser accesible visualmente para:

```text
ADMIN
```

---

# 4. Protección real

Ocultar la opción en React no es suficiente.

La API también deberá comprobar:

```text
rol = ADMIN
```

en cada operación administrativa.

---

# 5. Operaciones

El módulo incluirá inicialmente:

```text
Listar usuarios
Crear usuario
Consultar usuario
Editar usuario
Cambiar estado
Restablecer contraseña
Cambiar rol
```

No incluirá eliminación física.

---

# 6. Endpoints

Se utilizarán los contratos definidos en SPEC-003:

```http
GET    /api/admin/usuarios
GET    /api/admin/usuarios/:id
POST   /api/admin/usuarios
PATCH  /api/admin/usuarios/:id
PATCH  /api/admin/usuarios/:id/estado
PUT    /api/admin/usuarios/:id/password
```

---

# 7. Listado

Pantalla conceptual:

```text
Usuarios

[ + Nuevo usuario ]

┌──────────────┬─────────────────────┬──────────┬──────────┐
│ Nombre       │ Correo              │ Rol      │ Estado   │
├──────────────┼─────────────────────┼──────────┼──────────┤
│ José         │ jose@correo.com     │ ADMIN    │ Activo   │
│ María        │ maria@correo.com    │ USUARIO  │ Activo   │
└──────────────┴─────────────────────┴──────────┴──────────┘
```

---

# 8. Información visible

Cada fila mostrará como mínimo:

```text
nombre
correo
rol
estado
```

Podrá mostrar además:

```text
fecha de creación
```

en detalle, no necesariamente en la tabla principal.

---

# 9. No mostrar datos sensibles

Nunca mostrar:

```text
password
password_hash
refresh token
token hash
sesiones
JWT
```

---

# 10. Orden inicial

Por defecto:

```text
ADMIN primero
luego USUARIO
```

y dentro de cada grupo:

```text
nombre ascendente
```

Esto es una preferencia de presentación, no una regla crítica de negocio.

---

# 11. Paginación

Aunque inicialmente habrá solo dos usuarios, el endpoint podrá admitir paginación para mantener consistencia.

Valores:

```text
pagina = 1
limite = 20
```

Máximo:

```text
100
```

---

# 12. Búsqueda

Durante el MVP sí puede ser útil una búsqueda simple por:

```text
nombre
correo
```

Ejemplo:

```http
GET /api/admin/usuarios?buscar=maria
```

---

# 13. Búsqueda normalizada

La búsqueda deberá ignorar:

```text
mayúsculas/minúsculas
espacios exteriores
```

cuando resulte razonable.

---

# 14. Filtro por estado

Podrá existir:

```text
Todos
Activos
Inactivos
```

---

# 15. Filtro por rol

Podrá existir:

```text
Todos
ADMIN
USUARIO
```

---

# 16. Crear usuario

Acción:

```text
Nuevo usuario
```

Formulario:

```text
Nombre
Correo
Contraseña inicial
Rol
```

Estado inicial:

```text
ACTIVO
```

Tema inicial:

```text
SISTEMA
```

---

# 17. Ejemplo de creación

```text
Nombre
María López

Correo
maria@correo.com

Contraseña inicial
************

Rol
USUARIO
```

---

# 18. Validación de nombre

El nombre:

* es obligatorio;
* no puede quedar vacío;
* máximo 100 caracteres.

---

# 19. Validación de correo

Debe:

* existir;
* normalizarse;
* no estar vacío;
* no duplicarse.

---

# 20. Validación de contraseña inicial

Debe cumplir SPEC-003:

```text
mínimo 8 caracteres
máximo 64 caracteres
```

---

# 21. Rol

Valores válidos:

```text
ADMIN
USUARIO
```

No se podrán enviar otros.

---

# 22. Creación exitosa

Respuesta:

```http
201 Created
```

La interfaz mostrará:

```text
Usuario creado correctamente.
```

---

# 23. Correo duplicado

Respuesta:

```http
409 Conflict
```

Código:

```text
USUARIO_CORREO_DUPLICADO
```

Mensaje:

```text
Ya existe un usuario con ese correo.
```

---

# 24. Edición

El ADMIN podrá modificar:

```text
nombre
correo
rol
```

---

# 25. Campos no editables desde este formulario

No se modificarán aquí:

```text
password
tema
estado
```

Cada uno tendrá su operación específica.

---

# 26. Motivo

Separar responsabilidades evita formularios ambiguos y operaciones difíciles de auditar.

---

# 27. Editar nombre

Ejemplo:

```text
María
→
María López
```

No afecta sesiones.

---

# 28. Editar correo

Ejemplo:

```text
maria1@correo.com
→
maria@correo.com
```

Debe volver a comprobar unicidad.

---

# 29. Cambiar rol

Ejemplo:

```text
USUARIO
→
ADMIN
```

o:

```text
ADMIN
→
USUARIO
```

---

# 30. Revocación de sesiones por cambio de rol

Después de un cambio de rol:

```text
revocar todas las sesiones activas
```

El usuario deberá volver a iniciar sesión.

---

# 31. Motivo

El Access Token anterior podría contener:

```text
rol antiguo
```

Por eso el cambio debe invalidar las sesiones existentes.

---

# 32. Protección del último ADMIN

Siempre debe existir:

```text
al menos 1 ADMIN ACTIVO
```

---

# 33. Caso inválido

Existe únicamente:

```text
José → ADMIN → ACTIVO
```

No podrá cambiarse a:

```text
José → USUARIO
```

---

# 34. Error

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

# 35. Cambio permitido

Si existen:

```text
José  → ADMIN → ACTIVO
María → ADMIN → ACTIVO
```

José puede convertirse en:

```text
USUARIO
```

porque continúa existiendo otro ADMIN activo.

---

# 36. Estado del usuario

Valores:

```text
ACTIVO
INACTIVO
```

---

# 37. Desactivar

Acción:

```text
Desactivar usuario
```

No elimina la cuenta.

---

# 38. Efecto de desactivar

Al pasar:

```text
ACTIVO
→
INACTIVO
```

deberá ocurrir:

```text
actualizar usuario
+
revocar sesiones activas
```

---

# 39. Usuario inactivo

No podrá:

```text
iniciar sesión
usar sesiones anteriores
acceder a endpoints protegidos
```

---

# 40. Historial de lecturas

Desactivar un usuario NO elimina:

```text
lecturas que registró
```

La trazabilidad debe conservarse.

---

# 41. Reactivar

El ADMIN podrá cambiar:

```text
INACTIVO
→
ACTIVO
```

---

# 42. Reactivar no restaura sesiones

Después de reactivarse, el usuario deberá:

```text
iniciar sesión nuevamente
```

---

# 43. Protección de último ADMIN al desactivar

Si el usuario es el único:

```text
ADMIN ACTIVO
```

no podrá desactivarse.

---

# 44. Autodesactivación

Un ADMIN podrá desactivarse a sí mismo solo si existe otro:

```text
ADMIN ACTIVO
```

---

# 45. UX recomendada para autodesactivación

La interfaz deberá advertir:

```text
Al desactivar tu cuenta se cerrará tu sesión.
```

---

# 46. Confirmación

Desactivar sí merece confirmación.

Ejemplo:

```text
¿Desactivar a María López?

No podrá iniciar sesión hasta que vuelva a activarse.

[ Cancelar ] [ Desactivar ]
```

---

# 47. Activar no necesita confirmación fuerte

Puede ser una acción directa con feedback:

```text
Usuario activado correctamente.
```

---

# 48. Restablecer contraseña

El ADMIN podrá asignar una contraseña nueva a otro usuario.

Acción:

```text
Restablecer contraseña
```

---

# 49. Formulario

```text
Nueva contraseña
Confirmar contraseña
```

---

# 50. No mostrar contraseña anterior

El ADMIN no conoce ni puede recuperar la contraseña anterior.

Solo puede:

```text
establecer una nueva
```

---

# 51. Hash

La nueva contraseña se almacenará mediante:

```text
bcrypt
```

Nunca en texto plano.

---

# 52. Efecto

Después de restablecer:

```text
revocar todas las sesiones
```

---

# 53. Mensaje

```text
Contraseña restablecida correctamente.
```

El usuario deberá iniciar sesión nuevamente.

---

# 54. ¿Puede ADMIN restablecer su propia contraseña?

Para su propia contraseña debe utilizar:

```text
Perfil → Cambiar contraseña
```

con validación de contraseña actual.

El endpoint administrativo se utilizará principalmente para otros usuarios.

---

# 55. Regla recomendada

La UI no mostrará:

```text
Restablecer contraseña
```

sobre la propia cuenta del ADMIN.

En su lugar ofrecerá:

```text
Cambiar mi contraseña
```

desde Perfil.

---

# 56. Borrado físico

No existirá:

```text
Eliminar usuario
```

durante el MVP.

---

# 57. Motivo

Una cuenta puede estar relacionada con:

```text
lecturas históricas
sesiones
auditoría
```

Desactivar conserva la trazabilidad.

---

# 58. Estado visual

Podremos utilizar badges:

```text
Activo
Inactivo
```

y:

```text
ADMIN
USUARIO
```

---

# 59. No depender solo del color

Ejemplo correcto:

```text
● Activo
```

con texto.

No únicamente un círculo verde.

---

# 60. Desktop

Vista:

```text
┌─────────────┬────────────────────┬──────────┬──────────┬─────────┐
│ Nombre      │ Correo             │ Rol      │ Estado   │ Acciones│
├─────────────┼────────────────────┼──────────┼──────────┼─────────┤
│ José        │ jose@correo.com    │ ADMIN    │ Activo   │ ⋯       │
│ María       │ maria@correo.com   │ USUARIO  │ Inactivo │ ⋯       │
└─────────────┴────────────────────┴──────────┴──────────┴─────────┘
```

---

# 61. Menú de acciones

Podrá contener:

```text
Ver / Editar
Cambiar estado
Restablecer contraseña
```

No necesitamos muchos botones visibles por fila.

---

# 62. Móvil

En móvil usaremos tarjetas.

Ejemplo:

```text
┌────────────────────────────┐
│ María López                │
│ maria@correo.com           │
│                            │
│ USUARIO        Activo      │
│                            │
│                    ⋯       │
└────────────────────────────┘
```

---

# 63. Formulario móvil

Los formularios ocuparán:

```text
una sola columna
```

---

# 64. Crear usuario en móvil

Puede abrirse como:

```text
pantalla completa
```

en lugar de un modal estrecho.

---

# 65. Desktop — formulario

Puede utilizar:

```text
modal amplio
drawer
o página
```

La implementación elegirá la opción más simple.

---

# 66. Recomendación

Para fines educativos y responsive:

```text
página dedicada o drawer
```

será preferible a múltiples modales complejos.

---

# 67. Estado vacío

Aunque normalmente existirá al menos el ADMIN inicial:

```text
No hay usuarios para mostrar.
```

puede utilizarse si los filtros no encuentran resultados.

---

# 68. Sin resultados

Si se busca:

```text
Roberto
```

y no existe:

```text
No encontramos usuarios con esos filtros.
```

---

# 69. Carga

Usar:

```text
skeleton
```

o filas de carga.

---

# 70. Error

```text
No se pudieron cargar los usuarios.
```

Acción:

```text
Reintentar
```

---

# 71. API — listado

Ejemplo:

```http
GET /api/admin/usuarios?pagina=1&limite=20&buscar=maria&estado=ACTIVO&rol=USUARIO
```

---

# 72. Respuesta

```json
{
  "datos": [
    {
      "idUsuario": 2,
      "nombre": "María López",
      "correo": "maria@correo.com",
      "rol": "USUARIO",
      "estado": "ACTIVO",
      "tema": "OSCURO",
      "creadoEn": "2026-08-30T19:00:00-05:00"
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

# 73. Tema en administración

El ADMIN puede ver la preferencia:

```text
tema
```

pero no necesita modificarla.

Cada usuario controla su propia apariencia.

---

# 74. No permitir que ADMIN cambie tema ajeno

Durante el MVP:

```text
tema
```

es una preferencia personal.

No habrá endpoint administrativo para modificarlo.

---

# 75. Consultar detalle

```http
GET /api/admin/usuarios/:id
```

Respuesta:

```json
{
  "idUsuario": 2,
  "nombre": "María López",
  "correo": "maria@correo.com",
  "rol": "USUARIO",
  "estado": "ACTIVO",
  "tema": "OSCURO",
  "creadoEn": "2026-08-30T19:00:00-05:00",
  "actualizadoEn": "2026-08-30T20:00:00-05:00"
}
```

---

# 76. Usuario inexistente

```http
404 Not Found
```

```text
USUARIO_NO_ENCONTRADO
```

---

# 77. Modificar

```http
PATCH /api/admin/usuarios/:id
```

Entrada posible:

```json
{
  "nombre": "María López",
  "correo": "maria@correo.com",
  "rol": "ADMIN"
}
```

---

# 78. PATCH parcial

No será necesario enviar todos los campos.

Ejemplo:

```json
{
  "nombre": "María Elena López"
}
```

---

# 79. Campos permitidos

Solo:

```text
nombre
correo
rol
```

---

# 80. Mass assignment

El backend no deberá hacer algo equivalente a:

```text
UPDATE usuario con todo req.body
```

sin filtrar.

---

# 81. Campos prohibidos

Un cliente no podrá modificar mediante ese endpoint:

```text
id_usuario
password_hash
estado
tema
creado_en
actualizado_en
```

---

# 82. Cambiar estado

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

# 83. Estado inválido

Ejemplo:

```text
BLOQUEADO
```

Respuesta:

```http
422
```

Código:

```text
USUARIO_ESTADO_INVALIDO
```

---

# 84. Restablecer contraseña

```http
PUT /api/admin/usuarios/:id/password
```

Entrada:

```json
{
  "passwordNueva": "NuevaClaveSegura"
}
```

---

# 85. Confirmación de contraseña

El backend no necesita recibir:

```text
confirmarPassword
```

como regla de seguridad.

Eso es una ayuda de interfaz.

React compara ambos campos antes de enviar.

---

# 86. API recibe una sola contraseña nueva

Así evitamos duplicar información sensible en la petición.

---

# 87. Transacción — cambio de rol

Debe incluir:

```text
BEGIN
↓
bloquear usuario objetivo
↓
si es ADMIN → validar último administrador
↓
actualizar rol
↓
revocar sesiones
↓
COMMIT
```

---

# 88. Transacción — desactivar

```text
BEGIN
↓
bloquear usuario
↓
si es ADMIN → validar último administrador
↓
estado = INACTIVO
↓
revocar sesiones
↓
COMMIT
```

---

# 89. Concurrencia en último administrador

Esta regla debe protegerse frente a dos administradores actuando simultáneamente.

Ejemplo:

```text
ADMIN A intenta degradar ADMIN B
ADMIN B intenta degradar ADMIN A
```

No debe ser posible terminar con:

```text
0 ADMIN activos
```

---

# 90. Estrategia

La implementación deberá utilizar una transacción con bloqueo apropiado sobre los usuarios ADMIN activos o una estrategia equivalente.

La comprobación:

```text
COUNT(*) > 1
```

sin protección frente a concurrencia no será suficiente.

---

# 91. Caso crítico

Estado:

```text
A = ADMIN ACTIVO
B = ADMIN ACTIVO
```

Dos operaciones simultáneas intentan:

```text
A → USUARIO
B → USUARIO
```

Resultado correcto:

```text
una puede completarse
la otra debe rechazarse
```

Resultado incorrecto:

```text
A = USUARIO
B = USUARIO
```

---

# 92. Prevención de auto bloqueo accidental

Si el ADMIN modifica su propio:

```text
rol
```

a `USUARIO`, y existe otro ADMIN activo, la operación puede permitirse.

Pero después:

```text
sus sesiones deben revocarse
```

por lo que perderá acceso administrativo inmediatamente.

---

# 93. UX para cambio de rol propio

Debe advertir:

```text
Al cambiar tu rol perderás acceso a la administración y tu sesión se cerrará.
```

---

# 94. No impedir operaciones legítimas

No debemos prohibir automáticamente:

```text
editar mi propio nombre
editar mi propio correo
```

desde administración si es ADMIN.

Pero las operaciones personales seguirán teniendo su lugar natural en Perfil.

---

# 95. Errores iniciales

```text
USUARIO_NO_ENCONTRADO
USUARIO_CORREO_DUPLICADO
USUARIO_NOMBRE_INVALIDO
USUARIO_CORREO_INVALIDO
USUARIO_ROL_INVALIDO
USUARIO_ESTADO_INVALIDO
USUARIO_PASSWORD_INVALIDO
USUARIO_ULTIMO_ADMIN
AUTH_SIN_PERMISO
```

---

# 96. Códigos HTTP

### 200

Consulta o modificación correcta.

### 201

Usuario creado.

### 401

No autenticado.

### 403

No es ADMIN.

### 404

Usuario inexistente.

### 409

Conflicto de negocio.

Ejemplos:

```text
correo duplicado
último administrador
```

### 422

Datos inválidos.

---

# 97. Feedback de creación

Después de crear:

```text
Usuario creado correctamente.
```

y regresar/refrescar listado.

---

# 98. Feedback de edición

```text
Usuario actualizado correctamente.
```

---

# 99. Feedback de desactivación

```text
Usuario desactivado.
```

---

# 100. Feedback de activación

```text
Usuario activado.
```

---

# 101. Feedback de contraseña

```text
Contraseña restablecida.
```

---

# 102. No revelar contraseña nueva después

Después de enviarla no debemos volver a mostrarla desde el backend.

---

# 103. Contraseña temporal

Durante el MVP no implementaremos un estado como:

```text
debeCambiarPassword
```

ni contraseña temporal expirable.

Esto podrá añadirse posteriormente.

---

# 104. Motivo

Para dos usuarios locales sería complejidad innecesaria.

---

# 105. Perfil vs administración

## Perfil propio

Permite:

```text
ver datos personales
cambiar tema
cambiar contraseña propia
cerrar sesión
```

## Administración

Permite:

```text
gestionar cuentas del sistema
```

No deben confundirse.

---

# 106. ADMIN y dashboard

La existencia del módulo Usuarios no modifica:

```text
dashboard eléctrico
```

Ambos roles continúan viendo las mismas estadísticas del hogar.

---

# 107. No dashboard administrativo paralelo

No crearemos:

```text
/dashboard-admin
```

durante el MVP.

---

# 108. Accesibilidad

La tabla y formularios deberán cumplir:

```text
labels reales
focus visible
acciones con nombres accesibles
estado no comunicado solo por color
navegación por teclado
```

---

# 109. Menús de acciones

El botón:

```text
⋯
```

deberá tener nombre accesible.

Ejemplo:

```text
aria-label="Acciones de María López"
```

---

# 110. Diálogos

Las confirmaciones deben:

```text
capturar foco
permitir Escape cuando proceda
retornar foco al cerrar
```

---

# 111. Pruebas de listado

```text
ADMIN puede listar
USUARIO recibe 403
lista vacía por filtro
búsqueda por nombre
búsqueda por correo
filtro por rol
filtro por estado
paginación
```

---

# 112. Pruebas de creación

```text
crear USUARIO
crear ADMIN
nombre vacío
correo vacío
correo duplicado
password corto
rol inválido
```

---

# 113. Pruebas de edición

```text
editar nombre
editar correo
editar rol
correo duplicado
usuario inexistente
campo no permitido
```

---

# 114. Pruebas de estado

```text
desactivar USUARIO
reactivar USUARIO
desactivar ADMIN con otro ADMIN activo
intentar desactivar último ADMIN
```

---

# 115. Pruebas de sesiones

Al:

```text
desactivar
cambiar rol
restablecer contraseña
```

se deben revocar las sesiones correspondientes.

---

# 116. Pruebas del último ADMIN

```text
un solo ADMIN → no degradar
un solo ADMIN → no desactivar
dos ADMIN → degradar uno
dos ADMIN → desactivar uno
```

---

# 117. Prueba crítica de concurrencia

Dos ADMIN activos.

Dos operaciones simultáneas intentan dejar a ambos sin rol ADMIN.

Resultado:

```text
siempre queda al menos un ADMIN ACTIVO
```

---

# 118. Prueba crítica de trazabilidad

Usuario:

```text
María
```

registró varias lecturas.

ADMIN la desactiva.

Las lecturas continúan mostrando:

```text
Registrado por María
```

---

# 119. Prueba crítica de contraseña

ADMIN restablece contraseña de María.

Después:

```text
sesión anterior de María deja de funcionar
contraseña anterior deja de funcionar
contraseña nueva funciona
```

---

# 120. Pruebas responsive

Verificar al menos:

```text
375 px
768 px
1024 px
1440 px
```

---

# 121. Invariantes

### ADM-INV-001

Solo ADMIN administra usuarios.

### ADM-INV-002

Nunca existe registro público mediante este módulo.

### ADM-INV-003

Nunca se devuelve `password_hash`.

### ADM-INV-004

Nunca se elimina físicamente un usuario durante el MVP.

### ADM-INV-005

Desactivar conserva las lecturas históricas.

### ADM-INV-006

Siempre existe al menos un ADMIN ACTIVO.

### ADM-INV-007

Cambiar rol revoca sesiones.

### ADM-INV-008

Desactivar revoca sesiones.

### ADM-INV-009

Restablecer contraseña revoca sesiones.

### ADM-INV-010

Reactivar no reactiva sesiones antiguas.

### ADM-INV-011

Tema es preferencia personal y ADMIN no lo modifica.

### ADM-INV-012

Los campos administrativos permitidos están explícitamente controlados.

### ADM-INV-013

El backend protege contra operaciones concurrentes que pudieran dejar cero administradores activos.

### ADM-INV-014

La UI nunca es la autoridad final de permisos.

---

# 122. Decisiones congeladas por SPEC-009

1. Existe `/admin/usuarios`.
2. Solo ADMIN accede.
3. Habrá listado.
4. Habrá búsqueda por nombre/correo.
5. Habrá filtros de rol y estado.
6. Habrá paginación.
7. ADMIN crea usuarios.
8. Usuarios nuevos nacen `ACTIVO`.
9. Usuarios nuevos nacen con tema `SISTEMA`.
10. ADMIN puede editar nombre, correo y rol.
11. Estado se cambia mediante operación separada.
12. Contraseña se restablece mediante operación separada.
13. No existe eliminación física.
14. Desactivar revoca sesiones.
15. Cambiar rol revoca sesiones.
16. Restablecer contraseña revoca sesiones.
17. Reactivar requiere nuevo login.
18. Siempre debe existir un ADMIN activo.
19. La protección del último ADMIN debe considerar concurrencia.
20. ADMIN no modifica el tema de otros usuarios.
21. La interfaz desktop usa tabla.
22. Móvil utiliza tarjetas.
23. Las acciones de administración no crean un dashboard separado.
24. Perfil y administración permanecen separados.
25. La creación y edición deben ser responsive y accesibles.

---

# 123. Resultado conceptual desktop

```text
┌─────────────┬────────────────────────────────────────────────────┐
│ Dashboard   │ Usuarios                            + Nuevo usuario │
│ Historial   │                                                    │
│ Perfil      │ [ Buscar... ] [ Rol ▼ ] [ Estado ▼ ]              │
│ Usuarios    │                                                    │
│             │ ┌─────────┬────────────────┬─────────┬──────────┐  │
│             │ │ Nombre  │ Correo         │ Rol     │ Estado   │  │
│             │ ├─────────┼────────────────┼─────────┼──────────┤  │
│             │ │ José    │ jose@...       │ ADMIN   │ Activo   │  │
│             │ │ María   │ maria@...      │ USUARIO │ Activo   │  │
│             │ └─────────┴────────────────┴─────────┴──────────┘  │
└─────────────┴────────────────────────────────────────────────────┘
```

---

# 124. Resultado conceptual móvil

```text
Usuarios

[ + Nuevo usuario ]

[ Buscar usuario ]

María López
maria@correo.com
USUARIO · Activo                         ⋯

José
jose@correo.com
ADMIN · Activo                           ⋯
```

---

# 125. Criterio de finalización de SPEC-009

Un aprendiz deberá poder responder:

1. ¿Quién puede administrar usuarios?
2. ¿Qué información muestra el listado?
3. ¿Cómo se crea una cuenta?
4. ¿Qué rol y estado puede tener?
5. ¿Qué campos puede editar el ADMIN?
6. ¿Por qué el estado tiene un endpoint separado?
7. ¿Por qué la contraseña tiene una operación separada?
8. ¿Qué ocurre al cambiar un rol?
9. ¿Qué ocurre al desactivar?
10. ¿Qué ocurre al reactivar?
11. ¿Qué ocurre al restablecer una contraseña?
12. ¿Por qué no eliminamos usuarios?
13. ¿Por qué conservamos usuarios inactivos?
14. ¿Qué es la regla del último administrador?
15. ¿Por qué esa regla necesita considerar concurrencia?
16. ¿Puede ADMIN modificar el tema de otra cuenta?
17. ¿Cuál es la diferencia entre Perfil y Administración?
18. ¿Por qué React no basta para proteger el módulo?
19. ¿Cómo cambia la experiencia en móvil?
20. ¿Qué pruebas críticas debe tener este módulo?

Cuando estas respuestas estén claras, `SPEC-009` queda definida.
