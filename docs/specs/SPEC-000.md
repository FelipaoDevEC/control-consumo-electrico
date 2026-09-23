# SPEC-000 — Visión y alcance del producto

## 1. Nombre provisional

**Control de Consumo Eléctrico**

Aplicación web responsiva para registrar y analizar las lecturas diarias del medidor eléctrico de una vivienda.

---

# 2. Objetivo

Desarrollar una aplicación web minimalista que permita registrar diariamente la lectura acumulada de un medidor eléctrico y, a partir de esas lecturas, calcular y visualizar el consumo energético del hogar.

La aplicación debe permitir comprender rápidamente:

* cuánto se consumió ayer;
* cuánto se ha consumido durante los últimos días;
* qué día tuvo mayor consumo;
* cuánto se ha consumido durante el mes;
* cuánto se ha consumido durante el año;
* cómo evoluciona el consumo a lo largo del tiempo.

El proyecto se desarrollará utilizando **Specification-Driven Development (SDD)** con fines educativos.

Los aprendices deberán comprender primero qué debe hacer el sistema antes de comenzar a implementarlo.

---

# 3. Stack tecnológico

## Base de datos

PostgreSQL.

## Backend

Node.js + Express.

## Acceso a datos

Paquete `pg`.

No se utilizará ORM durante la primera versión.

Las consultas SQL se escribirán explícitamente.

## Frontend

React.

## Arquitectura de comunicación

API REST.

## Entorno inicial

Aplicación ejecutada localmente.

El despliegue público queda fuera del MVP inicial.

---

# 4. Principios del proyecto

El proyecto seguirá los siguientes principios:

1. Simplicidad.
2. Código comprensible para estudiantes.
3. Responsabilidades claramente separadas.
4. Evitar sobreingeniería.
5. Evitar duplicación de datos.
6. Una única fuente de verdad para las mediciones.
7. Reglas de negocio documentadas antes de implementarlas.
8. Cada funcionalidad debe derivarse de una especificación.
9. Cada especificación debe contener criterios de aceptación verificables.
10. No implementar funcionalidades que todavía no formen parte del alcance.

---

# 5. Medidor eléctrico

Durante el MVP existirá únicamente:

**1 medidor eléctrico.**

El medidor será compartido por todos los usuarios del sistema.

No será necesario que cada usuario tenga su propio medidor.

La arquitectura podrá evolucionar en futuras versiones para soportar múltiples medidores, pero esto no debe complicar innecesariamente el MVP.

---

# 6. Lecturas

El usuario registrará la numeración acumulada mostrada físicamente por el medidor.

Ejemplo:

Día 1:

`12540`

Día 2:

`12547`

Día 3:

`12555`

Las lecturas serán números enteros.

No se utilizarán decimales.

Ejemplo válido:

`12547`

Ejemplo inválido:

`12547.50`

---

# 7. Consumo eléctrico

El consumo no será introducido manualmente por el usuario.

Será calculado automáticamente utilizando dos lecturas consecutivas.

Fórmula:

`consumo = lecturaActual - lecturaAnterior`

Ejemplo:

Lectura anterior:

`12547`

Lectura actual:

`12555`

Resultado:

`8 kWh`

Por lo tanto:

`12555 - 12547 = 8 kWh`

---

# 8. Fuente de verdad

La fuente de verdad del sistema serán las lecturas originales del medidor.

No se almacenarán inicialmente como datos independientes:

* consumo diario;
* consumo semanal;
* consumo mensual;
* consumo anual.

Estos valores deberán calcularse utilizando las lecturas disponibles.

Esto evita duplicación y posibles inconsistencias.

---

# 9. Primera lectura

La primera lectura registrada funcionará como:

**lectura base.**

Ejemplo:

`12500`

Como no existe una lectura anterior, todavía no existe información suficiente para calcular consumo.

El sistema deberá indicar:

**Consumo no disponible — lectura inicial.**

El cálculo comenzará cuando exista una segunda lectura.

---

# 10. Frecuencia de registro

Solo podrá existir:

**una lectura oficial por día.**

Ejemplo:

| Fecha      | Lectura |
| ---------- | ------: |
| 28/08/2026 |   12540 |
| 29/08/2026 |   12547 |
| 30/08/2026 |   12555 |

No podrá existir otra lectura para el mismo día.

---

# 11. Fecha y hora

Cada lectura deberá conservar:

* fecha de lectura;
* hora de registro.

La fecha determina a qué día pertenece la medición.

La hora permite conocer cuándo se realizó realmente el registro.

Ejemplo:

`30/08/2026 19:42`

Aunque se almacene la hora, continuará permitiéndose únicamente una lectura oficial por día.

---

# 12. Regla de incremento

En condiciones normales:

`lecturaActual >= lecturaAnterior`

Ejemplo válido:

`12555 → 12563`

