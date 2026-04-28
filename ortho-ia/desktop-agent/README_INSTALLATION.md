# Ortho.ia — Agent HappyNeuron pour Windows

Petit programme à installer une seule fois sur votre PC pour que **Ortho.ia
puisse lire automatiquement vos résultats HappyNeuron** sans avoir à imprimer
en PDF ni à faire de copier/coller.

## Comment ça marche

Quand vous cliquez sur l'icône Ortho.ia dans Chrome, l'agent prend une photo
de votre écran HappyNeuron, fait défiler la page pour capturer la suite, et
envoie le tout à Ortho.ia qui pré-remplit votre formulaire de bilan
automatiquement.

L'agent reste en tâche de fond avec une petite icône verte dans la barre des
tâches en bas à droite de Windows.

## Installation (5 minutes)

### 1. Télécharger l'agent

Téléchargez le fichier **`ortho-ia-agent.exe`** depuis votre espace Ortho.ia
(menu **Profil** → **Connexion HappyNeuron**).

> Mettez-le dans un dossier permanent, par exemple `C:\Ortho.ia\` — ne le
> laissez pas dans `Téléchargements`, vous risqueriez de le supprimer par
> erreur lors d'un nettoyage.

### 2. Lancer l'agent

Double-cliquez sur **`ortho-ia-agent.exe`**.

> ⚠️ **Si Windows Defender SmartScreen affiche un avertissement** :
> 1. Cliquez sur **« Informations complémentaires »**
> 2. Puis sur **« Exécuter quand même »**
>
> C'est normal pour un programme tout neuf. Une fois autorisé, Windows ne
> redemandera plus.

Une **icône verte ronde marquée « O »** apparaît dans la barre des tâches en
bas à droite (parfois cachée derrière la flèche `^` — cliquez dessus pour
l'afficher).

### 3. Lancer l'agent au démarrage de Windows (optionnel mais recommandé)

Pour ne pas avoir à le relancer à chaque allumage du PC :

1. Appuyez sur **Windows + R**
2. Tapez `shell:startup` puis **Entrée**
3. Un dossier s'ouvre. Faites **glisser-déposer** un raccourci de
   `ortho-ia-agent.exe` dedans (clic droit sur l'exe → **Envoyer vers** →
   **Bureau (raccourci)**, puis copiez ce raccourci dans le dossier
   Démarrage).

L'agent sera désormais lancé automatiquement à chaque démarrage de Windows.

## Utilisation au quotidien

1. **Lancez HappyNeuron** et affichez les résultats du bilan (ex: Exalang
   8-11 → Onglet « Résultats »).
2. **Vérifiez** que la fenêtre HappyNeuron est au premier plan et que les
   résultats sont bien visibles à l'écran.
3. **Ouvrez Chrome** et cliquez sur l'icône **Ortho.ia** dans la barre des
   extensions, en haut à droite.
4. Cliquez sur **« 📸 Capturer HappyNeuron »** dans le pop-up.
5. Patientez quelques secondes (l'écran défile tout seul, c'est normal).
6. Le formulaire Ortho.ia s'ouvre **avec les résultats déjà remplis** ✨

## Quitter l'agent

Clic droit sur l'icône verte dans la barre des tâches → **« Quitter »**.

## Confidentialité

L'agent **ne transmet aucune donnée à un serveur tiers**. Il prend uniquement
des captures d'écran lorsque l'extension Chrome lui en fait la demande
explicite, et celles-ci sont envoyées à votre compte Ortho.ia (via HTTPS) —
nulle part ailleurs.

L'agent ouvre un port local **uniquement accessible depuis votre PC**
(127.0.0.1:7842). Aucun autre ordinateur du réseau ne peut s'y connecter.

## Problèmes connus

| Symptôme | Solution |
|----------|----------|
| L'icône verte n'apparaît pas | Vérifier qu'aucun antivirus n'a bloqué `ortho-ia-agent.exe` |
| L'extension affiche « Agent non détecté » | Relancer `ortho-ia-agent.exe` ; vérifier qu'aucun autre programme n'utilise le port 7842 |
| Le scroll n'a aucun effet | Cliquer une fois dans la fenêtre HappyNeuron avant de lancer la capture (pour qu'elle soit bien active) |
| Capture incomplète | Vérifier que la fenêtre HappyNeuron est en plein écran avant de capturer |
| Windows Defender bloque le lancement | Voir étape 2 ci-dessus |

En cas de difficulté persistante, contactez-nous via le bouton **Aide** de
votre espace Ortho.ia.
