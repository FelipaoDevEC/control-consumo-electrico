# CHECKPOINT 0 — Inicialización y baseline del proyecto

## 1. Objetivo

Crear desde cero la estructura física del proyecto definida en `SPEC-011`.

Al finalizar este checkpoint tendremos:

* repositorio Git;
* estructura raíz;
* backend Node.js;
* frontend React + Vite;
* carpeta de especificaciones;
* `.gitignore`;
* `.env.example`;
* scripts básicos;
* frontend ejecutándose;
* backend ejecutándose;
* primer commit limpio.

Todavía NO implementaremos:

* PostgreSQL;
* tablas;
* login;
* JWT;
* usuarios;
* lecturas;
* dashboard;
* estadísticas.

---

# 2. Estado antes de comenzar

Las especificaciones:

```text
SPEC-000 → DISEÑADA
SPEC-001 → DISEÑADA
SPEC-002 → DISEÑADA
SPEC-003 → DISEÑADA
SPEC-004 → DISEÑADA
SPEC-005 → DISEÑADA
SPEC-006 → DISEÑADA
SPEC-007 → DISEÑADA
SPEC-008 → DISEÑADA
SPEC-009 → DISEÑADA
SPEC-010 → DISEÑADA
SPEC-011 → DISEÑADA
SPEC-012 → DISEÑADA
```

No existe todavía implementación funcional.

---

# 3. Nombre del proyecto

Utilizaremos provisionalmente:

```text
control-consumo-electrico
```

Estructura esperada:

```text
control-consumo-electrico/
├── backend/
├── frontend/
├── docs/
├── .gitignore
├── package.json
└── README.md
```

---

# 4. Crear carpeta principal

Desde la terminal:

```bash
mkdir control-consumo-electrico
cd control-consumo-electrico
```

---

# 5. Inicializar Git

```bash
git init
```

Comprobar:

```bash
git status
```

Esperamos algo equivalente a:

```text
On branch main/master
No commits yet
```

Si Git utiliza `master`, podemos normalizar posteriormente a:

```bash
git branch -M main
```

---

# 6. Crear estructura principal

```bash
mkdir backend
mkdir docs
```

El frontend lo generará Vite.

---

# 7. Crear estructura de documentación

Dentro de `docs`:

```text
docs/
└── specs/
```

Crear:

```bash
mkdir docs/specs
```

Aquí colocaremos formalmente:

```text
SPEC-000
...
SPEC-012
```

---

# 8. Resultado parcial

```text
control-consumo-electrico/
├── backend/
└── docs/
    └── specs/
```

---

# 9. Inicializar backend

Entrar:

```bash
cd backend
```

Inicializar Node:

```bash
npm init -y
```

Esto creará:

```text
backend/package.json
```

---

# 10. Backend con ES Modules

Modificar `backend/package.json` para utilizar:

```json
"type": "module"
```

Conceptualmente:

```json
{
  "name": "control-consumo-electrico-backend",
  "version": "1.0.0",
  "type": "module"
}
```

---

# 11. Crear estructura backend

Dentro de:

```text
backend/
```

crear:

```text
src/
├── config/
├── controllers/
├── db/
├── errors/
├── middlewares/
├── repositories/
├── routes/
├── services/
├── utils/
├── validators/
├── app.js
└── server.js
```

Además:

```text
database/
├── migrations/
└── seeds/

scripts/

tests/
├── unit/
├── integration/
└── helpers/
```

---

# 12. Estructura backend final del checkpoint

```text
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── db/
│   ├── errors/
│   ├── middlewares/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── validators/
│   ├── app.js
│   └── server.js
│
├── database/
│   ├── migrations/
│   └── seeds/
│
├── scripts/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── helpers/
│
└── package.json
```

---

# 13. Instalar Express

Desde:

```text
backend/
```

ejecutar:

```bash
npm install express
```

Por ahora no instalaremos todas las dependencias futuras.

No necesitamos todavía:

```text
pg
bcrypt
jsonwebtoken
helmet
cors
```

Esas dependencias se añadirán cuando llegue el checkpoint correspondiente.

Esto mantiene visible:

> qué dependencia aparece y por qué.

---

# 14. Crear aplicación Express mínima

`backend/src/app.js`

Contenido conceptual:

```javascript
import express from 'express';

const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
    });
});

export default app;
```

---

# 15. Crear servidor

`backend/src/server.js`

```javascript
import app from './app.js';

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`API ejecutándose en http://localhost:${PORT}`);
});
```

---

# 16. ¿Por qué `app.js` y `server.js` separados?

`app.js`:

```text
configura Express
```

`server.js`:

```text
abre el puerto HTTP
```

Posteriormente podremos probar:

```text
app
```

sin levantar un servidor real.

---

# 17. Script backend

En:

```text
backend/package.json
```

agregar:

```json
"scripts": {
  "dev": "node --watch src/server.js",
  "start": "node src/server.js"
}
```

---

# 18. Probar backend

Ejecutar:

```bash
npm run dev
```

Esperado:

```text
API ejecutándose en http://localhost:3000
```

Abrir:

```text
http://localhost:3000/api/health
```

Resultado:

```json
{
  "status": "ok"
}
```

---

# 19. Primer criterio técnico

Si `/api/health` responde:

```text
200 OK
```

la estructura mínima del backend funciona.

---

# 20. Crear `.env.example` del backend

Archivo:

```text
backend/.env.example
```

Contenido inicial:

```text
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=consumo_electrico
DB_USER=
DB_PASSWORD=

