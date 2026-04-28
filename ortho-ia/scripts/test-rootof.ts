import { rootOf } from '../lib/chart'
const cases: [string, string][] = [
  ['Lecture de mots — score', 'Lecture de mots'],
  ['Lecture de mots — temps', 'Lecture de mots'],
  ['Lecture de mots (ratio)', 'Lecture de mots'],
  ['Empan auditif endroit', 'Empan auditif'],
  ['Empan auditif envers', 'Empan auditif'],
  ['Morphologie dérivation score', 'Morphologie dérivation'],
  ['Morphologie dérivation temps', 'Morphologie dérivation'],
  ['Boucle phonologique', 'Boucle phonologique'],
  ['Fluence phonémique', 'Fluence phonémique'],
  ['Fluence sémantique', 'Fluence sémantique'],
  ['Compréhension de consignes', 'Compréhension de consignes'],
  ['Complément de phrase oral', 'Complément de phrase oral'],
  ['Leximétrie — erreurs non-mots', 'Leximétrie'],
  ['Leximétrie — note pondérée', 'Leximétrie'],
  ['Dictée — phonologie', 'Dictée'],
  ['Dictée — lexique', 'Dictée'],
]
let ok = 0, fail = 0
for (const [input, expected] of cases) {
  const got = rootOf(input)
  if (got === expected) { ok++; console.log(`  ✓ "${input}" → "${got}"`) }
  else { fail++; console.log(`  ✗ "${input}" → "${got}" (attendu "${expected}")`) }
}
console.log(`\n${ok}/${ok+fail} passes`)
process.exit(fail > 0 ? 1 : 0)
