export const COCONS = [
  { id: 'redaction-crbo',  label: 'Rédaction CRBO',         color: 'sage',       icon: '✍️' },
  { id: 'logiciels',       label: 'Logiciels & comparatifs', color: 'terracotta', icon: '🔧' },
  { id: 'outils-gratuits', label: 'Outils gratuits',         color: 'amber',      icon: '🎁' },
  { id: 'ia-innovation',   label: 'IA & innovation',         color: 'indigo',     icon: '🧠' },
  { id: 'vie-libe',        label: 'Vie pro libérale',        color: 'mint',       icon: '💼' },
] as const

export type CoconId = typeof COCONS[number]['id']

export function getCocon(id: CoconId) {
  return COCONS.find((c) => c.id === id)
}
