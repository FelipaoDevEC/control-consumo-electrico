# CHECKPOINT 12 — E2E, regresión integral y cierre oficial del MVP

## 1. Objetivo

Realizar la certificación final del MVP completo.

Este checkpoint verificará conjuntamente:

* PostgreSQL;
* migraciones;
* seeds;
* backend;
* autenticación;
* sesiones;
* roles;
* administración de usuarios;
* lecturas;
* estadísticas;
* frontend;
* dashboard;
* historial;
* perfil;
* temas;
* responsive;
* accesibilidad;
* seguridad;
* instalación desde cero;
* Git;
* documentación.

Al finalizar podremos decidir objetivamente si:

```text
MVP → COMPLETADO
```

o si todavía existen bloqueos que deben corregirse.

---

# 2. Regla fundamental

No añadiremos funcionalidades nuevas durante este checkpoint.

Permitido:

```text
corregir bugs
corregir regresiones
corregir accesibilidad
corregir seguridad
corregir documentación
corregir instalación
```

No permitido:

```text
agregar tarifas
agregar facturación
agregar IA
agregar múltiples medidores
agregar exportaciones
agregar notificaciones
```

---

# 3. Precondiciones

Deben estar cerrados:

```text
CHECKPOINT 0  → CERRADO
CHECKPOINT 1  → CERRADO
CHECKPOINT 2  → CERRADO
CHECKPOINT 3  → CERRADO
CHECKPOINT 4  → CERRADO
CHECKPOINT 5  → CERRADO
CHECKPOINT 6  → CERRADO
CHECKPOINT 7  → CERRADO
CHECKPOINT 8  → CERRADO
CHECKPOINT 9  → CERRADO
CHECKPOINT 10 → CERRADO
CHECKPOINT 11 → CERRADO
```

---

# 4. SPEC involucradas

Todas:

```text
SPEC-000
SPEC-001
SPEC-002
SPEC-003
SPEC-004
SPEC-005
SPEC-006
SPEC-007
SPEC-008
SPEC-009
SPEC-010
SPEC-011
SPEC-012
```

Este checkpoint es el gate transversal que permitirá cerrar formalmente las especificaciones.

---

# 5. Herramienta E2E

Utilizaremos:

```text
Playwright
```

---

# 6. Instalación

Desde el frontend o raíz, según organización definitiva:

```bash
npm install -D @playwright/test
```

Después:

```bash
npx playwright install
```

Para el MVP podremos instalar principalmente:

```text
Chromium
```

si queremos mantener el entorno inicial sencillo.

---

# 7. Navegador mínimo

Gate obligatorio:

```text
Chromium
```

---

# 8. Navegadores adicionales

Opcionalmente:

```text
Firefox
WebKit
```

podrán ejecutarse después.

No bloquearemos el MVP por compatibilidad adicional no especificada originalmente, salvo que aparezca un fallo claramente relacionado con estándares web.

---

# 9. Configuración Playwright

Crear:

```text
playwright.config.js
```

Debe definir:

* `baseURL`;
* servidor frontend;
* servidor backend cuando corresponda;
* screenshots en fallos;
* traces en fallos/reintentos;
* timeouts razonables;
* proyectos/viewports;
* ejecución aislada.

---

# 10. Entorno E2E

Nunca utilizar:

```text
consumo_electrico
```

de desarrollo cotidiano para pruebas destructivas.

Utilizaremos:

```text
consumo_electrico_test
```

o una base E2E específica.

---

# 11. Recomendación

Para máxima claridad:

```text
consumo_electrico_e2e
```

puede utilizarse como base exclusiva de Playwright.

---

# 12. Ventaja

Separar:

```text
desarrollo
tests integración
E2E
```

reduce riesgo de contaminación.

---

# 13. Regla crítica

Playwright jamás debe:

```text
borrar
editar
desactivar
cambiar contraseña
```

de usuarios reales de desarrollo por accidente.

---

# 14. Protección del entorno

Antes de ejecutar E2E:

```text
NODE_ENV=test
```

y la configuración deberá verificar que la base utilizada sea explícitamente de pruebas.

---

# 15. Setup E2E

Antes de la suite:

```text
crear/verificar base E2E
↓
aplicar migraciones
↓
ejecutar seed
↓
limpiar datos
↓
crear fixtures
```

---

# 16. Fixtures principales

Necesitamos al menos:

```text
ADMIN
USUARIO
MEDIDOR PRINCIPAL
```

---

# 17. Usuarios E2E

Ejemplo:

```text
admin.e2e@test.local
usuario.e2e@test.local
```

---

# 18. Contraseñas

Serán exclusivamente de test.

Nunca credenciales personales o de desarrollo.

---

# 19. Dataset eléctrico

Tendremos fixtures reproducibles.

Ejemplo continuo:

```text
25 Ago → 1000
26 Ago → 1005
27 Ago → 1012
28 Ago → 1018
29 Ago → 1026
30 Ago → 1032
31 Ago → 1041
01 Sep → 1048
```

---

# 20. Dataset con hueco

```text
28 Ago → 1000
30 Ago → 1015
```

---

# 21. Dataset con cero

```text
30 Ago → 1015
31 Ago → 1015
```

---

# 22. Aislamiento de tests

