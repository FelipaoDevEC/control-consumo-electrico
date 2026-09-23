# CHECKPOINT 5 — Registro, consulta y corrección de lecturas

## 1. Objetivo

Implementar completamente el backend de lecturas definido principalmente en `SPEC-004` y `SPEC-006`.

Al finalizar este checkpoint tendremos:

* obtención del medidor principal;
* registro de la primera lectura;
* registro diario de lecturas;
* lecturas exclusivamente enteras;
* una sola lectura por día;
* rechazo de fechas futuras;
* `USUARIO` limitado a registrar hoy;
* `ADMIN` capaz de registrar históricos;
* validación contra lectura anterior;
* validación contra lectura siguiente;
* corrección de la lectura de hoy;
* corrección histórica por ADMIN;
* consulta de última lectura;
* consulta individual;
* historial paginado;
* filtros por fechas;
* consumo diario derivado;
* detección de intervalos sin lectura;
* trazabilidad de quién registró y quién corrigió;
* protección frente a concurrencia mediante transacciones y `FOR UPDATE`;
* pruebas automatizadas completas.

Todavía NO implementaremos:

```text
dashboard
promedios
máximos
mínimos
totales mensuales
totales anuales
gráficos
frontend de lecturas
```

Eso corresponderá principalmente a `CHECKPOINT 6` en adelante.

---

# 2. Precondiciones

Deben estar cerrados:

```text
CHECKPOINT 0 → CERRADO
CHECKPOINT 1 → CERRADO
CHECKPOINT 2 → CERRADO
CHECKPOINT 3 → CERRADO
CHECKPOINT 4 → CERRADO
```

Debe existir:

```text
usuarios
medidores
lecturas_medidor
sesiones
```

Y debemos tener al menos:

```text
1 ADMIN ACTIVO
1 Medidor principal ACTIVO
```

---

# 3. SPEC relacionadas

Principalmente:

```text
SPEC-001 → reglas del dominio
SPEC-002 → modelo de datos
SPEC-004 → registro y corrección
SPEC-005 → consumo derivado
SPEC-006 → historial
SPEC-010 → seguridad
SPEC-012 → pruebas
```

---

# 4. Arquitectura

```text
Cliente
   │
   ▼
/api/lecturas
   │
   ▼
autenticar
   │
   ▼
validar request
   │
   ▼
lecturasController
   │
   ▼
lecturasService
   │
   ├── medidoresRepository
   ├── lecturasRepository
   └── transaction
            │
            ▼
        PostgreSQL
```

---

# 5. Endpoints

Implementaremos:

```http
POST   /api/lecturas
GET    /api/lecturas
GET    /api/lecturas/ultima
GET    /api/lecturas/:id
PATCH  /api/lecturas/:id
```

No habrá:

```http
DELETE /api/lecturas/:id
```

durante el MVP.

---

# 6. Archivos principales

Crear:

```text
backend/src/controllers/
└── lecturas.controller.js

backend/src/services/
└── lecturas.service.js

backend/src/routes/
└── lecturas.routes.js

backend/src/validators/
└── lecturas.validators.js

backend/src/repositories/
├── lecturas.repository.js
└── medidores.repository.js
```

Además ampliaremos:

```text
error-codes.js
common.validators.js
utils/date.js
```

---

# 7. Medidor principal

El MVP utiliza un solo medidor.

Pero NO debemos hacer:

```javascript
const idMedidor = 1;
```

como regla permanente.

---

# 8. Repositorio de medidores

Crear:

```text
medidores.repository.js
```

con una operación conceptual:

```text
buscarMedidorPrincipalActivo()
```

---

# 9. Consulta conceptual

Podemos obtener el único medidor activo del MVP:

```sql
SELECT
    id_medidor,
    nombre,
    unidad,
    activo
FROM medidores
WHERE activo = TRUE
ORDER BY id_medidor
LIMIT 2;
```

---

# 10. ¿Por qué `LIMIT 2`?

Porque durante el MVP esperamos:

```text
exactamente 1 medidor activo
```

Si obtenemos:

```text
0
```

es un problema.

Si obtenemos:

```text
2
```

también indica una configuración inesperada.

---

# 11. Estados posibles

### Ninguno

```text
MEDIDOR_NO_ENCONTRADO
```

### Uno

Correcto.

### Más de uno

```text
MEDIDOR_CONFIGURACION_INVALIDA
```

---

# 12. No silenciosamente elegir uno

Si existen accidentalmente dos medidores activos, no queremos simplemente utilizar:

```text
el primero
```

y esconder el problema.

---

# 13. Error medidor inactivo/inexistente

La aplicación deberá impedir registrar lecturas si no existe exactamente un medidor operativo.

---

# 14. Fecha de negocio

Todas las reglas de:

```text
hoy
ayer
fecha futura
```

utilizarán:

```text
America/Guayaquil
```

---

# 15. Utilidad de fecha

Crear o completar:

```text
backend/src/utils/date.js
```

con una función conceptual:

```text
obtenerFechaActual()
```

que devuelva:

```text
YYYY-MM-DD
```

según `APP_TIMEZONE`.

---

# 16. No utilizar simplemente

```javascript
new Date()
    .toISOString()
    .slice(0, 10);
```

como regla de negocio.

---

# 17. Motivo

`toISOString()` utiliza UTC.

Cerca de medianoche podría producir otra fecha distinta a Ecuador.

---

# 18. Ejemplo

