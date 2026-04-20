# CLAUDE.md - Ortho.ia

## Projet
SaaS B2B pour orthophonistes francophones. Génère automatiquement des Comptes Rendus de Bilan Orthophonique (CRBO) via Claude API.

**URL prod** : https://ortho-ia.vercel.app  
**Business model** : 14,90€/mois (mensuel) ou 119€/an (annuel, ~9,92€/mois)

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

### Percentiles Exalang (NE JAMAIS RECALCULER)
```
Q1 = P25 (Normal, pas déficitaire !)
Med = P50
Q3 = P75
P5/P10/P90/P95 = valeur exacte
```

### Seuils cliniques
```
P ≥ 25      → Normal
P16-P24     → Limite basse
P7-P15      → Fragile
P2-P6       → Déficitaire
P < 2       → Pathologique
```

### Erreur classique à éviter
PDF: "Boucle phonologique: É-T -1.53, Percentiles: Q1"
- ✅ Q1 = P25 → Normal
- ❌ Calculer P6 depuis É-T → Déficitaire (FAUX)

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
