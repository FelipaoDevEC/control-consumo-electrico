# CHECKPOINT 8 — Dashboard principal y registro rápido de lectura

## 1. Objetivo

Implementar el dashboard definido en `SPEC-007`, conectándolo con las APIs reales construidas en los checkpoints anteriores.

Al finalizar este checkpoint tendremos:

* dashboard real conectado al backend;
* consumo de ayer;
* consumo de últimos 7 días;
* consumo del mes actual;
* consumo del año actual;
* última lectura;
* estado de lectura de hoy;
* promedio diario reciente;
* mayor consumo reciente;
* cobertura de datos;
* gráfico de barras;
* vistas `7 días`, `Mes` y `Año`;
* representación correcta de datos faltantes;
* representación correcta de períodos parciales;
* formulario para registrar la lectura de hoy;
* actualización automática del dashboard después de registrar;
* estados de carga, vacío y error;
* pruebas frontend del dashboard.

Todavía NO implementaremos completamente:

```text
historial visual completo
corrección desde historial
CRUD visual de usuarios
selector final de temas
refinamiento responsive/accesibilidad final
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
```

El frontend ya debe tener:

```text
sesión real
Axios
AuthContext
ProtectedRoute
AppLayout
```

El backend ya debe tener:

```text
GET /api/estadisticas/resumen
GET /api/estadisticas/serie

POST /api/lecturas
GET /api/lecturas/ultima
```

---

# 3. SPEC relacionadas

Principalmente:

```text
SPEC-005 → estadísticas
SPEC-007 → dashboard
SPEC-008 → sistema visual
SPEC-010 → seguridad
SPEC-012 → pruebas
```

Además reutilizaremos:

```text
SPEC-004 → registro de lectura
```

---

# 4. Dependencias nuevas

Instalar:

```bash
npm install recharts
```

No necesitamos instalar otra librería de gráficas.

---

# 5. Arquitectura frontend

```text
DashboardPage
    │
    ├── estadisticas.api.js
    │      ├── obtenerResumen()
    │      └── obtenerSerie(periodo)
    │
    ├── lecturas.api.js
    │      └── registrarLectura()
    │
    └── components/dashboard/
           ├── MetricCard
           ├── ConsumptionChart
           ├── TodayReadingCard
           ├── DashboardSummary
           └── PeriodSelector
```

---

# 6. Crear módulos API

Crear:

```text
frontend/src/api/
├── estadisticas.api.js
└── lecturas.api.js
```

---

# 7. `estadisticas.api.js`

Funciones:

```text
obtenerResumen()
obtenerSerie(periodo)
```

---

# 8. `lecturas.api.js`

Inicialmente:

```text
registrarLectura(datos)
obtenerUltimaLectura()
```

Aunque `ultimaLectura` ya viene en el resumen, evitaremos consultarla por separado en dashboard.

---

# 9. Evitar petición redundante

Dashboard debe utilizar:

```text
GET /estadisticas/resumen
```

para obtener:

```text
ultimaLectura
lecturaHoy
ayer
7 días
mes
año
promedio
máximo
```

No llamar también:

```text
GET /lecturas/ultima
```

sin necesidad.

---

# 10. Carga inicial

Al montar `DashboardPage` ejecutar en paralelo:

```text
GET /estadisticas/resumen
GET /estadisticas/serie?periodo=7d
```

---

# 11. Peticiones paralelas

Conceptualmente:

```javascript
Promise.all([
    obtenerResumen(),
    obtenerSerie('7d'),
]);
```

---

# 12. Estado local

Dashboard necesitará aproximadamente:

```text
resumen
serie
periodoActivo
loadingResumen
loadingSerie
errorResumen
errorSerie
```

---

# 13. No Context global para dashboard

No necesitamos crear:

```text
DashboardContext
```

Los datos pertenecen principalmente a:

```text
DashboardPage
```

---

# 14. Página principal

Ruta:

```text
/dashboard
```

---

# 15. Estructura conceptual

```text
Dashboard

[ Estado lectura de hoy ]

[ Ayer ] [ 7 días ] [ Mes ] [ Año ]

Consumo
[ 7 días ] [ Mes ] [ Año ]

[ GRÁFICO ]

Promedio
Mayor consumo
Última lectura
Cobertura
```

---

# 16. Orden en desktop

Inicialmente:

```text
encabezado
↓
estado lectura de hoy
↓
4 tarjetas principales
↓
gráfico
↓
estadísticas secundarias
```

---

# 17. Encabezado

Mostrar:

```text
Dashboard
Resumen del consumo eléctrico de tu hogar
```

Sin texto excesivo.

---

# 18. Tarjetas principales

Crear componente:

```text
MetricCard.jsx
```

Debe aceptar conceptualmente:

```text
titulo
valor
unidad
subtexto
estado
loading
```

---

# 19. Tarjeta Ayer

Datos:

```text
resumen.ayer
```

---

# 20. Caso completo

```text
Ayer
8 kWh
31 Ago
```

---

# 21. Sin datos

Si:

```text
consumo = null
```

mostrar:

```text
Ayer
—
Sin información suficiente
```

---

# 22. Nunca

```text
Ayer
0 kWh
```

si realmente el backend devolvió:

```text
null
```

---

# 23. Cero real

Si backend devuelve:

```text
consumo = 0
```

mostrar:

```text
0 kWh
```

---

# 24. Tarjeta últimos 7 días

Usar:

```text
resumen.ultimos7Dias
```

---

# 25. Completo

```text
Últimos 7 días
51 kWh
```

---

# 26. Parcial

Si:

```text
estado = PARCIAL
```

mostrar contexto:

```text
40 kWh
Datos hasta 31 Ago
```

o:

```text
Datos desde 27 Ago
```

según respuesta disponible.

---

# 27. Cobertura

Como información secundaria:

```text
Cobertura diaria: 71 %
```

---

# 28. No convertir cobertura baja en error

Una cobertura:

```text
71 %
```

no significa que la aplicación esté rota.

Significa:

```text
hay días cuyo consumo diario no puede determinarse
```

---

# 29. Tarjeta Mes

Título dinámico.

Ejemplo:

```text
Septiembre
8 kWh
Hasta 1 Sep
```

---

# 30. Mes parcial

```text
35 kWh
Desde 5 Sep
```

---

# 31. Tarjeta Año

Ejemplo:

```text
2026
2478 kWh
Hasta 1 Sep
```

---

# 32. Año parcial

```text
180 kWh
Desde 15 Ago
```

---

# 33. Estado de lectura de hoy

Crear:

```text
TodayReadingCard.jsx
```

---

# 34. Si hoy está registrada

Backend:

```json
{
  "lecturaHoy": {
    "registrada": true
  }
}
```

Mostrar:

```text
Lectura de hoy
Registrada
```

y:

```text
Última lectura: 12 563
```

si corresponde a hoy.

---

# 35. Acción

Podrá mostrar:

```text
Ver lectura
```

pero todavía no necesitamos navegar a detalle desde dashboard si complica el alcance.

---

# 36. Si hoy está pendiente

Mostrar:

```text
Lectura de hoy
Pendiente

[ Registrar lectura ]
```

---

# 37. No utilizar error rojo

Pendiente no es una falla crítica.

---

# 38. Registrar lectura

El botón abrirá un formulario.

Podremos utilizar:

```text
modal
drawer
```

o bloque desplegable.

---

# 39. Decisión MVP

Utilizaremos:

```text
modal sencillo
```

en desktop y móvil, siempre que sea accesible.

El refinamiento móvil final llegará en CHECKPOINT 11.

---

# 40. Componente

Crear:

```text
frontend/src/components/lecturas/ReadingForm.jsx
```

---

# 41. Formulario

```text
Registrar lectura

Fecha
1 Sep 2026

Última lectura
12 555

Lectura actual
[         ]

[ Cancelar ] [ Registrar ]
```

---

# 42. Fecha

Para USUARIO:

```text
hoy
```

No editable.

---

# 43. ¿Por qué no enviar selector de fecha?

El flujo principal del dashboard es:

```text
registrar lectura de hoy
```

La inserción histórica de ADMIN se integrará posteriormente desde historial/flujo administrativo.

---

# 44. Request

```json
{
  "fechaLectura": "2026-09-01",
  "valorLectura": 12563
}
```

---

# 45. Fecha del frontend

Debe obtenerse de forma coherente con el backend.

Pero no debemos asumir que el frontend es autoridad.

Backend vuelve a validar.

---

# 46. Evitar UTC accidental

No utilizar sin pensar:

```javascript
new Date().toISOString().slice(0, 10)
```

---

# 47. Utilidad frontend de fecha

Crear:

```text
frontend/src/utils/date.js
```

para producir la fecha de Ecuador.

---

# 48. Alternativa más segura

El resumen ya devuelve:

```text
fechaReferencia
```

Por tanto el dashboard puede utilizar:

```text
resumen.fechaReferencia
```

como fecha del formulario.

---

# 49. Decisión

El formulario de dashboard utilizará:

```text
resumen.fechaReferencia
```

No calculará independientemente “hoy”.

---

# 50. Ventaja

Frontend y backend quedan alineados.

---

# 51. Lectura anterior

Mostrar:

```text
resumen.ultimaLectura.valor
```

si existe y no corresponde ya a hoy.

---

# 52. Primera lectura

Si no existe `ultimaLectura`:

```text
Esta será la primera lectura del medidor.
```

---

# 53. Input

Debe favorecer teclado numérico:

```html
inputmode="numeric"
```

---

# 54. Valor frontend

Aunque HTML input produce texto, antes de enviar deberá convertirse de forma estricta a número entero.