Cada escenario E2E importante debe:

```text
preparar estado
↓
ejecutar
↓
verificar
```

sin depender del test anterior.

---

# 23. No ordenar tests para que “funcionen”

Incorrecto:

```text
test 1 crea usuario
test 2 usa usuario del test 1
test 3 desactiva usuario del test 2
```

salvo que sea una única prueba de flujo deliberadamente completa.

---

# 24. Estrategia

Tendremos:

```text
tests independientes
+
algunos flujos completos
```

---

# 25. E2E-001 — Login ADMIN

Flujo:

```text
abrir /login
↓
escribir correo
↓
escribir contraseña
↓
Iniciar sesión
```

Esperado:

```text
/dashboard
```

---

# 26. Verificar

Debe aparecer:

```text
Dashboard
```

y navegación:

```text
Dashboard
Historial
Perfil
Usuarios
```

---

# 27. E2E-002 — Login USUARIO

Mismo flujo.

Esperado:

```text
/dashboard
```

pero NO:

```text
Usuarios
```

---

# 28. Protección real ADMIN

USUARIO intenta navegar manualmente:

```text
/admin/usuarios
```

Esperado:

```text
/403
```

---

# 29. API además

La prueba backend correspondiente ya confirma:

```text
403
```

Esta E2E confirma la experiencia completa.

---

# 30. E2E-003 — Credenciales incorrectas

Login con contraseña incorrecta.

Esperado:

```text
Correo o contraseña incorrectos.
```

Sin revelar si el correo existe.

---

# 31. E2E-004 — Usuario inactivo

Fixture:

```text
USUARIO INACTIVO
```

Intentar login.

Esperado:

```text
La cuenta se encuentra inactiva.
```

---

# 32. E2E-005 — Logout

ADMIN autenticado:

```text
Cerrar sesión
```

Esperado:

```text
/login
```

---

# 33. Después

Intentar:

```text
/dashboard
```

Esperado:

```text
/login
```

---

# 34. E2E-006 — Restauración después de F5

Login.

Recargar navegador:

```text
F5
```

Esperado:

```text
permanece autenticado
```

gracias al Refresh Token.

---

# 35. Verificar

No debe existir:

```text
flash permanente de login
```

ni cierre de sesión inesperado.

---

# 36. E2E-007 — Refresh automático

Para test E2E podremos utilizar una duración corta del Access Token.

Ejemplo entorno E2E:

```text
JWT_ACCESS_EXPIRES_IN=3s
```

---

# 37. Flujo

```text
login
↓
esperar expiración
↓
hacer petición protegida desde UI
```

Esperado:

```text
usuario continúa autenticado
```

sin intervención manual.

---

# 38. E2E-008 — Refresh concurrente

Provocar una vista que realice varias peticiones después de expiración.

Esperado:

```text
una sola llamada /auth/refresh
```

si Playwright intercepta/observa tráfico.

---

# 39. No debe ocurrir

```text
logout accidental
doble rotación
bucle 401
```

---

# 40. E2E-009 — Primera lectura

Base limpia sin lecturas.

Dashboard muestra:

```text
Aún no existen datos de consumo.
```

---

# 41. Acción

```text
Registrar primera lectura
```

Escribir:

```text
12500
```

Guardar.

---

# 42. Esperado

Dashboard muestra:

```text
Última lectura
12.500
```

y:

```text
Necesitamos una segunda lectura...
```

o mensaje equivalente.

---

# 43. No debe mostrar

```text
0 kWh
```

como consumo demostrado de la primera lectura.

---

# 44. E2E-010 — Registro diario normal

Preparar lectura de ayer:

```text
12500
```

Registrar hoy:

```text
12508
```

---

# 45. Esperado

Dashboard:

```text
8 kWh
```

en el dato correspondiente.

---

# 46. Historial

Debe mostrar también:

```text
8 kWh
```

---

# 47. E2E-011 — Consumo cero

Preparar:

```text
ayer = 12500
```

Registrar:

```text
hoy = 12500
```

Esperado:

```text
0 kWh
```

---

# 48. No debe mostrar

```text
—
Sin datos
```

---

# 49. E2E-012 — Lectura duplicada

Dos usuarios o fixture hacen que la lectura de hoy ya exista.

Segundo usuario intenta registrar.

Esperado:

```text
Ya existe una lectura registrada para hoy.
```

---

# 50. Dashboard se refresca

Debe reflejar la lectura existente.

---

# 51. E2E-013 — Lectura menor

Anterior:

```text
12555
```

Intentar:

```text
12550
```

Esperado:

```text
La lectura no puede ser inferior a la anterior.
```

---

# 52. E2E-014 — USUARIO no registra histórico

Desde UI normal no debe tener flujo de registro histórico.

---

# 53. Si intenta mediante ruta/acción forzada

Backend sigue respondiendo:

```text
403
```

---

# 54. E2E-015 — ADMIN registra histórico

Estado:

```text
28 → 1000
30 → 1015
```

ADMIN abre Historial.

Selecciona:

```text
Registrar lectura histórica
```

Agrega:

```text
29 → 1008
```

---

# 55. Esperado

Historial:

```text
29 → 8 kWh
30 → 7 kWh
```

---

