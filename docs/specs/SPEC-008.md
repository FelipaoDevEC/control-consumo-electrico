# SPEC-008 — Sistema visual, temas y diseño responsive

## 1. Objetivo

Definir el sistema visual de la aplicación y establecer reglas consistentes para:

* modo claro;
* modo oscuro;
* modo sistema;
* colores;
* tipografía;
* espaciados;
* bordes;
* sombras;
* botones;
* formularios;
* tarjetas;
* tablas;
* estados;
* responsive;
* accesibilidad;
* comportamiento visual en React.

El objetivo no será crear una interfaz llamativa.

El objetivo será construir una interfaz:

> limpia, minimalista, consistente y fácil de comprender.

---

# 2. Principios de diseño

El sistema visual seguirá estos principios:

1. Minimalismo.
2. Buena legibilidad.
3. Pocos colores.
4. Jerarquía visual clara.
5. Espaciados consistentes.
6. Contraste suficiente.
7. Mobile first.
8. Componentes reutilizables.
9. Sin estilos aislados arbitrarios.
10. Tema claro y oscuro equivalentes funcionalmente.
11. Accesibilidad desde el inicio.
12. Evitar dependencias visuales innecesarias.

---

# 3. Estrategia CSS

Durante el MVP utilizaremos:

```text
CSS moderno
+
CSS Modules o estilos organizados por componente
+
variables CSS
```

No utilizaremos inicialmente un framework visual completo.

Esto permitirá que los aprendices entiendan realmente:

```text
CSS
responsive
variables
media queries
estados
componentes
```

antes de abstraerlos mediante otras herramientas.

---

# 4. No utilizar Tailwind inicialmente

Durante el MVP educativo no será obligatorio utilizar:

```text
Tailwind CSS
```

La intención será aprender primero:

```text
cómo funciona CSS
```

y no únicamente:

```text
qué clases copiar.
```

En una evolución posterior podrá compararse el mismo sistema utilizando Tailwind.

---

# 5. Variables CSS

La interfaz utilizará variables semánticas.

Ejemplo conceptual:

```css
:root {
    --color-fondo: ...;
    --color-superficie: ...;
    --color-superficie-secundaria: ...;

    --color-texto: ...;
    --color-texto-secundario: ...;

    --color-borde: ...;
    --color-acento: ...;

    --color-exito: ...;
    --color-advertencia: ...;
    --color-error: ...;

    --radio-sm: ...;
    --radio-md: ...;
    --radio-lg: ...;

    --espacio-1: ...;
    --espacio-2: ...;
    --espacio-3: ...;
}
```

Los componentes deberán utilizar estas variables.

---

# 6. Evitar colores directos en componentes

No queremos:

```css
.card {
    background: #ffffff;
}
```

repetido en muchos archivos.

Preferimos:

```css
.card {
    background: var(--color-superficie);
}
```

Esto permite cambiar el tema sin reescribir los componentes.

---

# 7. Temas disponibles

Cada usuario podrá seleccionar:

```text
SISTEMA
CLARO
OSCURO
```

---

# 8. Tema por defecto

El valor predeterminado será:

```text
SISTEMA
```

Esto significa que una cuenta nueva seguirá inicialmente la configuración del dispositivo.

---

# 9. Modo SISTEMA

Cuando:

```text
tema = SISTEMA
```

React deberá consultar:

```css
prefers-color-scheme
```

---

# 10. Ejemplo

Si el sistema operativo utiliza:

```text
modo oscuro
```

la aplicación utilizará:

```text
tema oscuro
```

Si cambia a:

```text
modo claro
```

la aplicación deberá adaptarse.

---

# 11. Cambio dinámico del sistema

Mientras la preferencia del usuario siga siendo:

```text
SISTEMA
```

la aplicación deberá escuchar cambios de:

```text
prefers-color-scheme
```

sin requerir recargar la página.

---

# 12. Tema CLARO

Cuando:

```text
tema = CLARO
```

la aplicación permanecerá clara aunque el sistema operativo cambie a oscuro.

---

# 13. Tema OSCURO

Cuando:

```text
tema = OSCURO
```

la aplicación permanecerá oscura aunque el sistema operativo cambie a claro.

---

# 14. Tema efectivo

Distinguiremos:

```text
temaPreferido
```

