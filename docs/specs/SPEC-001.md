# SPEC-001 — Modelo de dominio y reglas de negocio

## 1. Objetivo

Definir formalmente los conceptos principales del sistema y las reglas que determinan cómo deben comportarse.

Esta especificación describe el dominio del problema sin depender todavía de:

* React;
* Express;
* PostgreSQL;
* REST;
* SQL;
* librerías específicas.

La implementación futura deberá respetar estas reglas.

---

# 2. Conceptos principales del dominio

El sistema estará compuesto inicialmente por los siguientes conceptos:

1. Usuario
2. Rol
3. Medidor
4. Lectura
5. Consumo
6. Preferencia de apariencia

Relación conceptual:

```text
USUARIO
   │
   │ registra
   ▼
LECTURA ───────── pertenece ─────────► MEDIDOR
   │
   │ permite calcular
   ▼
CONSUMO
```

El consumo no es introducido por el usuario.

El consumo se deriva de las lecturas.

---

# 3. Usuario

Un usuario representa una persona autorizada para acceder al sistema.

Inicialmente existirán aproximadamente dos usuarios.

Todos utilizarán el mismo medidor eléctrico de la vivienda.

Un usuario tendrá conceptualmente:

```text
Usuario
├── identificador
├── nombre
├── correo
├── contraseña
├── rol
├── estado
└── preferencia de apariencia
```

---

# 4. Roles

Existirán únicamente dos roles durante el MVP:

```text
ADMIN
USUARIO
```

## ADMIN

Tiene permisos administrativos.

Puede:

* consultar el dashboard;
* registrar lecturas;
* consultar historial;
* corregir la lectura actual;
* corregir lecturas históricas;
* crear usuarios;
* modificar usuarios;
* activar usuarios;
* desactivar usuarios;
* cambiar su configuración visual.

## USUARIO

Tiene permisos operativos.

Puede:

* consultar el dashboard;
* registrar la lectura diaria;
* consultar historial;
* corregir la lectura correspondiente al día actual;
* cambiar su configuración visual.

No puede:

* crear usuarios;
* modificar usuarios;
* desactivar usuarios;
* corregir lecturas históricas.

---

# 5. Estado del usuario

Un usuario podrá encontrarse inicialmente en uno de dos estados:

```text
ACTIVO
INACTIVO
```

Un usuario activo puede utilizar el sistema.

Un usuario inactivo no debe poder iniciar sesión.

---

# 6. Medidor

El medidor representa el dispositivo físico que mide el consumo eléctrico acumulado de la vivienda.

Durante el MVP existirá:

**un único medidor.**

Conceptualmente:

```text
Medidor
├── identificador
├── nombre
└── estado
```

Ejemplo:

```text
Medidor principal
```

Aunque solo exista uno durante el MVP, las lecturas deberán mantener una relación explícita con el medidor para facilitar una futura ampliación.

---

# 7. Lectura

Una lectura representa la numeración acumulada mostrada por el medidor en un determinado día.

Ejemplo:

```text
Fecha:   30/08/2026
Lectura: 12555
```

La lectura no representa directamente el consumo del día.

Representa el acumulado mostrado por el medidor.

Conceptualmente:

```text
Lectura
├── identificador
├── medidor
├── usuario que registró
├── valor
├── fecha de medición
├── fecha y hora de registro
├── fecha de creación
└── fecha de última modificación
```

---

# 8. Consumo

El consumo es un dato derivado.

No es una lectura introducida manualmente.

Se calcula mediante:

```text
consumo = lecturaActual - lecturaAnterior
```

Ejemplo:

```text
Lectura anterior = 12547
Lectura actual   = 12555

12555 - 12547 = 8 kWh
```

Por lo tanto:

```text
Consumo = 8 kWh
```

---

# 9. Fuente de verdad

La fuente de verdad serán las lecturas del medidor.

No deben existir múltiples fuentes independientes para representar el mismo consumo.

No se almacenarán inicialmente como valores independientes:

```text
consumoDiario
consumoSemanal
consumoMensual
consumoAnual
```

Estos valores deberán obtenerse utilizando las lecturas existentes.

---

# 10. Reglas de usuarios

## USR-001 — Correo obligatorio

Todo usuario deberá tener un correo electrónico.

---

## USR-002 — Correo único

No podrán existir dos usuarios con el mismo correo electrónico.

Ejemplo inválido:

```text
Usuario A → casa@email.com
Usuario B → casa@email.com
```

---

## USR-003 — Contraseña obligatoria

Todo usuario deberá disponer de una contraseña para autenticarse.

