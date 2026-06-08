import type { LocaleCode } from './locales'

export const COCONS = [
  {
    id: 'redaction-crbo',
    label: 'Rédaction CRBO',
    color: 'sage',
    icon: '✍️',
    subtitle: "Méthodes, structures et exemples pour écrire des CRBO clairs, sans y passer vos soirées.",
  },
  {
    id: 'logiciels',
    label: 'Logiciels & comparatifs',
    color: 'terracotta',
    icon: '🔧',
    subtitle: "Quel logiciel pour votre cabinet ? Comparatifs honnêtes, vrais retours d'orthophonistes en exercice.",
  },
  {
    id: 'outils-gratuits',
    label: 'Outils gratuits',
    color: 'amber',
    icon: '🎁',
    subtitle: "Calculateurs, modèles Word, mémos cliniques. Tout est téléchargeable, sans email demandé.",
  },
  {
    id: 'ia-innovation',
    label: 'IA & innovation',
    color: 'indigo',
    icon: '🧠',
    subtitle: "Ce que l'IA sait faire en orthophonie, ce qu'elle ne sait pas, et où elle ne remplacera jamais le clinicien.",
  },
  {
    id: 'vie-libe',
    label: 'Vie pro libérale',
    color: 'mint',
    icon: '💼',
    subtitle: "S'installer, gérer son cabinet, optimiser sa fiscalité. Les sujets qu'on n'apprend pas en école, entre consœurs.",
  },
] as const

export type CoconId = typeof COCONS[number]['id']

export function getCocon(id: CoconId) {
  return COCONS.find((c) => c.id === id)
}

const LOCALE_SUBS: Record<'be' | 'ch', Array<[RegExp, string]>> = {
  be: [
    [/d'orthophonistes/g, "de logopèdes"],
    [/orthophonistes/g, "logopèdes"],
    [/orthophoniste/g, "logopède"],
    [/en orthophonie/g, "en logopédie"],
    [/consœurs/g, "consœurs"],
  ],
  ch: [
    [/d'orthophonistes/g, "de logopédistes"],
    [/orthophonistes/g, "logopédistes"],
    [/orthophoniste/g, "logopédiste"],
    [/en orthophonie/g, "en logopédie"],
    [/consœurs/g, "consœurs"],
  ],
}

export function getLocalizedSubtitle(subtitle: string, locale: LocaleCode): string {
  if (locale === 'fr') return subtitle
  const subs = LOCALE_SUBS[locale]
  return subs.reduce((s, [pattern, replacement]) => s.replace(pattern, replacement), subtitle)
}
