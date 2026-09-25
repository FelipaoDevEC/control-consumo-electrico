# 📘 Manual paso a paso

Bienvenido. Este manual cuenta **cómo se construyó** el proyecto, checkpoint por checkpoint, como si lo estuvieras haciendo tú.

No necesitas saberlo todo antes de empezar. Cada paso explica **una sola idea nueva**, la practica y la comprueba con una prueba. Si algo falla, no pasa nada: los errores también enseñan. 🙂

---

## 🗺️ Mapa del manual

| Checkpoint | Tema | En una frase |
|---|---|---|
| [CP0](CP0-inicializacion.md) | Inicialización | Crear las carpetas, Git, un backend mínimo y el frontend |
| [CP1](CP1-postgresql.md) | PostgreSQL | Crear la base de datos, sus tablas y los datos iniciales |
| [CP2](CP2-backend-base.md) | Backend base | Convertir el backend mínimo en un "restaurante" seguro, ordenado y probado |

Léelos **en orden**: cada uno se apoya en el anterior.

---

## 🍽️ La metáfora del restaurante

Para que el backend no dé miedo, lo explicamos como si fuera un restaurante. Este glosario te acompañará en todo el manual:

| En el restaurante | En el código |
|---|---|
| 🧑 El cliente | El navegador, React o Thunder Client |
| 📝 La comanda (el pedido) | La petición HTTP (`req`) |
| 🍽️ La bandeja (lo que vuelve) | La respuesta HTTP (`res`) |
| 🏪 El restaurante | Express (`app.js`) |
| 🚪 Abrir la puerta a la calle | `server.js` (escuchar en un puerto) |
| 💂 Los guardias de la entrada | Los middlewares |
| "Pase, siga" | `next()` |
| 🧑‍💼 El mesero | El controller |
| 👨‍🍳 El chef (sabe las reglas) | El service |
| 📦 El bodeguero | El repository (el único que escribe SQL) |
| 🏪 La bodega | PostgreSQL |
| 🛒 Los carritos de la bodega | Las conexiones del pool |
| 📒 La libreta de configuración | El archivo `.env` |
| 🕵️ El portero que revisa la libreta | `src/config/env.js` |
| 🛎️ El mostrador de reclamos | El manejador de errores |
| 🎫 El número de ticket | El Request ID |
| 📓 La bitácora del portero | El logging |
| 🔍 El inspector de formularios | La validación con Zod |
| 🤖 El robot probador | Vitest + Supertest |

---

## 🕰️ Viajar en el tiempo con Git

Cada checkpoint cerrado tiene una **etiqueta** (tag). Así puedes ver el código **exactamente** como quedó al terminar ese checkpoint.

```powershell
git tag                 # ver las etiquetas: cp0, cp1, cp2
git checkout cp1        # viajar al final del CHECKPOINT 1
git switch main         # volver al presente
```

> Al hacer `checkout` de una etiqueta, Git te dirá que estás en *"detached HEAD"*. Significa **"solo estoy mirando"**. No hagas cambios ahí: vuelve con `git switch main`.
>
> Las etiquetas antiguas no incluyen este manual (se escribió después). **Lee siempre el manual desde `main`**.

### Ver cada paso de un checkpoint

Cada paso del manual corresponde a **un commit**. Para ver la lista de pasos de un checkpoint:

```powershell
git log --oneline cp1..cp2     # todos los commits del CHECKPOINT 2
```

Y para ver **exactamente qué cambió** en un paso:

```powershell
git show <código-del-commit>
```

Por ejemplo, si la lista muestra `a1b2c3d feat: headers de seguridad con Helmet`, entonces `git show a1b2c3d` te enseña las líneas agregadas (en verde) y quitadas (en rojo).

> 💡 En GitHub puedes hacer lo mismo con clics: entra a **Commits** y abre cualquiera.

---

## 🧭 Cómo está escrito cada paso

Todos los pasos siguen la misma forma:

1. **El problema**: por qué necesitamos esto.
2. **La idea**: explicada con la metáfora del restaurante.
3. **Los archivos**: qué se crea o modifica.
4. **Las pruebas**: cómo comprobar que funciona (y a veces, cómo romperlo a propósito 😈).
5. **El commit**: el mensaje exacto para buscarlo en la historia.
6. **El gate**: la lista de chequeo antes de avanzar.

> 🚦 **Regla de oro:** no pases al siguiente paso hasta que el gate esté completo.
