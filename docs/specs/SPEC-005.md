# SPEC-005 — Motor de cálculo de consumo y estadísticas

## 1. Objetivo

Definir cómo el sistema transforma las lecturas acumuladas del medidor en información útil para el usuario.

Esta especificación establece cómo calcular:

* consumo diario;
* consumo de ayer;
* últimos 7 días;
* consumo del mes actual;
* consumo del año actual;
* promedio diario;
* mayor consumo;
* menor consumo;
* cobertura de datos;
* intervalos con información incompleta;
* series de datos para gráficos.

El principio fundamental será:

> El sistema debe mostrar únicamente aquello que realmente puede deducir de las lecturas registradas.

Nunca se inventarán consumos.

---

# 2. Fuente de verdad

Continúa siendo:

```text
lecturas_medidor
```

Concretamente:

```text
fecha_lectura
valor_lectura
```

No existirán tablas independientes como:

```text
consumos
estadisticas_diarias
estadisticas_mensuales
estadisticas_anuales
```

---

# 3. Lectura acumulada

Ejemplo:

| Fecha | Lectura |
| ----- | ------: |
| 27/08 |   12532 |
| 28/08 |   12540 |
| 29/08 |   12547 |
| 30/08 |   12555 |

El medidor aumenta acumulativamente.

---

# 4. Consumo entre dos lecturas

Fórmula:

```text
consumo = lecturaActual - lecturaAnterior
```

Ejemplo:

```text
12555 - 12547 = 8 kWh
```

---

# 5. Consumo diario

Para considerar que conocemos el consumo de un día deben existir lecturas en:

```text
día anterior
+
día actual
```

Ejemplo:

```text
29/08 → 12547
30/08 → 12555
```

Entonces:

```text
Consumo del 30/08 = 8 kWh
```

---

# 6. Regla CON-DIA-001

El consumo diario únicamente será considerado conocido cuando las dos lecturas estén separadas exactamente por:

```text
1 día calendario
```

---

# 7. Ejemplo válido

```text
28/08 → 1000
29/08 → 1008
```

Resultado:

```text
29/08 → 8 kWh
```

---

# 8. Día faltante

Tenemos:

```text
28/08 → 1000
30/08 → 1015
```

Sabemos:

```text
1015 - 1000 = 15 kWh
```

Pero esos 15 kWh corresponden al intervalo:

```text
28/08 → 30/08
```

No exclusivamente al 30.

Por tanto:

```text
29/08 → desconocido
30/08 → desconocido
```

como consumos diarios individuales.

---

# 9. Diferencia entre cero y desconocido

Esto será crítico en toda la aplicación.

### Cero

```text
0 kWh
```

significa:

> Tenemos datos suficientes y sabemos que no hubo incremento.

### NULL

```text
null
```

significa:

> No tenemos información suficiente para determinar el consumo de ese día.

Nunca deberán tratarse igual.

---

# 10. Ejemplo de cero real

```text
28/08 → 1000
29/08 → 1000
```

Resultado:

```text
29/08 → 0 kWh
```

Dato conocido.

---

# 11. Ejemplo desconocido

```text
28/08 → 1000
30/08 → 1015
```

Resultado:

```text
30/08 → null
```

No significa:

```text
0
```

---

# 12. Hora de las mediciones

Durante el MVP, el dominio trabaja principalmente con:

```text
fecha_lectura
```

y una lectura oficial por día.

La hora real de registro se conserva para auditoría.

Idealmente las mediciones deberían realizarse aproximadamente a una hora similar cada día, pero el MVP no obligará a hacerlo.

Por ello, el concepto de:

```text
consumo diario
```

significa operacionalmente:

> diferencia entre las lecturas registradas en dos fechas consecutivas.

---

# 13. Fecha de referencia

Para las estadísticas del dashboard utilizaremos:

```text
fecha actual del sistema
```

según:

```text
America/Guayaquil
```

Esta será:

```text
fechaReferencia
```

---

# 14. Consumo de ayer

Si hoy es:

```text
30/08/2026
```

entonces:

```text
ayer = 29/08/2026
```

Para calcular el consumo de ayer necesitamos:

```text
28/08
29/08
```

---

# 15. EST-AYER-001

Si existen ambas:

```text
28/08 → 12540
29/08 → 12547
```

