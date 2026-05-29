export type Locale = 'fr-FR' | 'fr-BE' | 'fr-CH'
export type LocaleCode = 'fr' | 'be' | 'ch'

export interface LocaleConfig {
  code: LocaleCode
  locale: Locale
  label: string
  /** Terme officiel du métier dans ce pays */
  professionLabel: string
  /** Nomenclature d'actes en vigueur */
  nomenclature: string
  /** Organisme payeur */
  payer: string
  /** Prefix URL (vide pour fr-FR = racine) */
  urlPrefix: string
  /** Attribut hreflang HTML */
  hreflang: string
}

export const LOCALE_CONFIGS: Record<LocaleCode, LocaleConfig> = {
  fr: {
    code: 'fr',
    locale: 'fr-FR',
    label: 'France',
    professionLabel: 'orthophoniste',
    nomenclature: 'NGAP',
    payer: 'Assurance Maladie',
    urlPrefix: '',
    hreflang: 'fr-FR',
  },
  be: {
    code: 'be',
    locale: 'fr-BE',
    label: 'Belgique',
    professionLabel: 'logopède',
    nomenclature: 'INAMI',
    payer: 'INAMI',
    urlPrefix: '/be',
    hreflang: 'fr-BE',
  },
  ch: {
    code: 'ch',
    locale: 'fr-CH',
    label: 'Suisse',
    professionLabel: 'logopédiste',
    nomenclature: 'TARMED',
    payer: 'LAMal',
    urlPrefix: '/ch',
    hreflang: 'fr-CH',
  },
}

export const ALL_LOCALE_CODES: LocaleCode[] = ['fr', 'be', 'ch']
export const NON_DEFAULT_LOCALE_CODES: LocaleCode[] = ['be', 'ch']

export function getLocaleConfig(code: LocaleCode): LocaleConfig {
  return LOCALE_CONFIGS[code]
}

export function localeCodeFromPath(urlPrefix: string): LocaleCode {
  if (urlPrefix === '/be') return 'be'
  if (urlPrefix === '/ch') return 'ch'
  return 'fr'
}

/** Retourne le chemin /blog ou /be/blog selon la locale */
export function getBlogBasePath(code: LocaleCode): string {
  const prefix = LOCALE_CONFIGS[code].urlPrefix
  return `${prefix}/blog`
}

/** Retourne le chemin d'un article selon la locale */
export function getArticlePath(code: LocaleCode, slug: string): string {
  return `${getBlogBasePath(code)}/${slug}`
}

/** Retourne le chemin du hub thème selon la locale */
export function getCoconPath(code: LocaleCode, coconId: string): string {
  return `${getBlogBasePath(code)}/theme/${coconId}`
}
