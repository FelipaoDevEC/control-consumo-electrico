# SPEC-012 — Estrategia de pruebas y criterios de aceptación del MVP

## 1. Objetivo

Definir cómo verificaremos que la aplicación cumple realmente las especificaciones anteriores.

Esta especificación establece:

* tipos de pruebas;
* alcance de cada tipo;
* datos de prueba;
* base de datos de pruebas;
* pruebas unitarias;
* pruebas de integración;
* pruebas de API;
* pruebas frontend;
* pruebas responsive;
* pruebas de accesibilidad;
* pruebas E2E;
* pruebas de seguridad;
* criterios de aceptación;
* Definition of Done del MVP.

El objetivo no será alcanzar una cifra artificial de cobertura.

El objetivo será demostrar que:

> las reglas importantes del sistema funcionan correctamente y continúan funcionando después de cambios futuros.

---

# 2. Principio principal

No probaremos únicamente:

```text
¿el código ejecuta?
```

También debemos probar:

```text
¿el comportamiento corresponde a la especificación?
```

---

# 3. Relación SDD → pruebas

Nuestro proceso será:

```text
SPEC
 ↓
Reglas
 ↓
Criterios de aceptación
 ↓
Casos de prueba
 ↓
Implementación
 ↓
Verificación
```

Ejemplo:

```text
SPEC-004

Regla:
una lectura no puede ser menor que la anterior
```

se convierte en:

```text
TEST:
si anterior = 12555
y nueva = 12550

entonces debe rechazarse.
```

---

# 4. Pirámide de pruebas

Utilizaremos diferentes niveles.

```text
              E2E
             /   \
            /     \
           Frontend
          /         \
       Integración API
      /               \
     Unitarias / Dominio
```

La mayoría de reglas simples deberán probarse en niveles rápidos.

Los E2E se reservarán para los flujos completos más importantes.

---

# 5. Tipos de pruebas

Tendremos:

```text
1. Unitarias
2. Integración
3. API
4. Frontend
5. Responsive
6. Accesibilidad
7. Seguridad
8. E2E
```

---

# 6. Herramientas previstas

Backend:

```text
Vitest
Supertest
```

Frontend:

```text
Vitest
React Testing Library
```

E2E:

```text
Playwright
```

---

# 7. Base de datos de pruebas

Las pruebas que interactúan con PostgreSQL deberán utilizar una base independiente.

Ejemplo:

```text
consumo_electrico_test
```

Nunca:

```text
consumo_electrico
```

de desarrollo.

---

# 8. Regla TEST-DB-001

Las pruebas automatizadas no podrán modificar accidentalmente la base de datos de desarrollo.

---

# 9. Configuración de pruebas

Conceptualmente:

```text
NODE_ENV=test
DB_NAME=consumo_electrico_test
```

---

# 10. Inicio de pruebas

Antes de ejecutar integración:

```text
crear/verificar BD de test
↓
aplicar migraciones
↓
limpiar datos necesarios
↓
insertar fixtures
↓
ejecutar pruebas
```

---

# 11. Aislamiento

Una prueba no deberá depender de que otra se haya ejecutado antes.

Incorrecto:

```text
test 1 crea usuario

test 2 supone que ese usuario sigue allí
```

Correcto:

```text
cada suite prepara explícitamente su estado
```

---

# 12. Datos deterministas

Las pruebas deberán utilizar datos conocidos.

Ejemplo:

```text
28/08 → 1000
29/08 → 1008
30/08 → 1015
```

Así sabemos exactamente qué esperar.

---

# 13. Tiempo determinista

Las reglas dependen de:

```text
hoy
ayer
fecha actual
```

Por tanto las pruebas no deberán depender ciegamente del reloj real.

---

# 14. Fecha controlada

En tests podremos fijar conceptualmente:

```text
fecha actual = 2026-08-30
timezone = America/Guayaquil
```

Así:

```text
ayer = 2026-08-29
```

siempre será predecible.

---

# 15. Zona horaria

Todas las pruebas relacionadas con fechas deberán considerar:

```text
America/Guayaquil
```

---

# 16. Unit tests

Las pruebas unitarias se utilizarán principalmente para lógica que no necesita:

```text
Express
PostgreSQL
React real
```

---

# 17. Ejemplos unitarios

```text
validar contraseña
normalizar correo
validar fecha
calcular cobertura
clasificar estados
formatear rangos internos
```

---

# 18. Pruebas de funciones puras

Si tenemos una función:

```text
calcularPromedio([5, 8, 12, 7])
```

esperamos:

```text
8
```

---

# 19. Promedio decimal

Entrada:

```text
[5, 6]
```

esperado:

```text
5.5
```

---

# 20. Null en promedio

Entrada conceptual:

```text
[5, null, 7]
```

esperado:

```text
6
```

No:

```text
4
```

---

# 21. Cero en promedio

Entrada:

```text
[0, 6]
```

esperado:

```text
3
```

El cero participa.

---

# 22. Máximo

```text
[5, 12, 7]
```

esperado:

```text
12
```

---

# 23. Empates

```text
Lunes → 10
Miércoles → 10
```

esperado:

```text
valor = 10
fechas = [lunes, miércoles]
```

---

# 24. Pruebas de validación de lectura

Casos:

```text
0        válido
12555    válido
-1       inválido
12555.5  inválido
"abc"    inválido
null     inválido
```

---

# 25. Pruebas de fecha

```text
2026-08-30 → válida
2026-02-31 → inválida
30/08/2026 → inválida para API
```

---

# 26. Pruebas de contraseña

Como mínimo:

```text
menos de 8 caracteres → inválida
8 caracteres → válida si cumple bytes
más de 72 bytes UTF-8 → inválida
```

---

# 27. Pruebas de correo

```text
" User@Test.com "
```

deberá normalizarse a:

```text
user@test.com
```

---

# 28. Integration tests

Las pruebas de integración verificarán:

```text
servicio
+
repositorio
+
PostgreSQL
```

cuando corresponda.

---

# 29. Objetivo

Comprobar reglas que dependen del estado real de los datos.

Ejemplo:

```text
lectura anterior
lectura siguiente
duplicados
último ADMIN
```

---

# 30. Lectura inicial

Estado:

```text
sin lecturas
```

crear:

```text
30/08 → 12500
```

esperado:

```text
registro creado
```

---

# 31. Segunda lectura

Estado:

```text
29/08 → 12500
```

crear:

```text
30/08 → 12508
```

esperado:

```text
válido
consumo derivado = 8
```

---

# 32. Lectura descendente

Estado:

```text
29/08 → 12500
```

crear:

```text
30/08 → 12490
```

esperado:

```text
LECTURA_MENOR_QUE_ANTERIOR
```

---

# 33. Lectura igual

```text
29/08 → 12500
30/08 → 12500
```

esperado:

```text
consumo = 0
```

---

# 34. Lectura duplicada

Ya existe:

```text
30/08 → 12555
```

se intenta:

```text
30/08 → 12556
```

esperado:

```text
409
LECTURA_FECHA_DUPLICADA
```

---

# 35. Inserción histórica válida

Estado:

```text
28 → 1000
30 → 1015
```

ADMIN agrega:

```text
29 → 1008
```

esperado:

```text
éxito
```

---

# 36. Histórica menor que anterior

```text
28 → 1000
30 → 1015

29 → 999
```

esperado:

```text
rechazo
```

---

# 37. Histórica mayor que siguiente

```text
29 → 1020
```

esperado:

```text
rechazo
```

---

# 38. Corrección válida

```text
28 → 1000
29 → 1008
30 → 1015
```

corregir:

```text
29 → 1010
```

esperado:

```text
válido
```

y después:

```text
29 → 10 kWh
30 → 5 kWh
```

---

# 39. Corrección inválida inferior

```text
29 → 990
```

rechazada.

---

# 40. Corrección inválida superior

```text
29 → 1020
```

rechazada.

---

# 41. Concurrencia de lectura

Dos operaciones simultáneas:

```text
A → 30/08 → 12555
B → 30/08 → 12556
```

esperado:

```text
1 éxito
1 conflicto
```

Nunca dos filas.

---

# 42. Pruebas de estadísticas

Dataset completo:

```text
23 → 1000
24 → 1005
25 → 1012
26 → 1018
27 → 1026
28 → 1032
29 → 1041
30 → 1048
```

---

# 43. Últimos 7 días

Esperado:

```text
24 → 5
25 → 7
26 → 6
27 → 8
28 → 6
29 → 9
30 → 7
```

---

# 44. Total

Esperado:

```text
48 kWh
```

---

# 45. Promedio

```text
48 / 7 = 6.857...
```

presentación aproximada:

```text
6.9 kWh
```

---

# 46. Máximo

```text
9 kWh
29/08
```

---

# 47. Mínimo

```text
5 kWh
24/08
```

---

# 48. Cobertura

```text
100 %
```

---

# 49. Dataset incompleto

```text
23 → 1000
24 → 1005
25 → 1012
26 → SIN LECTURA
27 → 1026
28 → 1032
29 → 1041
30 → 1048
```

---

# 50. Esperado

```text
24 → 5
25 → 7
26 → null
27 → null
28 → 6
29 → 9
30 → 7
```

---

# 51. Total acumulado

Continúa:

```text
48 kWh
```

si los bordes son conocidos.

---

# 52. Cobertura

```text
5/7
≈ 71 %
```

---

# 53. Regla crítica

Nunca devolver:

```text
26 → 7
27 → 7
```

ni otra interpolación inventada.

---

# 54. Período parcial

Si solo existen:

```text
26 → 1000
30 → 1040
```

para una ventana 24–30:

esperado:

```text
estado = PARCIAL
consumoObservado = 40
desdeObservado = 26/08
hastaObservado = 30/08
```

---

# 55. Sin datos

Cero lecturas.

Esperado:

```text
SIN_DATOS
```

sin excepción.

---

# 56. Una lectura

