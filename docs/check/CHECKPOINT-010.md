# CHECKPOINT 10 — Perfil, cambio de contraseña y sistema de temas

## 1. Objetivo

Completar la experiencia personal del usuario definida principalmente en `SPEC-003` y `SPEC-008`.

Al finalizar este checkpoint tendremos:

* página de Perfil real;
* visualización de nombre, correo y rol;
* cambio de contraseña propia;
* cierre de todas las sesiones después de cambiar contraseña;
* selector de apariencia;
* tema `SISTEMA`;
* tema `CLARO`;
* tema `OSCURO`;
* `ThemeContext`;
* detección de `prefers-color-scheme`;
* reacción dinámica a cambios del sistema operativo;
* persistencia del tema por usuario en PostgreSQL;
* recuerdo local no sensible del tema;
* aplicación del tema antes del render principal;
* reducción del flash de tema incorrecto;
* tokens CSS compartidos;
* modo claro;
* modo oscuro;
* pruebas frontend del sistema de temas y perfil.

Todavía quedarán para checkpoints posteriores:

```text
CHECKPOINT 11
responsive y accesibilidad final

CHECKPOINT 12
E2E y cierre del MVP
```

---

# 2. Precondiciones

Deben estar cerrados:

```text
CHECKPOINT 0 → CERRADO
CHECKPOINT 1 → CERRADO
CHECKPOINT 2 → CERRADO
CHECKPOINT 3 → CERRADO
CHECKPOINT 4 → CERRADO
CHECKPOINT 5 → CERRADO
CHECKPOINT 6 → CERRADO
CHECKPOINT 7 → CERRADO
CHECKPOINT 8 → CERRADO
CHECKPOINT 9 → CERRADO
```

Backend disponible:

```text
GET   /api/auth/me
PATCH /api/auth/password
PATCH /api/auth/tema
POST  /api/auth/logout
```

---

# 3. SPEC relacionadas

Principalmente:

```text
SPEC-003 → autenticación/perfil
SPEC-008 → temas y sistema visual
SPEC-010 → seguridad
SPEC-012 → pruebas
```

También impacta:

```text
SPEC-007 → dashboard visual
SPEC-006 → historial visual
SPEC-009 → administración visual futura
```

porque el tema debe funcionar sobre toda la aplicación.

---

# 4. Perfil

Ruta:

```text
/perfil
```

Disponible para:

```text
ADMIN
USUARIO
```

---

# 5. Información mostrada

El perfil mostrará:

```text
Nombre
Correo
Rol
Apariencia
Cambiar contraseña
Cerrar sesión
```

---

# 6. Información read-only

Durante el MVP:

```text
nombre
correo
rol
```

serán de solo lectura desde `Perfil`.

---

# 7. Motivo

Todavía no existe una API específica de:

```text
PATCH /auth/profile
```

para modificar nombre/correo propios.

No debemos inventarla silenciosamente.

---

# 8. ADMIN

Un ADMIN puede modificar usuarios desde el módulo administrativo futuro, pero eso sigue siendo:

```text
Administración
```

y no:

```text
Perfil personal
```

---

# 9. Diseño conceptual

```text
Perfil

Información personal

Nombre
José

Correo
jose@correo.com

Rol
ADMIN


Apariencia

○ Sistema
○ Claro
○ Oscuro


Seguridad

[ Cambiar contraseña ]

[ Cerrar sesión ]
```

---

# 10. Datos del perfil

Inicialmente utilizar:

```text
AuthContext.usuario
```

No hacer una petición `/auth/me` cada vez que se renderiza Perfil.

---

# 11. Fuente de identidad

AuthContext ya conoce:

```text
idUsuario
nombre
correo
rol
estado
tema
```

---

# 12. ¿Cuándo usar `/auth/me`?

Solo si necesitamos sincronización explícita.

Para este checkpoint:

```text
NO es necesario al montar Perfil
```

si AuthContext ya está actualizado.

---

# 13. Cambio de contraseña

Crear componente:

```text
frontend/src/components/profile/ChangePasswordForm.jsx
```

---

# 14. Campos

```text
Contraseña actual
Nueva contraseña
Confirmar nueva contraseña
```

---

# 15. Backend recibe solamente

```json
{
  "passwordActual": "...",
  "passwordNueva": "..."
}
```

---

# 16. Confirmación

```text
confirmarPassword
```

solo existe en frontend.

No se envía al backend.

---

# 17. Validaciones frontend

### Contraseña actual

Obligatoria.

### Nueva contraseña

```text
mínimo 8 caracteres
máximo 72 bytes UTF-8
```

### Confirmación

Debe ser exactamente igual a la nueva contraseña.

---

# 18. Reutilizar regla de bytes UTF-8

No validar solamente:

```text
password.length <= 72
```

