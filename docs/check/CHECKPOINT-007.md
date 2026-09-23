# CHECKPOINT 7 — Frontend base, autenticación y navegación protegida

## 1. Objetivo

Transformar el frontend provisional de React en una aplicación conectada realmente al backend.

Al finalizar este checkpoint tendremos:

* React Router;
* Axios;
* configuración central de API;
* Access Token únicamente en memoria;
* cookie Refresh gestionada por el navegador;
* restauración automática de sesión;
* renovación automática del Access Token;
* coordinación de múltiples `401`;
* `AuthContext`;
* página de Login;
* logout real;
* rutas protegidas;
* rutas exclusivas de ADMIN;
* layout principal;
* navegación base;
* páginas `403` y `404`;
* estados iniciales de carga;
* primeras pruebas frontend.

Todavía NO implementaremos completamente:

```text
dashboard
gráficos
historial visual
administración visual de usuarios
selector final de temas
responsive final
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
```

El backend ya deberá proporcionar:

```text
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
PATCH /api/auth/password
PATCH /api/auth/tema
```

y las demás APIs del MVP.

---

# 3. SPEC relacionadas

Principalmente:

```text
SPEC-003 → autenticación
SPEC-007 → navegación/dashboard
SPEC-008 → sistema visual
SPEC-010 → seguridad
SPEC-011 → arquitectura frontend
SPEC-012 → pruebas
```

---

# 4. Arquitectura frontend

```text
React
 │
 ├── AuthContext
 ├── Router
 ├── Layout
 ├── Pages
 └── API modules
        │
        ▼
      Axios
        │
        ├── Access Token en memoria
        └── Cookie HttpOnly automática
                │
                ▼
             Express
```

---

# 5. Dependencias nuevas

Desde:

```text
frontend/
```

instalar:

```bash
npm install axios react-router-dom
```

Para pruebas:

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

---

# 6. No instalar Redux

Continúa fuera del alcance:

```text
Redux
Zustand
MobX
```

Nuestro estado global inicial es pequeño:

```text
usuario
estado autenticación
Access Token
```

---

# 7. No instalar TanStack Query todavía

No lo necesitamos para:

```text
login
routing
sesión
```

Podrá evaluarse posteriormente como ejercicio educativo.

---

# 8. Variables frontend

Archivo local:

```text
frontend/.env
```

Contenido:

```text
VITE_API_URL=http://localhost:3000/api
```

---

# 9. `.env.example`

Debe continuar:

```text
VITE_API_URL=http://localhost:3000/api
```

---

# 10. Regla crítica

Nunca colocar:

```text
VITE_JWT_SECRET
VITE_DB_PASSWORD
VITE_REFRESH_SECRET
```

Todo `VITE_*` termina disponible para el navegador.

---

# 11. Configuración central

Crear:

```text
frontend/src/config/env.js
```

Responsabilidad:

```text
leer VITE_API_URL
validar que exista
validar que sea URL válida
```

---

# 12. No utilizar `import.meta.env` por toda la aplicación

Preferimos:

```text
env.apiUrl
```

como única fuente frontend.

---

# 13. Access Token

Según SPEC-003:

```text
Access Token
→ memoria
```

Nunca:

```text
localStorage
sessionStorage
IndexedDB
```

---

# 14. Refresh Token

El frontend NO podrá leerlo.

Está en:

```text
cookie HttpOnly
```

gestionada por el navegador.

---

# 15. Consecuencia

React solamente conoce:

```text
accessToken
usuario
```

No conoce:

```text
refreshToken
tokenHash
JWT_SECRET
```

---

# 16. Almacén de sesión en memoria

Crear:

```text
frontend/src/auth/session-memory.js
```

Su responsabilidad será conservar temporalmente:

```text
accessToken
```

---

# 17. Estructura conceptual

```javascript
let accessToken = null;

export function obtenerAccessToken() {
    return accessToken;
}

export function establecerAccessToken(token) {
    accessToken = token;
}

export function limpiarAccessToken() {
    accessToken = null;
}
```

---

# 18. No React dentro del almacén

Este módulo no necesita:

```text
hooks
Context
JSX
```

Es simplemente memoria del proceso JavaScript actual.

---

# 19. ¿Por qué no guardar el token directamente solo en AuthContext?

Porque:

```text
api/client.js
```

necesita acceder al token sin importar React ni crear dependencias circulares.

---

# 20. Cliente HTTP

Crear:

```text
frontend/src/api/client.js
```

---

# 21. Tendremos dos clientes

### `publicClient`

Para operaciones que no necesitan Access Token:

```text
login
refresh
logout
```

### `apiClient`

Para operaciones protegidas:

```text
me
lecturas
estadísticas
usuarios
perfil
```

---

# 22. Ambos utilizarán

```text
baseURL = VITE_API_URL
withCredentials = true
```

---

# 23. `withCredentials`

Es necesario para que el navegador pueda enviar:

```text
refresh_token
```

cuando corresponde.

---

# 24. Ejemplo conceptual

```javascript
const publicClient = axios.create({
    baseURL: env.apiUrl,
    withCredentials: true,
});

const apiClient = axios.create({
    baseURL: env.apiUrl,
    withCredentials: true,
});
```

---

# 25. Request interceptor

`apiClient` añadirá:

```text
Authorization: Bearer <accessToken>
```

si existe token.

---

# 26. Conceptualmente

