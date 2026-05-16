import type { TestModule } from './types'
import { exalang36 } from './exalang-3-6'
import { exalang58 } from './exalang-5-8'
import { exalang811 } from './exalang-8-11'
import { exalang1115 } from './exalang-11-15'
import { evalo26 } from './evalo-2-6'
import { elo } from './elo'
import { bale } from './bale'
import { evaleo615 } from './evaleo-6-15'
import { neel } from './n-eel'
import { bilo } from './bilo'
import { belec } from './belec'
import { examath } from './examath'
import { omfDeglutition } from './omf-deglutition'
import { moca } from './moca'
import { betl } from './betl'
import { predimem } from './predimem'
import { predifex } from './predifex'
import { becd } from './becd'
import { bia } from './bia'

export const TEST_REGISTRY: Record<string, TestModule> = {
  'Exalang 3-6': exalang36,
  'Exalang 5-8': exalang58,
  'Exalang 8-11': exalang811,
  'Exalang 11-15': exalang1115,
  'EVALO 2-6': evalo26,
  'ELO': elo,
  'BALE': bale,
  'EVALEO 6-15': evaleo615,
  'N-EEL': neel,
  'BILO': bilo,
  'BELEC': belec,
  'Examath': examath,
  'OMF / Déglutition': omfDeglutition,
  'MoCA': moca,
  'BETL': betl,
  'PREDIMEM': predimem,
  'PrediFex': predifex,
  'BECD': becd,
  'BIA': bia,
}

export function getTestModule(nom: string): TestModule | null {
  return TEST_REGISTRY[nom] ?? null
}

export type { TestModule }