---

# 55. No usar conversión permisiva

Evitar:

```javascript
parseInt('1255abc')
```

---

# 56. Validación

Debe comprobar:

```text
contenido solo numérico
entero
>= 0
```

---

# 57. No decimales

Entrada:

```text
12563.5
```

mostrar:

```text
La lectura debe ser un número entero.
```

---

# 58. Menor que última lectura

El frontend puede detectar como ayuda:

```text
valor < ultimaLectura
```

y advertir.

---

# 59. Backend sigue siendo autoridad

Porque podría existir:

```text
lectura histórica
concurrencia
estado diferente
```

---

# 60. Loading

Después de pulsar:

```text
Registrar
```

mostrar:

```text
Registrando...
```

y deshabilitar nuevo submit.

---

# 61. Éxito

Backend:

```text
201
```

Mostrar:

```text
Lectura registrada correctamente.
```

---

# 62. Después del éxito

Cerrar formulario.

Volver a consultar:

```text
GET /estadisticas/resumen
GET /estadisticas/serie?periodoActivo
```

---

# 63. No recalcular manualmente

No hacer:

```text
última lectura = nuevo valor
ayer = ...
mes = ...
```

en React.

---

# 64. Fuente de verdad

Después de una mutación:

```text
volver al backend
```

---

# 65. Error duplicado

Backend:

```text
409
LECTURA_FECHA_DUPLICADA
```

Mostrar:

```text
Ya existe una lectura registrada para hoy.
```

Después refrescar resumen, porque otro usuario pudo haberla registrado.

---

# 66. Concurrencia doméstica

Ejemplo:

```text
Usuario A tiene modal abierto
Usuario B registra primero
Usuario A intenta guardar
```

Backend:

```text
409
```

Frontend:

```text
cierra o actualiza formulario
refresca dashboard
```

---

# 67. Lectura menor

Backend:

```text
LECTURA_MENOR_QUE_ANTERIOR
```

Mostrar:

```text
La lectura no puede ser inferior a la anterior.
```

Si backend incluye:

```text
lecturaAnterior
```

podemos mostrarla.

---

# 68. Fecha futura

No debería ocurrir desde este formulario, pero manejar:

```text
LECTURA_FECHA_FUTURA
```

de forma comprensible.

---

# 69. Error de red

Mantener valor escrito.

Mostrar:

```text
No se pudo registrar la lectura.
```

---

# 70. No cerrar modal por error

El usuario debe poder corregir/reintentar.

---

# 71. Gráfico

Crear:

```text
ConsumptionChart.jsx
```

Utilizar:

```text
Recharts
```

---

# 72. Gráfico inicial

```text
BarChart
```

---

# 73. ¿Por qué barras?

Porque queremos comparar fácilmente:

```text
día vs día
mes vs mes
```

---

# 74. No usar pie chart

No aporta al análisis temporal.

---

# 75. Selector de período

Crear:

```text
PeriodSelector.jsx
```

Opciones:

```text
7 días
Mes
Año
```

---

# 76. Valores internos

```text
7d
mes
anio
```

---

# 77. Estado inicial

```text
periodoActivo = '7d'
```

---

# 78. Cambio

Al pulsar:

```text
Mes
```

consultar:

```text
GET /estadisticas/serie?periodo=mes
```

---

# 79. Año

```text
GET /estadisticas/serie?periodo=anio
```

---

# 80. No volver a cargar resumen

Cambiar gráfico no obliga a volver a pedir:

```text
/resumen
```

si nada cambió.

---

# 81. Loading gráfico

Mientras cambia período:

```text
mantener estructura
mostrar skeleton/estado loading
```

---

# 82. No borrar todo el dashboard

Solo la zona del gráfico debe reflejar su carga.

---

# 83. Error gráfico

Si resumen está correcto pero serie falla:

```text
tarjetas siguen visibles
```

Mostrar en zona gráfica:

```text
No se pudo cargar el gráfico.

[ Reintentar ]
```

---

# 84. Esta separación es obligatoria

No usar un único:

```text
loadingDashboard
```

que bloquee toda la pantalla por cualquier petición.

---

# 85. Serie 7 días

Datos:

```json
{
  "fecha": "2026-08-31",
  "consumo": 8,
  "estado": "CONOCIDO"
}
```

---

# 86. Recharts necesita número para barra

Para:

```text
consumo = null
```

no debemos transformarlo a:

```text
0
```

---

# 87. Adaptador de gráfica

Podemos mapear:

```text
consumoGrafica = consumo
```

manteniendo:

```text
null
```

---

# 88. Dato faltante

Se representará mediante:

```text
sin barra
+
marcador/etiqueta accesible
```

---

# 89. Tooltip conocido

```text
31 Ago
8 kWh
```

---

# 90. Tooltip cero

```text
31 Ago
0 kWh
```

---

# 91. Tooltip SIN_LECTURA

