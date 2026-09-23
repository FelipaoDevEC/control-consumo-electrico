# CHECKPOINT 11 — Responsive, accesibilidad y pulido visual integral

## 1. Objetivo

Realizar el gate visual y de accesibilidad de toda la aplicación antes del cierre E2E.

Al finalizar este checkpoint tendremos:

* experiencia móvil validada;
* experiencia tablet validada;
* experiencia desktop validada;
* navegación responsive final;
* dashboard adaptado;
* historial adaptado;
* administración de usuarios adaptada;
* perfil adaptado;
* formularios adaptados;
* modales accesibles;
* navegación completa mediante teclado;
* foco visible;
* labels correctamente asociados;
* controles con nombres accesibles;
* contraste suficiente;
* estados que no dependan únicamente del color;
* soporte de `prefers-reduced-motion`;
* gráficos con alternativa accesible;
* ausencia de overflow horizontal accidental;
* estados loading, vacío y error coherentes;
* pruebas visuales/responsive automatizadas donde aporten valor.

No añadiremos nuevas funcionalidades de negocio.

---

# 2. Precondiciones

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
```

Funcionalmente ya deben existir:

```text
Login
Dashboard
Registro de lectura
Historial
Corrección
Perfil
Temas
Administración backend
```

---

# 3. SPEC relacionadas

Principalmente:

```text
SPEC-007 → Dashboard
SPEC-008 → Sistema visual
SPEC-009 → Administración usuarios
SPEC-010 → Seguridad
SPEC-012 → Pruebas
```

Además verificaremos visualmente:

```text
SPEC-003
SPEC-004
SPEC-006
```

---

# 4. Principio

Responsive no significa:

> “hacer todo más pequeño”.

Significa:

> reorganizar la información según el espacio disponible manteniendo legibilidad, prioridad y facilidad de uso.

---

# 5. Enfoque

Seguiremos:

```text
mobile first
```

y progresivamente ampliaremos:

```text
móvil
↓
tablet
↓
desktop
↓
desktop amplio
```

---

# 6. Viewports de referencia

Verificaremos como mínimo:

```text
320 × 568
375 × 667
390 × 844
768 × 1024
1024 × 768
1280 × 800
1440 × 900
```

No representan dispositivos obligatorios.

Sirven para descubrir problemas de layout.

---

# 7. No diseñar por marca

No tendremos reglas como:

```text
si iPhone 14
si Samsung S23
si iPad Pro
```

Trabajaremos según:

```text
espacio disponible
```

---

# 8. Breakpoints

Podemos mantener aproximadamente:

```text
< 640px     móvil
>= 640px    móvil grande
>= 768px    tablet
>= 1024px   desktop
>= 1280px   desktop amplio
```

Pero el contenido manda.

---

# 9. Regla importante

Si un componente se rompe a:

```text
850px
```

no debemos esperar necesariamente hasta:

```text
1024px
```

para corregirlo.

El breakpoint existe para servir al contenido.

---

# 10. Overflow horizontal

En ninguna pantalla principal deberá existir scroll horizontal accidental.

Verificar:

```text
Login
Dashboard
Historial
Perfil
Usuarios
Formularios
403
404
```

---

# 11. Cómo detectar

Además de inspección visual:

```javascript
document.documentElement.scrollWidth
<=
document.documentElement.clientWidth
```

deberá cumplirse en los viewports principales.

---

# 12. Excepciones

Un componente realmente horizontal podría permitir scroll interno controlado.

Pero en este MVP no debería ser necesario para las pantallas principales.

---

# 13. Navegación desktop

A partir de espacio suficiente:

```text
sidebar visible
```

con:

```text
Dashboard
Historial
Perfil
Usuarios ← ADMIN
```

---

# 14. Sidebar

Debe:

* tener ancho estable;
* no tapar contenido;
* indicar ruta activa;
* funcionar con teclado;
* responder al tema;
* tolerar zoom.

---

# 15. Sidebar no debe usar

```text
position:absolute
```

con medidas frágiles si eso provoca superposición.

---

# 16. Navegación móvil

Utilizaremos barra inferior para:

```text
Inicio
Historial
Perfil
```

---

# 17. ADMIN móvil

La sección:

```text
Usuarios
```

puede aparecer dentro de:

```text
Perfil
```

o un menú adicional.

---

# 18. Decisión

Para mantener la barra inferior simple:

```text
Inicio
Historial
Perfil
```

serán los tres elementos permanentes.

En Perfil, ADMIN tendrá:

```text
Administración de usuarios
```

como acceso adicional.

---

# 19. Motivo

Evita una barra inferior con demasiados destinos.

---

# 20. Ruta activa

Debe distinguirse mediante:

```text
texto
+
tratamiento visual
```

No solo color.

---

# 21. Iconos

Podrán acompañar:

```text
Inicio
Historial
Perfil
```

pero no sustituir completamente la etiqueta.

---

# 22. Touch targets

Objetivo mínimo aproximado:

```text
44 × 44 px
```

para controles táctiles importantes.

---

# 23. Dashboard móvil

Prioridad final:

```text
1. lectura de hoy
2. consumo de ayer
3. gráfico últimos 7 días
4. total 7 días
5. mes
6. promedio/mayor/cobertura
7. año
```

---

# 24. Tarjetas en móvil

Preferencia:

```text
1 columna
```

para métricas principales si dos columnas reducen demasiado legibilidad.

---

# 25. Móvil grande

Podemos utilizar:

```text
2 columnas
```

solo si:

```text
valor
unidad
subtexto
```

siguen siendo legibles.

---

# 26. Tablet

Métricas:

```text
2 × 2
```

---

# 27. Desktop

Métricas:

```text
4 en fila
```

---

# 28. Dashboard ancho máximo

En pantallas muy amplias:

```text
max-width
```

razonable.

Ejemplo conceptual:

```text
1400px
```

---

# 29. No estirar infinitamente

Una tarjeta no debe ocupar:

```text
500px
```

de ancho solo porque el monitor es ultrawide.

---

# 30. Gráfico responsive

`ResponsiveContainer` deberá adaptarse al contenedor.

---

# 31. Altura móvil

El gráfico debe seguir siendo útil sin ocupar toda la pantalla.

Objetivo aproximado:

```text
240–300px
```

según viewport.

---

# 32. Tablet/desktop

Puede aumentar moderadamente.

---

# 33. Etiquetas del gráfico

Móvil:

```text
menos ticks
```

si es necesario.

---

# 34. Tooltip

Debe ser usable mediante interacción táctil.

No depender exclusivamente de:

```text
hover
```

---

# 35. Información alternativa

El gráfico tendrá una descripción textual accesible.

---

# 36. Ejemplo

```text
Últimos 7 días:
26 ago: 5 kWh.
27 ago: 7 kWh.
28 ago: sin lectura.
29 ago: consumo diario no disponible.
30 ago: 6 kWh.
31 ago: 9 kWh.
1 sep: 7 kWh.
```

---

# 37. No duplicar ruido visual

La alternativa puede estar:

```text
visualmente oculta
```

pero disponible para lectores de pantalla.

---

# 38. `aria-describedby`

El gráfico puede relacionarse con su resumen accesible.

---

# 39. Dato cero

Debe anunciarse:

```text
0 kWh
```

---

# 40. Dato faltante

Debe anunciarse:

```text
Sin dato
```

Nunca ambos iguales.

---

# 41. Historial desktop

Mantener:

```text
tabla semántica
```

---

# 42. Columnas

Verificar que:

```text
Fecha
Lectura
Consumo
Registrado por
Estado
Acciones
```

sean legibles a 1024px.

---

# 43. Si no caben

No reducir fuente excesivamente.

Podemos:

```text
ocultar información secundaria
```

o cambiar antes a tarjetas.

---

# 44. Historial tablet

Puede utilizar:

```text
tarjetas
```

si la tabla deja de ser cómoda.

---

# 45. Historial móvil

Definitivamente:

```text
ReadingCard
```

---

# 46. No renderizar contenido duplicado accesible

Si ambas vistas existen en DOM con CSS:

```text
display:none
```

verificar que tecnologías asistivas no lean ambas.

---

# 47. Preferencia

Render condicional según media query/hook cuando resulte más limpio.

---

# 48. Sin JavaScript innecesario

Si CSS puede resolverlo correctamente sin duplicar accesibilidad, también es válido.

---

# 49. Tarjetas del historial

Deben mantener orden:

```text
Fecha
Lectura
Consumo
Estado
Registrado por
Acción
```

---

# 50. Intervalos incompletos

En móvil no deben convertirse en párrafos enormes.

Ejemplo:

```text
Dato incompleto
15 kWh entre 28–30 ago
```

---

# 51. Administración usuarios

Aunque el frontend administrativo completo no se había desarrollado en detalle en checkpoints anteriores, para cerrar el MVP debe existir interfaz usable acorde a `SPEC-009`.

Este checkpoint incluirá el pulido responsive/accesible de esa interfaz si fue implementada previamente durante integración.

---

# 52. Si CRUD visual aún no existe

Debe completarse antes de cerrar CHECKPOINT 11, porque `SPEC-009` exige frontend administrativo.

Pantalla:

```text
/admin/usuarios
```

debe permitir:

```text
listar
crear
editar
activar/desactivar
restablecer contraseña
```

---

# 53. Desktop usuarios

Tabla:

```text
Nombre
Correo
Rol
Estado
Acciones
```

---

# 54. Móvil usuarios

Tarjetas.

---

# 55. Crear/editar usuario móvil

Formulario:

```text
1 columna
```

---

# 56. No modal estrecho

Si el formulario tiene muchos campos en móvil:

```text
pantalla completa
```

o drawer adecuado.

---

# 57. Confirmar desactivación

El diálogo debe ser accesible.

---

# 58. Perfil

En móvil:

```text
una columna
```

---

# 59. Apariencia

Radio buttons deben tener:

```text
espacio táctil suficiente
```

---

# 60. Password

Inputs no deben salirse de pantalla.

---

# 61. Login

A:

```text
320px
```

debe ser completamente usable.

---

# 62. No card gigantesca fija

Usar:

```text
width: 100%
max-width
padding
```

---

# 63. Login landscape

También revisar altura limitada.

No colocar contenido centrado verticalmente de manera que quede cortado.

---

# 64. Formularios

Todos deben usar:

```text
label real
input
mensaje auxiliar
mensaje error
```

---

# 65. Asociación

`label` debe utilizar:

```text
htmlFor
```

o envolver correctamente el input.

---

# 66. Placeholder

No sustituye label.

---

# 67. Errores

Deben vincularse mediante:

```text
aria-describedby
```

cuando sea apropiado.

---

# 68. `aria-invalid`

Inputs inválidos:

```text
aria-invalid="true"
```

---

# 69. Errores no solo color

Además de borde de error:

```text
mensaje textual
```

---

# 70. Focus visible

Todos los elementos interactivos deben mostrar foco claro.

Verificar:

```text
buttons
links
inputs
radio buttons
pagination
tabs de período
acciones de fila
```

---

# 71. No usar

```css
outline: none;
```

sin sustituto.

---

# 72. `:focus-visible`

Preferencia:

```css
:focus-visible
```

con indicador coherente.

---

# 73. Teclado

Debe poder completarse el flujo:

```text
Login
↓
Dashboard
↓
Registrar lectura
↓
Historial
↓
Detalle
↓
Perfil
↓
Logout
```

sin ratón.

---

# 74. Teclas

Principalmente:

```text
Tab
Shift+Tab
Enter
Space
Escape
```

---

# 75. Orden del foco

Debe seguir el orden lógico visual.

---

# 76. No tabindex positivos

Evitar:

```html
tabindex="5"
```

o similares.

Preferir orden natural del DOM.

---

# 77. Skip link

Añadir:

```text
Saltar al contenido principal
```

como enlace visible al recibir foco.

---

# 78. Motivo

Permite saltar navegación repetitiva mediante teclado.

---

# 79. `main`

Cada layout debe contener:

```html
<main id="contenido-principal">
```

---

# 80. Semántica

Utilizar:

```text
header
nav
main
section
form
table
button
```

correctamente.

---

# 81. Evitar

```text
div onclick
```

cuando corresponde:

```text
button
```

---

# 82. Headings

Jerarquía consistente:

```text
h1 → título página
h2 → secciones
h3 → subsecciones
```

---

# 83. No saltos arbitrarios

Evitar:

```text
h1
h4
```

sin estructura.

---

# 84. Modales

Todo modal debe cumplir:

```text
role="dialog"
aria-modal="true"
nombre accesible
```

o utilizar una implementación equivalente.

---

# 85. Focus trap

Al abrir:

```text
focus permanece dentro
```

---

# 86. Focus inicial

Preferentemente al:

```text
título
primer campo
```

según contexto.

---

# 87. Al cerrar

Focus vuelve al control que abrió el modal.

---

# 88. Escape

Cierra cuando corresponde.

---

# 89. Click fuera

Puede cerrar solo si no existe operación pendiente y no provoca pérdida accidental importante.

---

# 90. Durante submit

No permitir cierre accidental si puede confundir el resultado.

---

# 91. Alertas

Mensajes importantes deben ser anunciables.

---

# 92. Errores formulario

Podemos utilizar:

```text
role="alert"
```

con moderación.

---

# 93. Toast

Los mensajes de éxito pueden utilizar:

```text
aria-live="polite"
```

---

# 94. Error crítico

Puede usar:

```text
aria-live="assertive"
```

solo cuando realmente corresponda.

---

# 95. No abusar de lectores de pantalla

No convertir cada cambio menor en una interrupción.

---

# 96. Contraste

Objetivo:

```text
WCAG 2.2 AA
```

para contraste relevante.

---

# 97. Texto normal

Objetivo aproximado:

```text
4.5:1
```

---

# 98. Texto grande

Al menos:

```text
3:1
```

según criterio aplicable.

---

# 99. Controles

Estados y bordes importantes también deben ser perceptibles.

---

# 100. Tema claro

Revisar:

```text
texto secundario
borde
placeholder
disabled
badges
```

---

# 101. Tema oscuro

Especial atención a:

```text
gris sobre gris
borde casi invisible
placeholder demasiado oscuro
```

---

# 102. No asumir

Que algo “se ve bonito” significa que tiene buen contraste.

---

# 103. Herramientas

Podremos usar verificaciones automáticas donde sea posible.

No depender únicamente de ellas.

---

# 104. Estados no solo color

Ejemplo:

```text
Activo
Inactivo
Corregida
Dato incompleto
```

deben incluir texto.

---

# 105. Gráfico

Dato faltante no puede identificarse solo por tono diferente.

---

# 106. Botón disabled

Debe seguir siendo legible.

---

# 107. Tamaño de texto

Base aproximada:

```text
16px
```

---

# 108. No bajar a 11–12px

para información importante.

---

# 109. Zoom

Verificar:

```text
200 %
```

en navegador para pantallas principales.

---

# 110. Resultado

Debe seguir siendo usable sin contenido cortado críticamente.

---

# 111. Texto ampliado

Los contenedores deben crecer.

Evitar alturas rígidas innecesarias.

---

# 112. `min-height`

Preferible a `height` rígido en componentes textuales.

---

# 113. Nombres largos

Probar usuario:

```text
Administrador Principal de la Vivienda
```

---

# 114. Correo largo

Probar:

```text
usuario.con.nombre.largo@example.com
```

---

# 115. No romper sidebar/tarjetas

Utilizar:

```text
overflow-wrap
text-overflow
```

solo cuando proceda.

---

# 116. Truncamiento

Si se trunca algo importante, debe existir forma de conocer el valor completo.

---

# 117. prefers-reduced-motion

Implementar:

```css
@media (prefers-reduced-motion: reduce) {
  ...
}
```

---

# 118. Animaciones

Reducir:

```text
transiciones
animación de gráfico
modal
toast
```

cuando usuario lo solicita.

---

# 119. Recharts

Desactivar o reducir animación cuando:

```text
prefers-reduced-motion
```

sea activo.

---

# 120. Hook

Podemos crear:

```text
useReducedMotion()
```

o reutilizar `useMediaQuery`.

---

# 121. No eliminar funcionalidad

Reduced motion:

```text
reduce movimiento
```

no:

```text
romper interacción.
```

---

# 122. Estados loading

Todos los módulos deben tener comportamiento consistente.

---

# 123. Dashboard

Skeleton.

---

# 124. Historial

Skeleton/fila de carga.

---

# 125. Usuarios

Skeleton/listado loading.

---

# 126. Perfil

Como los datos vienen de AuthContext:

```text
normalmente inmediato
```

---

# 127. Login

Botón loading.

---

# 128. Evitar layout shift fuerte

Skeletons deben aproximar la estructura final.

---

# 129. Estados vacíos

Revisar:

```text
Dashboard sin lecturas
Historial vacío
Filtros sin resultados
Usuarios sin resultados
```

---

# 130. Acciones

Los estados vacíos deben ofrecer acción solo cuando corresponda.

---

# 131. Ejemplo dashboard

```text
Registrar primera lectura
```

---

# 132. Historial con filtro vacío

No necesariamente CTA de registro.

Puede mostrar:

```text
Cambiar filtros
```

---

# 133. Errores

Todos deben usar lenguaje consistente.

---

# 134. No usar

```text
Oops!
Algo explotó!
```

---

# 135. Usar

```text
No se pudo cargar el historial.
```

---

# 136. Botones Reintentar

Deben repetir únicamente:

```text
la operación de lectura fallida
```

No mutaciones anteriores.

---

# 137. Tema y accesibilidad

Focus debe verse tanto en:

```text
Claro
Oscuro
```

---

# 138. Selector de tema

Radio seleccionado debe poder identificarse sin depender solo del color.

---

# 139. Barra móvil

Estado activo también.

---

# 140. Iconos

Si un botón solo tiene icono:

```text
aria-label
```

obligatorio.

---

# 141. Ejemplos

```text
Cerrar
Menú
Página anterior
Página siguiente
Mostrar contraseña
```

---

# 142. Iconos decorativos

Deben ocultarse a lector:

```text
aria-hidden="true"
```

cuando no aportan información.

---

# 143. Tablas

Usar `scope` cuando sea apropiado:

```html
<th scope="col">
```

---

# 144. Acciones por fila

El botón debe incluir contexto accesible.

Ejemplo:

```text
Editar lectura del 31 de agosto
```

aunque visualmente solo diga:

```text
Editar
```

---

# 145. Usuarios

Acción:

```text
Desactivar a María López
```

---

# 146. Paginación

Botones:

```text
Página anterior
Página siguiente
Ir a página 2
```

---

# 147. Página actual

Debe indicarse mediante:

```text
aria-current="page"
```

cuando corresponda.

---

# 148. Selector de período gráfico

Puede implementarse como:

```text
grupo de botones
```

o tabs.

---

# 149. Si tabs

Debe implementar correctamente:

```text
role
aria-selected
keyboard
```

---

# 150. Decisión

Para simplicidad:

```text
botones segmentados
```

normales.

No implementar patrón ARIA tabs innecesariamente.

---

# 151. Estado activo

```text
aria-pressed="true"
```

puede ser apropiado.

---

# 152. Formularios móviles

Al abrir teclado virtual:

* botón submit debe seguir accesible;
* modal debe poder desplazarse;
* contenido no debe quedar detrás de navegación fija.

---

# 153. Safe areas

Para móviles modernos podemos contemplar:

```css
env(safe-area-inset-bottom)
```

en barra inferior si aporta.

---

# 154. No obligatorio

Pero útil para evitar que navegación quede pegada al borde en ciertos dispositivos.

---

# 155. Navegación inferior fija

Si es fixed:

```text
contenido debe tener padding-bottom
```

suficiente.

---

# 156. Evitar

Que la última fila del historial quede tapada por navegación.

---

# 157. Sidebar sticky

Si se utiliza:

```text
sticky
```

comprobar que no rompe scroll.

---

# 158. Header sticky

No obligatorio.

---

# 159. Formularios administrativos

Validar responsive:

```text
crear usuario
editar usuario
reset password
estado
```

---

# 160. Confirmación último ADMIN

Si backend devuelve:

```text
USUARIO_ULTIMO_ADMIN
```

mostrar mensaje claro:

```text
El sistema debe conservar al menos un administrador activo.
```

---

# 161. No mensaje técnico

---

# 162. Administración visual mínima obligatoria

Antes de cerrar este checkpoint, `/admin/usuarios` debe permitir realmente:

```text
listar
buscar
filtrar
crear
editar
activar/desactivar
reset password
```

porque el MVP exige gestión de usuarios.

---

# 163. Esto corrige una deuda del roadmap

CHECKPOINT 4 implementó el backend.

CHECKPOINT 7 dejó la página frontend provisional.

Por tanto este checkpoint debe cerrar esa brecha antes del gate final.

---

# 164. API frontend usuarios

Crear/completar:

```text
frontend/src/api/usuarios.api.js
```

Funciones:

```text
listarUsuarios
obtenerUsuario
crearUsuario
actualizarUsuario
cambiarEstadoUsuario
restablecerPasswordUsuario
```

---

# 165. Componentes

```text
components/usuarios/
├── UserTable
├── UserCard
├── UserFilters
├── UserForm
├── UserActions
├── UserStatusDialog
└── ResetPasswordForm
```

---

# 166. No eliminar usuarios

No botón Delete.

---

# 167. Crear usuario

Formulario responsive.

---

# 168. Password inicial

No mostrar después de enviar.

---

# 169. Cambiar rol

Si backend revoca sesiones, mostrar feedback:

```text
Rol actualizado.
El usuario deberá iniciar sesión nuevamente.
```

---

# 170. Desactivar

Confirmación.

---

# 171. Reactivar

Puede ser acción directa.

---

# 172. Reset password

Mensaje:

```text
Contraseña restablecida.
El usuario deberá iniciar sesión nuevamente.
```

---

# 173. ADMIN sobre sí mismo

No mostrar reset administrativo propio si backend lo rechaza por diseño.

---

# 174. Último ADMIN

Si backend rechaza cambio:

```text
mantener estado visual original
```

---

# 175. No optimistic update para roles/estado

Estas operaciones tienen reglas críticas.

Preferimos:

```text
request
↓
éxito
↓
recargar listado
```

---

# 176. Esto reduce inconsistencias

---

# 177. Pruebas responsive automatizadas

Podemos incorporar Playwright ya como dependencia de desarrollo en frontend/raíz, aunque los E2E completos serán CHECKPOINT 12.

---

# 178. Pero

Si queremos mantener checkpoints separados:

```text
CHECKPOINT 11
→ pruebas component/responsive básicas