porque:

```text
Unicode
```

puede ocupar varios bytes.

---

# 19. Utilidad frontend

Crear:

```text
frontend/src/utils/password.js
```

con función conceptual:

```text
obtenerLongitudUtf8(password)
```

---

# 20. Navegador

Podemos utilizar:

```javascript
new TextEncoder().encode(password).length
```

para conocer bytes UTF-8.

---

# 21. Regla

Frontend:

```text
ayuda al usuario
```

Backend:

```text
continúa siendo autoridad.
```

---

# 22. Autocomplete

Contraseña actual:

```text
autocomplete="current-password"
```

Nueva:

```text
autocomplete="new-password"
```

---

# 23. Mostrar/ocultar

Cada campo sensible podrá tener control accesible:

```text
Mostrar contraseña
Ocultar contraseña
```

---

# 24. Submit

Botón:

```text
Cambiar contraseña
```

Durante petición:

```text
Actualizando...
```

---

# 25. Request

```text
PATCH /api/auth/password
```

---

# 26. Éxito

Backend responde:

```text
204 No Content
```

y revoca:

```text
todas las sesiones
```

incluida la actual.

---

# 27. Comportamiento frontend correcto

Después de `204`:

```text
limpiar Access Token
↓
usuario = null
↓
estado = ANONIMO
↓
redirigir /login
```

---

# 28. Mensaje

Antes de navegar puede almacenarse un mensaje temporal:

```text
Contraseña actualizada. Inicia sesión nuevamente.
```

---

# 29. Mensaje post-login

Puede mostrarse en Login mediante:

```text
location.state
```

o mecanismo equivalente.

No necesitamos un sistema global complejo de flash messages.

---

# 30. No llamar logout después

Después de cambiar contraseña:

```text
NO necesitamos POST /auth/logout
```

porque backend ya revocó todas las sesiones.

---

# 31. Cookie

Backend debería limpiar la cookie según contrato.

Frontend simplemente limpia su:

```text
Access Token en memoria
```

---

# 32. Contraseña actual incorrecta

Backend:

```text
401
AUTH_CREDENCIALES_INVALIDAS
```

UI:

```text
La contraseña actual no es correcta.
```

---

# 33. Nueva contraseña inválida

Backend:

```text
422
```

UI debe mostrar mensaje junto al campo.

---

# 34. Error de red

No limpiar sesión.

Mantener formulario.

Mostrar:

```text
No se pudo cambiar la contraseña.
```

---

# 35. No registrar passwords

Nunca:

```text
console.log(formData)
```

si contiene contraseñas.

---

# 36. Tema

Valores oficiales:

```text
SISTEMA
CLARO
OSCURO
```

---

# 37. Tema por defecto

Para usuarios nuevos:

```text
SISTEMA
```

ya definido por PostgreSQL/backend.

---

# 38. Dos conceptos

Debemos distinguir:

```text
temaPreferido
temaEfectivo
```

---

# 39. Ejemplo

```text
temaPreferido = SISTEMA
SO = oscuro

temaEfectivo = OSCURO
```

---

# 40. Otro ejemplo

```text
temaPreferido = CLARO
SO = oscuro

temaEfectivo = CLARO
```

---

# 41. ThemeContext

Crear:

```text
frontend/src/contexts/ThemeContext.jsx
```

---

# 42. Estado conceptual

```text
temaPreferido
temaEfectivo
cambiarTema()
```

---

# 43. Hook

Crear:

```text
frontend/src/hooks/useTheme.js
```

---

# 44. Valores internos

Preferencia:

```text
SISTEMA
CLARO
OSCURO
```

Tema efectivo:

```text
light
dark
```

---

# 45. No utilizar tres temas CSS distintos

`SISTEMA` no es un tema visual independiente.

Es una regla:

```text
seguir al sistema.
```

---

# 46. Media query

Utilizar:

```text
(prefers-color-scheme: dark)
```

---

# 47. API navegador

Conceptualmente:

```javascript
window.matchMedia(
  '(prefers-color-scheme: dark)'
)
```

---

# 48. Si `SISTEMA`

Tema efectivo:

```text
matchMedia.matches
  ? dark
  : light
```

---

# 49. Listener

Mientras:

```text
temaPreferido = SISTEMA
```

escuchar cambios del SO.

---

# 50. Ejemplo

Usuario tiene:

```text
SISTEMA
```

Windows cambia:

```text
Claro → Oscuro
```

La aplicación debe cambiar inmediatamente.

---

# 51. Sin recargar

No:

```text
F5
```

necesario.

---

# 52. Si tema preferido es CLARO

Cambios del SO no afectan el tema efectivo.

---

# 53. Si tema preferido es OSCURO

Igual.

---

# 54. Aplicación del tema

