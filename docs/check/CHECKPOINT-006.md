# CHECKPOINT 6 — Motor de estadísticas, períodos y series de consumo

## 1. Objetivo

Implementar completamente el motor estadístico definido principalmente en `SPEC-005` y requerido por `SPEC-007`.

Al finalizar este checkpoint tendremos:

* consumo de ayer;
* consumo acumulado de los últimos 7 días;
* consumo del mes actual;
* consumo del año actual;
* promedio diario reciente;
* mayor consumo;
* menor consumo;
* soporte de empates;
* cobertura diaria;
* detección de datos parciales;
* detección de ausencia de datos;
* series para gráfica de 7 días;
* series diarias para el mes;
* series mensuales para el año;
* tratamiento correcto de días sin lectura;
* tratamiento correcto de meses futuros;
* endpoints de estadísticas;
* pruebas unitarias, integración y API.

No crearemos tablas nuevas de estadísticas.

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
```

El backend ya debe ser capaz de almacenar correctamente:

```text
fechaLectura
valorLectura
```

y obtener:

```text
consumo diario
intervalos sin detalle diario
```

---

# 3. SPEC relacionadas

Principalmente:

```text
SPEC-005 → Motor de consumo y estadísticas
SPEC-007 → Dashboard
SPEC-010 → Seguridad
SPEC-012 → Pruebas
```

También reutilizaremos reglas de:

```text
SPEC-004
SPEC-006
```

---

# 4. Principio fundamental

El motor nunca debe confundir:

```text
consumo acumulado de un período
```

con:

```text
suma de los consumos diarios conocidos
```

cuando existen huecos.

---

# 5. Ejemplo crítico

Tenemos:

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

Consumos diarios conocidos:

```text
24 → 5
25 → 7
26 → null
27 → null
28 → 6
29 → 9
30 → 7
```

Suma de los conocidos:

```text
5 + 7 + 6 + 9 + 7 = 34
```

Pero el consumo acumulado real entre 23 y 30 es:

```text
1048 - 1000 = 48 kWh
```

Por tanto:

```text
34 kWh ≠ total real del período
```

---

# 6. Regla CP6-EST-001

Cuando existan lecturas de borde suficientes, el total del período se obtendrá mediante:

```text
lecturaFinal - lecturaBase
```

y no mediante la suma de días conocidos.

---

# 7. Fuente de verdad

Continúa siendo exclusivamente:

```text
lecturas_medidor
```

No crearemos:

```text
consumos
estadisticas
estadisticas_diarias
estadisticas_mensuales
resumen_dashboard
```

---

# 8. Arquitectura

```text
Cliente
  │
  ▼
/api/estadisticas
  │
  ▼
autenticar
  │
  ▼
estadisticasController
  │
  ▼
estadisticasService
  │
  ▼
estadisticasRepository
  │
  ▼
PostgreSQL
```

---

# 9. Archivos principales

Crear:

```text
backend/src/controllers/
└── estadisticas.controller.js

backend/src/services/
└── estadisticas.service.js

backend/src/repositories/
└── estadisticas.repository.js

backend/src/routes/
└── estadisticas.routes.js