CHECKPOINT 12
→ Playwright completo
```

---

# 179. Decisión

No necesitamos añadir Playwright todavía si aún no está instalado.

Usaremos:

```text
React Testing Library
+
pruebas manuales en viewports
```

y CHECKPOINT 12 hará navegador real exhaustivo.

---

# 180. Tests de accesibilidad automáticos

Podemos incorporar:

```text
axe-core
```

con integración de tests.

---

# 181. Dependencia recomendada

```bash
npm install -D axe-core
```

o una integración compatible con Testing Library.

---

# 182. Pero no sustituye revisión manual

Automatización detecta parte de los problemas.

---

# 183. Decisión

Utilizar:

```text
axe-core
```

para smoke tests básicos de páginas principales.

---

# 184. Páginas a escanear

```text
Login
Dashboard
Historial
Perfil
Usuarios
403
404
```

---

# 185. Cero violaciones críticas

No deben existir violaciones automáticas:

```text
serious
critical
```

sin justificación documentada.

---

# 186. Contraste automatizado

Dependiendo del entorno jsdom puede no evaluarse completamente.

La revisión visual/manual sigue siendo necesaria.

---

# 187. Checklist teclado Login

```text
Tab → correo
Tab → password
Tab → mostrar password
Tab → iniciar sesión
Enter → submit
```

orden lógico.

---

# 188. Dashboard teclado

Debe poder llegar a:

```text
Registrar lectura
7 días
Mes
Año
Historial
```

---

# 189. Historial teclado

Debe poder:

```text
cambiar filtros
paginar
ver detalle
editar si permitido
```

---

# 190. Usuarios teclado

Debe poder:

```text
buscar
filtrar
crear
abrir acciones
editar
desactivar
```

---

# 191. Perfil teclado

Debe poder:

```text
seleccionar tema
cambiar password
logout
```

---

# 192. Focus en navegación de página

Al cambiar de ruta podemos mover foco al:

```text
h1
```

o contenido principal.

---

# 193. Motivo

Los lectores de pantalla necesitan saber que cambió la vista en SPA.

---

# 194. Implementación

Crear un componente/hook:

```text
RouteFocusManager
```

o equivalente.

---

# 195. Comportamiento

Al cambiar pathname:

```text
focus al título principal
```

sin generar scroll inesperado grave.

---

# 196. Títulos del documento

Actualizar:

```text
document.title
```

por ruta.

Ejemplos:

```text
Dashboard · Consumo Eléctrico
Historial · Consumo Eléctrico
Perfil · Consumo Eléctrico
Usuarios · Consumo Eléctrico
```

---

# 197. Beneficio

Accesibilidad y navegación.

---

# 198. 403

Título correspondiente.

---

# 199. 404

También.

---

# 200. Lenguaje

HTML principal:

```html
lang="es"
```

---

# 201. Meta viewport

Vite debe incluir:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

---

# 202. Zoom

No utilizar:

```text
user-scalable=no
maximum-scale=1
```

---

# 203. Debemos permitir zoom

---

# 204. Inputs numéricos

No impedir pegar.

---

# 205. Validación

Debe funcionar tanto:

```text
teclado
pegado
autofill
```

---

# 206. Mensajes de validación

No desaparecer demasiado rápido.

---

# 207. Toasts

Tiempo suficiente para lectura.

---

# 208. Mensajes importantes

No depender únicamente del toast.

Por ejemplo errores de formulario permanecen visibles.

---

# 209. Z-index

Definir pocos niveles:

```text
navigation
dropdown
modal
toast
```

---

# 210. No usar valores caóticos

```text
999999
```

sin sistema.

---

# 211. Tokens de z-index

Añadir a:

```text
tokens.css
```

---

# 212. Espaciado

Revisar coherencia.

No tener:

```text
13px
17px
21px
```

por toda la app sin sistema.

---

# 213. Radios

Revisar consistencia.

---

# 214. Botones

Revisar variantes:

```text
primario
secundario
texto
peligro
```

---

# 215. Desactivar usuario

Puede utilizar estilo:

```text
peligro
```

moderado.

---

# 216. No convertir “Cerrar sesión” necesariamente en rojo fuerte

No destruye datos.

---

# 217. Formularios loading

Botones deben indicar progreso.

---

# 218. `aria-busy`

Puede utilizarse en regiones cargando cuando aporte.

---

# 219. Skeleton

Debe ocultarse correctamente a lector o tener texto de carga equivalente.

---

# 220. No hacer que lector lea

```text
████ ██████
```

como contenido.

---

# 221. Región del gráfico

Puede tener:

```text
aria-labelledby
```

asociado al título.

---

# 222. Estadísticas

Las tarjetas pueden ser:

```text
section/article
```

con headings apropiados.

---

# 223. No usar heading para cada número si genera jerarquía absurda

Semántica equilibrada.

---

# 224. Estados parciales

Texto recomendado:

```text
Datos parciales
```

más contexto:

```text
Hasta 31 ago
```

---

# 225. No tooltip-only para información esencial

Si el período es parcial, alguna indicación visible debe existir.

---

# 226. Theme switch

Cambio visual no debe mover layout.

---

# 227. Reduced motion y cambio de tema

Transición mínima o ninguna cuando reduced motion esté activo.

---

# 228. High contrast

No es requisito específico del MVP, pero evitar técnicas frágiles como:

```text
texto transparente
background clipping obligatorio
```

para contenido esencial.

---

# 229. Browser defaults

Mantener suficiente compatibilidad con controles nativos.

---

# 230. Pruebas manuales por página

## Login

```text
320
375
768
1440
light
dark
keyboard
zoom 200%
```

---

# 231. Dashboard

```text
sin datos
1 lectura
datos completos
datos parciales
0 kWh
light
dark
320
375
768
1024
1440
```

---

# 232. Historial

```text
tabla
tarjetas
base
cero
incompleta
corregida
filtros
modal
```

---

# 233. Perfil

```text
tema
password
mensajes
logout
```

---

# 234. Usuarios

```text
lista
buscar
filtros
crear
editar
desactivar
reactivar
reset
último admin
```

---

# 235. 403/404

Verificar navegación clara y botón de retorno.

---

# 236. Pruebas automáticas de responsive

React Testing Library no calcula layout real.

Por tanto las afirmaciones de:

```text
no overflow
tamaño real
posición
```

serán certificadas definitivamente en Playwright en CHECKPOINT 12.

---

# 237. En CHECKPOINT 11

Podemos verificar:

```text
clases
render condicional
estructura
```

más revisión manual.

---

# 238. Tests Reduced Motion

Mock:

```text
prefers-reduced-motion: reduce
```

y comprobar:

```text
gráfico sin animación
```

o configuración equivalente.

---

# 239. Tests navegación móvil

Comprobar presencia de:

```text
Inicio
Historial
Perfil
```

---

# 240. ADMIN móvil

Comprobar acceso a Usuarios desde Perfil/menú.

---

# 241. Tests focus

Testing Library puede comprobar:

```text
document.activeElement
```

en modales y route changes.

---

# 242. Test modal

Abrir.

Esperado:

```text
focus dentro
```

Cerrar.

Esperado:

```text
focus vuelve al trigger
```

---

# 243. Test Escape

Modal cierra.

---

# 244. Test submit modal

Durante loading:

```text
Escape no causa pérdida accidental
```

si adoptamos esa regla.

---

# 245. Test skip link

Debe existir y apuntar a:

```text
#contenido-principal
```

---

# 246. Test document titles

Cada ruta principal actualiza título.

---

# 247. Test `lang`

HTML:

```text
es
```

---

# 248. Test usuario normal

No debe visualizar administración en desktop ni móvil.

---

# 249. ADMIN

Sí.

---

# 250. Test último ADMIN frontend

Backend:

```text
409 USUARIO_ULTIMO_ADMIN
```

UI muestra mensaje.

No deja estado optimista incorrecto.

---

# 251. Test role change

Después éxito:

```text
recargar usuarios
```

---

# 252. Test desactivar

Después éxito:

```text
recargar listado
```

---

# 253. Test reset password

No mostrar password en respuesta.

---

# 254. No guardar contraseña administrativa

Ni en state más tiempo del necesario.

---

# 255. Limpiar password input

Después de éxito.

---

# 256. Navegación y estado

Cuando sesión expira durante un modal:

```text
AuthContext → ANONIMO
Router → Login
```

El modal no debe quedar renderizado sobre Login.

---

# 257. Tema después de expiración

Puede permanecer.

---

# 258. Regresión completa frontend

Ejecutar:

```bash
npm run lint
npm test
npm run build
```

---

# 259. Backend

Ejecutar:

```bash
npm run lint
npm test
```

---

# 260. Sin errores consola

Revisión manual.

---

# 261. No secretos

Revisar:

```text
localStorage
sessionStorage
console
Git
```

---

# 262. localStorage permitido

Solo:

```text
consumo-electrico-tema
```

y cualquier preferencia visual futura explícita.

---

# 263. sessionStorage

No debe contener credenciales.

---

# 264. Responsive audit

Registrar una pequeña matriz documental:

```text
Pantalla   320  375  768  1024  1440
Login      PASS PASS PASS PASS  PASS
Dashboard  PASS PASS PASS PASS  PASS
...
```

---

# 265. Accessibility audit

Igual:

```text
Teclado
Focus
Labels
Contraste
ARIA
Reduced motion
```

---

# 266. No hace falta archivo gigantesco

Puede documentarse en:

```text
docs/qa/checkpoint-11.md
```

de forma concisa.

---

# 267. Evidencia

Registrar qué se verificó.

---

# 268. No afirmar PASS sin haberlo comprobado

---

# 269. Git

Antes del commit:

```bash
git status
```

---

# 270. Archivos esperados nuevos/modificados

Aproximadamente:

```text
frontend/src/api/usuarios.api.js
frontend/src/components/usuarios/...
frontend/src/components/ui/...
frontend/src/layouts/...
frontend/src/styles/...
frontend/src/hooks/...
frontend/src/routes/...
frontend/src/pages/UsuariosPage.jsx
docs/qa/checkpoint-11.md
```

---

# 271. No deben aparecer

```text
.env
coverage
dist
node_modules
```

---

# 272. Commit

Después del gate:

```bash
git add .
git status
```

Revisar.

Luego:

```bash
git commit -m "feat: cerrar responsive y accesibilidad del frontend"
```

---

# 273. Working tree

Esperado:

```text
nothing to commit, working tree clean
```

---

# 274. Gate CHECKPOINT 11

### CP11-001

La app funciona a 320px.

### CP11-002

Funciona a 375px.

### CP11-003

Funciona a 768px.

### CP11-004

Funciona a 1024px.

### CP11-005

Funciona a 1440px.

### CP11-006

No hay overflow horizontal global accidental.

### CP11-007

Sidebar desktop es usable.

### CP11-008

Navegación móvil existe.

### CP11-009

Navegación móvil contiene Inicio.

### CP11-010

Contiene Historial.

### CP11-011

Contiene Perfil.

### CP11-012

ADMIN móvil puede acceder a Usuarios.

### CP11-013

USUARIO no ve Usuarios.

### CP11-014

Ruta activa se distingue sin depender solo de color.

### CP11-015

Targets táctiles son razonables.

### CP11-016

Dashboard móvil prioriza lectura de hoy.

### CP11-017

Tarjetas no cortan valores.

### CP11-018

Dashboard tablet funciona.

### CP11-019

Dashboard desktop funciona.

### CP11-020

Gráfico es responsive.

### CP11-021

Gráfico no crea overflow.

### CP11-022

Gráfico táctil no depende solo de hover.

### CP11-023

Existe alternativa accesible del gráfico.

### CP11-024

0 y sin dato son distinguibles accesiblemente.

### CP11-025

Historial desktop usa tabla semántica.

### CP11-026

Historial móvil usa tarjetas.

### CP11-027

Historial no comprime tabla ilegiblemente.

### CP11-028

Intervalos siguen siendo legibles en móvil.

### CP11-029

Usuarios desktop funciona.

### CP11-030

Usuarios móvil funciona.

### CP11-031

CRUD frontend de usuarios está implementado.

### CP11-032

Crear usuario funciona desde UI.

### CP11-033

Editar usuario funciona desde UI.

### CP11-034

Cambiar rol funciona desde UI.

### CP11-035

Activar funciona desde UI.

### CP11-036

Desactivar funciona desde UI.

### CP11-037

Reset password funciona desde UI.

### CP11-038

No existe DELETE de usuario.

### CP11-039

Último ADMIN 409 se representa correctamente.

### CP11-040

Perfil móvil funciona.

### CP11-041

Login funciona a 320px.

### CP11-042

Todos los inputs tienen label.

### CP11-043

Errores están asociados a inputs cuando corresponde.

### CP11-044

Inputs inválidos usan estado accesible.

### CP11-045

Focus visible existe globalmente.

### CP11-046

No existe outline eliminado sin reemplazo.

### CP11-047

Login puede usarse por teclado.

### CP11-048

Dashboard puede usarse por teclado.

### CP11-049

Historial puede usarse por teclado.

### CP11-050

Usuarios puede usarse por teclado.

### CP11-051

Perfil puede usarse por teclado.

### CP11-052

No existen tabindex positivos arbitrarios.

### CP11-053

Existe skip link.

### CP11-054

Existe `main` identificable.

### CP11-055

Headings siguen jerarquía coherente.

### CP11-056

Botones reales se usan para acciones.

### CP11-057

Links reales se usan para navegación.

### CP11-058

Modales tienen semántica de diálogo.

### CP11-059

Modales atrapan foco.

### CP11-060

Focus vuelve al trigger.

### CP11-061

Escape funciona.

### CP11-062

Toasts/mensajes son anunciables apropiadamente.

### CP11-063

No se abusa de alertas assertive.

### CP11-064

Contraste claro es suficiente.

### CP11-065

Contraste oscuro es suficiente.

### CP11-066

Texto secundario sigue siendo legible.

### CP11-067

Estados no dependen solo del color.

### CP11-068

Focus se ve en tema claro.

### CP11-069

Focus se ve en tema oscuro.

### CP11-070

Zoom 200 % mantiene funcionalidad principal.

### CP11-071

Nombres largos no rompen layout.

### CP11-072

Correos largos no rompen layout.

### CP11-073

prefers-reduced-motion está implementado.

### CP11-074

Gráfico reduce animación.

### CP11-075

Transiciones de tema respetan reduced motion.

### CP11-076

Skeletons no generan contenido basura para lector.

### CP11-077

Estados vacíos son coherentes.

### CP11-078

Estados de error son coherentes.

### CP11-079

Reintentar no repite mutaciones.

### CP11-080

Botones iconográficos tienen nombre accesible.

### CP11-081

Iconos decorativos no generan ruido accesible.

### CP11-082

Tabla utiliza encabezados correctos.

### CP11-083

Paginación tiene nombres accesibles.

### CP11-084

Página activa se identifica.

### CP11-085

Selector de período tiene estado activo accesible.

### CP11-086

Barra inferior no tapa contenido.

### CP11-087

Safe area se considera si es necesario.

### CP11-088

Cambio de ruta gestiona foco.

### CP11-089

Document title cambia por página.

### CP11-090

HTML utiliza `lang="es"`.

### CP11-091

Viewport permite zoom.

### CP11-092

Tema no altera layout.

### CP11-093

axe no detecta violaciones críticas conocidas en Login.

### CP11-094

axe no detecta violaciones críticas en Dashboard.

### CP11-095

axe no detecta violaciones críticas en Historial.

### CP11-096

axe no detecta violaciones críticas en Perfil.

### CP11-097

axe no detecta violaciones críticas en Usuarios.

### CP11-098

Frontend lint pasa.

### CP11-099

Frontend tests pasan.

### CP11-100

Frontend build pasa.

### CP11-101

Backend regression pasa.

### CP11-102

Existe matriz responsive documentada.

### CP11-103

Existe revisión de accesibilidad documentada.

### CP11-104

No existen secretos versionados.

### CP11-105

Existe commit.

### CP11-106

Working tree limpio.

---

# 275. Estado de SPEC-008

Después del gate:

```text
SPEC-008
Sistema visual, temas y responsive
→ IMPLEMENTADA
→ PROBADA
```

Quedará únicamente la confirmación E2E final.

---

# 276. Estado de SPEC-009

Con el CRUD frontend de usuarios:

```text
SPEC-009
Administración de usuarios
→ IMPLEMENTADA
→ PROBADA
```

---

# 277. Estado de SPEC-010

La seguridad visual/frontend queda más completa, pero su cierre final todavía dependerá de:

```text
E2E
revisión de secretos
regresión
```

---

# 278. Estado del roadmap

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
→ CERRADO

CHECKPOINT 12
E2E y cierre MVP
→ SIGUIENTE
```