Utilizaremos en raíz:

```html
<html data-theme="light">
```

o:

```html
<html data-theme="dark">
```

---

# 55. También `color-scheme`

Aplicar:

```text
color-scheme: light
```

o:

```text
color-scheme: dark
```

---

# 56. Función

Crear utilidad:

```text
frontend/src/theme/apply-theme.js
```

que actualice:

```text
document.documentElement.dataset.theme
document.documentElement.style.colorScheme
```

---

# 57. No duplicar DOM manipulation

ThemeContext llama a esa utilidad.

Los componentes no modifican directamente:

```text
document.documentElement
```

---

# 58. Persistencia oficial

Backend:

```text
usuarios.tema
```

es la fuente oficial para usuario autenticado.

---

# 59. Endpoint

```text
PATCH /api/auth/tema
```

---

# 60. Request

```json
{
  "tema": "OSCURO"
}
```

---

# 61. Respuesta

```json
{
  "tema": "OSCURO"
}
```

---

# 62. Aplicación inmediata

Al usuario seleccionar:

```text
OSCURO
```

la UI cambiará inmediatamente.

---

# 63. Persistencia

Después:

```text
PATCH /auth/tema
```

---

# 64. Optimistic UI

Utilizaremos cambio optimista:

```text
seleccionar tema
↓
aplicar inmediatamente
↓
persistir backend
```

---

# 65. Si backend falla

Debemos volver a:

```text
temaPreferido anterior
```

y mostrar:

```text
No se pudo guardar la preferencia de apariencia.
```

---

# 66. No dejar divergencia

Incorrecto:

```text
UI oscura
backend todavía CLARO
```

sin informar.

---

# 67. Actualizar AuthContext

Cuando backend confirma:

```text
tema = OSCURO
```

también actualizar:

```text
AuthContext.usuario.tema
```

---

# 68. Motivo

No queremos:

```text
ThemeContext = OSCURO
AuthContext.usuario.tema = SISTEMA
```

durante el resto de sesión.

---

# 69. Comunicación Auth + Theme

Debemos evitar dependencia circular entre Contexts.

---

# 70. Estrategia

`ThemeProvider` recibirá:

```text
temaUsuario
onTemaPersistido
```

o consumirá AuthContext únicamente en una dirección controlada.

---

# 71. Estructura recomendada

```text
AuthProvider
   ↓
ThemeProvider
   ↓
AppRouter
```

---

# 72. ThemeProvider puede consumir AuthContext

Porque:

```text
AuthContext
```

no necesita importar ThemeContext.

Así evitamos ciclo.

---

# 73. Después de autenticación

Cuando:

```text
usuario.tema
```

cambie:

ThemeContext sincroniza:

```text
temaPreferido
```

---

# 74. Durante estado ANONIMO

ThemeContext utilizará:

```text
preferencia local
```

---

# 75. Preferencia local

Se podrá almacenar en:

```text
localStorage
```

porque NO es sensible.

---

# 76. Clave recomendada

```text
consumo-electrico-tema
```

---

# 77. Valores

```text
SISTEMA
CLARO
OSCURO
```

---

# 78. Recordatorio importante

Sí:

```text
localStorage → tema
```

No:

```text
localStorage → accessToken
localStorage → refreshToken
```

---

# 79. Login

Antes de autenticarse, la página Login utilizará:

```text
tema local
```

---

# 80. Beneficio

Si el usuario acostumbraba usar oscuro:

```text
logout
↓
login continúa oscuro
```

aunque todavía no haya restaurado identidad.

---

# 81. Después de login

La preferencia oficial:

```text
usuario.tema
```

tendrá prioridad.

---

# 82. Ejemplo

Local:

```text
OSCURO
```

Usuario autenticado:

```text
CLARO
```

Después del login:

```text
CLARO
```

---

# 83. Además

Actualizar local:

```text
CLARO
```

para que futuras pantallas anónimas coincidan.

---

# 84. Después de logout

No borrar:

```text
preferencia local de tema.
```

---

# 85. Motivo

No es información privada crítica y mejora continuidad visual.

---

# 86. Flash de tema incorrecto

Problema:

```text
usuario prefiere oscuro
↓
HTML carga claro
↓
React inicia
↓
cambia oscuro
```

Produce flash blanco.

---

# 87. Solución

Antes de montar React, aplicar una inicialización mínima de tema.

---

# 88. Opción recomendada

En:

```text
main.jsx
```

antes de:

```text
createRoot(...)
```

leer:

```text
localStorage
```

y:

```text
prefers-color-scheme
```

---

# 89. Función

Crear:

```text
frontend/src/theme/initialize-theme.js
```

---

# 90. Flujo

```text
leer tema local
↓
si inválido → SISTEMA
↓
resolver tema efectivo
↓
aplicar data-theme
↓
montar React
```