de:

```text
temaEfectivo
```

Ejemplo:

```text
temaPreferido = SISTEMA
sistema operativo = oscuro

temaEfectivo = OSCURO
```

---

# 15. Persistencia del tema

La preferencia oficial se almacenará en:

```text
usuarios.tema
```

como definimos previamente.

Valores:

```text
SISTEMA
CLARO
OSCURO
```

---

# 16. Sincronización con backend

Cuando el usuario cambie su preferencia:

```http
PATCH /api/auth/tema
```

Entrada:

```json
{
  "tema": "OSCURO"
}
```

El backend persistirá la selección.

---

# 17. Aplicación inmediata

La interfaz no esperará necesariamente a una nueva sesión para cambiar de aspecto.

Flujo:

```text
usuario selecciona OSCURO
        ↓
React aplica OSCURO
        ↓
API persiste OSCURO
```

Si la persistencia falla, la interfaz deberá informar el error y recuperar un estado coherente.

---

# 18. Tema antes del login

La pantalla de login todavía no dispone necesariamente del usuario autenticado.

Para evitar una experiencia inconsistente podrá utilizar:

```text
último tema conocido localmente
```

como preferencia visual no sensible.

---

# 19. Uso permitido de almacenamiento local

Aunque no utilizamos `localStorage` para tokens, sí puede utilizarse para algo no sensible como:

```text
preferencia visual
```

Ejemplo:

```text
tema_preferido = OSCURO
```

El backend seguirá siendo la preferencia oficial después del login.

---

# 20. Prioridad de tema

Después de autenticarse:

```text
tema guardado en usuario
```

tendrá prioridad sobre el valor visual local.

---

# 21. Evitar flash de tema incorrecto

No queremos:

```text
pantalla blanca
↓
carga React
↓
pantalla oscura
```

cada vez que el usuario abre la aplicación.

La implementación deberá aplicar el tema conocido:

```text
antes o durante el arranque inicial
```

para reducir:

```text
flash de tema incorrecto
```

---

# 22. Atributo raíz

El tema efectivo podrá aplicarse mediante:

```html
<html data-theme="dark">
```

o equivalente.

Ejemplo:

```text
data-theme="light"
data-theme="dark"
```

---

# 23. Las variables dependen del tema

Conceptualmente:

```css
:root,
[data-theme='light'] {
    --color-fondo: ...;
    --color-superficie: ...;
    --color-texto: ...;
}

[data-theme='dark'] {
    --color-fondo: ...;
    --color-superficie: ...;
    --color-texto: ...;
}
```

---

# 24. Paleta clara

El modo claro utilizará conceptualmente:

```text
fondo general       → gris muy claro
superficies          → blanco
texto principal      → casi negro
texto secundario     → gris
bordes               → gris suave
acento               → color principal
```

No queremos un fondo totalmente saturado de blanco en todos los niveles.

---

# 25. Paleta oscura

El modo oscuro utilizará:

```text
fondo general         → oscuro
superficies            → ligeramente más claras
texto principal        → claro
texto secundario       → gris claro
bordes                 → visibles pero discretos
```

No utilizaremos:

```text
#000000
```

para absolutamente todo el fondo.

---

# 26. Color de acento

La aplicación utilizará un único color principal para acciones y elementos destacados.

Por ejemplo:

```text
azul
verde azulado
```

La elección exacta podrá realizarse durante implementación visual.

Lo importante será:

```text
un color de acento dominante
```

y no cinco colores de marca compitiendo.

---

# 27. Uso del color

El acento se utilizará para:

```text
botón principal
enlaces
elemento seleccionado
focus
barra principal del gráfico
```

---

# 28. Color no significa estado por sí solo

Por ejemplo, para un error no basta con:

```text
borde rojo
```

También deberá existir:

```text
mensaje de error
```

---

# 29. Colores semánticos

Tendremos tokens para:

```text
éxito
advertencia
error
información
```

Pero no deberán dominar la interfaz.

---

# 30. Datos parciales

El estado:

```text
PARCIAL
```

no se mostrará como un error crítico.

Podrá utilizar:

```text
texto secundario
+
icono informativo
```

o un color de advertencia moderado.

---

# 31. Datos faltantes

Un:

```text
SIN_DATOS
```

será un estado neutral.

