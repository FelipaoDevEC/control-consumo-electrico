# SPEC-006 — Historial de lecturas y trazabilidad

## 1. Objetivo

Definir cómo se consultarán y presentarán las lecturas históricas del medidor.

Esta especificación establece:

* estructura del historial;
* ordenamiento;
* paginación;
* filtros;
* búsqueda por fechas;
* visualización de consumo diario;
* visualización de intervalos incompletos;
* identificación de lectura base;
* identificación de correcciones;
* quién registró una lectura;
* quién corrigió una lectura;
* permisos de edición;
* comportamiento responsive.

El historial debe permitir responder fácilmente:

* ¿qué lectura se registró determinado día?
* ¿cuánto se consumió?
* ¿quién registró la lectura?
* ¿fue corregida?
* ¿quién la corrigió?
* ¿faltan mediciones?
* ¿puedo modificarla?

---

# 2. Principio principal

El historial no será únicamente una tabla de números.

Debe explicar correctamente lo que ocurrió.

Por ejemplo:

```text
30 Ago
Lectura: 12555
Consumo: 8 kWh
```

pero si falta información:

```text
30 Ago
Lectura: 12555
Consumo diario: No disponible
Intervalo desde 28 Ago: 15 kWh
```

El sistema nunca debe presentar datos incompletos como si fueran exactos.

---

# 3. Acceso

Podrán consultar el historial:

```text
ADMIN
USUARIO
```

Ambos ven las mismas lecturas porque existe un único medidor compartido.

---

# 4. Endpoint principal

```http
GET /api/lecturas
```

Será el endpoint principal para alimentar la pantalla de historial.

---

# 5. Orden por defecto

Las lecturas se mostrarán:

```text
más reciente
↓
más antigua
```

Conceptualmente:

```sql
ORDER BY fecha_lectura DESC
```

---

# 6. Ejemplo visual

```text
30 Ago 2026    12555    8 kWh
29 Ago 2026    12547    7 kWh
28 Ago 2026    12540    6 kWh
27 Ago 2026    12534    Base
```

---

# 7. Paginación

El historial utilizará paginación.

Valores iniciales:

```text
pagina = 1
limite = 30
```

Máximo:

```text
100
```

Ejemplo:

```http
GET /api/lecturas?pagina=1&limite=30
```

---

# 8. Respuesta paginada

```json
{
  "datos": [],
  "paginacion": {
    "pagina": 1,
    "limite": 30,
    "total": 87,
    "totalPaginas": 3
  }
}
```

---

# 9. Filtro por fecha

Se podrá consultar un intervalo:

```http
GET /api/lecturas?desde=2026-08-01&hasta=2026-08-31
```

Los parámetros serán opcionales.

---

# 10. Solo `desde`

Ejemplo:

```http
GET /api/lecturas?desde=2026-08-15
```

Significa:

> Mostrar lecturas desde el 15 de agosto hasta la fecha disponible más reciente.

---

# 11. Solo `hasta`

```http
GET /api/lecturas?hasta=2026-08-15
```

Significa:

> Mostrar lecturas hasta el 15 de agosto.

---

# 12. Validación del rango

Si:

```text
desde > hasta
```

la solicitud será inválida.

Ejemplo:

```text
desde = 30/08
hasta = 01/08
```

Respuesta:

```http
422 Unprocessable Content
```

Código:

```text
LECTURA_RANGO_INVALIDO
```

---

# 13. No habrá búsqueda textual

Durante el MVP no necesitamos una caja de búsqueda como:

```text
Buscar...
```

porque el historial contiene principalmente:

```text
fecha
lectura
consumo
usuario
```

El filtro principal será por fechas.

---

# 14. Filtros rápidos

La interfaz podrá ofrecer:

```text
Últimos 7 días
Este mes
Mes anterior
Este año
Personalizado
```

Estos filtros son ayudas visuales.

La API continuará utilizando rangos de fecha explícitos.

---

# 15. Estructura de cada lectura

Cada elemento del historial deberá incluir al menos:

```text
idLectura
fechaLectura
valorLectura
consumoDiario
estadoConsumo
registradoPor
registradoEn
fueCorregida
```

---