resultado:

```text
ayer = 7 kWh
```

---

# 16. Ayer sin información suficiente

Si existe:

```text
29/08 → 12547
```

pero no:

```text
28/08
```

resultado:

```text
consumoAyer = null
```

Estado:

```text
SIN_INFORMACION
```

---

# 17. Ayer sin lectura

Si no existe medición del 29:

```text
consumoAyer = null
```

Estado:

```text
SIN_LECTURA
```

---

# 18. Últimos 7 días

Para el MVP, el concepto semanal principal significará:

```text
últimos 7 días calendario
```

No:

```text
lunes a domingo
```

Esto facilita comparar rápidamente los consumos recientes.

---

# 19. Ventana de siete días

Si hoy es:

```text
30/08
```

la gráfica contendrá:

```text
24/08
25/08
26/08
27/08
28/08
29/08
30/08
```

Exactamente siete posiciones.

---

# 20. Lectura base para una ventana

Para conocer completamente el consumo de:

```text
24/08
```

necesitamos también:

```text
23/08
```

Por tanto, una consulta de siete días puede necesitar recuperar:

```text
8 fechas
```

aunque la gráfica muestre solo siete.

---

# 21. Principio de borde

Esto se aplica a cualquier rango.

Para calcular consumo desde:

```text
01/08
```

necesitamos como punto de partida una lectura en:

```text
31/07
```

Esta lectura se denominará:

```text
lectura base del período
```

---

# 22. Dos tipos de información de período

Debemos distinguir:

### Desglose diario

Permite conocer cada día individual.

### Consumo acumulado

Permite conocer cuánto avanzó el medidor entre dos puntos conocidos.

Son conceptos relacionados, pero no iguales.

---

# 23. Ejemplo importante

Lecturas:

```text
28/08 → 1000
30/08 → 1015
```

No sabemos:

```text
consumo diario del 29
consumo diario del 30
```

pero sí sabemos:

```text
consumo total del intervalo = 15 kWh
```

---

# 24. Consumo de intervalo

Se define:

```text
consumoIntervalo =
lecturaFinal - lecturaInicial
```

Siempre que ambas lecturas sean válidas.

---

# 25. No convertir intervalo en días

El motor conservará separado:

```text
consumoDiario
```

de:

```text
consumoIntervalo
```

Nunca hará:

```text
consumoIntervalo / número de días
```

para inventar consumos diarios.

---

# 26. Consumo acumulado de un período

Un período tendrá:

```text
desde
hasta
```

Para considerarlo completo necesitamos idealmente:

```text
lectura del día anterior a desde
+
lectura de hasta
```

---

# 27. Ejemplo de mes completo conocido

Queremos agosto:

```text
desde = 01/08
hasta = 31/08
```

Necesitamos:

```text
31/07 → lectura base
31/08 → lectura final
```

Entonces:

```text
consumoAgosto =
lectura31Agosto - lectura31Julio
```

Aunque dentro del mes falte alguna lectura diaria, el consumo total del intervalo continúa siendo matemáticamente conocido.

Lo que estará incompleto será:

```text
el desglose diario
```

---

# 28. Ejemplo

```text
31/07 → 1000
01/08 → 1005
02/08 → SIN LECTURA
03/08 → 1020
...
31/08 → 1200
```

Sabemos:

```text
Consumo acumulado agosto = 1200 - 1000 = 200 kWh
```

Pero no podemos determinar exactamente:

```text
02/08
03/08
```

individualmente.

---

# 29. Principio fundamental

Por tanto:

> Un período puede tener un total acumulado conocido y, al mismo tiempo, tener un desglose diario incompleto.

Esto deberá quedar reflejado en la API.

---

# 30. Período actual

El mes y el año actuales todavía no han terminado.

Por ello utilizaremos:

```text
hasta = última lectura disponible dentro del período
```

---

# 31. Ejemplo de mes actual

Hoy:

```text
30/08
```

Última lectura:

```text
29/08
```

El sistema no afirmará:

```text
consumo hasta el 30
```

Mostrará:

```text
consumo acumulado hasta el 29/08
```

---

# 32. Fecha efectiva

Toda estadística acumulada incluirá:

```text
fechaHasta
```

Ejemplo:

```json
{
  "consumo": 218,
  "fechaHasta": "2026-08-29"
}
```