```javascript
apiClient.interceptors.request.use(
    (config) => {
        const token =
            obtenerAccessToken();

        if (token) {
            config.headers.Authorization =
                `Bearer ${token}`;
        }

        return config;
    }
);
```

---

# 27. No imprimir token

Nunca:

```javascript
console.log(token);
```

---

# 28. Problema del Access Token expirado

Puede ocurrir:

```text
React
  ↓
GET /estadisticas/resumen
  ↓
401 AUTH_TOKEN_EXPIRADO
```

El usuario no debería tener que volver a iniciar sesión cada 15 minutos si su Refresh Token continúa válido.

---

# 29. Renovación automática

El cliente hará:

```text
request protegida
↓
401
↓
POST /auth/refresh
↓
nuevo Access Token
↓
reintentar request original una vez
```

---

# 30. No refrescar ante todos los errores

Solo:

```text
401
```

relacionado con autenticación.

No:

```text
403
404
409
422
429
500
```

---

# 31. Importante: 403

Un:

```text
403 AUTH_SIN_PERMISO
```

no se arregla renovando el JWT.

---

# 32. Evitar bucle infinito

Cada petición deberá marcar:

```text
_retry = true
```

o equivalente después del primer intento de refresh.

---

# 33. Regla

Cada request original puede intentar:

```text
máximo 1 renovación automática
```

---

# 34. Problema de concurrencia

Supongamos que expira el token y el dashboard hace simultáneamente:

```text
GET resumen
GET serie
GET otra información
```

Las tres reciben:

```text
401
```

---

# 35. Incorrecto

```text
3 peticiones 401
↓
3 llamadas /auth/refresh
```

Esto entraría en conflicto con la rotación de Refresh Token del backend.

---

# 36. Correcto

```text
3 peticiones 401
       │
       ▼
1 única renovación
       │
       ▼
nuevo Access Token
       │
       ├── reintentar petición 1
       ├── reintentar petición 2
       └── reintentar petición 3
```

---

# 37. Coordinador de renovación

Crear:

```text
frontend/src/auth/refresh-coordinator.js
```

---

# 38. Estado interno

```text
refreshPromise
```

Inicialmente:

```text
null
```

---

# 39. Concepto

```javascript
let refreshPromise = null;

export function renovarUnaVez(callback) {
    if (!refreshPromise) {
        refreshPromise =
            Promise.resolve()
                .then(callback)
                .finally(() => {
                    refreshPromise = null;
                });
    }

    return refreshPromise;
}
```

---

# 40. Beneficio

Todas las peticiones concurrentes esperan:

```text
la misma Promise
```

---

# 41. Public client para Refresh

La renovación utilizará:

```text
publicClient
```

y no `apiClient`.

---

# 42. Motivo

Si `/auth/refresh` utilizara el mismo interceptor de respuestas podríamos crear:

```text
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

# 43. Flujo de interceptor

```text
apiClient recibe 401
↓
¿request ya fue reintentado?
  sí → rechazar
  no ↓
esperar renovarUnaVez()
↓
guardar nuevo Access Token
↓
reintentar request
```

---

# 44. Refresh fallido

Si:

```text
/auth/refresh → 401
```

debemos:

```text
limpiar Access Token
marcar sesión expirada
llevar usuario a Login
```

---

# 45. Comunicación con AuthContext

El cliente Axios no debe importar directamente `AuthContext`.

Crearemos un pequeño mecanismo de notificación en:

```text
session-memory.js
```

---

# 46. Manejador de expiración

Conceptualmente:

```javascript
let onSessionExpired = null;

export function establecerManejadorSesionExpirada(fn) {
    onSessionExpired = fn;
}

export function notificarSesionExpirada() {
    limpiarAccessToken();
    onSessionExpired?.();
}
```

---

# 47. AuthProvider

Al montarse registrará su manejador.

Cuando la sesión expire:

```text
usuario = null
estado = ANONIMO
```

---

# 48. AuthContext

Crear:

```text
frontend/src/contexts/AuthContext.jsx
```

---

# 49. Estado conceptual

```text
estadoAutenticacion:
CARGANDO
AUTENTICADO
ANONIMO

usuario
```

---

# 50. No utilizar solamente boolean

Evitar:

```text
isLoggedIn = false
```

durante el arranque.

Porque todavía no sabemos si:

```text
no hay sesión
```

o:

```text
estamos restaurando sesión
```

---

# 51. Estados

### CARGANDO

Estamos comprobando Refresh Token.

### AUTENTICADO

Tenemos sesión válida.

### ANONIMO

No existe sesión válida.

---

# 52. Arranque de aplicación

Al cargar React:

```text
AuthProvider
↓
POST /auth/refresh
```

---

# 53. Si Refresh funciona

Backend devuelve:

```text
usuario
Access Token
```

Entonces:

```text
guardar Access Token en memoria
usuario = respuesta.usuario
estado = AUTENTICADO
```

---

# 54. Si no existe cookie

Backend:

```text
401
```

Resultado frontend:

```text
estado = ANONIMO
```

---

# 55. Esto es normal

No debemos mostrar:

```text
Error: sesión inválida
```

a una persona que simplemente abrió por primera vez `/login`.

---

# 56. ¿Por qué restaurar usando refresh?

Porque el Access Token vive únicamente en memoria.

Al recargar:

```text
F5
```

se pierde.

La cookie HttpOnly permanece.

---

# 57. Flujo F5

```text
Access Token memoria → desaparece
Refresh Cookie → sigue
↓
React inicia
↓
/auth/refresh
↓
nuevo Access Token
↓
sesión restaurada
```

---

# 58. Ventaja

No necesitamos:

```text
localStorage token
```

---

# 59. Login

Crear:

```text
frontend/src/pages/LoginPage.jsx
```

---

# 60. Campos

```text
Correo
Contraseña
```

---

# 61. No existe

```text
Crear cuenta
```

---

# 62. No existe todavía

```text
Olvidé mi contraseña
```

---

# 63. Formulario conceptual

```text
Control de Consumo Eléctrico