La contraseña real nunca deberá almacenarse directamente.

La forma técnica de protegerla se definirá en especificaciones posteriores.

---

## USR-004 — Rol obligatorio

Todo usuario deberá tener exactamente un rol.

Valores válidos:

```text
ADMIN
USUARIO
```

---

## USR-005 — Estado obligatorio

Todo usuario deberá tener un estado.

Valores permitidos:

```text
ACTIVO
INACTIVO
```

---

## USR-006 — Usuario inactivo

Un usuario con estado:

```text
INACTIVO
```

no podrá acceder al sistema.

---

## USR-007 — Creación de usuarios

Solo un administrador podrá crear usuarios.

---

## USR-008 — Sin registro público

El MVP no permitirá que una persona cree su propia cuenta mediante una pantalla pública de registro.

---

# 11. Reglas del medidor

## MED-001 — Medidor único durante el MVP

El sistema trabajará inicialmente con un solo medidor eléctrico.

---

## MED-002 — Lectura asociada al medidor

Toda lectura deberá pertenecer al medidor existente.

No podrá existir una lectura sin medidor asociado.

---

## MED-003 — Unidad

Las mediciones serán interpretadas en:

```text
kWh
```

---

# 12. Reglas de las lecturas

## LEC-001 — Lectura obligatoria

Toda medición debe incluir un valor de lectura.

---

## LEC-002 — Solo números enteros

Las lecturas deberán ser números enteros.

Ejemplos válidos:

```text
12500
12548
13002
```

Ejemplos inválidos:

```text
12548.5
12548.75
12A48
```

---

## LEC-003 — Lectura no negativa

La lectura deberá ser mayor o igual a cero.

Ejemplo válido:

```text
0
```

Ejemplo inválido:

```text
-150
```

---

## LEC-004 — Una lectura por día

Solo podrá existir una lectura oficial por fecha.

Ejemplo:

```text
30/08/2026 → 12555
```

No podrá registrarse posteriormente otra lectura nueva independiente para:

```text
30/08/2026
```

Si existe un error, deberá utilizarse el mecanismo de corrección correspondiente.

---

## LEC-005 — Fecha obligatoria

Toda lectura deberá corresponder a una fecha.

---

## LEC-006 — Fecha futura

No se podrá registrar una lectura correspondiente a una fecha futura.

Ejemplo:

Si hoy es:

```text
30/08/2026
```

será inválido registrar:

```text
31/08/2026
```

---

## LEC-007 — Usuario responsable

Toda lectura deberá conservar qué usuario realizó el registro.

---

## LEC-008 — Hora de registro

El sistema deberá conservar la fecha y hora exacta en que se realizó el registro.

Ejemplo:

```text
30/08/2026 19:41:26
```

La hora no modifica la regla de una lectura oficial por día.

---

# 13. Orden de las lecturas

Las lecturas se compararán cronológicamente utilizando su fecha de medición.

Ejemplo:

```text
28/08/2026 → 12540
29/08/2026 → 12547
30/08/2026 → 12555
```

El orden lógico es:

```text
12540 → 12547 → 12555
```

---

# 14. Regla de crecimiento

## LEC-009 — Lectura no decreciente

En condiciones normales, una nueva lectura no podrá ser inferior a la lectura cronológicamente anterior.

Ejemplo válido:

```text
Anterior → 12500
Nueva    → 12508
```

Ejemplo inválido:

```text
Anterior → 12500
Nueva    → 12490
```

---

## LEC-010 — Lectura igual

Una lectura podrá ser igual a la anterior.

Ejemplo:

```text
Anterior → 12500
Actual   → 12500
```

Resultado:

```text
Consumo = 0 kWh
```

Esto representa ausencia de consumo entre ambas mediciones.

---

# 15. Primera lectura

## LEC-011 — Lectura base

La primera lectura registrada será considerada la lectura base.

Ejemplo:

```text
01/09/2026 → 12500
```

No podrá calcularse un consumo para ese día porque no existe una lectura anterior.

El sistema deberá representar esta situación como:

```text
Lectura inicial
```

o:

```text
Consumo no disponible
```

No deberá mostrar:

```text
0 kWh
```

como si realmente se hubiera demostrado que no existió consumo.

---

# 16. Cálculo del consumo

## CON-001 — Fórmula

Cuando existan dos lecturas consecutivas válidas:

```text
consumo = lecturaActual - lecturaAnterior
```

---

## CON-002 — Consumo entero

Como las lecturas no contienen decimales, el consumo calculado tampoco contendrá decimales.

Ejemplo:

```text
12555 - 12547 = 8 kWh
```

