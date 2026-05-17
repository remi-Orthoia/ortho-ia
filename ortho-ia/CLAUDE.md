# CLAUDE.md - Ortho.ia

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

### Seuils cliniques (grille 5 zones — alignée sur les seuils officiels Exalang)
Source : Manuel Exalang 11-15 (Lenfant/Thibault/Helloin 2009, p. 65-67) — section « Seuils de pathologie ».
```
P ≥ 75             → Moyenne haute       (> Q3, bonne réussite)
P26-P74            → Moyenne             (NS 3-4 centrale, normal)
P10-P25 (Q1 incl.) → Zone de fragilité   (« zone à surveiller » manuel)
P5-P9              → Difficulté          (seuil pathologique consensuel P10)
P < 5              → Difficulté sévère   (seuil strict -1,65 σ)
```

Citation : « Pour les résultats affichés en percentiles, nous retiendrons le seuil de pathologie couramment admis et utilisé par les cliniciens du percentile 10. Une attention particulière pourra cependant être portée aux résultats se situant en dessous du percentile 25, considérée comme une zone à surveiller. »

### Erreur classique à éviter
PDF : "Boucle phonologique : É-T -1.53, Percentiles : Q1"
- ✅ Q1 = P25 → Zone de fragilité (zone à surveiller Exalang)
- ❌ Calculer depuis É-T → Difficulté sévère (FAUX — ne jamais recalculer)
- ❌ "Moyenne basse" (label supprimé depuis l'alignement Exalang)

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

## Contexte métier
- **Orthophoniste** = speech therapist (profession paramédicale)
- **CRBO** = document médico-légal obligatoire après bilan
- **É-T** = Écart-Type (déviation statistique vs norme)
- **Exalang** = batterie de tests la plus utilisée en France

## Architecture scale
- Actuel: Direct API (50 users simultanés max, Tier 1)
- Scale: Redis queue (Upstash) si >50 simultanés
- Enterprise: AWS Bedrock Claude (région EU)
