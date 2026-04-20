# Sécurité & Conformité — Ortho.ia

Audit vérifié avant l'ouverture de la beta (20 avril 2026).

## Row-Level Security (RLS) Supabase

Toutes les tables `public.*` ont RLS **actif** avec policies scopées à `auth.uid() = user_id` :

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | ✓ own | ✓ own | ✓ own | — |
| `subscriptions` | ✓ own | ✓ own | ✓ own | — |
| `crbos` | ✓ own | ✓ own | ✓ own | ✓ own |
| `patients` | ✓ own | ✓ own | ✓ own | ✓ own |
| `medecins` | ✓ own | ✓ own | ✓ own | ✓ own |
| `crbo_share_links` | ✓ own | ✓ own | — | — |

Un utilisateur ne peut **en aucun cas** voir ou modifier les données d'un autre utilisateur, même en forgeant des requêtes directes.

Les fonctions `SECURITY DEFINER` (`get_public_stats()`, `get_shared_crbo()`) exposent uniquement des compteurs agrégés ou le contenu d'un CRBO pour un token de partage valide, sans autre donnée.

## Anonymisation RGPD (lib/anonymizer.ts)

Avant l'envoi à l'API Claude (Anthropic, hors UE), les données nominatives sont remplacées par des tokens techniques :

| Donnée | Token envoyé à Claude |
|---|---|
| `patient_prenom` | `__P_PRENOM__` |
| `patient_nom` | `__P_NOM__` |
| `medecin_nom` | `__M_NOM__` |
| `medecin_tel` | `__M_TEL__` |
| `ortho_nom` | `__O_NOM__` |
| `ortho_email` | `__O_EMAIL__` |
| `ortho_tel` | `__O_TEL__` |
| `ortho_adresse` | `__O_ADR__` |

Les occurrences de ces valeurs dans les champs texte libre (anamnèse, motif, résultats, notes) sont également remplacées via regex insensible à la casse.

Après réception de la réponse de Claude, les tokens sont réhydratés avec les valeurs réelles sur nos serveurs avant persistence.

La date de naissance du patient **n'est pas transmise à l'API** — seul l'âge calendaire calculé localement est envoyé.

## Clés secrètes — non exposées côté client

| Clé | Visibilité | Usage |
|---|---|---|
| `ANTHROPIC_API_KEY` | Server only | `app/api/generate-crbo/route.ts`, `app/api/extract-pdf/route.ts` |
| `SUPABASE_SERVICE_ROLE` | Non utilisé en runtime | Scripts de migration/seed uniquement (management API) |
| `NEXT_PUBLIC_SUPABASE_URL` | Client | URL publique, safe |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Clé anon publique, RLS protège les données |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client | Clé publiable Stripe, safe |

Vérifié par grep sur `app/**/*.tsx` : aucune référence à `service_role`, `SUPABASE_SERVICE_ROLE` ou à `ANTHROPIC_API_KEY` hors des routes API server-side.

## Logs — anti-fuite RGPD

Les `console.error` des routes API ne loggent jamais les payloads patient. Format restreint :
```ts
console.error('Erreur generate-crbo:', {
  name: error?.name,
  code: error?.code,
  status: error?.status,
  message: error?.message?.slice(0, 200),
})
```

## Rate limit & quotas

- Chaque route API Claude a un timeout explicite (45s / 60s) via `AbortController`.
- Retry automatique (3 tentatives max, backoff exponentiel) sur les erreurs transitoires 5xx/429.
- Quota CRBO par utilisateur vérifié server-side **avant** appel Claude dans `/api/generate-crbo`.
- Taille de payload max 1 Mo côté client, PDF max 10 Mo côté serveur.

## Middleware Next.js

- `/dashboard/*` : redirige vers `/auth/login?redirect=...` si pas de session Supabase.
- `/api/generate-crbo/*` et `/api/extract-pdf/*` : protégés en auth server-side.
- `/dev/*` : bloqué en production (matcher dans middleware.ts), accessible en dev local pour l'équipe.

## Partage 24h (crbo_share_links)

- Token UUID v4 généré côté serveur via `gen_random_uuid()`.
- Expiration obligatoire 24h, vérifiée dans la RPC `get_shared_crbo()` (pas de leak après expiration).
- RLS empêche un utilisateur d'énumérer les liens d'un autre utilisateur.

## HDS — statut actuel

Hébergement Supabase + Vercel = non-HDS à ce jour. Migration planifiée avant la montée en charge commerciale :

- Base de données : Scaleway Postgres Managed (HDS éligible, région Paris)
- Compute : Vercel → Clever Cloud (HDS) pour les routes sensibles
- Mention explicite dans CGU + politique de confidentialité que la beta opère hors HDS.

## Audit OWASP Top 10

| # | Risque | Statut |
|---|---|---|
| A01 | Broken access control | ✓ RLS + middleware |
| A02 | Cryptographic failures | ✓ TLS imposé, mots de passe hachés (Supabase Auth) |
| A03 | Injection | ✓ Supabase client param. + typage TS, pas de SQL raw côté client |
| A04 | Insecure design | ✓ Anonymisation + quota + retry |
| A05 | Security misconfiguration | ✓ Middleware + CSP Next.js défaut |
| A06 | Vulnerable components | ✓ `npm audit` régulier, Next 14 LTS |
| A07 | Auth failures | ✓ Supabase Auth + session refresh automatique |
| A08 | Data integrity | ✓ FK cascade + checks CHECK sur statut |
| A09 | Logging failures | ✓ Logs sans payload patient |
| A10 | SSRF | ✓ Aucune URL utilisateur en input |