---

## CON-003 — Consumo cero

Si ambas lecturas son iguales:

```text
12500 - 12500 = 0 kWh
```

el consumo será válido y equivaldrá a:

```text
0 kWh
```

---

# 17. Lecturas en días consecutivos

Supongamos:

```text
Lunes       1000
Martes      1008
Miércoles   1015
```

Los consumos pueden determinarse correctamente:

```text
Martes     = 1008 - 1000 = 8 kWh
Miércoles  = 1015 - 1008 = 7 kWh
```

Representación:

| Día       | Lectura | Consumo |
| --------- | ------: | ------: |
| Lunes     |    1000 |    Base |
| Martes    |    1008 |   8 kWh |
| Miércoles |    1015 |   7 kWh |

---

# 18. Días sin lectura

Este es uno de los comportamientos más importantes del sistema.

Supongamos:

```text
Lunes       1000
Martes      SIN LECTURA
Miércoles   1015
```

El sistema conoce:

```text
1015 - 1000 = 15 kWh
```

Por lo tanto sabe que:

```text
entre lunes y miércoles se consumieron 15 kWh
```

Pero no conoce cuánto se consumió exactamente cada día.

---

## CON-004 — No inventar distribuciones

El sistema no deberá repartir automáticamente:

```text
15 / 2 = 7.5
```

entre martes y miércoles.

Además, los consumos del proyecto deben permanecer enteros.

---

## CON-005 — No atribuir todo al último día

El sistema tampoco deberá mostrar:

```text
Miércoles → 15 kWh
```

como consumo diario real.

Ese dato corresponde a un intervalo y no exclusivamente al miércoles.

---

## CON-006 — Intervalo sin detalle diario

Cuando existan días sin medición entre dos lecturas, deberá representarse el consumo como:

```text
Consumo del intervalo
```

Ejemplo:

```text
Desde:  lunes
Hasta:  miércoles
Total:  15 kWh
```

El consumo diario individual será:

```text
No determinado
```

---

# 19. Representación en gráficos

## GRA-001 — Últimos siete días

El dashboard mostrará inicialmente los últimos siete días.

La representación principal será mediante gráfico de barras.

---

## GRA-002 — Barras únicamente con datos determinados

Una barra diaria solo deberá representar consumo cuando ese consumo pueda determinarse correctamente.

Ejemplo:

```text
Lunes       lectura
Martes      lectura
Miércoles   lectura
```

permite mostrar barras para martes y miércoles.

---

## GRA-003 — Día sin información suficiente

Si existe una interrupción en las lecturas:

```text
Lunes        lectura
Martes       sin lectura
Miércoles    lectura
```

el gráfico deberá distinguir que existe información incompleta.

No deberá inventar barras para martes o miércoles.

La forma visual exacta se definirá posteriormente.

Podrá utilizarse:

* espacio vacío;
* estado “sin dato”;
* indicador especial;
* tooltip informativo.

---

# 20. Estadísticas semanales

## EST-001 — Consumo últimos siete días

El sistema podrá calcular el consumo de los últimos siete días siempre que exista información suficiente para determinar los intervalos utilizados.

---

## EST-002 — Día de mayor consumo

El sistema identificará el día con mayor consumo diario determinado.

Ejemplo:

```text
Lunes       5 kWh
Martes      8 kWh
Miércoles   12 kWh
Jueves      7 kWh
```

Resultado:

```text
Mayor consumo: Miércoles — 12 kWh
```

Los días sin información suficiente no participarán como si su consumo fuera cero.

---

## EST-003 — Día de menor consumo

Cuando corresponda, podrá determinarse también el menor consumo diario conocido.

Ejemplo:

```text
Lunes 5
Martes 8
Miércoles 12
```

Resultado:

```text
Menor consumo: Lunes — 5 kWh
```

---

# 21. Promedio

## EST-004 — Promedio diario

El promedio diario se calculará únicamente utilizando días cuyo consumo diario sea conocido.

Ejemplo:

```text
5 + 8 + 12 + 7 = 32
32 / 4 = 8
```

Promedio:

```text
8 kWh
```

Si el resultado matemático contiene decimales, el sistema podrá mostrar un valor decimal derivado para estadísticas.

Esto no modifica la regla de que:

**las lecturas introducidas por el usuario no utilizan decimales.**

Ejemplo:

```text
5 + 6 = 11
11 / 2 = 5.5 kWh promedio
```

Este decimal es una estadística calculada, no una medición ingresada.

---

# 22. Estadísticas mensuales

## EST-005 — Consumo mensual

