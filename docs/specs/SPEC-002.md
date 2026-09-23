# SPEC-002 — Modelo de datos PostgreSQL

## 1. Objetivo

Traducir las reglas de negocio definidas en `SPEC-001` a un modelo de persistencia para PostgreSQL.

Esta especificación define:

* tablas;
* columnas;
* tipos de datos;
* claves primarias;
* claves foráneas;
* restricciones;
* índices;
* relaciones;
* reglas que puede proteger PostgreSQL;
* reglas que deberán permanecer en el backend.

El objetivo no es crear muchas tablas, sino construir el **modelo mínimo necesario para el MVP**.

---

# 2. Base de datos

Nombre provisional:

```text
consumo_electrico
```

Motor:

```text
PostgreSQL
```

No se utilizará ORM.

El backend utilizará posteriormente:

```text
Node.js
Express
pg
```

Las consultas SQL serán explícitas.

---

# 3. Convención de nombres

En PostgreSQL utilizaremos:

```text
snake_case
```

Ejemplos:

```text
usuarios
lecturas_medidor
id_usuario
fecha_lectura
valor_lectura
creado_en
```

Esto evita tener que utilizar comillas constantemente en PostgreSQL y mantiene una convención uniforme.

---

# 4. Tablas necesarias

Para el MVP solamente necesitamos tres tablas principales:

```text
usuarios
medidores
lecturas_medidor
```

Relación:

```text
┌──────────────┐
│   usuarios   │
└──────┬───────┘
       │
       │ registra
       ▼
┌─────────────────────┐
│  lecturas_medidor   │
└──────────┬──────────┘
           │
           │ pertenece
           ▼
    ┌──────────────┐
    │  medidores   │
    └──────────────┘
```

No existirá una tabla:

```text
consumos
```

porque el consumo es un dato derivado.

---

# 5. Tabla `usuarios`

Representa las personas autorizadas para utilizar la aplicación.

Estructura conceptual:

| Campo          | Tipo         | Obligatorio |
| -------------- | ------------ | ----------- |
| id_usuario     | BIGINT       | Sí          |
| nombre         | VARCHAR(100) | Sí          |
| correo         | VARCHAR(254) | Sí          |
| password_hash  | TEXT         | Sí          |
| rol            | VARCHAR(20)  | Sí          |
| estado         | VARCHAR(20)  | Sí          |
| tema           | VARCHAR(20)  | Sí          |
| creado_en      | TIMESTAMPTZ  | Sí          |
| actualizado_en | TIMESTAMPTZ  | Sí          |

---

# 6. `id_usuario`

Tipo:

```sql
BIGINT GENERATED ALWAYS AS IDENTITY
```

Será la clave primaria.

Ejemplo:

```text
1
2
3
```

No será introducida manualmente.

PostgreSQL será responsable de generar el identificador.

---

# 7. `nombre`

Tipo:

```sql
VARCHAR(100)
```

Reglas:

* obligatorio;
* no puede estar vacío;
* máximo 100 caracteres.

Ejemplo:

```text
José Lucas
```

---

# 8. `correo`

Tipo:

```sql
VARCHAR(254)
```

Reglas:

* obligatorio;
* no puede estar vacío;
* no puede repetirse.

Ejemplo:

```text
usuario@correo.com
```

La aplicación normalizará posteriormente el correo.

Por ejemplo:

```text
Usuario@Correo.com
```

deberá considerarse equivalente a:

```text
usuario@correo.com
```

Por esta razón la unicidad deberá proteger también el correo normalizado.

---

# 9. `password_hash`

Tipo:

```sql
TEXT
```

No se almacenará:

```text
123456
```

Se almacenará únicamente el resultado seguro generado por el mecanismo de protección de contraseñas.

Ejemplo conceptual:

```text
$2b$12$...
```

La elección exacta del algoritmo se definirá en:

```text
SPEC-003 — Usuarios, autenticación y roles
```

---

# 10. `rol`

Tipo:

```sql
VARCHAR(20)
```

Valores permitidos:

```text
ADMIN
USUARIO
```

Cualquier otro valor deberá ser rechazado.

Ejemplos inválidos:

```text
SUPERADMIN
CLIENTE
ROOT
INVITADO
```

---

# 11. `estado`

Tipo:

```sql
VARCHAR(20)
```

Valores permitidos:

```text
ACTIVO
INACTIVO
```

Valor inicial recomendado:

```text
ACTIVO
```

---

# 12. `tema`

Tipo:

```sql
VARCHAR(20)
```

Valores permitidos:

```text
SISTEMA
CLARO
OSCURO
```

Valor inicial:

```text
SISTEMA
```

Cada usuario tendrá su propia preferencia.

---

# 13. Fechas de usuario

Se almacenarán:

```text
creado_en
actualizado_en
```

Tipo:

```sql
TIMESTAMPTZ
```

