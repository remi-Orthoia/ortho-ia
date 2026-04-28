"""
Ortho.ia HappyNeuron Agent
==========================

Agent local Windows pour capturer les résultats HappyNeuron sur plusieurs écrans
de scroll et les exposer via HTTP local. Utilisé conjointement avec l'extension
Chrome ortho-ia : l'extension appelle GET http://localhost:7842/capture, l'agent
prend N captures successives en scrollant, recolle les images, retourne le PNG
en base64.

L'agent tourne en tâche de fond avec une icône système (pystray) — l'ortho ne
voit qu'un point vert dans la barre des tâches.

Aucune donnée n'est envoyée à un serveur tiers depuis cet agent : il se contente
de capturer l'écran et de servir l'image localement à l'extension Chrome (qui
elle-même la transmet à ortho-ia.vercel.app pour analyse Claude Vision).

Lancement direct :
    python ortho-ia-agent.py

Build .exe :
    build.bat
"""

from __future__ import annotations

import base64
import io
import logging
import os
import sys
import threading
import time
from typing import List, Optional, Tuple

import pyautogui
from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image, ImageChops, ImageDraw, ImageGrab

# pystray + Image pour l'icône de tray ; importés en lazy car peuvent échouer
# en environnement sans display (tests CI).
try:
    import pystray  # type: ignore
    _HAS_TRAY = True
except Exception:  # pragma: no cover
    _HAS_TRAY = False


VERSION = "1.0.0"
PORT = 7842
SCROLL_AMOUNT = -10        # négatif = vers le bas
SCROLLS_PER_PAGE = 3       # nombre d'évènements pyautogui.scroll() par page
SCROLL_PAUSE = 0.30        # pause entre chaque scroll (laisse le UI rendre)
SETTLE_PAUSE = 0.50        # pause après le dernier scroll avant capture
MAX_PAGES = 4              # captures max (1 capture initiale + 3 scrolls)
MIN_OVERLAP_PX = 20        # seuil minimum pour considérer un overlap valide
MAX_OVERLAP_RATIO = 0.55   # on ne cherche d'overlap qu'au-dessus de 45% de l'image

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s %(message)s")
log = logging.getLogger("ortho-ia-agent")


# ============================================================================
# Capture + assemblage
# ============================================================================

def _grab_screen() -> Image.Image:
    """Capture full screen — passe par PIL.ImageGrab pour ne pas avoir de
    dépendance native supplémentaire. Sur multi-écran, ImageGrab.grab() prend
    par défaut l'écran principal — comportement attendu par les orthos qui
    ouvrent HappyNeuron en plein écran."""
    img = ImageGrab.grab(all_screens=False)
    return img.convert("RGB")


def _scroll_down(amount: int = SCROLL_AMOUNT, n: int = SCROLLS_PER_PAGE) -> None:
    """Scroll vers le bas à la position actuelle du curseur. L'agent attend que
    la fenêtre HappyNeuron soit au premier plan ET que le curseur soit posé
    dessus — c'est la responsabilité du message d'aide côté extension Chrome."""
    for _ in range(n):
        pyautogui.scroll(amount)
        time.sleep(SCROLL_PAUSE)
    time.sleep(SETTLE_PAUSE)


def _row_diff(strip_a: Image.Image, strip_b: Image.Image) -> float:
    """Renvoie une métrique de différence (mean absolute) entre deux strips de
    même dimension. Plus c'est bas, plus les images se ressemblent."""
    diff = ImageChops.difference(strip_a, strip_b)
    # Stat sur le canal de différence : sum / pixels
    bbox = diff.getbbox()
    if bbox is None:
        return 0.0
    histogram = diff.histogram()
    # luminance approximative — on pondère R/G/B équitablement
    total = sum(i * v for i, v in enumerate(histogram[:256]))
    pixels = strip_a.size[0] * strip_a.size[1] or 1
    return total / pixels