Esto evita ocultar que falta la lectura de hoy.

---

# 33. Estado de cobertura

Las estadísticas de período tendrán un estado:

```text
COMPLETO
PARCIAL
SIN_DATOS
```

---

# 34. COMPLETO

Significa que tenemos una lectura base adecuada para el inicio y una lectura final válida para el rango evaluado.

Ejemplo:

```text
31/07 → base
29/08 → final
```

Para:

```text
01/08 hasta 29/08
```

el total acumulado es conocido.

---

# 35. PARCIAL

Significa que no tenemos la lectura base exacta del comienzo del período, pero sí podemos informar un intervalo observado más corto.

Ejemplo:

Queremos agosto.

Primera lectura disponible:

```text
05/08 → 1000
```

Última:

```text
29/08 → 1180
```

Podemos afirmar:

```text
Entre 05/08 y 29/08 avanzó 180 kWh
```

Pero no:

```text
Agosto consumió 180 kWh
```

---

# 36. Representación de período parcial

Respuesta conceptual:

```json
{
  "estado": "PARCIAL",
  "consumoObservado": 180,
  "desdeObservado": "2026-08-05",
  "hastaObservado": "2026-08-29"
}
```

La interfaz podrá mostrar:

```text
180 kWh
Desde el 5 de agosto
```

---

# 37. SIN_DATOS

Cuando no existen suficientes lecturas para obtener una diferencia significativa:

```text
estado = SIN_DATOS
```

Ejemplo:

Solo existe:

```text
29/08 → 1180
```

No podemos obtener consumo.

---

# 38. Regla para tarjetas principales

Una tarjeta nunca deberá mostrar un número parcial como si fuera un total completo.

Ejemplo incorrecto:

```text
Consumo agosto
180 kWh
```

si los datos comenzaron el 5 de agosto.

Correcto:

```text
Consumo observado
180 kWh
Desde 5 Ago
```

---

# 39. Consumo mensual

El dashboard utilizará:

```text
mes calendario actual
```

Desde:

```text
primer día del mes
```

hasta:

```text
última fecha con lectura <= hoy
```

---

# 40. Lectura base mensual

Para un mes que comienza:

```text
01/08
```

la lectura base ideal es:

```text
31/07
```

---

# 41. Consumo anual

El año actual utilizará:

```text
01/01 → última lectura disponible
```

La lectura base ideal será:

```text
31/12 del año anterior
```

---

# 42. Primer año del sistema

Supongamos que la aplicación comienza:

```text
15/08/2026
```

No podremos afirmar el consumo real de todo:

```text
2026
```

El estado será:

```text
PARCIAL
```

y se mostrará el consumo desde el primer intervalo conocido.

---

# 43. Estadísticas diarias

Además de los acumulados, calcularemos sobre los días cuyo:

```text
consumoDiario != null
```

las siguientes estadísticas:

```text
promedio
máximo
mínimo
```

---

# 44. Promedio

Fórmula:

```text
promedio =
suma de consumos diarios conocidos
/
cantidad de días conocidos
```

---

# 45. Ejemplo

Valores conocidos:

```text
5
8
12
7
```

Resultado:

```text
32 / 4 = 8 kWh
```

---

# 46. Promedio decimal

Las lecturas y consumos reales son enteros.

Pero una estadística derivada sí puede tener decimales.

Ejemplo:

```text
5 + 6 = 11

11 / 2 = 5.5
```

Resultado:

```text
Promedio = 5.5 kWh
```

---

# 47. Visualización de promedio

La interfaz mostrará inicialmente:

```text
1 decimal máximo
```

Ejemplo:

```text
5.5 kWh
8.0 kWh
```

Podremos visualmente simplificar:

```text
8 kWh
```

cuando el decimal sea cero.

---

# 48. Precisión interna

No redondearemos antes de terminar el cálculo.

El redondeo será únicamente para:

```text
presentación
```

---

# 49. Mayor consumo

Se calculará únicamente utilizando días conocidos.

Ejemplo:

```text
Lun → 5
Mar → 8
Mié → 12
Jue → 7
```

Resultado:

```text
Miércoles → 12 kWh
```

---

# 50. Menor consumo

Mismos datos:

```text
Lunes → 5 kWh
```

---