Esto significa:

```text
timestamp with time zone
```

Utilizaremos este tipo para los instantes reales del sistema.

Valor inicial:

```sql
CURRENT_TIMESTAMP
```

---

# 14. SQL de `usuarios`

```sql
CREATE TABLE usuarios (
    id_usuario BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(254) NOT NULL,
    password_hash TEXT NOT NULL,

    rol VARCHAR(20) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    tema VARCHAR(20) NOT NULL DEFAULT 'SISTEMA',

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_usuarios_nombre_no_vacio
        CHECK (BTRIM(nombre) <> ''),

    CONSTRAINT chk_usuarios_correo_no_vacio
        CHECK (BTRIM(correo) <> ''),

    CONSTRAINT chk_usuarios_rol
        CHECK (rol IN ('ADMIN', 'USUARIO')),

    CONSTRAINT chk_usuarios_estado
        CHECK (estado IN ('ACTIVO', 'INACTIVO')),

    CONSTRAINT chk_usuarios_tema
        CHECK (tema IN ('SISTEMA', 'CLARO', 'OSCURO'))
);
```

---

# 15. Unicidad del correo

No utilizaremos únicamente:

```sql
UNIQUE (correo)
```

porque PostgreSQL podría considerar diferentes:

```text
Usuario@correo.com
usuario@correo.com
```

Para nuestra aplicación deben representar el mismo correo.

Crearemos:

```sql
CREATE UNIQUE INDEX ux_usuarios_correo_normalizado
ON usuarios (LOWER(BTRIM(correo)));
```

Así:

```text
Usuario@Correo.com
```

y:

```text
usuario@correo.com
```

no podrán pertenecer a dos cuentas diferentes.

---

# 16. Tabla `medidores`

Representa el medidor físico de electricidad.

Durante el MVP existirá solamente:

```text
1 medidor
```

La tabla tendrá:

| Campo          | Tipo         |
| -------------- | ------------ |
| id_medidor     | BIGINT       |
| nombre         | VARCHAR(100) |
| unidad         | VARCHAR(10)  |
| activo         | BOOLEAN      |
| creado_en      | TIMESTAMPTZ  |
| actualizado_en | TIMESTAMPTZ  |

---

# 17. ¿Por qué crear tabla `medidores` si solo existe uno?

Podríamos evitarla y colocar las lecturas directamente.

Sin embargo, hacerlo nos obligaría a rediseñar las lecturas si posteriormente queremos:

```text
Medidor principal
Medidor local
Medidor segundo piso
```

Por eso mantendremos:

```text
lectura → medidor
```

desde el principio.

Esto no significa que el MVP soporte múltiples medidores en la interfaz.

El MVP continuará trabajando con uno.

---

# 18. `id_medidor`

Tipo:

```sql
BIGINT GENERATED ALWAYS AS IDENTITY
```

Clave primaria.

---

# 19. `nombre`

Ejemplo:

```text
Medidor principal
```

Será obligatorio.

---

# 20. `unidad`

Durante el MVP será:

```text
kWh
```

No permitiremos otras unidades todavía.

---

# 21. `activo`

Tipo:

```sql
BOOLEAN
```

Valores:

```text
TRUE
FALSE
```

Valor inicial:

```text
TRUE
```

---

# 22. SQL de `medidores`

```sql
CREATE TABLE medidores (
    id_medidor BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    nombre VARCHAR(100) NOT NULL,
    unidad VARCHAR(10) NOT NULL DEFAULT 'kWh',
    activo BOOLEAN NOT NULL DEFAULT TRUE,

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_medidores_nombre_no_vacio
        CHECK (BTRIM(nombre) <> ''),

    CONSTRAINT chk_medidores_unidad
        CHECK (unidad = 'kWh')
);
```

---

# 23. Medidor inicial

Al crear el sistema deberá existir:

```text
Medidor principal
```

Podremos inicializarlo mediante:

```sql
INSERT INTO medidores (nombre)
VALUES ('Medidor principal');
```

Resultado esperado:

| id_medidor | nombre            | unidad | activo |
| ---------: | ----------------- | ------ | ------ |
|          1 | Medidor principal | kWh    | true   |

---

# 24. Tabla `lecturas_medidor`

Esta será la tabla principal del dominio.

Representará las lecturas reales introducidas por los usuarios.

Campos:

| Campo                    | Tipo        | Obligatorio |
| ------------------------ | ----------- | ----------- |
| id_lectura               | BIGINT      | Sí          |
| id_medidor               | BIGINT      | Sí          |
| id_usuario_registro      | BIGINT      | Sí          |
| id_usuario_actualizacion | BIGINT      | No          |
| valor_lectura            | BIGINT      | Sí          |
| fecha_lectura            | DATE        | Sí          |
| registrado_en            | TIMESTAMPTZ | Sí          |
| actualizado_en           | TIMESTAMPTZ | Sí          |

