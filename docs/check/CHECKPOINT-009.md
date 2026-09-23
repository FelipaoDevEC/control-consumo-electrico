# CHECKPOINT 9 — Historial, detalle, corrección y registro histórico de lecturas

## 1. Objetivo

Implementar la experiencia completa de historial definida principalmente en `SPEC-006`, utilizando las APIs ya construidas en `CHECKPOINT 5`.

Al finalizar este checkpoint tendremos:

* historial real conectado al backend;
* filtros por rango de fechas;
* filtros rápidos;
* paginación;
* vista desktop;
* vista móvil;
* lectura base;
* consumo conocido;
* intervalos incompletos;
* lecturas corregidas;
* detalle de una lectura;
* lectura anterior;
* lectura siguiente;
* trazabilidad;
* corrección de lectura;
* permisos diferentes entre ADMIN y USUARIO;
* registro histórico por ADMIN;
* actualización automática después de cambios;
* pruebas frontend completas del módulo.

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
```

Backend disponible:

```text
POST   /api/lecturas
GET    /api/lecturas
GET    /api/lecturas/ultima
GET    /api/lecturas/:id
PATCH  /api/lecturas/:id
```

---

# 3. SPEC relacionadas

Principalmente:

```text
SPEC-004 → registro y corrección
SPEC-005 → consumo derivado
SPEC-006 → historial y trazabilidad
SPEC-008 → sistema visual
SPEC-010 → seguridad
SPEC-012 → pruebas
```

---

# 4. Arquitectura frontend

```text
HistorialPage
   │
   ├── lecturas.api.js
   │      ├── listarLecturas()
   │      ├── obtenerLectura()
   │      ├── corregirLectura()
   │      └── registrarLectura()
   │
   └── components/lecturas/
          ├── ReadingTable
          ├── ReadingCard
          ├── ReadingFilters
          ├── ReadingDetails
          ├── ReadingEditForm
          ├── HistoricalReadingForm
          └── ReadingStatus
```

---

# 5. Ampliar `lecturas.api.js`

Agregar:

```text
listarLecturas(params)
obtenerLectura(id)
corregirLectura(id, datos)
```

`registrarLectura()` ya existe desde CHECKPOINT 8.

---

# 6. Ruta

Frontend:

```text
/historial
```

requiere autenticación.

Disponible para:

```text
ADMIN
USUARIO
```

---

# 7. Pantalla principal

Estructura conceptual:

```text
Historial de lecturas

[ Este mes ▼ ] [ Desde ] [ Hasta ]

[ + Registrar histórico ] ← solo ADMIN

┌──────────┬──────────┬──────────┬─────────────┬────────────┐
│ Fecha    │ Lectura  │ Consumo  │ Registró    │ Estado     │
├──────────┼──────────┼──────────┼─────────────┼────────────┤
│ 01 Sep   │ 12.563   │ 8 kWh    │ Usuario     │ Normal     │
│ 31 Ago   │ 12.555   │ 9 kWh    │ Admin       │ Corregida  │
│ 30 Ago   │ 12.546   │ —        │ Usuario     │ Incompleta │
└──────────┴──────────┴──────────┴─────────────┴────────────┘

                ‹ 1 2 3 ›