# 16. Ejemplo de lectura normal

```json
{
  "idLectura": 25,
  "fechaLectura": "2026-08-30",
  "valorLectura": 12555,
  "consumoDiario": 8,
  "estadoConsumo": "CONOCIDO",
  "registradoPor": {
    "idUsuario": 2,
    "nombre": "Usuario Casa"
  },
  "registradoEn": "2026-08-30T19:42:18-05:00",
  "fueCorregida": false
}
```

---

# 17. Lectura base

La primera lectura cronológica tendrá:

```text
consumoDiario = null
estadoConsumo = BASE
```

Ejemplo:

```json
{
  "fechaLectura": "2026-08-01",
  "valorLectura": 12000,
  "consumoDiario": null,
  "estadoConsumo": "BASE"
}
```

La interfaz mostrará:

```text
Lectura inicial
```

o:

```text
Base
```

Nunca:

```text
0 kWh
```

---

# 18. Consumo conocido

Cuando existe lectura del día anterior:

```text
estadoConsumo = CONOCIDO
```

Ejemplo:

```text
29 Ago
12547
7 kWh
```

---

# 19. Sin lectura anterior inmediata

Si existen:

```text
28 Ago → 12540
30 Ago → 12555
```

la lectura del 30 tendrá:

```text
consumoDiario = null
estadoConsumo = SIN_BASE_DIARIA
```

---

# 20. Intervalo conocido

En ese caso se puede incluir:

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

---

# 21. Presentación del intervalo

La interfaz podrá mostrar:

```text
Consumo diario
No disponible

15 kWh entre 28 y 30 Ago
```

Así el usuario obtiene información útil sin interpretar mal el dato.

---

# 22. Día sin registro

El historial principal muestra registros existentes.

Por tanto, si no hubo lectura el:

```text
29 Ago
```

no existirá una fila de lectura ficticia para ese día.

Sin embargo, la interfaz podrá indicar dentro del intervalo:

```text
Falta lectura del 29 Ago
```

---

# 23. No crear filas falsas

Nunca crearemos registros como:

```text
29 Ago
Lectura: -
Consumo: -
```

dentro de la tabla principal si no existe realmente una fila en PostgreSQL.

Si queremos visualizar días faltantes, se hará mediante indicadores derivados.

---

# 24. Estado de corrección

Una lectura estará corregida cuando:

```text
id_usuario_actualizacion IS NOT NULL
```

y el valor haya sido modificado realmente.

---

# 25. Lectura no corregida

```json
{
  "fueCorregida": false,
  "actualizadoPor": null,
  "actualizadoEn": null
}
```

---

# 26. Lectura corregida

```json
{
  "fueCorregida": true,
  "actualizadoPor": {
    "idUsuario": 1,
    "nombre": "Administrador"
  },
  "actualizadoEn": "2026-08-30T20:17:42-05:00"
}
```

---

# 27. Presentación visual

Ejemplo:

```text
29 Ago 2026
Lectura: 12549
Consumo: 9 kWh

Corregida
```

Al abrir detalles:

```text
Registró:
Usuario Casa

30 Ago 2026 - 19:30

Última corrección:
Administrador

30 Ago 2026 - 20:17
```

---

# 28. Auditoría mínima

Durante el MVP solo conservamos:

```text
quién creó
cuándo creó
quién realizó la última corrección
cuándo realizó la última corrección
```

No conservamos todavía:

```text
valor anterior
valor nuevo
todas las modificaciones históricas
```

---

# 29. Limitación reconocida

Si una lectura es modificada varias veces:

```text
12547
→ 12548
→ 12549
```

SPEC-002 solamente conserva:

```text
valor actual = 12549
último usuario que corrigió
última fecha de corrección
```

No conserva automáticamente:

```text
12547
12548
```

---

# 30. Auditoría completa futura

En una fase posterior podremos introducir:

```text
historial_cambios_lectura
```

con algo como:

```text
valor_anterior
valor_nuevo
usuario
fecha
motivo
```

Pero queda fuera del MVP.

---

# 31. Detalle de lectura

Endpoint:

```http
GET /api/lecturas/:id
```

Debe devolver más detalle que una fila normal del listado.