# 51. Días desconocidos

Un día:

```text
null
```

no participará en:

```text
máximo
mínimo
promedio
```

---

# 52. Cero sí participa

Un día:

```text
0 kWh
```

sí participa.

Ejemplo:

```text
0
5
10
```

Mínimo:

```text
0 kWh
```

Promedio:

```text
5 kWh
```

---

# 53. Empates

Si existen:

```text
Lunes → 10
Miércoles → 10
```

ambos son días de mayor consumo.

El motor podrá devolver:

```json
{
  "valor": 10,
  "fechas": [
    "2026-08-24",
    "2026-08-26"
  ]
}
```

No perderemos información seleccionando arbitrariamente uno.

---

# 54. Cobertura diaria

Para ayudar a interpretar las estadísticas calcularemos:

```text
diasEsperados
diasConConsumo
diasSinDato
porcentajeCobertura
```

---

# 55. Ejemplo últimos 7 días

Tenemos:

```text
7 días esperados
5 consumos conocidos
2 desconocidos
```

Cobertura:

```text
5 / 7 × 100 = 71.43 %
```

Visualmente:

```text
71 %
```

---

# 56. Regla de cobertura

La cobertura nunca convierte los datos faltantes en cero.

Solo informa:

> qué proporción del período tiene detalle diario conocido.

---

# 57. Total y cobertura pueden ser diferentes

Ejemplo:

Existe lectura base y lectura final.

Consumo acumulado:

```text
100 kWh
```

Pero faltaron mediciones intermedias.

Podemos tener:

```text
consumoAcumulado = 100 kWh
coberturaDiaria = 70 %
```

Ambos valores son correctos.

---

# 58. Gráfico de últimos 7 días

Será inicialmente:

```text
gráfico de barras
```

y tendrá exactamente:

```text
7 puntos
```

uno por fecha.

---

# 59. Estructura de cada punto

Ejemplo:

```json
{
  "fecha": "2026-08-30",
  "consumo": 8,
  "estado": "CONOCIDO"
}
```

---

# 60. Estado CONOCIDO

Significa que existen:

```text
lectura día anterior
lectura del día
```

Resultado:

```text
consumo = entero
```

---

# 61. Estado SIN_LECTURA

Significa que no existe lectura para esa fecha.

Ejemplo:

```json
{
  "fecha": "2026-08-29",
  "consumo": null,
  "estado": "SIN_LECTURA"
}
```

---

# 62. Estado SIN_BASE

Puede existir lectura del día pero no la lectura inmediatamente anterior.

Ejemplo:

```text
28 → 1000
29 → SIN LECTURA
30 → 1015
```

Para 30:

```json
{
  "fecha": "2026-08-30",
  "consumo": null,
  "estado": "SIN_BASE"
}
```

---

# 63. Intervalo asociado

Cuando sea útil podremos añadir:

```json
{
  "intervalo": {
    "desde": "2026-08-28",
    "hasta": "2026-08-30",
    "dias": 2,
    "consumo": 15
  }
}
```

Esto permitirá un tooltip como:

```text
No se puede separar por día.
15 kWh consumidos entre 28 y 30 Ago.
```

---

# 64. Nunca crear barra falsa

Para:

```text
consumo = null
```

React no deberá dibujar una barra de:

```text
0 kWh
```

Debe representar:

```text
sin dato
```

de manera diferente.

---

# 65. Barras de valor cero

Si:

```text
consumo = 0
estado = CONOCIDO
```

sí representa un dato válido.

El tooltip podrá mostrar:

```text
0 kWh
```

---

# 66. Serie mensual

Cuando el usuario seleccione:

```text
Mes
```

la gráfica podrá mostrar:

```text
un punto/barra por día del mes
```

Hasta:

```text
fecha de referencia
```

No necesitamos mostrar días futuros.

---

# 67. Serie anual

Para:

```text
Año
```

una barra diaria produciría demasiada información.

Agruparemos por:

```text
mes
```

---

# 68. Barras anuales

La vista anual podrá mostrar:

```text
Ene
Feb
Mar
Abr
May
Jun
Jul
Ago
...
```

---

# 69. Consumo mensual para gráfica anual

Para que un mes se represente como total mensual completo necesitamos las lecturas adecuadas de borde.

Si el mes tiene información parcial, el punto deberá indicar:

```text
PARCIAL
```

No deberá parecer equivalente a un mes completo.

---

# 70. Meses futuros

Dentro del año actual:

```text
meses futuros
```

no son:

```text
0 kWh
```

Simplemente:

```text
NO_APLICA
```

---

# 71. Motor de cálculo

Conceptualmente tendremos:

```text
ServicioEstadisticas
```

o equivalente.

Sus responsabilidades serán:

```text
calcular consumo diario
construir series
calcular acumulados
calcular cobertura
calcular promedio
calcular máximo
calcular mínimo
clasificar períodos
```

---

# 72. El servicio no modifica datos

El motor de estadísticas será principalmente:

```text
READ ONLY
```

No ejecutará:

```text
INSERT
UPDATE
DELETE
```

sobre las lecturas.

---

# 73. Consulta base con `LAG`

PostgreSQL puede utilizar:

```sql
LAG()
```

para recuperar la lectura previa.

Conceptualmente:

```sql
SELECT
    id_lectura,
    fecha_lectura,
    valor_lectura,

    LAG(fecha_lectura) OVER (
        PARTITION BY id_medidor
        ORDER BY fecha_lectura
    ) AS fecha_anterior,

    LAG(valor_lectura) OVER (
        PARTITION BY id_medidor
        ORDER BY fecha_lectura
    ) AS valor_anterior

FROM lecturas_medidor;
```

---

# 74. Consumo diario mediante SQL

Conceptualmente:

```sql
CASE
    WHEN fecha_anterior IS NULL THEN NULL

    WHEN fecha_lectura - fecha_anterior = 1
        THEN valor_lectura - valor_anterior

    ELSE NULL
END
```

---

# 75. Error SQL importante que debemos evitar

No debemos filtrar el rango demasiado pronto.

Ejemplo:

Queremos:

```text
01/08 → 31/08
```

Si primero eliminamos:

```text
31/07
```

entonces `LAG()` no podrá utilizarla como lectura base.

---

# 76. Orden correcto

Conceptualmente:

```text
1. obtener/secuenciar lecturas
2. calcular lectura anterior
3. calcular diferencias
4. después filtrar el período solicitado
```

Este será un buen ejercicio para los aprendices.

---

# 77. Serie completa de fechas

Para construir gráficos necesitamos incluso fechas sin lecturas.

PostgreSQL puede generar fechas utilizando:

```sql
generate_series()
```

Conceptualmente:

```text
24/08
25/08
26/08
27/08
28/08
29/08
30/08
```

Después relacionamos las lecturas existentes.

Así el gráfico siempre conserva siete posiciones.

---

# 78. Ejemplo gráfico completo

Lecturas suficientes:

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

Serie:

| Día | Consumo |
| --- | ------: |
| 24  |       5 |
| 25  |       7 |
| 26  |       6 |
| 27  |       8 |
| 28  |       6 |
| 29  |       9 |
| 30  |       7 |

---

# 79. Resultado estadístico

```text
Total 7 días = 48 kWh
Promedio = 6.86 kWh
Mayor = 9 kWh
Menor = 5 kWh
Cobertura = 100 %
```

Visualización promedio:

```text
6.9 kWh
```

---

# 80. Ejemplo incompleto

Lecturas:

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

Consumos diarios:

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

# 81. Consumo acumulado del intervalo

Aunque falta 26:

```text
30 → 1048
23 → 1000
```

Por tanto:

```text
últimos 7 días acumulados = 48 kWh
```

si las fechas de borde corresponden exactamente al rango.

---

# 82. Cobertura del mismo caso

Consumos conocidos:

```text
5 días
```

De:

```text
7
```

Cobertura:

```text
71 %
```

Por tanto la respuesta puede decir simultáneamente:

```text
Consumo acumulado: 48 kWh
Detalle diario: 71 % completo
```

Esto es mucho más preciso que inventar dos barras.

---

# 83. Suma de días conocidos

También podremos calcular:

```text
sumaConsumosDiariosConocidos
```

pero no la utilizaremos como sustituto silencioso del total del período.

En el ejemplo:

```text
5 + 7 + 6 + 9 + 7 = 34
```

Mostrar:

```text
Total = 34 kWh
```

sería incorrecto porque ignoraría el intervalo faltante.