```

---

# 8. Carga inicial

Al abrir `/historial`:

```text
GET /api/lecturas?pagina=1&limite=30
```

---

# 9. Estado local

HistorialPage necesitará aproximadamente:

```text
lecturas
paginacion
filtros
loading
error
detalleSeleccionado
modoEdicion
modoRegistroHistorico
```

---

# 10. No Context global

No necesitamos:

```text
HistorialContext
```

El estado pertenece principalmente a la página.

---

# 11. Orden

Backend ya devuelve:

```text
más reciente
↓
más antigua
```

Frontend no volverá a ordenar arbitrariamente.

---

# 12. Paginación

Valores:

```text
pagina
limite
```

Por defecto:

```text
pagina = 1
limite = 30
```

---

# 13. Navegación de páginas

Controles:

```text
Anterior
1
2
3
Siguiente
```

---

# 14. No mostrar cientos de números

Si existen muchas páginas, utilizar una paginación compacta.

Ejemplo:

```text
1 2 3 … 12
```

---

# 15. Cambiar filtro

Cuando cambia el rango:

```text
pagina vuelve a 1
```

---

# 16. Filtros rápidos

Ofrecer:

```text
Últimos 7 días
Este mes
Mes anterior
Este año
Personalizado
```

---

# 17. Filtros rápidos solo calculan fechas

Ejemplo:

```text
Este mes
↓
desde = primer día del mes
hasta = hoy
```

---

# 18. Backend sigue validando

Aunque el frontend construya correctamente el rango:

```text
desde <= hasta
```

el backend vuelve a validarlo.

---

# 19. Filtro personalizado

Campos:

```text
Desde
Hasta
```

---

# 20. Formato visual

La UI puede usar controles de fecha del navegador.

La API seguirá enviando:

```text
YYYY-MM-DD
```

---

# 21. Rango inválido frontend

Si:

```text
desde > hasta
```

no enviar petición.

Mostrar:

```text
La fecha inicial no puede ser posterior a la fecha final.
```

---

# 22. Backend 422

También debe manejarse si llega:

```text
LECTURA_RANGO_INVALIDO
```

---

# 23. Estado vacío global

Si no existen lecturas:

```text
Aún no hay lecturas registradas.
```

CTA:

```text
Registrar lectura
```

si corresponde.

---

# 24. Estado sin resultados por filtros

Si sí existen datos pero el filtro actual no encuentra nada:

```text
No hay lecturas en este período.
```

---

# 25. No confundir ambos estados

No mostrar:

```text
Aún no hay lecturas
```

si realmente solo el filtro está vacío.

---

# 26. Desktop

Crear:

```text
ReadingTable.jsx
```

Columnas:

```text
Fecha
Lectura
Consumo
Registrado por
Estado
Acciones
```

---

# 27. Lectura

Mostrar como entero formateado:

```text
12.563
```

según `es-EC`.

---

# 28. Consumo conocido

```text
8 kWh
```

---

# 29. Consumo cero

```text
0 kWh
```

---

# 30. Consumo desconocido

```text
—
```

con ayuda visual:

```text
Sin información diaria
```

---

# 31. Lectura base

Estado:

```text
Base
```

Consumo:

```text
—
```

Tooltip:

```text
Primera lectura registrada.
```

---

# 32. Corregida

Mostrar:

```text
Corregida
```

sin ocultar otros estados.

---

# 33. Una lectura puede tener dos atributos

Ejemplo:

```text
Corregida
+
Consumo incompleto
```

No reducir todo a un único badge.

---

# 34. Estado de consumo

Mapear:

```text
BASE
CONOCIDO
SIN_BASE_DIARIA
```

a etiquetas humanas.

---

# 35. `CONOCIDO`

Puede no necesitar badge visible.

---

# 36. `BASE`

Mostrar:

```text
Base
```

---

# 37. `SIN_BASE_DIARIA`

Mostrar:

```text
Dato incompleto
```

---

# 38. Intervalo

Si API devuelve:

```text
intervalo
```

la fila puede incluir un icono informativo.

Tooltip:

```text
15 kWh consumidos entre 28 y 30 Ago.
No se puede determinar el consumo diario.
```

---

# 39. Nunca mostrar

```text
15 kWh
```

en la columna de consumo diario de 30 Ago.

---

# 40. Acciones por fila

Principal:

```text
Ver
```

Y:

```text
Editar
```

solo si:

```text
puedeEditar = true
```

---

# 41. No recalcular permiso en frontend

Utilizar:

```text
puedeEditar
```

que entrega backend para UX.

---

# 42. Pero backend sigue validando

Si un usuario manipula la UI y llama PATCH:

```text
backend decide.
```

---

# 43. Vista móvil

Crear:

```text
ReadingCard.jsx
```

---

# 44. Ejemplo

```text
01 Sep 2026

Lectura
12.563

Consumo
8 kWh

Registrado por
Usuario Casa

[ Ver detalle ]
```

---

# 45. Corregida móvil

```text
31 Ago 2026       Corregida

Lectura
12.555

Consumo
9 kWh
```

---

# 46. Incompleta móvil

```text
30 Ago 2026       Dato incompleto

Lectura
12.546

Consumo
—

15 kWh entre 28–30 Ago
```

---

# 47. Cambio tabla/tarjetas

No renderizar simultáneamente ambas versiones de forma accesible si genera duplicación.

Podemos usar CSS responsive o render condicional apropiado.

---

# 48. CHECKPOINT 11 hará refinamiento final

Pero en este checkpoint ya debe ser usable.

---

# 49. Detalle de lectura

Al pulsar:

```text
Ver
```

consultar:

```text
GET /api/lecturas/:id
```

---

# 50. No depender solo de datos de la fila

El detalle necesita:

```text
lecturaAnterior
lecturaSiguiente
trazabilidad completa disponible
puedeEditar actualizado
```

---

# 51. Componente

Crear:

```text
ReadingDetails.jsx
```

---

# 52. Presentación conceptual

```text
Detalle de lectura

Fecha
31 Ago 2026

Lectura
12.555

Consumo
9 kWh

Registrado por
Usuario Casa
31 Ago 2026 · 19:42

Lectura anterior
30 Ago · 12.546

Lectura siguiente
1 Sep · 12.563
```

---

# 53. Si fue corregida

Agregar:

```text
Última corrección