Ejemplo inválido:

`12555 → 12520`

El sistema deberá impedir una lectura inferior a la lectura anterior.

Los casos relacionados con:

* reemplazo del medidor;
* reinicio del medidor;
* cambio físico del equipo;

quedan fuera del MVP y deberán tratarse posteriormente mediante una especificación independiente.

---

# 13. Días sin lectura

El sistema no inventará información.

Ejemplo:

| Día       |     Lectura |
| --------- | ----------: |
| Lunes     |       12500 |
| Martes    | Sin lectura |
| Miércoles |       12516 |

El sistema sabe que existió una diferencia de:

`16 kWh`

entre lunes y miércoles.

Pero no puede determinar cuánto se consumió exactamente el martes y cuánto el miércoles.

Por lo tanto:

**el sistema no dividirá ni estimará automáticamente esos 16 kWh.**

La interfaz deberá indicar que existe un intervalo sin suficiente información diaria.

---

# 14. Usuarios

Durante el uso inicial existirán aproximadamente:

**2 usuarios.**

Todos utilizarán el mismo medidor.

No existirá registro público.

Las cuentas serán creadas por un administrador.

---

# 15. Roles

Existirán inicialmente dos roles:

## ADMIN

Puede:

* iniciar sesión;
* cerrar sesión;
* consultar el dashboard;
* registrar lecturas;
* consultar historial;
* corregir la lectura del día;
* corregir lecturas históricas;
* administrar usuarios;
* crear usuarios;
* activar usuarios;
* desactivar usuarios;
* modificar información básica de usuarios;
* cambiar sus preferencias visuales.

## USUARIO

Puede:

* iniciar sesión;
* cerrar sesión;
* consultar el dashboard;
* registrar la lectura diaria;
* consultar el historial;
* corregir la lectura correspondiente al día actual;
* cambiar sus preferencias visuales.

No puede:

* crear usuarios;
* administrar usuarios;
* modificar lecturas históricas.

---

# 16. Información compartida

Como existe un único medidor para la vivienda:

ADMIN y USUARIO verán las mismas estadísticas de consumo.

Los datos representan:

**consumo del hogar**

y no consumo individual de cada usuario.

---

# 17. Dashboard principal

El dashboard será la pantalla principal después del inicio de sesión.

Debe permitir comprender rápidamente el estado del consumo eléctrico.

Deberá mostrar inicialmente:

## Indicadores principales

### Consumo de ayer

Ejemplo:

`8 kWh`

### Consumo últimos 7 días

Ejemplo:

`51 kWh`

### Consumo del mes actual

Ejemplo:

`218 kWh`

### Consumo del año actual

Ejemplo:

`2470 kWh`

---

# 18. Indicadores adicionales

El dashboard mostrará:

* última lectura registrada;
* fecha de última lectura;
* consumo de ayer;
* promedio diario reciente;
* día de mayor consumo;
* consumo del mes;
* consumo anual.

---

# 19. Gráfico principal

La vista inicial utilizará un:

**gráfico de barras de los últimos 7 días.**

Cada barra representará el consumo correspondiente a un día.

Ejemplo conceptual:

```text
14 kWh             █
12 kWh             █
10 kWh       █     █
 8 kWh   █   █     █   █
 6 kWh   █   █ █   █   █
 4 kWh █ █   █ █   █ █ █
 2 kWh █ █ █ █ █ █ █ █ █
       L M X J V S D
```

Este gráfico permitirá identificar rápidamente:

* qué día se consumió más;
* qué día se consumió menos;
* diferencias entre días;
* patrones recientes.

---

# 20. Rangos de análisis

El usuario podrá analizar información por diferentes períodos.

Inicialmente:

* últimos 7 días;
* mes;
* año.

Posteriormente podrán agregarse otros rangos.

---

# 21. Diseño visual

La aplicación tendrá una interfaz:

* minimalista;
* limpia;
* responsiva;
* fácil de utilizar;
* orientada a lectura rápida de información.

Debe funcionar correctamente en:

* computadora;
* tablet;
* teléfono móvil.

---

# 22. Tema visual

La aplicación soportará tres preferencias:

`Sistema`

`Claro`

`Oscuro`

## Sistema

La aplicación seguirá automáticamente la configuración del dispositivo.

Ejemplo:

si Windows está en modo oscuro, la aplicación utilizará modo oscuro.

## Claro

Fuerza modo claro.

## Oscuro

Fuerza modo oscuro.

La preferencia seleccionada por cada usuario deberá persistirse.

---

# 23. Navegación inicial

El sistema contará inicialmente con las siguientes áreas:

## Usuario

* Dashboard
* Registrar lectura
* Historial
* Perfil

## Administrador

Además:

* Usuarios
* Administración

---

# 24. Registro de lectura

El proceso debe ser deliberadamente simple.