```text
30 → 12500
```

esperado:

```text
ultimaLectura = 12500
consumo = null
```

---

# 57. API tests

Supertest verificará el contrato HTTP de Express.

---

# 58. Login correcto

```http
POST /api/auth/login
```

credenciales válidas.

Esperado:

```text
200
usuario
accessToken
cookie Refresh
```

---

# 59. Login incorrecto

Esperado:

```text
401
AUTH_CREDENCIALES_INVALIDAS
```

---

# 60. Usuario inactivo

Esperado:

```text
403
AUTH_USUARIO_INACTIVO
```

---

# 61. Ruta protegida sin token

```http
GET /api/auth/me
```

sin JWT.

Esperado:

```text
401
```

---

# 62. JWT inválido

Esperado:

```text
401
```

---

# 63. Sesión revocada

JWT todavía no expiró, pero sesión está revocada.

Esperado:

```text
401
```

---

# 64. Refresh válido

Esperado:

```text
nuevo Access Token
nuevo Refresh Token
```

---

# 65. Rotación

Token anterior debe dejar de funcionar.

---

# 66. Logout

Después de:

```text
POST /api/auth/logout
```

refresh anterior:

```text
inválido
```

---

# 67. Roles

USUARIO intenta:

```http
POST /api/admin/usuarios
```

esperado:

```text
403
AUTH_SIN_PERMISO
```

---

# 68. ADMIN

Misma operación:

```text
permitida
```

si los datos son válidos.

---

# 69. Crear usuario duplicado

Esperado:

```text
409
USUARIO_CORREO_DUPLICADO
```

---

# 70. Último administrador

Un solo ADMIN activo.

Intentar:

```text
ADMIN → USUARIO
```

esperado:

```text
409
USUARIO_ULTIMO_ADMIN
```

---

# 71. Desactivación

Al desactivar usuario:

```text
sesiones revocadas
```

---

# 72. Cambio de rol

Esperado:

```text
sesiones revocadas
```

---

# 73. Restablecimiento de contraseña

Esperado:

```text
hash cambia
sesiones revocadas
contraseña anterior deja de funcionar
nueva contraseña funciona
```

---

# 74. Frontend tests

React Testing Library comprobará comportamiento visible desde la perspectiva del usuario.

---

# 75. Principio frontend

Preferiremos comprobar:

```text
qué ve
qué puede hacer
qué ocurre al interactuar
```

en lugar de:

```text
estado interno exacto del componente
```

---

# 76. LoginPage

Probar:

```text
campos visibles
labels
botón
errores
loading
login correcto
login incorrecto
```

---

# 77. Dashboard sin lecturas

Debe mostrar:

```text
Aún no existen datos de consumo.
Registrar primera lectura
```

No mostrar ceros falsos.

---

# 78. Dashboard con una lectura

Debe mostrar:

```text
Última lectura
```

y explicar que aún no hay suficiente información de consumo.

---

# 79. Dashboard con datos

Debe mostrar:

```text
Ayer
7 días
Mes
Año
```

con los valores entregados por API.

---

# 80. Estado parcial

Si API devuelve:

```text
estado = PARCIAL
```

la interfaz debe mostrar contexto.

---

# 81. Valor cero

Si API devuelve:

```text
consumo = 0
```

debe mostrarse:

```text
0 kWh
```

---

# 82. Null

Si:

```text
consumo = null
```

debe mostrarse:

```text
Sin datos
—
```

según componente.

No `0`.

---

# 83. Gráfico

Comprobar al menos:

```text
rango 7 días
cambio a Mes
cambio a Año
estado sin dato
```

---

# 84. Formulario de lectura

Probar:

```text
acepta entero
rechaza decimal
rechaza negativo
muestra loading
muestra error backend
confirma éxito
```

---

# 85. Historial

Probar:

```text
lista
base
normal
corregida
intervalo incompleto
paginación
filtros
```

---

# 86. Editar lectura

USUARIO en lectura de hoy:

```text
acción disponible
```

USUARIO en histórico:

```text
acción no disponible
```

---

# 87. Usuarios ADMIN

Probar:

```text
listado
crear
editar
desactivar
activar
restablecer contraseña
```

---

# 88. Usuario normal

No deberá visualizar navegación:

```text
Usuarios
```

---

# 89. Perfil

Probar:

```text
nombre
correo
rol
cambio tema
cambio contraseña
logout
```

---

# 90. Tema

Probar:

```text
SISTEMA
CLARO
OSCURO
```

---

# 91. Theme SYSTEM

Mock conceptual:

```text
prefers-color-scheme: dark
```

esperado:

```text
tema efectivo oscuro
```

---

# 92. Cambio del sistema

Si preferencia sigue:

```text
SISTEMA
```

un cambio de `prefers-color-scheme` debe modificar el tema efectivo.

---

# 93. Tema fijo

Si usuario seleccionó:

```text
OSCURO
```

un cambio del sistema a claro no debe modificarlo.

---

# 94. Pruebas de refresh frontend

Caso:

```text
API devuelve 401
```

frontend:

```text
hace refresh una vez
reintenta petición
```

---

# 95. Refresh concurrente

Varias peticiones reciben 401 simultáneamente.

Esperado:

```text
solo una llamada /auth/refresh
```

---

# 96. Refresh falla

Esperado:

```text
limpiar sesión
redirigir a login
```

---

# 97. Logout

Después:

```text
datos de usuario eliminados
dashboard anterior no permanece
```

---

# 98. Responsive tests

No pretendemos verificar todo CSS únicamente con tests unitarios.

La verificación real se realizará con:

```text
Playwright
+
viewports
```

---

# 99. Viewports mínimos

Referencias:

```text
320 × 568
375 × 667
768 × 1024
1024 × 768
1440 × 900
```

---

# 100. Pantallas responsive a verificar

```text
Login
Dashboard
Historial
Perfil
Usuarios
Formulario de usuario
Registro de lectura
```

---

# 101. Criterio responsive

En ninguno deberá existir:

```text
overflow horizontal accidental
texto cortado crítico
botón inaccesible
gráfico imposible de leer
```

---

# 102. Historial móvil

Debe cambiar de:

```text
tabla
```

a:

```text
tarjetas/filas adaptadas
```

---

# 103. Administración móvil

Listado usable sin comprimir una tabla desktop.

---

# 104. Pruebas de accesibilidad

Se verificará:

```text
labels
focus
teclado
contraste
nombres accesibles
estructura semántica
```

---

# 105. Navegación por teclado

Flujos básicos deberán poder recorrerse mediante:

```text
Tab
Shift+Tab
Enter
Escape
```

cuando corresponda.

---

# 106. Focus visible

Comprobar que botones, enlaces e inputs muestran foco.

---

# 107. Botones iconográficos

Ejemplo:

```text
+
```

debe tener nombre accesible:

```text
Registrar lectura
```

---

# 108. Formularios

Cada input debe tener una etiqueta asociada.

---

# 109. Modal

Si existe modal:

```text
focus entra
Escape funciona cuando procede
focus vuelve
```

---

# 110. Color

Los estados no deben comunicarse solo mediante:

```text
verde
rojo
amarillo
```

---

# 111. Datos faltantes

El gráfico deberá poseer alguna alternativa accesible para distinguir:

```text
0 kWh
```

de:

```text
sin dato
```

---

# 112. Pruebas de seguridad

Además de las funcionales, habrá pruebas específicas.

---

# 113. SQL Injection

Entradas como:

```text
' OR 1=1 --
```

deben tratarse como datos.

---

# 114. Mass assignment

Intentar enviar:

```json
{
  "rol": "ADMIN",
  "estado": "ACTIVO",
  "password_hash": "x",
  "id_usuario": 1
}
```

a un endpoint que no permita esos campos.

Resultado:

```text
no modifica campos prohibidos
```

---

# 115. Fecha futura

Backend debe rechazar incluso si frontend es manipulado.

---

# 116. Usuario normal y ADMIN API

Ocultar UI no basta.

Llamada administrativa directa:

```text
403
```

---

# 117. Cookie

Comprobar atributos esperados:

```text
HttpOnly
SameSite
Path
Secure según entorno
```

---

# 118. Origin

Refresh/logout desde origen no autorizado:

```text
rechazado
```

---

# 119. Body demasiado grande

Debe producir:

```text
413
```

---

# 120. Rate limit

Login excesivo:

```text
429
```

---

# 121. Error interno

Simular error inesperado.

Respuesta:

```text
500
ERROR_INTERNO
```

No debe contener:

```text
stack
SQL
secreto
```

---

# 122. Logs

Las pruebas o revisión automatizada deberán comprobar que no se impriman:

```text
password
Authorization completo
Refresh Token
JWT_SECRET
DB_PASSWORD
```

---

# 123. E2E

Playwright probará los flujos principales usando navegador real.

---

# 124. E2E-001 — Primer acceso

Precondición:

```text
ADMIN ya creado mediante script/fixture
```

Flujo:

```text
abrir login
↓
introducir credenciales
↓
iniciar sesión
↓
llegar al dashboard
```

Esperado:

```text
/dashboard
```

---

# 125. E2E-002 — Primera lectura

Flujo:

```text
login
↓
dashboard sin datos
↓
Registrar primera lectura
↓
12500
↓
guardar
```

Esperado:

```text
última lectura = 12500
consumos todavía sin datos
```

---

# 126. E2E-003 — Segunda lectura

Con lectura anterior:

```text
12500
```

registrar:

```text
12508
```

Esperado:

```text
gráfico muestra primer consumo conocido
```

---

# 127. E2E-004 — Lectura duplicada

Intentar registrar nuevamente la lectura del día.

Esperado:

```text
mensaje de lectura existente
```

---

# 128. E2E-005 — Corrección de hoy

USUARIO:

```text
abre lectura de hoy
↓
corrige valor
↓
guarda
```

Esperado:

```text
historial actualizado
dashboard actualizado
```

---

