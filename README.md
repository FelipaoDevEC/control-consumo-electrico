# ⚡ Control de Consumo Eléctrico

Aplicación web **educativa** para registrar las lecturas diarias del medidor eléctrico de una vivienda y entender cuánto se consume por día, semana, mes y año.

El proyecto se construye con **Specification-Driven Development (SDD)**: primero se escribe *qué* debe hacer el sistema (las specs) y después se implementa paso a paso (los checkpoints). Cada paso tiene su commit, sus pruebas y su explicación, para que cualquier aprendiz pueda seguir la evolución del código desde cero.

---

## 🧰 Stack

| Capa | Tecnología |
|---|---|
| Base de datos | PostgreSQL (acceso con `pg`, SQL explícito, sin ORM) |
| Backend | Node.js + Express 5 (API REST) |
| Frontend | React + Vite |
| Pruebas | Vitest + Supertest |
| Seguridad base | Helmet, CORS, express-rate-limit, Zod |

---

## 📍 Estado actual

| Checkpoint | Tema | Estado |
|---|---|---|
| CP0 | Inicialización del proyecto | ✅ Cerrado |
| CP1 | PostgreSQL, conexión, migraciones y seeds | ✅ Cerrado |
| CP2 | Backend base, seguridad, validación y pruebas | ✅ Cerrado |
| CP3 | Autenticación, sesiones y roles | ⏳ Siguiente |
| CP4 – CP12 | Usuarios, lecturas, estadísticas, frontend, pruebas E2E | 🔜 Pendiente |

---

## 📘 ¿Por dónde empiezo?

👉 **[Manual paso a paso](docs/manual/README.md)**: explica cada checkpoint como una historia, con las pruebas para comprobar que todo funciona.

Otros documentos:

| Documento | Para qué sirve |
|---|---|
| [`docs/specs/`](docs/specs/) | Las especificaciones SPEC-000 a SPEC-012: **qué** debe hacer el sistema |
| [`docs/checkpoints/`](docs/checkpoints/) | **Guías completas** paso a paso de cada checkpoint |
| [`docs/check-original/`](docs/check-original/) | Los checkpoints originales (solo como archivo histórico) |
| [`docs/DECISIONES.md`](docs/DECISIONES.md) | Decisiones técnicas tomadas durante la implementación |

---

## 💻 Requisitos

Probado en **Windows** con **VS Code** y terminal **PowerShell**.

| Herramienta | Versión |
|---|---|
| Node.js | 20.6 o superior (probado con 26) |
| PostgreSQL + pgAdmin | 18 (otras versiones recientes deberían funcionar) |
| Git | Cualquier versión reciente |
| VS Code + extensión Thunder Client | Recomendado para probar la API |

---

## 🚀 Instalación desde cero

### 1. Clonar e instalar dependencias

```powershell
git clone <URL-DEL-REPOSITORIO>
cd control-consumo-electrico

cd backend
npm install

cd ..\frontend
npm install
cd ..
```

### 2. Preparar PostgreSQL (en pgAdmin)

1. Crear un **Login/Group Role** llamado `consumo_app`, con contraseña, **Can login: YES** y **sin** superusuario.
2. Crear dos bases de datos con **Owner = `consumo_app`**:
   - `consumo_electrico` → desarrollo
   - `consumo_electrico_test` → pruebas automáticas

> La aplicación **nunca** usa el usuario `postgres`. Entra con `consumo_app`, que tiene permisos limitados.

### 3. Crear los archivos de configuración

Dentro de `backend`:

```powershell
cd backend
Copy-Item .env.example .env
Copy-Item .env.test.example .env.test
```

Abre `.env` y `.env.test` y escribe tu contraseña en `DB_PASSWORD`.

> ⚠️ `.env` y `.env.test` contienen secretos y **nunca** se suben a Git (ya están en `.gitignore`).

### 4. Crear las tablas y los datos iniciales

```powershell
npm run db:migrate
npm run db:seed
npm run db:migrate:test
npm run db:seed:test
```

Comprobar:

```powershell
npm run db:status
npm run db:status:test
```

Ambas deben mostrar `001` y `002` como **APLICADA**.

### 5. Ejecutar las pruebas automáticas

```powershell
npm test
```

Deben pasar todas en verde.

### 6. Arrancar el backend

```powershell
npm run dev
```

Abre en Thunder Client o en el navegador: `http://localhost:3000/api/health` → `{"status":"ok"}`.

---

## 🧾 Comandos del backend

Todos se ejecutan dentro de `backend/`.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Arranca la API y se reinicia al guardar cambios |
| `npm start` | Arranca la API sin reinicio automático |
| `npm test` | Ejecuta todas las pruebas automáticas una vez |
| `npm run test:watch` | Repite las pruebas cada vez que guardas (salir con `q`) |
| `npm run db:check` | Comprueba la conexión a la base de desarrollo |
| `npm run db:migrate` | Aplica las migraciones pendientes |
| `npm run db:seed` | Inserta los datos iniciales (se puede repetir sin duplicar) |
| `npm run db:status` | Muestra qué migraciones están aplicadas |
| `npm run db:*:test` | Lo mismo, sobre la base de pruebas |

---

## 🗂️ Estructura del repositorio

```text
control-consumo-electrico/
├── backend/          API REST (Express + PostgreSQL)
│   ├── database/     migraciones SQL y seeds
│   ├── scripts/      scripts de base de datos
│   ├── src/          código de la aplicación
│   └── tests/        pruebas automáticas
├── frontend/         aplicación React (Vite)
├── docs/
│   ├── specs/        especificaciones SPEC-000 a SPEC-012
│   ├── check/        checkpoints de implementación
│   ├── manual/       manual paso a paso
│   └── DECISIONES.md registro de decisiones técnicas
└── README.md
```

---

## 🕰️ Ver el proyecto en cada etapa

Cada checkpoint cerrado tiene una **etiqueta** en Git. Para ver el código exactamente como estaba:

```powershell
git checkout cp1      # viajar al final del CHECKPOINT 1
git switch main       # volver al presente
```

Más detalles en el [manual](docs/manual/README.md#-viajar-en-el-tiempo-con-git).

---

## 🎓 Metodología

```text
Necesidad → Especificación → Reglas → Criterios de aceptación
→ Casos de prueba → Diseño → Implementación → Verificación
```

Ninguna funcionalidad importante se implementa sin una especificación que la respalde.