No necesariamente:

```text
rojo
```

---

# 32. Tipografía

Utilizaremos inicialmente una pila de fuentes del sistema.

Ejemplo conceptual:

```css
font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
```

No será obligatorio descargar fuentes externas.

---

# 33. Ventaja educativa

Esto reduce:

```text
dependencias
peticiones externas
configuración
```

y mantiene una presentación moderna.

---

# 34. Escala tipográfica

Se establecerá una escala pequeña.

Conceptualmente:

```text
12 px → texto auxiliar
14 px → texto secundario
16 px → texto principal
18 px → subtítulo
24 px → título de sección
32 px → métricas importantes
```

No significa que todos esos valores sean rígidos.

La implementación podrá utilizar:

```text
rem
```

---

# 35. Unidad recomendada

Para tipografía y espaciados preferiremos:

```text
rem
```

sobre:

```text
px
```

cuando sea apropiado.

---

# 36. Tamaño base

El navegador mantendrá aproximadamente:

```text
16 px
```

como base.

No reduciremos toda la aplicación a textos muy pequeños buscando “minimalismo”.

---

# 37. Peso tipográfico

Utilizaremos principalmente:

```text
400 regular
500 medium
600 semibold
```

No necesitamos diez pesos diferentes.

---

# 38. Métricas principales

Ejemplo:

```text
51 kWh
```

debe tener mayor jerarquía que:

```text
Últimos 7 días
```

---

# 39. Espaciado

Utilizaremos una escala consistente.

Conceptualmente:

```text
4
8
12
16
24
32
48
```

No tendremos valores arbitrarios como:

```text
13 px
17 px
29 px
```

sin razón.

---

# 40. Sistema base

Podemos considerar:

```text
4 px
```

como unidad visual base.

Esto facilita combinaciones predecibles.

---

# 41. Bordes

Los bordes serán:

```text
delgados
discretos
consistentes
```

Generalmente:

```text
1px
```

---

# 42. Radios

Utilizaremos pocos niveles:

```text
radio pequeño
radio medio
radio grande
```

Por ejemplo:

```text
6 px
10 px
14 px
```

No cada componente con una curvatura distinta.

---

# 43. Tarjetas

Las tarjetas del dashboard deberán utilizar:

```text
fondo de superficie
borde sutil
radio consistente
espaciado interno
```

---

# 44. Sombras

Las sombras serán discretas.

No queremos:

```text
tarjetas flotando exageradamente
```

En modo oscuro podrán incluso evitarse cuando el contraste entre superficies sea suficiente.

---

# 45. Botones

Existirán inicialmente:

```text
Primario
Secundario
Texto
Peligro
```

---

# 46. Botón primario

Para la acción principal.

Ejemplo:

```text
Registrar lectura
```

---

# 47. Botón secundario

Ejemplo:

```text
Cancelar
```

o acciones no dominantes.

---

# 48. Botón de texto

Para acciones pequeñas como:

```text
Ver historial
```

---

# 49. Botón de peligro

Únicamente para acciones realmente destructivas.

Como el MVP no elimina lecturas ni usuarios físicamente, su uso será poco frecuente.

---

# 50. Tamaño táctil

Controles interactivos deberán tener una zona táctil suficientemente cómoda.

Objetivo aproximado:

```text
44 × 44 px
```

cuando corresponda.

---

# 51. Estados de botón

Todo botón debe contemplar:

```text
normal
hover
focus
active
disabled
loading
```

---

# 52. Botón loading

Mientras se registra:

```text
Guardando...
```

y el botón debe evitar dobles envíos accidentales.

---

# 53. No depender solo del botón deshabilitado

El backend continuará protegiendo contra:

```text
doble registro
concurrencia
duplicados
```

---

# 54. Inputs

Los campos tendrán:

```text
label
input
mensaje auxiliar opcional
mensaje de error
```

---

# 55. No usar placeholder como label

Incorrecto:

```text
[ Escribe tu lectura ]
```

sin etiqueta.

Correcto:

```text
Lectura del medidor
[ 12555 ]
```

---

# 56. Campo lectura

Tipo visualmente numérico.

En móvil deberá favorecer teclado numérico.

Conceptualmente:

```html
inputmode="numeric"
```

---

# 57. No confiar en `type="number"`

