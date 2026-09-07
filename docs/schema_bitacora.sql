-- ============================================================
--  BITÁCORA DE TRADING — Esquema de base de datos (Supabase / PostgreSQL)
--  Diseñado para: registro por día, con rutina, análisis, operaciones
--  por cuenta, preguntas y retiros. Sin datos de dinero (P&L, drawdown
--  y balance viven en la plataforma del bróker, no aquí).
--
--  Cómo usarlo: Supabase → SQL Editor → pega todo → Run.
--  Requiere que Auth esté activo (usa auth.users para el dueño de cada fila).
-- ============================================================


-- ------------------------------------------------------------
-- 1. CUENTAS  (una fila por cuenta de trading del usuario)
-- ------------------------------------------------------------
create table public.cuentas (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  nombre       text not null,                        -- ej. "Lucid Flex 0258"
  tipo         text not null check (tipo in ('challenge','fondeada')),
  estado       text not null default 'activa'
               check (estado in ('activa','pasada','fondeada','quemada','con_retiros')),
  creada_en    timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 2. DIAS  (un registro por día de sesión)
--    Contiene: rutina previa, análisis pre-sesión, decisión de
--    operar o no, y la retroalimentación del cierre.
-- ------------------------------------------------------------
create table public.dias (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  fecha                 date not null,

  -- Rutina previa (checklist editable → se guarda como lista de lo marcado)
  rutina                text[] default '{}',         -- ej. {'Respiración','Ancla'}

  -- 1. Antes — análisis pre-sesión
  sesgo_dia             text,                         -- 'Compra' | 'Venta' | 'No claro'
  estructura            text,                         -- 'Alcista' | 'Bajista' | 'Rango'
  escenario_principal   text,
  escenario_secundario  text,
  emocion_inicio        text,

  -- 2. ¿Operé hoy?
  opero                 boolean,                      -- true = sí operó
  motivo_no_opero       text,                         -- si opero=false: 'Estado emocional', 'Día feriado', etc.
  nota_no_opero         text,

  -- 3. Después — retroalimentación (si operó)
  respeto_limite_perdida boolean,
  cumplio_objetivo       boolean,
  sesgo_correcto         text,
  entrada_clara          text,
  que_hice_bien          text,
  que_mejorare           text,                        -- "una sola cosa" → alimenta el foco de mañana
  emocion_cierre         text,
  reencuadre_sl          text,

  creado_en             timestamptz not null default now(),
  unique (user_id, fecha)                             -- un registro por día por usuario
);


-- ------------------------------------------------------------
-- 3. OPERACIONES  (0..n por día; cada una ligada a una cuenta)
-- ------------------------------------------------------------
create table public.operaciones (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  dia_id        uuid not null references public.dias(id)    on delete cascade,
  cuenta_id     uuid not null references public.cuentas(id) on delete restrict,

  orden         int  not null default 1,              -- Operación 1, 2, 3... del día
  setup         text[] default '{}',                  -- etiquetas: {'FVG','Liquidez'}
  razon_tecnica text,
  gestion       text[] default '{}',                  -- {'Moví el SL','Perseguí el precio'}
  resultado     text check (resultado in ('gano','perdio','be')),
  ratio_r       numeric,                              -- R: +2, -1, 0  (comportamiento, no dólares)
  be            boolean,
  regla_rota    text,                                 -- 'Ninguna','Entré por FOMO',...
  captura_url   text,                                 -- enlace a Supabase Storage (ver abajo)

  creada_en     timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 4. PREGUNTAS  (dudas abiertas; la conclusión se llena después)
-- ------------------------------------------------------------
create table public.preguntas (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  operacion_id  uuid references public.operaciones(id) on delete set null,  -- opcional
  pregunta      text not null,
  conclusion    text,                                 -- null = pendiente
  creada_en     timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 5. RETIROS  (numerados, por cuenta fondeada)
-- ------------------------------------------------------------
create table public.retiros (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  cuenta_id     uuid not null references public.cuentas(id) on delete cascade,
  numero        int  not null,                        -- Retiro 1, 2, 3...
  fecha         date not null default current_date,
  nota          text,
  creado_en     timestamptz not null default now()
);


-- ------------------------------------------------------------
-- ÍNDICES  (para que los filtros por cuenta y fecha sean rápidos)
-- ------------------------------------------------------------
create index on public.dias        (user_id, fecha);
create index on public.operaciones (user_id, dia_id);
create index on public.operaciones (cuenta_id);
create index on public.preguntas   (user_id);
create index on public.retiros     (cuenta_id);


-- ============================================================
--  SEGURIDAD (RLS) — cada usuario solo ve y edita SUS filas.
--  Imprescindible si la app la usarán varios traders.
-- ============================================================
alter table public.cuentas     enable row level security;
alter table public.dias        enable row level security;
alter table public.operaciones enable row level security;
alter table public.preguntas   enable row level security;
alter table public.retiros     enable row level security;

-- Una política "todo" (select/insert/update/delete) por tabla:
create policy "dueño" on public.cuentas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dueño" on public.dias
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dueño" on public.operaciones
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dueño" on public.preguntas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dueño" on public.retiros
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ============================================================
--  CAPTURAS DE GRÁFICOS (Supabase Storage)
--  Las imágenes NO van en las tablas: van en un bucket, y en
--  operaciones.captura_url se guarda solo el enlace.
--
--  Pasos (en el panel de Supabase, no en SQL):
--   1. Storage → New bucket → nombre "capturas" → privado.
--   2. Subir cada imagen a una carpeta con el user_id, ej:
--        capturas/{user_id}/{operacion_id}.png
--   3. Guardar esa ruta (o la URL firmada) en operaciones.captura_url.
--
--  Política de Storage para que cada quien vea solo sus imágenes
--  (ejecutable como SQL sobre storage.objects):
-- ------------------------------------------------------------
create policy "capturas propias"
  on storage.objects for all
  using ( bucket_id = 'capturas' and auth.uid()::text = (storage.foldername(name))[1] )
  with check ( bucket_id = 'capturas' and auth.uid()::text = (storage.foldername(name))[1] );


-- ============================================================
--  NOTA SOBRE ESTADÍSTICAS
--  El panel (racha de disciplina, % días con plan, regla más rota,
--  días con rutina completa, evolución semanal/mensual) NO necesita
--  tablas nuevas: se calcula con consultas sobre 'dias' y 'operaciones'.
--  Ejemplo — % de días que siguió el plan este mes:
--
--    select round(100.0 * count(*) filter (
--             where opero = false
--                or exists (select 1 from operaciones o
--                           where o.dia_id = d.id and o.regla_rota = 'Ninguna')
--           ) / nullif(count(*),0), 0) as pct_disciplina
--    from dias d
--    where user_id = auth.uid()
--      and fecha >= date_trunc('month', current_date);
-- ============================================================