En Ecuador:

```text
31/08/2026 23:30
```

UTC ya puede corresponder a:

```text
01/09/2026
```

Para nuestro dominio:

```text
hoy = 31/08/2026
```

---

# 19. Validación de fecha

El request utilizará:

```text
YYYY-MM-DD
```

Ejemplo:

```text
2026-08-31
```

---

# 20. Debemos rechazar

```text
31/08/2026
2026-02-31
hola
null
```

---

# 21. Validator de fecha estricta

La validación deberá comprobar:

```text
formato
+
fecha calendario real
```

---

# 22. Registro

Endpoint:

```http
POST /api/lecturas
```

---

# 23. Entrada

```json
{
  "fechaLectura": "2026-08-31",
  "valorLectura": 12555
}
```

---

# 24. Campos permitidos

Únicamente:

```text
fechaLectura
valorLectura
```

---

# 25. No aceptar

```text
idMedidor
idUsuario
consumo
registradoEn
actualizadoEn
```

desde el cliente.

---

# 26. `valorLectura`

Debe ser:

```text
number
integer
>= 0
```

---

# 27. No aceptar string numérico en body

Para JSON de negocio preferimos:

```json
{
  "valorLectura": 12555
}
```

No:

```json
{
  "valorLectura": "12555"
}
```

---

# 28. Motivo

Queremos un contrato API explícito.

La coerción se reservará principalmente para:

```text
params
query
```

---

# 29. Decimal

```json
{
  "valorLectura": 12555.5
}
```

debe producir:

```text
422
VALIDACION_DATOS_INVALIDOS
```

---

# 30. Valor negativo

También:

```text
422
```

---

# 31. Primera lectura

Si no existe ninguna lectura:

```text
30/08 → 12500
```

se convierte en:

```text
lectura base
```

---

# 32. No genera consumo cero

Resultado conceptual:

```json
{
  "idLectura": 1,
  "fechaLectura": "2026-08-30",
  "valorLectura": 12500,
  "consumo": {
    "valor": null,
    "estado": "BASE"
  }
}
```

---

# 33. Registro por USUARIO

Si:

```text
rol = USUARIO
```

solo puede registrar:

```text
fechaLectura = hoy
```

---

# 34. Ejemplo

Hoy:

```text
31/08/2026
```

Permitido:

```text
31/08/2026
```

No permitido:

```text
30/08/2026
```

---

# 35. Error histórico

```text
403
LECTURA_HISTORICA_NO_PERMITIDA
```

---

# 36. Fecha futura

Ningún rol puede registrar:

```text
fechaLectura > hoy
```

---

# 37. Error

```text
422
LECTURA_FECHA_FUTURA
```

---

# 38. ADMIN histórico

ADMIN puede registrar:

```text
hoy
o
fecha anterior
```

siempre que la lectura sea real y respete la secuencia.

---

# 39. Duplicado diario

Debe comprobarse:

```text
idMedidor
+
fechaLectura
```

---

# 40. Error

```text
409
LECTURA_FECHA_DUPLICADA
```

---

# 41. Doble protección

Servicio:

```text
consulta previa
```

PostgreSQL:

```text
UNIQUE(id_medidor, fecha_lectura)
```

---

# 42. Lectura anterior

Repositorio:

```text
buscarAnterior(idMedidor, fecha)
```

---

# 43. SQL conceptual

```sql
SELECT
    id_lectura,
    fecha_lectura,
    valor_lectura
FROM lecturas_medidor
WHERE id_medidor = $1
  AND fecha_lectura < $2
ORDER BY fecha_lectura DESC
LIMIT 1;
```

---

# 44. Lectura siguiente

```text
buscarSiguiente(idMedidor, fecha)
```

---

# 45. SQL

```sql
SELECT
    id_lectura,
    fecha_lectura,
    valor_lectura
FROM lecturas_medidor
WHERE id_medidor = $1
  AND fecha_lectura > $2
ORDER BY fecha_lectura ASC
LIMIT 1;
```

---

# 46. Regla general

Si existen ambos:

```text
anterior <= nueva <= siguiente
```

---

# 47. Solo anterior

```text
nueva >= anterior
```

---

# 48. Solo siguiente

```text
nueva <= siguiente
```

---

# 49. Ninguno

```text
primera lectura
```

---

# 50. Error inferior

```text
422
LECTURA_MENOR_QUE_ANTERIOR
```

Detalles seguros:

```json
{
  "lecturaAnterior": 12547
}
```

---

# 51. Error superior

```text
422
LECTURA_MAYOR_QUE_SIGUIENTE
```

Detalles:

```json
{
  "lecturaSiguiente": 12555
}
```

---

# 52. Transacción de registro

Toda creación debe ejecutarse mediante:

```text
ejecutarTransaccion()
```

---

# 53. Flujo

```text
BEGIN
↓
obtener/bloquear medidor
↓
comprobar duplicado
↓
buscar anterior
↓
buscar siguiente
↓
validar secuencia
↓
INSERT
↓
COMMIT
```

---

# 54. Bloqueo del medidor

Utilizar:

```sql
SELECT
    id_medidor,
    nombre,
    unidad,
    activo
FROM medidores
WHERE id_medidor = $1
FOR UPDATE;
```

---

# 55. ¿Por qué bloqueamos medidor?

Todas las mutaciones de lecturas de ese medidor deberán serializarse.

---

# 56. Caso concurrente

Usuario A:

```text
31/08 → 12555
```