```text
31 Ago
Sin lectura registrada.
```

---

# 92. Tooltip SIN_BASE

Ejemplo:

```text
1 Sep

Consumo diario no disponible.
15 kWh entre 30 Ago y 1 Sep.
```

si existe intervalo.

---

# 93. No mostrar el intervalo como barra

Sigue siendo:

```text
información contextual
```

---

# 94. Etiquetas 7d

Desktop:

```text
Lun
Mar
Mié
Jue
Vie
Sáb
Dom
```

---

# 95. Mejor usar fecha real

Como una ventana de 7 días puede cruzar semana/mes, tooltip debe mostrar fecha completa.

---

# 96. Mes

Eje X puede mostrar:

```text
1
2
3
...
```

o etiquetas espaciadas.

---

# 97. No saturar

Para 30/31 días no necesitamos mostrar cada etiqueta si queda ilegible.

Recharts puede mostrar menos ticks manteniendo todos los datos.

---

# 98. Año

Eje X:

```text
Ene
Feb
Mar
Abr
May
Jun
Jul
Ago
Sep
Oct
Nov
Dic
```

---

# 99. NO_APLICA

Mes futuro:

```text
consumo = null
estado = NO_APLICA
```

No dibujar barra cero.

---

# 100. Mes PARCIAL

Si tiene consumo observado:

```text
barra puede mostrarse
```

pero debe distinguirse conceptualmente de `COMPLETO`.

---

# 101. Representación visual parcial

Puede utilizar:

```text
opacidad
patrón
indicador
```

sin depender solo del color.

---

# 102. Para MVP

Usaremos:

```text
misma barra
+
tooltip "Datos parciales"
+
indicador textual accesible
```

La diferenciación visual más avanzada puede refinase en CHECKPOINT 11.

---

# 103. Gráfico accesible

Debajo o como contenido oculto accesible debe existir un resumen textual.

---

# 104. Ejemplo

```text
Últimos 7 días:
26 Ago: 5 kWh.
27 Ago: 7 kWh.
28 Ago: sin lectura.
29 Ago: consumo diario no determinado.
...
```

---

# 105. No depender exclusivamente del SVG

La información importante debe seguir siendo comprensible.

---

# 106. Promedio

Componente secundario:

```text
Promedio diario
7.3 kWh
```

---

# 107. Días utilizados

Si cobertura parcial:

```text
Basado en 5 de 7 días
```

---

# 108. Mayor consumo

```text
Mayor consumo
11 kWh
29 Ago
```

---

# 109. Empate

Si:

```text
fechas.length > 1
```

mostrar:

```text
11 kWh
2 días
```

Tooltip/detalle:

```text
27 Ago
29 Ago
```

---

# 110. Menor consumo

SPEC-007 no lo puso como prioridad principal.

---

# 111. Decisión

Podemos mostrar:

```text
Mayor consumo
Promedio
Última lectura
Cobertura
```

y dejar el menor consumo para una vista secundaria o no mostrarlo aún.

---

# 112. Backend lo proporciona

Pero no todo dato disponible debe ocupar espacio en dashboard.

---

# 113. Última lectura

Mostrar:

```text
Última lectura
12 563

1 Sep 2026
```

---

# 114. No añadir kWh como consumo

La lectura acumulada físicamente está expresada en kWh, pero visualmente debe quedar claro:

```text
Lectura del medidor
12 563 kWh
```

No:

```text
Consumo actual
12 563
```

---

# 115. Cobertura

Mostrar:

```text
Cobertura
71 %
```

solo cuando aporte información.

---

# 116. Cobertura 100 %

Podría aparecer de forma discreta.

---

# 117. Sin datos

Si no existen lecturas:

Dashboard debe mostrar principalmente:

```text
Aún no existen datos de consumo.

Registra la primera lectura del medidor para comenzar.
```

CTA:

```text
[ Registrar primera lectura ]
```

---

# 118. Tarjetas sin datos

Pueden mostrar:

```text
—
```

pero no llenar la pantalla de mensajes repetidos.

---

# 119. Primera lectura

Después de registrar:

```text
Última lectura
12 500
```

y mensaje:

```text
Necesitamos una segunda lectura para calcular el consumo.
```

---

# 120. No mostrar gráfico engañoso

Con una sola lectura:

```text
serie puede contener todos null
```

Mostrar estado vacío del gráfico:

```text
Todavía no hay suficiente información para mostrar consumo.
```

---

# 121. Segunda lectura

Si es consecutiva:

```text
aparece primer consumo conocido
```

---

# 122. Estado parcial

Cuando resumen contiene:

```text
estado = PARCIAL
```

usar componente/ayuda:

```text
Datos parciales
```

---

# 123. No usar texto técnico

No mostrar directamente:

```text
PARCIAL
SIN_DATOS
SIN_BASE
```

al usuario común salvo que sea adecuado.