El backend continuará verificando:

```text
entero
>= 0
```

porque HTML no es una barrera de seguridad.

---

# 58. Estado de error de input

Ejemplo:

```text
Lectura del medidor
[ 12555.5 ]

La lectura debe ser un número entero.
```

---

# 59. No limpiar el campo innecesariamente

Si existe un error, el usuario debe conservar lo escrito para poder corregirlo.

---

# 60. Focus

Todo input y botón debe tener un foco claramente visible.

---

# 61. Tablas

En escritorio el historial puede utilizar tabla.

La tabla tendrá:

```text
encabezado claro
alineación consistente
filas legibles
acciones discretas
```

---

# 62. Alineación numérica

Lecturas y consumos podrán alinearse:

```text
a la derecha
```

para facilitar comparación.

---

# 63. Tabla móvil

No intentaremos mantener una tabla de cinco columnas comprimida.

En móvil cambiaremos a:

```text
tarjetas
o filas apiladas
```

---

# 64. Gráficos

El gráfico respetará el tema.

Colores de:

```text
ejes
etiquetas
grid
tooltip
barras
```

deberán utilizar tokens visuales.

---

# 65. Tooltip oscuro

En tema oscuro no deberá aparecer un tooltip blanco deslumbrante si rompe completamente la experiencia.

---

# 66. Barra principal

La barra conocida podrá utilizar:

```text
color de acento
```

---

# 67. Sin dato

Un día sin dato no se representará como una barra normal.

Podrá utilizar:

```text
espacio
marcador
patrón
línea
```

acompañado de texto accesible.

---

# 68. Responsive — estrategia

El diseño será:

```text
mobile first
```

Empezaremos por la interfaz pequeña y añadiremos capacidades según aumente el espacio.

---

# 69. Breakpoints conceptuales

Utilizaremos pocos puntos de ruptura.

Por ejemplo:

```text
< 640 px      móvil
>= 640 px     móvil grande / tablet pequeña
>= 768 px     tablet
>= 1024 px    desktop
>= 1280 px    desktop amplio
```

No necesitamos docenas de breakpoints.

---

# 70. Los breakpoints no representan dispositivos concretos

No diseñaremos para:

```text
iPhone X
Samsung Y
iPad Z
```

Diseñaremos según:

```text
espacio disponible
```

---

# 71. Contenedor principal

En desktop amplio el contenido tendrá un ancho máximo razonable.

No queremos tarjetas estirándose por toda una pantalla ultrawide.

Conceptualmente:

```text
max-width: 1400px
```

o un valor similar.

---

# 72. Márgenes

Móvil:

```text
16 px aproximadamente
```

Desktop:

```text
24–32 px aproximadamente
```

---

# 73. Dashboard móvil

Orden:

```text
estado de lectura de hoy
↓
consumo de ayer
↓
gráfico 7 días
↓
resumen semanal
↓
mes
↓
estadísticas
↓
año
```

---

# 74. Dashboard desktop

Puede utilizar:

```text
4 tarjetas en una fila
```

cuando exista espacio suficiente.

---

# 75. Tablet

Puede utilizar:

```text
2 × 2
```

---

# 76. Móvil pequeño

Puede utilizar:

```text
1 columna
```

o dos tarjetas realmente compactas si la legibilidad se mantiene.

---

# 77. Sidebar

Desktop:

```text
sidebar lateral
```

podrá permanecer visible.

---

# 78. Sidebar responsive

En pantallas pequeñas se ocultará y será reemplazada por:

```text
navegación inferior
o
menú compacto
```

según resulte más simple durante implementación.

---

# 79. Navegación elegida para móvil

Para las tres áreas principales utilizaremos preferentemente:

```text
barra inferior
```

con:

```text
Inicio
Historial
Perfil
```

---

# 80. ADMIN en móvil

La opción:

```text
Usuarios
```

podrá aparecer dentro de:

```text
menú de Perfil
```

o un menú adicional.

No necesitamos cuatro o cinco iconos permanentes.

---

# 81. Iconos

Podremos utilizar una librería ligera de iconos.

Los iconos serán complementarios.

Nunca sustituirán texto crítico sin nombre accesible.

---

# 82. Icono del tema

Ejemplos:

```text
sol
luna
monitor
```

para:

```text
CLARO
OSCURO
SISTEMA
```

Pero las opciones también tendrán texto.

---

# 83. Selector de tema

En Perfil:

```text
Apariencia

○ Sistema
○ Claro
○ Oscuro
```

Será preferible a un simple:

```text
☀ / 🌙
```

si existe una tercera opción.

---

# 84. Cambio de tema rápido

Podrá existir un acceso rápido en escritorio, pero no será obligatorio.

La fuente principal de configuración será:

```text
Perfil → Apariencia
```

---

# 85. Perfil

La pantalla de perfil incluirá al menos:

```text
nombre
correo
rol
apariencia
cambiar contraseña
cerrar sesión
```

---

# 86. Layout estable

Cambiar de tema no debe cambiar:

```text
dimensiones
espaciados
posición de componentes
```

Solo cambia su apariencia.

---

# 87. Accesibilidad — contraste

Texto normal deberá alcanzar contraste suficiente según buenas prácticas de accesibilidad.

Objetivo:

```text
WCAG AA
```

---

# 88. No texto gris ilegible

Especialmente en modo oscuro, evitaremos textos secundarios demasiado apagados.

---

# 89. Focus visible

Los estados `focus-visible` deberán distinguirse claramente en ambos temas.

---

# 90. Navegación con teclado

Todos los controles principales deberán ser alcanzables mediante:

```text
Tab
Shift + Tab
```

---

# 91. Orden de foco

El orden deberá seguir el orden lógico de lectura de la interfaz.

---

# 92. Modales

Si utilizamos modales:

```text
focus entra al modal
focus no escapa detrás
Escape puede cerrar cuando corresponda
focus vuelve al elemento anterior
```

---

# 93. Preferencia de movimiento reducido

Se respetará:

```css
prefers-reduced-motion
```

---

# 94. Ejemplo conceptual

```css
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms;
        transition-duration: 0.01ms;
    }
}
```

La implementación deberá evitar soluciones agresivas que dañen funcionalidad, pero respetará la intención.

---

# 95. Animaciones permitidas

Solo:

```text
transiciones cortas
cambios de estado
tooltips
skeletons discretos
```

---

# 96. No animaciones decorativas largas

No necesitamos:

```text
tarjetas entrando desde todos los lados
fondos animados
partículas
```

---

# 97. Estados de carga

Se utilizarán:

```text
skeletons
o
indicadores inline
```

según el contexto.

---

# 98. No spinner global permanente

Una petición de gráfica no deberá bloquear:

```text
sidebar
perfil
navegación
```

---

# 99. Estados vacíos

Todo módulo importante tendrá:

```text
cargando
contenido
vacío
error
```

---

# 100. Ejemplo de historial

```text
Cargando historial...
```

Después puede convertirse en:

```text
datos
```

o:

```text
Aún no hay lecturas.
```

o:

```text
No se pudo cargar el historial.
```

---

# 101. Mensajes de éxito

Los mensajes serán breves.

Ejemplo:

```text
Lectura registrada correctamente.
```

---

# 102. Mensajes de error

También claros:

```text
La lectura no puede ser inferior a la anterior.
```

No:

```text
Error 422.
```

---

# 103. Sistema de notificaciones

Para acciones breves podremos utilizar:

```text
toast
```

discreto.

Ejemplos:

```text
Lectura guardada.
Tema actualizado.
Contraseña modificada.
```

---

# 104. No abusar de toast

Errores de formulario deben aparecer cerca del campo.

No todo será un toast.

---

# 105. Modal de confirmación

Solo cuando exista una decisión relevante.

Por ejemplo:

```text
desactivar usuario
```

Puede preguntar:

```text
¿Desactivar este usuario?
```

---

# 106. No confirmar acciones triviales

No preguntar:

```text
¿Seguro que quieres cambiar a modo oscuro?
```

---

# 107. Diseño del login

El login será extremadamente simple.

Desktop:

```text
┌──────────────────────────┐
│                          │
│      ⚡ Energía          │
│                          │
│ Correo                   │
│ [                    ]   │
│                          │
│ Contraseña               │
│ [                    ]   │
│                          │
│ [ Iniciar sesión ]       │
│                          │
└──────────────────────────┘
```

---

# 108. Login móvil

El formulario utilizará prácticamente todo el ancho disponible con márgenes apropiados.