# 56. E2E-016 — Intervalo incompleto

Antes de insertar 29:

```text
28 → 1000
30 → 1015
```

Esperado UI:

```text
30 Ago
Dato incompleto
15 kWh entre 28 y 30 Ago
```

---

# 57. No debe mostrar

```text
30 Ago → 15 kWh diarios
```

---

# 58. E2E-017 — Corrección de hoy por USUARIO

USUARIO abre lectura de hoy.

Editar.

Cambiar:

```text
1008 → 1010
```

si es válido.

Esperado:

```text
Lectura actualizada correctamente.
```

---

# 59. E2E-018 — USUARIO no corrige histórico

Abrir lectura pasada.

No debe existir:

```text
Editar
```

---

# 60. E2E-019 — ADMIN corrige histórico

Dataset:

```text
28 → 1000
29 → 1008
30 → 1015
```

ADMIN cambia:

```text
29 → 1010
```

---

# 61. Esperado

Historial:

```text
29 → 10 kWh
30 → 5 kWh
```

---

# 62. Esto certifica

Que el frontend no mantiene cálculos derivados obsoletos.

---

# 63. E2E-020 — Dashboard completo

Preparar dataset continuo de 7 días.

Verificar:

```text
Ayer
Últimos 7 días
Mes
Año
Promedio
Mayor consumo
Última lectura
Cobertura
```

---

# 64. Verificar números esperados

Los valores deben corresponder al fixture.

---

# 65. No utilizar asserts débiles

Evitar:

```text
“existe algún número”
```

---

# 66. Preferir

```text
esperamos exactamente 48 kWh
```

para dataset determinista.

---

# 67. E2E-021 — Dashboard con hueco

Dataset con lectura faltante.

Verificar:

```text
total acumulado correcto
cobertura parcial
gráfico con dato faltante
```

---

# 68. No debe subestimar

Si el total correcto es:

```text
48
```

no aceptar:

```text
34
```

por suma parcial.

---

# 69. E2E-022 — Cambio 7 días / Mes / Año

En dashboard:

```text
7 días
↓
Mes
↓
Año
```

---

# 70. Verificar

* gráfico cambia;
* no se rompe;
* no hay errores consola;
* meses futuros no aparecen como cero.

---

# 71. E2E-023 — Tema oscuro

Perfil:

```text
Oscuro
```

Verificar:

```text
data-theme=dark
```

y aplicación visual.

---

# 72. Navegar

```text
Dashboard
Historial
Perfil
Usuarios ADMIN
```

y comprobar que el tema persiste.

---

# 73. F5

Debe continuar oscuro.

---

# 74. E2E-024 — Tema claro

Mismo flujo.

---

# 75. E2E-025 — Tema sistema

Configurar contexto/browser con preferencia:

```text
dark
```

Tema:

```text
Sistema
```

Esperado:

```text
dark
```

---

# 76. Cambiar emulación a claro

Cuando sea técnicamente posible durante test:

Esperado:

```text
light
```

---

# 77. E2E-026 — Preferencia por usuario

Usuario A:

```text
OSCURO
```

Usuario B:

```text
CLARO
```

---

# 78. Verificar

Cada uno recupera su preferencia después de iniciar sesión.

---

# 79. E2E-027 — Cambio de contraseña

USUARIO:

```text
Perfil
↓
Cambiar contraseña
```

---

# 80. Introducir

```text
actual
nueva
confirmación
```

---

# 81. Esperado

Después:

```text
/login
```

con mensaje de volver a iniciar sesión.

---

# 82. Password antigua

Debe fallar.

---

# 83. Password nueva

Debe funcionar.

---

# 84. E2E-028 — ADMIN lista usuarios

Abrir:

```text
/admin/usuarios
```

Verificar:

```text
ADMIN
USUARIO
```

fixtures.

---

# 85. E2E-029 — Crear usuario

ADMIN crea:

```text
Nuevo Usuario
```

Esperado:

```text
aparece en listado
```

---

# 86. E2E-030 — Usuario nuevo inicia sesión

Cerrar ADMIN.

Login con usuario creado.

Esperado:

```text
/dashboard
```

sin menú administrativo.

---

# 87. E2E-031 — Editar usuario

ADMIN cambia nombre/correo.

Verificar listado y detalle.

---

# 88. E2E-032 — Cambiar rol

USUARIO:

```text
→ ADMIN
```

Esperado:

```text
Rol actualizado.
```

---

# 89. Sesión anterior del objetivo

Debe quedar revocada según backend.

---

# 90. E2E-033 — Desactivar usuario

ADMIN desactiva USUARIO.

Esperado:

```text
Inactivo
```

---

# 91. Usuario intenta login

Debe fallar.

---

# 92. E2E-034 — Reactivar usuario

ADMIN reactiva.

Usuario puede volver a login.

---

# 93. E2E-035 — Reset password

ADMIN restablece password de otro usuario.

---

# 94. Verificar

```text
password vieja falla
password nueva funciona
```

---

# 95. E2E-036 — Último ADMIN

Preparar exactamente:

```text
1 ADMIN ACTIVO
```

Intentar:

```text
degradarlo
```

Esperado:

```text
El sistema debe conservar al menos un administrador activo.
```

