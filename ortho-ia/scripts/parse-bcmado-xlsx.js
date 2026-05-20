// One-shot diagnostic: parse the Profil B-CMado.xlsx into a clean cell map
// so we can fact-check the grille reproduction.
const fs = require('fs')
const path = require('path')

// xlsx is unzipped into /tmp/bcmado_xlsx (via `unzip` step done manually)
// On Windows the unzip happened via Git Bash /tmp which is actually
// %LOCALAPPDATA%\Temp\... Let me try both.
const candidates = [
  process.env.HOME + '/tmp/bcmado_xlsx',
  'C:/Users/remib/AppData/Local/Temp/bcmado_xlsx',
  '/tmp/bcmado_xlsx',
]
let baseDir = null
for (const c of candidates) {
  try {
    if (fs.existsSync(c + '/xl/sharedStrings.xml')) { baseDir = c; break }
  } catch {}
}
if (!baseDir) {
  console.error('Cannot find extracted xlsx dir. Run: cd /tmp && mkdir bcmado_xlsx && cd bcmado_xlsx && unzip "/c/Users/remib/Desktop/ortho-ia-v3/ortho-ia/docs/Bilans Sources/Profil B-CMado.xlsx"')
  process.exit(1)
}

const sharedXml = fs.readFileSync(path.join(baseDir, 'xl/sharedStrings.xml'), 'utf-8')
const sheetXml = fs.readFileSync(path.join(baseDir, 'xl/worksheets/sheet1.xml'), 'utf-8')

const strings = []
const siRegex = /<si>([\s\S]*?)<\/si>/g
let m
while ((m = siRegex.exec(sharedXml)) !== null) {
  const inner = m[1]
  const tMatches = [...inner.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
  strings.push(tMatches.map(x => x[1]).join(''))
}

const cells = {}
const cellRegex = /<c r="([A-Z]+\d+)"[^>]*?(?:t="(\w+)")?[^>]*?(?:\/>|>(?:<f[^>]*>[^<]*<\/f>)?(?:<v>([^<]*)<\/v>)?<\/c>)/g
let cm
while ((cm = cellRegex.exec(sheetXml)) !== null) {
  const ref = cm[1]; const type = cm[2] || ''; const value = cm[3]
  if (value === undefined) continue
  if (type === 's') cells[ref] = strings[parseInt(value, 10)]
  else cells[ref] = value
}

const merges = []
const mergeRegex = /<mergeCell ref="([^"]+)"/g
let mm
while ((mm = mergeRegex.exec(sheetXml)) !== null) merges.push(mm[1])

const COLS = ['A','B','C','D','E','F','G','H','I','J','K','L','M']

console.log('===== CELLS PAR ROW =====')
for (let r = 2; r <= 32; r++) {
  const parts = []
  for (const col of COLS) {
    const k = `${col}${r}`
    const v = cells[k]
    if (v !== undefined) parts.push(`${col}=${v}`)
  }
  if (parts.length > 0) console.log(`R${r}: ${parts.join('  |  ')}`)
}

console.log('\n===== MERGES (sorted) =====')
merges.slice().sort().forEach(m => console.log(m))

console.log('\n===== SHARED STRINGS =====')
strings.forEach((s, i) => console.log(`${i}: ${s}`))
