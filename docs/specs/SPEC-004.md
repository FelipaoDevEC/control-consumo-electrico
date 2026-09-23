# SPEC-004 — Registro y corrección de lecturas

## 1. Objetivo

Definir cómo se crean, consultan y corrigen las lecturas del medidor eléctrico.

Esta especificación transforma las reglas de `SPEC-001` y el modelo de datos de `SPEC-002` en un contrato operativo para la API.

Se definirá:

* registro de lecturas;
* consulta de lecturas;
* lectura actual;
* historial;
* corrección;
* permisos;
* validación contra lectura anterior;
* validación contra lectura siguiente;
* días faltantes;
* transacciones;
* concurrencia;
* errores esperados.

Todavía no implementaremos Express.

Primero definimos exactamente qué debe ocurrir.

---

# 2. Principio principal

El usuario registra:

```text
la numeración acumulada del medidor
```

Ejemplo:

```text
12555
```

El usuario NO registra:

```text
8 kWh consumidos
```

El consumo será calculado posteriormente a partir de las lecturas.

---

# 3. Medidor del MVP

Durante esta versión existe un único medidor:

```text
Medidor principal
```

La API no obligará al usuario a seleccionarlo desde la interfaz.

Internamente, las lecturas continuarán relacionadas con:

```text
id_medidor
```

para mantener correctamente el modelo de datos.

---

# 4. Operaciones principales

La API de lecturas tendrá inicialmente:

```text
POST   /api/lecturas
GET    /api/lecturas
GET    /api/lecturas/ultima
GET    /api/lecturas/:id
PATCH  /api/lecturas/:id
```

No tendremos:

```text
DELETE /api/lecturas/:id
```

durante el MVP.

---

# 5. Autenticación

Todas las operaciones de lecturas requieren usuario autenticado.

Por lo tanto:

```text
/api/lecturas
```

nunca será una API pública.

Todas las rutas utilizarán conceptualmente:

```text
autenticar
```

definido en `SPEC-003`.

---

# 6. Permisos generales

| Operación                   | USUARIO | ADMIN |
| --------------------------- | ------: | ----: |
| Registrar lectura de hoy    |      Sí |    Sí |
| Registrar lectura histórica |      No |    Sí |
| Registrar lectura futura    |      No |    No |
| Consultar lecturas          |      Sí |    Sí |
| Consultar última lectura    |      Sí |    Sí |
| Consultar una lectura       |      Sí |    Sí |
| Corregir lectura de hoy     |      Sí |    Sí |
| Corregir lectura histórica  |      No |    Sí |
| Eliminar lectura            |      No |    No |

---

# 7. Registro normal

El caso principal será:

```text
Usuario abre la aplicación
        ↓
observa el medidor físico
        ↓
escribe la numeración
        ↓
presiona Registrar
```

Ejemplo:

```text
Lectura:
12555

Fecha:
30/08/2026
```

---

# 8. Endpoint de registro

```http
POST /api/lecturas
```

Entrada:

```json
{
  "fechaLectura": "2026-08-30",
  "valorLectura": 12555
}
```

No será necesario enviar:

```text
idUsuario
idMedidor
consumo
```

El backend determinará:

```text
idUsuario
```

a partir de la sesión.

El medidor será el medidor principal configurado en el sistema.

---

# 9. Campos aceptados

El endpoint aceptará únicamente:

```text
fechaLectura
valorLectura
```

Campos adicionales deberán ignorarse o rechazarse según la estrategia general de validación que definamos posteriormente.

No se permitirá que el cliente envíe:

```json
{
  "idUsuarioRegistro": 1
}
```

para hacerse pasar por otro usuario.

---

# 10. Valor de lectura

`valorLectura` debe ser:

```text
entero
>= 0
```

Ejemplos válidos:

```text
0
12500
12555
999999
```

Ejemplos inválidos:

```text
-1
12555.5
"12555abc"
null
```

---

# 11. Fecha de lectura

Formato:

```text
YYYY-MM-DD
```

Ejemplo:

```text
2026-08-30
```

No se permitirán fechas futuras.

---

# 12. Registro por USUARIO

Un usuario con rol:

```text
USUARIO
```

solamente podrá crear una lectura correspondiente a:

```text
hoy
```

Ejemplo:

Si hoy es:

```text
2026-08-30
```

puede registrar:

```text
2026-08-30
```

No puede registrar:

```text
2026-08-29
```