JWT_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
REFRESH_TOKEN_DAYS=7

FRONTEND_URL=http://localhost:5173
APP_TIMEZONE=America/Guayaquil

NODE_ENV=development
```

---

# 21. Importante

`.env.example`:

```text
SÍ va a Git
```

`.env`:

```text
NO va a Git
```

---

# 22. No crear secretos todavía

No necesitamos inventar:

```text
JWT_SECRET=123456
DB_PASSWORD=admin
```

para completar este checkpoint.

Solo estamos definiendo las variables esperadas.

---

# 23. Crear frontend

Volver a la raíz:

```bash
cd ..
```

Desde:

```text
control-consumo-electrico/
```

crear React con Vite:

```bash
npm create vite@latest frontend -- --template react
```

Después:

```bash
cd frontend
npm install
```

---

# 24. Ejecutar frontend

```bash
npm run dev http://localhost:5173/
```

Vite mostrará una dirección local, normalmente:

```text
http://localhost:5173
```

Abrirla.

React deberá funcionar.

---

# 25. Limpiar demo de Vite

No queremos conservar como producto:

```text
contador demo
logos Vite
logos React
botón de contador
```

El frontend inicial debería quedar simple.

Por ejemplo:

```text
Control de Consumo Eléctrico

Aplicación inicializada correctamente.
```

---

# 26. `App.jsx` provisional

Conceptualmente:

```jsx
function App() {
    return (
        <main>
            <h1>Control de Consumo Eléctrico</h1>
            <p>Aplicación inicializada correctamente.</p>
        </main>
    );
}

export default App;
```

Todavía no construimos dashboard.

---

# 27. Estructura frontend

Crear dentro de:

```text
frontend/src/
```

las carpetas:

```text
api/
components/
contexts/
hooks/
layouts/
pages/
routes/
styles/
utils/
```

---

# 28. Estructura resultante

```text
frontend/
├── src/
│   ├── api/
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   ├── routes/
│   ├── styles/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
│
├── public/
├── package.json
└── ...
```

---

# 29. No crear componentes vacíos por adelantado

No necesitamos crear todavía:

```text
DashboardPage.jsx
UsuariosPage.jsx
ReadingForm.jsx
AuthContext.jsx
```

solo porque aparecen en SPEC-011.

Las carpetas pueden existir vacías.

Los archivos aparecerán cuando implementemos su funcionalidad.

---

# 30. Principio

Evitar:

```text
50 archivos vacíos
```

que únicamente simulen progreso.

---

# 31. Crear `.env.example` frontend

```text
frontend/.env.example
```

Contenido:

```text
VITE_API_URL=http://localhost:3000/api
```

---

# 32. Recordatorio importante

Cualquier variable:

```text
VITE_*
```

queda disponible para el navegador.

Por tanto nunca:

```text
VITE_DB_PASSWORD
VITE_JWT_SECRET
```

---

# 33. `.gitignore` raíz

Crear:

```text
.gitignore
```

Conceptualmente:

```text
node_modules/

.env
.env.local
.env.*.local

dist/
coverage/

*.log

.DS_Store

.vscode/
.idea/
```

---

# 34. Precisión sobre `.env.example`

Nuestro `.gitignore` no debe bloquear:

```text
.env.example
```

porque sí queremos versionarlo.

---

# 35. `package.json` raíz

Desde la raíz:

```bash
npm init -y
```

Esto permitirá scripts de conveniencia en el futuro.

---

# 36. No instalar Express en raíz

Las dependencias pertenecen a:

```text
backend/package.json
```

y:

```text
frontend/package.json
```

El `package.json` raíz no será una mezcla de todas las dependencias.

---

# 37. Scripts raíz opcionales

Durante este checkpoint podemos mantenerlo muy sencillo.

Posteriormente podremos añadir scripts para ejecutar ambos proyectos.

Por ahora los estudiantes deberán saber:

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

---

# 38. README raíz

Crear:

```text
README.md
```

Contenido inicial:

```text
# Control de Consumo Eléctrico

Aplicación web educativa desarrollada mediante
Specification-Driven Development.

## Stack

- PostgreSQL
- Node.js
- Express
- React
- Vite

## Estado

Fase de implementación iniciada.

CHECKPOINT 0 — Inicialización del proyecto.
```

---

# 39. Documentar estado real

No escribir todavía:

```text
✅ autenticación terminada
✅ dashboard terminado
✅ PostgreSQL terminado
```

porque sería falso.

---

# 40. Estado correcto

```text
Diseño:
SPEC-000 a SPEC-012 definidas.

