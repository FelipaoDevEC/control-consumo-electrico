# CHECKPOINT 0 — Inicialización del proyecto 🏗️

> **Etiqueta Git:** `cp0` · **Commit:** `chore: inicializar estructura del proyecto`

## 🎯 Objetivo

Dejar listo el "terreno" del proyecto:

- una carpeta con Git;
- un backend mínimo que responde `/api/health`;
- un frontend React que arranca;
- la protección de secretos desde el primer día.

Todavía **no** hay base de datos, login ni pantallas reales. Solo los cimientos. 🧱

---

## 1. Carpeta y Git

```powershell
mkdir control-consumo-electrico
cd control-consumo-electrico
git init
git branch -M main
```

`git branch -M main` asegura que la rama principal se llame `main`.

Luego las carpetas base:

```powershell
mkdir backend
mkdir docs
mkdir docs\specs
```

El frontend lo creará Vite más adelante.

---

## 2. Backend mínimo

### 2.1 Inicializar Node

```powershell
cd backend
npm init -y
```

En `backend/package.json` agregar:

```json
"type": "module"
```

Esto permite usar `import` y `export` (módulos modernos de JavaScript).

### 2.2 Estructura de carpetas

```text
backend/
├── src/
│   ├── config/         configuración
│   ├── controllers/    meseros
│   ├── db/             conexión a la base
│   ├── errors/         errores
│   ├── middlewares/    guardias
│   ├── repositories/   bodegueros (SQL)
│   ├── routes/         rutas
│   ├── services/       chefs (reglas de negocio)
│   ├── utils/          utilidades
│   ├── validators/     validaciones
│   ├── app.js
│   └── server.js
├── database/
│   ├── migrations/
│   └── seeds/
├── scripts/
└── tests/
```

> 📌 Git **no guarda carpetas vacías**. Por eso algunas no aparecen en el repositorio hasta que tienen un archivo. No es un error.

### 2.3 Instalar Express

```powershell
npm install express
```

Solo Express. **Cada dependencia se instala en el checkpoint que la necesita**, para que se vea claramente qué aparece y por qué.

### 2.4 `src/app.js` — el restaurante

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

### 2.5 `src/server.js` — abrir la puerta

```javascript
import app from './app.js';

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`API ejecutándose en http://localhost:${PORT}`);
});
```

### 🤔 ¿Por qué separar `app.js` y `server.js`?

| Archivo | Trabajo |
|---|---|
| `app.js` | Arma el restaurante: guardias, rutas, cocina |
| `server.js` | Solo abre la puerta a la calle (el puerto) |

Esta separación parece exagerada ahora, pero en el CP2 permitirá que el **robot probador** entre al restaurante por la "puerta de servicio" sin abrir ningún puerto. 🎁

### 2.6 Scripts

En `backend/package.json`:

```json
"scripts": {
  "dev": "node --watch src/server.js",
  "start": "node src/server.js"
}
```

`--watch` reinicia el servidor solo cada vez que guardas un archivo.

### 🧪 Prueba

```powershell
npm run dev
```

En Thunder Client (o el navegador): GET `http://localhost:3000/api/health`

Esperado: **200** y `{"status":"ok"}`.

### 2.7 `backend/.env.example`

En este checkpoint se definieron las variables que el proyecto necesitaría, **sin valores secretos**:

```env
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

> 🔄 Este archivo **evolucionó** después: en el CP1 y el CP2-C se ajustó (por ejemplo, `NODE_ENV` salió de aquí y `JWT_*` volverá en el CP3). La versión actual es la que está en `main`.

| Archivo | ¿Va a Git? |
|---|---|
| `.env.example` | ✅ Sí: es la plantilla, sin secretos |
| `.env` | ❌ Nunca: tiene tus contraseñas |

---

## 3. Frontend con Vite

Desde la raíz del proyecto:

```powershell
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm run dev
```

Abrir `http://localhost:5173`: React debe funcionar.

### 3.1 Limpiar la demo

Se quitan el contador, los logos y los estilos de ejemplo. `src/App.jsx` queda provisional:

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

### 3.2 Carpetas del frontend

Dentro de `frontend/src/`:

```text
api/  components/  contexts/  hooks/  layouts/  pages/  routes/  styles/  utils/
```

> 🚫 **No se crean archivos vacíos por adelantado** (como `DashboardPage.jsx`). 50 archivos vacíos solo simulan progreso. Los archivos aparecen cuando se implementa su función.

### 3.3 `frontend/.env.example`

```env
VITE_API_URL=http://localhost:3000/api
```

> ⚠️ Toda variable que empiece con `VITE_` **la puede ver cualquiera** en el navegador. Jamás pongas ahí contraseñas ni secretos.

---

## 4. Archivos de la raíz

### 4.1 `.gitignore`

```gitignore
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

(En el CP1 se reforzó para proteger también `.env.test`.)

### 4.2 `package.json` raíz

```powershell
npm init -y
```

Solo para scripts de conveniencia en el futuro. **Las dependencias no van aquí**: van en `backend/package.json` y `frontend/package.json`.

### 4.3 `README.md`

Un README inicial que describe el proyecto y su **estado real**. Nunca se marca como terminado algo que todavía no existe.

---

## 5. Verificación final

```text
[ ] /api/health responde 200 con {"status":"ok"}
[ ] El frontend abre en http://localhost:5173
[ ] git status NO muestra ningún archivo .env
```

### Commit

```powershell
git add .
git status
git commit -m "chore: inicializar estructura del proyecto"
```

> 👀 **Nunca hagas commit a ciegas:** revisa siempre `git status` antes, para confirmar que no se cuela ningún secreto.

---

## ✅ Gate CP0

```text
[ ] Git inicializado en la rama main
[ ] Backend con app.js y server.js separados
[ ] /api/health responde 200
[ ] Frontend React funcionando
[ ] .env.example en backend y frontend, sin secretos
[ ] .gitignore protege .env y node_modules
[ ] Primer commit hecho
```

## 🧠 Lo que debes poder explicar

- Por qué `app.js` y `server.js` están separados.
- Por qué `.env.example` va a Git y `.env` no.
- Por qué las variables `VITE_*` nunca llevan secretos.
- Por qué no instalamos todas las dependencias desde el inicio.

➡️ Siguiente: [CHECKPOINT 1 — PostgreSQL](CP1-postgresql.md)