backend/src/validators/
└── estadisticas.validators.js
```

Podremos reutilizar:

```text
utils/date.js
medidores.repository.js
```

---

# 10. Endpoints

Implementaremos:

```http
GET /api/estadisticas/resumen
GET /api/estadisticas/serie
```

Ambos requieren:

```text
autenticar
```

Tanto:

```text
ADMIN
USUARIO
```

pueden consultarlos.

---

# 11. No existe restricción por usuario

Los dos usuarios ven el mismo consumo porque:

```text
existe un único medidor compartido
```

No filtraremos estadísticas según:

```text
idUsuarioRegistro
```

---

# 12. Medidor

El motor utilizará el mismo mecanismo de CHECKPOINT 5 para obtener:

```text
exactamente un medidor activo
```

---

# 13. No hardcodear

Nunca:

```javascript
const idMedidor = 1;
```

---

# 14. Fecha de referencia

Todas las estadísticas se calcularán respecto a:

```text
fechaReferencia
```

Por defecto:

```text
hoy
```

según:

```text
APP_TIMEZONE=America/Guayaquil
```

---

# 15. Ejemplo

Si hoy es:

```text
2026-09-01
```

entonces:

```text
ayer = 2026-08-31
```

y los últimos 7 días son:

```text
2026-08-26
2026-08-27
2026-08-28
2026-08-29
2026-08-30
2026-08-31
2026-09-01
```

---

# 16. Testing de fechas

Para pruebas debemos poder controlar:

```text
fechaReferencia
```

sin depender siempre del reloj real.

---

# 17. No exponer fecha arbitraria en producción

No necesitamos inicialmente:

```http
GET /estadisticas/resumen?fechaReferencia=...
```

para el usuario real.

La posibilidad de controlar la fecha puede resolverse mediante:

```text
inyección de reloj
utilidad mockeable
```

en tests.

---

# 18. Utilidad de períodos

Podremos ampliar:

```text
utils/date.js
```

con funciones como:

```text
obtenerFechaActual()
restarDias()
primerDiaMes()
ultimoDiaMes()
primerDiaAnio()
ultimoDiaAnio()
diferenciaDiasCalendario()
```

---

# 19. Evitar lógica duplicada

No queremos:

```text
controller calcula fechas
service calcula otras
repository calcula otras
```

Las reglas temporales deben estar centralizadas.

---

# 20. Estados de período

Las tarjetas utilizarán:

```text
COMPLETO
PARCIAL
SIN_DATOS
```

---

# 21. Qué significa COMPLETO

Para esta aplicación:

```text
COMPLETO
```

significa que conocemos correctamente el consumo acumulado del **rango efectivamente evaluado**.

No significa necesariamente que:

```text
el mes haya terminado
```

o:

```text
el año haya terminado.
```

---

# 22. Ejemplo de mes en curso

Hoy:

```text
01/09/2026
```

Tenemos:

```text
31/08 → 2000
01/09 → 2008
```

Podemos conocer correctamente el consumo:

```text
01/09 = 8 kWh
```

Por tanto el rango:

```text
01/09 → 01/09
```

tiene información completa.

Pero septiembre continúa:

```text
EN CURSO
```

---

# 23. Campo adicional

Para evitar confusión, el backend podrá indicar:

```text
esPeriodoEnCurso
```

Ejemplo:

```json
{
  "estado": "COMPLETO",
  "esPeriodoEnCurso": true
}
```

---

# 24. PARCIAL

Significa que no tenemos el borde inicial exacto requerido para representar todo el período solicitado.

---

# 25. Ejemplo

Queremos septiembre desde:

```text
01/09
```

pero la primera lectura disponible es:

```text
05/09 → 2100
```

y última:

```text
10/09 → 2145
```

Podemos afirmar:

```text
45 kWh observados entre 05/09 y 10/09
```

pero no:

```text
septiembre lleva 45 kWh
```

sin contexto.

---

# 26. SIN_DATOS

Cuando no existan al menos dos puntos útiles para determinar consumo.

---

# 27. Ejemplo

Solo existe:

```text
10/09 → 2145
```

Resultado:

```text
SIN_DATOS
```

---

# 28. Última lectura

El resumen incluirá:

```text
ultimaLectura
```

---

# 29. Sin lecturas

```json
{
  "ultimaLectura": null
}
```

---

# 30. Con lectura

```json
{
  "ultimaLectura": {
    "fecha": "2026-09-01",
    "valor": 2008
  }
}
```

---

# 31. Lectura de hoy

El resumen incluirá:

```text
lecturaHoy.registrada
```

---

# 32. Ejemplo

```json
{
  "lecturaHoy": {
    "registrada": true
  }
}
```

o:

```json
{
  "lecturaHoy": {
    "registrada": false
  }
}
```

---

# 33. Consumo de ayer

Para calcular:

```text
ayer
```

necesitamos lectura de:

```text
anteayer
+
ayer
```

---

# 34. Ejemplo

Hoy:

```text
01/09
```

Lecturas:

```text
30/08 → 1000
31/08 → 1008
```

Resultado:

```text
ayer = 8 kWh
```

---

# 35. No necesitamos lectura de hoy

Para conocer el consumo de ayer:

```text
NO necesitamos 01/09
```

Esto es importante.

---

# 36. Ayer conocido

Respuesta:

```json
{
  "consumo": 8,
  "estado": "COMPLETO",
  "fecha": "2026-08-31"
}
```

---

# 37. Falta anteayer

Existe:

```text
31/08 → 1008
```

pero no:

```text
30/08
```

Resultado:

```json
{
  "consumo": null,
  "estado": "SIN_DATOS",
  "fecha": "2026-08-31"
}
```

---

# 38. Falta ayer

Igual:

```text
consumo = null
```

---

# 39. Cero real ayer

```text
30/08 → 1000
31/08 → 1000
```

Resultado:

```text
ayer = 0 kWh
```

---

# 40. Últimos 7 días

El rango siempre representa:

```text
fechaReferencia - 6 días
```

hasta:

```text
fechaReferencia
```

---

# 41. Ejemplo

Referencia:

```text
01/09
```

Rango:

```text
26/08 → 01/09
```

---

# 42. Lectura base ideal

Necesitamos:

```text
25/08
```

como lectura base exacta.

---

# 43. Lectura final ideal

Para conocer todo el rango hasta hoy necesitamos:

```text
01/09
```

---

# 44. Caso completo

Existe:

```text
25/08 → 1000
01/09 → 1050
```

Resultado acumulado:

```text
50 kWh
```

aunque existan huecos internos.

---

# 45. Cobertura diaria

Si solo conocemos 5 de los 7 consumos diarios:

```text
coberturaDiaria = 5 / 7
```

---

# 46. Por tanto puede coexistir

```text
consumo acumulado = 50 kWh
estado total = COMPLETO
cobertura diaria = 71 %
```

---

# 47. Esto NO es contradicción

Significa:

> conocemos cuánto avanzó el medidor durante todo el rango, pero no sabemos repartir ese consumo exactamente entre todos los días.

---

# 48. Falta lectura de hoy

Rango solicitado:

```text
26/08 → 01/09
```

pero última lectura:

```text
31/08
```

---

# 49. No afirmar

```text
últimos 7 días completos
```

hasta 01/09.

---

# 50. Respuesta

Podemos tener:

```json
{
  "estado": "PARCIAL",
  "consumo": 44,
  "desdeObservado": "2026-08-26",
  "hastaObservado": "2026-08-31"
}
```

si existen bordes adecuados para ese intervalo observado.

---

# 51. Regla estricta

La tarjeta deberá incluir:

```text
fechaHasta
```

cuando el último día real del dato sea anterior a la fecha de referencia.

---

# 52. Mes actual

Ejemplo actual:

```text
septiembre 2026
```

Rango lógico:

```text
01/09 → fechaReferencia
```

---

# 53. Lectura base ideal

Para comenzar el consumo del:

```text
01/09
```

necesitamos:

```text
31/08
```

---

# 54. Última fecha utilizada

Será:

```text
última lectura disponible
<= fechaReferencia
dentro del mes
```

---

# 55. Ejemplo

Tenemos:

```text
31/08 → 2000
01/09 → 2008
```

Resultado:

```text
septiembre hasta 01/09 = 8 kWh
```

---

# 56. Si hoy aún no tiene lectura

Supongamos referencia:

```text
10/09
```

última lectura:

```text
09/09
```

Entonces:

```text
fechaHasta = 09/09
```

---

# 57. No inventar día 10

La tarjeta podrá decir:

```text
Consumo septiembre
72 kWh
Hasta 9 Sep
```

---

# 58. Mes parcial por inicio tardío

No existe:

```text
31/08
```

Primera lectura:

```text
05/09 → 2100
```

Última:

```text
09/09 → 2135
```

Resultado:

```text
PARCIAL
35 kWh observados
desde 5 Sep
hasta 9 Sep
```

---

# 59. Año actual

Rango:

```text
01/01 → fechaReferencia
```

---

# 60. Lectura base ideal

Necesitamos:

```text
31/12 del año anterior
```

---

# 61. Ejemplo completo observado

```text
31/12/2025 → 10000
01/09/2026 → 12470
```

Resultado:

```text
2026 hasta 01/09
2470 kWh
```

---

# 62. Primer año de uso

Si la app empieza:

```text
15/08/2026
```

no podremos afirmar consumo completo de 2026.

---

# 63. Resultado

```text
PARCIAL
Desde 15 Ago
```

---

# 64. Consumo promedio

El promedio principal del dashboard será:

```text
promedio diario últimos 7 días
```

---

# 65. Solo consumos conocidos

Si:

```text
5
7
null
null
6
9
7
```

entonces:

```text
suma = 34
dias utilizados = 5
promedio = 6.8
```

---

# 66. No usar total acumulado

No calcular:

```text
48 / 7
```

como “promedio diario conocido” cuando existen huecos.

Eso sería una estimación.

---

# 67. Dos conceptos posibles

Podrían existir:

```text
promedio observado de días conocidos
promedio del intervalo
```

Durante el MVP solo mostraremos:

```text
promedio de días conocidos
```

---

# 68. Respuesta

```json
{
  "valor": 6.8,
  "diasUtilizados": 5,
  "diasEsperados": 7
}
```

---

# 69. Sin días conocidos

Resultado:

```json
{
  "valor": null,
  "diasUtilizados": 0,
  "diasEsperados": 7
}
```

---

# 70. Mayor consumo

Se calcula entre:

```text
consumos diarios conocidos
```

de la ventana de últimos 7 días.

---

# 71. Ejemplo

```text
5
7
6
9
7
```

Resultado:

```text
9 kWh
```

---

# 72. Fecha

También:

```text
29/08
```

---

# 73. Empate máximo

```text
27/08 → 9
29/08 → 9
```

Respuesta:

```json
{
  "valor": 9,
  "fechas": [
    "2026-08-27",
    "2026-08-29"
  ]
}
```

---

# 74. Menor consumo

Misma regla.

---

# 75. Cero participa

Si:

```text
0
5
7
```

mínimo:

```text
0
```

---

# 76. Null no participa

```text
null
5
7
```

mínimo:

```text
5
```

---

# 77. Cobertura diaria

Para ventana de 7 días:

```text
diasEsperados = 7
```

---

# 78. Días conocidos

Son aquellos cuya serie tenga:

```text
estado = CONOCIDO
```

---

# 79. Fórmula

```text
porcentaje =
diasConConsumo / diasEsperados * 100
```

---

# 80. Redondeo

Para API podemos devolver:

```text
71.43
```

o un entero.

---

# 81. Decisión

La API devolverá:

```text
porcentaje con hasta 2 decimales
```

Ejemplo:

```text
71.43
```

React decidirá mostrar:

```text
71 %
```

---

# 82. No redondear demasiado pronto

Los cálculos internos mantendrán precisión suficiente.

---

# 83. Serie 7 días

Endpoint:

```http
GET /api/estadisticas/serie?periodo=7d
```

---

# 84. Debe devolver exactamente 7 puntos

Aunque no existan lecturas.

---

# 85. Ejemplo vacío

```json
{
  "periodo": "7d",
  "desde": "2026-08-26",
  "hasta": "2026-09-01",
  "datos": [
    {
      "fecha": "2026-08-26",
      "consumo": null,
      "estado": "SIN_LECTURA"
    }
  ]
}
```

Hasta completar las siete fechas.

---

# 86. Estados de puntos diarios

Usaremos:

```text
CONOCIDO
SIN_LECTURA
SIN_BASE
```

---

# 87. CONOCIDO

Existe lectura:

```text
día anterior
+
día actual
```

---

# 88. SIN_LECTURA

No existe lectura en la propia fecha.

---

# 89. SIN_BASE

Existe lectura de la fecha, pero no existe lectura exactamente el día anterior.

---

# 90. Primera lectura absoluta

En una serie puede considerarse:

```text
SIN_BASE
```

porque desde perspectiva del gráfico no hay base diaria.

En historial continúa utilizándose:

```text
BASE
```

para identificar la primera lectura del sistema.

---

# 91. Intervalo en SIN_BASE

Si existe una lectura anterior más antigua, devolver:

```text
intervalo
```

---

# 92. Ejemplo

```json
{
  "fecha": "2026-08-30",
  "consumo": null,
  "estado": "SIN_BASE",
  "intervalo": {
    "desde": "2026-08-28",
    "hasta": "2026-08-30",
    "dias": 2,
    "consumo": 15
  }
}
```

---

# 93. Si no existe ninguna lectura anterior

```text
intervalo = null
```

---

# 94. Generación de fechas

PostgreSQL permite:

```sql
generate_series()
```

---

# 95. Ejemplo conceptual

```sql
SELECT generate_series(
    $1::date,
    $2::date,
    INTERVAL '1 day'
)::date AS fecha;
```

---

# 96. Beneficio

Aunque falte un día en:

```text
lecturas_medidor
```

la serie continúa teniendo:

```text
7 posiciones
```

---

# 97. JOIN

Relacionamos fechas generadas con:

```text
lecturas_medidor
```

---

# 98. Contexto anterior

Debemos conservar lecturas anteriores para:

```text
LAG
```

o utilizar subconsultas apropiadas.

---

# 99. No cometer error de CHECKPOINT 5

Nunca:

```text
filtrar rango
↓
LAG
```

si eso elimina la lectura base necesaria.

---

# 100. Serie del mes

Endpoint:

```http
GET /api/estadisticas/serie?periodo=mes
```

---

# 101. Rango

Desde:

```text
primer día del mes
```

hasta:

```text
fechaReferencia
```

---

# 102. No incluir días futuros

Si hoy:

```text
01/09
```

no devolveremos:

```text
02/09
03/09
...
30/09
```

como ceros.

---

# 103. Cada punto

```text
1 día
```

---

# 104. Mismos estados

```text
CONOCIDO
SIN_LECTURA
SIN_BASE
```

---

# 105. Serie anual

Endpoint:

```http
GET /api/estadisticas/serie?periodo=anio
```

---

# 106. Cada punto

Representará:

```text
1 mes
```

---

# 107. Meses

Podrá devolver 12 posiciones:

```text
1
2
3
...
12
```

---

# 108. Meses futuros

Estado:

```text
NO_APLICA
```

---

# 109. Ejemplo

Hoy:

```text
septiembre
```

Octubre:

```json
{
  "mes": 10,
  "consumo": null,
  "estado": "NO_APLICA"
}
```

---

# 110. Enero–agosto

Pueden ser:

```text
COMPLETO
PARCIAL
SIN_DATOS
```

---

# 111. Septiembre

Como mes actual:

```text
COMPLETO
```

para su rango evaluado si tiene bordes adecuados,

o:

```text
PARCIAL
SIN_DATOS
```

según información.

Además:

```text
esPeriodoEnCurso = true
```

---

# 112. Total mensual histórico

Para agosto completo:

Necesitamos idealmente:

```text
31/07
31/08
```

---

# 113. Fórmula

```text
lectura31Ago - lectura31Jul
```

---

# 114. Huecos internos

No impiden conocer:

```text
total acumulado del mes
```

si ambos bordes están disponibles.

---

# 115. Pero sí afectan

```text
detalle diario
```

---

# 116. Mes parcial

Si falta:

```text
31/07
```

pero tenemos:

```text
05/08
31/08
```

resultado:

```text
PARCIAL
```

---

# 117. Enero

Para calcular enero necesitamos:

```text
31/12 año anterior
```

---

# 118. No usar primera lectura arbitraria como si fuera base del mes

Si enero empieza con lectura:

```text
03/01
```

el mes queda:

```text
PARCIAL
```

---

# 119. Repository de estadísticas

Operaciones conceptuales:

```text
obtenerLecturaEnFecha
obtenerUltimaLecturaHasta
obtenerPrimeraLecturaDesde
obtenerConsumoDiarioFecha
obtenerSerieDiaria
obtenerResumenPeriodo
obtenerSerieMensualAnio
```

---

# 120. No construir 50 consultas pequeñas

Debemos evitar:

```text
7 consultas para 7 días
+
31 consultas para mes
+
12 consultas para año
```

---

# 121. Preferir consultas por conjunto

PostgreSQL está diseñado para trabajar con:

```text
sets
```

---

# 122. Ejemplo

Una sola consulta puede producir:

```text
toda la serie 7d
```

---

# 123. Otra consulta

Puede producir:

```text
12 meses del año
```

---

# 124. No sobreoptimizar

Tampoco necesitamos convertir todo el dashboard en una consulta SQL monstruosa.

---

# 125. Separación razonable

El resumen puede realizar algunas consultas independientes claras:

```text
última lectura
serie 7 días
período mes
período año
```

---

# 126. Objetivo

Priorizar:

```text
correctitud
legibilidad
tests
```

sobre microoptimización.

---

# 127. Servicio de estadísticas

Será responsable de:

```text
armar rangos
interpretar resultados
clasificar estados
calcular promedio
calcular máximo
calcular mínimo
calcular cobertura
construir contrato API
```

---

# 128. Repositorio

Será responsable de:

```text
SQL
datos crudos
```

---

# 129. No meter presentación en backend

No devolver:

```text
"6,8 kWh"
"1 de septiembre"
```

---

# 130. Devolver datos

```json
{
  "valor": 6.8
}
```

React añadirá:

```text
kWh
```

y formato regional.

---

# 131. Endpoint resumen

```http
GET /api/estadisticas/resumen
```

---

# 132. Contrato completo recomendado

```json
{
  "fechaReferencia": "2026-09-01",

  "lecturaHoy": {
    "registrada": true
  },

  "ultimaLectura": {
    "fecha": "2026-09-01",
    "valor": 12563
  },

  "ayer": {
    "fecha": "2026-08-31",
    "consumo": 8,
    "estado": "COMPLETO"
  },

  "ultimos7Dias": {
    "consumo": 51,
    "estado": "COMPLETO",
    "desde": "2026-08-26",
    "fechaHasta": "2026-09-01",
    "diasEsperados": 7,
    "diasConConsumo": 7,
    "diasSinDato": 0,
    "coberturaDiaria": 100
  },

  "mesActual": {
    "consumo": 8,
    "estado": "COMPLETO",
    "desde": "2026-09-01",
    "fechaHasta": "2026-09-01",
    "esPeriodoEnCurso": true
  },

  "anioActual": {
    "consumo": 2478,
    "estado": "COMPLETO",
    "desde": "2026-01-01",
    "fechaHasta": "2026-09-01",
    "esPeriodoEnCurso": true
  },

  "promedio7Dias": {
    "valor": 7.3,
    "diasUtilizados": 7,
    "diasEsperados": 7
  },

  "mayorConsumo7Dias": {
    "valor": 11,
    "fechas": [
      "2026-08-29"
    ]
  },

  "menorConsumo7Dias": {
    "valor": 5,
    "fechas": [
      "2026-08-27"
    ]
  }
}
```

---

# 133. Período parcial

Ejemplo:

```json
{
  "mesActual": {
    "consumo": 35,
    "estado": "PARCIAL",
    "desdeObservado": "2026-09-05",
    "fechaHasta": "2026-09-09",
    "esPeriodoEnCurso": true
  }
}
```

---

# 134. Sin datos

```json
{
  "mesActual": {
    "consumo": null,
    "estado": "SIN_DATOS",
    "fechaHasta": null,
    "esPeriodoEnCurso": true
  }
}
```

---

# 135. Dashboard sin lecturas

Resumen debe funcionar.

No error 500.

---

# 136. Ejemplo

```json
{
  "fechaReferencia": "2026-09-01",

  "lecturaHoy": {
    "registrada": false
  },

  "ultimaLectura": null,

  "ayer": {
    "fecha": "2026-08-31",
    "consumo": null,
    "estado": "SIN_DATOS"
  },

  "ultimos7Dias": {
    "consumo": null,
    "estado": "SIN_DATOS",
    "diasEsperados": 7,
    "diasConConsumo": 0,
    "diasSinDato": 7,
    "coberturaDiaria": 0
  },

  "mesActual": {
    "consumo": null,
    "estado": "SIN_DATOS",
    "esPeriodoEnCurso": true
  },

  "anioActual": {
    "consumo": null,
    "estado": "SIN_DATOS",
    "esPeriodoEnCurso": true
  },

  "promedio7Dias": {
    "valor": null,
    "diasUtilizados": 0,
    "diasEsperados": 7
  },

  "mayorConsumo7Dias": null,
  "menorConsumo7Dias": null
}
```

---

# 137. Una lectura

Última lectura existe.

Todo consumo:

```text
null
```

hasta tener dos puntos adecuados.

---

# 138. Endpoint serie

```http
GET /api/estadisticas/serie?periodo=7d
```

---

# 139. Validator

Valores permitidos:

```text
7d
mes
anio
```

---

# 140. Sin `periodo`

Podemos definir:

```text
7d
```

como valor por defecto.

---

# 141. Decisión

Sí:

```text
periodo=7d
```

será el default.

---

# 142. Período inválido

```text
422
VALIDACION_DATOS_INVALIDOS
```

No necesitamos un código adicional específico.

---

# 143. Respuesta 7d

```json
{
  "periodo": "7d",
  "desde": "2026-08-26",
  "hasta": "2026-09-01",

  "datos": [
    {
      "fecha": "2026-08-26",
      "consumo": 5,
      "estado": "CONOCIDO",
      "intervalo": null
    }
  ]
}
```

---

# 144. Debe contener 7 elementos

Siempre.

---

# 145. Respuesta mes

```json
{
  "periodo": "mes",
  "desde": "2026-09-01",
  "hasta": "2026-09-01",
  "datos": [
    {
      "fecha": "2026-09-01",
      "consumo": 8,
      "estado": "CONOCIDO"
    }
  ]
}
```

---

# 146. Respuesta año

```json
{
  "periodo": "anio",
  "anio": 2026,

  "datos": [
    {
      "mes": 1,
      "consumo": 210,
      "estado": "COMPLETO",
      "esPeriodoEnCurso": false
    },
    {
      "mes": 9,
      "consumo": 8,
      "estado": "COMPLETO",
      "esPeriodoEnCurso": true
    },
    {
      "mes": 10,
      "consumo": null,
      "estado": "NO_APLICA",
      "esPeriodoEnCurso": false
    }
  ]
}
```

---

# 147. Estados de serie anual

```text
COMPLETO
PARCIAL
SIN_DATOS
NO_APLICA
```

---

# 148. Mes futuro

Nunca:

```text
0 kWh
```

si todavía no ocurrió.

Debe ser:

```text
NO_APLICA
```

---

# 149. Mes sin lecturas pero ya ocurrido

Ejemplo:

```text
abril pasado
```

sin información suficiente.

Estado:

```text
SIN_DATOS
```

No:

```text
NO_APLICA
```

---

# 150. Diferencia

```text
SIN_DATOS
= el período ocurrió pero no tenemos suficientes datos