---

# 32. Respuesta conceptual

```json
{
  "idLectura": 25,
  "fechaLectura": "2026-08-30",
  "valorLectura": 12555,

  "consumo": {
    "diario": 8,
    "estado": "CONOCIDO"
  },

  "lecturaAnterior": {
    "fecha": "2026-08-29",
    "valor": 12547
  },

  "lecturaSiguiente": null,

  "registradoPor": {
    "idUsuario": 2,
    "nombre": "Usuario Casa"
  },

  "registradoEn": "2026-08-30T19:42:18-05:00",

  "correccion": null
}
```

---

# 33. Detalle con corrección

```json
{
  "correccion": {
    "fueCorregida": true,
    "actualizadoPor": {
      "idUsuario": 1,
      "nombre": "Administrador"
    },
    "actualizadoEn": "2026-08-30T20:17:42-05:00"
  }
}
```

---

# 34. Lectura anterior y siguiente

Mostrar estas lecturas ayuda a comprender por qué existen límites para corregir.

Ejemplo:

```text
Anterior
28 Ago → 12540

Actual
29 Ago → 12549

Siguiente
30 Ago → 12555
```

Esto también puede ayudar al ADMIN durante una corrección histórica.

---

# 35. Permiso de edición derivado

La API podrá devolver:

```text
puedeEditar
```

para ayudar al frontend.

Ejemplo:

```json
{
  "puedeEditar": true
}
```

Pero esto es únicamente información de interfaz.

---

# 36. Backend sigue siendo autoridad

Aunque React reciba:

```text
puedeEditar = true
```

la llamada:

```http
PATCH /api/lecturas/:id
```

volverá a validar todos los permisos.

Nunca dependeremos únicamente del valor recibido previamente.

---

# 37. Regla para ADMIN

Para ADMIN:

```text
puedeEditar = true
```

en lecturas presentes e históricas, salvo situaciones no permitidas por reglas futuras.

---

# 38. Regla para USUARIO

Para USUARIO:

```text
puedeEditar = true
```

solo si:

```text
fechaLectura = hoy
```

según:

```text
America/Guayaquil
```

---

# 39. Fila del historial en escritorio

Propuesta conceptual:

```text
┌────────────┬──────────┬─────────┬──────────────┬─────────────┐
│ Fecha      │ Lectura  │ Consumo │ Registrado   │ Estado      │
├────────────┼──────────┼─────────┼──────────────┼─────────────┤
│ 30 Ago     │ 12555    │ 8 kWh   │ Usuario Casa │ Normal      │
│ 29 Ago     │ 12547    │ 7 kWh   │ Admin        │ Corregida   │
│ 28 Ago     │ 12540    │ —       │ Usuario Casa │ Base        │
└────────────┴──────────┴─────────┴──────────────┴─────────────┘
```

---

# 40. Acciones de fila

Podrán incluir:

```text
Ver detalle
Editar
```

`Editar` solamente aparecerá cuando corresponda.

---

# 41. No utilizar demasiadas acciones

No tendremos durante el MVP:

```text
Duplicar
Eliminar
Exportar fila
Compartir
Archivar
Restaurar
```

La interfaz debe mantenerse minimalista.

---

# 42. Vista móvil

En móviles evitaremos una tabla horizontal enorme.

Cada lectura se mostrará como tarjeta o fila compacta.

Ejemplo:

```text
┌──────────────────────────┐
│ 30 Ago 2026              │
│                          │
│ Lectura       12 555     │
│ Consumo          8 kWh   │
│                          │
│ Usuario Casa             │
│                 Ver  >   │
└──────────────────────────┘
```

---

# 43. Lectura corregida en móvil

```text
┌──────────────────────────┐
│ 29 Ago 2026    Corregida │
│                          │
│ Lectura       12 547     │
│ Consumo          7 kWh   │
│                          │
│                 Ver  >   │
└──────────────────────────┘
```

---

# 44. Intervalo incompleto en móvil

```text
┌──────────────────────────┐
│ 30 Ago 2026              │
│                          │
│ Lectura       12 555     │
│ Consumo          —       │
│                          │
│ Falta lectura anterior   │
│ 15 kWh entre 28–30 Ago   │
└──────────────────────────┘
```