No necesitará una ilustración grande.

---

# 109. Mostrar contraseña

Se podrá incluir:

```text
Mostrar / ocultar contraseña
```

con control accesible.

---

# 110. Sin enlace de registro

No aparecerá:

```text
Crear cuenta
```

porque no existe registro público.

---

# 111. Sin “Olvidé mi contraseña”

Durante el MVP tampoco aparecerá:

```text
¿Olvidaste tu contraseña?
```

porque SPEC-003 no implementa recuperación pública.

---

# 112. Página 404

Las rutas inexistentes tendrán una vista simple:

```text
Página no encontrada.

[ Volver al dashboard ]
```

---

# 113. Página no autorizada

Cuando corresponda:

```text
No tienes permisos para acceder a esta sección.
```

---

# 114. No mostrar stack traces

Nunca presentar:

```text
TypeError
stack
SQLSTATE
```

en la UI.

---

# 115. Componentes visuales reutilizables

Esperamos componentes conceptuales como:

```text
Boton
CampoFormulario
TarjetaMetrica
EstadoVacio
Skeleton
Toast
Modal
SelectorTema
GraficoConsumo
Badge
```

---

# 116. No crear componentes para todo

No convertiremos cada:

```text
<div>
<span>
<p>
```

en un componente.

Un componente debe existir cuando aporte:

```text
reutilización
consistencia
encapsulación
```

---

# 117. Tokens antes que duplicación

Si cinco componentes utilizan:

```text
border-radius: 10px
```

eso debería provenir de:

```text
--radio-md
```

y no estar copiado cinco veces.

---

# 118. Organización conceptual de estilos

Podremos utilizar:

```text
src/
├── estilos/
│   ├── tokens.css
│   ├── global.css
│   └── temas.css
│
├── componentes/
│   └── ...
│
└── paginas/
```

La estructura definitiva se congelará al iniciar implementación.

---

# 119. `tokens.css`

Contendrá:

```text
tipografía
espaciados
radios
duraciones
z-index
```

y valores neutrales compartidos.

---

# 120. `temas.css`

Contendrá principalmente:

```text
colores claro
colores oscuro
```

---

# 121. `global.css`

Contendrá:

```text
reset mínimo
body
tipografía base
focus
links
```

---

# 122. CSS de componentes

Cada componente controlará únicamente sus estilos específicos.

---

# 123. Evitar `!important`

No utilizaremos:

```css
!important
```

de manera normal.

Su necesidad suele indicar problemas de estructura o especificidad.

---

# 124. Evitar estilos inline para diseño estructural

No queremos:

```jsx
<div style={{ marginTop: 17, color: '#fff' }}>
```

por toda la aplicación.

Las excepciones podrán existir para valores verdaderamente dinámicos.

---

# 125. Contraste del gráfico

Las barras y etiquetas deberán continuar siendo distinguibles en:

```text
tema claro
tema oscuro
```

---

# 126. No depender únicamente del color en gráficos

Un dato faltante podrá tener además:

```text
patrón
marcador
texto
tooltip
```

---

# 127. Zoom del navegador

La interfaz deberá seguir siendo utilizable con aumento de texto/zoom razonable.

No diseñaremos componentes cuya altura rígida corte contenido.

---

# 128. Alturas rígidas

Evitar:

```text
height: 40px
```

para contenedores de texto que puedan crecer.

Preferir:

```text
min-height
padding
```

cuando corresponda.

---

# 129. Textos largos

Aunque inicialmente los nombres sean cortos, componentes deberán tolerar:

```text
Administrador de la vivienda
```

sin romper el layout.

---

# 130. Truncamiento

Solo truncaremos cuando exista una alternativa para acceder al contenido completo.

---

# 131. Sistema de capas

Definiremos pocos niveles de `z-index`.

Conceptualmente:

```text
base
sticky
dropdown
modal
toast
```

No valores arbitrarios como:

```text
999999999
```

---

# 132. Modo oscuro y formularios

Los inputs deberán adaptar:

```text
fondo
borde
texto
placeholder
focus
```

No deberán conservar controles visualmente incompatibles.

---

# 133. `color-scheme`

La aplicación podrá indicar:

```css
color-scheme: light;
```

o:

```css
color-scheme: dark;
```