# 129. E2E-006 — USUARIO no corrige histórico

Flujo:

```text
USUARIO
↓
historial
↓
lectura pasada
```

Esperado:

```text
no existe acción de editar
```

Además API deberá tener su prueba 403 independiente.

---

# 130. E2E-007 — ADMIN corrige histórico

Flujo:

```text
ADMIN
↓
historial
↓
editar lectura pasada
↓
guardar
```

Esperado:

```text
consumo afectado recalculado
```

---

# 131. E2E-008 — Crear usuario

ADMIN:

```text
Usuarios
↓
Nuevo usuario
↓
completar datos
↓
guardar
```

Esperado:

```text
usuario aparece en listado
```

---

# 132. E2E-009 — Nuevo usuario inicia sesión

Cerrar sesión ADMIN.

Entrar con usuario creado.

Esperado:

```text
dashboard
sin menú Usuarios
```

---

# 133. E2E-010 — Desactivar usuario

ADMIN desactiva USUARIO.

Usuario intenta iniciar sesión.

Esperado:

```text
acceso rechazado
```

---

# 134. E2E-011 — Tema oscuro

Usuario:

```text
Perfil
↓
Apariencia
↓
Oscuro
```

Esperado:

```text
tema cambia
```

Recarga:

```text
tema sigue oscuro
```

---

# 135. E2E-012 — Tema sistema

Seleccionar:

```text
Sistema
```

simular preferencia del navegador.

Esperado:

```text
aplicación sigue sistema
```

---

# 136. E2E-013 — Logout

```text
logout
```

esperado:

```text
/login
```

Intentar volver a una ruta protegida:

```text
redirigido a login
```

---

# 137. E2E-014 — Responsive móvil

Viewport:

```text
375px
```

Verificar:

```text
dashboard usable
barra móvil
gráfico visible
registro de lectura accesible
sin scroll horizontal
```

---

# 138. E2E-015 — Historial móvil

Verificar:

```text
tarjetas
no tabla comprimida
detalle accesible
```

---

# 139. E2E-016 — ADMIN móvil

Verificar que pueda:

```text
acceder a Usuarios
crear usuario
editar
```

sin layout roto.

---

# 140. Datos de E2E

Los tests deberán crear o preparar un estado conocido.

No utilizarán cuentas reales personales.

---

# 141. Fixtures

Podremos tener helpers para:

```text
crearAdminTest
crearUsuarioTest
crearLecturasTest
limpiarBaseTest
```

---

# 142. Dataset base recomendado

Ejemplo:

```text
ADMIN
admin@test.local

USUARIO
usuario@test.local
```

con contraseñas exclusivamente de test.

---

# 143. Datos de lecturas base

```text
2026-08-23 → 1000
2026-08-24 → 1005
2026-08-25 → 1012
2026-08-26 → 1018
2026-08-27 → 1026
2026-08-28 → 1032
2026-08-29 → 1041
2026-08-30 → 1048
```

---

# 144. Dataset con hueco

```text
23 → 1000
24 → 1005
25 → 1012
26 → sin lectura
27 → 1026
28 → 1032
29 → 1041
30 → 1048
```

---

# 145. Dataset con cero

```text
29 → 1041
30 → 1041
```

Resultado esperado:

```text
0 kWh
```

---

# 146. Cobertura de código

Podremos medir cobertura.

Pero:

```text
100 % de cobertura
```

no será el objetivo principal.

---

# 147. Riesgo de cobertura

Un test puede ejecutar una línea sin comprobar correctamente su comportamiento.

Por tanto:

```text
cobertura ≠ calidad
```

---

# 148. Objetivo de cobertura

Se priorizará cobertura alta en:

```text
servicios
validadores
cálculos
seguridad
```

sin establecer inicialmente una meta artificial obligatoria para todos los archivos.

---

# 149. Áreas críticas

Estas reglas sí deben tener pruebas obligatorias:

```text
autenticación
roles
sesiones
lecturas
secuencia cronológica
concurrencia
estadísticas
último ADMIN
seguridad
```

---

# 150. No mockear todo

Si toda prueba reemplaza PostgreSQL, JWT, sesiones y servicios con mocks:

```text
podemos terminar probando nuestros mocks.
```

---

# 151. Estrategia

Utilizaremos:

```text
unitarias para lógica aislada
integración para DB/reglas reales
E2E para flujos completos
```

---

# 152. Mocks apropiados

Sí pueden usarse para:

```text
prefers-color-scheme
reloj
errores controlados
respuestas HTTP frontend unitarias
```

cuando aporten claridad.

---

# 153. Pruebas de migraciones

Una base vacía debe poder ejecutar:

```text
001
002
...
```

sin errores.

---

# 154. Migraciones repetidas

Una migración ya registrada no deberá volver a ejecutarse.

---

# 155. Seed

El seed del medidor deberá crear correctamente:

```text
Medidor principal
```

---

# 156. Idempotencia del setup

El procedimiento documentado de instalación deberá llevar siempre a un estado reproducible.

---

