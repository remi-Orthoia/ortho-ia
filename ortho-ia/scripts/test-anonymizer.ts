/** Sanity-test ad-hoc pour la regex de scrubText (anonymizer.ts). */
import { scrubText } from '../lib/anonymizer'

const tests: Array<{ name: string; input: string; expected: string }> = [
  // Cas qui DOIVENT matcher
  { name: 'Léa',          input: 'Bonjour Léa, ça va',            expected: 'Bonjour [P], ça va' },
  { name: 'Marie-Claire', input: 'Mme Marie-Claire est venue',    expected: 'Mme [P] est venue' },
  { name: "O'Reilly",     input: "Madame O'Reilly a parlé",       expected: 'Madame [P] a parlé' },
  { name: 'Émélie',       input: 'Émélie est là',                 expected: '[P] est là' },
  { name: 'Berrio',       input: 'Mme Berrio. Et alors ?',        expected: 'Mme [P]. Et alors ?' },
  // Cas qui NE DOIVENT PAS matcher (lettre adjacente = sous-chaîne)
  { name: 'Berrio',       input: 'Berriot est différent',         expected: 'Berriot est différent' },
  { name: 'Léa',          input: 'Léane est venue',               expected: 'Léane est venue' },
]

let pass = 0, fail = 0
for (const t of tests) {
  const got = scrubText(t.input, [[t.name, '[P]']])
  const ok = got === t.expected
  console.log(`${ok ? 'PASS' : 'FAIL'}  [${t.name}]  "${t.input}"  →  "${got}"  ${ok ? '' : '(expected "' + t.expected + '")'}`)
  ok ? pass++ : fail++
}
console.log(`\n${pass} pass, ${fail} fail`)
process.exit(fail === 0 ? 0 : 1)