Usuario B:

```text
31/08 → 12556
```

simultáneamente.

---

# 57. Sin bloqueo

Ambos podrían:

```text
ver que no existe lectura
```

antes de insertar.

La restricción `UNIQUE` salvaría integridad, pero el servicio trabajaría con estado obsoleto.

---

# 58. Con bloqueo

A:

```text
bloquea medidor
↓
valida
↓
inserta
↓
COMMIT
```

B:

```text
espera
↓
vuelve a validar
↓
detecta duplicado
↓
409
```

---

# 59. Concurrencia histórica

El mismo bloqueo protege también casos donde dos ADMIN insertan:

```text
fechas diferentes
```

que pueden cambiar sus vecinos cronológicos.

---

# 60. Ejemplo

Estado:

```text
28 → 1000
31 → 1030
```

ADMIN A:

```text
29 → 1010
```

ADMIN B:

```text
30 → 1020
```

Ambos afectan la secuencia.

Serializar simplifica la consistencia.

---

# 61. Escala

Con un solo medidor y dos usuarios:

```text
este bloqueo es totalmente razonable.
```

---

# 62. Crear lectura

Repositorio recibirá:

```text
client
idMedidor
idUsuarioRegistro
fechaLectura
valorLectura
```

---

# 63. Usuario de registro

Siempre se obtiene de:

```text
req.usuario.idUsuario
```

Nunca del body.

---

# 64. Respuesta creación

```http
201 Created
```

Ejemplo:

```json
{
  "idLectura": 25,
  "fechaLectura": "2026-08-31",
  "valorLectura": 12555,
  "registradoPor": {
    "idUsuario": 2,
    "nombre": "Usuario Casa"
  },
  "registradoEn": "2026-08-31T..."
}
```

---

# 65. Consumo en respuesta

Podemos incluir información derivada útil:

```json
{
  "consumo": {
    "valor": 8,
    "estado": "CONOCIDO"
  }
}
```

si existe día anterior consecutivo.

---

# 66. No es obligatorio recalcular dashboard

El endpoint no devolverá:

```text
mes
año
promedio
máximo
```

Eso será responsabilidad del módulo de estadísticas.

---

# 67. Última lectura

Endpoint:

```http
GET /api/lecturas/ultima
```

---

# 68. Autenticación

Disponible para:

```text
ADMIN
USUARIO
```

---

# 69. Con datos

```json
{
  "lectura": {
    "idLectura": 25,
    "fechaLectura": "2026-08-31",
    "valorLectura": 12555,
    "registradoEn": "..."
  }
}
```

---

# 70. Sin datos

```json
{
  "lectura": null
}
```

con:

```text
200
```

---

# 71. No usar 404

La ausencia de lecturas iniciales es:

```text
estado válido del sistema
```

no un recurso defectuoso.

---

# 72. Consultar una lectura

```http
GET /api/lecturas/:id
```

---

# 73. Respuesta

Debe incluir:

```text
lectura
consumo
lectura anterior
lectura siguiente
registrado por
corrección
puedeEditar
```

---

# 74. Ejemplo

```json
{
  "idLectura": 25,
  "fechaLectura": "2026-08-31",
  "valorLectura": 12555,

  "consumo": {
    "valor": 8,
    "estado": "CONOCIDO",
    "intervalo": null
  },

  "lecturaAnterior": {
    "fechaLectura": "2026-08-30",
    "valorLectura": 12547
  },

  "lecturaSiguiente": null,

  "registradoPor": {
    "idUsuario": 2,
    "nombre": "Usuario Casa"
  },

  "registradoEn": "...",

  "correccion": {
    "fueCorregida": false,
    "actualizadoPor": null,
    "actualizadoEn": null
  },

  "puedeEditar": true
}
```

---

# 75. `puedeEditar`

Para ADMIN:

```text
true
```

para lecturas existentes.

---

# 76. Para USUARIO

```text
fechaLectura == hoy
```

→ `true`.

Histórico:

```text
false
```

---

# 77. Importante

`puedeEditar` sirve solo para UI futura.

El PATCH:

```text
vuelve a validar permiso.
```

---

# 78. Historial

Endpoint:

```http
GET /api/lecturas
```

---

# 79. Query params

```text
pagina
limite
desde
hasta
```

---

# 80. Valores

```text
pagina = 1
limite = 30
máximo = 100
```

---

# 81. Ejemplo

```http
GET /api/lecturas
    ?desde=2026-08-01
    &hasta=2026-08-31
    &pagina=1
    &limite=30
```

---

# 82. Rango

Debe cumplirse:

```text
desde <= hasta
```

---

# 83. Error

```text
422
LECTURA_RANGO_INVALIDO
```

---

# 84. Orden

```text
fechaLectura DESC
```

---

# 85. Consumo derivado

Cada registro del historial podrá incluir:

```text
consumo diario
```

si puede determinarse.

---

# 86. Estado BASE

La lectura cronológicamente inicial:

```text
consumo = null
estado = BASE
```

---

# 87. Estado CONOCIDO

Si:

```text
fechaActual - fechaAnterior = 1 día
```

entonces:

```text
consumo = actual - anterior
estado = CONOCIDO
```

---

# 88. Día faltante

Estado:

```text
SIN_BASE_DIARIA
```

---

# 89. Ejemplo

```text
28 → 1000
30 → 1015
```

Para 30:

```json
{
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

# 90. Nunca

```text
30 → 15 kWh diarios
```

---

# 91. Nunca dividir

```text
29 → 7.5
30 → 7.5
```

---

# 92. Cálculo de días

La diferencia de fechas debe realizarse como:

```text
días calendario
```

no mediante diferencia accidental de horas.

---

# 93. SQL y `LAG`

Para el historial podemos utilizar:

```text
LAG(fecha_lectura)
LAG(valor_lectura)
```

---

# 94. Problema del filtro

Supongamos:

```text
31/07 → 1000
01/08 → 1005
```

Se consulta:

```text
desde = 01/08
```

---

# 95. Resultado correcto

```text
01/08 → 5 kWh
```

Aunque:

```text
31/07
```

no aparezca visualmente.

---

# 96. Por tanto

No debemos hacer:

```text
filtrar agosto
↓
LAG
```

porque perderíamos 31/07.

---

# 97. Orden correcto

```text
calcular contexto
↓
después filtrar filas visibles
```

o recuperar explícitamente la lectura previa necesaria.

---

# 98. Paginación

Mismo problema.

El primer registro de una página puede necesitar la lectura de la página anterior.

---

# 99. Regla

```text
la paginación nunca modifica el consumo calculado.
```

---

# 100. Estrategia recomendada

Separar:

```text
consulta de IDs/filas visibles
```

de:

```text
contexto anterior para cada cálculo
```

o utilizar una CTE donde el `LAG` se calcule antes de paginar.

---

# 101. Consulta conceptual

```sql
WITH lecturas_con_contexto AS (
    SELECT
        l.*,

        LAG(l.fecha_lectura) OVER (
            PARTITION BY l.id_medidor
            ORDER BY l.fecha_lectura
        ) AS fecha_anterior,

        LAG(l.valor_lectura) OVER (
            PARTITION BY l.id_medidor
            ORDER BY l.fecha_lectura
        ) AS valor_anterior

    FROM lecturas_medidor l
)

SELECT ...
FROM lecturas_con_contexto
WHERE ...
ORDER BY fecha_lectura DESC
LIMIT $n
OFFSET $n;
```

---

# 102. JOIN usuarios

El historial necesita:

```text
registradoPor
actualizadoPor
```

---

# 103. Evitar N+1

No hacer:

```text
1 consulta lecturas
+
30 consultas usuario registro
+
30 consultas usuario actualización
```

---

# 104. Utilizar JOIN

Conceptualmente:

```sql
LEFT JOIN usuarios ur ...
LEFT JOIN usuarios ua ...
```

---

# 105. Corrección

Endpoint:

```http
PATCH /api/lecturas/:id
```

---

# 106. Entrada

```json
{
  "valorLectura": 12556
}
```

---

# 107. Campo único

No permitir:

```text
fechaLectura
idMedidor
idUsuario
consumo
```

---

# 108. Fecha inmutable

Durante el MVP:

```text
fechaLectura NO cambia.
```

---

# 109. Permiso USUARIO

Puede corregir únicamente:

```text
lectura del día actual
```

---

# 110. Permiso ADMIN

Puede corregir:

```text
hoy
históricos
```

---

# 111. Lectura inexistente

```text
404
LECTURA_NO_ENCONTRADA
```

---

# 112. Transacción de corrección

```text
BEGIN
↓
obtener lectura objetivo
↓
obtener/bloquear medidor
↓
volver a obtener lectura objetivo si procede
↓
validar permiso
↓
buscar anterior
↓
buscar siguiente
↓
validar nuevo valor
↓
UPDATE
↓
COMMIT
```

---

# 113. Bloqueo

Todas las mutaciones del medidor usan el mismo patrón de bloqueo.

Así:

```text
POST
PATCH
```

no pueden intercalarse de forma inconsistente.

---

# 114. Validación

Si existen:

```text
28 → 1000
29 → 1008
30 → 1015
```

cambiar 29 a:

```text
1010
```

es válido.

---

# 115. Después

```text
29 → 10
30 → 5
```

---

# 116. No actualizar consumos

No existe:

```text
UPDATE consumos
```

---

# 117. Datos derivados

La siguiente consulta recalculará los resultados automáticamente.

---

# 118. Corrección inferior

```text
29 → 990
```

rechazada.

---

# 119. Corrección superior

```text
29 → 1020
```

rechazada.

---

# 120. Mismo valor

Si:

```text
12555 → 12555
```

no hay cambio real.

---

# 121. Decisión

Responder:

```text
200
```

con estado actual.

No modificar:

```text
id_usuario_actualizacion
actualizado_en
```

innecesariamente.

---

# 122. Corrección real

Si cambia el valor:

```text
id_usuario_registro
```

permanece intacto.

---

# 123. Se actualiza

```text
id_usuario_actualizacion
actualizado_en
```

---

# 124. Trazabilidad

Ejemplo:

```text
Registró:
Usuario 2