según tema efectivo.

Esto puede ayudar a que algunos controles nativos coincidan mejor con el tema.

---

# 134. Scrollbars

No será prioridad personalizarlas.

Preferimos comportamiento nativo consistente antes que decorarlas innecesariamente.

---

# 135. Impresión

No se diseñará inicialmente:

```text
modo impresión
```

porque las exportaciones forman parte de fases posteriores.

---

# 136. PWA

No forma parte de SPEC-008.

No instalaremos funcionalidades offline todavía.

---

# 137. Pruebas de tema

La implementación deberá comprobar:

```text
usuario nuevo → SISTEMA
SISTEMA + SO claro
SISTEMA + SO oscuro
cambio del SO mientras está en SISTEMA
CLARO ignora cambio del SO
OSCURO ignora cambio del SO
persistencia del tema
tema después de nuevo login
```

---

# 138. Prueba de recarga

Usuario:

```text
tema = OSCURO
```

Recarga la aplicación.

Debe continuar viendo:

```text
OSCURO
```

sin un cambio visual molesto innecesario.

---

# 139. Prueba con dos usuarios

Usuario A:

```text
OSCURO
```

Usuario B:

```text
CLARO
```

Cada cuenta conserva su preferencia.

---

# 140. Pruebas responsive

Como referencias:

```text
320 px
375 px
640 px
768 px
1024 px
1280 px
1440 px
```

---

# 141. Pruebas de overflow

En ninguna pantalla principal debe aparecer desplazamiento horizontal accidental.

Especialmente:

```text
dashboard
historial
perfil
login
usuarios
```

---

# 142. Pruebas de formularios

Verificar:

```text
labels
errores
focus
tabulación
teclado móvil
estado disabled
estado loading
```

---

# 143. Pruebas de accesibilidad

Como mínimo:

```text
contraste
focus visible
orden de tabulación
nombres accesibles
labels asociados
botones de iconos con aria-label
contenido no dependiente exclusivamente del color
```

---

# 144. Prueba crítica 1

Usuario selecciona:

```text
SISTEMA
```

Sistema operativo:

```text
OSCURO
```

La aplicación:

```text
OSCURO
```

El usuario cambia el SO a:

```text
CLARO
```

La aplicación debe cambiar a:

```text
CLARO
```

sin que el usuario tenga que modificar su preferencia.

---

# 145. Prueba crítica 2

Usuario selecciona:

```text
OSCURO
```

Luego el SO cambia a claro.

La aplicación permanece:

```text
OSCURO
```

---

# 146. Prueba crítica 3

Lectura:

```text
0 kWh
```

y:

```text
sin dato
```

deben seguir siendo visualmente distinguibles tanto en claro como en oscuro.

---

# 147. Prueba crítica 4

A 375 px:

```text
no existe scroll horizontal
la gráfica es legible
los botones son utilizables
las tarjetas no cortan texto
```

---

# 148. Invariantes

### UI-INV-001

Todos los componentes utilizan el mismo sistema visual.

### UI-INV-002

El tema no cambia las reglas funcionales.

### UI-INV-003

SISTEMA sigue `prefers-color-scheme`.

### UI-INV-004

CLARO y OSCURO ignoran cambios del sistema operativo.

### UI-INV-005

La preferencia pertenece al usuario.

### UI-INV-006

El backend conserva la preferencia oficial.

### UI-INV-007

Tokens y sesiones nunca se almacenan junto con preferencias visuales.

### UI-INV-008

La interfaz nunca depende exclusivamente del color para comunicar información.

### UI-INV-009

La navegación debe ser utilizable con teclado.

### UI-INV-010

El diseño móvil no utiliza una tabla desktop comprimida.

### UI-INV-011

No debe existir overflow horizontal accidental.

### UI-INV-012

El modo oscuro debe mantener contraste suficiente.

### UI-INV-013

Los componentes no utilizan colores arbitrarios si existe un token semántico.

### UI-INV-014

Las acciones principales mantienen consistencia visual.

### UI-INV-015

Los estados de carga, vacío y error forman parte del diseño normal.

---

# 149. Decisiones congeladas por SPEC-008