---

# 84. Regla EST-TOTAL-001

Nunca se calculará el total de un período simplemente sumando los días conocidos si existen huecos y eso pudiera subestimar el consumo real.

---

# 85. Prioridad del cálculo total

Para un período utilizaremos prioritariamente:

```text
lectura final - lectura base
```

cuando los bordes requeridos estén disponibles.

---

# 86. Período parcial sin base exacta

Ejemplo últimos 7 días:

Queremos:

```text
24 → 30
```

pero la primera lectura existente es:

```text
26 → 1000
```

y última:

```text
30 → 1040
```

Resultado:

```text
estado = PARCIAL
consumoObservado = 40
desdeObservado = 26
hastaObservado = 30
```

No:

```text
consumo últimos 7 días = 40
```

sin aclaración.

---

# 87. Resumen del dashboard

El backend deberá ser capaz de entregar en una sola operación:

```text
consumo de ayer
últimos 7 días
mes actual
año actual
última lectura
promedio reciente
mayor consumo reciente
cobertura
```

---

# 88. Endpoint de resumen

Se reserva:

```http
GET /api/estadisticas/resumen
```

Requiere autenticación.

Tanto:

```text
ADMIN
USUARIO
```

pueden consultarlo.

---

# 89. Respuesta conceptual

```json
{
  "fechaReferencia": "2026-08-30",

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

  "promedio7Dias": 7.3,

  "mayorConsumo7Dias": {
    "valor": 11,
    "fechas": [
      "2026-08-27"
    ]
  }
}
```

---

# 90. Ejemplo con datos parciales

```json
{
  "ultimos7Dias": {
    "consumo": 40,
    "estado": "PARCIAL",
    "desdeObservado": "2026-08-26",
    "fechaHasta": "2026-08-30",
    "coberturaDiaria": 57
  }
}
```

El frontend deberá respetar:

```text
estado
```

y no ocultarlo.

---

# 91. Endpoint de serie

```http
GET /api/estadisticas/serie?periodo=7d
```

Otros valores:

```text
mes
anio
```

---

# 92. Serie 7d

Respuesta conceptual:

```json
{
  "periodo": "7d",
  "desde": "2026-08-24",
  "hasta": "2026-08-30",
  "datos": [
    {
      "fecha": "2026-08-24",
      "consumo": 5,
      "estado": "CONOCIDO"
    },
    {
      "fecha": "2026-08-25",
      "consumo": 7,
      "estado": "CONOCIDO"
    }
  ]
}
```

Siempre contendrá las fechas correspondientes al rango solicitado.

---

# 93. Serie mensual

```http
GET /api/estadisticas/serie?periodo=mes
```

Cada elemento representará:

```text
un día
```

---

# 94. Serie anual

```http
GET /api/estadisticas/serie?periodo=anio
```

Cada elemento representará:

```text
un mes
```

---

# 95. Período inválido

Ejemplo:

```http
GET /api/estadisticas/serie?periodo=cinco-anios
```

Respuesta:

```http
422 Unprocessable Content
```

```json
{
  "error": {
    "codigo": "ESTADISTICA_PERIODO_INVALIDO",
    "mensaje": "El período solicitado no es válido."
  }
}
```

---

# 96. Sin lecturas

Si la aplicación acaba de instalarse:

```text
0 lecturas
```

el dashboard no falla.

Respuesta conceptual:

```json
{
  "ultimaLectura": null,
  "ayer": {
    "consumo": null,
    "estado": "SIN_DATOS"
  },
  "ultimos7Dias": {
    "consumo": null,
    "estado": "SIN_DATOS"
  },
  "mesActual": {
    "consumo": null,
    "estado": "SIN_DATOS"
  },
  "anioActual": {
    "consumo": null,
    "estado": "SIN_DATOS"
  }
}
```

---

# 97. Una sola lectura

Con:

```text
30/08 → 12555
```

tenemos:

```text
ultimaLectura = 12555
```

pero todavía:

```text
consumos = null
```

Esto no constituye un error.

---

# 98. Dos lecturas consecutivas

```text
29 → 12547
30 → 12555
```

Ya conocemos:

```text
30 → 8 kWh
```

pero quizá todavía no tengamos información suficiente para totales mensuales o anuales completos.

---

# 99. No extrapolación