NO_APLICA
= el período todavía no ocurrió
```

---

# 151. Promedio y serie anual

No necesitamos promedio mensual en CHECKPOINT 6.

El dashboard principal usará:

```text
promedio diario últimos 7 días
```

---

# 152. Máximo anual

Tampoco necesario para MVP inicial.

---

# 153. Mantener alcance

No agregar:

```text
mejor mes
peor mes
tendencia
porcentaje aumento
predicción
```

todavía.

---

# 154. No comparación contra período anterior

Aunque sería útil:

```text
+12 % vs semana anterior
```

queda fuera del alcance actual.

---

# 155. No costos

Todavía:

```text
$0
precio kWh
factura estimada
```

NO forman parte del MVP.

---

# 156. No decimales de lecturas

Las lecturas y consumos reales continúan siendo:

```text
enteros
```

---

# 157. Estadísticas sí pueden ser decimales

Ejemplo:

```text
promedio = 6.8
cobertura = 71.43
```

---

# 158. SQL de serie diaria

Podremos combinar:

```text
generate_series
LAG
JOIN
```

---

# 159. Opción conceptual

Primero secuenciar todas las lecturas del medidor:

```sql
WITH lecturas_contexto AS (
    SELECT
        fecha_lectura,
        valor_lectura,

        LAG(fecha_lectura) OVER (
            ORDER BY fecha_lectura
        ) AS fecha_anterior,

        LAG(valor_lectura) OVER (
            ORDER BY fecha_lectura
        ) AS valor_anterior

    FROM lecturas_medidor
    WHERE id_medidor = $1
)
```

---

# 160. Después generar fechas

```sql
fechas AS (
    SELECT generate_series(
        $2::date,
        $3::date,
        INTERVAL '1 day'
    )::date AS fecha
)
```

---

# 161. Después relacionar

Así podremos distinguir:

```text
fecha sin lectura
lectura sin base diaria
lectura con consumo conocido
```

---

# 162. Intervalo

Para un `SIN_BASE` podemos necesitar localizar:

```text
última lectura previa existente
```

La consulta puede obtenerla mediante el contexto ya calculado.

---

# 163. Consumo diario

Solo:

```sql
CASE
    WHEN fecha_anterior IS NOT NULL
     AND fecha_lectura - fecha_anterior = 1
    THEN valor_lectura - valor_anterior
    ELSE NULL
