# SPEC-007 — Dashboard principal y experiencia visual

## 1. Objetivo

Definir la pantalla principal que verá el usuario después de iniciar sesión.

El dashboard debe permitir comprender rápidamente:

* cuál fue el consumo de ayer;
* cuánto se consumió en los últimos 7 días;
* cuánto se ha consumido durante el mes actual;
* cuánto se ha consumido durante el año actual;
* cuál fue el día de mayor consumo;
* cuál es el promedio reciente;
* cuál es la última lectura registrada;
* si existen días sin información suficiente.

El objetivo principal será:

> Mostrar información útil en pocos segundos, sin saturar la pantalla.

---

# 2. Principios visuales

La interfaz deberá ser:

* minimalista;
* limpia;
* responsiva;
* fácil de leer;
* consistente;
* sin exceso de colores;
* sin exceso de tarjetas;
* sin información repetida;
* utilizable en computadora y móvil.

---

# 3. Jerarquía de información

La información deberá seguir esta prioridad:

```text id="p8c2fe"
1. Consumo reciente
2. Tendencia de los últimos días
3. Lectura actual
4. Resumen mensual
5. Resumen anual
6. Estadísticas secundarias
```

El usuario no debería necesitar desplazarse mucho para conocer:

```text id="a08lqe"
¿cuánto consumí ayer?
¿cómo fue esta semana?
```

---

# 4. Pantalla principal

Ruta:

```text id="0kwrpl"
/dashboard
```

Será la primera pantalla después del login.

---

# 5. Estructura general en escritorio

Conceptualmente:

```text id="7nzctl"
┌─────────────────────────────────────────────────────────────┐
│ Sidebar │ Dashboard                              Usuario     │
│         │                                                     │
│         │ [ Ayer ] [ 7 días ] [ Mes ] [ Año ]                │
│         │                                                     │
│         │ ┌───────────────────────────────────────────────┐   │
│         │ │ Gráfico principal                            │   │
│         │ └───────────────────────────────────────────────┘   │
│         │                                                     │
│         │ Promedio     Mayor consumo     Última lectura       │
│         │                                                     │
└─────────────────────────────────────────────────────────────┘
```

---

# 6. Tarjetas principales

Habrá inicialmente cuatro tarjetas.

```text id="vd5c10"
Ayer
Últimos 7 días
Mes actual
Año actual
```

No añadiremos muchas más tarjetas al inicio.

---

# 7. Tarjeta “Ayer”

Ejemplo:

```text id="qj7oy0"
Ayer
8 kWh
```

Puede incluir:

```text id="r0b6co"
29 Ago
```

como información secundaria.

---

# 8. Ayer sin datos

Si no puede calcularse:

```text id="t09xv2"
Ayer
—
Sin información suficiente
```

No mostrar:

```text id="r21a10"
0 kWh
```

---

# 9. Tarjeta “Últimos 7 días”

Ejemplo:

```text id="ldxgk3"
Últimos 7 días
51 kWh
```

Si el período es parcial:

```text id="hfabn4"
Últimos 7 días
40 kWh

Datos parciales
```

---

# 10. Tarjeta “Mes”

Ejemplo:

```text id="bljg0h"
Agosto
218 kWh
```

Información secundaria:

```text id="15pwd5"
Hasta 30 Ago
```

---

# 11. Mes parcial

Si la aplicación comenzó a mitad de mes:

```text id="61y4z7"
Agosto
180 kWh

Desde 5 Ago
```

No debe parecer un total completo de agosto.

---

# 12. Tarjeta “Año”

Ejemplo:

```text id="45hkkj"
2026
2470 kWh
```

Información secundaria:

```text id="6ihr35"
Hasta 30 Ago
```

---

# 13. Año parcial

Si la aplicación comenzó en agosto:

```text id="xsgv08"
2026
180 kWh

Desde 5 Ago
```

---

# 14. Gráfico principal

La visualización principal será:

```text id="d7g285"
gráfico de barras
```

Rango inicial:

```text id="l71v8u"
últimos 7 días
```