El MVP nunca hará:

```text
consumo 10 días = 100
entonces consumo mensual estimado = 300
```

No habrá predicciones en esta fase.

---

# 100. No completar meses futuros

Tampoco:

```text
Enero-Ago = 2000
Sep-Dic = estimado
```

El año muestra únicamente consumo observado hasta la fecha disponible.

---

# 101. No interpolación

No utilizaremos métodos como:

```text
promedio
interpolación lineal
machine learning
```

para rellenar días faltantes.

---

# 102. Códigos de estado de datos

Inicialmente utilizaremos:

```text
COMPLETO
PARCIAL
SIN_DATOS
CONOCIDO
SIN_LECTURA
SIN_BASE
NO_APLICA
```

No todos se utilizan en el mismo nivel.

---

# 103. Estados de períodos

Para tarjetas:

```text
COMPLETO
PARCIAL
SIN_DATOS
```

---

# 104. Estados de puntos de gráfica

```text
CONOCIDO
SIN_LECTURA
SIN_BASE
NO_APLICA
```

---

# 105. Errores de estadísticas

Inicialmente:

```text
ESTADISTICA_PERIODO_INVALIDO
ESTADISTICA_RANGO_INVALIDO
```

La ausencia de datos no debe utilizar un error HTTP.

---

# 106. Pruebas de consumo diario

La implementación deberá probar:

```text
lecturas consecutivas
lecturas iguales
lectura inicial
un día faltante
varios días faltantes
```

---

# 107. Pruebas de ayer

```text
ayer conocido
falta ayer
falta anteayer
sin lecturas
```

---

# 108. Pruebas últimos 7 días

```text
7 días completos
día intermedio faltante
varios días faltantes
sin lectura base
sin lectura final de hoy
inicio reciente del sistema
```

---

# 109. Pruebas mensuales

```text
mes completo
mes actual
lectura base existente
lectura base ausente
días internos faltantes
solo una lectura
```

---

# 110. Pruebas anuales

```text
año completo
año actual
primer año del sistema
meses futuros
inicio a mitad del año
```

---

# 111. Pruebas estadísticas

```text
promedio entero
promedio decimal
máximo
mínimo
empate máximo
empate mínimo
cero válido
NULL excluido
```

---

# 112. Prueba crítica 1

Datos:

```text
28 → 1000
30 → 1015
```

Esperado:

```text
consumo diario 29 = null
consumo diario 30 = null

intervalo:
28 → 30 = 15
```

Nunca:

```text
29 = 7.5
30 = 7.5
```

---

# 113. Prueba crítica 2

Datos:

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

Esperado:

```text
consumo acumulado 24-30 = 48
```

pero:

```text
26 = null
27 = null
```

Cobertura diaria:

```text
5 / 7
```

---

# 114. Prueba crítica 3

Después ADMIN agrega:

```text
26 → 1018
```

Automáticamente:

```text
26 = 6
27 = 8
```

La cobertura aumenta.

No se actualiza ninguna tabla de consumo.

---

# 115. Prueba crítica 4

Datos:

```text
29 → 1000
30 → 1000
```

Resultado:

```text
30 = 0
```

Debe participar en:

```text
mínimo
promedio
gráfica
```

No debe confundirse con `null`.

---

# 116. Invariantes

### EST-INV-001

Todo consumo procede de diferencias entre lecturas reales.

### EST-INV-002

El sistema nunca recibe el consumo como fuente de verdad.

### EST-INV-003

Un consumo diario requiere dos fechas consecutivas con lectura.

### EST-INV-004

Un día desconocido nunca se transforma en cero.

### EST-INV-005

Un valor cero conocido nunca se transforma en desconocido.

### EST-INV-006

Los intervalos faltantes nunca se distribuyen artificialmente.

### EST-INV-007

Los promedios utilizan únicamente consumos diarios conocidos.

### EST-INV-008

Máximos y mínimos utilizan únicamente consumos diarios conocidos.

### EST-INV-009

Los totales parciales siempre deben identificarse como parciales.

### EST-INV-010

Los períodos actuales indican hasta qué fecha contienen información.

### EST-INV-011

No existen predicciones durante el MVP.

### EST-INV-012

No existen estimaciones de días faltantes.

### EST-INV-013