Administrador
31 Ago 2026 · 20:17
```

---

# 54. No mostrar IDs

No necesitamos:

```text
idLectura
idUsuario
idMedidor
```

en UI.

---

# 55. Lectura base

Detalle:

```text
Consumo
No disponible

Esta es la lectura inicial del historial.
```

---

# 56. Intervalo incompleto

Detalle:

```text
Consumo diario
No disponible

Consumo del intervalo
15 kWh

Desde
28 Ago

Hasta
30 Ago
```

---

# 57. Botón Editar

Visible solamente si:

```text
puedeEditar
```

---

# 58. Corrección

Crear:

```text
ReadingEditForm.jsx
```

---

# 59. Entrada

Solo:

```text
valorLectura
```

---

# 60. Fecha no editable

Mostrar:

```text
Fecha
31 Ago 2026
```

como texto.

No input editable.

---

# 61. Contexto

Mostrar:

```text
Lectura anterior
Lectura actual
Lectura siguiente
```

cuando existan.

---

# 62. Ejemplo

```text
Anterior
12.540

Lectura actual
12.547

Siguiente
12.555

Nueva lectura
[ 12.549 ]
```

---

# 63. Ayuda

Si existen ambos límites:

```text
Valor permitido:
12.540 – 12.555
```

---

# 64. Frontend puede validar

```text
nuevo >= anterior
nuevo <= siguiente
```

como ayuda UX.

---

# 65. Backend vuelve a validar

Siempre.

---

# 66. Solo entero

Mismas reglas que registro.

---

# 67. No negativo

También.

---

# 68. Submit

```text
Guardar corrección
```

---

# 69. Request

```text
PATCH /api/lecturas/:id
```

Body:

```json
{
  "valorLectura": 12549
}
```

---

# 70. Loading

```text
Guardando...
```

Evitar submit doble.

---

# 71. Éxito

Mostrar:

```text
Lectura actualizada correctamente.
```

---

# 72. Después de corregir

Debemos volver a consultar:

```text
historial actual
detalle actual si sigue abierto
```

---

# 73. Además

Si dashboard mantiene datos en otra página, no es necesario actualizarlo estando fuera del dashboard.

Cuando el usuario vuelva a:

```text
/dashboard
```

esa página volverá a consultar datos según su estrategia.

---

# 74. No mantener cache global

Así evitamos invalidaciones complejas.

---

# 75. Corrección afecta fila siguiente

Muy importante.

Ejemplo:

```text
28 → 1000
29 → 1008
30 → 1015
```

corregir:

```text
29 → 1010
```

produce:

```text
29 → 10
30 → 5
```

---

# 76. Por eso

Después de PATCH:

```text
NO modificar solo la fila editada manualmente.
```

---

# 77. Correcto

```text
volver a cargar la página actual de historial
```

---

# 78. Incluso puede cambiar

```text
estado consumo
intervalos
```

de filas cercanas.

---

# 79. Error USUARIO histórico

Aunque botón no debería aparecer, si backend devuelve:

```text
LECTURA_CORRECCION_NO_PERMITIDA
```

mostrar:

```text
No tienes permiso para corregir esta lectura.
```

---

# 80. Error menor

```text
LECTURA_MENOR_QUE_ANTERIOR
```

mostrar límite.

---

# 81. Error mayor

```text
LECTURA_MAYOR_QUE_SIGUIENTE
```

mostrar límite.

---

# 82. Error concurrente

Supongamos que otro usuario corrigió mientras formulario estaba abierto.

Backend puede aceptar/rechazar según estado actual.

Frontend:

```text
muestra respuesta
↓
recarga detalle
```

---

# 83. No implementar versión optimista

No tenemos:

```text
revision
version
etag
```

en MVP.

---

# 84. ADMIN — registrar histórico

Este es el único flujo visual adicional del checkpoint.

---

# 85. Botón

Solo ADMIN verá:

```text
+ Registrar lectura histórica
```

---

# 86. USUARIO

No verá esta acción.

---

# 87. Backend sigue siendo autoridad

Aunque se fuerce petición:

```text
USUARIO → histórico
```

backend responde:

```text
403
```

---

# 88. Formulario histórico

Crear:

```text
HistoricalReadingForm.jsx
```

Campos:

```text
Fecha
Lectura
```

---

# 89. Fecha

ADMIN puede seleccionar:

```text
hoy
o pasado
```

Nunca futuro.

---

# 90. Límite máximo del input

Puede utilizar:

```text
fechaReferencia
```

como máximo visual.

---

# 91. ¿De dónde obtener fechaReferencia?

Podemos:

```text
usar una utilidad de fecha local
```

o realizar una consulta.

Pero no necesitamos llamar a estadísticas solo por esto.

---

# 92. Decisión

Utilizar una utilidad frontend configurada para:

```text
America/Guayaquil
```

como ayuda visual.

Backend sigue validando.

---

# 93. Mejor reutilización

Crear/usar:

```text
utils/date.js
```

introducido en CHECKPOINT 8.

---

# 94. Request

Mismo:

```text
POST /api/lecturas
```

---

# 95. Body

```json
{
  "fechaLectura": "2026-08-29",
  "valorLectura": 12547
}
```

---

# 96. Backend detecta ADMIN

No existe:

```text
POST /api/admin/lecturas
```

separado.

---

# 97. Motivo

La operación de negocio es la misma.

Solo cambia permiso contextual.

---

# 98. Antes de enviar

Frontend puede validar:

```text
fecha no futura
entero
>= 0
```

---

# 99. No puede conocer todos los vecinos sin consultar

Podríamos hacer un formulario sofisticado que busque:

```text
lectura anterior
lectura siguiente
```

antes del POST.

---

# 100. Decisión MVP

No añadiremos una API adicional solo para previsualizar vecinos.

Enviamos el valor y backend valida.

---

# 101. Error inferior/superior

Backend devolverá:

```text
lecturaAnterior
lecturaSiguiente
```

en detalles seguros cuando corresponda.

Frontend muestra esa ayuda.

---

# 102. Éxito histórico

Después:

```text
cerrar formulario
↓
volver a cargar historial
```

---

# 103. Efecto posible

Un intervalo previamente incompleto puede convertirse en días conocidos.

---

# 104. Ejemplo

Antes:

```text
28 → 1000
30 → 1015
```

Después ADMIN añade:

```text
29 → 1008
```

Historial cambia automáticamente:

```text
29 → 8
30 → 7
```

---

# 105. No recalcular manualmente

Siempre recargar desde backend.

---

# 106. Filtros rápidos y registro histórico

Si el ADMIN registra una fecha fuera del filtro actual:

```text
el registro no tiene que aparecer
```

porque el filtro sigue siendo válido.

---

# 107. Feedback

Mostrar:

```text
Lectura histórica registrada correctamente.
```

Aunque no aparezca en la vista actual.

---

# 108. Paginación después de mutación

Mantener página actual si sigue siendo válida.

---

# 109. Si página queda fuera de rango

Ejemplo raro:

```text
pagina 3
↓
datos cambian
↓
solo existen 2 páginas
```

Frontend debe ajustar a:

```text
última página válida
```

---

# 110. Carga

Mientras cambia página o filtro:

```text
mostrar skeleton de historial
```

o estado inline.

---

# 111. No bloquear navegación global

Solo contenido de historial.

---

# 112. Error de listado

```text
No se pudo cargar el historial.
```

Botón:

```text
Reintentar
```

---

# 113. Error de detalle

No destruir listado.

Mostrar en panel/modal:

```text
No se pudo cargar esta lectura.
```

---

# 114. Error de corrección

Mantener formulario abierto.

---

# 115. Estructura responsive

Desktop:

```text
tabla
```

Móvil:

```text
tarjetas
```

---

# 116. Breakpoint inicial

Podemos utilizar alrededor de:

```text
768 px
```

como transición inicial.

CHECKPOINT 11 podrá ajustarlo según contenido.

---

# 117. Acciones móvil

Evitar múltiples botones grandes.

Puede existir:

```text
Ver detalle
```

y dentro del detalle:

```text
Editar
```

si permitido.

---

# 118. Acciones desktop

Puede aparecer:

```text
Ver
Editar
```

de forma discreta.

---

# 119. No DELETE

Nunca mostrar:

```text
Eliminar
```

---

# 120. No “Duplicar”

Tampoco.

---

# 121. Estados visuales

Crear helper:

```text
reading-state.js
```

o reutilizar utilidades existentes.

---

# 122. Mapeos

```text
BASE
→ Lectura inicial