END
```

---

# 164. Nunca usar diferencia si son 2+ días como consumo diario

---

# 165. Total de período

El servicio necesitará:

```text
lectura base exacta
```

cuando el período empieza en una fecha concreta.

---

# 166. Ejemplo 7 días

Rango:

```text
26/08 → 01/09
```

Base exacta:

```text
25/08
```

---

# 167. Completo

Si existe base exacta y lectura exacta del final:

```text
COMPLETO
```

---

# 168. Final faltante

Si no existe lectura exacta de `hasta`, el total completo solicitado no puede afirmarse.

Podremos buscar:

```text
última lectura dentro del rango
```

y clasificar:

```text
PARCIAL
```

---

# 169. Base faltante

Si no existe lectura exacta del día anterior al inicio:

```text
PARCIAL
```

si existe un intervalo observado útil.

---

# 170. Ambos bordes faltantes

Si aún existen dos lecturas dentro del rango:

```text
PARCIAL
```

entre ellas.

---

# 171. Solo una lectura

```text
SIN_DATOS
```

---

# 172. Regla de período parcial

Para obtener:

```text
consumoObservado
```

necesitamos dos lecturas reales.

---

# 173. Primera y última observadas

```text
consumoObservado =
ultimaObservada - primeraObservada
```

---

# 174. Importante sobre inclusión

Si la primera observada está:

```text
05/09
```

y última:

```text
09/09
```

la diferencia representa consumo entre esos puntos.

No afirmaremos consumo desde:

```text
01/09
```

---

# 175. Campos

Período parcial debe devolver:

```text
desdeObservado
hastaObservado
```

---

# 176. Seguridad

Todas las rutas requieren:

```text
autenticar
```

---

# 177. No requieren ADMIN

`USUARIO` también consulta.

---

# 178. No reciben IDs de usuario

Evitar:

```http
/estadisticas/resumen?idUsuario=2
```

porque no hay estadísticas por persona.

---

# 179. No reciben ID medidor

Durante MVP tampoco:

```text
idMedidor
```

desde cliente.

---

# 180. Mass assignment/query abuse

El validator de `serie` debe aceptar únicamente:

```text
periodo
```

---

# 181. Query estricta

Si envían:

```text
?periodo=7d&sql=...
```

podemos decidir ignorar campos adicionales o rechazarlos.

Siguiendo CHECKPOINT 4:

```text
preferimos schemas estrictos
```

para contratos pequeños.

---

# 182. Códigos de error nuevos

No necesitamos muchos.

Reutilizaremos:

```text
VALIDACION_DATOS_INVALIDOS
MEDIDOR_NO_ENCONTRADO
MEDIDOR_CONFIGURACION_INVALIDA
AUTH_...
```

---

# 183. Ausencia de estadísticas no es error

Nunca:

```text
404
```

porque no haya lecturas.

---

# 184. Responder 200

con:

```text
SIN_DATOS
```

---

# 185. No escribir

```text
try/catch
```

en cada controlador si ya existe middleware central de errores.

---

# 186. Read only

El módulo de estadísticas:

```text
NO INSERT
NO UPDATE
NO DELETE
```

---

# 187. No transacción para simples lecturas

No necesitamos:

```text
BEGIN
```

para cada consulta estadística normal.

---

# 188. Consistencia suficiente

Cada request obtiene un snapshot normal de las consultas.

Para este MVP no necesitamos niveles de aislamiento avanzados para dashboard.

---

# 189. Posible inconsistencia entre consultas del resumen

Si una lectura se registra exactamente mientras se arma el resumen, diferentes consultas podrían ver estados ligeramente distintos dependiendo de cómo se ejecuten.

---

# 190. ¿Necesitamos una transacción read-only?

Para dos usuarios, esto es poco frecuente, pero el resumen debe ser coherente.

---

# 191. Decisión

`GET /estadisticas/resumen` utilizará:

```text
una transacción READ ONLY
```

si el servicio necesita ejecutar varias consultas separadas.

---

# 192. Objetivo

Que:

```text
ultimaLectura
7 días
mes
año
```

correspondan al mismo snapshot lógico.

---

# 193. PostgreSQL

Podemos utilizar:

```text
BEGIN
SET TRANSACTION READ ONLY
```

y, si es necesario:

```text
REPEATABLE READ
```

---

# 194. ¿Es demasiado?

Para enseñar consistencia puede ser útil, pero no queremos sobreingeniería.

---

# 195. Decisión final

Usaremos:

```text
READ ONLY + REPEATABLE READ
```

para el resumen si está compuesto por varias consultas.

---

# 196. Serie independiente

`GET /serie` puede utilizar una consulta normal sin transacción especial.

---

# 197. Helper

Podemos ampliar `transaction.js` para soportar opciones:

```text
readOnly
isolationLevel
```

sin romper las transacciones existentes.

---

# 198. Mantener claridad

No crear un framework de transacciones.

Solo lo necesario.

---

# 199. Tests unitarios del servicio

Probar funciones puras como:

```text
calcularCobertura
calcularPromedio
obtenerMaximo
obtenerMinimo
clasificarPeriodo
```

---

# 200. Cobertura 100

```text
7 / 7
```

→:

```text
100
```

---

# 201. Cobertura parcial

```text
5 / 7
```

→:

```text
71.43
```

aproximadamente.

---

# 202. Cobertura cero

```text
0 / 7
```

→:

```text
0
```

---

# 203. Promedio

```text
[5, 7, null, null, 6, 9, 7]
```

→:

```text
6.8
```

---

# 204. Cero

```text
[0, 6]
```

→:

```text
3
```

---

# 205. Máximo empate

```text
27 → 9
29 → 9
```

→ ambas fechas.

---

# 206. Mínimo empate

Misma lógica.

---

# 207. Sin valores conocidos

Máximo:

```text
null
```

Mínimo:

```text
null
```

Promedio:

```text
null
```

---

# 208. Tests de ayer

### Completo

```text
30 → 1000
31 → 1008
referencia = 01/09
```

Esperado:

```text
8
```

---

# 209. Falta 30

Esperado:

```text
null
```

---

# 210. Falta 31

Esperado:

```text
null
```

---

# 211. Cero

```text
1000 → 1000
```

Esperado:

```text
0
```

---

# 212. Tests 7 días completos

Dataset:

```text
25 → 1000
26 → 1005
27 → 1012
28 → 1018
29 → 1026
30 → 1032
31 → 1041
01 → 1048
```

---

# 213. Serie

```text
26 → 5
27 → 7
28 → 6
29 → 8
30 → 6
31 → 9
01 → 7
```

---

# 214. Total

```text
48
```

---

# 215. Promedio

```text
6.857...
```

---

# 216. Máximo

```text
9
31/08
```

---

# 217. Mínimo

```text
5
26/08
```

---

# 218. Cobertura

```text
100
```

---

# 219. Test con hueco

Eliminar:

```text
28/08
```

---

# 220. Serie

```text
26 conocido
27 conocido
28 SIN_LECTURA
29 SIN_BASE
30 conocido
31 conocido
01 conocido
```

---

# 221. Total acumulado

Si:

```text
25
01
```

siguen disponibles:

```text
48
```

---

# 222. Cobertura

```text
5 / 7
```

---

# 223. Promedio

Solo los cinco conocidos.

---

# 224. Test no subestimar

Asegurar que:

```text
ultimos7Dias.consumo
```

NO sea igual a la suma parcial:

```text
34
```

sino:

```text
48
```

cuando los bordes son conocidos.

---

# 225. Test final faltante

Sin lectura del:

```text
01/09
```

Resultado 7d:

```text
PARCIAL
```

con:

```text
fechaHasta = 31/08
```

---

# 226. Test base faltante

Sin:

```text
25/08
```

también:

```text
PARCIAL
```

si hay dos lecturas útiles dentro de la ventana.

---

# 227. Test una sola lectura

```text
SIN_DATOS
```

---

# 228. Test mes actual

Base:

```text
31/08 → 1000
```

Actual:

```text
01/09 → 1008
```

Esperado:

```text
8
COMPLETO
esPeriodoEnCurso = true
```

---

# 229. Test mes parcial

Primera:

```text
05/09
```

Última:

```text
09/09
```

Esperado:

```text
PARCIAL
desdeObservado = 05
```

---

# 230. Test año parcial

Aplicación comienza:

```text
15/08
```

Esperado:

```text
PARCIAL
```

---

# 231. Test anual completo hasta fecha

Base:

```text
31/12/2025
```

y lectura válida en:

```text
01/09/2026
```

Esperado:

```text
COMPLETO
esPeriodoEnCurso = true
```

---

# 232. Tests serie 7d

Debe comprobar:

```text
exactamente 7 elementos
orden cronológico ascendente
fechas consecutivas
```

---

# 233. Orden gráfico

Aunque historial utiliza:

```text
DESC
```

la serie gráfica debe usar:

```text
ASC
```

---

# 234. Motivo

La gráfica se lee:

```text
pasado → presente
```

de izquierda a derecha.

---

# 235. Test serie mes

Debe tener:

```text
cantidad de días desde día 1 hasta fechaReferencia
```

---

# 236. Si referencia 01/09

Debe tener:

```text
1 elemento
```

---

# 237. Si referencia 30/09

Debe tener:

```text
30 elementos
```

---

# 238. Test año

Debe devolver:

```text
12 meses
```

---

# 239. Meses futuros

```text
NO_APLICA
```

---

# 240. Mes actual

```text
esPeriodoEnCurso = true
```

---

# 241. Meses pasados

```text
false
```

---

# 242. Test ausencia total

Resumen y todas las series:

```text
200
```

No:

```text
500
```

---

# 243. Test una lectura

Mismo principio.

---

# 244. Test autenticación

Sin JWT:

```text
401
```

---

# 245. USUARIO

```text
200
```

---

# 246. ADMIN

```text
200
```

---

# 247. Sesión revocada

```text
401
```

---

# 248. Usuario inactivo

```text
403
```

---

# 249. Test query inválida

```text
?periodo=5anos
```

→:

```text
422
```

---

# 250. SQL Injection

```text
?periodo=7d'; DROP TABLE...
```

queda invalidado por enum antes de SQL.

---

# 251. Performance

Con una lectura diaria:

```text
365 filas/año
```

---

# 252. Diez años

Aproximadamente:

```text
3650 filas
```

---

# 253. No necesitamos cache

No instalar:

```text
Redis
```

---

# 254. No materialized views

No necesitamos:

```text
MATERIALIZED VIEW
```

---

# 255. No tablas agregadas

No necesitamos precomputación.

---

# 256. PostgreSQL puede resolverlo fácilmente

Con:

```text
LAG
generate_series
CTE
JOIN
```

---

# 257. Corrección histórica

Después de corregir una lectura:

```text
estadísticas cambian automáticamente
```

---

# 258. No invalidar cache

Porque no existe cache.

---

# 259. Prueba crítica de corrección

Antes:

```text
28 → 1000
29 → 1008
30 → 1015
```

Después:

```text
29 → 1010
```

El resumen/serie debe cambiar:

```text
29 → 10
30 → 5
```

sin modificar ninguna tabla estadística.

---

# 260. Prueba crítica de insertar hueco

Antes:

```text
28 → 1000
30 → 1015
```

Serie:

```text
29 SIN_LECTURA
30 SIN_BASE
```

ADMIN agrega:

```text
29 → 1008
```

Después:

```text
29 → 8
30 → 7
```

automáticamente.

---

# 261. Read-only

Podemos incluso probar que las consultas estadísticas no modifican el número de filas en:

```text
lecturas_medidor
```

---

# 262. Logs

Las estadísticas pueden registrar:

```text
requestId
periodo
status
duración
```

No necesitan imprimir todas las lecturas.

---

# 263. README

Documentar:

```text
GET /api/estadisticas/resumen
GET /api/estadisticas/serie
```

---

# 264. Explicar estados

README deberá aclarar:

```text
COMPLETO
PARCIAL
SIN_DATOS
CONOCIDO
SIN_LECTURA
SIN_BASE
NO_APLICA
```

---

# 265. Smoke test manual

Con dataset continuo:

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

Consultar:

```http
GET /api/estadisticas/resumen
```

---

# 266. Esperado 7 días

```text
48 kWh
```

---

# 267. Esperado promedio

```text
≈ 6.9
```

---

# 268. Esperado mayor

```text
9
31 Ago
```

---

# 269. Serie

```http
GET /api/estadisticas/serie?periodo=7d
```

debe devolver siete puntos.

---

# 270. Smoke test hueco

Eliminar una lectura en base de test o preparar fixture.

Comprobar:

```text
total acumulado correcto
detalle incompleto
cobertura menor a 100
```

---

# 271. No usar producción para pruebas manuales destructivas

Utilizar preferentemente:

```text
consumo_electrico_test
```

---

# 272. No migración esperada

CHECKPOINT 6:

```text
NO necesita nuevas tablas
```

---

# 273. Última migración

Debe continuar:

```text
002_sesiones
```

salvo necesidad estructural real descubierta previamente.

---

# 274. Esto demuestra una decisión de diseño

Podemos construir:

```text
dashboard
estadísticas
gráficos
```

sin añadir una sola tabla porque las lecturas son nuestra fuente de verdad.

---

# 275. Gate backend

Ejecutar:

```bash
npm run lint
npm test
npm run test:coverage
```

---

# 276. Revisar cobertura

Especialmente:

```text
estadisticas.service.js
estadisticas.repository.js
estadisticas.validators.js
utils/date.js
```

---

# 277. Regresiones

Todas las pruebas anteriores deben continuar pasando:

```text
auth
usuarios
lecturas
seguridad
```

---

# 278. DB

```bash
npm run db:check
npm run db:status
```

PASS.

---

# 279. Frontend

Aunque todavía no consume estadísticas:

```bash
cd ../frontend
npm run build
```

PASS.

---

# 280. Git

Desde raíz:

```bash
git status
```

Verificar:

```text
sin .env
sin .env.test
sin coverage
sin secretos
```

---

# 281. Commit

Después del gate:

```bash
git add .
git status
```

Revisar.

Después:

```bash
git commit -m "feat: implementar motor de estadisticas"
```

---

# 282. Working tree

```text
nothing to commit, working tree clean
```

---

# 283. Gate CHECKPOINT 6

### CP6-001

Existe router de estadísticas.

### CP6-002

Todas las rutas requieren autenticación.

### CP6-003

ADMIN puede consultar.

### CP6-004

USUARIO puede consultar.

### CP6-005

No se filtra por usuario registrador.

### CP6-006

No se recibe `idMedidor` desde cliente.

### CP6-007

Existe `/estadisticas/resumen`.

### CP6-008

Existe `/estadisticas/serie`.

### CP6-009

`periodo=7d` es válido.

### CP6-010

`periodo=mes` es válido.

### CP6-011

`periodo=anio` es válido.

### CP6-012

Período inválido devuelve 422.

### CP6-013

Fecha de referencia utiliza America/Guayaquil.

### CP6-014

Resumen incluye lectura de hoy.

### CP6-015

Resumen incluye última lectura.

### CP6-016

Sin lecturas funciona.

### CP6-017

Una lectura funciona.

### CP6-018

Ayer se calcula con anteayer + ayer.

### CP6-019

Ayer no depende de lectura de hoy.

### CP6-020

Ayer cero se conserva como 0.

### CP6-021

Ayer sin datos devuelve null.

### CP6-022

Ventana 7d tiene siete días.

### CP6-023

Total 7d prioriza diferencia de bordes.

### CP6-024

No suma silenciosamente solo días conocidos como total.

### CP6-025

Huecos internos no destruyen total si bordes son conocidos.

### CP6-026

Huecos sí reducen cobertura diaria.

### CP6-027

Cobertura 100 % funciona.

### CP6-028

Cobertura parcial funciona.

### CP6-029

Cobertura 0 % funciona.

### CP6-030

Promedio utiliza solo días conocidos.

### CP6-031

Null no participa en promedio.

### CP6-032

Cero sí participa en promedio.

### CP6-033

Promedio puede ser decimal.

### CP6-034

Máximo funciona.

### CP6-035

Mínimo funciona.

### CP6-036

Empates de máximo se conservan.

### CP6-037

Empates de mínimo se conservan.

### CP6-038

Mes actual utiliza base del día anterior al inicio.

### CP6-039

Mes actual informa `fechaHasta`.

### CP6-040

Mes actual puede ser PARCIAL.

### CP6-041

Mes sin datos devuelve SIN_DATOS.

### CP6-042

Año utiliza base del 31/12 anterior.

### CP6-043

Primer año de uso puede ser PARCIAL.

### CP6-044

Año informa `fechaHasta`.

### CP6-045

Períodos actuales indican `esPeriodoEnCurso`.

### CP6-046

Serie 7d devuelve exactamente siete puntos.

### CP6-047

Serie 7d está ordenada ASC.

### CP6-048

Serie mensual devuelve días hasta fechaReferencia.

### CP6-049

Serie mensual no devuelve días futuros.

### CP6-050

Serie anual devuelve doce meses.

### CP6-051

Meses futuros usan NO_APLICA.

### CP6-052

Mes pasado sin datos usa SIN_DATOS.

### CP6-053

Mes actual está marcado en curso.

### CP6-054

Serie diaria distingue CONOCIDO.

### CP6-055

Serie diaria distingue SIN_LECTURA.

### CP6-056

Serie diaria distingue SIN_BASE.

### CP6-057

SIN_BASE puede incluir intervalo.

### CP6-058

Intervalo nunca se convierte en barra diaria.

### CP6-059

No existe interpolación.

### CP6-060

No existen predicciones.

### CP6-061

No existen costos.

### CP6-062

No existen comparaciones porcentuales contra período anterior.

### CP6-063

No existe tabla de estadísticas.

### CP6-064

No existe tabla de consumos.

### CP6-065

No existe Redis.

### CP6-066

No existen materialized views innecesarias.

### CP6-067

Las consultas trabajan por conjuntos.

### CP6-068

Se evita N+1 estadístico.

### CP6-069

El resumen mantiene snapshot coherente.

### CP6-070

El módulo estadístico es read-only.

### CP6-071

Corregir lectura actualiza resultados automáticamente.

### CP6-072

Insertar lectura faltante actualiza resultados automáticamente.

### CP6-073

Tests de ayer pasan.

### CP6-074

Tests 7 días completos pasan.

### CP6-075

Tests con huecos pasan.

### CP6-076

Test de no subestimar total pasa.

### CP6-077

Tests de períodos parciales pasan.

### CP6-078

Tests de mes pasan.

### CP6-079

Tests de año pasan.

### CP6-080

Tests de promedio pasan.

### CP6-081

Tests de máximo/mínimo pasan.

### CP6-082

Tests de empates pasan.

### CP6-083

Tests de serie 7d pasan.

### CP6-084

Tests de serie mes pasan.

### CP6-085

Tests de serie año pasan.

### CP6-086

Tests sin datos pasan.

### CP6-087

Tests de una lectura pasan.

### CP6-088

Tests de autorización pasan.

### CP6-089

Regresión de CHECKPOINT 3 pasa.

### CP6-090

Regresión de CHECKPOINT 4 pasa.

### CP6-091

Regresión de CHECKPOINT 5 pasa.

### CP6-092

`npm run lint` pasa.

### CP6-093

`npm test` pasa.

### CP6-094

Frontend build continúa pasando.

### CP6-095

No existen secretos versionados.

### CP6-096

Existe commit.

### CP6-097

Working tree limpio.

---

# 284. Estado de SPEC-005

Después del gate:

```text
SPEC-005
Motor de consumo y estadísticas
→ IMPLEMENTADA
→ PROBADA
```

La experiencia frontend aún falta, pero el motor backend estará completo.

---

# 285. Estado de SPEC-007

La parte de datos requerida por el dashboard estará implementada.

Por tanto:

```text
SPEC-007
→ IMPLEMENTADA PARCIALMENTE
```

Falta:

```text
React
tarjetas
gráfico
responsive
```

---

# 286. Backend funcional al finalizar

Ya tendremos:

```text
Autenticación
Usuarios
Lecturas
Historial
Estadísticas
```

funcionando mediante API.

---

# 287. Backend restante

Quedarán principalmente:

```text
ajustes encontrados por frontend
gates finales
E2E
```

No grandes módulos de negocio nuevos.

---

# 288. Estado del roadmap

```text
CHECKPOINT 0
Inicialización
→ CERRADO