---

# 91. Auth posterior

Si usuario autenticado tiene otra preferencia:

```text
ThemeContext la corrige
```

---

# 92. No será cero flash absoluto

Puede existir un cambio si la preferencia local pertenece a otro usuario y el usuario autenticado actual tiene otra.

Pero la experiencia será razonable.

---

# 93. Mejora futura

En despliegues SSR se podría resolver antes del HTML, pero:

```text
React + Vite SPA
```

no necesita esa complejidad.

---

# 94. Selector de tema

Crear:

```text
frontend/src/components/profile/ThemeSelector.jsx
```

---

# 95. UI

```text
Apariencia

(●) Sistema
    Usar la configuración del dispositivo

( ) Claro

( ) Oscuro
```

---

# 96. HTML

Puede utilizar:

```text
radio buttons
```

reales.

---

# 97. Name compartido

```text
name="tema"
```

---

# 98. Labels

Cada opción tendrá:

```text
input
label
```

asociados.

---

# 99. Iconos

Opcionales:

```text
monitor
sol
luna
```

pero no sustituyen el texto.

---

# 100. Cambio

Al seleccionar:

```text
CLARO
```

ThemeContext:

```text
aplica claro
↓
guarda local
↓
llama backend
```

---

# 101. Loading de preferencia

Mientras persiste:

```text
no bloquear toda la pantalla
```

---

# 102. Evitar cambios múltiples simultáneos

Si usuario pulsa rápidamente:

```text
CLARO
OSCURO
SISTEMA
```

podemos generar requests fuera de orden.

---

# 103. Problema

Ejemplo:

```text
request CLARO
request OSCURO
```

La segunda termina primero.

Después termina CLARO.

Backend queda:

```text
CLARO
```

aunque UI muestra:

```text
OSCURO
```

---

# 104. Solución

Serializar cambios o cancelar peticiones anteriores.

---

# 105. Decisión MVP

Utilizaremos:

```text
cola simple / última operación
```

bloqueando temporalmente el selector mientras persiste.

---

# 106. Flujo

```text
selecciona OSCURO
↓
selector disabled brevemente
↓
PATCH
↓
confirmar
↓
habilitar
```

---

# 107. Ventaja

Evita race conditions sin complejidad.

---

# 108. Aplicación optimista

Aunque el selector queda bloqueado:

```text
tema visual cambia inmediatamente.
```

---

# 109. Error

Rollback y reactivar selector.

---

# 110. ThemeContext — responsabilidades

```text
obtener preferencia inicial
resolver tema efectivo
aplicar tema
escuchar sistema
cambiar tema
persistir local
persistir backend si autenticado
rollback en error
```

---

# 111. Lo que ThemeContext NO hace

```text
login
logout
JWT
refresh
```

---

# 112. CSS

Ampliar:

```text
frontend/src/styles/
├── tokens.css
├── themes.css
└── global.css
```

---

# 113. `tokens.css`

Valores independientes de tema:

```text
espaciado
radios
tipografía
duraciones
breakpoints conceptuales
```

---

# 114. `themes.css`

Colores semánticos.

---

# 115. Tema claro

Conceptualmente:

```css
[data-theme='light'] {
    --color-background: ...;
    --color-surface: ...;
    --color-surface-secondary: ...;

    --color-text: ...;
    --color-text-secondary: ...;

    --color-border: ...;
    --color-accent: ...;

    --color-success: ...;
    --color-warning: ...;
    --color-error: ...;
}
```

---

# 116. Tema oscuro

```css
[data-theme='dark'] {
    --color-background: ...;
    --color-surface: ...;
    ...
}
```

---

# 117. No utilizar negro absoluto para todo

Evitar:

```text
#000000
```

como única superficie oscura.

---

# 118. Jerarquía

Necesitamos distinguir:

```text
background
surface
surface-secondary
border
```

también en oscuro.

---

# 119. Color de acento

Debe mantenerse reconocible en ambos temas.

---

# 120. No definir cada color duplicado por componente

Dashboard, Historial, Login y Perfil deben utilizar tokens.

---

# 121. Migrar estilos existentes

Revisar componentes de CHECKPOINT 7–9 y sustituir colores directos por:

```text
CSS variables
```

cuando existan.

---

# 122. Ejemplo incorrecto

```css
background: #ffffff;
color: #111111;
```

---

# 123. Correcto

```css
background: var(--color-surface);
color: var(--color-text);
```

---

# 124. Botones

Primario:

```text
--color-accent
```

---

# 125. Inputs

Deben adaptar:

```text
fondo
texto
borde
placeholder
focus
```

en ambos temas.

---

# 126. Modales

También.

---

# 127. Tablas

También.

---

# 128. Gráficos

