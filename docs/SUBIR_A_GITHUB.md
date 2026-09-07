# Cómo subir esta carpeta a GitHub

Dos caminos. Elige el que te resulte más cómodo.

## Opción A — Desde la web (sin comandos, la más fácil)

1. Entra a [github.com](https://github.com) y crea una cuenta si no tienes.
2. Arriba a la derecha: botón **+** → **New repository**.
3. Ponle un nombre, por ejemplo `bitacora-trading`. Déjalo en **Private** si no quieres que sea público todavía.
4. **No** marques "Add a README" (ya tienes uno).
5. Crea el repositorio. En la página que aparece, busca el enlace **"uploading an existing file"**.
6. Arrastra todo el contenido de esta carpeta (el `index.html`, el `README.md`, la carpeta `docs`, etc.).
7. Abajo, botón **Commit changes**. Listo.

## Opción B — Desde la terminal (si prefieres comandos)

Necesitas tener **git** instalado. Dentro de esta carpeta:

```bash
git init
git add .
git commit -m "Primera versión: prototipo + esquema de base de datos"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/bitacora-trading.git
git push -u origin main
```

Reemplaza `TU_USUARIO` por tu usuario de GitHub. Te pedirá autenticarte la primera vez.

## Importante sobre seguridad

- El archivo `.gitignore` ya está configurado para **no subir claves ni variables de entorno** (`.env`). Cuando tu esposo conecte Supabase, las claves van en un archivo `.env` que NO debe subirse nunca a GitHub. Ya está protegido.
- Si el repositorio lo pones **público**, cualquiera puede ver el código (no tus datos, solo el código). Para empezar, **Private** es lo más seguro.