CONOCIDO
→ Normal / sin badge

SIN_BASE_DIARIA
→ Dato incompleto
```

---

# 123. Corrección separada

```text
fueCorregida = true
```

→:

```text
Corregida
```

---

# 124. No mezclar ambas fuentes

Una lectura puede ser:

```text
Dato incompleto
+
Corregida
```

---

# 125. Fechas

Utilizar:

```text
Intl.DateTimeFormat('es-EC')
```

---

# 126. Horas

En detalle:

```text
19:42
```

---

# 127. Formato de lectura

```text
Intl.NumberFormat('es-EC', {
  maximumFractionDigits: 0
})
```

---

# 128. No decimal

Nunca:

```text
12.555,00
```

para lectura.

---

# 129. Consumo

```text
8 kWh
```

---

# 130. Intervalos

Ejemplo:

```text
15 kWh entre 28 y 30 ago
```

---

# 131. Accesibilidad tabla

Usar:

```html
<table>
<thead>
<th>
<tbody>
```

reales.

---

# 132. No tabla con divs

Si estamos en desktop y semánticamente son datos tabulares, usar tabla.

---

# 133. Encabezados

```text
Fecha
Lectura
Consumo
Registrado por
Estado
Acciones
```

---

# 134. Accesibilidad tarjetas

Cada tarjeta debe tener estructura clara y nombre de fecha.

---

# 135. Modales

Detalle, edición y registro histórico pueden utilizar modales accesibles reutilizables.

---

# 136. Focus

Al abrir:

```text
focus entra
```

Al cerrar:

```text
focus vuelve al botón origen
```

---

# 137. Escape

Cierra cuando:

```text
no hay operación crítica en proceso
```

---

# 138. Durante submit

Podemos bloquear cierre accidental si está:

```text
Guardando...
```

para evitar confusión.

---

# 139. Confirmación de corrección

No necesitamos un segundo modal:

```text
¿Seguro?
```

Guardar corrección ya es una acción explícita.

---

# 140. Confirmación de registro histórico

Tampoco.

---

# 141. No sobrecargar UX

---

# 142. API query serialization

`listarLecturas()` debe construir query de forma segura.

Ejemplo:

```text
desde
hasta
pagina
limite
```

---

# 143. Axios params

Preferir:

```javascript
apiClient.get('/lecturas', {
  params
});
```

---

# 144. No concatenar manualmente URLs

Evitar:

```javascript
`/lecturas?desde=${desde}&...`
```

si Axios puede gestionar params.

---

# 145. Cancelación de requests

Si usuario cambia filtros rápidamente, puede ocurrir:

```text
request A
request B
request C
```

y A terminar después que C.

---

# 146. Riesgo

Mostrar datos de un filtro anterior.

---

# 147. Solución

Utilizar:

```text
AbortController
```

o un identificador de solicitud.

---

# 148. Decisión MVP

Utilizaremos:

```text
AbortController
```

si Axios actual soporta `signal`.

---

# 149. Flujo

Nuevo filtro:

```text
cancelar request anterior
↓
crear nueva request
```

---

# 150. No mostrar cancelación como error

Un request abortado porque cambió el filtro:

```text
no debe mostrar “No se pudo cargar”.
```

---

# 151. Esto también es educativo

Diferenciar:

```text
error real
vs
request cancelado
```

---

# 152. Debounce de búsqueda

No existe búsqueda textual en historial.

Por tanto no necesitamos debounce.

---

# 153. Filtros rápidos

Cambian inmediatamente.

---

# 154. Tests `lecturas.api.js`

Probar:

```text
listar con params
obtener detalle
corregir
registrar histórico
```

---

# 155. Test historial vacío

API:

```text
datos=[]
total=0
```

UI:

```text
Aún no hay lecturas
```

---

# 156. Test filtro vacío

Simular existencia previa o estado de filtro.

UI:

```text
No hay lecturas en este período.
```

---

# 157. Test fila normal

Debe mostrar:

```text
fecha
lectura
consumo
usuario
```

---

# 158. Test base

Debe mostrar:

```text
Lectura inicial
```

y no:

```text
0 kWh
```

---

# 159. Test cero

Debe mostrar:

```text
0 kWh
```

---

# 160. Test intervalo

Debe mostrar:

```text
consumo diario no disponible
```

y el intervalo separado.

---

# 161. Test corregida

Debe mostrar:

```text
Corregida
```

---

# 162. Test doble estado

```text
Corregida
+
Dato incompleto
```

ambos visibles.

---

# 163. Test permisos

### ADMIN

`puedeEditar=true`

→ botón Editar.

### USUARIO histórico

`puedeEditar=false`

→ no botón.

---

# 164. No derivar solo por rol

El frontend debe respetar:

```text
puedeEditar
```

porque un USUARIO sí puede editar hoy.

---

# 165. Test detalle

Click Ver:

```text
GET /lecturas/:id
```

y render esperado.

---

# 166. Test anterior/siguiente

Ambos visibles cuando existen.

---

# 167. Test primera lectura detalle

Anterior:

```text
null
```

No mostrar bloque vacío raro.

---

# 168. Test última lectura detalle

Siguiente:

```text
null
```

---

# 169. Test trazabilidad

Mostrar:

```text
registradoPor
registradoEn
```

---

# 170. Test corrección

Si:

```text
fueCorregida=true
```

mostrar:

```text
actualizadoPor
actualizadoEn
```

---

# 171. Test edición válida

Input:

```text
12549
```

API PATCH.

Después:

```text
recargar listado
```

---

# 172. Test edición afecta siguiente

Mock nuevo listado diferente.

UI debe usar respuesta recargada.

---

# 173. Test no modificación local parcial

Podemos comprobar que después de éxito se llama nuevamente:

```text
listarLecturas
```

---

# 174. Test decimal

No PATCH.

---

# 175. Test negativo

No PATCH.

---

# 176. Test menor vecino

Frontend puede advertir.

Si backend responde error igualmente, mensaje correcto.

---

# 177. Test superior vecino

Mismo.

---

# 178. Test 403

Formulario muestra:

```text
No tienes permiso...
```

y recarga detalle/listado si conviene.

---

# 179. Test concurrencia conceptual frontend

Detalle cargado:

```text
valor=1008
```

otro usuario corrige.

Usuario actual envía:

```text
1010
```

Backend responde según estado real.

Frontend nunca fuerza el valor local.

---

# 180. Test registro histórico visible solo ADMIN

ADMIN:

```text
botón visible
```

USUARIO:

```text
no visible
```

---

# 181. Test fecha futura histórico

Frontend no envía.

---

# 182. Test histórico éxito

POST:

```text
201
```

Cerrar modal.

Recargar listado.

Mostrar éxito.

---

# 183. Test histórico inferior

Backend:

```text
LECTURA_MENOR_QUE_ANTERIOR
```

Mostrar anterior.

---

# 184. Test histórico superior

Mostrar siguiente.

---

# 185. Test histórico duplicado

Backend:

```text
409
LECTURA_FECHA_DUPLICADA
```

Mostrar:

```text
Ya existe una lectura para esa fecha.
```

---

# 186. Test filtros

### Últimos 7 días

Envía rango correcto.

### Este mes

Rango correcto.

### Mes anterior

Rango correcto incluso cruzando año.

### Este año

01/01 → hoy.

---

# 187. Test diciembre/enero

Filtro mes anterior debe manejar:

```text
enero → diciembre año anterior
```

correctamente.

---

# 188. Esto debe estar en utilidad de fechas

No dentro de componente.

---

# 189. Test rango personalizado

Desde/hasta correctos.

---

# 190. Test rango inválido

No API.

---

# 191. Test paginación

Click siguiente:

```text
pagina=2
```

---

# 192. Filtro nuevo

Página vuelve:

```text
1
```

---

# 193. Test request cancelado

No mostrar error.

---

# 194. Test request real fallido

Mostrar error y botón Reintentar.

---

# 195. Test responsive básico

En viewport pequeño:

```text
tarjetas visibles
tabla no rompe layout
```

La prueba visual final será CHECKPOINT 11.

---

# 196. No implementar exportación

Todavía no:

```text
CSV
Excel
PDF
```

---

# 197. No implementar eliminación

No botón.

---

# 198. No implementar auditoría completa

No podremos mostrar:

```text
valor anterior 1
valor anterior 2
valor anterior 3
```

porque backend no lo almacena.

---

# 199. No inventar historial de cambios

Mostrar únicamente:

```text
registro original
última corrección
```

---

# 200. No administrar medidores

Historial sigue siendo del único medidor.

---

# 201. No selector de medidor

---

# 202. Dashboard después de corrección

Cuando el usuario vuelva a Dashboard:

```text
debe obtener datos frescos.
```

---

# 203. Si React Router mantiene Dashboard montado

Dependiendo de estructura, quizá no vuelva a pedir automáticamente.

---

# 204. Decisión

`DashboardPage` deberá recargar sus datos cada vez que se monte.

La navegación normal desmontará/montará páginas mediante rutas.

---

# 205. No introducir cache global

---

# 206. README

Actualizar:

```text
## Historial de lecturas
```

Explicar:

```text
filtros
paginación
corrección
registro histórico ADMIN
```

---

# 207. No decir que usuarios normales registran históricos

---

# 208. Smoke test manual — USUARIO

```text
1. login como USUARIO
2. abrir Historial
3. ver lecturas
4. filtrar
5. abrir detalle
6. editar lectura de hoy
7. intentar histórico
```

Esperado:

```text
histórico no editable
```

---

# 209. Smoke test manual — ADMIN

```text
1. login ADMIN
2. abrir Historial
3. registrar lectura histórica
4. abrir detalle
5. corregir histórico
6. comprobar recalculo de filas
```

---

# 210. Escenario crítico

Antes:

```text
28 → 1000
30 → 1015
```

UI:

```text
30 → Dato incompleto
15 kWh entre 28 y 30
```

ADMIN registra:

```text
29 → 1008
```

Después:

```text
29 → 8 kWh
30 → 7 kWh
```

sin reiniciar aplicación.

---

# 211. Segundo escenario crítico

Antes:

```text
28 → 1000
29 → 1008
30 → 1015
```

ADMIN corrige:

```text
29 → 1010
```

Después:

```text
29 → 10
30 → 5
```

---

# 212. Tercer escenario crítico

USUARIO intenta:

```text
editar 29
```

si hoy es 30.

No debe tener acción visible.

Si fuerza API:

```text
403
```

---

# 213. Backend regresión

Desde backend:

```bash
npm run lint
npm test
```

PASS.

---

# 214. Frontend gate

```bash
npm run lint
npm test
npm run build
```

PASS.

---

# 215. Revisar consola

No:

```text
warnings importantes
IDs incorrectos
tokens
passwords
errores Axios sin manejar
```

---

# 216. Revisar Network

Mutaciones correctas:

```text
POST /lecturas
PATCH /lecturas/:id
```

No duplicadas por dobles eventos.

---

# 217. Git status

Desde raíz:

```bash
git status
```

No deben aparecer:

```text
.env
coverage
dist
node_modules
```

---

# 218. Commit

Después del gate:

```bash
git add .
git status
```

Revisar.

Luego:

```bash
git commit -m "feat: implementar historial y correccion de lecturas"
```

---

# 219. Working tree

Esperado:

```text
nothing to commit, working tree clean
```

---

# 220. Gate CHECKPOINT 9

### CP9-001

Historial consume API real.

### CP9-002

Existe `listarLecturas`.

### CP9-003

Existe `obtenerLectura`.

### CP9-004

Existe `corregirLectura`.

### CP9-005

Existe paginación.

### CP9-006

Página inicial es 1.

### CP9-007

Límite inicial es 30.

### CP9-008

Cambiar filtro reinicia página.

### CP9-009

Existe filtro Últimos 7 días.

### CP9-010

Existe filtro Este mes.

### CP9-011

Existe filtro Mes anterior.

### CP9-012

Existe filtro Este año.

### CP9-013

Existe filtro personalizado.

### CP9-014

Rango inválido se detecta frontend.

### CP9-015

Backend sigue validando rango.

### CP9-016

Historial vacío se distingue.

### CP9-017

Filtro sin resultados se distingue.

### CP9-018

Desktop utiliza tabla semántica.

### CP9-019

Móvil utiliza tarjetas/filas adaptadas.

### CP9-020

Lectura entera se formatea correctamente.

### CP9-021

Consumo conocido se muestra.

### CP9-022

Consumo cero se muestra como 0.

### CP9-023

Consumo null no se muestra como 0.

### CP9-024

Lectura BASE se distingue.

### CP9-025

Intervalo incompleto se distingue.

### CP9-026

Intervalo no se muestra como consumo diario.

### CP9-027

Lectura corregida se distingue.

### CP9-028

Corregida e incompleta pueden coexistir.

### CP9-029

Existe detalle de lectura.

### CP9-030

Detalle obtiene datos reales por ID.

### CP9-031

Detalle muestra lectura anterior.

### CP9-032

Detalle muestra lectura siguiente.

### CP9-033

Detalle muestra creador.

### CP9-034

Detalle muestra fecha de registro.

### CP9-035

Detalle muestra última corrección.

### CP9-036

No se muestran IDs internos.

### CP9-037

`puedeEditar` controla la UX.

### CP9-038

Backend sigue controlando permiso real.

### CP9-039

Existe formulario de corrección.

### CP9-040

Fecha de lectura no es editable.

### CP9-041

Corrección acepta solo entero.

### CP9-042

Corrección no acepta negativo.

### CP9-043

Se muestran límites anterior/siguiente cuando existen.

### CP9-044

USUARIO puede corregir hoy.

### CP9-045

USUARIO no puede corregir histórico.

### CP9-046

ADMIN puede corregir histórico.

### CP9-047

PATCH exitoso recarga historial.

### CP9-048

PATCH exitoso no modifica solo una fila localmente.

### CP9-049

La fila siguiente refleja recalculo.

### CP9-050

Error inferior se muestra correctamente.

### CP9-051

Error superior se muestra correctamente.

### CP9-052

Error 403 se maneja.

### CP9-053

Error de red conserva formulario.

### CP9-054

Existe registro histórico para ADMIN.

### CP9-055

USUARIO no ve registro histórico.

### CP9-056

Registro histórico utiliza POST existente.

### CP9-057

No existe endpoint administrativo duplicado.

### CP9-058

Fecha futura histórica se bloquea frontend.

### CP9-059

Backend sigue bloqueando futuro.

### CP9-060

Registro histórico exitoso recarga historial.

### CP9-061

Histórico duplicado 409 se maneja.

### CP9-062

Histórico inferior se maneja.

### CP9-063

Histórico superior se maneja.

### CP9-064

Agregar lectura faltante corrige automáticamente intervalos.

### CP9-065

No se recalculan consumos manualmente en React.

### CP9-066

No existe DELETE visual.

### CP9-067

No existe exportación.

### CP9-068

No existe selector de medidor.

### CP9-069

No se inventa auditoría histórica completa.

### CP9-070

Requests de listado pueden cancelarse.

### CP9-071

Request cancelado no muestra error falso.

### CP9-072

Error real sí muestra Reintentar.

### CP9-073

No existe N+1 frontend de detalle por cada fila.

### CP9-074

Detalle se carga solo cuando usuario lo solicita.

### CP9-075

Fechas utilizan formato es-EC.

### CP9-076

Lecturas no muestran decimales.

### CP9-077

Modal/panel tiene foco correcto.

### CP9-078

Escape funciona cuando corresponde.

### CP9-079

Botones tienen nombres accesibles.

### CP9-080

Tests historial vacío pasan.

### CP9-081

Tests filtro vacío pasan.

### CP9-082

Tests BASE pasan.

### CP9-083

Tests 0 vs null pasan.

### CP9-084

Tests intervalos pasan.

### CP9-085

Tests corregida pasan.

### CP9-086

Tests detalle pasan.

### CP9-087

Tests permisos pasan.

### CP9-088

Tests edición pasan.

### CP9-089

Tests registro histórico pasan.

### CP9-090

Tests filtros pasan.

### CP9-091

Tests paginación pasan.

### CP9-092

Tests cancelación pasan.

### CP9-093

Frontend lint pasa.

### CP9-094

Frontend tests pasan.

### CP9-095

Frontend build pasa.

### CP9-096

Backend regression pasa.

### CP9-097

No existen secretos versionados.

### CP9-098

Existe commit.

### CP9-099

Working tree limpio.

---

# 221. Estado de SPEC-006

Después del gate tendremos:

```text
backend de historial
+
frontend de historial
+
detalle
+
trazabilidad
+
pruebas
```

Por tanto:

```text
SPEC-006
→ IMPLEMENTADA
→ PROBADA
```

Su cierre final dependerá del gate responsive/E2E.

---

# 222. Estado de SPEC-004

Ya tendremos en navegador:

```text
registro de hoy
registro histórico ADMIN
corrección de hoy
corrección histórica ADMIN
```

Por tanto:

```text
SPEC-004
→ IMPLEMENTADA
→ PROBADA
```

---

# 223. Estado del roadmap

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
→ CERRADO

CHECKPOINT 10
Perfil y temas
→ SIGUIENTE

CHECKPOINT 11
Responsive y accesibilidad
→ PENDIENTE

CHECKPOINT 12
E2E y cierre MVP
→ PENDIENTE
```