ni:

```text
2026-08-31
```

---

# 13. Motivo de esta regla

La aplicación pretende registrar una medición física diaria.

Permitir libremente que un usuario normal introduzca valores históricos aumentaría la posibilidad de modificar el historial.

Por eso:

```text
USUARIO → hoy
ADMIN   → hoy o pasado
```

---

# 14. Registro histórico por ADMIN

Un administrador podrá registrar una lectura correspondiente a una fecha anterior cuando exista una medición real que no fue ingresada oportunamente al sistema.

Ejemplo:

El usuario anotó físicamente:

```text
28/08/2026 → 12540
```

pero olvidó ingresarlo en la aplicación.

Un ADMIN podrá incorporarlo después.

---

# 15. Prohibición de inventar históricos

El permiso administrativo para insertar una lectura antigua no significa:

```text
inventar una lectura
```

La lectura debe provenir de una medición real conocida.

La aplicación no puede comprobar físicamente este hecho, pero la regla de negocio queda documentada.

---

# 16. Primera lectura

Si no existe ninguna lectura anterior:

```text
POST /api/lecturas

valorLectura = 12500
```

será aceptada como:

```text
lectura base
```

Respuesta conceptual:

```json
{
  "idLectura": 1,
  "fechaLectura": "2026-08-30",
  "valorLectura": 12500,
  "tipo": "BASE",
  "consumoDiario": null
}
```

---

# 17. Segunda lectura

Estado existente:

```text
29/08 → 12500
```

Nueva:

```text
30/08 → 12508
```

Validación:

```text
12508 >= 12500
```

Correcto.

Consumo determinable:

```text
12508 - 12500 = 8 kWh
```

---

# 18. Duplicidad de fecha

Si ya existe:

```text
30/08/2026 → 12555
```

un nuevo:

```text
30/08/2026 → 12556
```

no representa una segunda lectura.

Representa un posible intento de corrección.

Por lo tanto:

```http
POST /api/lecturas
```

deberá rechazarlo.

---

# 19. Error por lectura existente

Respuesta:

```http
409 Conflict
```

```json
{
  "error": {
    "codigo": "LECTURA_FECHA_DUPLICADA",
    "mensaje": "Ya existe una lectura registrada para esta fecha."
  }
}
```

El usuario deberá utilizar la operación de corrección.

---

# 20. Validación cronológica

Antes de crear una lectura, el backend deberá encontrar:

```text
lectura anterior
lectura siguiente
```

respecto de la fecha que se está insertando.

Esto es especialmente importante cuando un ADMIN introduce una medición histórica.

---

# 21. Ejemplo de inserción al final

Existen:

```text
28/08 → 12540
29/08 → 12547
```

Nueva:

```text
30/08 → 12555
```

Existe lectura anterior:

```text
29/08 → 12547
```

No existe lectura siguiente.

Debe cumplirse:

```text
12555 >= 12547
```

---

# 22. Ejemplo de inserción histórica intermedia

Existen:

```text
28/08 → 12540
30/08 → 12555
```

ADMIN desea agregar:

```text
29/08 → 12547
```

Ahora existen dos límites:

```text
anterior = 12540
siguiente = 12555
```

La nueva lectura debe cumplir:

```text
12540 <= 12547 <= 12555
```

Correcto.

---

# 23. Inserción histórica inválida por límite inferior

Existen:

```text
28/08 → 12540
30/08 → 12555
```

Se intenta:

```text
29/08 → 12530
```

Fallaría:

```text
12530 < 12540
```

---

# 24. Inserción histórica inválida por límite superior

Se intenta:

```text
29/08 → 12570
```

Fallaría:

```text
12570 > 12555
```

---

# 25. Regla general de inserción

Si existen lectura anterior y siguiente:

```text
lecturaAnterior
    <=
nuevaLectura
    <=
lecturaSiguiente
```

Si solo existe anterior:

```text
nuevaLectura >= lecturaAnterior
```

Si solo existe siguiente:

```text
nuevaLectura <= lecturaSiguiente
```

Si no existe ninguna:

```text
primera lectura
```

---

# 26. ¿Puede insertarse una lectura antes de la lectura base?

Sí, pero solamente un ADMIN.

Ejemplo existente:

```text
30/08 → 12555
```

Posteriormente se encuentra una medición real:

```text
29/08 → 12547
```

Puede insertarse siempre que:

```text
12547 <= 12555
```

La lectura del 29 pasa a ser la nueva lectura cronológicamente inicial.

---

# 27. Efecto de insertar una lectura histórica

Ejemplo antes:

```text
28/08 → 12540
30/08 → 12555
```

El sistema conoce únicamente:

```text
intervalo 28 → 30 = 15 kWh
```

Después de insertar:

```text
29/08 → 12547
```

podemos calcular:

```text
29/08 = 7 kWh
30/08 = 8 kWh
```

No necesitamos actualizar una tabla de consumos.

Las estadísticas cambian automáticamente porque son derivadas.

---

# 28. Transacción de registro

Toda creación se ejecutará dentro de una transacción.

Conceptualmente:

```text
BEGIN
   ↓
bloquear medidor principal
   ↓
comprobar que está activo
   ↓
comprobar fecha
   ↓
comprobar duplicado
   ↓
buscar lectura anterior
   ↓
buscar lectura siguiente
   ↓
validar secuencia
   ↓
INSERT
   ↓
COMMIT
```

Si algo falla:

```text
ROLLBACK
```

---

# 29. ¿Por qué bloquear el medidor?

Tenemos dos usuarios.

Puede ocurrir:

```text
Usuario A                 Usuario B

comprueba                 comprueba
no existe lectura         no existe lectura
     │                         │
     ▼                         ▼
intenta insertar          intenta insertar
```

Si ambas operaciones ocurren casi simultáneamente, necesitamos evitar inconsistencias.

---

# 30. Estrategia de concurrencia

Como durante el MVP existe un solo medidor, podemos utilizar una solución simple y educativa:

```sql
SELECT id_medidor
FROM medidores
WHERE id_medidor = $1
FOR UPDATE;
```

La fila del medidor funciona como punto de serialización para las mutaciones de sus lecturas.

---

# 31. Flujo concurrente

```text
Usuario A
BEGIN
bloquea medidor
valida
inserta
COMMIT

Usuario B
espera el bloqueo
        ↓
después vuelve a validar
        ↓
detecta fecha duplicada
        ↓
409
```

Esto evita depender únicamente de que ambas peticiones hayan leído el mismo estado previo.

---

# 32. Doble protección

Además del control del backend, PostgreSQL mantiene:

```sql
UNIQUE (id_medidor, fecha_lectura)
```

Por lo tanto tenemos:

```text
Servicio
   +
Transacción
   +
Bloqueo
   +
UNIQUE de PostgreSQL
```

No porque queramos complicarlo, sino porque cada mecanismo cumple una función distinta.

---

# 33. Respuesta de creación

Respuesta:

```http
201 Created
```

Ejemplo:

```json
{
  "idLectura": 25,
  "fechaLectura": "2026-08-30",
  "valorLectura": 12555,
  "registradoPor": {
    "idUsuario": 2,
    "nombre": "Usuario Casa"
  },
  "registradoEn": "2026-08-30T19:42:18-05:00"
}
```

No es obligatorio que `POST` devuelva todas las estadísticas.

Su responsabilidad principal es registrar la lectura.

---

# 34. Consulta de historial

Endpoint:

```http
GET /api/lecturas
```

Sin parámetros podrá devolver inicialmente las lecturas más recientes.

Ejemplo:

```http
GET /api/lecturas
```

---

# 35. Orden

El historial se devolverá por defecto:

```text
más reciente
    ↓
más antigua
```

SQL conceptualmente:

```text
ORDER BY fecha_lectura DESC
```

---

# 36. Filtros por fecha

La API permitirá:

```http
GET /api/lecturas?desde=2026-08-01&hasta=2026-08-31
```

Esto será útil para:

* historial;
* dashboard;
* análisis mensual;
* pruebas.

---

# 37. Validación del rango

Debe cumplirse:

```text
desde <= hasta
```

Ejemplo inválido:

```text
desde = 2026-08-30
hasta = 2026-08-01
```

Respuesta:

```http
422 Unprocessable Content
```

---

# 38. Paginación

Aunque tendremos muy pocos datos, incorporaremos una paginación sencilla para enseñar buenas prácticas.

Parámetros:

```text
pagina
limite
```

Ejemplo:

```http
GET /api/lecturas?pagina=1&limite=30
```

Valor inicial:

```text
pagina = 1
limite = 30
```

Máximo recomendado:

```text
100
```

---

# 39. Respuesta del historial