Corrigió:
ADMIN 1
```

---

# 125. No guardamos valor anterior

Durante el MVP no hay tabla de auditoría completa.

---

# 126. Respuesta corrección

```json
{
  "idLectura": 25,
  "fechaLectura": "2026-08-31",
  "valorLectura": 12556,

  "actualizadoPor": {
    "idUsuario": 1,
    "nombre": "Administrador"
  },

  "actualizadoEn": "..."
}
```

---

# 127. Concurrencia de correcciones

Dos usuarios podrían corregir hoy casi simultáneamente.

El bloqueo del medidor serializa ambas operaciones.

---

# 128. Ejemplo

Estado:

```text
30 → 1000
31 → 1008
```

A intenta:

```text
31 → 1010
```

B intenta:

```text
31 → 1011
```

---

# 129. Resultado

Las operaciones ocurrirán en orden.

La segunda validará sobre el valor ya actualizado.

---

# 130. Última escritura

En este MVP:

```text
la última corrección válida termina siendo el valor vigente
```

No implementaremos todavía control optimista por versión.

---

# 131. ¿Necesitamos revisión/versionado?

No para dos usuarios y una lectura diaria.

Si en el futuro el sistema tiene alta concurrencia, podemos añadir:

```text
version
```

para detectar edición sobre estado antiguo.

---

# 132. No borrar lecturas

No existe endpoint DELETE.

---

# 133. Motivo

Eliminar una lectura cambia:

```text
intervalos
consumos
gráficos
estadísticas
```

---

# 134. Error de fecha equivocada

Si una lectura se registró con fecha incorrecta:

```text
caso fuera del MVP
```

No intentar resolverlo mediante DELETE escondido.

---

# 135. Códigos de error

Agregar:

```text
LECTURA_NO_ENCONTRADA
LECTURA_FECHA_DUPLICADA
LECTURA_FECHA_FUTURA
LECTURA_HISTORICA_NO_PERMITIDA
LECTURA_CORRECCION_NO_PERMITIDA
LECTURA_MENOR_QUE_ANTERIOR
LECTURA_MAYOR_QUE_SIGUIENTE
LECTURA_RANGO_INVALIDO

MEDIDOR_NO_ENCONTRADO
MEDIDOR_INACTIVO
MEDIDOR_CONFIGURACION_INVALIDA
```

---

# 136. Validaciones estructurales

Continuarán usando:

```text
VALIDACION_DATOS_INVALIDOS
```

para:

```text
decimal
negativo
fecha mal formada
id inválido
pagina inválida
```

---

# 137. HTTP resumen

### 201

Lectura creada.

### 200

Consulta/corrección correcta.

### 401

No autenticado.

### 403

Operación no permitida por rol/contexto.

### 404

Lectura inexistente.

### 409

Duplicado/configuración conflictiva.

### 422

Valor o regla de datos inválida.

---

# 138. Router

Conceptualmente:

```text
router.use(autenticar);