---

# 96. También

Intentar:

```text
desactivarlo
```

mismo resultado.

---

# 97. Concurrencia último ADMIN

La protección fuerte ya debe tener tests backend de integración.

No es obligatorio reproducir una carrera precisa mediante UI E2E.

---

# 98. Gate backend cubre esa concurrencia

Debe seguir verde.

---

# 99. E2E-037 — 403

USUARIO intenta URL administrativa manual.

Esperado:

```text
No tienes permisos...
```

---

# 100. E2E-038 — 404

Abrir:

```text
/ruta-que-no-existe
```

Esperado:

```text
Página no encontrada.
```

---

# 101. E2E-039 — Navegación por teclado

Flujo mínimo:

```text
Login
Dashboard
Registrar lectura
Historial
Perfil
```

usando teclado.

---

# 102. Verificar

Focus visible.

---

# 103. E2E-040 — Skip link

Con teclado desde inicio de página.

Debe aparecer:

```text
Saltar al contenido principal
```

---

# 104. Activarlo

Focus debe ir al contenido principal.

---

# 105. E2E-041 — Modal focus

Abrir modal de lectura.

Verificar:

```text
focus dentro
```

---

# 106. Tab

No debe escapar al contenido detrás.

---

# 107. Escape

Cierra.

---

# 108. Focus

Vuelve al botón que lo abrió.

---

# 109. E2E-042 — Responsive 320px

Viewport:

```text
320 × 568
```

Verificar:

```text
Login
Dashboard
Historial
Perfil
```

---

# 110. Sin overflow horizontal

Automáticamente:

```javascript
scrollWidth <= clientWidth
```

---

# 111. E2E-043 — Responsive 375px

Mismo gate.

---

# 112. E2E-044 — Tablet

```text
768 × 1024
```

---

# 113. E2E-045 — Desktop

```text
1440 × 900
```

---

# 114. E2E-046 — Historial móvil

Debe mostrar tarjetas, no una tabla ilegible.

---

# 115. E2E-047 — Usuarios móvil

ADMIN puede:

```text
listar
crear
editar
```

sin overflow.

---

# 116. E2E-048 — Reduced motion

Emular:

```text
prefers-reduced-motion: reduce
```

---

# 117. Verificar

Gráfico y transiciones reducen movimiento según implementación.

---

# 118. E2E-049 — Dark mode + móvil

Viewport móvil y oscuro conjuntamente.

---

# 119. Motivo

Muchos errores aparecen solo combinando estados.

---

# 120. E2E-050 — Cero vs null

Preparar dos escenarios.

### Escenario A

```text
consumo = 0
```

UI:

```text
0 kWh
```

### Escenario B

```text
consumo = null
```

UI:

```text
—
Sin dato
```

---

# 121. Esto es un gate crítico del producto

Si ambos se ven iguales:

```text
MVP NO puede cerrarse.
```

---

# 122. Consola del navegador

Durante suites no debe haber:

```text
console.error inesperado
unhandled rejection
React warning crítico
```

---

# 123. Estrategia

Playwright puede escuchar:

```text
page.on('console')
page.on('pageerror')
```

---

# 124. Fallos permitidos

Solo aquellos explícitamente esperados y documentados.

---

# 125. Network

No deben existir:

```text
requests 500 inesperados
loops de refresh
requests duplicadas de mutación
```

---

# 126. Seguridad — revisión de storage

En navegador autenticado:

```text
localStorage
sessionStorage
```

---

# 127. Permitido

```text
consumo-electrico-tema
```

---

# 128. Prohibido

```text
accessToken
refreshToken
password
JWT
usuario completo sensible
```

---

# 129. Cookie

Verificar:

```text
HttpOnly
SameSite=Strict
Path=/api/auth
```

---

# 130. Producción

`Secure` se verificará mediante configuración/test unitario si E2E local usa HTTP.

---

# 131. Seguridad — secretos en repositorio

Ejecutar revisión.

Buscar patrones como:

```text
JWT_SECRET=
DB_PASSWORD=
Bearer eyJ
BEGIN PRIVATE KEY
```

---

# 132. `.env.example`

Puede contener nombres vacíos.

No valores reales.

---

# 133. Git tracked files

Comprobar:

```bash
git ls-files
```

No debe incluir:

```text
.env
.env.test
.env.e2e
```

---

# 134. Logs

Revisar que tests/logs no expongan:

```text
password
JWT completo
Refresh Token
DB_PASSWORD
JWT_SECRET
```

---

# 135. SQL Injection gate

Las pruebas backend de:

```text
búsqueda usuario
filtros
lecturas
```

deben continuar verdes.

---

# 136. Mass assignment gate

Probar nuevamente endpoints críticos:

```text
usuarios
lecturas
```

---

# 137. Rate limiting

Prueba backend:

```text
login 5/15min
```

debe continuar verde.

---

# 138. CORS

Origen permitido.

Origen no permitido.

---

# 139. Origin refresh/logout

Pruebas verdes.

---

# 140. Headers seguridad

Smoke test Helmet.

---

# 141. Error handling

500 no expone stack.

---

# 142. Migraciones

Gate limpio desde base nueva.

---

# 143. Prueba crítica de instalación