---

# 45. Formato numérico

Aunque se almacena:

```text
12555
```

la interfaz puede mostrar:

```text
12 555
```

o según configuración regional:

```text
12.555
```

Pero internamente sigue siendo:

```text
12555
```

---

# 46. No incluir decimales en lecturas

Nunca:

```text
12 555.00
```

Las lecturas se muestran como enteros.

---

# 47. Consumos diarios

También serán enteros:

```text
8 kWh
```

No:

```text
8.00 kWh
```

---

# 48. Estadísticas derivadas

Si en algún detalle se muestra promedio:

```text
7.4 kWh
```

sí puede contener decimal.

Esto no modifica el formato de la lectura.

---

# 49. Formato de fechas

La API continúa usando:

```text
YYYY-MM-DD
```

Ejemplo:

```text
2026-08-30
```

React podrá presentarlo como:

```text
30 Ago 2026
```

---

# 50. No enviar fechas ya formateadas desde backend

Evitar:

```json
{
  "fecha": "30 de agosto del 2026"
}
```

La API debe devolver datos estructurados.

El frontend decide la presentación.

---

# 51. Hora

En detalles:

```text
19:42
```

o:

```text
19:42:18
```

según necesidad.

En el historial principal no es necesario mostrar la hora todo el tiempo.

---

# 52. Estado visual de una lectura

Podremos manejar:

```text
BASE
NORMAL
CORREGIDA
INCOMPLETA
```

Estos son estados de presentación.

No necesariamente deben almacenarse en PostgreSQL.

---

# 53. BASE

Se deriva cuando la lectura no tiene una lectura cronológicamente anterior.

---

# 54. NORMAL

Lectura sin corrección y con secuencia normal.

---

# 55. CORREGIDA

Se deriva de:

```text
id_usuario_actualizacion != null
```

---

# 56. INCOMPLETA

Se utiliza visualmente cuando:

```text
consumoDiario = null
```

debido a una interrupción entre lecturas.

---

# 57. Prioridad de presentación

Una lectura puede ser simultáneamente:

```text
CORREGIDA
+
INCOMPLETA
```

No deberemos obligarnos a reducir toda la información a un único estado.

Ejemplo:

```json
{
  "fueCorregida": true,
  "estadoConsumo": "SIN_BASE_DIARIA"
}
```

---

# 58. Filtro por usuario

Durante el MVP no es necesario para usuarios normales.

Pero ADMIN podrá eventualmente querer saber:

> ¿qué lecturas registró cada usuario?

Podemos admitir opcionalmente:

```http
GET /api/lecturas?idUsuario=2
```

solo para ADMIN.

---

# 59. Decisión MVP

El filtro por usuario no será obligatorio en la primera interfaz.

La API puede reservarlo para implementación posterior si no aporta valor inmediato.

---

# 60. Filtro por estado

Tampoco necesitamos inicialmente filtros como:

```text
Solo corregidas
Solo incompletas
Solo base
```

Podrán añadirse posteriormente.

La pantalla principal debe mantenerse simple.

---

# 61. Vista vacía

Si no existen lecturas:

```text
Aún no hay lecturas registradas.
```

CTA:

```text
Registrar primera lectura
```

si el usuario puede hacerlo.

---

# 62. Ejemplo de estado vacío

```text
┌─────────────────────────────┐
│                             │
│        ⚡                   │
│                             │
│ Aún no hay lecturas         │
│                             │
│ Registra la numeración      │
│ actual de tu medidor.       │
│                             │
│ [ Registrar lectura ]       │
└─────────────────────────────┘
```

---

# 63. Historial sin resultados de filtro

Si existen lecturas pero el rango seleccionado no contiene ninguna:

```text
No hay lecturas en este período.
```

No mostrar:

```text
No existen datos en el sistema.
```

porque sería incorrecto.

---

# 64. Carga

Mientras se consulta:

```text
skeleton
```

o indicador simple.

No bloquear toda la aplicación innecesariamente.

---

# 65. Error de carga

Ejemplo:

```text
No se pudo cargar el historial.
```

Acción:

```text
Reintentar
```