Correo
[                     ]

Contraseña
[                     ]  Mostrar

[ Iniciar sesión ]
```

---

# 64. Labels reales

No utilizar solamente placeholders.

---

# 65. Autocomplete

Correo:

```text
autocomplete="username"
```

Contraseña:

```text
autocomplete="current-password"
```

---

# 66. Validación frontend

Comprobar como ayuda UX:

```text
correo no vacío
correo razonablemente válido
password no vacía
```

---

# 67. Backend sigue siendo autoridad

Nunca asumir que por validar React:

```text
la petición es segura.
```

---

# 68. `auth.api.js`

Crear:

```text
frontend/src/api/auth.api.js
```

Funciones:

```text
login
refresh
logout
obtenerMe
cambiarPassword
cambiarTema
```

---

# 69. Login utiliza `publicClient`

```text
POST /auth/login
```

---

# 70. Después del login

AuthContext:

```text
establecer Access Token
guardar usuario
estado = AUTENTICADO
```

---

# 71. Login exitoso

Redirección:

```text
/dashboard
```

---

# 72. Redirección de destino

Si el usuario intentó acceder primero a:

```text
/historial
```

sin sesión, podremos recordar:

```text
location.state.from
```

---

# 73. Después de login

Preferiblemente volver a:

```text
/historial
```

en lugar de siempre `/dashboard`.

---

# 74. Caso normal

Sin destino previo:

```text
/dashboard
```

---

# 75. Credenciales inválidas

Mostrar:

```text
Correo o contraseña incorrectos.
```

---

# 76. Usuario inactivo

Mostrar:

```text
La cuenta se encuentra inactiva.
```

---

# 77. Rate limit

Si backend responde:

```text
429
```

mostrar:

```text
Demasiados intentos. Intenta nuevamente más tarde.
```

---

# 78. Error de red

Mostrar:

```text
No se pudo conectar con el servidor.
```

No:

```text
AxiosError ECONNREFUSED...
```

---

# 79. Loading login

Mientras se procesa:

```text
[ Iniciando sesión... ]
```

y evitar dobles envíos.

---

# 80. No borrar datos ante error

Si contraseña es incorrecta:

```text
correo puede mantenerse
password puede limpiarse
```

---

# 81. Mostrar/ocultar contraseña

Control accesible.

Debe tener nombre como:

```text
Mostrar contraseña
Ocultar contraseña
```

---

# 82. Logout

AuthContext expondrá:

```text
logout()
```

---

# 83. Flujo correcto

```text
POST /auth/logout
↓
204
↓
limpiar Access Token
↓
usuario = null
↓
estado = ANONIMO
↓
/login
```

---

# 84. Si logout falla por red

No debemos decir:

```text
Sesión cerrada
```

si el backend no pudo revocarla.

---

# 85. Decisión

Si existe error de red:

```text
mantener sesión local
mostrar error
permitir reintentar
```

---

# 86. Si backend responde logout correctamente

Entonces sí limpiamos todo.

---

# 87. Sesión expirada automáticamente

Si falla refresh:

```text
limpiar sesión
```

sin necesitar logout explícito.

---

# 88. ProtectedRoute

Crear:

```text
frontend/src/routes/ProtectedRoute.jsx
```

---

# 89. Comportamiento

### CARGANDO

Mostrar pantalla de carga.

### ANONIMO

Redirigir:

```text
/login
```

### AUTENTICADO

Permitir contenido.

---

# 90. Evitar flash

No queremos:

```text
dashboard aparece 20 ms
↓
redirige a login
```

ni:

```text
login aparece
↓
refresh funciona
↓
dashboard
```

---

# 91. Loading inicial

Crear un componente mínimo:

```text
Cargando...
```

o skeleton de aplicación.

No necesitamos diseño complejo todavía.

---

# 92. AdminRoute

Crear:

```text
frontend/src/routes/AdminRoute.jsx
```

---

# 93. Comportamiento

Si:

```text
usuario.rol === 'ADMIN'
```

permitir.

Si:

```text
USUARIO
```

redirigir a:

```text
/403
```

---

# 94. Seguridad

`AdminRoute`:

```text
NO es seguridad real
```

El backend sigue protegiendo `/api/admin/*`.

---

# 95. Rutas

Crear:

```text
frontend/src/routes/AppRouter.jsx
```

---

# 96. Estructura prevista

```text
/login

/
└── protegida
    ├── /dashboard
    ├── /historial
    ├── /perfil
    └── /admin
        └── /usuarios
```

---

# 97. Páginas mínimas

Crear ahora:

```text
LoginPage.jsx
DashboardPage.jsx
HistorialPage.jsx
PerfilPage.jsx
UsuariosPage.jsx
ForbiddenPage.jsx
NotFoundPage.jsx
```

---

# 98. Importante

Las páginas que todavía no corresponden a este checkpoint serán:

```text
shells funcionales mínimos
```

No archivos completamente vacíos.

---

# 99. Dashboard provisional

Por ejemplo:

```text
Dashboard

Los datos de consumo se implementarán
en el siguiente checkpoint.
```

---

# 100. Historial provisional

```text
Historial

La interfaz de lecturas se implementará
en CHECKPOINT 9.
```

---

# 101. Usuarios provisional

Debe confirmar que:

```text
la ruta ADMIN funciona
```

sin construir todavía el CRUD visual.

---

# 102. No simular información

No mostrar:

```text
51 kWh
218 kWh
```

hardcodeados.

---

# 103. ForbiddenPage

Ruta:

```text
/403
```

Contenido:

```text
No tienes permisos para acceder a esta sección.

[ Volver al dashboard ]
```

---

# 104. NotFoundPage

Para cualquier ruta inexistente:

```text
Página no encontrada.

[ Volver ]
```

---

# 105. Usuario autenticado entra a `/login`

Debe ser redirigido a:

```text
/dashboard
```

---

# 106. Ruta raíz

Si autenticado:

```text
/ → /dashboard
```

Si anónimo:

```text
/ → /login
```

---

# 107. AppLayout

Crear:

```text
frontend/src/layouts/AppLayout.jsx
```

---

# 108. Responsabilidad

Contendrá:

```text
header
navegación
contenido mediante Outlet
acción logout
```

---

# 109. Navegación base

Para ambos:

```text
Dashboard
Historial
Perfil
```

---

# 110. ADMIN

Además:

```text
Usuarios
```

---

# 111. USUARIO

No ve:

```text
Usuarios
```

---

# 112. Pero nuevamente

Ocultar el enlace:

```text
no sustituye el backend.
```

---

# 113. Navegación semántica

Utilizar:

```html
<nav>
```

y enlaces reales.

---

# 114. `NavLink`

Puede utilizarse para indicar:

```text
ruta activa
```

sin manejarlo manualmente.

---

# 115. Header

Puede mostrar:

```text
Control de Consumo Eléctrico
nombre del usuario
rol
Cerrar sesión
```

---

# 116. No mostrar email constantemente

No es necesario saturar el layout.

Podrá quedar en Perfil.

---

# 117. Sidebar base

En escritorio podremos comenzar con:

```text
sidebar sencilla
```

---

# 118. Navegación móvil base

Podemos crear una barra inferior básica para:

```text
Inicio
Historial
Perfil
```

---

# 119. ADMIN móvil

`Usuarios` puede aparecer dentro de un menú adicional o de Perfil posteriormente.

Durante CHECKPOINT 7 basta con que siga accesible.

---

# 120. Responsive final

La optimización completa pertenece a:

```text
CHECKPOINT 11
```

---

# 121. No bloquear desarrollo actual

La navegación base sí debe funcionar razonablemente en:

```text
desktop
móvil
```

sin intentar todavía el refinamiento visual final.

---

# 122. AuthLayout

Crear:

```text
frontend/src/layouts/AuthLayout.jsx
```

para Login.

---

# 123. Login centrado

Diseño mínimo:

```text
contenedor
formulario
```

sin ilustraciones innecesarias.

---

# 124. CSS inicial

Crear/organizar:

```text
src/styles/
├── global.css
└── tokens.css
```

---

# 125. Tema completo todavía no

No implementaremos aún:

```text
SISTEMA
CLARO
OSCURO
```

a nivel completo.

Eso llegará en CHECKPOINT 10.

---

# 126. Pero sí utilizar variables

Podemos iniciar:

```css
--color-background
--color-surface
--color-text
--color-border
--color-accent
```

para no generar deuda visual.

---

# 127. No hardcodear CSS caóticamente

La base deberá respetar SPEC-008 desde el comienzo.

---

# 128. Perfil provisional

`PerfilPage` puede mostrar datos reales de:

```text
usuario
```

obtenidos de AuthContext:

```text
nombre
correo
rol
tema
```

---

# 129. No llamar `/auth/me` en cada página

AuthContext ya mantiene al usuario.

---

# 130. ¿Cuándo usar `/auth/me`?

Podrá utilizarse:

```text
cuando necesitemos refrescar explícitamente identidad
```

pero no cada render.

---

# 131. Refresh ya devuelve usuario

Durante arranque:

```text
/Auth refresh
```

establece identidad.

---

# 132. Módulos API

Crear estructura:

```text
src/api/
├── client.js
└── auth.api.js
```

---

# 133. No crear todavía

```text
lecturas.api.js
estadisticas.api.js
usuarios.api.js
```

si no se utilizan hasta los checkpoints siguientes.

---

# 134. Principio

Los archivos aparecen cuando existe una necesidad real.

---

# 135. Hook `useAuth`

Crear:

```text
frontend/src/hooks/useAuth.js
```

para consumir AuthContext correctamente.

---

# 136. Protección

Si se usa fuera de AuthProvider:

```text
error claro de desarrollo
```

---

# 137. App.jsx

Debe dejar de contener la pantalla demo.

Será algo parecido a:

```text
AuthProvider
↓
AppRouter
```

---

# 138. main.jsx

Mantendrá:

```text
React.StrictMode
App
global.css
```

según corresponda.

---

# 139. StrictMode

Puede provocar efectos dobles en desarrollo.

---

# 140. Cuidado con restore session

El efecto de restauración debe tolerar:

```text
ejecución adicional en desarrollo
```

sin destruir la sesión mediante múltiples Refresh Token rotatorios.

---

# 141. Punto importante

React StrictMode puede ejecutar ciertos ciclos de montaje/desmontaje adicionales en desarrollo.

Si `AuthProvider` dispara:

```text
/auth/refresh
```

ingenuamente dos veces, podemos rotar el mismo Refresh Token concurrentemente.

---

# 142. Solución

La restauración inicial también deberá utilizar:

```text
refresh-coordinator
```

---

# 143. Así

Aunque el efecto se active más de una vez:

```text
solo una renovación real
```

estará en vuelo.

---

# 144. Esta prueba es importante

No desactivar:

```text
StrictMode
```

simplemente para esconder el problema.

---

# 145. API client — sesión expirada

Si renovación falla:

```text
notificarSesionExpirada()
```

---

# 146. AuthProvider recibe evento

Resultado:

```text
usuario = null
estado = ANONIMO
```

---

# 147. Router reacciona

ProtectedRoute:

```text
→ /login
```

---

# 148. Evitar redirects dentro de Axios

`client.js` no debería hacer directamente:

```javascript
window.location.href = '/login';
```

---

# 149. Motivo

La navegación pertenece a:

```text
React Router
```

y el estado de autenticación a:

```text
AuthContext
```

---

# 150. Manejo de errores HTTP

Crear una utilidad pequeña:

```text
src/utils/api-error.js
```

para extraer:

```text
codigo
mensaje
status
```

de errores Axios.

---

# 151. Evitar en páginas

```javascript
error.response?.data?.error?.mensaje
```

repetido constantemente.

---

# 152. Respuesta inesperada

Fallback:

```text
Ocurrió un problema inesperado.
```

---

# 153. No mostrar detalles técnicos

Nunca:

```text
AxiosError
stack
config
headers
```

---

# 154. Tests frontend

Configurar:

```text
Vitest
jsdom
React Testing Library
```

---

# 155. Script package.json

Agregar:

```json
"test": "vitest run",
"test:watch": "vitest"
```

---

# 156. Setup

Crear:

```text
frontend/src/test/setup.js
```

con:

```text
@testing-library/jest-dom
```

---

# 157. vitest.config.js

Configurar:

```text
environment = jsdom
setupFiles
```

---

# 158. No probar implementación interna

Preferir:

```text
usuario ve Login
usuario pulsa botón
usuario ve error
```

sobre:

```text
state.password === ...
```

---

# 159. Test Login visible

Debe encontrar por label:

```text
Correo
Contraseña
```

y botón:

```text
Iniciar sesión
```

---

# 160. Test login exitoso

Mockear API:

```text
login → usuario + accessToken
```

Esperado:

```text
usuario autenticado
redirección dashboard
```

---

# 161. Test credenciales inválidas

API:

```text
401 AUTH_CREDENCIALES_INVALIDAS
```

UI:

```text
Correo o contraseña incorrectos.
```

---

# 162. Test rate limit

API:

```text
429
```

UI muestra mensaje comprensible.

---

# 163. Test usuario inactivo

```text
403 AUTH_USUARIO_INACTIVO
```

mensaje correspondiente.

---

# 164. Test restauración

AuthProvider inicia.

Refresh válido.

Esperado:

```text
AUTENTICADO
```

---

# 165. Test sin cookie

Refresh responde:

```text
401
```

Esperado:

```text
ANONIMO
```

sin alerta de error.

---

# 166. Test ProtectedRoute

ANONIMO:

```text
/dashboard
→ /login
```

---

# 167. Test protegido autenticado

AUTENTICADO:

```text
/dashboard
```

visible.

---

# 168. Test AdminRoute

ADMIN:

```text
/admin/usuarios
```

permitido.

---

# 169. USUARIO

```text
/admin/usuarios
→ /403
```

---

# 170. Test menú

ADMIN ve:

```text
Usuarios
```

USUARIO:

```text
no lo ve
```

---

# 171. Test logout

Backend responde:

```text
204
```

Esperado:

```text
sesión limpia
/login
```

---

# 172. Test logout fallido

API produce error de red.

Esperado:

```text
sesión frontend continúa
mensaje error
```

---

# 173. Test refresh coordinator

Invocar simultáneamente:

```text
renovarUnaVez(fn)
renovarUnaVez(fn)
renovarUnaVez(fn)
```

Esperado:

```text
fn llamado 1 vez
```

---

# 174. Test de nuevo ciclo

Cuando Promise anterior termina:

```text
una nueva llamada futura
```

sí puede ejecutar otra renovación.

---

# 175. Test 401 concurrentes

Idealmente verificar el cliente HTTP:

```text
varias requests protegidas
↓
401 simultáneos
↓
1 refresh
```

---

# 176. No necesitamos E2E todavía

Las pruebas con backend + navegador completo serán:

```text
CHECKPOINT 12
```

---

# 177. Pero integración frontend sí

En este checkpoint queremos probar:

```text
Context
Router
API abstraída
```

---

# 178. Test 403 no refresca

Si API devuelve:

```text
403
```

`/auth/refresh` no debe llamarse.

---

# 179. Test 422 no refresca

Mismo principio.

---

# 180. Test 500 no refresca

Mismo principio.

---

# 181. Test refresh fallido

Request protegida:

```text
401
```

Refresh:

```text
401
```

Resultado:

```text
sesión ANONIMO
```

y request no entra en bucle.

---

# 182. No localStorage tokens

Agregar una revisión/test si resulta útil.

En código no debe existir:

```text
localStorage.setItem('token'
sessionStorage.setItem('token'
```

---

# 183. localStorage y tema

Posteriormente sí podrá usarse para:

```text
preferencia visual
```

pero no autenticación.

---

# 184. Cookies

React no debe intentar leer:

```text
refresh_token
```

---

# 185. Nada de `document.cookie`

para obtener credenciales.

---

# 186. Seguridad XSS

No utilizar:

```text
dangerouslySetInnerHTML
```

en Login/Layout.

---

# 187. Navegación accesible

Enlaces:

```text
Dashboard
Historial
Perfil
Usuarios
```

deben tener texto accesible.

---

# 188. Botón logout

Debe ser:

```html
<button>
```

no un `div` clickeable.

---

# 189. Focus

Login y navegación deben mostrar:

```text
focus visible
```

---

# 190. Enter

El formulario login debe enviarse con:

```text
Enter
```

correctamente.

---

# 191. No escuchar teclado manualmente sin necesidad

Utilizar:

```html
<form>
```

y semántica HTML.

---

# 192. Responsive mínimo del login

Debe ser usable al menos en:

```text
375 px
```

sin scroll horizontal.

---

# 193. Layout mínimo

También debe evitar overflow evidente.

El refinamiento final llega después.

---

# 194. Estado de carga inicial

Mientras se intenta refresh:

```text
no renderizar rutas privadas todavía
```

---

# 195. Error del servidor durante restore

Hay diferencia entre:

```text
401
```

y:

```text
500 / error de red
```

---

# 196. 401 durante restore

Significa:

```text
sin sesión
```

→ Login.

---

# 197. Error de red durante restore

No sabemos con certeza si la cookie sigue siendo válida.

---

# 198. Decisión MVP

Ante fallo de red:

```text
estado = ANONIMO
```

pero Login puede mostrar:

```text
No se pudo conectar con el servidor.
```

sin borrar cookies manualmente.

---

# 199. Cuando backend vuelva

El usuario podrá reintentar o recargar.

---

# 200. Ruta Login y cookie existente

Si existe sesión válida y el usuario abre `/login`:

```text
restore
↓
AUTENTICADO
↓
/dashboard
```

---

# 201. Perfil básico

Debe mostrar información real:

```text
Nombre
Correo
Rol
```

---

# 202. Tema

Puede mostrar todavía:

```text
Tema actual: SISTEMA
```

pero no implementaremos selector completo hasta CHECKPOINT 10.

---

# 203. Cambio de contraseña

Tampoco construiremos todavía el formulario final.

CHECKPOINT 10 lo integrará en Perfil.

---

# 204. UsuariosPage

Por ahora solo prueba autorización.

Ejemplo:

```text
Administración de usuarios

Interfaz administrativa pendiente.
```

---

# 205. No hacer requests administrativos todavía

Eso llega en el checkpoint visual correspondiente.

---

# 206. DashboardPage

No consumir todavía:

```text
/estadisticas/resumen
```

Eso empieza en CHECKPOINT 8.

---

# 207. HistorialPage

No consumir todavía:

```text
/lecturas
```

Eso llega en CHECKPOINT 9.

---

# 208. Beneficio

CHECKPOINT 7 queda enfocado exclusivamente en:

```text
sesión
routing
layout
```

---

# 209. Estructura frontend esperada

```text
frontend/src/
├── api/
│   ├── auth.api.js
│   └── client.js
│
├── auth/
│   ├── refresh-coordinator.js
│   └── session-memory.js
│
├── components/
│   ├── auth/
│   ├── layout/
│   └── ui/
│
├── config/
│   └── env.js
│
├── contexts/
│   └── AuthContext.jsx
│
├── hooks/
│   └── useAuth.js
│
├── layouts/
│   ├── AppLayout.jsx
│   └── AuthLayout.jsx
│
├── pages/
│   ├── LoginPage.jsx
│   ├── DashboardPage.jsx
│   ├── HistorialPage.jsx
│   ├── PerfilPage.jsx
│   ├── UsuariosPage.jsx
│   ├── ForbiddenPage.jsx
│   └── NotFoundPage.jsx
│
├── routes/
│   ├── AdminRoute.jsx
│   ├── AppRouter.jsx
│   └── ProtectedRoute.jsx
│
├── styles/
│   ├── global.css
│   └── tokens.css
│
├── test/
│   └── setup.js
│
├── utils/
│   └── api-error.js
│
├── App.jsx
└── main.jsx
```

---

# 210. No crear componentes prematuros

Todavía no necesitamos:

```text
MetricCard
ConsumptionChart
ReadingTable
UserForm
ThemeSelector
```

---

# 211. README frontend

Actualizar:

```text
## Autenticación frontend
```

Explicar:

```text
Access Token → memoria
Refresh Token → HttpOnly cookie
Axios → renovación automática
```

---

# 212. Nunca documentar tokens reales

Solo arquitectura.

---

# 213. Smoke test manual

Con backend ejecutándose:

```text
1. abrir /login
2. iniciar sesión como ADMIN
3. llegar /dashboard
4. abrir /historial
5. abrir /perfil
6. abrir /admin/usuarios
7. cerrar sesión
8. comprobar regreso a /login
```

---

# 214. USUARIO

```text
1. login USUARIO
2. dashboard
3. historial
4. perfil
5. intentar /admin/usuarios
```

Esperado:

```text
/403
```

---

# 215. Refresh manual

Después de login:

```text
esperar que Access Token expire
```

o reducir temporalmente su duración en entorno controlado.

Después hacer una petición protegida.

Esperado:

```text
renovación transparente
```

---

# 216. No cambiar configuración permanente solo para test

Puede utilizarse:

```text
entorno test
```

o una duración temporal controlada.

---

# 217. F5

Después de login:

```text
recargar página
```

Esperado:

```text
sesión se restaura
```

aunque Access Token anterior estaba solo en memoria.

---

# 218. Prueba clave

Después del F5:

```text
NO pedir login nuevamente
```

si Refresh Token sigue válido.

---

# 219. Logout + F5

Después de logout:

```text
F5
```

debe permanecer:

```text
ANONIMO
```

porque backend revocó la sesión y eliminó cookie.

---

# 220. Expiración real de sesión

Si backend revoca sesión externamente:

```text
siguiente request
↓
401
↓
refresh falla
↓
Login
```

---

# 221. Regresión backend

No modificamos reglas de backend.

Aun así deben seguir pasando:

```text
CHECKPOINT 3
CHECKPOINT 4
CHECKPOINT 5
CHECKPOINT 6
```

---

# 222. Backend gate

Desde backend:

```bash
npm run lint
npm test
```

PASS.

---

# 223. Frontend gate

Desde frontend:

```bash
npm run lint
npm test
npm run build
```

Todos:

```text
PASS
```

---

# 224. Build

Especialmente importante porque:

```text
React Router
Axios
Context
```

ya forman parte del bundle real.

---

# 225. Consola navegador

No debe mostrar:

```text
errores críticos
tokens
cookies
passwords
```

---

# 226. React warnings

No deben quedar warnings importantes como:

```text
keys faltantes
updates during render
loops de effects
```

---

# 227. Network tab

Es válido observar:

```text
Authorization: Bearer ...
```

porque el navegador necesita enviarlo.

Pero nuestro código/logging no debe imprimirlo.

---

# 228. HttpOnly cookie

En herramientas del navegador podrá aparecer como cookie, pero JavaScript no podrá leer su valor.

---

# 229. No Git secrets

Revisar:

```bash
git status
```

y:

```text
frontend/.env
backend/.env
backend/.env.test
```

no deben aparecer.

---

# 230. Commit

Después del gate verde:

```bash
git add .
git status
```

Revisar.

Después:

```bash
git commit -m "feat: implementar autenticacion y navegacion frontend"
```

---

# 231. Working tree

Esperado:

```text
nothing to commit, working tree clean
```

---

# 232. Gate CHECKPOINT 7

### CP7-001

Axios instalado.

### CP7-002

React Router instalado.

### CP7-003

Existe configuración frontend centralizada.

### CP7-004

VITE_API_URL está validada.

### CP7-005

No existen secretos `VITE_*`.

### CP7-006

Existe `publicClient`.

### CP7-007

Existe `apiClient`.

### CP7-008

Ambos utilizan `withCredentials`.

### CP7-009

Access Token vive solo en memoria.

### CP7-010

Access Token no usa localStorage.

### CP7-011

Access Token no usa sessionStorage.

### CP7-012

React no lee Refresh Token.

### CP7-013

Request interceptor añade Bearer.

### CP7-014

401 permite un refresh.

### CP7-015

Cada petición se reintenta máximo una vez.

### CP7-016

Refresh utiliza cliente sin interceptor recursivo.

### CP7-017

Existe coordinador de refresh.

### CP7-018

401 concurrentes generan un solo refresh.

### CP7-019

Refresh fallido limpia sesión.

### CP7-020

403 no dispara refresh.

### CP7-021

422 no dispara refresh.

### CP7-022

500 no dispara refresh.

### CP7-023

Existe AuthContext.

### CP7-024

AuthContext distingue CARGANDO.

### CP7-025

AuthContext distingue AUTENTICADO.

### CP7-026

AuthContext distingue ANONIMO.

### CP7-027

Inicio intenta restaurar sesión.

### CP7-028

Restore utiliza `/auth/refresh`.

### CP7-029

Restore soporta StrictMode sin refresh concurrente duplicado.

### CP7-030

F5 restaura sesión válida.

### CP7-031

Sin cookie conduce a ANONIMO.

### CP7-032

Existe LoginPage.

### CP7-033

Login tiene labels reales.

### CP7-034

No existe registro público.

### CP7-035

No existe recuperación pública de contraseña.

### CP7-036

Login exitoso guarda token en memoria.

### CP7-037

Login guarda usuario.

### CP7-038

Login redirige a dashboard.

### CP7-039

Login conserva destino protegido previo.

### CP7-040

Credenciales inválidas muestran error comprensible.

### CP7-041

Usuario inactivo muestra estado correcto.

### CP7-042

429 se maneja.

### CP7-043

Error de red se maneja.

### CP7-044

Existe loading de login.

### CP7-045

Existe logout frontend.

### CP7-046

Logout llama backend antes de limpiar sesión.

### CP7-047

Logout exitoso limpia sesión.

### CP7-048

Logout fallido no afirma falsamente cierre exitoso.

### CP7-049

Existe ProtectedRoute.

### CP7-050

ANONIMO no entra en rutas privadas.

### CP7-051

AUTENTICADO entra.

### CP7-052

CARGANDO no genera flash de Login.

### CP7-053

Existe AdminRoute.

### CP7-054

ADMIN accede a `/admin/usuarios`.

### CP7-055

USUARIO recibe `/403`.

### CP7-056

Existe página 403.

### CP7-057

Existe página 404.

### CP7-058

Existe AppLayout.

### CP7-059

Existe AuthLayout.

### CP7-060

Navegación contiene Dashboard.

### CP7-061

Navegación contiene Historial.

### CP7-062

Navegación contiene Perfil.

### CP7-063

ADMIN ve Usuarios.

### CP7-064

USUARIO no ve Usuarios.

### CP7-065

El backend sigue siendo autoridad de permisos.

### CP7-066

Perfil muestra identidad real.

### CP7-067

No existen métricas hardcodeadas.

### CP7-068

No se llama todavía innecesariamente a estadísticas.

### CP7-069

No se llama todavía innecesariamente a historial.

### CP7-070

Vitest frontend configurado.

### CP7-071

React Testing Library configurado.

### CP7-072

Tests Login pasan.

### CP7-073

Tests AuthContext pasan.

### CP7-074

Tests ProtectedRoute pasan.

### CP7-075

Tests AdminRoute pasan.

### CP7-076

Test refresh coordinator pasa.

### CP7-077

Test 401 concurrente pasa.

### CP7-078

Test refresh fallido pasa.

### CP7-079

Test logout pasa.

### CP7-080

Test menú por rol pasa.

### CP7-081

Frontend lint pasa.

### CP7-082

Frontend tests pasan.

### CP7-083

Frontend build pasa.

### CP7-084

Backend regression pasa.

### CP7-085

No se registran tokens en consola.

### CP7-086

No se registran passwords.

### CP7-087

No existen secretos versionados.

### CP7-088

Existe commit.

### CP7-089

Working tree limpio.

---

# 233. Estado de SPEC-003

Después del gate tendremos:

```text
backend de autenticación
+
frontend de autenticación
+
pruebas
```

Por tanto:

```text
SPEC-003
→ IMPLEMENTADA
→ PROBADA
```

Su cierre definitivo quedará para el E2E final.

---

# 234. Estado de SPEC-011

La arquitectura frontend principal ya estará materializada.

```text
SPEC-011
→ IMPLEMENTADA EN GRAN PARTE
```

---

# 235. Estado de SPEC-010

También tendremos implementado:

```text
token en memoria
refresh coordinado
cookies no accesibles desde JS
manejo de sesión
```

Su gate final seguirá en CHECKPOINT 12.

---

# 236. Estado del roadmap

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
Frontend base y autenticación
→ CERRADO

CHECKPOINT 8
Dashboard
→ SIGUIENTE

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

# 237. Qué podremos hacer al cerrar

Por primera vez el usuario podrá utilizar en navegador:

```text
abrir aplicación
↓
Login
↓
Dashboard
↓
Historial
↓
Perfil
↓
Logout
```

con sesión real.

---

# 238. ADMIN

Podrá navegar además a:

```text
Usuarios
```

aunque todavía no tendrá el CRUD visual completo.

---

# 239. USUARIO

No podrá entrar visualmente en administración.

Y si intenta llamar la API:

```text
backend → 403
```

---

# 240. Lo que sigue

El siguiente bloque será:

```text
CHECKPOINT 8
Dashboard principal
```

Ahí implementaremos por primera vez la parte visual central del producto:

```text
GET /estadisticas/resumen
GET /estadisticas/serie

tarjeta Ayer
tarjeta 7 días
tarjeta Mes
tarjeta Año

gráfico de barras
7 días / Mes / Año

promedio
mayor consumo
última lectura
estado lectura de hoy
Registrar lectura
estados sin datos
períodos parciales
```

y React comenzará a mostrar realmente el consumo eléctrico del hogar.

---

# 241. Criterio pedagógico

Un aprendiz deberá poder explicar:

1. ¿Por qué el Access Token está en memoria?
2. ¿Por qué no usamos localStorage para autenticación?
3. ¿Dónde está el Refresh Token?
4. ¿Por qué React no puede leerlo?
5. ¿Qué hace `withCredentials`?
6. ¿Qué diferencia existe entre `publicClient` y `apiClient`?
7. ¿Qué hace el interceptor de request?
8. ¿Qué hace el interceptor de response?
9. ¿Por qué un 401 puede provocar refresh?
10. ¿Por qué un 403 no debe hacerlo?
11. ¿Por qué una petición se reintenta solo una vez?
12. ¿Por qué no utilizamos `apiClient` para `/auth/refresh`?
13. ¿Qué problema producen varios 401 simultáneos?
14. ¿Qué es `refreshPromise`?
15. ¿Por qué todos esperan la misma renovación?
16. ¿Qué hace AuthContext?
17. ¿Por qué existen tres estados de autenticación?
18. ¿Por qué necesitamos CARGANDO?
19. ¿Cómo se restaura la sesión después de F5?
20. ¿Por qué React StrictMode es importante en este flujo?
21. ¿Qué hace ProtectedRoute?
22. ¿Qué hace AdminRoute?
23. ¿Por qué AdminRoute no es seguridad suficiente?
24. ¿Qué ocurre cuando logout falla?
25. ¿Por qué no limpiamos localmente antes de saber que backend revocó la sesión?
26. ¿Por qué las páginas aún no tienen datos hardcodeados?
27. ¿Por qué dejamos dashboard e historial para checkpoints separados?
28. ¿Qué prueba demuestra que el refresh coordinado funciona?

Cuando todos los `CP7-*` estén verdes:

```text
CHECKPOINT 7 → CERRADO
```