Ejemplo:

```json
{
  "datos": [
    {
      "idLectura": 25,
      "fechaLectura": "2026-08-30",
      "valorLectura": 12555,
      "registradoPor": "Usuario Casa",
      "registradoEn": "2026-08-30T19:42:18-05:00"
    },
    {
      "idLectura": 24,
      "fechaLectura": "2026-08-29",
      "valorLectura": 12547,
      "registradoPor": "Administrador",
      "registradoEn": "2026-08-29T19:35:02-05:00"
    }
  ],
  "paginacion": {
    "pagina": 1,
    "limite": 30,
    "total": 2,
    "totalPaginas": 1
  }
}
```

---

# 40. ¿Debe el historial mostrar consumo?

Sí, puede mostrarlo como dato derivado.

Ejemplo:

```json
{
  "idLectura": 25,
  "fechaLectura": "2026-08-30",
  "valorLectura": 12555,
  "consumoDiario": 8
}
```

Pero deberá respetarse la regla de días faltantes.

---

# 41. Ejemplo continuo

```text
28 → 12540
29 → 12547
30 → 12555
```

Resultado:

```text
28 → consumo null
29 → 7
30 → 8
```

---

# 42. Ejemplo discontinuo

```text
28 → 12540
30 → 12555
```

Resultado:

```text
28 → consumoDiario null
30 → consumoDiario null
```

La diferencia:

```text
15 kWh
```

podrá representarse como:

```text
consumoIntervalo = 15
diasIntervalo = 2
```

---

# 43. Respuesta conceptual con intervalo

```json
{
  "idLectura": 25,
  "fechaLectura": "2026-08-30",
  "valorLectura": 12555,
  "consumoDiario": null,
  "intervalo": {
    "desde": "2026-08-28",
    "hasta": "2026-08-30",
    "dias": 2,
    "consumo": 15
  }
}
```

Esto permite que React muestre información correcta sin inventar consumo diario.

---

# 44. Primera lectura en historial

Ejemplo:

```json
{
  "idLectura": 1,
  "fechaLectura": "2026-08-01",
  "valorLectura": 12000,
  "consumoDiario": null,
  "intervalo": null,
  "esLecturaBase": true
}
```

---

# 45. Última lectura

Endpoint:

```http
GET /api/lecturas/ultima
```

Respuesta:

```json
{
  "idLectura": 25,
  "fechaLectura": "2026-08-30",
  "valorLectura": 12555,
  "registradoEn": "2026-08-30T19:42:18-05:00"
}
```

---

# 46. Sin lecturas

Si todavía no existe ninguna:

```http
GET /api/lecturas/ultima
```

puede responder:

```http
200 OK
```

```json
{
  "lectura": null
}
```

No consideramos la ausencia inicial de lecturas un error del servidor.

---

# 47. Consultar una lectura

Endpoint:

```http
GET /api/lecturas/:id
```

Ejemplo:

```http
GET /api/lecturas/25
```

---

# 48. Lectura inexistente

Respuesta:

```http
404 Not Found
```

```json
{
  "error": {
    "codigo": "LECTURA_NO_ENCONTRADA",
    "mensaje": "La lectura solicitada no existe."
  }
}
```

---

# 49. Corrección de lectura

Endpoint:

```http
PATCH /api/lecturas/:id
```

La corrección modificará inicialmente únicamente:

```text
valorLectura
```

No permitiremos cambiar libremente:

```text
fechaLectura
```

---

# 50. ¿Por qué no modificar la fecha?

Cambiar:

```text
29/08 → 30/08
```

no es una simple corrección numérica.

Puede afectar:

* duplicados;
* orden cronológico;
* lectura anterior;
* lectura siguiente;
* estadísticas;
* permisos diarios.

Para mantener el MVP claro:

```text
fechaLectura es inmutable
```

una vez creado el registro.

Si en una versión futura necesitamos corregir fechas, tendrá su propia regla.

---

# 51. Entrada de corrección

```json
{
  "valorLectura": 12556
}
```

---

# 52. Permiso USUARIO

Un usuario normal únicamente puede modificar una lectura cuya:

```text
fechaLectura = hoy
```

Ejemplo:

Hoy:

```text
30/08/2026
```

Puede corregir:

```text
30/08/2026
```

No puede corregir:

```text
29/08/2026
```

---

# 53. Permiso ADMIN

ADMIN puede corregir:

```text
hoy
o
cualquier lectura histórica
```

Nunca una fecha futura, porque esas lecturas no deberían existir.

---

# 54. Validación de corrección

Antes de actualizar se deben consultar:

```text
lectura anterior
lectura siguiente
```

Debe cumplirse:

```text
anterior <= nuevoValor <= siguiente
```

según existan esos límites.

---

# 55. Ejemplo válido

```text
28 → 12540
29 → 12547
30 → 12555
```

Se cambia:

```text
29 → 12549
```

Validación:

```text
12540 <= 12549 <= 12555
```

Correcto.

---

# 56. Ejemplo inválido inferior

Se intenta:

```text
29 → 12530
```

Fallaría:

```text
12530 < 12540
```

---

# 57. Ejemplo inválido superior

Se intenta:

```text
29 → 12560
```

Fallaría:

```text
12560 > 12555
```

---

# 58. Corrección de última lectura

Si estamos modificando:

```text
30 → 12555
```

y no existe lectura posterior:

solo debemos validar:

```text
nuevoValor >= lecturaAnterior
```

---

# 59. Corrección de primera lectura

Si modificamos la lectura cronológicamente inicial y existe una siguiente:

```text
nuevoValor <= lecturaSiguiente
```

---

# 60. Corrección con mismo valor

Será válida enviar:

```text
12555 → 12555
```

pero no existe realmente ningún cambio.

Podemos responder normalmente sin modificar innecesariamente auditoría.

Recomendación:

```text
si el valor no cambió
    devolver estado actual
    sin actualizar actualizado_en
```

---

# 61. Auditoría mínima

Cuando sí exista una modificación:

```text
id_usuario_registro
```

NO cambia.

Se actualizará:

```text
id_usuario_actualizacion
actualizado_en
```

Ejemplo:

```text
Registró:
Usuario 2

Corrigió:
ADMIN 1
```

---

# 62. Transacción de corrección

```text
BEGIN
   ↓
bloquear medidor
   ↓
buscar lectura
   ↓
comprobar permiso
   ↓
buscar anterior
   ↓
buscar siguiente
   ↓
validar valor
   ↓
UPDATE
   ↓
COMMIT
```

Si falla:

```text
ROLLBACK
```

---

# 63. Respuesta de corrección

```http
200 OK
```

```json
{
  "idLectura": 25,
  "fechaLectura": "2026-08-30",
  "valorLectura": 12556,
  "actualizadoPor": {
    "idUsuario": 1,
    "nombre": "Administrador"
  },
  "actualizadoEn": "2026-08-30T20:17:42-05:00"
}
```

---

# 64. Impacto de una corrección

Ejemplo:

Antes:

```text
28 → 12540
29 → 12547
30 → 12555
```

Consumos:

```text
29 → 7
30 → 8
```

Corrección:

```text
29 → 12549
```

Después:

```text
29 → 9
30 → 6
```

No se ejecutará:

```text
UPDATE consumos
```

porque no existe esa tabla.

Las consultas derivadas producirán los nuevos resultados.

---

# 65. Errores de negocio

Definimos inicialmente:

```text
LECTURA_NO_ENCONTRADA
LECTURA_FECHA_DUPLICADA
LECTURA_VALOR_INVALIDO
LECTURA_FECHA_INVALIDA
LECTURA_FECHA_FUTURA
LECTURA_HISTORICA_NO_PERMITIDA
LECTURA_CORRECCION_NO_PERMITIDA
LECTURA_MENOR_QUE_ANTERIOR
LECTURA_MAYOR_QUE_SIGUIENTE
MEDIDOR_NO_ENCONTRADO
MEDIDOR_INACTIVO
```

---

# 66. Valor inválido

Ejemplo:

```json
{
  "valorLectura": -1
}
```

Respuesta:

```http
422 Unprocessable Content
```

```json
{
  "error": {
    "codigo": "LECTURA_VALOR_INVALIDO",
    "mensaje": "La lectura debe ser un número entero mayor o igual a cero."
  }
}
```

---

# 67. Decimal

Entrada:

```json
{
  "valorLectura": 12555.5
}
```

Respuesta:

```http
422 Unprocessable Content
```

Mismo código:

```text
LECTURA_VALOR_INVALIDO
```

---

# 68. Fecha futura

Respuesta:

```http
422 Unprocessable Content
```