POST   /
GET    /
GET    /ultima
GET    /:id
PATCH  /:id
```

---

# 139. Orden de rutas

Importante:

```text
/ultima
```

debe definirse antes de:

```text
/:id
```

si el router puede interpretar:

```text
ultima
```

como ID.

---

# 140. Mejor aún

El validator de `:id` impediría tratar `"ultima"` como ID válido, pero mantener rutas específicas primero mejora claridad.

---

# 141. No middleware de rol global

Tanto ADMIN como USUARIO utilizan lecturas.

Por eso:

```text
autenticar
```

es global.

Los permisos específicos viven en servicio.

---

# 142. Registro histórico

No hacer:

```text
requerirRol('ADMIN')
```

sobre todo `POST`.

Porque:

```text
USUARIO sí puede registrar hoy.
```

La regla depende de:

```text
rol + fecha.
```

---

# 143. Esta es una buena lección

Hay permisos:

```text
globales
```

como:

```text
solo ADMIN entra a /admin
```

y permisos:

```text
contextuales
```

como:

```text
USUARIO modifica hoy pero no ayer.
```

---

# 144. Repositorio de lecturas

Operaciones mínimas:

```text
buscarPorId
buscarPorFecha
buscarAnterior
buscarSiguiente
buscarUltima
crear
actualizarValor
listar
contar
```

---

# 145. Repository recibe cliente opcional

Para operaciones transaccionales necesitamos utilizar:

```text
client
```

de la misma transacción.

---

# 146. No hacer esto

Dentro de transacción:

```text
service usa client
↓
repository usa pool global
```

porque la consulta saldría fuera de la transacción.

---

# 147. Decisión

Los métodos transaccionales recibirán explícitamente:

```text
client
```

---

# 148. Ejemplo conceptual

```javascript
buscarAnterior(
    client,
    idMedidor,
    fechaLectura
);
```

---

# 149. Lecturas de consulta

Para GET puede utilizarse:

```text
pool
```

sin transacción especial.

---

# 150. Separación

Mutaciones:

```text
client transaccional
```

Lecturas simples:

```text
pool
```

---

# 151. Tests unitarios de fechas

Probar:

```text
fecha válida
fecha imposible
hoy en America/Guayaquil
fecha futura
```

---

# 152. Pruebas de registro

Como mínimo:

```text
primera lectura
segunda lectura
lectura igual anterior
lectura mayor anterior
decimal
negativa
fecha futura
duplicada
```

---

# 153. Primera lectura

Estado:

```text
sin lecturas
```

Registrar:

```text
12500
```

Esperado:

```text
201
BASE
```

---

# 154. Segunda consecutiva

```text
30 → 12500
31 → 12508
```

Esperado:

```text
8 kWh
```

---

# 155. Cero real

```text
30 → 12500
31 → 12500
```

Esperado:

```text
0 kWh
CONOCIDO
```

---

# 156. Decimal

```text
12500.5
```

Esperado:

```text
422
```

---

# 157. Duplicado

Dos registros mismo día:

```text
primero → 201
segundo → 409
```

---

# 158. Roles de registro

### USUARIO hoy

```text
201
```

### USUARIO ayer

```text
403
```

### ADMIN ayer

Puede continuar.

### Cualquier rol mañana

```text
422
```

---

# 159. Tests históricos

Estado:

```text
28 → 1000
30 → 1015
```

ADMIN agrega:

```text
29 → 1008
```

Esperado:

```text
201
```

---

# 160. Inferior

```text
29 → 999
```

Esperado:

```text
422
LECTURA_MENOR_QUE_ANTERIOR
```

---

# 161. Superior

```text
29 → 1020
```

Esperado:

```text
422
LECTURA_MAYOR_QUE_SIGUIENTE
```

---

# 162. Histórica antes de primera lectura

Existe:

```text
30 → 1015
```

ADMIN registra:

```text
29 → 1000
```

válido.

---

# 163. Test concurrencia mismo día

Dos solicitudes simultáneas:

```text
31 → 12555
31 → 12556
```

Esperado:

```text
1 x 201
1 x 409
```

---

# 164. DB final

```text
COUNT lectura 31 = 1
```

---

# 165. Test concurrencia histórica

Estado:

```text
28 → 1000
31 → 1030
```

Simultáneo:

```text
29 → 1010
30 → 1020
```

Ambas pueden terminar válidas, pero siempre con secuencia:

```text
1000 <= 1010 <= 1020 <= 1030
```

---

# 166. Test de corrección USUARIO

Hoy:

```text
31
```

USUARIO cambia lectura 31.

Esperado:

```text
200
```

si valor válido.

---

# 167. Histórico USUARIO

Cambiar:

```text
30
```

Esperado:

```text
403
LECTURA_CORRECCION_NO_PERMITIDA
```

---

# 168. Histórico ADMIN

Permitido.

---

# 169. Corrección vecino inferior

Rechazada.

---

# 170. Corrección vecino superior

Rechazada.

---

# 171. Corrección mismo valor

Esperado:

```text
200
```

pero:

```text
id_usuario_actualizacion
```

no cambia.

---

# 172. Test de trazabilidad

Usuario 2 registra.

ADMIN 1 corrige.

Esperado:

```text
idUsuarioRegistro = 2
idUsuarioActualizacion = 1
```

---

# 173. Tests de historial

```text
vacío
una lectura
varias lecturas
orden descendente
paginación
desde
hasta
desde+hasta
rango inválido
```

---

# 174. Historial vacío

```json
{
  "datos": [],
  "paginacion": {
    "pagina": 1,
    "limite": 30,
    "total": 0,
    "totalPaginas": 0
  }
}
```

---

# 175. Lectura base

Debe aparecer como:

```text
BASE
```

---

# 176. Día consecutivo

Debe aparecer:

```text
CONOCIDO
```

---

# 177. Hueco

Estado:

```text
SIN_BASE_DIARIA
```

con intervalo.

---

# 178. Test crítico del filtro

Datos:

```text
31/07 → 1000
01/08 → 1005
```

Consulta:

```text
desde=2026-08-01
```

Esperado:

```text
01/08
consumo=5
```

---

# 179. Test crítico de paginación

Una fila en inicio de página conserva exactamente el mismo consumo que cuando se consulta individualmente.

---

# 180. Test corrección y fila siguiente

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

Historial:

```text
29 → 10
30 → 5
```

---

# 181. Test última lectura

Sin datos:

```text
lectura = null
```

Con datos:

```text
fecha más reciente
```

---

# 182. Test detalle

Debe incluir:

```text
anterior
siguiente
consumo
creador
corrección
puedeEditar
```

---

# 183. Seguridad

Probar:

```text
sin token → 401
sesión revocada → 401
usuario inactivo → 403
```

---

# 184. Mass assignment

Enviar:

```json
{
  "fechaLectura": "2026-08-31",
  "valorLectura": 12555,
  "idUsuarioRegistro": 1,
  "consumo": 999
}
```

debe rechazarse.

---

# 185. SQL Injection

Filtros de fecha/query no deben alterar la consulta.

---

# 186. Medidor inexistente

Simular:

```text
0 medidores activos
```

POST debe fallar de forma controlada.

---

# 187. Dos medidores activos

Simular accidentalmente:

```text
2
```

Esperado:

```text
MEDIDOR_CONFIGURACION_INVALIDA
```

---

# 188. Test medidor inactivo

Si el único medidor está:

```text
activo = false
```

no se permite registrar.

---

# 189. Base de test

Las suites limpiarán:

```text
lecturas_medidor
sesiones
usuarios de fixture
```

respetando FK.

---

# 190. No perder medidor seed accidentalmente

Los helpers pueden preservar o recrear:

```text
Medidor principal
```

según la estrategia de aislamiento.

---

# 191. Dataset recomendado

```text
28/08 → 1000
29/08 → 1008
30/08 → 1015
31/08 → 1021
```

---

# 192. Dataset con hueco

```text
28/08 → 1000
30/08 → 1015
```

---

# 193. Dataset cero

```text
30/08 → 1015
31/08 → 1015
```

---

# 194. No necesitamos migración nueva

La estructura actual ya contiene:

```text
id_medidor
id_usuario_registro
id_usuario_actualizacion
valor_lectura
fecha_lectura
```

---

# 195. Si descubrimos un problema estructural

No modificar:

```text
001_esquema_inicial.sql
```

si ya está aplicado/compartido.

Crear:

```text
003_...
```

solo con justificación.

---

# 196. README

Documentar:

```text
## API de lecturas
```

---

# 197. Ejemplos

```text
POST /api/lecturas
GET /api/lecturas
GET /api/lecturas/ultima
GET /api/lecturas/:id
PATCH /api/lecturas/:id
```

---

# 198. README debe explicar

```text
lectura acumulada
una por día
sin decimales
no DELETE
```

---

# 199. Smoke test manual

Con dos usuarios:

### ADMIN

```text
login
↓
registrar lectura
↓
consultar
↓
corregir histórico
```

### USUARIO

```text
login
↓
registrar hoy
↓
intentar registrar ayer → 403
↓
corregir hoy
↓
intentar corregir ayer → 403
```

---

# 200. Escenario manual

Datos:

```text
28 Ago → 12540
29 Ago → 12547
30 Ago → 12555
31 Ago → 12563
```

Esperado:

```text
29 → 7
30 → 8
31 → 8
```

---

# 201. Escenario con hueco

```text
28 Ago → 12540
30 Ago → 12555
```

Esperado:

```text
30 Ago
consumoDiario = null