---

# 66. No mostrar errores técnicos

Nunca:

```text
ECONNREFUSED
PostgreSQL error 23505
TypeError...
```

al usuario.

Los detalles técnicos quedan en logs.

---

# 67. Exportación

No habrá durante el MVP:

```text
CSV
Excel
PDF
```

Esto queda para una fase posterior.

---

# 68. Diseño de endpoint

Ejemplo:

```http
GET /api/lecturas
    ?desde=2026-08-01
    &hasta=2026-08-31
    &pagina=1
    &limite=30
```

---

# 69. Respuesta completa conceptual

```json
{
  "datos": [
    {
      "idLectura": 25,
      "fechaLectura": "2026-08-30",
      "valorLectura": 12555,

      "consumo": {
        "valor": 8,
        "estado": "CONOCIDO",
        "intervalo": null
      },

      "registradoPor": {
        "idUsuario": 2,
        "nombre": "Usuario Casa"
      },

      "registradoEn": "2026-08-30T19:42:18-05:00",

      "correccion": {
        "fueCorregida": false,
        "actualizadoPor": null,
        "actualizadoEn": null
      },

      "puedeEditar": true
    }
  ],

  "paginacion": {
    "pagina": 1,
    "limite": 30,
    "total": 30,
    "totalPaginas": 1
  }
}
```

---

# 70. Respuesta con intervalo

```json
{
  "idLectura": 25,
  "fechaLectura": "2026-08-30",
  "valorLectura": 12555,

  "consumo": {
    "valor": null,
    "estado": "SIN_BASE_DIARIA",

    "intervalo": {
      "desde": "2026-08-28",
      "hasta": "2026-08-30",
      "dias": 2,
      "consumo": 15
    }
  }
}
```

---

# 71. Consulta eficiente

El repositorio deberá recuperar:

```text
lectura actual
lectura anterior
usuario de registro
usuario de actualización
```

sin provocar una consulta nueva por cada fila.

Debemos evitar el problema:

```text
N+1 queries
```

---

# 72. Estrategia SQL

Podemos resolver la lectura anterior mediante:

```text
LAG()
```

y los usuarios mediante:

```text
JOIN
```

---

# 73. Concepto de consulta

```sql
SELECT
    lectura,
    usuario_registro,
    usuario_actualizacion,
    LAG(fecha_lectura),
    LAG(valor_lectura)
FROM ...
```

La implementación exacta se escribirá posteriormente.

---

# 74. Lectura anterior fuera del filtro

Este detalle vuelve a ser importante.

Supongamos que consultamos:

```text
desde = 01/08
```

Para calcular correctamente el consumo del:

```text
01/08
```

podríamos necesitar:

```text
31/07
```

aunque esa lectura no vaya a mostrarse.

---

# 75. Regla HIS-001

El repositorio debe permitir recuperar el contexto anterior necesario antes de recortar los resultados visibles.

No debe calcular:

```text
LAG()
```

después de destruir el contexto cronológico.

---

# 76. Consumo y paginación

Existe un problema parecido con páginas.

Si la página comienza en:

```text
20/08
```

para calcular el consumo de esa lectura necesitamos potencialmente:

```text
19/08
```

aunque esa fila pertenezca a otra página.

---

# 77. Regla HIS-002

La paginación no debe alterar el resultado del cálculo de consumo.

El consumo de una lectura debe ser idéntico:

```text
en página 1
en página 2
en consulta individual
```

---

# 78. Corrección desde historial

Al seleccionar:

```text
Editar
```

React abrirá un formulario con:

```text
Fecha
Lectura actual
Nueva lectura
```

La fecha será solo informativa.

No editable.

---

# 79. Ejemplo

```text
Corregir lectura

Fecha
29 Ago 2026

Lectura actual
12547

Nueva lectura
[ 12549 ]

[ Cancelar ] [ Guardar ]
```

---

# 80. Ayuda contextual

Si existen límites conocidos:

```text
Anterior: 12540
Siguiente: 12555
```

la interfaz puede indicar:

```text
Valor permitido: entre 12540 y 12555
```

Esto mejora la experiencia.

---

# 81. Backend sigue validando