```json
{
  "error": {
    "codigo": "LECTURA_FECHA_FUTURA",
    "mensaje": "No se pueden registrar lecturas de fechas futuras."
  }
}
```

---

# 69. USUARIO intenta histórico

Ejemplo:

Hoy:

```text
30/08
```

USUARIO envía:

```text
29/08
```

Respuesta:

```http
403 Forbidden
```

```json
{
  "error": {
    "codigo": "LECTURA_HISTORICA_NO_PERMITIDA",
    "mensaje": "Solo un administrador puede registrar lecturas históricas."
  }
}
```

---

# 70. USUARIO intenta corregir histórico

Respuesta:

```http
403 Forbidden
```

```json
{
  "error": {
    "codigo": "LECTURA_CORRECCION_NO_PERMITIDA",
    "mensaje": "Solo un administrador puede corregir lecturas históricas."
  }
}
```

---

# 71. Lectura menor que anterior

Respuesta:

```http
422 Unprocessable Content
```

```json
{
  "error": {
    "codigo": "LECTURA_MENOR_QUE_ANTERIOR",
    "mensaje": "La lectura no puede ser inferior a la lectura anterior.",
    "detalles": {
      "lecturaAnterior": 12547
    }
  }
}
```

---

# 72. Lectura mayor que siguiente

Respuesta:

```http
422 Unprocessable Content
```

```json
{
  "error": {
    "codigo": "LECTURA_MAYOR_QUE_SIGUIENTE",
    "mensaje": "La lectura no puede superar la lectura siguiente.",
    "detalles": {
      "lecturaSiguiente": 12555
    }
  }
}
```

---

# 73. Medidor inactivo

Aunque durante el MVP no gestionaremos varios medidores, el backend debe comprobar:

```text
activo = true
```

Si el medidor principal está inactivo:

```http
409 Conflict
```

```json
{
  "error": {
    "codigo": "MEDIDOR_INACTIVO",
    "mensaje": "El medidor no se encuentra habilitado para registrar lecturas."
  }
}
```

---

# 74. Regla sobre zonas horarias

Como la aplicación funciona inicialmente en Ecuador, debemos evitar que:

```text
hoy
```

dependa accidentalmente de UTC.

La fecha de negocio deberá evaluarse utilizando la zona horaria configurada para la aplicación.

Valor inicial:

```text
America/Guayaquil
```

---

# 75. Variable de configuración

Conceptualmente:

```text
APP_TIMEZONE=America/Guayaquil
```

Esto será importante cuando el servidor utilice otra zona horaria.

---

# 76. Diferencia entre fecha e instante

Ejemplo:

```text
fechaLectura
2026-08-30
```

significa:

```text
día de la medición
```

Mientras:

```text
registradoEn
2026-08-31T00:15:00Z
```

representa:

```text
instante real
```

Ambos conceptos no deben confundirse.

---

# 77. Caso especial cerca de medianoche

Supongamos que en Ecuador todavía es:

```text
30/08/2026 23:58
```

aunque UTC ya corresponda a:

```text
31/08/2026
```

Para nuestras reglas:

```text
hoy = 30/08/2026
```

porque el dominio utiliza:

```text
America/Guayaquil
```

---

# 78. No confiar en la fecha del frontend

React puede proponer automáticamente:

```text
fecha de hoy
```

pero el backend debe volver a validarla.

Nunca debemos asumir:

> Si el botón no permite una fecha futura, entonces la API está protegida.

El usuario puede llamar directamente a la API.

---

# 79. Servicio conceptual

La lógica principal estará posteriormente en algo parecido a:

```text
ServicioLecturas
```

o su equivalente en la convención definitiva del proyecto.

Responsabilidades:

```text
registrar lectura
corregir lectura
validar vecinos
determinar permisos
gestionar transacción
```

---

# 80. Repositorio conceptual

El acceso a PostgreSQL se encargará de operaciones como:

```text
buscar lectura por fecha
buscar lectura anterior
buscar lectura siguiente
insertar lectura
actualizar lectura
listar lecturas
obtener última lectura
bloquear medidor
```

El repositorio no debería decidir:

```text
USUARIO puede editar hoy
```

Esa es una regla de servicio.

---

# 81. Separación de responsabilidades

```text
Ruta
 ↓
Middleware autenticación
 ↓
Controlador
 ↓
Servicio
 ↓
Repositorio
 ↓
PostgreSQL
```

### Controlador

Interpreta HTTP.

### Servicio