Recharts debe recibir colores derivados del sistema de tema.

---

# 129. Problema de Recharts

SVG no siempre responde automáticamente a variables CSS cuando valores se calculan en JS.

---

# 130. Estrategia

Podemos usar:

```text
currentColor
```

cuando sea posible o leer tokens mediante clases/CSS.

---

# 131. Alternativa

ThemeContext puede exponer:

```text
temaEfectivo
```

y el componente decide un conjunto semántico mínimo.

---

# 132. Pero evitar colores hardcodeados repetidos

Centralizar configuración de gráfica.

---

# 133. Crear

```text
frontend/src/theme/chart-theme.js
```

o equivalente.

---

# 134. Objetivo

Dashboard oscuro debe adaptar:

```text
barras
grid
ejes
tooltip
texto
```

---

# 135. No gráfico claro dentro de app oscura

---

# 136. Tooltip

Debe utilizar:

```text
surface
text
border
```

consistentes.

---

# 137. Historial

Badges deben mantener contraste en ambos temas.

---

# 138. Estados parciales

No depender únicamente del color.

---

# 139. Login

También debe responder al tema.

---

# 140. Página 403/404

También.

---

# 141. Navegación

Sidebar/header/barra móvil deben responder al tema.

---

# 142. Transición

Podemos usar una transición breve:

```text
background-color
color
border-color
```

---

# 143. No animar todo

Evitar:

```css
* {
  transition: all .3s;
}
```

porque genera efectos extraños.

---

# 144. Prefer reduced motion

CHECKPOINT 11 hará revisión final, pero desde ahora las transiciones deben ser discretas.

---

# 145. Perfil CSS

Crear estilos específicos:

```text
PerfilPage.module.css
ThemeSelector.module.css
ChangePasswordForm.module.css
```

o equivalente.

---

# 146. Perfil responsive básico

Desktop:

```text
Información
Apariencia
Seguridad
```

en secciones claras.

---

# 147. Móvil

Una columna.

---

# 148. No exceso de tarjetas

Perfil no necesita:

```text
20 cards
```

Puede ser una superficie principal con secciones.

---

# 149. Cerrar sesión

El botón seguirá utilizando:

```text
AuthContext.logout()
```

de CHECKPOINT 7.

---

# 150. No duplicar logout

No crear una segunda implementación dentro de Perfil.

---

# 151. Seguridad

Tema es el único dato que puede utilizar:

```text
localStorage
```

en este checkpoint.

---

# 152. No mezclar

Nunca almacenar un objeto como:

```json
{
  "tema": "OSCURO",
  "accessToken": "...",
  "usuario": {...}
}
```

---

# 153. Solo preferencia

```text
consumo-electrico-tema=OSCURO
```

---

# 154. Datos personales

No guardar:

```text
correo
nombre
rol
```

en localStorage sin necesidad.

AuthContext los mantiene en memoria.

---

# 155. Logout

Después de logout:

```text
usuario memoria → null
Access Token → null
tema local → permanece
```

---

# 156. Login de otro usuario

Después:

```text
tema backend del nuevo usuario
```

reemplaza al local.

---

# 157. Dos usuarios

Ejemplo:

Usuario A:

```text
OSCURO
```

Logout.

Login B:

```text
CLARO
```

Resultado:

```text
CLARO
```

---

# 158. Luego logout B

Login vuelve inicialmente:

```text
CLARO
```

porque fue la preferencia local más reciente.

---

# 159. Login A otra vez

Backend devuelve:

```text
OSCURO
```

ThemeContext cambia a oscuro.

---

# 160. Esto es correcto

La preferencia local sirve solo para:

```text
experiencia antes de conocer usuario.
```

---

# 161. Tests ThemeContext

Debe cubrir:

```text
SISTEMA + SO claro
SISTEMA + SO oscuro
CLARO + SO oscuro
OSCURO + SO claro
```

---

# 162. Test sistema dinámico

Preferencia:

```text
SISTEMA
```

SO cambia:

```text
light → dark
```

esperado:

```text
temaEfectivo = dark
```

---

# 163. Test claro fijo

Preferencia:

```text
CLARO
```

SO cambia.

Tema:

```text
light
```

permanece.

---

# 164. Test oscuro fijo

Igual.

---

# 165. Test persistencia local

Cambiar:

```text
OSCURO
```

debe guardar:

```text
consumo-electrico-tema=OSCURO
```

---

# 166. Test preferencia inválida local

Si localStorage contiene:

```text
MORADO
```

usar:

```text
SISTEMA
```

---

# 167. Test backend override

Local:

```text
OSCURO
```

Usuario:

```text
CLARO
```

Después de autenticación:

```text
CLARO
```

---

# 168. Test cambio exitoso

Usuario elige:

```text
OSCURO
```

Esperado:

```text
UI cambia inmediatamente
PATCH /auth/tema
AuthContext actualizado
localStorage actualizado
```

---

# 169. Test error al persistir

Tema anterior:

```text
CLARO
```

usuario selecciona:

```text
OSCURO
```

API falla.

Esperado:

```text
rollback → CLARO
mensaje error
```

---

# 170. Test selector bloqueado

Mientras PATCH está pendiente:

```text
otra selección no genera segunda petición
```

---

# 171. Test logout conserva tema

Después logout:

```text
tema local sigue
```

---

# 172. Test F5

Preferencia:

```text
OSCURO
```

Recarga.

Antes de render principal:

```text
data-theme=dark
```

---

# 173. Test `data-theme`

Claro:

```text
document.documentElement.dataset.theme === 'light'
```

Oscuro:

```text
dark
```

---

# 174. Test color-scheme

Debe coincidir.

---

# 175. Tests Perfil

Mostrar:

```text
nombre
correo
rol
```

---

# 176. No editable

No deben existir inputs editables para nombre/correo en esta pantalla.

---

# 177. Test password mismatch

Nueva:

```text
NuevaClave123
```

Confirmar:

```text
OtraClave123
```

No llamar API.

---

# 178. Test password corto

No API.

---

# 179. Test >72 bytes

No API.

---

# 180. Test password correcto

API:

```text
204
```

Esperado:

```text
sesión limpiada
/login
mensaje login nuevamente
```

---

# 181. Test contraseña actual incorrecta

Backend:

```text
401
```

UI muestra mensaje.

Sesión continúa.

---

# 182. Test error de red password

Sesión continúa.

---

# 183. Test no log passwords

Revisión automática/manual.

---

# 184. Gráfico tema

Test básico:

Cambiar tema y comprobar que:

```text
ConsumptionChart
```

recibe/usa configuración correspondiente.

---

# 185. No hace falta snapshot gigante

Preferir comprobar atributos/clases/props relevantes.

---

# 186. Dashboard tema oscuro

Tarjetas deben continuar legibles.

---

# 187. Historial tema oscuro

Tabla/tarjetas legibles.

---

# 188. Login tema oscuro

Campos legibles.

---

# 189. Modales tema oscuro

Legibles.

---

# 190. Contraste

El gate exhaustivo llegará en CHECKPOINT 11.

Pero no debemos introducir combinaciones evidentemente ilegibles.

---

# 191. Backend

No requiere nuevas migraciones.

`usuarios.tema` ya existe.

---

# 192. No nuevo endpoint

Ya existen:

```text
PATCH /auth/tema
PATCH /auth/password
```

---

# 193. Regresión backend

Todas las pruebas anteriores siguen pasando.

---

# 194. README

Actualizar:

```text
## Perfil
## Apariencia
```

---

# 195. Documentar

```text
Sistema
Claro
Oscuro
```

---

# 196. Explicar

```text
El tema se guarda por usuario.
```

---

# 197. Explicar también

```text
La aplicación puede recordar localmente la última preferencia visual.
```

---

# 198. Aclarar

```text
Los tokens NO se guardan en localStorage.
```

---

# 199. Smoke test — temas

### Usuario A

```text
login
↓
Perfil
↓
Oscuro
↓
dashboard oscuro
↓
historial oscuro
↓
F5
↓
continúa oscuro
```

---

# 200. Sistema

```text
Perfil
↓
Sistema
↓
cambiar SO
↓
app cambia automáticamente
```

---

# 201. Claro fijo

```text
Perfil → Claro
SO → Oscuro
app continúa clara
```

---

# 202. Dos usuarios

```text
A → Oscuro
B → Claro
```

Cada uno debe recuperar su tema después de login.

---

# 203. Smoke password

```text
login
↓
Perfil
↓
Cambiar contraseña
↓
204
↓
Login
↓
password vieja falla
↓
password nueva funciona
```

---

# 204. Frontend gate

Ejecutar:

```bash
npm run lint
npm test
npm run build
```

PASS.

---

# 205. Backend regression

```bash
npm run lint
npm test
```

PASS.

---

# 206. Navegador

Revisar consola:

```text
sin warnings críticos
sin passwords
sin tokens
```

---

# 207. localStorage

Revisar manualmente.

Permitido:

```text
consumo-electrico-tema
```

No permitido:

```text
accessToken
refreshToken
jwt
usuario completo
password
```

---

# 208. Git

Desde raíz:

```bash
git status
```

No debe aparecer:

```text
.env
coverage
dist
node_modules
```

---

# 209. Commit

Después del gate verde:

```bash
git add .
git status
```

Revisar.

Después:

```bash
git commit -m "feat: implementar perfil y sistema de temas"
```

---

# 210. Working tree

Esperado:

```text
nothing to commit, working tree clean
```

---

# 211. Gate CHECKPOINT 10

### CP10-001

Existe PerfilPage real.

### CP10-002

Perfil muestra nombre.

### CP10-003

Perfil muestra correo.

### CP10-004

Perfil muestra rol.

### CP10-005

Nombre no es editable desde Perfil.

### CP10-006

Correo no es editable desde Perfil.

### CP10-007

Existe formulario de cambio de contraseña.

### CP10-008

Solicita contraseña actual.

### CP10-009

Solicita contraseña nueva.

### CP10-010

Solicita confirmación frontend.

### CP10-011

Confirmación no se envía backend.

### CP10-012

Password mínimo 8 caracteres.

### CP10-013

Password máximo 72 bytes UTF-8.

### CP10-014

Password usa TextEncoder o equivalente para bytes.

### CP10-015

Password mismatch bloquea submit.

### CP10-016

Existe mostrar/ocultar accesible.

### CP10-017

Cambio password usa API real.

### CP10-018

204 limpia sesión.

### CP10-019

204 redirige a Login.

### CP10-020

Se indica que debe iniciar sesión nuevamente.

### CP10-021

No se llama logout redundante después de password.

### CP10-022

Password actual incorrecta se maneja.

### CP10-023

Error de red no cierra sesión.

### CP10-024

Passwords no aparecen en logs.

### CP10-025

Existe ThemeContext.

### CP10-026

Existe useTheme.

### CP10-027

Existe temaPreferido.

### CP10-028

Existe temaEfectivo.

### CP10-029

SISTEMA es soportado.

### CP10-030

CLARO es soportado.

### CP10-031

OSCURO es soportado.

### CP10-032

SISTEMA sigue prefers-color-scheme.

### CP10-033

SISTEMA reacciona dinámicamente a cambios del SO.

### CP10-034

CLARO ignora cambio del SO.

### CP10-035

OSCURO ignora cambio del SO.

### CP10-036

Tema se aplica con data-theme.

### CP10-037

color-scheme coincide con tema efectivo.

### CP10-038

Existe ThemeSelector.

### CP10-039

Selector utiliza controles accesibles.

### CP10-040

Selector tiene texto Sistema.

### CP10-041

Selector tiene texto Claro.

### CP10-042

Selector tiene texto Oscuro.

### CP10-043

Tema cambia inmediatamente.

### CP10-044

Tema se persiste con PATCH `/auth/tema`.

### CP10-045

AuthContext actualiza usuario.tema.

### CP10-046

Tema se guarda localmente.

### CP10-047

LocalStorage solo guarda preferencia visual.

### CP10-048

LocalStorage no guarda Access Token.

### CP10-049

LocalStorage no guarda Refresh Token.

### CP10-050

LocalStorage no guarda passwords.

### CP10-051

LocalStorage no necesita guardar usuario completo.

### CP10-052

Preferencia backend gana después de login.

### CP10-053

Preferencia local sirve antes de conocer usuario.

### CP10-054

Logout conserva preferencia visual.

### CP10-055

Login de otro usuario aplica tema propio.

### CP10-056

Valor local inválido cae a SISTEMA.

### CP10-057

Existe inicialización de tema antes de montar React.

### CP10-058

Se reduce flash de tema incorrecto.

### CP10-059

Cambio fallido hace rollback.

### CP10-060

Cambio fallido muestra feedback.

### CP10-061

Selector evita carreras de múltiples PATCH.

### CP10-062

Existe themes.css.

### CP10-063

Existe tokens.css coherente.

### CP10-064

Tema claro usa tokens.

### CP10-065

Tema oscuro usa tokens.

### CP10-066

Dashboard usa tokens.

### CP10-067

Historial usa tokens.

### CP10-068

Login usa tokens.

### CP10-069

Perfil usa tokens.

### CP10-070

Modales usan tokens.

### CP10-071

No hay colores directos innecesarios repetidos.

### CP10-072

Inputs son legibles en claro.

### CP10-073

Inputs son legibles en oscuro.

### CP10-074

Tablas son legibles en ambos temas.

### CP10-075

Gráficos se adaptan al tema.

### CP10-076

Tooltip del gráfico se adapta.

### CP10-077

Estados no dependen solo del color.

### CP10-078

Tests ThemeContext pasan.

### CP10-079

Test SISTEMA claro pasa.

### CP10-080

Test SISTEMA oscuro pasa.

### CP10-081

Test cambio dinámico del sistema pasa.

### CP10-082

Test tema fijo pasa.

### CP10-083

Test persistencia local pasa.

### CP10-084

Test backend override pasa.

### CP10-085

Test rollback tema pasa.

### CP10-086

Test cambio password pasa.

### CP10-087

Test mismatch pasa.

### CP10-088