---

# 15. Motivo de gráfico de barras

Las barras permiten comparar rápidamente:

```text id="ewdpm0"
qué día consumió más
qué día consumió menos
diferencias entre días
```

Para este problema resulta más claro que una gráfica de pastel.

---

# 16. No utilizar gráfico circular

No utilizaremos inicialmente:

```text id="r1i8xw"
pie chart
donut chart
```

porque queremos comparar una serie temporal.

---

# 17. Gráfico 7 días

Ejemplo:

```text id="lo1ttc"
12 │             █
10 │       █     █
 8 │   █   █     █   █
 6 │ █ █   █ █   █   █
 4 │ █ █ █ █ █ █ █ █ █
   └─────────────────────
     L M X J V S D
```

---

# 18. Etiquetas

En móvil podrán utilizarse:

```text id="ww0h34"
L
M
X
J
V
S
D
```

En escritorio:

```text id="ipjckl"
Lun
Mar
Mié
Jue
Vie
Sáb
Dom
```

---

# 19. Tooltip

Al interactuar con una barra:

```text id="myeml3"
Miércoles 26 Ago
12 kWh
```

---

# 20. Día sin dato

Si falta información:

```text id="me9pc4"
consumo = null
```

la gráfica no dibujará una barra de cero.

Debe indicarse visualmente:

```text id="gwv6m6"
Sin dato
```

---

# 21. Tooltip de intervalo incompleto

Ejemplo:

```text id="05qngi"
30 Ago

Consumo diario no disponible.

15 kWh consumidos
entre 28 y 30 Ago.
```

---

# 22. Valor cero

Si el consumo real es:

```text id="ac4p3q"
0 kWh
```

el tooltip debe mostrar:

```text id="1jbmwc"
0 kWh
```

No:

```text id="mkslhh"
Sin dato
```

---

# 23. Filtros del gráfico

El usuario podrá cambiar entre:

```text id="3k4b69"
7 días
Mes
Año
```

No tendremos decenas de filtros.

---

# 24. Vista 7 días

```text id="j22lw0"
1 barra = 1 día
```

---

# 25. Vista Mes

```text id="5f68ve"
1 barra = 1 día
```

hasta la fecha disponible.

---

# 26. Vista Año

```text id="2vuvut"
1 barra = 1 mes
```

Esto evita intentar mostrar:

```text id="enfxd3"
365 barras
```

---

# 27. Cambio de período

El control puede ser:

```text id="lrhn6u"
[ 7 días ] [ Mes ] [ Año ]
```

No necesita ser un selector complejo.

---

# 28. Período seleccionado

El período activo debe distinguirse claramente.

Ejemplo:

```text id="nbzwqw"
[ 7 días ]  Mes  Año
```

---

# 29. Carga de series

Al cambiar:

```text id="iodfy8"
7 días → Mes
```

React consultará:

```text id="stf4ex"
/api/estadisticas/serie?periodo=mes
```

---

# 30. El dashboard no recalcula estadísticas

React no deberá recibir todas las lecturas y calcular:

```text id="150afx"
promedio
máximo
total
```

por su cuenta.

El backend será responsable del cálculo.

---

# 31. Endpoint de resumen

El dashboard consumirá:

```http id="0xwxfc"
GET /api/estadisticas/resumen
```

---

# 32. Endpoint de gráfica

```http id="gl6awy"
GET /api/estadisticas/serie?periodo=7d
```

---

# 33. Tarjeta de promedio

Debajo o junto al gráfico podremos mostrar:

```text id="9ngnre"
Promedio diario
7.3 kWh
```

Por defecto:

```text id="ev4mmb"
últimos 7 días
```

---

# 34. Promedio con poca cobertura

Si existen pocos datos:

```text id="6m5qnp"
Promedio diario
7.3 kWh

Basado en 4 de 7 días
```

Esto evita falsa precisión.

---

# 35. Mayor consumo

Ejemplo:

```text id="eshr4p"
Mayor consumo
11 kWh

Jueves 27 Ago
```

---

