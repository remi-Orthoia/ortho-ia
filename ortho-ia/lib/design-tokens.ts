/**
 * Design tokens — exports TypeScript du design system Stéphanie.
 *
 * Les valeurs sont les CSS custom properties (var(--xxx)) — Webpack/Tailwind
 * les résoudront au runtime. Pour avoir la valeur littérale (ex. dans un
 * canvas, une lib graphique non-CSS, etc.), utilise getComputedStyle.
 *
 * 3 directions visuelles disponibles via [data-direction="A"|"B"|"C"] sur
 * <html>. La direction par défaut est A (Cabinet lumineux).
 */

export type Direction = 'A' | 'B' | 'C'

export const DEFAULT_DIRECTION: Direction = 'A'

/** Couleurs — toutes en CSS var pour suivre le data-direction actif. */
export const colors = {
  // Surfaces
  bgCanvas:    'var(--bg-canvas)',
  bgSurface:   'var(--bg-surface)',
  bgSurface2:  'var(--bg-surface-2)',
  bgInverse:   'var(--bg-inverse)',

  // Foreground
  fg1:         'var(--fg-1)',
  fg2:         'var(--fg-2)',
  fg3:         'var(--fg-3)',
  fgOnBrand:   'var(--fg-on-brand)',
  fgLink:      'var(--fg-link)',

  // Bordures
  border:        'var(--border-ds)',
  borderStrong:  'var(--border-ds-strong)',

  // Brand
  primary:       'var(--ds-primary)',
  primaryHover:  'var(--ds-primary-hover)',
  primarySoft:   'var(--ds-primary-soft)',
  accent:        'var(--ds-accent)',
  accentHover:   'var(--ds-accent-hover)',
  accentSoft:    'var(--ds-accent-soft)',

  // Status
  success:       'var(--ds-success)',
  successSoft:   'var(--ds-success-soft)',
  warning:       'var(--ds-warning)',
  warningSoft:   'var(--ds-warning-soft)',
  danger:        'var(--ds-danger)',
  dangerSoft:    'var(--ds-danger-soft)',
  info:          'var(--ds-info)',
  infoSoft:      'var(--ds-info-soft)',
} as const

export const space = {
  s1: 'var(--space-1)', s2: 'var(--space-2)', s3: 'var(--space-3)',
  s4: 'var(--space-4)', s5: 'var(--space-5)', s6: 'var(--space-6)',
  s8: 'var(--space-8)', s10: 'var(--space-10)', s12: 'var(--space-12)',
  s16: 'var(--space-16)', s20: 'var(--space-20)', s24: 'var(--space-24)',
} as const

export const radius = {
  xs: 'var(--radius-xs)',
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  pill: 'var(--radius-pill)',
} as const

export const shadow = {
  xs: 'var(--shadow-xs)',
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  focus: 'var(--shadow-focus)',
} as const

export const motion = {
  easeOut:    'var(--ease-out)',
  easeInOut:  'var(--ease-in-out)',
  durationMicro: 'var(--duration-micro)',
  durationFast:  'var(--duration-fast)',
  duration:      'var(--duration)',
  durationSlow:  'var(--duration-slow)',
} as const

export const layout = {
  headerH:    'var(--header-h)',
  sidebarW:   'var(--sidebar-w)',
  contentMax: 'var(--content-max)',
  readingMax: 'var(--reading-max)',
} as const

export const fonts = {
  display: 'var(--font-display)',
  body:    'var(--font-body)',
  mono:    'var(--font-mono)',
} as const

/** Type scale (semantic) — usage : style={{ font: type.h1 }} ou via classes .ds-h1 etc. */
export const type = {
  display1: { fontSize: 'var(--display-1-size)', lineHeight: 'var(--display-1-lh)', letterSpacing: 'var(--display-1-tracking)', fontWeight: 'var(--display-1-weight)', fontFamily: 'var(--font-display)' },
  display2: { fontSize: 'var(--display-2-size)', lineHeight: 'var(--display-2-lh)', letterSpacing: 'var(--display-2-tracking)', fontWeight: 'var(--display-2-weight)', fontFamily: 'var(--font-display)' },
  h1:       { fontSize: 'var(--h1-size)',       lineHeight: 'var(--h1-lh)',       letterSpacing: 'var(--h1-tracking)',       fontWeight: 'var(--h1-weight)',       fontFamily: 'var(--font-display)' },
  h2:       { fontSize: 'var(--h2-size)',       lineHeight: 'var(--h2-lh)',       letterSpacing: 'var(--h2-tracking)',       fontWeight: 'var(--h2-weight)',       fontFamily: 'var(--font-display)' },
  h3:       { fontSize: 'var(--h3-size)',       lineHeight: 'var(--h3-lh)',       letterSpacing: 'var(--h3-tracking)',       fontWeight: 'var(--h3-weight)',       fontFamily: 'var(--font-display)' },
  h4:       { fontSize: 'var(--h4-size)',       lineHeight: 'var(--h4-lh)',       fontWeight: 'var(--h4-weight)',       fontFamily: 'var(--font-display)' },
  bodyLg:   { fontSize: 'var(--body-lg-size)',  lineHeight: 'var(--body-lg-lh)' },
  body:     { fontSize: 'var(--body-size)',     lineHeight: 'var(--body-lh)' },
  bodySm:   { fontSize: 'var(--body-sm-size)',  lineHeight: 'var(--body-sm-lh)' },
  caption:  { fontSize: 'var(--caption-size)',  lineHeight: 'var(--caption-lh)', letterSpacing: 'var(--caption-tracking)', color: 'var(--fg-3)' },
  eyebrow:  { fontSize: 'var(--eyebrow-size)',  letterSpacing: 'var(--eyebrow-tracking)', fontWeight: 'var(--eyebrow-weight)', textTransform: 'uppercase' as const, color: 'var(--fg-2)', fontFamily: 'var(--font-body)' },
} as const

export const tokens = { colors, space, radius, shadow, motion, layout, fonts, type }
export default tokens