Test 72 bytes pasa.

### CP10-089

Test logout por cambio password pasa.

### CP10-090

Frontend lint pasa.

### CP10-091

Frontend tests pasan.

### CP10-092

Frontend build pasa.

### CP10-093

Backend regression pasa.

### CP10-094

No existen secretos versionados.

### CP10-095

Existe commit.

### CP10-096

Working tree limpio.

---

# 212. Estado de SPEC-008

Después del gate:

```text
SPEC-008
Sistema visual y temas
→ IMPLEMENTADA EN GRAN PARTE
→ PROBADA
```

Todavía falta:

```text
gate responsive final
gate accesibilidad final
```

de CHECKPOINT 11.

---

# 213. Estado de SPEC-003

Perfil de identidad y cambio de contraseña también quedan integrados en frontend.

La SPEC estará muy cerca de cierre.

---

# 214. Estado del roadmap

```text
CHECKPOINT 0
Inicialización
→ CERRADO

CHECKPOINT 1
PostgreSQL
→ CERRADO

CHECKPOINT 2
Backend base
→ CERRADO

CHECKPOINT 3
Autenticación backend
→ CERRADO

CHECKPOINT 4
Usuarios backend
→ CERRADO

CHECKPOINT 5
Lecturas backend
→ CERRADO

CHECKPOINT 6
Estadísticas backend
→ CERRADO

CHECKPOINT 7
Frontend base
→ CERRADO

CHECKPOINT 8
Dashboard
→ CERRADO

CHECKPOINT 9
Historial
→ CERRADO

CHECKPOINT 10
Perfil y temas
→ CERRADO

CHECKPOINT 11
Responsive y accesibilidad
→ SIGUIENTE

CHECKPOINT 12
E2E y cierre MVP
→ PENDIENTE
```

---

# 215. Qué podrá hacer el usuario

Al cerrar CHECKPOINT 10:

```text
Login
↓
Dashboard
↓
Registrar lectura
↓
Historial
↓
Corregir según permisos
↓
Perfil
↓
Cambiar apariencia
↓
Cambiar contraseña
↓
Logout
```

Todo mediante datos y sesiones reales.

---

# 216. Qué queda

Funcionalmente el MVP estará casi terminado.

Faltará principalmente:

```text
CHECKPOINT 11
pulir y certificar responsive + accesibilidad

CHECKPOINT 12
Playwright + seguridad + regresión + cierre
```

---

# 217. Siguiente checkpoint

```text
CHECKPOINT 11
Responsive, accesibilidad y pulido visual
```

Ahí haremos el gate integral de:

```text
320/375 px
tablet
desktop
sin overflow
sidebar
navegación móvil
tablas/tarjetas
modales
focus
teclado
contraste
labels
ARIA
gráficos accesibles
prefers-reduced-motion
estados loading/error/vacío
```

y dejaremos la interfaz preparada para el E2E final.

---

# 218. Criterio pedagógico

Un aprendiz deberá poder explicar:

1. ¿Qué información pertenece a Perfil?
2. ¿Por qué nombre y correo son read-only en este MVP?
3. ¿Por qué confirmar contraseña no se envía al backend?
4. ¿Por qué bcrypt obliga a considerar bytes UTF-8?
5. ¿Qué ocurre con las sesiones al cambiar contraseña?
6. ¿Por qué no llamamos logout después del cambio?
7. ¿Qué diferencia existe entre tema preferido y tema efectivo?
8. ¿Por qué SISTEMA no es un tercer diseño visual?
9. ¿Cómo funciona `prefers-color-scheme`?
10. ¿Por qué SISTEMA debe escuchar cambios del SO?
11. ¿Por qué CLARO y OSCURO no deben escucharlos para cambiar apariencia?
12. ¿Dónde se persiste oficialmente el tema?
13. ¿Por qué sí podemos usar localStorage para el tema?
14. ¿Por qué no podemos usarlo para tokens?
15. ¿Qué ocurre con el tema antes del login?
16. ¿Qué ocurre después del login cuando backend tiene otra preferencia?
17. ¿Por qué conservamos el tema después de logout?
18. ¿Qué problema es el flash de tema incorrecto?
19. ¿Cómo lo reducimos antes de montar React?
20. ¿Qué hace `data-theme`?
21. ¿Por qué usamos variables CSS?
22. ¿Cómo evitamos condiciones de carrera al cambiar tema rápidamente?
23. ¿Qué debe ocurrir si guardar el tema falla?
24. ¿Por qué el gráfico también debe conocer el tema efectivo?
25. ¿Por qué todavía necesitamos un checkpoint de accesibilidad aunque los componentes ya sean razonables?

Cuando todos los `CP10-*` estén verdes:

```text
CHECKPOINT 10 → CERRADO
```