# 36. Empate

Si dos días tienen el mismo máximo:

```text id="2cpyku"
Mayor consumo
11 kWh

2 días
```

Al abrir detalle o tooltip:

```text id="0yt28v"
27 Ago
29 Ago
```

---

# 37. Última lectura

Ejemplo:

```text id="5d2qcy"
Última lectura
12 555

30 Ago 2026
```

Debe quedar claro que:

```text id="dxihyo"
12 555
```

es la numeración acumulada del medidor.

---

# 38. No confundir lectura con consumo

La tarjeta deberá usar explícitamente:

```text id="r30zhe"
Última lectura
```

y no:

```text id="yv45ec"
Consumo actual
```

---

# 39. Estado de lectura de hoy

El dashboard también puede indicar:

```text id="qnpdhm"
Lectura de hoy registrada
```

o:

```text id="50ehyh"
Lectura de hoy pendiente
```

---

# 40. CTA principal

Si hoy no existe lectura:

```text id="hudg9i"
[ Registrar lectura de hoy ]
```

será una acción destacada.

---

# 41. Si ya existe lectura de hoy

El CTA cambia a:

```text id="ijdl8i"
[ Ver lectura de hoy ]
```

o:

```text id="c3piw8"
[ Corregir lectura ]
```

si tiene permiso.

---

# 42. Evitar duplicidad

No mostrar simultáneamente:

```text id="nxxchq"
Registrar lectura
Nueva lectura
Agregar medición
Crear registro
```

para la misma acción.

Utilizaremos un lenguaje consistente:

```text id="ee2nzm"
Registrar lectura
```

---

# 43. Encabezado

El encabezado puede mostrar:

```text id="5os4ca"
Dashboard
Resumen del consumo eléctrico de tu hogar
```

Sin exceso de texto.

---

# 44. Navegación escritorio

Sidebar:

```text id="m93l41"
Dashboard
Lecturas
Historial
Perfil
```

Para ADMIN:

```text id="rz8c3u"
Usuarios
```

---

# 45. Posible simplificación

`Lecturas` y `Historial` podrían solaparse.

Para evitar navegación innecesaria, recomendamos:

```text id="tpxhj3"
Dashboard
Historial
Usuarios   ← solo ADMIN
Perfil
```

y el botón:

```text id="gzyxq6"
Registrar lectura
```

como acción principal.

---

# 46. Decisión de navegación

Para el MVP utilizaremos:

```text id="grumw9"
Dashboard
Historial
Perfil
```

y para ADMIN:

```text id="d9k5em"
Usuarios
```

`Registrar lectura` será una acción, no una sección permanente del menú.

---

# 47. Navegación móvil

En móvil podremos utilizar barra inferior:

```text id="m2jrm7"
Inicio
Historial
Perfil
```

Para ADMIN, la gestión de usuarios podrá estar dentro de:

```text id="m9o21k"
Más
```

o en el menú superior.

---

# 48. Botón flotante

En móvil podemos utilizar un botón destacado:

```text id="n63ikn"
+
```

para:

```text id="5xw4yj"
Registrar lectura
```

pero debe mantener etiqueta accesible.

---

# 49. Accesibilidad del botón

Aunque visualmente sea:

```text id="xp7l0r"
+
```

deberá tener:

```text id="710wkg"
aria-label="Registrar lectura"
```

---

# 50. Responsive — escritorio

A partir de un ancho suficiente:

```text id="7t0m1h"
sidebar fija
4 tarjetas en fila
gráfico amplio
estadísticas secundarias en fila
```

---

# 51. Responsive — tablet

Podremos utilizar:

```text id="87sxwr"
2 tarjetas por fila
```

y navegación adaptada.

---

# 52. Responsive — móvil

En móvil:

```text id="t1os53"
1 tarjeta por fila
```

o tarjetas principales en:

```text id="5xslr6"
2 columnas compactas
```

si el ancho lo permite.

---

# 53. Prioridad móvil

El orden será:

```text id="gogv3f"
1. Estado lectura de hoy
2. Ayer
3. Gráfico 7 días
4. Últimos 7 días
5. Mes
6. Estadísticas secundarias
7. Año
```

Esto prioriza lo más útil.

---

# 54. Ejemplo móvil

```text id="7e4vva"
┌─────────────────────────┐
│ ⚡ Consumo       👤     │
├─────────────────────────┤
│ Lectura de hoy          │
│ Pendiente               │
│ [ Registrar ]           │
├─────────────────────────┤
│ Ayer                    │
│ 8 kWh                   │
├─────────────────────────┤
│ Últimos 7 días          │
│                         │
│       █                 │
│   █   █   █             │
│ █ █ █ █ █ █ █           │
│ L M X J V S D           │
│                         │
│ 51 kWh                  │
├─────────────────────────┤
│ Mes         218 kWh     │
│ Año        2470 kWh     │
└─────────────────────────┘
```

---

# 55. Diseño de tarjetas

Cada tarjeta debe tener:

```text id="lxj20h"
etiqueta
valor
unidad
información secundaria opcional
```

No necesitamos iconos enormes.

---

# 56. Ejemplo

```text id="u882o0"
Últimos 7 días
51 kWh
Cobertura 100 %
```

---

# 57. Unidad

Siempre utilizar:

```text id="8j7wgj"
kWh
```

de manera consistente.

---

# 58. Separación entre valor y unidad

Visualmente:

```text id="a8llmp"
51 kWh
```

No:

```text id="5h32k3"
51KWH
```

---

# 59. Estados de tarjeta

Una tarjeta puede tener:

```text id="3avbrv"
COMPLETO
PARCIAL
SIN_DATOS
```

pero esos nombres técnicos no tienen que mostrarse literalmente.

---

# 60. COMPLETO visual

Ejemplo:

```text id="7bkte3"
51 kWh
```

sin advertencias.

---

# 61. PARCIAL visual

Ejemplo:

```text id="bonmq1"
40 kWh
Datos desde 26 Ago
```

---

# 62. SIN_DATOS visual

```text id="i6hahg"
—
Sin datos suficientes
```

---

# 63. Evitar colores alarmistas

`PARCIAL` no es necesariamente un error.

No debe mostrarse automáticamente como:

```text id="i1wtqg"
rojo
```

Puede utilizar un tratamiento neutral.

---

# 64. Colores

El sistema deberá utilizar una paleta reducida.

Conceptualmente:

```text id="ma9pw6"
fondo
superficie
texto principal
texto secundario
borde
acento
positivo/normal
advertencia
error
```

Los colores exactos se definirán en SPEC-008.

---

# 65. Tema claro

Debe tener:

```text id="6ju52r"
fondos claros
contraste suficiente
tarjetas discretas
```

---

# 66. Tema oscuro

Debe evitar:

```text id="3qeqwx"
negro absoluto para todo
texto gris con poco contraste
```

La legibilidad es prioritaria.

---

# 67. Animaciones

Se utilizarán de forma mínima.

Permitidas:

```text id="yvpr1j"
transiciones de tema
hover ligero
entrada discreta de tooltip
```

No necesitamos animaciones complejas de tarjetas.

---

# 68. Gráfica animada

La librería podrá animar la entrada inicialmente, pero la animación debe ser breve y no interferir con la lectura.

---

# 69. Librería de gráficos

La implementación podrá utilizar:

```text id="bnnr1s"
Recharts
```

porque encaja bien con React y es suficientemente simple para el proyecto.

---

# 70. No acoplar dominio a Recharts

La API devolverá:

```json id="h6ba82"
{
  "fecha": "2026-08-30",
  "consumo": 8
}
```

No:

```json id="vxe9vj"
{
  "rechartsBarHeight": 50
}
```

La librería es responsabilidad del frontend.

---

# 71. Carga inicial

Al entrar al dashboard React solicitará:

```text id="2pfiyc"
resumen
+
serie de 7 días
```

---

# 72. Consultas paralelas

Pueden ejecutarse en paralelo porque ambas son de lectura:

```text id="1ku340"
GET /estadisticas/resumen
GET /estadisticas/serie?periodo=7d
```

---

# 73. Error parcial

Si el resumen carga pero la gráfica falla:

```text id="k82jqa"
las tarjetas pueden seguir mostrándose
```

No debemos inutilizar todo el dashboard.

---

# 74. Ejemplo

```text id="p412ah"
Ayer        8 kWh
7 días      51 kWh
Mes         218 kWh

No se pudo cargar el gráfico.
[ Reintentar ]
```

---

# 75. Skeleton

Durante carga podemos mostrar:

```text id="nn7dqd"
bloques skeleton
```

con la misma estructura de las tarjetas.

---

# 76. Sin datos

Cuando no existe ninguna lectura:

```text id="ry4i5b"
Aún no existen datos de consumo.
```

Acción destacada:

```text id="7e986o"
Registrar primera lectura
```

---

# 77. Dashboard con primera lectura

Después de la primera lectura:

```text id="kkgdx2"
Última lectura
12 500
```

pero:

```text id="mfx0af"
Ayer        —
7 días      —
Mes         —
Año         —
```

Mensaje:

```text id="kfirqh"
Necesitamos al menos dos lecturas para calcular consumo.
```

---

# 78. Segunda lectura

Después de dos días consecutivos:

```text id="a8f94x"
ya puede aparecer la primera barra real
```

---

# 79. Aviso de lectura pendiente

Si hoy no se ha registrado:

```text id="65evzr"
Aún no has registrado la lectura de hoy.
```

Esto no es una alerta crítica.

---

# 80. No exigir lectura inmediatamente

Si son las:

```text id="38jxz6"
08:00
```

el sistema no debe mostrar:

```text id="2ogp6s"
ERROR: lectura faltante
```

La lectura puede registrarse en cualquier momento del día.

---

# 81. Estado de hoy

Valores conceptuales:

```text id="mh2x5z"
REGISTRADA
PENDIENTE
```

No necesitamos almacenarlos.

Se derivan de la existencia de lectura en la fecha actual.

---

# 82. Registro desde dashboard

Al pulsar:

```text id="o0frcx"
Registrar lectura
```

puede abrirse:

```text id="anr7j2"
modal
drawer
o pantalla dedicada
```

Para móvil, recomendamos:

```text id="eqjn5n"
pantalla o bottom sheet sencillo
```

---

# 83. Formulario mínimo

```text id="8kdvum"
Lectura actual del medidor

[ 12555 ]

30 Ago 2026

[ Guardar lectura ]
```

---

# 84. No pedir consumo

Nunca:

```text id="zz9qoz"
Consumo del día [    ]
```

---

# 85. Mostrar lectura anterior

El formulario puede ayudar indicando:

```text id="59tbn4"
Última lectura
12547
```

Así el usuario puede detectar rápidamente si escribió algo menor.

---

# 86. Validación frontend

React puede comprobar:

```text id="1g3c8s"
entero
no negativo
```

antes de enviar.

---

# 87. Validación backend

Express repetirá todas las validaciones.

---

# 88. Confirmación de registro

Después de guardar:

```text id="d3a8dg"
Lectura registrada correctamente.
```

El dashboard debe refrescar:

```text id="tzj010"
última lectura
tarjetas
gráfico
```

---

# 89. No recalcular manualmente

La versión inicial volverá a consultar:

```text id="8c0eyz"
resumen
serie
```

después del registro.

---

# 90. Acceso a historial

Desde el dashboard puede existir:

```text id="zo4sh9"
Ver historial
```

sin duplicar una tabla histórica completa en la pantalla principal.

---

# 91. Dashboard ADMIN

El dashboard del ADMIN tendrá las mismas estadísticas eléctricas.

No necesita otro dashboard completamente diferente.

---

# 92. Acceso administrativo

ADMIN verá además acceso a:

```text id="qwz1nc"
Gestionar usuarios
```

---

# 93. Evitar métricas administrativas innecesarias

No necesitamos mostrar:

```text id="nr2h2a"
usuarios activos
sesiones activas
logins hoy
```

en el dashboard principal.

El objetivo del dashboard sigue siendo:

```text id="r6eifo"
consumo eléctrico
```

---

# 94. Diseño accesible

Todo texto importante debe tener contraste adecuado.

No utilizar exclusivamente color para representar:

```text id="ch217a"
dato parcial
dato faltante
```

Debe haber texto o iconografía accesible.

---

# 95. Gráfico accesible

El gráfico deberá tener una alternativa textual.

Ejemplo:

```text id="mvphbf"
Resumen últimos 7 días:
Lunes 5 kWh,
Martes 7 kWh,
Miércoles sin dato...
```

No necesariamente visible permanentemente, pero accesible para tecnologías asistivas.

---

# 96. Navegación por teclado

Debe poder utilizarse mediante:

```text id="q08nw5"
Tab
Shift+Tab
Enter
Escape
```

cuando corresponda.

---

# 97. Focus visible

Los controles deben mostrar un estado de foco visible.

No eliminar:

```text id="prf6ks"
outline
```

sin reemplazo accesible.

---

# 98. `prefers-reduced-motion`

Las animaciones deberán respetar:

```text id="9ocasu"
prefers-reduced-motion
```

cuando sea posible.

---

# 99. Formato regional

Inicialmente utilizaremos localización:

```text id="7owdjr"
es-EC
```

para la presentación.

Ejemplos:

```text id="sh81w3"
30 ago 2026
12.555
```

La API continuará utilizando formatos técnicos estables.

---

# 100. Responsive mínimo esperado

Se considerarán al menos:

```text id="j1tqii"
móvil pequeño
móvil grande
tablet
desktop
```

No se diseñará únicamente para 1920×1080.

---

# 101. Overflow horizontal

La pantalla principal no deberá requerir desplazamiento horizontal en móvil.

---

# 102. Gráfico responsive

El gráfico deberá adaptar:

```text id="1odtvy"
ancho
cantidad de etiquetas
tamaño de texto
```

según el contenedor.

---

# 103. Tooltips móviles

No deberán depender exclusivamente de:

```text id="sbb615"
hover
```

porque los teléfonos no tienen hover tradicional.

---

# 104. API necesaria

Dashboard:

```text id="uu5ivj"
GET /api/estadisticas/resumen
GET /api/estadisticas/serie?periodo=7d
GET /api/estadisticas/serie?periodo=mes
GET /api/estadisticas/serie?periodo=anio
```

Lectura rápida:

```text id="caap9c"
GET /api/lecturas/ultima
```

aunque parte de esta información ya puede venir dentro del resumen.

---

# 105. Evitar petición innecesaria

Si:

```text id="zn2ud4"
/estadisticas/resumen
```

ya contiene:

```text id="2em5tv"
ultimaLectura
```

el dashboard no deberá llamar también:

```text id="6kxj0s"
/lecturas/ultima
```

sin necesidad.

---

# 106. Contrato de resumen recomendado

```json id="a7le0b"
{
  "fechaReferencia": "2026-08-30",

  "lecturaHoy": {
    "registrada": true
  },

  "ultimaLectura": {
    "fecha": "2026-08-30",
    "valor": 12555
  },

  "ayer": {
    "consumo": 8,
    "estado": "COMPLETO"
  },

  "ultimos7Dias": {
    "consumo": 51,
    "estado": "COMPLETO",
    "coberturaDiaria": 100
  },

  "mesActual": {
    "consumo": 218,
    "estado": "COMPLETO",
    "fechaHasta": "2026-08-30"
  },

  "anioActual": {
    "consumo": 2470,
    "estado": "COMPLETO",
    "fechaHasta": "2026-08-30"
  },

  "promedio7Dias": {
    "valor": 7.3,
    "diasUtilizados": 7
  },

  "mayorConsumo7Dias": {
    "valor": 11,
    "fechas": [
      "2026-08-27"
    ]
  }
}
```

---

# 107. Contrato con lectura pendiente