Corregir o agregar una lectura modifica automáticamente cualquier estadística derivada.

---

# 117. Decisiones congeladas por SPEC-005

1. El consumo continúa siendo un dato derivado.
2. El consumo diario requiere lecturas de días consecutivos.
3. `0` y `null` tienen significados diferentes.
4. Ayer requiere lectura de ayer y anteayer.
5. La vista semanal significa últimos 7 días.
6. El gráfico semanal siempre representa siete fechas.
7. Los huecos no generan barras falsas.
8. Los intervalos pueden tener consumo total aunque no tengan desglose diario.
9. Los períodos pueden ser `COMPLETO`, `PARCIAL` o `SIN_DATOS`.
10. Los períodos parciales deben identificarse visualmente.
11. Mes significa mes calendario.
12. Año significa año calendario.
13. Mes y año actuales llegan hasta la última lectura disponible.
14. El promedio puede contener decimales.
15. Las lecturas y consumos individuales continúan siendo enteros.
16. Máximo y mínimo ignoran valores desconocidos.
17. Cero participa en las estadísticas.
18. Los empates se conservan.
19. Se calculará cobertura diaria.
20. El total acumulado no se sustituirá por la simple suma de días conocidos cuando existan huecos.
21. No habrá interpolación.
22. No habrá predicción.
23. No habrá tablas de estadísticas.
24. Se utilizará `LAG()` cuando resulte apropiado.
25. Los cálculos con lectura anterior deben realizarse antes de eliminar la lectura base necesaria para el rango.
26. La API expondrá resumen y series estadísticas.

---

# 118. Resultado conceptual del dashboard

Con información completa podríamos mostrar:

```text
┌─────────────────────────────────────────────────┐
│ CONSUMO ELÉCTRICO                               │
│                                                 │
│ Ayer       7 días       Mes          Año        │
│ 8 kWh      51 kWh       218 kWh      2470 kWh   │
│                                                 │
│ Últimos 7 días                                  │
│                                                 │
│ 12 │              █                             │
│ 10 │       █      █                             │
│  8 │   █   █      █  █                          │
│  6 │ █ █   █ █    █  █                          │
│  4 │ █ █ █ █ █ █  █  █                          │
│    └────────────────────────                    │
│      L M X J V S D                              │
│                                                 │
│ Promedio                7.3 kWh                 │
│ Mayor consumo           11 kWh                  │
│ Cobertura               100 %                   │
│ Última lectura          12555                   │
└─────────────────────────────────────────────────┘
```

---

# 119. Dashboard con información incompleta

Podría representar:

```text
Últimos 7 días
48 kWh

Detalle diario: 71 % completo
```

Y:

```text
L   M   X   J   V   S   D
█   █   ?   ?   █   █   █
```

Los:

```text
?
```

no representan cero.

Representan:

```text
consumo diario no determinable
```

---

# 120. Criterio de finalización de SPEC-005

Un aprendiz debería poder explicar:

1. ¿Cómo se calcula un consumo diario?
2. ¿Por qué hacen falta dos lecturas?
3. ¿Cuál es la diferencia entre `0` y `null`?
4. ¿Qué ocurre si falta un día?
5. ¿Qué es un consumo de intervalo?
6. ¿Por qué no dividimos un intervalo entre sus días?
7. ¿Cómo calculamos el consumo de ayer?
8. ¿Qué significa “últimos 7 días”?
9. ¿Por qué necesitamos una lectura anterior al inicio del rango?
10. ¿Puede conocerse el total de un período aunque falte una lectura intermedia?
11. ¿Puede estar incompleto el gráfico aunque el total acumulado sea conocido?
12. ¿Qué significa cobertura?
13. ¿Qué significa período parcial?
14. ¿Cómo se calcula un promedio?
15. ¿Los valores `null` participan en el promedio?
16. ¿Un consumo de cero participa?
17. ¿Cómo se calcula el máximo?
18. ¿Cómo tratamos empates?
19. ¿Por qué no almacenamos estadísticas?
20. ¿Qué riesgo existe al filtrar antes de utilizar `LAG()`?
21. ¿Por qué no estimamos los días faltantes?
22. ¿Qué ocurre automáticamente si una lectura histórica es corregida?

Cuando estas respuestas sean claras, `SPEC-005` estará lista para implementación futura.