Aunque React muestre el rango:

```text
12540 – 12555
```

el backend deberá volver a obtener las lecturas anterior y siguiente antes del `UPDATE`.

---

# 82. Confirmación

Para modificar una lectura no necesitamos un modal dramático.

Puede ser suficiente:

```text
Guardar corrección
```

y mensaje posterior:

```text
Lectura actualizada correctamente.
```

---

# 83. Actualización del historial

Después de corregir:

```text
PATCH /api/lecturas/:id
```

React deberá actualizar:

```text
fila modificada
consumo del día afectado
consumo del día siguiente
resumen del dashboard si está cacheado
```

---

# 84. Por qué puede cambiar la fila siguiente

Ejemplo:

Antes:

```text
28 → 1000
29 → 1008
30 → 1015
```

Consumos:

```text
29 → 8
30 → 7
```

Corregimos:

```text
29 → 1010
```

Ahora:

```text
29 → 10
30 → 5
```

Por tanto no basta con modificar visualmente una sola celda sin recalcular datos derivados.

---

# 85. Estrategia frontend recomendada

Después de una corrección, la versión inicial puede simplemente:

```text
volver a consultar el historial
```

en lugar de intentar recalcular todo manualmente en React.

Esto reduce errores y mantiene al backend como fuente de verdad.

---

# 86. Trazabilidad mínima

En detalle deberá poder responderse:

```text
¿Quién registró?
¿Cuándo?
¿Fue corregida?
¿Quién corrigió?
¿Cuándo?
```

---

# 87. No mostrar información innecesaria

No necesitamos mostrar al usuario normal:

```text
idLectura = 142
idUsuario = 2
idMedidor = 1
```

Estos identificadores son internos.

---

# 88. ADMIN puede ver IDs en herramientas técnicas

La interfaz administrativa tampoco necesita mostrarlos salvo que exista una necesidad concreta.

Los IDs existen para el sistema, no para decorar la UI.

---

# 89. Privacidad

Los usuarios solo verán nombres necesarios.

No mostraremos:

```text
password hashes
sesiones
tokens
datos técnicos de autenticación
```

dentro del historial.

---

# 90. Pruebas mínimas del historial

La implementación deberá probar:

```text
historial vacío
una lectura
varias lecturas
orden descendente
paginación
primera página
última página
límite máximo
filtro desde
filtro hasta
filtro desde-hasta
rango inválido
```

---

# 91. Pruebas de consumo

```text
lectura base
consumo conocido
consumo cero
día faltante
intervalo de dos días
intervalo de varios días
```

---

# 92. Pruebas de trazabilidad

```text
lectura nunca corregida
lectura corregida por ADMIN
lectura corregida por USUARIO
registro conserva creador original
último corrector visible
```

---

# 93. Pruebas de permisos

```text
ADMIN puede editar histórico
USUARIO no puede editar histórico
USUARIO puede editar hoy
ADMIN puede editar hoy
```

---

# 94. Prueba crítica de paginación

Una lectura no debe obtener un consumo diferente por encontrarse en el inicio de una página.

Ejemplo:

```text
página 1 → 30 Ago
página 2 → 29 Ago
```

El cálculo de:

```text
30 Ago
```

debe seguir utilizando:

```text
29 Ago
```

aunque visualmente esté en otra página.

---

# 95. Prueba crítica de filtro

Existe:

```text
31 Jul → 1000
01 Ago → 1005
```

Consulta:

```text
desde=01/08
```

Debe devolver:

```text
01 Ago → 5 kWh
```

aunque:

```text
31 Jul
```

no aparezca en los resultados visibles.

---

# 96. Prueba crítica de corrección

Antes:

```text
28 → 1000
29 → 1008
30 → 1015
```

Después de:

```text
29 → 1010
```

historial debe reflejar:

```text
29 → 10 kWh
30 → 5 kWh
```

---

# 97. Invariantes

### HIS-INV-001

El historial muestra únicamente lecturas reales.

### HIS-INV-002

Los días sin lectura no crean registros ficticios.

### HIS-INV-003

El consumo mostrado sigue las reglas de SPEC-005.

### HIS-INV-004

`0` nunca se presenta como dato faltante.