Interpreta negocio.

### Repositorio

Interpreta persistencia.

---

# 82. Ejemplo de registro completo

Estado:

```text
28/08 → 12540
29/08 → 12547
```

Usuario:

```text
USUARIO
```

Hoy:

```text
30/08
```

Envía:

```json
{
  "fechaLectura": "2026-08-30",
  "valorLectura": 12555
}
```

Proceso:

```text
autenticado
    ↓
fecha = hoy
    ↓
entero
    ↓
no negativo
    ↓
no duplicado
    ↓
anterior = 12547
    ↓
12555 >= 12547
    ↓
INSERT
    ↓
201
```

---

# 83. Ejemplo con lectura duplicada

Estado:

```text
30/08 → 12555
```

Otro usuario intenta:

```text
30/08 → 12556
```

Resultado:

```text
409
LECTURA_FECHA_DUPLICADA
```

La interfaz podrá entonces indicar:

```text
Ya se registró la lectura de hoy.
```

---

# 84. Ejemplo de histórico ADMIN

Estado:

```text
28/08 → 12540
30/08 → 12555
```

ADMIN posee una medición real:

```text
29/08 → 12547
```

Proceso:

```text
ADMIN
  ↓
fecha pasada permitida
  ↓
anterior = 12540
siguiente = 12555
  ↓
12540 <= 12547 <= 12555
  ↓
INSERT
```

Resultado:

```text
201
```

---

# 85. Ejemplo de histórico USUARIO

Mismos datos.

USUARIO intenta registrar:

```text
29/08
```

Resultado inmediato:

```text
403
```

No importa que el valor sea cronológicamente correcto.

El usuario no tiene permiso.

---

# 86. Ejemplo de corrección de hoy

Hoy:

```text
30/08
```

Existe:

```text
30/08 → 12555
```

USUARIO detecta que leyó mal.

Valor correcto:

```text
12556
```

Si:

```text
12556 >= lectura anterior
```

entonces:

```text
PATCH permitido
```

---

# 87. Ejemplo de corrección histórica

Hoy:

```text
30/08
```

Se quiere cambiar:

```text
29/08
```

USUARIO:

```text
403
```

ADMIN:

```text
puede continuar con validaciones
```

---

# 88. No habrá eliminación

No tendremos:

```http
DELETE /api/lecturas/25
```

porque eliminar una lectura puede cambiar:

* intervalos;
* consumos;
* dashboard;
* estadísticas.

Durante el MVP preferimos:

```text
corregir
```

en lugar de eliminar.

---

# 89. ¿Qué ocurre si se registró una lectura totalmente falsa?

Durante el MVP:

```text
ADMIN deberá corregirla
```

si la fecha es correcta.

Si el error fuese la propia fecha, la aplicación todavía no tendrá una operación normal para resolverlo.

Ese caso quedará explícitamente:

```text
fuera del MVP
```

y podrá incorporarse posteriormente mediante auditoría o anulación lógica.

---

# 90. Pruebas derivadas

La futura implementación deberá cubrir como mínimo:

### Registro

```text
primera lectura
segunda lectura
lectura igual a anterior
lectura mayor a anterior
valor negativo
valor decimal
fecha futura
fecha duplicada
```

### Roles

```text
USUARIO registra hoy
ADMIN registra hoy
USUARIO intenta histórico
ADMIN registra histórico
```

### Secuencia

```text
menor que anterior
igual a anterior
entre anterior y siguiente
igual a siguiente
mayor que siguiente
```

### Corrección

```text
USUARIO corrige hoy
USUARIO intenta corregir histórico
ADMIN corrige histórico
corrección menor que anterior
corrección mayor que siguiente
corrección sin cambio
```

### Concurrencia

```text
dos usuarios intentan registrar el mismo día
```

Solo uno debe conseguir crear la lectura.

### Consultas

```text
historial vacío
historial con datos
filtro por fechas
paginación
última lectura
lectura inexistente
```

### Intervalos

```text
días consecutivos
un día faltante
varios días faltantes
primera lectura
```

---

# 91. Escenario de prueba crítico

Estado inicial:

```text
28/08 → 1000
30/08 → 1015
```

La API no debe devolver:

```text
30/08 → consumo diario 15
```

Debe devolver algo equivalente a:

```text
consumoDiario = null
consumoIntervalo = 15
diasIntervalo = 2
```

Esta prueba será fundamental.

---