Crear una base de datos nueva completamente vacía.

Ejemplo:

```text
consumo_electrico_install_test
```

---

# 144. Desde cero

Ejecutar:

```text
configurar entorno
npm install
npm run db:migrate
npm run db:seed
```

---

# 145. Esperado

Tablas:

```text
schema_migrations
usuarios
medidores
lecturas_medidor
sesiones
```

---

# 146. Migraciones

```text
001
002
```

o las que realmente existan al finalizar.

---

# 147. Seed

Exactamente un:

```text
Medidor principal
```

---

# 148. Ejecutar otra vez

```text
db:migrate
db:seed
```

No debe romper ni duplicar.

---

# 149. Primer ADMIN

En instalación limpia:

```bash
npm run crear-admin
```

debe funcionar.

---

# 150. Después

Login real con ese ADMIN.

---

# 151. Esto certifica

Que la aplicación no depende de:

```text
tu base personal
datos manuales
pasos olvidados de pgAdmin
```

---

# 152. README gate

Una persona nueva debe poder seguir:

```text
README.md
```

desde cero.

---

# 153. README debe incluir

```text
Requisitos
Node.js
PostgreSQL
Instalación
Variables entorno
Crear bases
Migraciones
Seed
Crear ADMIN
Ejecutar backend
Ejecutar frontend
Tests
Build
```

---

# 154. Estado del proyecto

README debe reflejar:

```text
MVP completado
```

solo después del gate verde.

---

# 155. No documentar comandos rotos

Todos los comandos documentados deben probarse.

---

# 156. Versiones

Documentar versiones mínimas/empleadas de:

```text
Node.js
PostgreSQL
```

---

# 157. No fijar una versión falsa

Usar la realmente certificada durante el cierre.

---

# 158. package-lock

Debe estar versionado en:

```text
backend
frontend
```

según estructura.

---

# 159. `npm install`

Debe ser reproducible.

---

# 160. Recomendación de gate reproducible

Cuando exista lockfile:

```bash
npm ci
```

es mejor para una instalación de certificación limpia.

---

# 161. Gate backend completo

Ejecutar:

```bash
cd backend

npm ci
npm run lint
npm test
npm run test:coverage
npm run db:check
npm run db:status
```

---

# 162. Todos deben pasar

Sin ignorar fallos.

---

# 163. Gate frontend completo

```bash
cd frontend

npm ci
npm run lint
npm test
npm run build
```

---

# 164. Playwright

Ejecutar:

```bash
npx playwright test
```

---

# 165. Reporte

Debe quedar:

```text
PASS
```

en los escenarios críticos.

---

# 166. No cerrar por “casi todo pasa”

Si una prueba crítica falla:

```text
MVP NO CERRADO
```

---

# 167. Clasificación de fallos

### Bloqueante

* login roto;
* pérdida de datos;
* cálculo incorrecto;
* permisos incorrectos;
* cero/null incorrectos;
* último ADMIN vulnerable;
* secreto expuesto;
* migración rota;
* responsive inutilizable.

### Importante

* foco roto;
* error UX significativo;
* tema inconsistente;
* gráfico ilegible.

### Menor

* pequeño detalle visual sin impacto funcional.

---

# 168. Cierre

No deben quedar:

```text
bloqueantes
```

ni problemas importantes sin aceptar explícitamente.

---

# 169. Auditoría de dependencias

Ejecutar:

```bash
npm audit
```

en backend y frontend.

---

# 170. Interpretación

No significa:

```text
actualizar todo ciegamente
```

---

# 171. Prioridad

No deben quedar vulnerabilidades conocidas:

```text
high
critical
```

directamente explotables en dependencias utilizadas, sin evaluación/documentación.

---

# 172. Si existe una vulnerabilidad

Evaluar:

```text
afecta runtime?
hay fix compatible?
rompe stack?
```

---

# 173. No ejecutar

```bash
npm audit fix --force
```

ciegamente.

---

# 174. Git gate

Antes del cierre:

```bash
git status
```

Debe estar:

```text
clean
```

---

# 175. Revisar historial

```bash
git log --oneline
```

Debe mostrar checkpoints coherentes.

---

# 176. Commits esperados conceptualmente

```text
chore: inicializar estructura del proyecto
feat: configurar PostgreSQL y migraciones iniciales
feat: establecer seguridad base del backend
feat: implementar autenticacion y sesiones
feat: implementar administracion de usuarios
feat: implementar registro y gestion de lecturas
feat: implementar motor de estadisticas
feat: implementar autenticacion y navegacion frontend
feat: implementar dashboard de consumo
feat: implementar historial y correccion de lecturas
feat: implementar perfil y sistema de temas
feat: cerrar responsive y accesibilidad del frontend
```

---

# 177. Los hashes reales no importan a la SPEC

Lo importante es:

```text
trazabilidad
```

---

# 178. Commit final

Después de corregir todos los hallazgos y pasar el gate:

```bash
git add .
git status
```

Revisar.

Después:

```bash
git commit -m "test: certificar cierre del mvp"
```

si existen cambios documentales/tests asociados.

---

# 179. Si no existen cambios

No crear commit vacío solo por estética.

---

# 180. Tag

Una vez totalmente cerrado podemos crear:

```bash
git tag -a v0.1.0 -m "MVP consumo electrico"
```

---

# 181. ¿Es obligatorio?

No.

Pero es útil pedagógicamente para señalar:

```text
primer producto completo
```

---

# 182. Decisión recomendada

Sí utilizar:

```text
v0.1.0
```

para el MVP local.

---

# 183. No confundir

```text
v0.1.0
```

con:

```text
producción pública
```

---

# 184. El MVP sigue siendo inicialmente local

Publicarlo en Internet requerirá un checkpoint/fase posterior de despliegue.

---

# 185. Matriz final de SPEC

Después del gate verde:

```text
SPEC-000 → CERRADA
SPEC-001 → CERRADA
SPEC-002 → CERRADA
SPEC-003 → CERRADA
SPEC-004 → CERRADA
SPEC-005 → CERRADA
SPEC-006 → CERRADA
SPEC-007 → CERRADA
SPEC-008 → CERRADA
SPEC-009 → CERRADA
SPEC-010 → CERRADA
SPEC-011 → CERRADA
SPEC-012 → CERRADA
```

---

# 186. ¿Qué significa CERRADA?

No significa:

```text
nunca volveremos a modificarla
```

Significa:

```text
su alcance MVP está implementado,
probado y documentado.
```

---

# 187. Nueva funcionalidad futura

No se mete silenciosamente dentro de una SPEC cerrada.

Se crea:

```text
nueva SPEC
```

o una versión formal de la especificación.

---

# 188. Definition of Done final

Para declarar:

```text
MVP COMPLETADO
```

deben cumplirse todos los siguientes bloques.

---

# 189. Gate A — Persistencia

```text
✅ PostgreSQL operativo
✅ migraciones reproducibles
✅ schema_migrations correcto
✅ seed idempotente
✅ constraints activos
✅ base limpia instalable
```

---

# 190. Gate B — Autenticación

```text
✅ login
✅ bcrypt
✅ JWT
✅ refresh
✅ rotación
✅ logout
✅ sesiones
✅ usuario inactivo
✅ cambio contraseña
```

---

# 191. Gate C — Roles

```text
✅ ADMIN
✅ USUARIO
✅ backend protege permisos
✅ frontend refleja permisos
✅ último ADMIN protegido
```

---

# 192. Gate D — Usuarios

```text
✅ listar
✅ buscar
✅ filtrar
✅ crear
✅ editar
✅ activar
✅ desactivar
✅ cambiar rol
✅ reset password
✅ frontend responsive
```

---

# 193. Gate E — Lecturas

```text
✅ primera lectura
✅ lectura diaria
✅ enteros
✅ sin negativos
✅ una por día
✅ fechas no futuras
✅ secuencia
✅ ADMIN históricos
✅ corrección
✅ concurrencia
```

---

# 194. Gate F — Consumo

```text
✅ consumo diario
✅ cero
✅ null
✅ intervalos
✅ sin interpolación
✅ sin consumo inventado
```

---

# 195. Gate G — Estadísticas

```text
✅ ayer
✅ 7 días
✅ mes
✅ año
✅ promedio
✅ máximo
✅ cobertura
✅ períodos parciales
✅ series
```

---

# 196. Gate H — Dashboard

```text
✅ tarjetas reales
✅ gráfico
✅ 7 días
✅ mes
✅ año
✅ lectura de hoy
✅ registro rápido
✅ estados vacíos
✅ estados parciales
```

---

# 197. Gate I — Historial

```text
✅ filtros
✅ paginación
✅ detalle
✅ trazabilidad
✅ corrección
✅ registro histórico ADMIN
✅ desktop
✅ móvil
```

---

# 198. Gate J — Perfil y temas

```text
✅ perfil
✅ cambio password
✅ Sistema
✅ Claro
✅ Oscuro
✅ persistencia usuario
✅ persistencia local visual
✅ F5
```

---

# 199. Gate K — Responsive

```text
✅ 320px
✅ 375px
✅ 768px
✅ 1024px
✅ 1440px
✅ sin overflow crítico
```

---

# 200. Gate L — Accesibilidad

```text
✅ teclado
✅ focus
✅ labels
✅ headings
✅ modales
✅ skip link
✅ contraste
✅ reduced motion
✅ gráfico accesible
```

---

# 201. Gate M — Seguridad

```text
✅ SQL parametrizado
✅ no mass assignment
✅ CORS
✅ Origin
✅ HttpOnly
✅ SameSite
✅ Secure producción
✅ rate limiting
✅ Helmet
✅ body limit
✅ errores seguros
✅ logs seguros
✅ sin secretos
```

---

# 202. Gate N — Calidad

```text
✅ backend lint
✅ backend tests
✅ frontend lint
✅ frontend tests
✅ frontend build
✅ Playwright
✅ npm audit revisado
```

---

# 203. Gate O — Git

```text
✅ commits coherentes
✅ working tree limpio
✅ secretos fuera
✅ lockfiles incluidos
```

---

# 204. Gate P — Documentación

```text
✅ README reproducible
✅ SPEC actualizadas
✅ estado real
✅ comandos verificados
✅ QA documentado
```

---

# 205. Checklist crítico de producto

Antes de cerrar, responder:

### ¿Puede el usuario introducir decimales?

```text
NO
```

### ¿Puede haber dos lecturas del mismo día?

```text
NO
```

### ¿Puede USUARIO cambiar históricos?

```text
NO
```

### ¿Puede ADMIN corregir históricos?

```text
SÍ
```

### ¿El sistema inventa consumos si falta un día?

```text
NO
```

### ¿0 y null son diferentes?

```text
SÍ
```

### ¿Puede quedar el sistema con cero ADMIN activos?

```text
NO
```

### ¿Los tokens están en localStorage?

```text
NO
```

### ¿El tema puede estar en localStorage?

```text
SÍ
```

### ¿Existe un único medidor en el MVP?

```text
SÍ
```

---

# 206. Criterios CP12

### CP12-001

Playwright instalado/configurado.

### CP12-002

Existe entorno E2E aislado.

### CP12-003

La base E2E no es desarrollo.

### CP12-004

Migraciones funcionan desde cero.

### CP12-005

Seed funciona desde cero.

### CP12-006

Seed es idempotente.

### CP12-007

Primer ADMIN puede crearse desde instalación limpia.

### CP12-008

Login ADMIN E2E pasa.

### CP12-009

Login USUARIO E2E pasa.

### CP12-010

Credenciales inválidas E2E pasan.

### CP12-011

Usuario inactivo E2E pasa.

### CP12-012

Logout E2E pasa.

### CP12-013

F5 restaura sesión.

### CP12-014

Refresh automático pasa.

### CP12-015

Refresh concurrente no rompe sesión.

### CP12-016

Primera lectura E2E pasa.

### CP12-017

Primera lectura no genera falso cero.

### CP12-018

Registro diario E2E pasa.

### CP12-019

Consumo cero E2E pasa.

### CP12-020

Duplicado diario E2E pasa.

### CP12-021

Lectura menor E2E pasa.

### CP12-022

USUARIO no registra histórico.

### CP12-023

ADMIN registra histórico.

### CP12-024

Intervalo incompleto se representa correctamente.

### CP12-025

USUARIO corrige hoy.

### CP12-026

USUARIO no corrige histórico.

### CP12-027

ADMIN corrige histórico.

### CP12-028

Corrección recalcula fila siguiente.

### CP12-029

Dashboard completo pasa.

### CP12-030

Dashboard con huecos pasa.

### CP12-031

Total no se subestima por huecos.

### CP12-032

Selector 7 días funciona.

### CP12-033

Selector Mes funciona.

### CP12-034

Selector Año funciona.

### CP12-035

Meses futuros no son cero.

### CP12-036

Tema oscuro E2E pasa.

### CP12-037

Tema claro E2E pasa.

### CP12-038

Tema sistema E2E pasa.

### CP12-039

Tema persiste con F5.

### CP12-040

Tema por usuario funciona.

### CP12-041

Cambio contraseña E2E pasa.

### CP12-042

Password vieja deja de funcionar.

### CP12-043

Password nueva funciona.

### CP12-044

Listado usuarios E2E pasa.

### CP12-045

Crear usuario E2E pasa.

### CP12-046

Usuario creado puede hacer login.

### CP12-047

Editar usuario E2E pasa.

### CP12-048

Cambiar rol E2E pasa.

### CP12-049

Desactivar usuario E2E pasa.

### CP12-050

Reactivar usuario E2E pasa.

### CP12-051

Reset password E2E pasa.

### CP12-052

Último ADMIN se protege.

### CP12-053

USUARIO no accede a administración.

### CP12-054

403 funciona.

### CP12-055

404 funciona.

### CP12-056

Navegación teclado funciona.

### CP12-057

Skip link funciona.

### CP12-058

Focus modal funciona.

### CP12-059

Escape modal funciona.

### CP12-060

Focus vuelve al trigger.

### CP12-061

320px pasa.

### CP12-062

375px pasa.

### CP12-063

768px pasa.

### CP12-064

1024px pasa.

### CP12-065

1440px pasa.

### CP12-066

No existe overflow horizontal crítico.

### CP12-067

Historial móvil pasa.

### CP12-068

Usuarios móvil pasa.

### CP12-069

Reduced motion pasa.

### CP12-070

Dark mode móvil pasa.

### CP12-071

0 y null siguen siendo distinguibles.

### CP12-072

No existen errores inesperados de consola.

### CP12-073

No existen loops HTTP.

### CP12-074

No existen mutaciones duplicadas inesperadas.

### CP12-075

localStorage no contiene tokens.

### CP12-076

sessionStorage no contiene tokens.

### CP12-077

Refresh Cookie es HttpOnly.

### CP12-078

SameSite es correcto.

### CP12-079

Path cookie es correcto.

### CP12-080

Secure se configura en producción.

### CP12-081

No existen secretos tracked.

### CP12-082

Logs no contienen contraseñas.

### CP12-083

Logs no contienen tokens.

### CP12-084

SQL Injection tests pasan.

### CP12-085

Mass assignment tests pasan.

### CP12-086

Rate limit login pasa.

### CP12-087

CORS pasa.

### CP12-088

Origin validation pasa.

### CP12-089

Helmet smoke test pasa.

### CP12-090

500 no filtra detalles internos.