---

# 124. Traducción UI

Ejemplos:

```text
COMPLETO
→ sin advertencia

PARCIAL
→ Datos parciales

SIN_DATOS
→ Sin información suficiente

SIN_LECTURA
→ Sin lectura

SIN_BASE
→ Consumo diario no disponible

NO_APLICA
→ Aún no aplica
```

---

# 125. Centralizar etiquetas

Crear:

```text
frontend/src/utils/consumption-state.js
```

o equivalente.

No repetir strings por múltiples componentes.

---

# 126. Formato de fechas

Utilizar:

```text
Intl.DateTimeFormat('es-EC')
```

---

# 127. Evitar librería de fechas si no hace falta

No instalar:

```text
moment
dayjs
date-fns
```

todavía.

---

# 128. Formato numérico

Utilizar:

```text
Intl.NumberFormat('es-EC')
```

---

# 129. Lecturas

```text
12563
```

puede presentarse:

```text
12.563
```

según locale.

---

# 130. No decimales de lectura

Opciones de format:

```text
maximumFractionDigits: 0
```

---

# 131. Consumo diario

También:

```text
8 kWh
```

sin decimales.

---

# 132. Promedio

Puede usar:

```text
maximumFractionDigits: 1
```

---

# 133. Cobertura

Puede presentarse:

```text
71 %
```

aunque API mande:

```text
71.43
```

---

# 134. Componentes previstos

```text
components/dashboard/
├── MetricCard.jsx
├── TodayReadingCard.jsx
├── ConsumptionChart.jsx
├── PeriodSelector.jsx
├── SecondaryMetric.jsx
├── DashboardSkeleton.jsx
└── DashboardEmptyState.jsx
```

---

# 135. Lecturas

```text
components/lecturas/
└── ReadingForm.jsx
```

---

# 136. UI reutilizable

Podremos usar componentes existentes o crear:

```text
Modal
Button
Input
Alert
```

solo si realmente se reutilizan.

---

# 137. No construir design system gigante

CHECKPOINT 8 debe centrarse en dashboard.

---

# 138. React state después del registro

Flujo:

```text
submit
↓
POST lectura
↓
success
↓
Promise.all:
    obtenerResumen()
    obtenerSerie(periodoActivo)
↓
render
```

---

# 139. Si una de las recargas falla

No asumir que el POST falló.

---

# 140. Ejemplo

POST:

```text
201
```

Resumen:

```text
200
```

Serie:

```text
500
```

Mostrar:

```text
Lectura registrada.
```

Tarjetas actualizadas.

Gráfico:

```text
No se pudo actualizar.
```

---

# 141. Error mutation vs error refresh

Son cosas diferentes.

---

# 142. No duplicar POST al reintentar GET

El botón:

```text
Reintentar gráfico
```

solo debe repetir el GET.

Nunca registrar nuevamente la lectura.

---

# 143. API error handling

Reutilizar:

```text
api-error.js
```

de CHECKPOINT 7.

---

# 144. Códigos específicos de lectura

Mapear al menos:

```text
LECTURA_FECHA_DUPLICADA
LECTURA_MENOR_QUE_ANTERIOR
LECTURA_MAYOR_QUE_SIGUIENTE
LECTURA_FECHA_FUTURA
MEDIDOR_...
```

---

# 145. Error inesperado

Fallback:

```text
No se pudo registrar la lectura.
```

---

# 146. Loading inicial

Mientras resumen y serie inicial cargan:

```text
DashboardSkeleton
```

---

# 147. No spinner gigante

Mantener estructura visual.

---

# 148. Error total de resumen

Si `/resumen` falla:

```text
No se pudo cargar el resumen de consumo.
[ Reintentar ]
```

---

# 149. La gráfica puede tener su propio error

Separado.

---

# 150. Sesión

Si API devuelve 401 y refresh funciona:

```text
dashboard continúa
```

sin mostrar error temporal.

---

# 151. Si refresh falla

CHECKPOINT 7 lleva al login.

Dashboard no implementa lógica propia de sesión.

---

# 152. No mezclar auth con dashboard

Dashboard consume:

```text
apiClient
```

y confía en la infraestructura común.

---

# 153. Tests API modules

Mock Axios/client y comprobar:

```text
obtenerResumen → GET /estadisticas/resumen
obtenerSerie('7d') → GET /estadisticas/serie?periodo=7d
registrarLectura → POST /lecturas
```

---

# 154. Tests MetricCard

Probar:

```text
valor normal
0
null
parcial
loading
```

---

# 155. Test crítico 0 vs null

Input:

```text
consumo = 0
```

Debe renderizar:

```text
0 kWh
```

Input:

```text
consumo = null
```

Debe renderizar:

```text
—
```

---

# 156. Test Dashboard sin lecturas

API devuelve:

```text
ultimaLectura = null
```

Esperado:

```text
estado vacío
botón Registrar primera lectura
```

---

# 157. Una lectura

Esperado:

```text
última lectura visible
mensaje segunda lectura necesaria
```

---

# 158. Datos completos

Mock resumen:

```text
ayer = 8
7d = 51
mes = 218
año = 2478
```

Todos visibles.

---

# 159. Parcial

Mock:

```text
ultimos7Dias.estado = PARCIAL
```

Debe aparecer:

```text
Datos parciales
```

o contexto equivalente.

---

# 160. Cobertura

Mock:

```text
71.43
```

UI:

```text
71 %
```

---

# 161. Test PeriodSelector

Inicial:

```text
7 días activo
```

Click Mes:

```text
obtenerSerie('mes')
```

---

# 162. Click Año

```text
obtenerSerie('anio')
```

---

# 163. No volver a pedir resumen

Cambiar solo período del gráfico no debería llamar nuevamente al resumen.

---

# 164. Test serie loading

Al cambiar:

```text
Mes
```

mostrar carga solamente en gráfica.

---

# 165. Test error gráfico

Resumen continúa visible.

---

# 166. Test gráfica conocida

Punto:

```text
consumo = 8
estado = CONOCIDO
```

debe ser representable como barra.

---

# 167. Test gráfica cero

```text
consumo = 0
```

debe conservarse como dato conocido.

---

# 168. Test SIN_LECTURA

No debe convertirse a 0.

---

# 169. Test SIN_BASE

No debe convertirse a barra del intervalo.

---

# 170. Test NO_APLICA anual

No debe aparecer como 0.

---

# 171. Test formulario primera lectura

Sin última lectura.

Usuario escribe:

```text
12500
```

API recibe:

```json
{
  "fechaLectura": "...",
  "valorLectura": 12500
}
```

---

# 172. Test decimal frontend

```text
12500.5
```

No llamar API.

Mostrar error.

---

# 173. Test negativo

No llamar API.

---

# 174. Test éxito

API `201`.

Debe:

```text
cerrar formulario
mostrar éxito
recargar resumen
recargar serie
```

---

# 175. Test duplicado

API:

```text
409 LECTURA_FECHA_DUPLICADA
```

Debe:

```text
mostrar mensaje
actualizar dashboard
```

porque posiblemente otro usuario la registró.

---

# 176. Test menor anterior

Mostrar mensaje correcto.

Mantener modal abierto.

---

# 177. Test red

Mantener valor.

---

# 178. Test submit doble

Mientras está loading:

```text
segundo click no genera otro POST
```

---

# 179. Accesibilidad formulario

Probar:

```text
label
botón
modal accesible
Escape
focus
```

cuando el componente Modal ya lo soporte.

---

# 180. Accesibilidad gráfica

Debe existir una descripción textual o alternativa.

---

# 181. Responsive mínimo

Dashboard debe ser usable en:

```text
375 px
```

aunque CHECKPOINT 11 hará el gate final.

---

# 182. Tarjetas

En pantalla estrecha:

```text
1 columna
```

o:

```text
2 columnas si son realmente legibles
```

---

# 183. Decisión inicial

Para simplicidad:

```text
móvil → 1 columna
tablet → 2 columnas
desktop → 4 columnas
```

---

# 184. Gráfico móvil

Debe ocupar:

```text
100 % del contenedor
```

sin overflow horizontal.

---

# 185. Recharts responsive

Utilizar:

```text
ResponsiveContainer
```

---

# 186. Altura

Usar una altura razonable.

No:

```text
800px
```

en móvil.

---

# 187. CSS

Crear estilos específicos:

```text
DashboardPage.module.css
MetricCard.module.css
ConsumptionChart.module.css
ReadingForm.module.css
```

o estructura equivalente.

---

# 188. Utilizar tokens

No hardcodear colores si existe:

```text
--color-accent
--color-surface
--color-text
--color-border
```

---

# 189. Modo oscuro

Todavía no completo.

Pero dashboard debe estar construido de forma que CHECKPOINT 10 pueda cambiar variables sin reescribir componentes.

---

# 190. No usar

```css
background: white;
color: black;
```

directamente en cada tarjeta.

---

# 191. Usuario ADMIN

Ve exactamente las mismas métricas eléctricas.

---

# 192. No dashboard ADMIN separado

No crear:

```text
/admin/dashboard
```

---

# 193. Registrar histórico desde dashboard

No.

El dashboard registra:

```text
hoy
```

---

# 194. ADMIN histórico

Llegará mediante flujo de historial en CHECKPOINT 9.

---

# 195. Corrección desde dashboard

Si lectura de hoy ya existe, podemos mostrar:

```text
Lectura registrada
```

pero no necesitamos implementar edición aquí todavía.

---

# 196. Decisión

Corrección se realizará desde:

```text
Historial
```

en CHECKPOINT 9.

Esto evita dos interfaces distintas para la misma operación.