1. Diseño minimalista.
2. Enfoque mobile first.
3. CSS moderno durante el MVP.
4. Sin framework visual completo inicialmente.
5. Sin Tailwind como requisito inicial.
6. Variables CSS como base del sistema visual.
7. Temas `SISTEMA`, `CLARO`, `OSCURO`.
8. `SISTEMA` será el valor por defecto.
9. El tema se persiste por usuario.
10. El tema podrá recordarse localmente como preferencia no sensible.
11. Nunca se utilizará almacenamiento local para los tokens por este motivo.
12. El tema efectivo se aplica en el elemento raíz.
13. Se minimizará el flash de tema incorrecto.
14. Se utilizará fuente del sistema.
15. Escala consistente de tipografía.
16. Escala consistente de espaciado.
17. Pocos radios de borde.
18. Sombras discretas.
19. Cuatro variantes básicas de botón.
20. Formularios con labels reales.
21. Historial desktop mediante tabla.
22. Historial móvil mediante tarjetas/filas adaptadas.
23. Gráficos adaptados a ambos temas.
24. Navegación móvil mediante barra inferior para las áreas principales.
25. Sidebar en desktop.
26. Se priorizará WCAG AA.
27. Focus visible obligatorio.
28. Se respetará `prefers-reduced-motion`.
29. Los componentes soportarán estados loading, vacío y error.
30. No se utilizarán animaciones decorativas innecesarias.
31. No se abusará de modales ni toasts.
32. El login será minimalista.
33. No aparecerá registro público.
34. No aparecerá recuperación pública de contraseña durante el MVP.
35. La UI deberá funcionar desde 320 px aproximadamente.
36. No debe existir overflow horizontal accidental.

---

# 150. Resultado conceptual de temas

## Claro

```text
┌───────────────────────────────────────┐
│ Dashboard                             │
│                                       │
│ ┌────────┐ ┌────────┐                 │
│ │ Ayer   │ │ 7 días │                 │
│ │ 8 kWh  │ │ 51 kWh │                 │
│ └────────┘ └────────┘                 │
│                                       │
│          gráfico                      │
│                                       │
└───────────────────────────────────────┘
```

Características:

```text
fondo claro
superficies blancas
texto oscuro
bordes suaves
acento controlado
```

## Oscuro

```text
┌───────────────────────────────────────┐
│ Dashboard                             │
│                                       │
│ ┌────────┐ ┌────────┐                 │
│ │ Ayer   │ │ 7 días │                 │
│ │ 8 kWh  │ │ 51 kWh │                 │
│ └────────┘ └────────┘                 │
│                                       │
│          gráfico                      │
│                                       │
└───────────────────────────────────────┘
```

Misma estructura.

Características:

```text
fondo oscuro
superficies diferenciadas
texto claro
bordes visibles
mismo color de acento adaptado
```

El usuario debe sentir que utiliza:

```text
la misma aplicación
```

y no dos diseños completamente diferentes.

---

# 151. Criterio de finalización de SPEC-008

Un aprendiz deberá poder explicar:

1. ¿Qué diferencia existe entre tema preferido y tema efectivo?
2. ¿Qué ocurre cuando el usuario selecciona SISTEMA?
3. ¿Dónde se persiste oficialmente el tema?
4. ¿Puede utilizarse almacenamiento local para el tema?
5. ¿Por qué sí puede usarse para el tema pero no para Refresh Tokens?
6. ¿Qué son las variables CSS?
7. ¿Por qué evitamos colores directos en componentes?
8. ¿Qué significa mobile first?
9. ¿Por qué no comprimimos una tabla desktop en móvil?
10. ¿Qué función cumplen los breakpoints?
11. ¿Por qué no diseñamos para modelos específicos de teléfono?
12. ¿Qué diferencia existe entre un botón primario y uno secundario?
13. ¿Por qué un placeholder no sustituye un label?
14. ¿Por qué el color no puede ser la única forma de comunicar un estado?
15. ¿Qué significa focus visible?
16. ¿Qué es `prefers-reduced-motion`?
17. ¿Qué estados debe contemplar una pantalla además del estado normal?
18. ¿Por qué evitamos un framework visual al inicio del proyecto educativo?
19. ¿Por qué los temas deben cambiar apariencia pero no layout?
20. ¿Qué requisitos responsive mínimos tiene la aplicación?

Cuando estas respuestas estén claras, `SPEC-008` queda definida.