intervalo:
28→30
15 kWh
2 días
```

---

# 202. Regresión auth

Todas las pruebas de:

```text
CHECKPOINT 3
CHECKPOINT 4
```

siguen pasando.

---

# 203. Gate backend

Ejecutar:

```bash
npm run lint
npm test
npm run test:coverage
```

---

# 204. Revisar cobertura

Especialmente:

```text
lecturas.service.js
lecturas.repository.js
medidores.repository.js
lecturas.validators.js
date.js
```

---

# 205. DB

```bash
npm run db:check
npm run db:status
```

PASS.

---

# 206. Frontend regresión

```bash
cd ../frontend
npm run build
```

PASS.

---

# 207. Git status

Revisar:

```bash
git status
```

No debe aparecer:

```text
.env
.env.test
coverage
node_modules
```

---

# 208. Commit

Después del gate verde:

```bash
git add .
git status
```

Revisar.

Luego:

```bash
git commit -m "feat: implementar registro y gestion de lecturas"
```

---

# 209. Working tree

```text
nothing to commit, working tree clean
```

---

# 210. Gate CHECKPOINT 5

### CP5-001

Existe router de lecturas.

### CP5-002

Todas las rutas requieren autenticación.

### CP5-003

Existe repositorio de medidores.

### CP5-004

No se hardcodea `idMedidor = 1`.

### CP5-005

El sistema detecta ausencia de medidor.

### CP5-006

El sistema detecta configuración con múltiples medidores activos.

### CP5-007

Existe `POST /api/lecturas`.

### CP5-008

Solo acepta fecha y valor.

### CP5-009

Lectura debe ser número.

### CP5-010

Lectura debe ser entera.

### CP5-011

Lectura no puede ser negativa.

### CP5-012

Fecha utiliza formato ISO de dominio.

### CP5-013

Fecha calendario inválida se rechaza.

### CP5-014

Fecha futura se rechaza.

### CP5-015

Fecha actual usa `America/Guayaquil`.

### CP5-016

USUARIO puede registrar hoy.

### CP5-017

USUARIO no registra histórico.

### CP5-018

ADMIN puede registrar histórico.

### CP5-019

Primera lectura se acepta.

### CP5-020

Primera lectura tiene estado BASE.

### CP5-021

Primera lectura no muestra falso 0.

### CP5-022

Una lectura por día está protegida.

### CP5-023

Duplicado devuelve 409.

### CP5-024

Se valida lectura anterior.

### CP5-025

Se valida lectura siguiente.

### CP5-026

Se permite lectura igual a anterior.

### CP5-027

Lectura inferior se rechaza.

### CP5-028

Lectura superior a siguiente se rechaza.

### CP5-029

Registro utiliza transacción.

### CP5-030

Registro bloquea medidor.

### CP5-031

Concurrencia mismo día produce una sola lectura.

### CP5-032

Existe `GET /api/lecturas/ultima`.

### CP5-033

Sin lecturas devuelve `lectura: null`.

### CP5-034

Existe `GET /api/lecturas/:id`.

### CP5-035

Lectura inexistente devuelve 404.

### CP5-036

Detalle incluye lectura anterior.

### CP5-037

Detalle incluye lectura siguiente.

### CP5-038

Detalle incluye creador.

### CP5-039

Detalle incluye corrección.

### CP5-040

Detalle incluye `puedeEditar`.

### CP5-041

Existe historial paginado.

### CP5-042

Historial ordena DESC.

### CP5-043

Filtro `desde` funciona.

### CP5-044

Filtro `hasta` funciona.

### CP5-045

Rango inválido se rechaza.

### CP5-046

Paginación no altera el cálculo.

### CP5-047

Filtro no elimina el contexto anterior.

### CP5-048

Consumo diario se calcula solo con fechas consecutivas.

### CP5-049

Consumo cero se conserva como 0.

### CP5-050

Dato desconocido se conserva como null.

### CP5-051

Huecos generan estado `SIN_BASE_DIARIA`.

### CP5-052

Intervalo conocido se devuelve separado.

### CP5-053

No existe interpolación.

### CP5-054

No se atribuye intervalo al último día.

### CP5-055

Existe PATCH de lectura.

### CP5-056

Fecha no puede modificarse.

### CP5-057

USUARIO corrige hoy.

### CP5-058

USUARIO no corrige histórico.

### CP5-059

ADMIN corrige histórico.

### CP5-060

Corrección valida anterior.

### CP5-061

Corrección valida siguiente.

### CP5-062

Corrección utiliza transacción.

### CP5-063

Corrección usa el mismo bloqueo del medidor.

### CP5-064

Creador original se conserva.

### CP5-065

Último corrector se registra.

### CP5-066

Corrección sin cambio no altera auditoría innecesariamente.

### CP5-067

Corregir modifica automáticamente datos derivados.

### CP5-068

No existe DELETE funcional.

### CP5-069

No existe tabla `consumos`.

### CP5-070

No existen triggers de secuencia.

### CP5-071

No existe N+1 de usuarios en historial.

### CP5-072

SQL permanece parametrizado.

### CP5-073

Mass assignment está bloqueado.

### CP5-074

Tests de primera lectura pasan.

### CP5-075

Tests de duplicidad pasan.

### CP5-076

Tests de roles pasan.

### CP5-077

Tests históricos pasan.

### CP5-078

Tests de corrección pasan.

### CP5-079

Tests de intervalos pasan.

### CP5-080

Tests de filtros pasan.

### CP5-081

Tests de paginación pasan.

### CP5-082

Test de concurrencia pasa.

### CP5-083

Regresión de autenticación pasa.

### CP5-084

Regresión de administración pasa.

### CP5-085

`npm run lint` pasa.

### CP5-086

`npm test` pasa.

### CP5-087

Frontend build sigue pasando.

### CP5-088

No existen secretos versionados.

### CP5-089

Existe commit.

### CP5-090

Working tree limpio.

---

# 211. Estado de SPEC-004

Después del gate:

```text
SPEC-004
Registro y corrección de lecturas
→ IMPLEMENTADA
→ PROBADA
```

El frontend todavía no existe, por lo que el cierre completo llegará más adelante.

---

# 212. Estado de SPEC-006

La parte backend del historial estará implementada.

Por tanto:

```text
SPEC-006
→ IMPLEMENTADA PARCIALMENTE
```

porque falta la experiencia visual.

---

# 213. Estado de SPEC-005

Solo implementamos en este checkpoint la parte básica:

```text
consumo diario
intervalos
```

Todavía faltan:

```text
semana
mes
año
promedio
máximo
mínimo
cobertura
series
```

Por tanto:

```text
SPEC-005
→ IMPLEMENTADA PARCIALMENTE
```

---

# 214. Estado del roadmap

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
→ SIGUIENTE

CHECKPOINT 7
Frontend base
→ PENDIENTE

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

# 215. Qué podremos hacer al cerrar CHECKPOINT 5

Ya tendremos una API capaz de manejar:

```text
28 Ago → 12 540
29 Ago → 12 547
30 Ago → 12 555
31 Ago → 12 563
```

y deducir:

```text
29 Ago → 7 kWh
30 Ago → 8 kWh
31 Ago → 8 kWh
```

---

# 216. También sabrá manejar correctamente

```text
28 Ago → 12 540
29 Ago → SIN LECTURA
30 Ago → 12 555
```

sin inventar:

```text
29 → 7.5
30 → 7.5
```

---

# 217. Lo que sigue

El próximo bloque será:

```text
CHECKPOINT 6
Motor de estadísticas
```

Ahí implementaremos:

```text
GET /api/estadisticas/resumen
GET /api/estadisticas/serie