---

# 197. Botón si hoy ya existe

Mostrar:

```text
Ver en historial
```

que navegue a:

```text
/historial
```

---

# 198. Esto mantiene dashboard simple

---

# 199. README

Actualizar sección frontend:

```text
## Dashboard
```

Documentar:

```text
tarjetas
gráficos
registro de hoy
```

---

# 200. No documentar datos ficticios

Solo comportamiento.

---

# 201. Smoke test real

Con backend real y usuario autenticado.

Caso:

```text
sin lecturas
```

Dashboard:

```text
estado vacío
```

---

# 202. Registrar primera

```text
12500
```

Resultado:

```text
última lectura 12500
sin consumo todavía
```

---

# 203. En un entorno de prueba con día siguiente

Registrar:

```text
12508
```

Resultado:

```text
primer consumo = 8
```

---

# 204. Dataset de prueba

Para comprobar dashboard rápidamente podemos usar base test con:

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

# 205. Esperado

```text
Ayer = 9
7 días = 48
Promedio ≈ 6.9
Mayor = 9
```

dependiendo de fechaReferencia y dataset exacto.

---

# 206. Verificar no hardcoding

Cambiar datos DB.

Dashboard debe cambiar.

---

# 207. Hueco

Eliminar/omitir lectura intermedia en base test.

Esperado:

```text
total acumulado correcto
gráfico con hueco
cobertura menor
```

---

# 208. Regresión backend

Desde backend:

```bash
npm run lint
npm test
```

PASS.

---

# 209. Frontend gate

Desde frontend:

```bash
npm run lint
npm test
npm run build
```

PASS.

---

# 210. Revisar consola

No:

```text
React warnings
Axios errors no tratados
tokens
passwords
```

---

# 211. Test coverage

Si ya tenemos cobertura frontend configurada, revisar especialmente:

```text
DashboardPage
MetricCard
ReadingForm
PeriodSelector
ConsumptionChart
```

---

# 212. No perseguir 100 %

Priorizar casos críticos.

---

# 213. Git

Desde raíz:

```bash
git status
```

Revisar que no aparezcan:

```text
.env
coverage
dist
node_modules
```

---

# 214. Commit

Después del gate:

```bash
git add .
git status
```

Revisar.

Luego:

```bash
git commit -m "feat: implementar dashboard de consumo"
```

---

# 215. Working tree

Esperado:

```text
nothing to commit, working tree clean
```

---

# 216. Gate CHECKPOINT 8

### CP8-001

Recharts instalado.

### CP8-002

Existe API de estadísticas frontend.

### CP8-003

Existe API de lecturas frontend.

### CP8-004

Dashboard consume resumen real.

### CP8-005

Dashboard consume serie real.

### CP8-006

Resumen y serie inicial cargan en paralelo.

### CP8-007

No se solicita `/lecturas/ultima` redundantemente.

### CP8-008

Existe tarjeta Ayer.

### CP8-009

Ayer conocido se muestra correctamente.

### CP8-010

Ayer cero se muestra como 0.

### CP8-011

Ayer null no se muestra como 0.

### CP8-012

Existe tarjeta 7 días.

### CP8-013

Existe tarjeta Mes.

### CP8-014

Existe tarjeta Año.

### CP8-015

Períodos parciales muestran contexto.

### CP8-016

Se muestra `fechaHasta` cuando corresponda.

### CP8-017

Existe cobertura diaria.

### CP8-018

Cobertura parcial no se trata como error.

### CP8-019

Existe última lectura.

### CP8-020

Última lectura no se confunde con consumo.

### CP8-021

Existe promedio diario.

### CP8-022

Promedio muestra días utilizados cuando faltan datos.

### CP8-023

Existe mayor consumo.

### CP8-024

Empates se representan correctamente.

### CP8-025

Existe estado de lectura de hoy.

### CP8-026

Lectura de hoy registrada se distingue.

### CP8-027

Lectura pendiente se distingue.

### CP8-028

Existe CTA Registrar lectura.

### CP8-029

Formulario utiliza fechaReferencia backend.

### CP8-030

Formulario no permite elegir fecha histórica.

### CP8-031

Input favorece teclado numérico.

### CP8-032

Decimal se rechaza en frontend.

### CP8-033

Negativo se rechaza.

### CP8-034

Backend continúa validando.

### CP8-035

Primera lectura puede registrarse.

### CP8-036

Registro normal funciona.

### CP8-037

Doble submit se evita.

### CP8-038

Éxito refresca resumen.

### CP8-039

Éxito refresca serie activa.

### CP8-040

React no recalcula estadísticas manualmente.

### CP8-041

Duplicado 409 se maneja.

### CP8-042

Duplicado refresca estado del dashboard.

### CP8-043

Lectura menor se maneja.

### CP8-044

Error de red conserva input.

### CP8-045

Existe gráfico de barras.