---

# 224. Qué tendremos al cerrar

El usuario podrá:

```text
login
↓
dashboard
↓
registrar lectura de hoy
↓
abrir historial
↓
ver detalle
↓
corregir lectura de hoy
```

---

# 225. ADMIN además podrá

```text
registrar histórico
corregir histórico
```

---

# 226. Y todo seguirá respetando

```text
una lectura por día
sin decimales
sin fechas futuras
secuencia no decreciente
sin consumos inventados
```

---

# 227. Siguiente checkpoint

El siguiente será:

```text
CHECKPOINT 10
Perfil, cambio de contraseña y sistema de temas
```

Ahí implementaremos:

```text
Perfil real
Cambiar contraseña
Cerrar sesiones
Tema SISTEMA
Tema CLARO
Tema OSCURO
ThemeContext
prefers-color-scheme
persistencia por usuario
preferencia local no sensible
evitar flash de tema
tokens CSS
tema claro
tema oscuro
```

Después solo quedarán:

```text
CHECKPOINT 11
Responsive + accesibilidad final

CHECKPOINT 12
Playwright + gates + cierre MVP
```

---

# 228. Criterio pedagógico

Un aprendiz deberá poder explicar:

1. ¿Por qué el historial no crea filas falsas para días sin lectura?
2. ¿Qué diferencia existe entre BASE y consumo cero?
3. ¿Cómo mostramos un intervalo incompleto?
4. ¿Por qué un intervalo no puede mostrarse como consumo diario?
5. ¿Por qué `puedeEditar` ayuda a la UI pero no protege la API?
6. ¿Por qué el detalle vuelve a consultar backend?
7. ¿Qué información de trazabilidad conserva el MVP?
8. ¿Qué información de auditoría NO conserva?
9. ¿Por qué la fecha de una lectura no se edita?
10. ¿Por qué una corrección obliga a recargar el listado?
11. ¿Cómo puede una corrección cambiar la fila siguiente?
12. ¿Por qué ADMIN registra históricos usando el mismo POST?
13. ¿Por qué no existe `/api/admin/lecturas`?
14. ¿Qué ocurre si ADMIN agrega una lectura dentro de un hueco?
15. ¿Por qué no recalculamos consumos en React?
16. ¿Por qué el historial usa tabla en desktop y tarjetas en móvil?
17. ¿Qué ocurre si cambian filtros mientras una petición sigue en curso?
18. ¿Qué problema resuelve AbortController?
19. ¿Por qué una cancelación no es un error real?
20. ¿Por qué todavía no implementamos exportación ni eliminación?

Cuando todos los `CP9-*` estén verdes:

```text
CHECKPOINT 9 → CERRADO
```