El sistema deberá permitir consultar el consumo correspondiente al mes actual.

El cálculo deberá utilizar las lecturas reales disponibles.

No deberá inventarse consumo para períodos sin información suficiente.

---

## EST-006 — Mes incompleto

El mes actual será normalmente un período incompleto.

Ejemplo:

```text
30/08/2026
```

El dashboard podrá mostrar:

```text
Consumo acumulado en agosto hasta hoy
```

sin asumir consumo para los días restantes del mes.

---

# 23. Estadísticas anuales

## EST-007 — Consumo anual

El sistema permitirá calcular y visualizar el consumo acumulado correspondiente al año actual utilizando los datos disponibles.

---

## EST-008 — Año incompleto

No se estimará automáticamente el consumo de los meses futuros.

Ejemplo:

si la fecha actual corresponde a agosto:

```text
Consumo anual
```

significará:

```text
consumo acumulado desde enero hasta la fecha disponible
```

y no una predicción de enero a diciembre.

---

# 24. Lectura de ayer

## EST-009 — Consumo de ayer

El dashboard mostrará el consumo correspondiente al día anterior cuando pueda calcularse.

Ejemplo:

```text
28/08 → 12540
29/08 → 12547
```

Consumo del 29:

```text
7 kWh
```

Si falta una de las lecturas necesarias, deberá indicar:

```text
Sin información suficiente
```

---

# 25. Corrección de la lectura actual

## COR-001 — Usuario normal

Un usuario normal podrá corregir únicamente la lectura correspondiente al día actual.

---

## COR-002 — Administrador

Un administrador podrá corregir una lectura histórica.

---

# 26. Validación después de una corrección

Corregir una lectura histórica puede afectar dos consumos.

Ejemplo original:

```text
Lunes      1000
Martes     1008
Miércoles  1015
```

Consumos:

```text
Martes      8
Miércoles   7
```

Si el administrador cambia martes:

```text
Martes → 1010
```

los consumos pasan a ser:

```text
Martes     = 1010 - 1000 = 10
Miércoles  = 1015 - 1010 = 5
```

---

## COR-003 — Recalcular derivados

Cuando una lectura sea modificada, todos los consumos y estadísticas derivados deberán reflejar automáticamente el nuevo valor.

No deberán conservarse cálculos obsoletos.

---

## COR-004 — Validación con lectura anterior

Una lectura modificada no podrá quedar por debajo de la lectura cronológicamente anterior.

Ejemplo:

```text
Lunes      1000
Martes      990
Miércoles  1015
```

Resultado:

```text
Corrección inválida
```

---

## COR-005 — Validación con lectura siguiente

Una lectura modificada tampoco podrá quedar por encima de la lectura cronológicamente siguiente.

Ejemplo:

```text
Lunes      1000
Martes     1020
Miércoles  1015
```

Resultado:

```text
Corrección inválida
```

Por lo tanto, una lectura intermedia debe cumplir:

```text
lecturaAnterior <= lecturaActual <= lecturaSiguiente
```

---

# 27. Eliminación de lecturas

Durante el MVP no se permitirá inicialmente que un usuario normal elimine lecturas.

Para mantener el proyecto simple y preservar el historial, las correcciones se realizarán modificando una medición existente según los permisos definidos.

La eliminación administrativa podrá evaluarse posteriormente.

---

# 28. Preferencia visual

Cada usuario podrá seleccionar:

```text
SISTEMA
CLARO
OSCURO
```

---

## TEM-001 — Sistema

Cuando la preferencia sea:

```text
SISTEMA
```

la interfaz seguirá la configuración de apariencia del dispositivo.

---

## TEM-002 — Claro

Cuando la preferencia sea:

```text
CLARO
```

la interfaz deberá mantenerse en modo claro independientemente de la configuración del sistema operativo.

---

## TEM-003 — Oscuro

Cuando la preferencia sea:

```text
OSCURO
```

la interfaz deberá mantenerse en modo oscuro independientemente de la configuración del sistema operativo.

---

## TEM-004 — Preferencia individual

Cada usuario podrá conservar su propia preferencia.

Cambiar la preferencia de un usuario no afectará al otro.

---

# 29. Casos válidos

## Caso válido A — Primera lectura

Entrada:

```text
Fecha:   01/09/2026
Lectura: 12500
```

Resultado:

```text
Lectura registrada.
Consumo: no disponible.
Motivo: lectura inicial.
```

---

## Caso válido B — Segundo día

Estado anterior:

```text
01/09/2026 → 12500
```

Nueva lectura:

```text
02/09/2026 → 12508
```