---

# 25. `id_lectura`

Clave primaria.

```sql
BIGINT GENERATED ALWAYS AS IDENTITY
```

Ejemplo:

```text
1
2
3
4
```

---

# 26. `id_medidor`

Indica a qué medidor pertenece la lectura.

Será clave foránea hacia:

```text
medidores.id_medidor
```

No podrá existir una lectura cuyo medidor no exista.

---

# 27. `id_usuario_registro`

Indica qué usuario realizó originalmente la lectura.

Ejemplo:

```text
Usuario 2 registró:
30/08/2026 → 12555
```

Este dato deberá conservarse aunque posteriormente un administrador corrija la lectura.

---

# 28. `id_usuario_actualizacion`

Permitirá saber quién realizó la última modificación.

Inicialmente:

```text
NULL
```

Ejemplo:

Usuario normal registra:

```text
12555
```

Posteriormente administrador corrige:

```text
12556
```

Entonces:

```text
id_usuario_registro      = 2
id_usuario_actualizacion = 1
```

Esto proporciona una auditoría mínima sin crear todavía un sistema completo de auditoría.

---

# 29. `valor_lectura`

Tipo:

```sql
BIGINT
```

No utilizaremos:

```text
NUMERIC
DECIMAL
REAL
DOUBLE PRECISION
```

porque las lecturas no admiten decimales.

Ejemplos válidos:

```text
12500
12501
13042
```

PostgreSQL rechazará directamente:

```text
12500.5
```

para este campo.

---

# 30. ¿Por qué `BIGINT`?

También podríamos utilizar:

```sql
INTEGER
```

pero `BIGINT` nos proporciona un rango mucho mayor y prácticamente no añade complejidad para este proyecto.

El dominio representa un contador acumulativo que puede crecer durante años.

Por ello utilizaremos:

```text
BIGINT
```

---

# 31. `fecha_lectura`

Tipo:

```sql
DATE
```

Ejemplo:

```text
2026-08-30
```

Esta fecha representa:

> el día al que pertenece la lectura.

No representa necesariamente el instante exacto en que el usuario presionó el botón.

---

# 32. `registrado_en`

Tipo:

```sql
TIMESTAMPTZ
```

Representa cuándo se creó realmente el registro.

Ejemplo conceptual:

```text
2026-08-30 19:42:18
```

De esta forma distinguimos:

```text
fecha_lectura
```

de:

```text
momento de registro
```

---

# 33. `actualizado_en`

Representará cuándo fue modificada por última vez la lectura.

Inicialmente tendrá el mismo instante aproximado que:

```text
registrado_en
```

Cuando se corrija:

```text
actualizado_en
```

cambiará.

---

# 34. SQL de `lecturas_medidor`

```sql
CREATE TABLE lecturas_medidor (
    id_lectura BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_medidor BIGINT NOT NULL,
    id_usuario_registro BIGINT NOT NULL,
    id_usuario_actualizacion BIGINT NULL,

    valor_lectura BIGINT NOT NULL,
    fecha_lectura DATE NOT NULL,

    registrado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_lecturas_medidor
        FOREIGN KEY (id_medidor)
        REFERENCES medidores (id_medidor)
        ON DELETE RESTRICT,

    CONSTRAINT fk_lecturas_usuario_registro
        FOREIGN KEY (id_usuario_registro)
        REFERENCES usuarios (id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT fk_lecturas_usuario_actualizacion
        FOREIGN KEY (id_usuario_actualizacion)
        REFERENCES usuarios (id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT chk_lecturas_valor_no_negativo
        CHECK (valor_lectura >= 0),

    CONSTRAINT uq_lecturas_medidor_fecha
        UNIQUE (id_medidor, fecha_lectura)
);
```

---

# 35. Una lectura por día

La regla:

```text
Solo una lectura por medidor y fecha
```

estará protegida directamente por PostgreSQL mediante:

```sql
UNIQUE (id_medidor, fecha_lectura)
```

Ejemplo existente:

```text
Medidor 1
30/08/2026
12555
```

Si intentamos insertar:

```text
Medidor 1
30/08/2026
12560
```

PostgreSQL deberá rechazarlo.

Esto es importante porque aunque el frontend o backend contengan un error, la base de datos continúa protegiendo la regla.

---

# 36. Protección contra valores negativos

La regla:

```text
valor_lectura >= 0
```

se protege mediante:

```sql
CHECK (valor_lectura >= 0)
```

Ejemplo:

```text
12500
```

válido.

```text
0
```

válido.

```text
-1
```

inválido.

---

# 37. Protección contra decimales

No necesitaremos:

```sql
CHECK (...)
```

para los decimales.

El propio tipo:

```sql
BIGINT
```

forma parte de la protección del dominio.

La base de datos almacena números enteros.

---

