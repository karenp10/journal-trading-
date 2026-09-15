// ============================================================
//  cuentas.js — Guardar, listar y actualizar cuentas de trading
//  Depende de supabase.js (variable "db") y auth.js.
// ============================================================

// --- Crear una cuenta nueva ---
async function crearCuenta() {
  const nombre = document.getElementById("cta-nombre").value.trim();
  const tipo   = document.getElementById("cta-tipo").value;
  if (!nombre) { alert("Escribe un nombre para la cuenta."); return; }

  const user = await usuarioActual();
  if (!user) { alert("Debes iniciar sesión."); return; }

  const { error } = await db.from("cuentas").insert({
    user_id: user.id,
    nombre: nombre,
    tipo: tipo,
    estado: "activa"
  });

  if (error) {
    console.error("Error al crear cuenta:", error.message);
    alert("No se pudo guardar la cuenta: " + error.message);
    return;
  }
  document.getElementById("cta-nombre").value = "";
  listarCuentas(); // refresca la lista
  if (typeof cargarCuentasEnOps === "function") cargarCuentasEnOps();
}

// --- Listar las cuentas del usuario ---
async function listarCuentas() {
  const { data, error } = await db
    .from("cuentas")
    .select("*")
    .order("creada_en", { ascending: true });

  if (error) { console.error("Error al listar cuentas:", error.message); return; }

  // Pinta en el inicio y en estadísticas (los que existan)
  pintarCuentas(document.getElementById("lista-cuentas"), data, true);
  pintarCuentas(document.getElementById("lista-cuentas-stats"), data, false);
}

// cont: contenedor · data: cuentas · conSelect: si muestra el selector de estado
function pintarCuentas(cont, data, conSelect) {
  if (!cont) return;
  if (!data || data.length === 0) {
    cont.innerHTML = '<div class="hint">Aún no has creado ninguna cuenta.</div>';
    return;
  }

  const activas  = data.filter(c => ['activa','fondeada','con_retiros'].includes(c.estado));
  const cerradas = data.filter(c => ['pasada','quemada'].includes(c.estado));

  const nAct = data.filter(c=>c.estado==='activa').length;
  const nFon = data.filter(c=>c.estado==='fondeada'||c.estado==='con_retiros').length;
  const nQue = data.filter(c=>c.estado==='quemada').length;

  let html = `
    <div style="display:flex;gap:10px;margin-bottom:14px">
      <div class="card mini" style="margin:0"><div class="big up">${nFon}</div><div class="cap">fondeadas</div></div>
      <div class="card mini" style="margin:0"><div class="big gold">${nAct}</div><div class="cap">activas</div></div>
      <div class="card mini" style="margin:0"><div class="big down">${nQue}</div><div class="cap">quemadas</div></div>
    </div>`;

  html += filaGrupo("Activas", activas, conSelect, false);
  if (cerradas.length) html += filaGrupo("Cerradas", cerradas, conSelect, true);

  cont.innerHTML = html;
}

function filaGrupo(titulo, cuentas, conSelect, atenuar) {
  if (!cuentas.length) return titulo==="Activas"
    ? '<div class="hint">No tienes cuentas activas.</div>' : "";
  let h = `<div class="cap" style="margin:12px 0 6px">${titulo}</div>`;
  h += cuentas.map(c => `
    <div class="acctrow" ${atenuar?'style="opacity:.55"':''}>
      <div><strong>${escapar(c.nombre)}</strong>
        <div class="cap">${c.tipo} · ${c.estado}</div></div>
      ${conSelect ? `<select class="ministate" onchange="cambiarEstado('${c.id}', this.value)">
        <option ${c.estado==='activa'?'selected':''}>activa</option>
        <option ${c.estado==='pasada'?'selected':''}>pasada</option>
        <option ${c.estado==='fondeada'?'selected':''}>fondeada</option>
        <option ${c.estado==='quemada'?'selected':''}>quemada</option>
        <option ${c.estado==='con_retiros'?'selected':''}>con_retiros</option>
      </select>` : ''}
    </div>`).join("");
  return h;
}

// --- Cambiar el estado de una cuenta ---
async function cambiarEstado(id, nuevoEstado) {
  const { error } = await db
    .from("cuentas")
    .update({ estado: nuevoEstado })
    .eq("id", id);
  if (error) {
    console.error("Error al cambiar estado:", error.message);
    alert("No se pudo actualizar: " + error.message);
  } else {
    listarCuentas();
  }
}

// --- Evita que un nombre con < o > rompa el HTML ---
function escapar(t) {
  return String(t).replace(/[<>&]/g, s => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[s]));
}

// --- Al cargar la app (con sesión), muestra las cuentas ---
document.addEventListener("DOMContentLoaded", () => {
  // pequeño retraso para asegurar que la sesión ya se comprobó
  setTimeout(listarCuentas, 500);
});