def _find_overlap(top: Image.Image, bottom: Image.Image) -> int:
    """Cherche le nombre de pixels de chevauchement entre `top` (capture
    précédente) et `bottom` (capture suivante). On compare le bas de `top`
    avec le haut de `bottom` à différentes hauteurs candidates ; on retient
    celle qui minimise la différence pixel à pixel.

    Retourne 0 si aucun overlap fiable détecté (les images seront alors
    concaténées intégralement)."""
    if top.size != bottom.size:
        return 0
    w, h = top.size
    # On cherche entre 45% et 95% de hauteur — un scroll typique HappyNeuron
    # laisse 5-50% de zone commune.
    max_overlap = int(h * MAX_OVERLAP_RATIO)
    if max_overlap < MIN_OVERLAP_PX:
        return 0
    # Conversion grayscale pour accélérer (1 canal au lieu de 3)
    top_g = top.convert("L")
    bot_g = bottom.convert("L")
    step = max(2, max_overlap // 80)  # ~80 candidats — assez fin sans être lent
    best_h = 0
    best_score = float("inf")
    for cand in range(max_overlap, MIN_OVERLAP_PX, -step):
        a = top_g.crop((0, h - cand, w, h))
        b = bot_g.crop((0, 0, w, cand))
        score = _row_diff(a, b)
        if score < best_score:
            best_score = score
            best_h = cand
        # match quasi-parfait : on s'arrête dès que c'est très bas
        if score < 0.5:
            return cand
    # Seuil global : si même le meilleur match est encore très différent, on
    # considère qu'il n'y a pas eu de scroll détectable (ex: page statique).
    return best_h if best_score < 8.0 else 0


def _stitch(images: List[Image.Image]) -> Tuple[Image.Image, List[int]]:
    """Empile verticalement les captures en supprimant les zones d'overlap
    entre captures consécutives. Retourne l'image finale + la liste des
    overlaps détectés (pour télémétrie / debug)."""
    if not images:
        raise ValueError("aucune capture à assembler")
    if len(images) == 1:
        return images[0], []

    overlaps: List[int] = []
    # Largeur = largeur de la première (les écrans changent rarement de
    # résolution entre les captures successives ; si oui, on coupe à la min)
    min_width = min(img.size[0] for img in images)

    # Calculer la hauteur finale en tenant compte des overlaps
    total_h = images[0].size[1]
    for i in range(1, len(images)):
        prev = images[i - 1]
        cur = images[i]
        ov = _find_overlap(prev, cur)
        overlaps.append(ov)
        total_h += cur.size[1] - ov

    # Compose
    canvas = Image.new("RGB", (min_width, total_h), (255, 255, 255))
    canvas.paste(images[0].crop((0, 0, min_width, images[0].size[1])), (0, 0))
    y = images[0].size[1]
    for i in range(1, len(images)):
        cur = images[i]
        ov = overlaps[i - 1]
        cropped = cur.crop((0, ov, min_width, cur.size[1]))
        canvas.paste(cropped, (0, y))
        y += cur.size[1] - ov

    return canvas, overlaps


def capture_with_scroll(max_pages: int = MAX_PAGES) -> Tuple[Image.Image, dict]:
    """Capture la fenêtre courante avec scroll. Si le scroll n'apporte plus
    rien (overlap ≈ 100%), on s'arrête tôt pour éviter d'empiler N fois la
    même image."""
    saved_pos = pyautogui.position()
    log.info("capture: position curseur sauvegardée = %s", saved_pos)

    captures: List[Image.Image] = []
    captures.append(_grab_screen())
    log.info("capture #1 : %s", captures[-1].size)

    for i in range(1, max_pages):
        _scroll_down()
        new_shot = _grab_screen()
        # Si la nouvelle capture est quasi-identique à la précédente,
        # le scroll n'a rien produit → on s'arrête.
        prev = captures[-1]
        if prev.size == new_shot.size:
            diff = _row_diff(prev.convert("L"), new_shot.convert("L"))
            if diff < 0.5:
                log.info("capture #%d : identique à la précédente, arrêt anticipé", i + 1)
                break
        captures.append(new_shot)
        log.info("capture #%d : %s", i + 1, new_shot.size)

    # Restaurer position curseur — l'utilisateur ne doit pas voir son curseur
    # sauter ailleurs.
    try:
        pyautogui.moveTo(saved_pos.x, saved_pos.y, duration=0)
    except Exception:
        pass

    final, overlaps = _stitch(captures)
    meta = {
        "pages": len(captures),
        "overlaps_px": overlaps,
        "width": final.size[0],
        "height": final.size[1],
    }
    log.info("assemblage : %d pages → %dx%d (overlaps=%s)",
             len(captures), final.size[0], final.size[1], overlaps)
    return final, meta


# ============================================================================
# Serveur Flask
# ============================================================================

app = Flask(__name__)
# CORS strict : uniquement localhost:3000 (dev) et ortho-ia.vercel.app (prod)
# + chrome-extension://* (les extensions ont une origine spéciale).
CORS(
    app,
    resources={r"/*": {"origins": [
        "http://localhost:3000",
        "https://ortho-ia.vercel.app",
        "chrome-extension://*",
    ]}},
)


@app.get("/health")
def health():
    return jsonify({"status": "ok", "version": VERSION})


@app.get("/capture")
def capture():
    try:
        img, meta = capture_with_scroll()
    except Exception as e:
        log.exception("erreur capture")
        return jsonify({"error": "capture_failed", "detail": str(e)[:200]}), 500
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return jsonify({
        "image": b64,
        "mime": "image/png",
        **meta,
    })


def _run_flask():
    # use_reloader=False car on est dans un thread + bundle PyInstaller
    app.run(host="127.0.0.1", port=PORT, debug=False, use_reloader=False)


# ============================================================================
# System tray icon
# ============================================================================

def _make_tray_icon_image() -> Image.Image:
    """Génère l'icône de tray à la volée (16×16 / 64×64). Cercle vert avec un
    "O" blanc centré — pas de fichier binaire à embarquer."""
    size = 64
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # cercle vert ortho.ia
    draw.ellipse((2, 2, size - 2, size - 2), fill=(46, 125, 50, 255))
    # "O" blanc
    draw.ellipse((16, 16, size - 16, size - 16), outline=(255, 255, 255, 255), width=4)
    return img


def _on_capture_click(icon, item):  # pragma: no cover (UI thread)
    threading.Thread(target=_capture_via_tray, daemon=True).start()


def _capture_via_tray():  # pragma: no cover
    try:
        capture_with_scroll()
        log.info("capture déclenchée depuis le tray")
    except Exception:
        log.exception("erreur capture (tray)")


def _on_quit(icon, item):  # pragma: no cover
    log.info("arrêt demandé via tray")
    icon.stop()
    os._exit(0)


def run_tray():  # pragma: no cover
    if not _HAS_TRAY:
        log.warning("pystray indisponible — l'agent tourne sans icône système")
        # bloque le thread principal pour ne pas terminer le process
        _run_flask()
        return
    icon = pystray.Icon(
        "ortho-ia-agent",
        icon=_make_tray_icon_image(),
        title=f"Ortho.ia Agent v{VERSION}",
        menu=pystray.Menu(
            pystray.MenuItem("Capturer maintenant", _on_capture_click),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Quitter", _on_quit),
        ),
    )
    icon.run()


def main():
    log.info("Ortho.ia agent v%s — démarrage", VERSION)
    log.info("Flask sur http://127.0.0.1:%d (endpoints: /health, /capture)", PORT)
    flask_thread = threading.Thread(target=_run_flask, daemon=True)
    flask_thread.start()
    # tray bloquant — ferme proprement le process au "Quitter"
    run_tray()


if __name__ == "__main__":
    main()