# 157. Build frontend

Antes de considerar una entrega válida:

```text
npm run build
```

debe completar sin errores.

---

# 158. Inicio backend

El backend deberá:

```text
iniciar correctamente
```

con configuración válida.

---

# 159. Configuración inválida

Si falta:

```text
JWT_SECRET
```

el backend debe fallar al arrancar de forma controlada.

---

# 160. Lint

Si incorporamos ESLint:

```text
npm run lint
```

debe pasar antes de cerrar una funcionalidad.

---

# 161. Tests

```text
npm test
```

o scripts equivalentes deberán quedar verdes.

---

# 162. Definition of Done de una SPEC

Una especificación implementada no se considera terminada únicamente porque:

```text
“funciona en mi navegador”
```

---

# 163. Para marcar una SPEC implementada

Debe cumplir:

```text
código implementado
+
tests relevantes
+
errores manejados
+
documentación actualizada
+
sin romper pruebas anteriores
```

---

# 164. Regresión

Cuando implementemos una nueva SPEC:

```text
todas las pruebas anteriores siguen pasando
```

---

# 165. Ejemplo

Implementar administración de usuarios no deberá romper:

```text
login
lecturas
dashboard
```

---

# 166. Matriz de trazabilidad

Mantendremos una relación conceptual:

| SPEC     | Funcionalidad    | Tipo de prueba          |
| -------- | ---------------- | ----------------------- |
| SPEC-003 | Login            | API + E2E               |
| SPEC-004 | Registro lectura | Integración + API + E2E |
| SPEC-005 | Estadísticas     | Unit + Integración      |
| SPEC-006 | Historial        | API + Frontend + E2E    |
| SPEC-007 | Dashboard        | Frontend + E2E          |
| SPEC-008 | Tema/Responsive  | Frontend + E2E          |
| SPEC-009 | Usuarios         | API + E2E               |
| SPEC-010 | Seguridad        | Integración + Seguridad |

---

# 167. Criterios de aceptación del MVP

El MVP estará funcionalmente completo cuando se cumplan todos los bloques siguientes.

---

# 168. A — Instalación

Debe poder:

```text
clonar repositorio
↓
instalar dependencias
↓
configurar .env
↓
crear PostgreSQL
↓
ejecutar migraciones
↓
ejecutar seed
↓
crear ADMIN
↓
iniciar backend
↓
iniciar frontend
```

siguiendo README.

---

# 169. B — Autenticación

Debe funcionar:

```text
login
refresh
logout
sesión
usuario activo/inactivo
```

---

# 170. C — Roles

Debe garantizar:

```text
ADMIN → administración
USUARIO → sin administración
```

también desde API.

---

# 171. D — Usuarios

ADMIN puede:

```text
crear
listar
editar
activar
desactivar
cambiar rol
restablecer password
```

---

# 172. E — Último ADMIN

El sistema nunca puede quedar con:

```text
0 administradores activos
```

incluso con operaciones concurrentes.

---

# 173. F — Lecturas

Se puede:

```text
registrar lectura
consultar
corregir
```

respetando permisos.

---

# 174. G — Enteros

Las lecturas:

```text
no admiten decimales
```

---

# 175. H — Una por día

No pueden existir:

```text
2 lecturas oficiales
para el mismo medidor
en la misma fecha
```

---

# 176. I — Secuencia

Siempre:

```text
anterior <= actual <= siguiente
```

cuando correspondan ambos límites.

---

# 177. J — Primera lectura

Se representa como:

```text
BASE
```

y no genera consumo falso.

---

# 178. K — Días faltantes

El sistema nunca:

```text
interpela
divide
estima
```

el consumo diario.

---

# 179. L — Cero vs null

Debe mantenerse:

```text
0 = consumo conocido de cero
null = consumo desconocido
```

---

# 180. M — Dashboard

Debe mostrar:

```text
Ayer
7 días
Mes
Año
Promedio
Mayor consumo
Última lectura
gráfico
```

---

# 181. N — Períodos parciales

Nunca mostrar un dato parcial como total completo.

---

# 182. O — Historial

Debe mostrar:

```text
fecha
lectura
consumo
creador
corrección
```

con filtros y paginación.

---

# 183. P — Tema

Debe funcionar:

```text
Sistema
Claro
Oscuro
```

y persistirse por usuario.

---

# 184. Q — Responsive

Las pantallas principales deben funcionar desde móvil hasta desktop.

---

# 185. R — Seguridad

Como mínimo:

```text
SQL parametrizado
contraseñas bcrypt
tokens protegidos
CORS
Origin validation
rate limiting
headers
errores seguros
logs sin secretos
```

---

# 186. S — Pruebas automatizadas

Los flujos críticos deben estar cubiertos y:

```text
tests verdes
```

---

# 187. T — Build

Frontend:

```text
build exitoso
```

Backend:

```text
arranque exitoso
```

---

# 188. Gate final del MVP

Antes de declarar:

```text
MVP COMPLETADO
```

deberá ejecutarse un gate final.

---