CHECKPOINT 1
PostgreSQL y migraciones
→ CERRADO

CHECKPOINT 2
Backend base y seguridad
→ CERRADO

CHECKPOINT 3
Autenticación y sesiones
→ CERRADO

CHECKPOINT 4
Administración de usuarios
→ CERRADO

CHECKPOINT 5
Lecturas
→ CERRADO

CHECKPOINT 6
Estadísticas
→ CERRADO

CHECKPOINT 7
Frontend base
→ SIGUIENTE

CHECKPOINT 8
Dashboard
→ PENDIENTE

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

# 289. Qué podremos responder mediante API

Después de este checkpoint podremos preguntar:

```text
¿Cuánto consumí ayer?
```

```text
¿Cuánto consumí en los últimos 7 días?
```

```text
¿Qué día consumí más?
```

```text
¿Cuál fue el promedio reciente?
```

```text
¿Cuánto llevo consumido este mes?
```

```text
¿Cuánto llevo consumido este año?
```

```text
¿Qué días tienen información faltante?
```

y el backend podrá responder correctamente.

---

# 290. Lo más importante

Si existen:

```text
28 → 1000
30 → 1015
```

el sistema seguirá sabiendo que:

```text
intervalo = 15 kWh
```

pero nunca dirá:

```text
29 = 7.5
30 = 7.5
```