ayer
últimos 7 días
mes actual
año actual
promedio
máximo
mínimo
empates
cobertura
COMPLETO
PARCIAL
SIN_DATOS
series diarias
series mensuales
```

y tendremos listo todo el backend necesario para comenzar el dashboard React.

---

# 218. Criterio pedagógico

Un aprendiz deberá poder explicar:

1. ¿Qué dato introduce realmente el usuario?
2. ¿Por qué el consumo no se recibe en el body?
3. ¿Por qué no hardcodeamos el ID del medidor?
4. ¿Por qué la fecha del negocio no se obtiene simplemente con UTC?
5. ¿Por qué una lectura debe ser entera?
6. ¿Por qué permitimos una lectura igual a la anterior?
7. ¿Qué significa lectura base?
8. ¿Por qué un usuario normal solo registra hoy?
9. ¿Por qué ADMIN puede registrar históricos?
10. ¿Por qué una lectura histórica necesita validar ambos vecinos?
11. ¿Qué hace `FOR UPDATE` sobre el medidor?
12. ¿Por qué todas las mutaciones del medidor usan el mismo bloqueo?
13. ¿Cómo evitamos dos lecturas del mismo día?
14. ¿Qué diferencia existe entre 0 y null?
15. ¿Qué ocurre cuando falta un día?
16. ¿Por qué no dividimos el consumo del intervalo?
17. ¿Por qué el filtro del historial necesita contexto anterior?
18. ¿Por qué la paginación no debe cambiar el consumo?
19. ¿Por qué usamos JOIN y evitamos N+1?
20. ¿Quién puede corregir históricos?
21. ¿Por qué la fecha de una lectura no se modifica?
22. ¿Por qué no eliminamos lecturas?
23. ¿Por qué una corrección puede cambiar el consumo del día siguiente?
24. ¿Por qué no necesitamos actualizar una tabla de consumos?
25. ¿Qué diferencia existe entre un permiso global y uno contextual?

Cuando todos los `CP5-*` estén verdes:

```text
CHECKPOINT 5 → CERRADO
```
