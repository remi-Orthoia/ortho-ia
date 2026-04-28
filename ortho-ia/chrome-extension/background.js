// Service worker minimal (MV3). Toute la logique active vit dans le popup
// (popup.js) car elle n'a besoin de tourner qu'au clic sur l'icône. Le SW
// reste là car MV3 l'exige formellement même quand on n'en a pas besoin.

chrome.runtime.onInstalled.addListener((details) => {
  console.log("[ortho.ia] extension installée :", details.reason);
});

// Garde un keep-alive minimal le temps qu'un fetch popup soit en cours :
// MV3 peut couper le SW à tout moment, mais le popup gère lui-même ses fetch
// donc c'est OK. Ce listener est laissé en placeholder pour les futurs hooks
// (ex: capture déclenchée depuis le menu contextuel).
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "PING") {
    sendResponse({ ok: true, version: chrome.runtime.getManifest().version });
    return true;
  }
  return false;
});