# 38. Relaciones

Las relaciones quedan:

```text
USUARIOS
   │
   │ 1
   │
   │
   │ N
   ▼
LECTURAS_MEDIDOR
   │
   │ N
   │
   │ 1
   ▼
MEDIDORES
```

Un usuario puede registrar:

```text
0..N lecturas
```

Cada lectura pertenece a:

```text
1 usuario de registro
```

Cada medidor puede tener:

```text
0..N lecturas
```

Cada lectura pertenece a:

```text
1 medidor
```

---

# 39. Diagrama lógico

```text
┌───────────────────────────┐
│          usuarios         │
├───────────────────────────┤
│ PK id_usuario             │
│    nombre                 │
│    correo                 │
│    password_hash          │
│    rol                    │
│    estado                 │
│    tema                   │
│    creado_en              │
│    actualizado_en         │
└─────────────┬─────────────┘
              │
              │
              │
              ▼
┌───────────────────────────────┐
│       lecturas_medidor        │
├───────────────────────────────┤
│ PK id_lectura                 │
│ FK id_medidor                 │
│ FK id_usuario_registro        │
│ FK id_usuario_actualizacion   │
│    valor_lectura              │
│    fecha_lectura              │
│    registrado_en              │
│    actualizado_en             │
└───────────────┬───────────────┘
                │
                │
                ▼
       ┌────────────────────┐
       │     medidores      │
       ├────────────────────┤
       │ PK id_medidor      │
       │    nombre          │
       │    unidad          │
       │    activo          │
       │    creado_en       │
       │    actualizado_en  │
       └────────────────────┘
```

---

# 40. Lo que deliberadamente NO almacenaremos

No crearemos columnas como:

```text
consumo_diario
consumo_semanal
consumo_mensual
consumo_anual
```

Tampoco:

```text
promedio_semanal
mayor_consumo
menor_consumo
```

Estos valores son derivados.

La fuente de verdad continúa siendo:

```text
lecturas_medidor.valor_lectura
```

---

# 41. Ejemplo de datos

Supongamos:

```text
Medidor principal
```

Lecturas:

| fecha_lectura | valor_lectura |
| ------------- | ------------: |
| 2026-08-27    |         12532 |
| 2026-08-28    |         12540 |
| 2026-08-29    |         12547 |
| 2026-08-30    |         12555 |

La base de datos almacenará exactamente esas lecturas.

No almacenará:

| Fecha | Consumo |
| ----- | ------: |
| 28    |       8 |
| 29    |       7 |
| 30    |       8 |

Esos valores se calcularán.

---

# 42. Obtención del consumo mediante SQL

PostgreSQL dispone de funciones de ventana.

Podemos obtener la lectura anterior utilizando:

```sql
LAG()
```

Ejemplo conceptual:

```sql
SELECT
    fecha_lectura,
    valor_lectura,
    LAG(valor_lectura) OVER (
        PARTITION BY id_medidor
        ORDER BY fecha_lectura
    ) AS lectura_anterior
FROM lecturas_medidor;
```

Resultado:

| Fecha | Lectura | Anterior |
| ----- | ------: | -------: |
| 27/08 |   12532 |     NULL |
| 28/08 |   12540 |    12532 |
| 29/08 |   12547 |    12540 |
| 30/08 |   12555 |    12547 |

---

# 43. Cálculo básico

Podríamos obtener:

```sql
valor_lectura - lectura_anterior
```

Resultado:

| Fecha | Consumo |
| ----- | ------: |
| 27/08 |    NULL |
| 28/08 |       8 |
| 29/08 |       7 |
| 30/08 |       8 |

El:

```text
NULL
```

de la primera lectura es correcto.

Significa:

```text
No existe información anterior suficiente.
```

No significa:

```text
0 kWh
```

---

# 44. Detección de días faltantes

También necesitamos conocer la fecha anterior.

Conceptualmente:

```sql
LAG(fecha_lectura)
```

Así podemos comparar:

```text
fecha actual - fecha anterior
```

Ejemplo:

```text
28/08 - 27/08 = 1 día
```

Por lo tanto podemos calcular consumo diario.

Pero:

```text
30/08 - 28/08 = 2 días
```

indica que falta una lectura.

---

# 45. Consulta conceptual correcta

Una consulta base podrá utilizar una estructura similar a:

```sql
WITH lecturas_ordenadas AS (
    SELECT
        id_lectura,
        id_medidor,
        fecha_lectura,
        valor_lectura,

        LAG(fecha_lectura) OVER (
            PARTITION BY id_medidor
            ORDER BY fecha_lectura
        ) AS fecha_anterior,

        LAG(valor_lectura) OVER (
            PARTITION BY id_medidor
            ORDER BY fecha_lectura
        ) AS lectura_anterior

    FROM lecturas_medidor
)

SELECT
    id_lectura,
    fecha_lectura,
    valor_lectura,
    fecha_anterior,
    lectura_anterior,

    CASE
        WHEN fecha_anterior IS NULL THEN NULL

        WHEN fecha_lectura - fecha_anterior = 1
            THEN valor_lectura - lectura_anterior

        ELSE NULL
    END AS consumo_diario,

    CASE
        WHEN fecha_anterior IS NULL THEN NULL
        ELSE valor_lectura - lectura_anterior
    END AS consumo_intervalo

FROM lecturas_ordenadas
ORDER BY fecha_lectura;
```

Esta consulta refleja una decisión central de nuestro dominio.

---

# 46. Ejemplo con todos los días

Datos:

```text
Lunes       1000
Martes      1008
Miércoles   1015
```

Resultado:

| Día       | Lectura | Consumo diario |
| --------- | ------: | -------------: |
| Lunes     |    1000 |           NULL |
| Martes    |    1008 |              8 |
| Miércoles |    1015 |              7 |

---

# 47. Ejemplo con un día faltante

Datos:

```text
Lunes       1000
Martes      SIN LECTURA
Miércoles   1015
```

Resultado conceptual:

| Día       | Lectura | Consumo diario | Consumo intervalo |
| --------- | ------: | -------------: | ----------------: |
| Lunes     |    1000 |           NULL |              NULL |
| Miércoles |    1015 |           NULL |                15 |

Esto es exactamente lo que necesitamos.

Sabemos:

```text
Consumo del intervalo = 15 kWh
```

pero:

```text
Consumo diario = desconocido
```

---

# 48. Por qué esta diferencia es importante

Sería incorrecto hacer:

```text
Miércoles = 15 kWh
```

porque esos 15 kWh pertenecen al intervalo:

```text
Lunes → Miércoles
```

También sería incorrecto:

```text
Martes     = 7.5
Miércoles  = 7.5
```

porque estaríamos inventando una distribución.

Nuestra base de datos conserva los hechos.

El sistema interpreta esos hechos sin fabricar información.

---

# 49. Índices

No agregaremos índices sin una necesidad concreta.

Esto también forma parte del aprendizaje.

La restricción:

```sql
UNIQUE (id_medidor, fecha_lectura)
```

ya crea internamente un índice adecuado para muchas consultas frecuentes:

```text
buscar las lecturas de un medidor
buscar una fecha determinada
buscar rangos de fechas de un medidor
```

Por lo tanto inicialmente no necesitamos llenar la base de datos de índices adicionales.

---

# 50. Índice opcional futuro

Si posteriormente necesitamos búsquedas frecuentes por usuario que realizó el registro, podremos agregar:

```sql
CREATE INDEX idx_lecturas_usuario_registro
ON lecturas_medidor (id_usuario_registro);
```

Pero no formará parte del esquema inicial mientras no exista una necesidad demostrada.

---

# 51. Reglas protegidas directamente por PostgreSQL

PostgreSQL podrá garantizar:

### DB-001

Toda tabla tiene una clave primaria.

### DB-002

Toda lectura pertenece a un medidor existente.

### DB-003

Toda lectura tiene un usuario de registro existente.

### DB-004

No existen dos lecturas para el mismo medidor y fecha.

### DB-005

Una lectura no puede ser negativa.

### DB-006

Las lecturas se almacenan como enteros.

### DB-007

Solo existen roles:

```text
ADMIN
USUARIO
```

### DB-008

Solo existen estados:

```text
ACTIVO
INACTIVO
```

### DB-009

Solo existen temas:

```text
SISTEMA
CLARO
OSCURO
```

### DB-010

El correo no puede repetirse ignorando mayúsculas y espacios exteriores.

---

# 52. Reglas que NO deben resolverse mediante un `CHECK`

Existen reglas que dependen de otras filas.

Por ejemplo:

```text
Nueva lectura >= lectura anterior
```

Una restricción `CHECK` tradicional analiza principalmente la propia fila.

No es la herramienta adecuada para comparar una lectura con registros anteriores y posteriores.

Por eso esta regla se validará en la capa de negocio.

---

# 53. Lectura no decreciente

El backend deberá comprobar:

```text
lecturaAnterior <= nuevaLectura
```

Ejemplo:

```text
Anterior: 12555
Nueva:    12560
```

válido.

```text
Anterior: 12555
Nueva:    12550
```

inválido.

---

# 54. Corrección histórica

Cuando se modifica una lectura intermedia deberá cumplirse:

```text
lecturaAnterior
    <=
lecturaCorregida
    <=
lecturaSiguiente
```

Ejemplo:

```text
Lunes      1000
Martes     1008
Miércoles  1015
```

Martes puede corregirse a:

```text
1010
```

porque:

```text
1000 <= 1010 <= 1015
```

Pero no:

```text
1020
```

porque:

```text
1020 > 1015
```