### CP8-046

Vista inicial es 7 días.

### CP8-047

Existe selector 7 días.

### CP8-048

Existe selector Mes.

### CP8-049

Existe selector Año.

### CP8-050

Cambiar período solo recarga serie.

### CP8-051

Serie 7 días muestra datos reales.

### CP8-052

Consumo null no se convierte a 0.

### CP8-053

Consumo cero se conserva.

### CP8-054

SIN_LECTURA se distingue.

### CP8-055

SIN_BASE se distingue.

### CP8-056

Intervalo SIN_BASE no se dibuja como barra diaria.

### CP8-057

NO_APLICA no se dibuja como cero.

### CP8-058

Tooltip conocido funciona.

### CP8-059

Tooltip cero funciona.

### CP8-060

Tooltip sin dato funciona.

### CP8-061

Serie anual usa meses.

### CP8-062

Gráfico utiliza ResponsiveContainer.

### CP8-063

Gráfico no produce overflow horizontal.

### CP8-064

Existe alternativa textual accesible al gráfico.

### CP8-065

Dashboard sin lecturas funciona.

### CP8-066

Dashboard con una lectura funciona.

### CP8-067

Dashboard con datos completos funciona.

### CP8-068

Dashboard con datos parciales funciona.

### CP8-069

Error de resumen se maneja.

### CP8-070

Error de gráfica no destruye las tarjetas.

### CP8-071

Reintentar gráfica no repite mutaciones.

### CP8-072

No existe dashboard ADMIN separado.

### CP8-073

ADMIN y USUARIO ven las mismas métricas.

### CP8-074

No hay métricas hardcodeadas.

### CP8-075

No se implementan costos.

### CP8-076

No se implementan predicciones.

### CP8-077

No se implementa comparación contra semana anterior.

### CP8-078

No se implementa corrección desde dashboard.

### CP8-079

Lectura ya registrada enlaza al historial.

### CP8-080

Tests 0 vs null pasan.

### CP8-081

Tests estado vacío pasan.

### CP8-082

Tests una lectura pasan.

### CP8-083

Tests tarjetas pasan.

### CP8-084

Tests períodos parciales pasan.

### CP8-085

Tests selector período pasan.

### CP8-086

Tests gráfico pasan.

### CP8-087

Tests formulario pasan.

### CP8-088

Tests duplicado pasan.

### CP8-089

Tests refresh posterior a registro pasan.

### CP8-090

Frontend lint pasa.

### CP8-091

Frontend tests pasan.

### CP8-092

Frontend build pasa.

### CP8-093

Backend regression pasa.

### CP8-094

No se registran tokens.

### CP8-095

No existen secretos versionados.

### CP8-096

Existe commit.

### CP8-097

Working tree limpio.

---

# 217. Estado de SPEC-007

Después del gate:

```text
SPEC-007
Dashboard principal
→ IMPLEMENTADA
→ PROBADA
```

Su cierre definitivo llegará tras:

```text
responsive final
accesibilidad final
E2E
```

---

# 218. Estado de SPEC-005

Ya tendremos:

```text
backend estadístico
+
representación frontend
```

Por tanto estará prácticamente completa a nivel funcional.

---

# 219. Estado de SPEC-004

El registro de lectura ya estará integrado en navegador para el caso principal:

```text
lectura de hoy
```

La corrección todavía llegará mediante Historial.

---

# 220. Estado roadmap

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
Historial y corrección
→ SIGUIENTE

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

# 221. Qué tendremos visible

Después de este checkpoint el usuario ya verá algo parecido a:

```text
┌─────────────────────────────────────────────┐
│ Dashboard                                   │
│                                             │
│ Lectura de hoy                 Registrada   │
│                                             │
│ Ayer      7 días      Septiembre     2026   │
│ 9 kWh     48 kWh      8 kWh          ...    │
│                                             │
│ Consumo          [7 días] [Mes] [Año]       │
│                                             │
│        █                                    │
│    █   █      █                             │
│ █  █   █  █   █                             │
│ ─────────────────                           │
│                                             │
│ Promedio      Mayor        Última lectura   │
│ 6.9 kWh       9 kWh        12.563           │
└─────────────────────────────────────────────┘
```

Pero todos los números vendrán realmente de PostgreSQL y del motor estadístico.

---

# 222. Siguiente checkpoint

El próximo será:

```text
CHECKPOINT 9
Historial, detalle y corrección de lecturas
```

Ahí implementaremos:

```text
GET /lecturas
GET /lecturas/:id
PATCH /lecturas/:id

tabla desktop
tarjetas móvil
filtros por fechas
paginación
lectura BASE
lecturas corregidas
intervalos incompletos
detalle
corregir lectura de hoy
ADMIN corregir histórico
ADMIN registrar histórico
actualización automática de consumos
```

Con eso quedará cerrada toda la experiencia relacionada con las mediciones.