```json id="kn01ss"
{
  "lecturaHoy": {
    "registrada": false
  },

  "ultimaLectura": {
    "fecha": "2026-08-29",
    "valor": 12547
  }
}
```

---

# 108. Serie 7 días

```json id="rvlzbu"
{
  "periodo": "7d",
  "datos": [
    {
      "fecha": "2026-08-24",
      "consumo": 5,
      "estado": "CONOCIDO"
    },
    {
      "fecha": "2026-08-25",
      "consumo": null,
      "estado": "SIN_LECTURA"
    }
  ]
}
```

---

# 109. Serie anual

Ejemplo:

```json id="gy9wcm"
{
  "periodo": "anio",
  "datos": [
    {
      "mes": 1,
      "consumo": 210,
      "estado": "COMPLETO"
    },
    {
      "mes": 2,
      "consumo": 198,
      "estado": "COMPLETO"
    },
    {
      "mes": 8,
      "consumo": 218,
      "estado": "COMPLETO"
    },
    {
      "mes": 9,
      "consumo": null,
      "estado": "NO_APLICA"
    }
  ]
}
```

---

# 110. Pruebas funcionales

La implementación deberá probar:

```text id="c5opv4"
dashboard sin lecturas
dashboard con una lectura
dashboard con dos lecturas
lectura de hoy pendiente
lectura de hoy registrada
datos completos
datos parciales
```

---

# 111. Pruebas de gráfica

```text id="eequm4"
7 barras/posiciones
valor cero
valor null
mes con días faltantes
año agrupado por meses
mes futuro NO_APLICA
```

---

# 112. Pruebas de tarjetas

```text id="sn2sdy"
ayer conocido
ayer desconocido
7 días completo
7 días parcial
mes completo
mes parcial
año parcial
```

---

# 113. Pruebas responsive

Como mínimo:

```text id="815rsv"
375 px
768 px
1024 px
1440 px
```

No como valores rígidos obligatorios de diseño, sino como referencias de verificación.

---

# 114. Pruebas de accesibilidad

Verificar:

```text id="lre6ra"
navegación teclado
focus visible
labels
contraste
gráfico con descripción
botones con nombre accesible
```

---

# 115. Prueba crítica 1

Sin lecturas.

El dashboard:

```text id="ogt7p0"
NO falla
NO muestra ceros falsos
NO muestra gráfico engañoso
```

Debe ofrecer:

```text id="4h7khx"
Registrar primera lectura
```

---

# 116. Prueba crítica 2

Una sola lectura:

```text id="mdhk4n"
12500
```

Debe mostrar:

```text id="9rrc2u"
Última lectura = 12500
```

pero no:

```text id="w8pvzy"
Ayer = 0
```

---

# 117. Prueba crítica 3

Falta un día dentro de los últimos 7.

El total acumulado puede seguir siendo conocido.

La gráfica debe mostrar:

```text id="f0la9g"
huecos
```

y la tarjeta puede mostrar:

```text id="y0duoz"
cobertura parcial
```

---

# 118. Prueba crítica 4

Consumo real:

```text id="9fktbv"
0 kWh
```

Debe aparecer como:

```text id="b23td7"
0
```

no como:

```text id="jbpzjg"
—
```

---

# 119. Invariantes

### DASH-INV-001

El dashboard nunca inventa datos.

### DASH-INV-002

`0` y `null` se representan de forma diferente.

### DASH-INV-003

Los totales parciales siempre incluyen contexto.

### DASH-INV-004

La gráfica semanal representa exactamente siete fechas.

### DASH-INV-005

Un día sin dato no se representa como barra cero.

### DASH-INV-006

El año agrupa por meses.

### DASH-INV-007

Los meses futuros no representan consumo cero.

### DASH-INV-008

React no recalcula las reglas de negocio.

### DASH-INV-009

Backend continúa siendo fuente de verdad.

### DASH-INV-010

El dashboard funciona sin ninguna lectura.

### DASH-INV-011

El dashboard funciona con una única lectura.

### DASH-INV-012