Resultado:

```text
Consumo: 8 kWh
```

---

## Caso válido C — Sin consumo

```text
01/09 → 12500
02/09 → 12500
```

Resultado:

```text
0 kWh
```

---

## Caso válido D — Corrección del día actual

Lectura registrada:

```text
12508
```

Usuario detecta error y corrige a:

```text
12509
```

Si mantiene coherencia con las demás lecturas:

```text
Corrección permitida.
```

---

# 30. Casos inválidos

## Caso inválido A — Decimal

```text
12500.50
```

Resultado:

```text
Lectura inválida.
```

---

## Caso inválido B — Texto

```text
ABC12500
```

Resultado:

```text
Lectura inválida.
```

---

## Caso inválido C — Valor negativo

```text
-5
```

Resultado:

```text
Lectura inválida.
```

---

## Caso inválido D — Fecha duplicada

Existe:

```text
30/08/2026 → 12555
```

Se intenta crear:

```text
30/08/2026 → 12556
```

Resultado:

```text
Ya existe una lectura para esta fecha.
```

---

## Caso inválido E — Lectura descendente

Anterior:

```text
12555
```

Nueva:

```text
12540
```

Resultado:

```text
La lectura no puede ser inferior a la lectura anterior.
```

---

## Caso inválido F — Fecha futura

Hoy:

```text
30/08/2026
```

Entrada:

```text
05/09/2026
```

Resultado:

```text
No se permiten lecturas futuras.
```

---

## Caso inválido G — Usuario normal modifica histórico

Usuario intenta modificar:

```text
10/08/2026
```

cuando hoy es:

```text
30/08/2026
```

Resultado:

```text
Operación no autorizada.
```

---

# 31. Invariantes del dominio

Las siguientes condiciones deben cumplirse siempre.

### INV-001

Una lectura pertenece a exactamente un medidor.

### INV-002

Una lectura fue registrada por un usuario válido.

### INV-003

No existen dos lecturas oficiales para el mismo día y medidor.

### INV-004

Una lectura nunca contiene decimales.

### INV-005

Una lectura nunca es negativa.

### INV-006

Las lecturas mantienen una secuencia no decreciente.

### INV-007

El consumo nunca se introduce manualmente.

### INV-008

El consumo se deriva de lecturas reales.

### INV-009

El sistema no inventa consumo diario cuando falta información.

### INV-010

Un usuario normal no modifica históricos.

### INV-011

Solo un administrador administra usuarios.

### INV-012

Un usuario inactivo no accede al sistema.

---

# 32. Resumen de permisos

| Operación                   | ADMIN | USUARIO |
| --------------------------- | ----- | ------- |
| Iniciar sesión              | Sí    | Sí      |
| Ver dashboard               | Sí    | Sí      |
| Ver estadísticas            | Sí    | Sí      |
| Registrar lectura           | Sí    | Sí      |
| Ver historial               | Sí    | Sí      |
| Corregir lectura de hoy     | Sí    | Sí      |
| Corregir histórico          | Sí    | No      |
| Crear usuarios              | Sí    | No      |
| Editar usuarios             | Sí    | No      |
| Activar/desactivar usuarios | Sí    | No      |
| Cambiar tema propio         | Sí    | Sí      |

---

# 33. Decisiones importantes congeladas

Para el MVP quedan establecidas las siguientes decisiones:

* un único medidor;
* aproximadamente dos usuarios;
* una lectura oficial por día;
* lecturas sin decimales;
* lectura acumulada como fuente de verdad;
* consumo calculado;
* primera lectura como base;
* no estimar consumos faltantes;
* administrador crea usuarios;
* sin registro público;
* usuario normal corrige solo la lectura actual;
* administrador puede corregir históricos;
* los dos usuarios visualizan la misma información del hogar;
* costos y tarifas quedan para una segunda fase.

---

# 34. Criterio de finalización de SPEC-001

SPEC-001 se considera satisfecha cuando cualquier estudiante pueda responder correctamente:

1. ¿Qué representa una lectura?
2. ¿Qué representa el consumo?
3. ¿Cómo se calcula?
4. ¿Por qué la primera lectura no tiene consumo?
5. ¿Por qué no se puede inventar consumo cuando falta un día?
6. ¿Puede existir más de una lectura por día?
7. ¿Se permiten decimales?
8. ¿Puede una lectura ser inferior a la anterior?
9. ¿Quién puede corregir históricos?
10. ¿Cuál es la fuente de verdad del sistema?

Cuando estas reglas sean comprendidas, el proyecto puede avanzar a la especificación de persistencia.
