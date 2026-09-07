// ============================================================
//  auth.js — Login con Google, sesión y logout
//  Depende de supabase.js (debe cargarse antes en el HTML).
// ============================================================

const REDIRECT_URL = "https://journal-trading-puce.vercel.app/";

// --- Iniciar sesión con Google ---
async function loginConGoogle() {
  const { error } = await db.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: REDIRECT_URL }
  });
  if (error) {
    console.error("Error al iniciar sesión:", error.message);
    alert("No se pudo iniciar sesión. Intenta de nuevo.");
  }
  // Si todo va bien, Google redirige y vuelve a REDIRECT_URL ya logueada.
}

// --- Cerrar sesión ---
async function logout() {
  await db.auth.signOut();
  location.reload();
}

// --- Saber quién está logueado (devuelve el usuario o null) ---
async function usuarioActual() {
  const { data } = await db.auth.getUser();
  return data?.user || null;
}

// --- Control de acceso: muestra la app o la pantalla de login ---
//  Espera que en el HTML existan dos contenedores con estos id:
//    #pantalla-login  -> lo que se ve SIN sesión (botón de Google)
//    #app             -> toda la app (lo que se ve CON sesión)
async function protegerApp() {
  const user = await usuarioActual();
  const login = document.getElementById("pantalla-login");
  const app   = document.getElementById("app");

  if (user) {
    if (login) login.style.display = "none";
    if (app)   app.style.display = "block";
    // Pinta el nombre del usuario en el saludo, si existe el elemento
    const nombreEl = document.getElementById("nombre");
    if (nombreEl && user.user_metadata?.full_name) {
      nombreEl.textContent = user.user_metadata.full_name.split(" ")[0];
    }
  } else {
    if (login) login.style.display = "flex";
    if (app)   app.style.display = "none";
  }
}

// --- Reacciona a cambios de sesión (login/logout) automáticamente ---
db.auth.onAuthStateChange(() => { protegerApp(); });

// --- Al cargar la página, decide qué mostrar ---
document.addEventListener("DOMContentLoaded", protegerApp);