---

# 279. Qué tendremos al cerrar

La aplicación será funcional y usable en:

```text
móvil
tablet
desktop
```

con:

```text
Login
Dashboard
Lecturas
Historial
Perfil
Temas
Usuarios ADMIN
```

y ya no deberá existir una brecha funcional importante de interfaz.

---

# 280. Qué queda

El último checkpoint no añadirá nuevas features.

Hará:

```text
certificación completa
```

mediante:

```text
Playwright
gates backend
gates frontend
seguridad
Git
documentación
instalación limpia
```

---

# 281. Siguiente checkpoint

```text
CHECKPOINT 12
E2E, regresión y cierre del MVP
```

Ahí probaremos en navegador real:

```text
ADMIN
USUARIO
login
refresh
logout
usuarios
lecturas
dashboard
historial
temas
responsive
seguridad
```

y finalmente podremos determinar qué SPEC pasan de:

```text
PROBADA
```

a:

```text
CERRADA
```

y declarar:

```text
MVP COMPLETADO
```

solo si todo el gate está realmente verde.

---

# 282. Criterio pedagógico

Un aprendiz deberá poder explicar:

1. ¿Qué significa realmente diseño responsive?
2. ¿Por qué no basta con reducir tamaños?
3. ¿Por qué utilizamos mobile first?
4. ¿Por qué los breakpoints dependen del contenido?
5. ¿Qué es overflow horizontal?
6. ¿Por qué la tabla cambia a tarjetas en móvil?
7. ¿Por qué la navegación móvil tiene menos opciones?
8. ¿Qué es un touch target?
9. ¿Por qué un gráfico necesita alternativa accesible?
10. ¿Por qué hover no funciona como única interacción móvil?
11. ¿Qué significa navegación mediante teclado?
12. ¿Por qué focus visible es obligatorio?
13. ¿Qué es un skip link?
14. ¿Qué aporta HTML semántico?
15. ¿Por qué un `div` no sustituye un botón?
16. ¿Qué debe hacer un modal con el foco?
17. ¿Qué es `aria-live`?
18. ¿Por qué no todo debe usar `role=alert`?
19. ¿Qué significa WCAG AA?
20. ¿Por qué color no puede ser el único indicador?
21. ¿Qué ocurre cuando el usuario aumenta el zoom?
22. ¿Qué significa `prefers-reduced-motion`?
23. ¿Por qué las animaciones del gráfico deben respetarlo?
24. ¿Por qué completamos aquí el frontend de usuarios?
25. ¿Por qué no utilizamos actualizaciones optimistas para cambio de rol o desactivación?
26. ¿Qué hace una auditoría responsive?
27. ¿Qué puede detectar axe y qué no?
28. ¿Por qué todavía necesitamos Playwright después de todo esto?

Cuando todos los `CP11-*` estén verdes:

```text
CHECKPOINT 11 → CERRADO
```
