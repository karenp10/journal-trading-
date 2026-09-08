// ============================================================
//  registro.js — Guardar el registro del día (dias + operaciones)
//  Depende de supabase.js ("db"), auth.js y cuentas.js.
// ============================================================

// --- Helpers para leer los campos del formulario ---

// Devuelve el texto de los chips marcados (.on) dentro de un contenedor
function chipsMarcados(cont) {
  if (!cont) return [];
  return Array.from(cont.querySelectorAll('.chip.on'))
    .map(c => c.textContent.replace('✕','').trim())
    .filter(Boolean);
}
// Devuelve el primer chip marcado (para selección única), o null
function chipUnico(cont) {
  const m = chipsMarcados(cont);
  return m.length ? m[0] : null;
}
function valor(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : null;
}

// --- Fecha de hoy en formato YYYY-MM-DD ---
function hoyISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// --- Cargar las cuentas del usuario dentro de cada operación ---
async function cargarCuentasEnOps() {
  const { data } = await db.from("cuentas").select("id,nombre").order("creada_en");
  if (!data || !data.length) return;
  document.querySelectorAll('.op-cuenta').forEach(cont => {
    // conserva el botón "+ Añadir"
    const add = cont.querySelector('.chip.add');
    cont.innerHTML = "";
    data.forEach(c => {
      const chip = document.createElement('span');
      chip.className = 'chip acct';
      chip.dataset.id = c.id;
      chip.textContent = c.nombre;
      chip.onclick = () => pickOne(chip);
      cont.appendChild(chip);
    });
    if (add) cont.appendChild(add);
  });
}

// --- Guardar el día completo ---
async function guardarDia() {
  const user = await usuarioActual();
  if (!user) { alert("Debes iniciar sesión."); return; }

  // ¿Operó o no? (mira qué chip está activo en el filtro)
  const filtro = document.getElementById("filtro");
  const opero = filtro.querySelector('.chip.up.on') ? true
              : (document.getElementById("noopere").classList.contains("hidden") ? null : false);

  // 1) Construir el registro del día
  const dia = {
    user_id: user.id,
    fecha: hoyISO(),
    rutina: chipsMarcados(document.getElementById("rutina-chips")),
    sesgo_dia: obtenerSelect("f-sesgo"),
    estructura: obtenerSelect("f-estructura"),
    escenario_principal: valor("f-esc-principal"),
    escenario_secundario: valor("f-esc-secundario"),
    emocion_inicio: chipUnico(document.getElementById("f-emocion-inicio")),
    opero: opero
  };

  if (opero === false) {
    dia.motivo_no_opero = chipUnico(document.getElementById("f-motivo-no"));
    dia.nota_no_opero = valor("f-nota-no");
  } else if (opero === true) {
    dia.respeto_limite_perdida = segSiNo("f-limite");
    dia.cumplio_objetivo = segSiNo("f-objetivo");
    dia.sesgo_correcto = valor("f-sesgo-ok");
    dia.entrada_clara = valor("f-entrada-ok");
    dia.que_hice_bien = valor("f-bien");
    dia.que_mejorare = valor("f-mejorar");
    dia.emocion_cierre = chipUnico(document.getElementById("f-emocion-cierre"));
    dia.reencuadre_sl = valor("f-reencuadre");
  }

  // 2) Guardar el día (upsert: si ya existe hoy, lo actualiza)
  const { data: diaGuardado, error: errDia } = await db
    .from("dias")
    .upsert(dia, { onConflict: "user_id,fecha" })
    .select()
    .single();

  if (errDia) {
    console.error("Error al guardar el día:", errDia.message);
    alert("No se pudo guardar el día: " + errDia.message);
    return;
  }

  // 3) Si operó, guardar las operaciones
  if (opero === true) {
    const ops = Array.from(document.querySelectorAll('#ops .op'));
    let orden = 1;
    for (const op of ops) {
      const cuentaChip = op.querySelector('.op-cuenta .chip.on');
      const operacion = {
        user_id: user.id,
        dia_id: diaGuardado.id,
        cuenta_id: cuentaChip ? cuentaChip.dataset.id : null,
        orden: orden++,
        setup: chipsMarcados(op.querySelector('.op-setup')),
        razon_tecnica: op.querySelector('.op-razon')?.value.trim() || null,
        gestion: chipsMarcados(op.querySelector('.op-gestion')),
        resultado: mapResultado(chipUnico(op.querySelector('.op-resultado'))),
        ratio_r: parseFloat(op.querySelector('.op-ratio')?.value) || null,
        regla_rota: chipUnico(op.querySelector('.op-regla'))
      };
      // solo guarda la operación si tiene cuenta seleccionada
      if (operacion.cuenta_id) {
        const { error: errOp } = await db.from("operaciones").insert(operacion);
        if (errOp) console.error("Error al guardar operación:", errOp.message);
      }
    }
  }

  // 4) Frase motivadora de cierre (usa la función del HTML)
  const frase = (typeof fraseDelDia === "function")
    ? fraseDelDia()
    : "Día guardado.";
  alert(frase);
  go("home");
}

// --- Helpers de mapeo ---
function obtenerSelect(id) {
  const el = document.getElementById(id);
  return el && el.tagName === "SELECT" ? el.value : null;
}
function segSiNo(id) {
  const cont = document.getElementById(id);
  const chip = cont ? cont.querySelector('.chip.on') : null;
  if (!chip) return null;
  return chip.textContent.trim() === "Sí";
}
function mapResultado(txt) {
  if (txt === "Ganó") return "gano";
  if (txt === "Perdió") return "perdio";
  if (txt === "BE") return "be";
  return null;
}

// --- Cargar cuentas en las operaciones al abrir la app ---
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(cargarCuentasEnOps, 700);
});