ADMIN y USUARIO ven las mismas estadísticas eléctricas.

### DASH-INV-013

La navegación administrativa no debe dominar el dashboard.

### DASH-INV-014

La interfaz debe funcionar sin desplazamiento horizontal en móvil.

---

# 120. Decisiones congeladas por SPEC-007

1. `/dashboard` será la pantalla inicial.
2. Habrá cuatro tarjetas principales.
3. Ayer.
4. Últimos 7 días.
5. Mes.
6. Año.
7. La gráfica principal será de barras.
8. Vista inicial: últimos 7 días.
9. Existirán filtros 7 días, Mes y Año.
10. Mes usa barras diarias.
11. Año usa barras mensuales.
12. Se mostrará promedio reciente.
13. Se mostrará mayor consumo.
14. Se mostrará última lectura.
15. Se indicará si la lectura de hoy está pendiente.
16. Registrar lectura será una acción principal.
17. No habrá pie charts.
18. No habrá métricas administrativas innecesarias.
19. La navegación principal será Dashboard, Historial y Perfil.
20. ADMIN tendrá además Usuarios.
21. El dashboard será responsive.
22. Móvil priorizará lectura de hoy, ayer y últimos 7 días.
23. El gráfico distinguirá cero de dato faltante.
24. Los períodos parciales tendrán contexto.
25. Se utilizará `es-EC` para presentación.
26. El backend entregará resumen y series calculadas.
27. React no será responsable de calcular estadísticas de negocio.
28. Se recomienda Recharts para implementación.
29. La accesibilidad será requisito del MVP.
30. Los estados vacíos formarán parte del diseño normal.

---

# 121. Resultado visual conceptual — escritorio

```text id="xy30jm"
┌─────────────┬──────────────────────────────────────────────────┐
│ ⚡ Energía  │ Dashboard                             Usuario     │
│             │                                                   │
│ Dashboard   │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │
│ Historial   │ │ Ayer   │ │ 7 días │ │ Agosto │ │ 2026   │      │
│ Perfil      │ │ 8 kWh  │ │ 51 kWh │ │218 kWh │ │2470 kWh│      │
│             │ └────────┘ └────────┘ └────────┘ └────────┘      │
│ Usuarios*   │                                                   │
│             │ Consumo reciente        [7 días][Mes][Año]       │
│             │                                                   │
│             │ ┌──────────────────────────────────────────────┐  │
│             │ │             GRÁFICO DE BARRAS               │  │
│             │ └──────────────────────────────────────────────┘  │
│             │                                                   │
│             │ Promedio     Mayor consumo     Última lectura     │
│             │ 7.3 kWh      11 kWh            12 555             │
│             │                                                   │
│             │                 [ Registrar lectura ]             │
└─────────────┴──────────────────────────────────────────────────┘

* Solo ADMIN
```

---

# 122. Criterio de finalización de SPEC-007

Un aprendiz deberá poder explicar:

1. ¿Cuál es el objetivo del dashboard?
2. ¿Qué información tiene mayor prioridad?
3. ¿Qué cuatro tarjetas principales existen?
4. ¿Por qué usamos barras?
5. ¿Por qué no usamos un gráfico circular?
6. ¿Qué representa la vista de 7 días?
7. ¿Qué representa la vista mensual?
8. ¿Qué representa la vista anual?
9. ¿Cómo representamos un día sin dato?
10. ¿Cómo representamos 0 kWh?
11. ¿Qué significa un período parcial?
12. ¿Por qué mostramos la fecha hasta la que tenemos datos?
13. ¿Qué ocurre si no existen lecturas?
14. ¿Qué ocurre con una sola lectura?
15. ¿Qué hace el botón Registrar lectura?
16. ¿Por qué React no calcula el consumo?
17. ¿Qué cambia en móvil?
18. ¿Qué información extra tiene ADMIN?
19. ¿Qué requisitos mínimos de accesibilidad tenemos?
20. ¿Qué endpoints alimentan el dashboard?

Cuando estas respuestas estén claras, `SPEC-007` queda definida.
