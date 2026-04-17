# 🦷 Ortho.ia - MVP

Application de génération de Comptes Rendus de Bilan Orthophonique (CRBO) par IA.

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+ installé ([télécharger ici](https://nodejs.org))
- Un compte Supabase ([créer ici](https://supabase.com))
- Une clé API Anthropic ([obtenir ici](https://console.anthropic.com))

### Installation

```bash
# 1. Extraire le projet et aller dans le dossier
cd ortho-ia

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
# Le fichier .env.local est déjà créé, mais vous devez ajouter votre clé Anthropic
```

### Configuration de la base de données

1. Allez dans votre projet Supabase
2. Ouvrez **SQL Editor**
3. Copiez-collez le contenu du fichier `supabase-schema.sql`
4. Exécutez le script

### Configuration de l'API Claude

1. Allez sur [console.anthropic.com](https://console.anthropic.com)
2. Créez une clé API
3. Ouvrez le fichier `.env.local`
4. Remplacez `sk-ant-api03-VOTRE_CLE_ICI` par votre vraie clé

### Lancer en local

```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📦 Déploiement sur Vercel

### Méthode 1 : Via l'interface Vercel (recommandé)

1. Créez un compte sur [vercel.com](https://vercel.com)
2. Cliquez sur "New Project"
3. Uploadez le dossier du projet
4. Configurez les variables d'environnement :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY`
5. Déployez !

### Méthode 2 : Via CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel
```

## 🔧 Structure du projet

```
ortho-ia/
├── app/                      # Pages et routes
│   ├── page.tsx              # Landing page
│   ├── auth/                 # Authentification
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/            # Espace client
│   │   ├── page.tsx          # Dashboard principal
│   │   ├── nouveau-crbo/     # Formulaire génération
│   │   └── historique/       # Liste des CRBO
│   └── api/
│       └── generate-crbo/    # API Claude
├── components/               # Composants réutilisables
├── lib/                      # Utilitaires
│   ├── supabase.ts           # Client Supabase
│   ├── types.ts              # Types TypeScript
│   └── prompts.ts            # Prompt système Claude
├── supabase-schema.sql       # Schéma base de données
└── .env.local                # Variables d'environnement
```

## 💳 Stripe (à venir)

Le code est préparé pour intégrer Stripe. Pour activer les paiements :

1. Créez un compte [Stripe](https://stripe.com)
2. Récupérez vos clés API
3. Ajoutez-les dans `.env.local` :
   ```
   STRIPE_SECRET_KEY=sk_test_xxx
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
   ```
4. Configurez les webhooks dans Stripe Dashboard

## 🔒 Sécurité & RGPD

- Les données sont stockées sur Supabase (conforme RGPD)
- Pour la production avec données patients réelles, migrez vers un hébergeur HDS (OVH Healthcare, Scaleway, etc.)
- Row Level Security (RLS) activé sur toutes les tables

## 📝 Personnalisation

### Modifier le prompt IA

Le prompt système se trouve dans `lib/prompts.ts`. Vous pouvez l'ajuster pour :
- Ajouter de nouveaux tests
- Modifier le style de rédaction
- Ajouter des sections au CRBO

### Modifier le design

Les styles utilisent Tailwind CSS. Les couleurs principales sont définies dans `tailwind.config.ts`.

## 🐛 Dépannage

### "Clé API Claude non configurée"
→ Vérifiez que `ANTHROPIC_API_KEY` est bien définie dans `.env.local`

### Erreur de connexion Supabase
→ Vérifiez que vous avez bien exécuté le script SQL pour créer les tables

### Page blanche après connexion
→ Videz le cache du navigateur et reconnectez-vous

## 📞 Support

Pour toute question, contactez l'équipe Ortho.ia.

---

Fait avec ❤️ pour les orthophonistes
