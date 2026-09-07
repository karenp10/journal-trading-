# Bitácora de Trading

Bitácora personal para trading de NQ Futures, centrada en **disciplina y proceso**, no en dinero. Los números de dinero (P&L, drawdown, balance) viven en la plataforma del bróker; esta bitácora registra lo que la plataforma no ve: rutina previa, análisis, decisiones, gestión emocional y patrones de comportamiento.

## Qué hay en este repositorio

- **`index.html`** — Prototipo visual de la app (un solo archivo, sin dependencias). Ábrelo en cualquier navegador para ver y probar el diseño. Los datos que muestra son de ejemplo y **no se guardan todavía** — es la referencia de cómo debe verse y funcionar la app final.
- **`docs/schema_bitacora.sql`** — Esquema de la base de datos para Supabase (5 tablas + seguridad por usuario + storage para capturas). Es el plano para que la app guarde datos de verdad.

## Cómo probar el prototipo

Abre `index.html` en el navegador (doble clic). No necesita instalar nada.

Flujo de la app:
1. **Inicio** — nombre, frase motivadora, racha de disciplina, foco de ayer.
2. **Registrar hoy** — cuatro pasos: rutina previa + análisis → ¿operé hoy? → operación (cuenta, setup, razón técnica, gestión, resultado) → retroalimentación.
3. **Mis preguntas** — dudas abiertas y sus conclusiones.
4. **Estadísticas** — disciplina por semana, mes y cuentas (con retiros).

## Estado del proyecto

- [x] Diseño y flujo definidos (prototipo)
- [x] Esquema de base de datos (Supabase)
- [ ] Conexión del frontend con Supabase
- [ ] Despliegue en Vercel
- [ ] Versión plantilla (para otros traders)

## Stack previsto

- **Frontend:** el prototipo (`index.html`) como base
- **Base de datos + auth + storage:** Supabase
- **Despliegue:** Vercel

## Notas

- El prototipo usa datos de ejemplo. La app real calcula las estadísticas desde los registros del usuario.
- La seguridad por usuario (RLS) ya está definida en el SQL: cada trader ve solo sus propios datos.
- Las capturas de gráficos van en Supabase Storage; en la base de datos se guarda solo el enlace.
