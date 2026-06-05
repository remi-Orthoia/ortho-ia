# CLAUDE.md - Ortho.ia

## ⚠️ RÈGLE ABSOLUE — ISOLATION DES BILANS

Toute modification spécifique à UN bilan (MoCA, BETL, EVALEO 6-15, B-CMado…) ne doit toucher QUE :

- `components/forms/<Nom>ScoresInput.tsx` OU `components/bilans/<nom>/...` (le formulaire de saisie)
- `lib/prompts/tests/<nom>.ts` (le module prompt spécifique)
- `lib/bilan-registry.ts` (l'entrée dans le registry, pour métadonnées)

**Ne JAMAIS modifier les fichiers partagés** pour résoudre un cas particulier d'un bilan unique :

- ❌ `lib/prompts/system-base.ts` (prompt système universel — règles transverses uniquement)
- ❌ `lib/prompts/tool-schema.ts` (contrat JSON Claude — modifs cassent tous les bilans en DB)
- ❌ `lib/word-export.ts` (export Word générique — utiliser `wordRenderer: 'moca' | 'math'` du registry pour customiser, ou créer `lib/word/renderers/<nom>.ts`)
- ❌ `lib/prompts/extraction.ts` (extraction PDF générique)
- ❌ `lib/prompts/index.ts` ou `lib/types.ts` (types globaux)

Si une feature *transverse* s'impose, elle doit être pilotée par un champ du registry (cf. `BilanEntry.scoreSchema`, `wordRenderer`, `generateRoute`) — jamais par un `if (testName === 'X')` au cœur d'un module partagé.

L'`audit 2026-05-22` (commentaires en tête de `lib/bilan-registry.ts`) liste les 3 hot spots restants à migrer hors des modules partagés. Quand tu travailles dessus, **ouvre une migration dédiée** (1 PR, 1 hot spot), ne profite pas d'un bilan-fix pour glisser un refactor non lié.

## Projet
SaaS B2B pour orthophonistes francophones. Génère automatiquement des Comptes Rendus de Bilan Orthophonique (CRBO) via Claude API.

**URL prod** : https://ortho-ia.vercel.app  
**Business model** : 19,90€/mois (sans engagement) ou 14,90€/mois en annuel (178,80€/an, -25%)

## Stack
- Next.js 14 (App Router) + Tailwind CSS
- Supabase (Auth + PostgreSQL)
- Anthropic Claude API (Sonnet 4)
- Vercel hosting
- docx + file-saver (export Word)

## Commandes
```bash
npm run dev      # localhost:3000
npm run build    # Build production
vercel --prod    # Deploy
```

## Structure clé
```
app/
├── api/
│   ├── generate-crbo/route.ts   # Génération CRBO via Claude
│   └── extract-pdf/route.ts     # Import PDF via Claude Vision
├── dashboard/
│   ├── page.tsx                 # Kanban (4 colonnes)
│   ├── nouveau-crbo/page.tsx    # Formulaire 5 étapes + export Word
│   ├── patients/page.tsx        # Carnet patients CRUD
│   └── profil/page.tsx          # Profil orthophoniste
lib/
├── prompts.ts                   # Prompt système + règles percentiles
├── supabase.ts                  # Client browser
└── types.ts                     # Types TypeScript
```

## Base de données (Supabase)
```sql
profiles    -- Extension auth.users (infos ortho)
crbos       -- CRBO générés + statut kanban
patients    -- Carnet patients
medecins    -- Carnet médecins prescripteurs
```

## Variables d'environnement
```
ANTHROPIC_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## ⚠️ Règles métier CRITIQUES

### Conversion notation Exalang (NE JAMAIS RECALCULER)
```
Q1 = P25
Med = P50
Q3 = P75
P5/P10/P90/P95 = valeur exacte
```
La bande affichée par Exalang correspond à la borne supérieure : "Q1" = [P10, P25[ ; "Med" = [P25, P50[ ; etc. (manuel Exalang 5-8 p. 12).

### Seuils cliniques (grille 6 zones imposée Laurie — refonte 2026-05-ter)
```
P76-P100             → Excellent          (vert foncé)
P50-P75 (Q3 incl.)   → Moyenne haute      (vert clair)
P26-P49              → Moyenne basse      (jaune)
P11-P25 (Q1 incl.)   → Zone de fragilité  (orange clair)
P6-P10               → Difficulté         (orange foncé)
P1-P5                → Difficulté sévère  (rouge)
```

⚠️ **Exalang n'affiche JAMAIS de bande <P5** — la valeur minimale est P5 et est incluse dans "Difficulté sévère". Bornes inclusives de part et d'autre (P50 ∈ Moyenne haute, P75 ∈ Moyenne haute, P76 ∈ Excellent).

### Erreur classique à éviter
PDF : "Boucle phonologique : É-T -1.53, Percentiles : Q1"
- ✅ Q1 = P25 → Zone de fragilité
- ❌ Calculer depuis É-T → Difficulté sévère (FAUX — ne jamais recalculer)
- ❌ "Moyenne basse" pour P25 (P25 est en Zone de fragilité, P26+ en Moyenne basse)

## Fonctionnalités implémentées
- [x] Auth (login/register/forgot)
- [x] Profil orthophoniste
- [x] Carnet patients CRUD
- [x] Formulaire CRBO 5 étapes
- [x] Import PDF résultats (Claude Vision)
- [x] Génération CRBO (Claude API)
- [x] Export Word professionnel avec graphique percentiles
- [x] Dashboard Kanban 4 colonnes

## TODO prioritaires
- [ ] Anonymisation avant envoi Claude (RGPD)
- [ ] CGU avec mention IA
- [ ] Stripe paiement
- [ ] Templates par test (Exalang 8-11, 11-15, EVALO...)
- [ ] Internationalisation administrative (Belgique INAMI / catégorie B2,
  Luxembourg, Suisse). Source : CRBO Bruwier (CRBO5/6 docs). Aujourd'hui
  ortho.ia est franco-français (AMO, NGAP, décret 2002-721). Ajouter un
  champ `pays` au profil ortho + un dispatch dans le prompt pour utiliser
  le bon formulaire administratif (N° INAMI au lieu d'Adeli, "catégorie
  B2" au lieu de "AMO 12,1", phrase "Nous sollicitons l'accord de la
  mutuelle pour…" au lieu de la forme française).
- [ ] Mode multi-batterie composite (math). Source : CRBO Elsa
  (b_cm.docx, Ex CR juillet 2018). Aujourd'hui ortho.ia traite 1 bilan
  par CRBO. Les experts agrègent fréquemment B-LM2 + TEDI-MATH + ZAREKI-R
  + Examath + épreuves cliniques dans un seul CRBO math. Chantier :
  bilan-registry "composite math" + UI multi-onglets + agrégation des
  scores par domaine cognitif (raisonnement, sens du nombre, numération,
  opérations, problèmes) plutôt que par batterie.

## Contexte métier
- **Orthophoniste** = speech therapist (profession paramédicale)
- **CRBO** = document médico-légal obligatoire après bilan
- **É-T** = Écart-Type (déviation statistique vs norme)
- **Exalang** = batterie de tests la plus utilisée en France

## Architecture scale
- Actuel: Direct API (50 users simultanés max, Tier 1)
- Scale: Redis queue (Upstash) si >50 simultanés
- Enterprise: AWS Bedrock Claude (région EU)
