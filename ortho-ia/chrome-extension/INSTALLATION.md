# 📸 Extension Chrome Ortho.ia — Installation

Cette extension permet d'importer en 1 clic les résultats de vos bilans
HappyNeuron (Exalang, Examath…) directement dans le formulaire CRBO d'Ortho.ia.

L'extension n'est pas encore publiée sur le Chrome Web Store. En attendant, elle
s'installe en **mode développeur** — c'est plus simple qu'il n'y paraît, comptez
2 minutes.

---

## Étape 1 — Décompresser l'archive

1. Téléchargez le fichier `ortho-ia-extension.zip` depuis votre profil Ortho.ia.
2. Faites un **clic droit** sur le fichier → **Extraire tout…** (Windows) ou
   **double-clic** pour le décompresser (macOS).
3. Notez l'emplacement du dossier décompressé : par exemple
   `C:\Users\<vous>\Downloads\ortho-ia-extension\`. **Ne le déplacez plus**
   après installation : Chrome charge l'extension depuis ce dossier à chaque
   démarrage.

---

## Étape 2 — Activer le mode développeur dans Chrome

1. Ouvrez Chrome.
2. Tapez dans la barre d'adresse : `chrome://extensions` puis Entrée.
3. En haut à droite de la page, **activez le bouton "Mode développeur"**
   (interrupteur bleu).

> 💡 Le mode développeur ne fait courir aucun risque à votre navigateur. Il
> sert uniquement à autoriser l'installation manuelle d'une extension.

---

## Étape 3 — Charger l'extension

1. Toujours sur `chrome://extensions`, cliquez sur le bouton
   **"Charger l'extension non empaquetée"** (en haut à gauche).
2. Sélectionnez le dossier `ortho-ia-extension` que vous avez décompressé à
   l'étape 1 (le dossier qui contient `manifest.json`).
3. L'extension apparaît dans la liste — vous devriez voir son nom :
   **"Ortho.ia — Capture HappyNeuron"**.

---

## Étape 4 — Épingler l'icône à la barre d'outils

1. Cliquez sur l'icône **puzzle 🧩** en haut à droite de Chrome.
2. Dans la liste qui s'ouvre, repérez **"Ortho.ia"** et cliquez sur
   l'icône **épingle 📌** à côté.
3. L'icône Ortho.ia apparaît maintenant à droite de la barre d'adresse.

---

## Étape 5 — Connecter l'extension à votre compte

1. Sur Ortho.ia, allez dans **Mon profil → section "Connexion extension Chrome"**.
2. Cliquez sur **"Copier mon token"**.
3. Cliquez sur l'icône **Ortho.ia** dans Chrome pour ouvrir le popup.
4. Collez le token dans le champ **"Clé d'accès"** et cliquez sur
   **"Enregistrer"**.

---

## Étape 6 — Installer l'agent local Windows

Pour pouvoir capturer HappyNeuron (qui n'est pas une page web mais un logiciel
Windows), l'extension a besoin d'un petit programme compagnon qui tourne en
arrière-plan sur votre PC : **`ortho-ia-agent.exe`**.

Téléchargez-le depuis votre profil Ortho.ia et double-cliquez pour l'installer.
Une icône verte 🟢 apparaît dans la barre des tâches Windows — c'est gagné.

> Cet agent tourne uniquement en local sur votre PC. Aucune donnée ne sort de
> votre machine sans votre action explicite (capture déclenchée depuis le popup).

---

## Utilisation au quotidien

1. Dans HappyNeuron, ouvrez les résultats du bilan.
2. **Cliquez n'importe où sur la fenêtre HappyNeuron** pour qu'elle soit au
   premier plan, puis posez le curseur sur la zone à scroller.
3. Cliquez sur l'icône **Ortho.ia** dans Chrome.
4. Cliquez sur **"📸 Capturer HappyNeuron"**.
5. L'extension capture l'écran, scrolle, recapture, recommence, puis envoie
   l'ensemble à Ortho.ia.
6. Le formulaire CRBO s'ouvre automatiquement dans un nouvel onglet, déjà
   prérempli avec les épreuves et leurs scores. **Vérifiez, complétez,
   générez.**

---

## Dépannage

**Le bouton "Capturer" est grisé / "Agent non détecté"**
→ Lancez `ortho-ia-agent.exe` (s'il n'est pas déjà au démarrage de Windows).

**"Clé d'accès invalide ou expirée"**
→ Le token est valide 1 heure. Retournez sur Mon profil, cliquez sur
"Copier mon token", puis re-collez dans l'extension.

**La capture ne contient pas tout le bilan**
→ Vérifiez que la fenêtre HappyNeuron est bien au premier plan ET que le
curseur de la souris est posé sur la zone scrollable avant de cliquer
sur "Capturer".

**L'extension a disparu après un redémarrage**
→ Vous avez probablement déplacé ou renommé le dossier décompressé. Allez
dans `chrome://extensions`, supprimez-la, puis recommencez à l'étape 3.

---

## Confidentialité

- L'agent local **ne transmet rien à un serveur tiers** sans votre action.
- Les captures d'écran sont envoyées uniquement à `ortho-ia.vercel.app`
  (votre compte) pour analyse, jamais ailleurs.
- Les données extraites sont stockées **chiffrées** dans votre espace Ortho.ia
  et expirent automatiquement après 1 heure si vous ne validez pas le formulaire.

---

Une question ? Écrivez à `support@ortho-ia.fr` ou via le bouton 💬 en bas à
droite de votre tableau de bord.