### CP12-091

Backend lint pasa.

### CP12-092

Backend tests pasan.

### CP12-093

Frontend lint pasa.

### CP12-094

Frontend tests pasan.

### CP12-095

Frontend build pasa.

### CP12-096

Playwright crítico pasa.

### CP12-097

npm audit fue revisado.

### CP12-098

README instala proyecto desde cero.

### CP12-099

Comandos README fueron verificados.

### CP12-100

Working tree está limpio.

---

# 207. Matriz final de estados

Solo después de todos los gates:

```text
SPEC-000 → CERRADA
SPEC-001 → CERRADA
SPEC-002 → CERRADA
SPEC-003 → CERRADA
SPEC-004 → CERRADA
SPEC-005 → CERRADA
SPEC-006 → CERRADA
SPEC-007 → CERRADA
SPEC-008 → CERRADA
SPEC-009 → CERRADA
SPEC-010 → CERRADA
SPEC-011 → CERRADA
SPEC-012 → CERRADA
```

---

# 208. Estado final de checkpoints

```text
CHECKPOINT 0  → CERRADO
CHECKPOINT 1  → CERRADO
CHECKPOINT 2  → CERRADO
CHECKPOINT 3  → CERRADO
CHECKPOINT 4  → CERRADO
CHECKPOINT 5  → CERRADO
CHECKPOINT 6  → CERRADO
CHECKPOINT 7  → CERRADO
CHECKPOINT 8  → CERRADO
CHECKPOINT 9  → CERRADO
CHECKPOINT 10 → CERRADO
CHECKPOINT 11 → CERRADO
CHECKPOINT 12 → CERRADO
```

---

# 209. Declaración final

Si CP12-001 a CP12-100 están realmente verdes:

```text
CONTROL DE CONSUMO ELÉCTRICO

MVP
====================

ESTADO:
COMPLETADO

STACK:
PostgreSQL
Node.js
Express
React

METODOLOGÍA:
Specification-Driven Development

ENTORNO CERTIFICADO:
LOCAL
```

---

# 210. Qué NO significa

No significa todavía:

```text
producción pública
alta disponibilidad
multi-hogar
multi-medidor
facturación eléctrica
```

---

# 211. Fase 2

Después del MVP podremos abrir nuevas especificaciones.

Posibles:

```text
SPEC-100 — Tarifas eléctricas
SPEC-101 — Costos y estimación de factura
SPEC-102 — Comparación de períodos
SPEC-103 — Metas de consumo
SPEC-104 — Alertas
SPEC-105 — Exportación CSV/PDF
SPEC-106 — Múltiples medidores
SPEC-107 — Despliegue productivo
```

---

# 212. Muy importante para SDD

No empezaremos Fase 2 diciendo:

> “agreguemos un campo de precio”.

Primero:

```text
necesidad
↓
SPEC
↓
criterios
↓
tests
↓
implementación
```

igual que hicimos en el MVP.

---

# 213. Lección final del proyecto

Los aprendices habrán recorrido:

```text
IDEA
↓
REQUISITOS
↓
ESPECIFICACIONES
↓
DOMINIO
↓
MODELO DE DATOS
↓
API
↓
SEGURIDAD
↓
ARQUITECTURA
↓
PRUEBAS
↓
BACKEND
↓
FRONTEND
↓
E2E
↓
CERTIFICACIÓN
```

---

# 214. Criterio pedagógico

Al terminar, un aprendiz debería poder explicar:

1. ¿Qué problema resuelve la aplicación?
2. ¿Qué significa Specification-Driven Development?
3. ¿Por qué especificamos antes de programar?
4. ¿Qué diferencia existe entre lectura y consumo?
5. ¿Por qué el consumo es derivado?
6. ¿Por qué no existe una tabla de consumos?
7. ¿Cómo funciona PostgreSQL en el proyecto?
8. ¿Qué es una migración?
9. ¿Qué es una transacción?
10. ¿Qué hace `FOR UPDATE`?
11. ¿Cómo funciona JWT?
12. ¿Qué diferencia existe entre Access y Refresh Token?
13. ¿Por qué los tokens no están en localStorage?
14. ¿Cómo funcionan ADMIN y USUARIO?
15. ¿Cómo protegemos al último administrador?
16. ¿Cómo registramos una lectura?
17. ¿Qué ocurre si falta un día?
18. ¿Por qué 0 y null son distintos?
19. ¿Cómo se calculan semana, mes y año?
20. ¿Qué significa un período parcial?
21. ¿Cómo funciona React con Express?
22. ¿Qué hace AuthContext?
23. ¿Qué hace Axios?
24. ¿Cómo funciona el refresh coordinado?
25. ¿Cómo funciona el tema Sistema?
26. ¿Qué significa responsive?
27. ¿Qué significa accesibilidad?
28. ¿Qué diferencia existe entre unit test, integración y E2E?
29. ¿Qué prueba Playwright?
30. ¿Qué significa Definition of Done?
31. ¿Qué significa una SPEC CERRADA?
32. ¿Por qué un MVP no significa producción pública?

Cuando esas respuestas sean claras y todos los `CP12-*` estén verdes:

```text
CHECKPOINT 12 → CERRADO
MVP → COMPLETADO
```