ni:

```text
30 = 15 kWh diarios.
```

La integridad estadística que definimos desde `SPEC-001` se mantiene hasta el dashboard.

---

# 291. Siguiente checkpoint

El siguiente bloque cambia de capa:

```text
CHECKPOINT 7
Frontend base, autenticación y navegación
```

Ahí comenzaremos React de verdad e implementaremos:

```text
React Router
Axios
cliente HTTP
AuthContext
refresh coordinado
LoginPage
ProtectedRoute
AdminRoute
AppLayout
sidebar
navegación móvil base
manejo de sesión
logout
estado loading inicial
404
403
```

Todavía sin construir el dashboard completo.

---

# 292. Criterio pedagógico

Un aprendiz deberá poder explicar:

1. ¿Cuál es la diferencia entre consumo diario y consumo acumulado?
2. ¿Por qué no sumamos simplemente los días conocidos?
3. ¿Cómo puede conocerse un total aunque falten días intermedios?
4. ¿Qué significa cobertura diaria?
5. ¿Qué significa COMPLETO?
6. ¿Qué significa PARCIAL?
7. ¿Qué significa SIN_DATOS?
8. ¿Qué diferencia existe entre SIN_DATOS y NO_APLICA?
9. ¿Cómo se calcula ayer?
10. ¿Por qué ayer no necesita lectura de hoy?
11. ¿Cuál es la lectura base de los últimos 7 días?
12. ¿Cuál es la lectura base de un mes?
13. ¿Cuál es la lectura base de un año?
14. ¿Por qué un período actual necesita `fechaHasta`?
15. ¿Qué significa `esPeriodoEnCurso`?
16. ¿Cómo se calcula el promedio?
17. ¿Por qué null no participa?
18. ¿Por qué cero sí participa?
19. ¿Cómo manejamos empates de máximo y mínimo?
20. ¿Por qué la gráfica semanal siempre tiene siete posiciones?
21. ¿Qué diferencia existe entre SIN_LECTURA y SIN_BASE?
22. ¿Por qué los meses futuros son NO_APLICA y no cero?
23. ¿Por qué no necesitamos una tabla de estadísticas?
24. ¿Qué aporta `generate_series()`?
25. ¿Qué aporta `LAG()`?
26. ¿Por qué el módulo estadístico es read-only?
27. ¿Por qué corregir una lectura cambia automáticamente las estadísticas?
28. ¿Por qué no necesitamos Redis en esta aplicación?

Cuando todos los `CP6-*` estén verdes:

```text
CHECKPOINT 6 → CERRADO
```