# 189. Gate backend

Debe pasar:

```text
lint
unit tests
integration tests
API tests
migraciones desde cero
```

---

# 190. Gate frontend

Debe pasar:

```text
lint
unit/component tests
build
```

---

# 191. Gate E2E

Los flujos críticos deberán pasar en navegador real.

---

# 192. Gate responsive

Verificar:

```text
320/375
768
1024
1440
```

sin problemas críticos.

---

# 193. Gate seguridad

Verificar:

```text
sin secretos en repo
sin password en logs
sin tokens en logs
SQL parametrizado
rutas ADMIN protegidas
cookies correctas
```

---

# 194. Gate documental

README deberá coincidir con la realidad.

Las SPEC deberán indicar claramente:

```text
diseñado
implementado
probado
```

cuando corresponda.

---

# 195. Estados de una SPEC

Durante implementación podremos marcar cada especificación como:

```text
DISEÑADA
EN_IMPLEMENTACION
IMPLEMENTADA
PROBADA
CERRADA
```

---

# 196. DISEÑADA

Existe especificación aprobada.

---

# 197. EN_IMPLEMENTACION

Existe trabajo de código activo.

---

# 198. IMPLEMENTADA

La funcionalidad está construida.

No implica todavía que haya pasado toda la verificación.

---

# 199. PROBADA

Las pruebas específicas pasan.

---

# 200. CERRADA

Cumple:

```text
implementación
pruebas
documentación
regresión
```

---

# 201. No falsear estado

No debemos decir:

```text
SPEC-005 completada
```

si solo existe el documento.

En ese caso:

```text
SPEC-005 DISEÑADA
```

---

# 202. Estado actual al terminar SPEC-012

En este momento tenemos:

```text
SPEC-000 → DISEÑADA
SPEC-001 → DISEÑADA
SPEC-002 → DISEÑADA
SPEC-003 → DISEÑADA
SPEC-004 → DISEÑADA
SPEC-005 → DISEÑADA
SPEC-006 → DISEÑADA
SPEC-007 → DISEÑADA
SPEC-008 → DISEÑADA
SPEC-009 → DISEÑADA
SPEC-010 → DISEÑADA
SPEC-011 → DISEÑADA
SPEC-012 → DISEÑADA
```

Todavía:

```text
NINGUNA está IMPLEMENTADA
```

porque aún no hemos creado el proyecto.

Esto es intencional.

---

# 203. Estrategia educativa de implementación

A partir de ahora cambiaremos de fase.

Hasta aquí:

```text
FASE DE ESPECIFICACIÓN
```

Después:

```text
FASE DE IMPLEMENTACIÓN
```

---

# 204. No implementar todo simultáneamente

Trabajaremos en checkpoints.

Propuesta:

```text
CHECKPOINT 0
Preparación del proyecto

CHECKPOINT 1
PostgreSQL y migraciones

CHECKPOINT 2
Backend base y seguridad

CHECKPOINT 3
Autenticación

CHECKPOINT 4
Administración usuarios

CHECKPOINT 5
Lecturas

CHECKPOINT 6
Estadísticas

CHECKPOINT 7
Frontend base

CHECKPOINT 8
Dashboard

CHECKPOINT 9
Historial

CHECKPOINT 10
Perfil y temas

CHECKPOINT 11
Responsive y accesibilidad

CHECKPOINT 12
E2E y cierre MVP
```

---

# 205. Cada checkpoint deberá terminar verde

Ejemplo:

```text
CHECKPOINT 5 — Lecturas
```

no se cerrará hasta tener:

```text
registro
corrección
permisos
transacciones
tests
```

funcionando.

---

# 206. No acumular deuda deliberadamente

No haremos:

```text
“después ponemos seguridad”
“después hacemos tests”
“después validamos”
```

si la SPEC correspondiente ya exige esas reglas.

---

# 207. Red-Green-Refactor cuando aplique

Para reglas claras podremos enseñar:

```text
RED
prueba falla

GREEN
implementación mínima pasa

REFACTOR
mejorar sin romper
```

Esto encaja muy bien con SDD.

---

# 208. Ejemplo

Regla:

```text
lectura decimal no permitida
```

Primero:

```text
crear test
↓
test falla
```

Luego implementar validación.

Después:

```text
test pasa
```

---

# 209. Evidencia de avance

Cada checkpoint podrá registrar:

```text
qué SPEC implementa
qué archivos modifica
qué tests añade
qué pruebas pasan
```

---

# 210. Ejemplo de reporte

```text
CHECKPOINT 5 — Lecturas

SPEC:
004

Implementado:
- POST /api/lecturas
- PATCH /api/lecturas/:id
- permisos
- locking

Tests:
18/18 PASS

Estado:
CERRADO
```

---

# 211. Invariantes de pruebas

### TEST-INV-001

Las pruebas nunca utilizan la base de desarrollo.

### TEST-INV-002

Cada prueba prepara su estado explícitamente.

### TEST-INV-003

Las reglas críticas tienen pruebas automatizadas.

### TEST-INV-004