Implementación:
CHECKPOINT 0 en progreso.
```

---

# 41. Incorporar las SPEC al repositorio

Los documentos que hemos diseñado deben convertirse progresivamente en:

```text
docs/specs/
```

Ejemplo:

```text
SPEC-000-vision-alcance.md
...
SPEC-012-pruebas-aceptacion.md
```

---

# 42. No necesitamos reescribirlas

Su contenido debe corresponder con las decisiones que ya congelamos.

---

# 43. Verificar estructura completa

Esperamos aproximadamente:

```text
control-consumo-electrico/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── errors/
│   │   ├── middlewares/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.js
│   │   └── server.js
│   ├── database/
│   │   ├── migrations/
│   │   └── seeds/
│   ├── scripts/
│   ├── tests/
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── styles/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
│
├── docs/
│   └── specs/
│
├── .gitignore
├── package.json
└── README.md
```

---

# 44. Prueba backend

Debe pasar:

```text
GET /api/health
```

Resultado:

```text
200
```

---

# 45. Prueba frontend

Debe cargar:

```text
Control de Consumo Eléctrico
```

sin errores de consola críticos.

---

# 46. Build frontend

Ejecutar:

```bash
cd frontend
npm run build
```

Debe finalizar correctamente.

Esto comprueba desde el inicio que el proyecto puede compilarse.

---

# 47. Git status

Desde raíz:

```bash
git status
```

Revisar cuidadosamente que NO aparezcan:

```text
.env
node_modules
dist
```

---

# 48. Seguridad temprana

Antes del primer commit comprobar:

```text
no secretos
no contraseñas
no tokens
no node_modules
```

---

# 49. Primer commit

Agregar:

```bash
git add .
```

Revisar:

```bash
git status
```

Después:

```bash
git commit -m "chore: inicializar estructura del proyecto"
```

---

# 50. No hacer commit a ciegas

Siempre:

```text
git add
↓
git status
↓
revisar
↓
git commit
```

---

# 51. Estado Git esperado

Después:

```bash
git status
```

debe indicar:

```text
nothing to commit, working tree clean
```

---

# 52. Estado de las especificaciones

Después del checkpoint:

```text
SPEC-000 → DISEÑADA
...
SPEC-012 → DISEÑADA
```

No cambia todavía a implementada.

---

# 53. Estado de CHECKPOINT 0

Podrá marcarse:

```text
CHECKPOINT 0 → CERRADO
```

si cumple los criterios siguientes.

---

# 54. Criterios de aceptación

### CP0-001

Existe repositorio Git.

### CP0-002

Existe `backend/`.

### CP0-003

Existe `frontend/`.

### CP0-004

Existe `docs/specs/`.

### CP0-005

Backend utiliza Node.js + Express.

### CP0-006

Backend utiliza ES Modules.

### CP0-007

`GET /api/health` responde 200.

### CP0-008

Frontend React se ejecuta.

### CP0-009

Frontend usa Vite.

### CP0-010

Frontend compila correctamente.

### CP0-011

Existe `.gitignore`.

### CP0-012

`.env` está excluido.

### CP0-013

Existen `.env.example`.

### CP0-014

No existen secretos en Git.

### CP0-015

No existen `node_modules` versionados.

### CP0-016

README refleja estado real.

### CP0-017

Existe primer commit.

### CP0-018

Working tree queda limpio.

---

# 55. Lo que NO debe existir todavía

No crear todavía:

```text
tabla usuarios
tabla lecturas
tabla sesiones
JWT
bcrypt
login
dashboard
Recharts
Axios
PostgreSQL connection
```

Eso pertenece a checkpoints posteriores.

---

# 56. Motivo educativo

Queremos poder decir:

```text
CHECKPOINT 0

Aprendimos:
- estructura
- npm
- frontend/backend
- Express
- React
- Git
- variables de entorno
- separación de responsabilidades
```

sin mezclar todavía:

```text
SQL
JWT
bcrypt
roles
```

---

# 57. Estado final esperado

```text
FASE ESPECIFICACIÓN
===================
SPEC-000 a SPEC-012 → DISEÑADAS


FASE IMPLEMENTACIÓN
===================

CHECKPOINT 0
Inicialización
→ CERRADO

CHECKPOINT 1
PostgreSQL y migraciones
→ SIGUIENTE

CHECKPOINT 2
Backend base y seguridad
→ PENDIENTE

CHECKPOINT 3
Autenticación
→ PENDIENTE

CHECKPOINT 4
Administración usuarios
→ PENDIENTE

CHECKPOINT 5
Lecturas
→ PENDIENTE

CHECKPOINT 6
Estadísticas
→ PENDIENTE

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

# 58. Siguiente checkpoint

Una vez ejecutado y verificado CHECKPOINT 0, continuaremos con:

```text
CHECKPOINT 1
PostgreSQL + migraciones
```

Ahí comenzaremos realmente a construir:

```text
consumo_electrico
schema_migrations
usuarios
medidores
lecturas_medidor
sesiones
```

y aprenderemos:

```text
PK
FK
CHECK
UNIQUE
índices
migraciones
seeds
pg
pool
transacciones básicas
```

sin tocar todavía React funcional ni autenticación.
