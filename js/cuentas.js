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
}

// --- Listar las cuentas del usuario ---
async function listarCuentas() {
  const cont = document.getElementById("lista-cuentas");
  if (!cont) return;

  const { data, error } = await db
    .from("cuentas")
    .select("*")
    .order("creada_en", { ascending: true });

  if (error) {
    console.error("Error al listar cuentas:", error.message);
    return;
  }
  if (!data || data.length === 0) {
    cont.innerHTML = '<div class="hint">Aún no has creado ninguna cuenta.</div>';
    return;
  }

  cont.innerHTML = data.map(c => `
    <div class="acctrow">
      <div><strong>${escapar(c.nombre)}</strong>
        <div class="cap">${c.tipo} · ${c.estado}</div></div>
      <select class="ministate" onchange="cambiarEstado('${c.id}', this.value)">
        <option ${c.estado==='activa'?'selected':''}>activa</option>
        <option ${c.estado==='pasada'?'selected':''}>pasada</option>
        <option ${c.estado==='fondeada'?'selected':''}>fondeada</option>
        <option ${c.estado==='quemada'?'selected':''}>quemada</option>
        <option ${c.estado==='con_retiros'?'selected':''}>con_retiros</option>
      </select>
    </div>
  `).join("");
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