Cero y null se prueban por separado.

### TEST-INV-005

Los días faltantes se prueban explícitamente.

### TEST-INV-006

La concurrencia se prueba en reglas donde sea importante.

### TEST-INV-007

Los roles se prueban también directamente contra API.

### TEST-INV-008

Ocultar un botón no cuenta como prueba de autorización.

### TEST-INV-009

Las pruebas E2E no sustituyen las unitarias ni de integración.

### TEST-INV-010

La cobertura no sustituye criterios de aceptación.

### TEST-INV-011

Una nueva funcionalidad no puede romper pruebas anteriores.

### TEST-INV-012

Una SPEC no se marca CERRADA sin pruebas relevantes.

### TEST-INV-013

El reloj y zona horaria deben ser controlables en pruebas.

### TEST-INV-014

El frontend debe probar refresh concurrente.

### TEST-INV-015

Los secretos nunca forman parte de fixtures reales.

---

# 212. Decisiones congeladas por SPEC-012

1. Vitest para pruebas principales.
2. Supertest para API.
3. React Testing Library para frontend.
4. Playwright para E2E.
5. Base PostgreSQL separada para tests.
6. Tests independientes.
7. Datos deterministas.
8. Fecha controlada.
9. Zona horaria America/Guayaquil.
10. Unit tests para lógica aislada.
11. Integración para reglas dependientes de PostgreSQL.
12. API tests para contrato HTTP.
13. Frontend tests desde perspectiva del usuario.
14. E2E para flujos completos.
15. Responsive probado con navegador real.
16. Accesibilidad forma parte de aceptación.
17. Seguridad tiene pruebas propias.
18. Concurrencia de lectura debe probarse.
19. Último ADMIN concurrente debe probarse.
20. Refresh concurrente frontend debe probarse.
21. SQL Injection debe verificarse.
22. Mass assignment debe verificarse.
23. No se exigirá 100 % de cobertura.
24. Sí se priorizará cobertura de reglas críticas.
25. Se probarán migraciones desde cero.
26. Se probará el build frontend.
27. Cada SPEC tendrá estado explícito.
28. Diseñada no significa implementada.
29. Cada checkpoint termina con regresión verde.
30. El MVP tendrá un gate final técnico, funcional, responsive, seguridad y documentación.

---

# 213. Definition of Done global del MVP

El proyecto podrá considerarse:

```text
MVP CERRADO
```

únicamente cuando:

```text
✅ PostgreSQL se instala mediante migraciones

✅ Existe un ADMIN inicial seguro

✅ Login funciona

✅ Refresh funciona

✅ Logout invalida sesión

✅ Roles funcionan

✅ ADMIN administra usuarios

✅ Último ADMIN está protegido

✅ Se registra una lectura diaria

✅ Lecturas son enteras

✅ No existen duplicados diarios

✅ Secuencia del medidor se conserva

✅ Usuario corrige hoy

✅ ADMIN corrige históricos

✅ No se eliminan lecturas

✅ Consumo se calcula correctamente

✅ Días faltantes no generan datos inventados

✅ Cero y null son distintos

✅ Dashboard funciona

✅ Historial funciona

✅ Mes y año funcionan

✅ Períodos parciales se identifican

✅ Tema Sistema funciona

✅ Tema Claro funciona

✅ Tema Oscuro funciona

✅ Preferencia se persiste por usuario

✅ Interfaz es responsive

✅ Interfaz es usable por teclado

✅ Seguridad transversal está aplicada

✅ Tests backend pasan

✅ Tests frontend pasan

✅ E2E críticos pasan

✅ Build pasa

✅ README permite instalar desde cero

✅ Documentación refleja el estado real
```

Solo entonces:

```text
MVP = COMPLETADO
```

---

# 214. Criterio de finalización de SPEC-012

Un aprendiz deberá poder responder:

1. ¿Cuál es la diferencia entre prueba unitaria, integración y E2E?
2. ¿Por qué los tests no usan la base de desarrollo?
3. ¿Por qué debemos controlar la fecha?
4. ¿Qué es un fixture?
5. ¿Qué significa que una prueba sea independiente?
6. ¿Por qué probamos cero y null por separado?
7. ¿Cómo probamos un día faltante?
8. ¿Cómo probamos concurrencia?
9. ¿Por qué no basta con ocultar opciones ADMIN en React?
10. ¿Qué debe probar Supertest?
11. ¿Qué debe probar React Testing Library?
12. ¿Qué debe probar Playwright?
13. ¿Qué significa cobertura de código?
14. ¿Por qué 100 % de cobertura no garantiza calidad?
15. ¿Qué es una regresión?
16. ¿Qué significa Definition of Done?
17. ¿Qué diferencia existe entre DISEÑADA e IMPLEMENTADA?
18. ¿Cuándo una SPEC puede considerarse CERRADA?
19. ¿Qué es un gate final?
20. ¿Qué debe pasar antes de declarar terminado el MVP?

Cuando estas respuestas estén claras, `SPEC-012` queda definida.