Ejemplo de interfaz:

**Lectura del medidor**

`[ 12555 ]`

Fecha:

`30/08/2026`

Botón:

**Registrar lectura**

El usuario no deberá introducir manualmente el consumo.

---

# 25. Historial

La aplicación deberá permitir consultar las lecturas anteriores.

Ejemplo:

| Fecha      | Lectura | Consumo |
| ---------- | ------: | ------: |
| 30/08/2026 |   12555 |   8 kWh |
| 29/08/2026 |   12547 |   7 kWh |
| 28/08/2026 |   12540 |   6 kWh |

El historial deberá permitir comprender la relación entre:

lectura acumulada

y

consumo calculado.

---

# 26. Administración de usuarios

El administrador será responsable de crear las cuentas.

No existirá inicialmente:

* registro público;
* creación automática de cuentas;
* login mediante Google;
* login mediante Facebook;
* invitaciones por correo.

---

# 27. Autenticación

Los usuarios deberán iniciar sesión mediante:

* correo electrónico;
* contraseña.

Las contraseñas nunca deberán almacenarse en texto plano.

---

# 28. Fuera del alcance del MVP

Las siguientes funcionalidades NO se implementarán durante la primera fase:

* múltiples viviendas;
* múltiples medidores;
* tarifa eléctrica;
* precio por kWh;
* cálculo de factura;
* importación de facturas;
* predicciones mediante IA;
* alertas inteligentes;
* notificaciones;
* exportación PDF;
* exportación Excel;
* aplicación móvil nativa;
* registro público;
* integración con medidores inteligentes;
* lectura automática del medidor;
* integración con empresas eléctricas;
* despliegue productivo en Internet.

Estas funcionalidades podrán evaluarse posteriormente.

---

# 29. Fase 2 prevista

Después de completar y validar el MVP podrá desarrollarse una segunda fase.

Posibles funcionalidades:

* tarifa eléctrica;
* costo estimado diario;
* costo mensual;
* comparación entre factura y consumo;
* configuración de precio por kWh;
* metas de consumo;
* alertas;
* comparaciones entre meses;
* exportaciones;
* múltiples medidores.

Estas funcionalidades requerirán nuevas especificaciones antes de ser implementadas.

---

# 30. Arquitectura conceptual

La arquitectura inicial será:

```text
React
   ↓
API REST
   ↓
Express
   ↓
Controladores
   ↓
Servicios
   ↓
Repositorios
   ↓
pg
   ↓
PostgreSQL
```

Las responsabilidades deberán mantenerse separadas.

---

# 31. Estrategia SDD

Cada módulo deberá seguir este proceso:

```text
Necesidad
   ↓
Especificación
   ↓
Reglas
   ↓
Criterios de aceptación
   ↓
Casos de prueba
   ↓
Diseño
   ↓
Implementación
   ↓
Verificación
```

No deberá comenzar una implementación importante sin contar primero con una especificación suficientemente clara.

---

# 32. Orden inicial de especificaciones

El proyecto continuará mediante las siguientes especificaciones:

**SPEC-001 — Modelo de dominio y reglas de negocio**

**SPEC-002 — Modelo de datos PostgreSQL**

**SPEC-003 — Usuarios, autenticación y roles**

**SPEC-004 — Registro de lecturas**

**SPEC-005 — Cálculo de consumo**

**SPEC-006 — Historial de lecturas**

**SPEC-007 — Dashboard y estadísticas**

**SPEC-008 — Tema claro, oscuro y sistema**

**SPEC-009 — Administración de usuarios**

**SPEC-010 — Diseño responsivo**

**SPEC-011 — Seguridad y validaciones**

**SPEC-012 — Pruebas integrales**

---

# 33. Criterio de éxito del MVP

El MVP se considerará funcional cuando:

1. El administrador pueda iniciar sesión.
2. El administrador pueda crear un usuario.
3. El usuario pueda iniciar sesión.
4. Se pueda registrar una lectura diaria.
5. No se puedan registrar dos lecturas para la misma fecha.
6. Las lecturas solo acepten números enteros.
7. El sistema calcule correctamente el consumo.
8. La primera lectura funcione como lectura base.
9. El sistema no invente consumos cuando falten mediciones.
10. El usuario pueda consultar su historial.
11. El dashboard muestre consumo reciente.
12. Exista una gráfica de los últimos 7 días.
13. Puedan consultarse estadísticas mensuales.
14. Puedan consultarse estadísticas anuales.
15. El administrador pueda corregir lecturas históricas.
16. El usuario normal no pueda corregir lecturas históricas.
17. La aplicación funcione en escritorio y móvil.
18. El usuario pueda seleccionar tema Sistema, Claro u Oscuro.
19. Las reglas críticas tengan pruebas automatizadas.
20. La implementación corresponda con las especificaciones aprobadas.
