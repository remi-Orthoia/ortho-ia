// Popup logic — détection agent local, capture, upload vers ortho-ia.
// Tout est local au popup (pas de service worker persistent en MV3).

const AGENT_URL = "http://localhost:7842";
const ORTHO_URL_PROD = "https://ortho-ia.vercel.app";
const ORTHO_URL_DEV = "http://localhost:3000";

const STORAGE_KEYS = {
  TOKEN: "ortho_ia_access_token",
  ENV: "ortho_ia_env", // "prod" ou "dev"
};

// ---------- Utils ----------
function $(id) { return document.getElementById(id); }
function setAgentStatus(state, msg) {
  const el = $("agent-status");
  el.className = "agent-status " + state;
  $("agent-status-text").textContent = msg;
}
function showFeedback(state, msg) {
  const el = $("feedback");
  el.className = "feedback " + state;
  el.textContent = msg;
}
async function getStored(key) {
  const obj = await chrome.storage.local.get(key);
  return obj[key];
}
async function setStored(key, value) {
  await chrome.storage.local.set({ [key]: value });
}
async function getOrthoBaseUrl() {
  const env = await getStored(STORAGE_KEYS.ENV);
  return env === "dev" ? ORTHO_URL_DEV : ORTHO_URL_PROD;
}

// ---------- Health check ----------
async function checkAgent() {
  setAgentStatus("", "Vérification de l'agent…");
  try {
    const res = await fetch(`${AGENT_URL}/health`, { method: "GET" });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    setAgentStatus("ok", `Agent v${data.version || "?"} actif`);
    $("capture-btn").disabled = false;
    return true;
  } catch {
    setAgentStatus(
      "ko",
      "Agent non détecté. Lancez ortho-ia-agent.exe sur votre PC.",
    );
    $("capture-btn").disabled = true;
    return false;
  }
}

// ---------- Capture flow ----------
async function captureAndUpload() {
  const btn = $("capture-btn");
  btn.disabled = true;
  showFeedback("", "");
  btn.innerHTML = '<span class="spinner"></span> Capture en cours…';

  let token = await getStored(STORAGE_KEYS.TOKEN);
  if (!token) {
    showFeedback(
      "error",
      "Clé d'accès manquante. Renseignez-la dans ⚙️ Configuration.",
    );
    btn.disabled = false;
    btn.textContent = "📸 Capturer HappyNeuron";
    return;
  }

  let captureData;
  try {
    const res = await fetch(`${AGENT_URL}/capture`, { method: "GET" });
    if (!res.ok) throw new Error(`agent /capture status ${res.status}`);
    captureData = await res.json();
  } catch (err) {
    console.error("[ortho.ia] capture error:", err);
    showFeedback(
      "error",
      "Impossible de capturer l'écran. Vérifiez que l'agent est lancé et que HappyNeuron est au premier plan.",
    );
    btn.disabled = false;
    btn.textContent = "📸 Capturer HappyNeuron";
    return;
  }

  btn.innerHTML = '<span class="spinner"></span> Analyse Claude Vision…';

  const orthoUrl = await getOrthoBaseUrl();
  let extractData;
  try {
    const res = await fetch(`${orthoUrl}/api/extract-screenshot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        image: captureData.image,
        pages: captureData.pages,
        width: captureData.width,
        height: captureData.height,
      }),
    });
    extractData = await res.json();
    if (!res.ok) {
      throw new Error(extractData?.error || `status ${res.status}`);
    }
  } catch (err) {
    console.error("[ortho.ia] extract error:", err);
    const isAuth = String(err.message || "").toLowerCase().includes("auth");
    showFeedback(
      "error",
      isAuth
        ? "Clé d'accès invalide ou expirée. Reconnectez-vous sur Ortho.ia et copiez la nouvelle clé."
        : `Erreur d'analyse : ${err.message}`,
    );
    btn.disabled = false;
    btn.textContent = "📸 Capturer HappyNeuron";
    return;
  }

  const sessionId = extractData.session_id;
  if (!sessionId) {
    showFeedback("error", "Réponse inattendue du serveur (pas de session_id).");
    btn.disabled = false;
    btn.textContent = "📸 Capturer HappyNeuron";
    return;
  }

  showFeedback("success", "✅ Résultats importés ! Ouverture du formulaire…");
  // Ouvrir le formulaire ortho-ia avec le prefill
  const targetUrl = `${orthoUrl}/dashboard/nouveau-crbo?prefill=${encodeURIComponent(sessionId)}`;
  await chrome.tabs.create({ url: targetUrl });
  setTimeout(() => window.close(), 600);
}

// ---------- Token management ----------
async function refreshTokenLink() {
  const orthoUrl = await getOrthoBaseUrl();
  $("token-link").href = `${orthoUrl}/dashboard/profil#extension`;
}
async function loadStoredToken() {
  const token = await getStored(STORAGE_KEYS.TOKEN);
  if (token) {
    // n'affiche pas la valeur — placeholder pour signaler qu'elle est définie
    $("token-input").placeholder = "•••••••• (déjà enregistré)";
  }
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", async () => {
  await refreshTokenLink();
  await loadStoredToken();
  await checkAgent();

  $("capture-btn").addEventListener("click", () => {
    captureAndUpload().catch((err) => {
      console.error(err);
      showFeedback("error", `Erreur inattendue : ${err.message}`);
      $("capture-btn").disabled = false;
      $("capture-btn").textContent = "📸 Capturer HappyNeuron";
    });
  });

  $("save-token").addEventListener("click", async () => {
    const val = $("token-input").value.trim();
    if (!val) {
      showFeedback("error", "Collez votre clé d'accès avant d'enregistrer.");
      return;
    }
    await setStored(STORAGE_KEYS.TOKEN, val);
    $("token-input").value = "";
    $("token-input").placeholder = "•••••••• (enregistré)";
    showFeedback("success", "Clé enregistrée.");
  });
});