Esta será una validación del servicio del backend.

---

# 55. Fecha futura

La regla:

```text
fecha_lectura <= fecha actual
```

también se validará en el backend.

No utilizaremos inicialmente una restricción como:

```sql
CHECK (fecha_lectura <= CURRENT_DATE)
```

porque las restricciones `CHECK` son más apropiadas para condiciones estables sobre los valores de la fila.

La fecha actual cambia con el tiempo.

Mantendremos esta regla en la capa de negocio.

---

# 56. Usuario inactivo

La base de datos puede almacenar:

```text
estado = INACTIVO
```

Pero decidir:

```text
este usuario no puede iniciar sesión
```

corresponde a la lógica de autenticación.

Esta regla se implementará en:

```text
SPEC-003
```

---

# 57. Permisos ADMIN y USUARIO

PostgreSQL conocerá el valor:

```text
rol
```

pero reglas como:

```text
USUARIO no puede editar históricos
```

pertenecen al backend.

Por ejemplo:

```text
if rol === USUARIO
    solo puede corregir hoy
```

La base de datos no debe convertirse innecesariamente en nuestro sistema de autorización.

---

# 58. Matriz de responsabilidades

| Regla                       | PostgreSQL | Backend |
| --------------------------- | ---------- | ------- |
| ID único                    | Sí         | No      |
| Correo obligatorio          | Sí         | Sí      |
| Correo único                | Sí         | Sí      |
| Rol válido                  | Sí         | Sí      |
| Estado válido               | Sí         | Sí      |
| Tema válido                 | Sí         | Sí      |
| Lectura entera              | Sí         | Sí      |
| Lectura no negativa         | Sí         | Sí      |
| Una lectura por día         | Sí         | Sí      |
| Medidor existente           | Sí         | Sí      |
| Usuario existente           | Sí         | Sí      |
| Fecha no futura             | No         | Sí      |
| Lectura >= anterior         | No         | Sí      |
| Corrección <= siguiente     | No         | Sí      |
| Usuario activo para login   | No         | Sí      |
| ADMIN administra usuarios   | No         | Sí      |
| USUARIO no edita históricos | No         | Sí      |

La duplicación de ciertas validaciones es intencional.

El backend proporciona errores comprensibles.

PostgreSQL representa la última barrera de integridad.

---

# 59. Borrado de usuarios

No eliminaremos físicamente usuarios durante el MVP.

Utilizaremos:

```text
ACTIVO
INACTIVO
```

Esto evita perder la referencia histórica de quién registró una lectura.

Por ello:

```text
DELETE FROM usuarios
```

no será una operación normal de la aplicación.

---

# 60. Borrado de lecturas

El MVP tampoco tendrá eliminación normal de lecturas.

Una lectura incorrecta se corregirá según las reglas establecidas.

Esto conserva una estructura más predecible para el aprendizaje.

---

# 61. `ON DELETE RESTRICT`

Las claves foráneas utilizan:

```sql
ON DELETE RESTRICT
```

Por ejemplo:

si un usuario tiene lecturas registradas, PostgreSQL no permitirá eliminarlo físicamente fácilmente.

Esto ayuda a preservar:

```text
quién registró cada lectura
```

La solución será:

```text
desactivar usuario
```

no:

```text
eliminar usuario
```

---

# 62. Transacciones

Las operaciones que dependan de varias validaciones deberán ejecutarse posteriormente mediante transacciones.

Ejemplo de registro:

```text
BEGIN
   ↓
buscar lectura anterior
   ↓
validar nueva lectura
   ↓
insertar
   ↓
COMMIT
```

Si algo falla:

```text
ROLLBACK
```

Esto se diseñará con mayor detalle en la especificación de API y servicios.

---

# 63. Corrección mediante transacción

Ejemplo:

```text
BEGIN
   ↓
obtener lectura a modificar
   ↓
obtener lectura anterior
   ↓
obtener lectura siguiente
   ↓
validar nuevo valor
   ↓
actualizar lectura
   ↓
guardar usuario que corrigió
   ↓
actualizar actualizado_en
   ↓
COMMIT
```

Si alguna regla falla:

```text
ROLLBACK
```

---

# 64. Consumo después de una corrección

No necesitaremos ejecutar:

```text
actualizar consumo diario
actualizar consumo semanal
actualizar consumo mensual
```

porque esos datos no están almacenados.

Ejemplo:

Antes:

```text
1000
1008
1015
```

Después:

```text
1000
1010
1015
```

Cuando el sistema vuelva a consultar:

```text
Martes     10 kWh
Miércoles   5 kWh
```

Los resultados cambian automáticamente porque son derivados de las lecturas.

Esta es una ventaja importante del modelo.

---

# 65. Datos que se calcularán posteriormente

A partir de `lecturas_medidor` podremos obtener:

```text
consumo de ayer
consumo últimos 7 días
promedio diario
mayor consumo
menor consumo
consumo mensual
consumo anual
intervalos sin lectura
días sin información suficiente
```

Sin crear tablas adicionales.

---

# 66. ¿Necesitamos una tabla de estadísticas?

No.

No durante el MVP.

Sería innecesario crear:

```text
estadisticas_diarias
estadisticas_semanales
estadisticas_mensuales
```

El volumen de datos será extremadamente pequeño.

Una lectura diaria significa aproximadamente:

```text
365 filas por año
```

Después de 10 años:

```text
3 650 filas
```

PostgreSQL puede procesar esa cantidad sin ninguna dificultad.

---

# 67. ¿Necesitamos caché?

No.

---

# 68. ¿Necesitamos Redis?

No.

---

# 69. ¿Necesitamos particionar tablas?

No.

---

# 70. ¿Necesitamos procedimientos almacenados?

No durante el MVP.

---

# 71. ¿Necesitamos triggers?

No inicialmente.

Preferimos que las reglas de negocio importantes sean visibles y comprensibles en:

```text
servicios del backend
```

en lugar de esconder comportamiento en triggers.

Esto será especialmente útil para los aprendices.

---

# 72. Actualización de `actualizado_en`

Cuando el backend realice una modificación ejecutará explícitamente:

```sql
actualizado_en = CURRENT_TIMESTAMP
```

Ejemplo:

```sql
UPDATE lecturas_medidor
SET
    valor_lectura = $1,
    id_usuario_actualizacion = $2,
    actualizado_en = CURRENT_TIMESTAMP
WHERE id_lectura = $3;
```

No necesitamos un trigger para esta primera versión.

---

# 73. Estructura SQL inicial completa

El esquema base queda:

```sql
CREATE TABLE usuarios (
    id_usuario BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(254) NOT NULL,
    password_hash TEXT NOT NULL,

    rol VARCHAR(20) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    tema VARCHAR(20) NOT NULL DEFAULT 'SISTEMA',

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_usuarios_nombre_no_vacio
        CHECK (BTRIM(nombre) <> ''),

    CONSTRAINT chk_usuarios_correo_no_vacio
        CHECK (BTRIM(correo) <> ''),

    CONSTRAINT chk_usuarios_rol
        CHECK (rol IN ('ADMIN', 'USUARIO')),

    CONSTRAINT chk_usuarios_estado
        CHECK (estado IN ('ACTIVO', 'INACTIVO')),

    CONSTRAINT chk_usuarios_tema
        CHECK (tema IN ('SISTEMA', 'CLARO', 'OSCURO'))
);

CREATE UNIQUE INDEX ux_usuarios_correo_normalizado
ON usuarios (LOWER(BTRIM(correo)));


CREATE TABLE medidores (
    id_medidor BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    nombre VARCHAR(100) NOT NULL,
    unidad VARCHAR(10) NOT NULL DEFAULT 'kWh',
    activo BOOLEAN NOT NULL DEFAULT TRUE,

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_medidores_nombre_no_vacio
        CHECK (BTRIM(nombre) <> ''),

    CONSTRAINT chk_medidores_unidad
        CHECK (unidad = 'kWh')
);


CREATE TABLE lecturas_medidor (
    id_lectura BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_medidor BIGINT NOT NULL,
    id_usuario_registro BIGINT NOT NULL,
    id_usuario_actualizacion BIGINT NULL,

    valor_lectura BIGINT NOT NULL,
    fecha_lectura DATE NOT NULL,

    registrado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_lecturas_medidor
        FOREIGN KEY (id_medidor)
        REFERENCES medidores (id_medidor)
        ON DELETE RESTRICT,

    CONSTRAINT fk_lecturas_usuario_registro
        FOREIGN KEY (id_usuario_registro)
        REFERENCES usuarios (id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT fk_lecturas_usuario_actualizacion
        FOREIGN KEY (id_usuario_actualizacion)
        REFERENCES usuarios (id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT chk_lecturas_valor_no_negativo
        CHECK (valor_lectura >= 0),

    CONSTRAINT uq_lecturas_medidor_fecha
        UNIQUE (id_medidor, fecha_lectura)
);


INSERT INTO medidores (nombre)
VALUES ('Medidor principal');
```

---

# 74. Orden de creación

El orden importa debido a las claves foráneas.

Debe ser:

```text
1. usuarios
2. medidores
3. lecturas_medidor
4. datos iniciales
```

No podríamos crear correctamente una clave foránea hacia una tabla que todavía no existe.

---

# 75. Usuario administrador inicial

No incluiremos todavía algo como:

```sql
INSERT INTO usuarios (...)
VALUES (..., '123456', ...);
```

porque jamás debemos guardar una contraseña en texto plano.

La creación segura del primer administrador será parte de:

```text
SPEC-003 — Usuarios, autenticación y roles
```

Allí definiremos un mecanismo de inicialización apropiado.

---

# 76. Archivos SQL previstos

Cuando comencemos la implementación podremos utilizar algo parecido a:

```text
database/
├── migrations/
│   └── 001_esquema_inicial.sql
└── seeds/
    └── 001_medidor_principal.sql
```

Pero todavía no estamos obligados a crear estos archivos.

Esta especificación define qué deberán contener.

---

# 77. Qué aprendemos con SPEC-002

Esta especificación introduce conceptos fundamentales de bases de datos:

### Clave primaria

```text
PRIMARY KEY
```

Identifica una fila.

### Clave foránea

```text
FOREIGN KEY
```

Relaciona tablas.

### Restricción

```text
CHECK
```

Protege reglas simples.

### Unicidad

```text
UNIQUE
```

Evita duplicados.

### Índice

Permite proteger unicidad y acelerar búsquedas.

### `DATE`

Representa una fecha del dominio.

### `TIMESTAMPTZ`

Representa un instante real.

### `BIGINT`

Representa números enteros grandes.

### `NULL`

Puede representar correctamente:

```text
dato que no existe o no puede determinarse
```

y no necesariamente un error.

---

# 78. Principio educativo importante

No todas las reglas pertenecen a la base de datos.

Tampoco todas las reglas deben vivir exclusivamente en Node.js.

Debemos preguntarnos para cada requisito:

> ¿Dónde se puede proteger mejor esta regla?

Ejemplo:

```text
valor >= 0
```

PostgreSQL puede garantizarlo fácilmente.

Pero:

```text
un USUARIO solamente puede modificar la lectura de hoy
```

pertenece a la lógica de aplicación.

Esta separación será fundamental durante todo el proyecto.

---

# 79. Estado final del modelo

Nuestro modelo MVP queda:

```text
┌─────────────────────┐
│      USUARIOS       │
│                     │
│ ADMIN               │
│ USUARIO             │
└─────────┬───────────┘
          │
          │ registra
          ▼
┌─────────────────────┐
│  LECTURAS_MEDIDOR   │
│                     │
│ fecha               │
│ valor entero        │
│ quién registró      │
│ quién corrigió      │
└─────────┬───────────┘
          │
          │ pertenece
          ▼
┌─────────────────────┐
│      MEDIDORES      │
│                     │
│ Medidor principal   │
│ kWh                 │
└─────────────────────┘

          ↓

   DATOS DERIVADOS

consumo diario
consumo semanal
consumo mensual
consumo anual
promedios
máximos
gráficos
```

---

# 80. Decisiones congeladas por SPEC-002

Quedan definidas:

1. PostgreSQL como motor.
2. SQL explícito mediante `pg`.
3. Sin ORM.
4. Nombres SQL en `snake_case`.
5. Tres tablas iniciales.
6. `usuarios`.
7. `medidores`.
8. `lecturas_medidor`.
9. Lecturas almacenadas como `BIGINT`.
10. Sin decimales.
11. Fechas de medición mediante `DATE`.
12. Instantes del sistema mediante `TIMESTAMPTZ`.
13. Una lectura por medidor y día protegida mediante `UNIQUE`.
14. Consumo no almacenado.
15. Estadísticas no almacenadas.
16. Sin tabla de consumo.
17. Sin tabla de estadísticas.
18. Sin Redis.
19. Sin caché.
20. Sin triggers inicialmente.
21. Sin eliminación física normal de usuarios.
22. Sin eliminación normal de lecturas.
23. Correcciones conservan quién registró originalmente la lectura.
24. Correcciones registran quién realizó la última modificación.
25. PostgreSQL protege integridad estructural.
26. Node.js protegerá reglas contextuales y permisos.

---

# 81. Criterio de finalización de SPEC-002

Un aprendiz debería poder responder:

1. ¿Por qué existen tres tablas?
2. ¿Por qué `consumo` no es una tabla?
3. ¿Por qué `valor_lectura` es `BIGINT`?
4. ¿Cuál es la diferencia entre `DATE` y `TIMESTAMPTZ`?
5. ¿Qué hace una `PRIMARY KEY`?
6. ¿Qué hace una `FOREIGN KEY`?
7. ¿Cómo evitamos dos lecturas del mismo día?
8. ¿Cómo impedimos valores negativos?
9. ¿Por qué una lectura decimal no puede almacenarse?
10. ¿Por qué la lectura anterior no se almacena dentro de la fila?
11. ¿Cómo se obtiene el consumo?
12. ¿Qué ocurre si falta un día?
13. ¿Por qué no utilizamos triggers todavía?
14. ¿Qué reglas protege PostgreSQL?
15. ¿Qué reglas deberá proteger Node.js?

Si estas preguntas pueden responderse correctamente, `SPEC-002` está lista para avanzar.