### HIS-INV-005

`null` nunca se presenta como cero.

### HIS-INV-006

Una lectura base se identifica como tal.

### HIS-INV-007

Una corrección nunca reemplaza la identidad del creador original.

### HIS-INV-008

El sistema conserva el último usuario que realizó una corrección.

### HIS-INV-009

La paginación no altera cálculos.

### HIS-INV-010

Los filtros no eliminan el contexto necesario para calcular correctamente.

### HIS-INV-011

La fecha de una lectura no puede modificarse desde el historial.

### HIS-INV-012

Los permisos de edición siempre se validan nuevamente en backend.

---

# 98. Decisiones congeladas por SPEC-006

1. El historial será accesible para ADMIN y USUARIO.
2. El orden inicial será de más reciente a más antiguo.
3. Habrá paginación.
4. Límite inicial de 30.
5. Máximo de 100.
6. Habrá filtros por fechas.
7. No habrá búsqueda textual en el MVP.
8. No habrá exportación en el MVP.
9. El historial puede mostrar consumo derivado.
10. La lectura inicial mostrará estado BASE.
11. Los intervalos incompletos no se mostrarán como consumo diario.
12. No se crearán filas falsas para días sin lectura.
13. Se mostrará quién registró una lectura.
14. Se mostrará si fue corregida.
15. Se mostrará quién realizó la última corrección.
16. No habrá auditoría completa de todos los valores anteriores durante el MVP.
17. La fecha de una lectura no será editable.
18. La interfaz de escritorio podrá utilizar tabla.
19. La interfaz móvil utilizará tarjetas o filas adaptadas.
20. El frontend puede recibir `puedeEditar`.
21. El backend seguirá siendo la autoridad real.
22. La paginación no debe modificar los cálculos.
23. Los filtros tampoco deben modificar los cálculos.
24. Después de una corrección se recomienda volver a consultar los datos derivados.

---

# 99. Resultado visual esperado

## Escritorio

```text
Historial de lecturas

[ Este mes ▼ ]       01 Ago — 30 Ago

┌──────────┬──────────┬──────────┬──────────────┬────────────┐
│ Fecha    │ Lectura  │ Consumo  │ Registrado   │ Estado     │
├──────────┼──────────┼──────────┼──────────────┼────────────┤
│ 30 Ago   │ 12 555   │ 8 kWh    │ Usuario Casa │ Normal     │
│ 29 Ago   │ 12 547   │ 7 kWh    │ Admin        │ Corregida  │
│ 28 Ago   │ 12 540   │ —        │ Usuario Casa │ Base       │
└──────────┴──────────┴──────────┴──────────────┴────────────┘

                 ‹ 1 2 3 ›
```

---

# 100. Resultado móvil esperado

```text
Historial

[ Este mes ▼ ]

30 Ago 2026
12 555
8 kWh
Usuario Casa                         >

29 Ago 2026                  Corregida
12 547
7 kWh
Administrador                        >

28 Ago 2026                       Base
12 540
Consumo no disponible               >
```

---

# 101. Criterio de finalización de SPEC-006

Un aprendiz debería poder responder:

1. ¿Qué información debe mostrar el historial?
2. ¿Por qué se ordena de forma descendente?
3. ¿Por qué necesitamos paginación?
4. ¿Qué ocurre con los días sin lectura?
5. ¿Por qué no creamos filas falsas?
6. ¿Cómo representamos una lectura base?
7. ¿Cómo mostramos un intervalo incompleto?
8. ¿Cómo sabemos quién registró una lectura?
9. ¿Cómo sabemos quién la corrigió?
10. ¿Conservamos todos los valores anteriores?
11. ¿Puede cambiarse la fecha desde el historial?
12. ¿Quién puede editar históricos?
13. ¿Por qué `puedeEditar` no es una medida de seguridad?
14. ¿Por qué la paginación no debe afectar el cálculo?
15. ¿Por qué un filtro puede necesitar una lectura fuera de su rango visible?
16. ¿Qué debe hacer React después de una corrección?
17. ¿Por qué una corrección puede cambiar el consumo del día siguiente?

Si estas respuestas están claras, `SPEC-006` está definida.