# 92. Segundo escenario crítico

Después un ADMIN agrega:

```text
29/08 → 1008
```

Ahora la API deberá producir:

```text
29/08 → 8 kWh
30/08 → 7 kWh
```

sin actualizar manualmente ninguna tabla de estadísticas.

---

# 93. Tercer escenario crítico

Dos peticiones simultáneas:

```text
Usuario A → 30/08 → 12555
Usuario B → 30/08 → 12556
```

Resultado:

```text
una → 201
otra → 409
```

Nunca:

```text
dos lecturas para 30/08
```

---

# 94. Invariantes de SPEC-004

### LEC-INV-001

Existe como máximo una lectura por día y medidor.

### LEC-INV-002

Toda lectura es entera.

### LEC-INV-003

Toda lectura es mayor o igual a cero.

### LEC-INV-004

Nunca existe una lectura futura.

### LEC-INV-005

La secuencia cronológica nunca decrece.

### LEC-INV-006

Una lectura histórica insertada debe respetar tanto su vecino anterior como su vecino siguiente.

### LEC-INV-007

USUARIO crea únicamente la lectura del día actual.

### LEC-INV-008

ADMIN puede ingresar una medición histórica real.

### LEC-INV-009

USUARIO modifica únicamente la lectura del día actual.

### LEC-INV-010

ADMIN puede modificar históricos.

### LEC-INV-011

La fecha de una lectura no se modifica durante el MVP.

### LEC-INV-012

Las lecturas no se eliminan durante el MVP.

### LEC-INV-013

Una corrección conserva quién creó originalmente el registro.

### LEC-INV-014

Una corrección registra quién realizó la última modificación.

### LEC-INV-015

El consumo nunca es recibido desde el cliente.

### LEC-INV-016

Los días faltantes nunca se convierten en consumos diarios inventados.

### LEC-INV-017

Las mutaciones de un mismo medidor deben ser consistentes frente a concurrencia.

---

# 95. Decisiones congeladas por SPEC-004

1. `POST /api/lecturas` registra mediciones.
2. `GET /api/lecturas` consulta historial.
3. `GET /api/lecturas/ultima` obtiene la medición más reciente.
4. `GET /api/lecturas/:id` consulta una lectura.
5. `PATCH /api/lecturas/:id` corrige el valor.
6. No existe DELETE en el MVP.
7. USUARIO registra únicamente hoy.
8. ADMIN puede registrar mediciones históricas reales.
9. Ningún rol registra fechas futuras.
10. `valorLectura` es entero.
11. `valorLectura >= 0`.
12. La fecha de una lectura es inmutable.
13. Una nueva lectura debe respetar anterior y siguiente.
14. Una corrección debe respetar anterior y siguiente.
15. Las mutaciones utilizan transacción.
16. Las mutaciones bloquean el medidor mediante `FOR UPDATE`.
17. PostgreSQL mantiene además `UNIQUE(id_medidor, fecha_lectura)`.
18. Los datos derivados no se almacenan.
19. El historial puede devolver `consumoDiario`.
20. Cuando falta información, `consumoDiario = null`.
21. Puede devolverse información separada de consumo de intervalo.
22. La fecha de negocio se evalúa usando `America/Guayaquil`.
23. El backend nunca confía únicamente en restricciones del frontend.

---

# 96. Criterio de finalización

Un aprendiz debería poder responder:

1. ¿Qué dato escribe el usuario?
2. ¿Por qué el usuario no escribe el consumo?
3. ¿Quién puede registrar una lectura histórica?
4. ¿Puede un usuario normal registrar ayer?
5. ¿Por qué una lectura histórica necesita comprobar anterior y siguiente?
6. ¿Qué sucede si ya existe una lectura del mismo día?
7. ¿Puede modificarse la fecha de una lectura?
8. ¿Puede eliminarse una lectura?
9. ¿Quién puede corregir históricos?
10. ¿Por qué usamos una transacción?
11. ¿Por qué bloqueamos la fila del medidor?
12. ¿Qué ocurre si dos usuarios registran al mismo tiempo?
13. ¿Qué representa `consumoDiario = null`?
14. ¿Qué diferencia existe entre consumo diario y consumo de intervalo?
15. ¿Por qué la zona horaria es una regla del dominio?
16. ¿Qué ocurre con las estadísticas después de corregir una lectura?

Si estas respuestas están claras, `SPEC-004` está definida.
