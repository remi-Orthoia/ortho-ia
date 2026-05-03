/**
 * Rebuild public/ortho-ia-extension.zip à partir du contenu de chrome-extension/.
 *
 * À lancer après chaque modification de l'extension Chrome (manifest, popup,
 * background, INSTALLATION.md…) avant un commit, sinon le ZIP téléchargé
 * depuis la page profil sera obsolète.
 *
 * Usage : npm run build:extension
 *
 * Le fichier de sortie a une convention de chemin interne : tous les fichiers
 * sont placés sous "ortho-ia-extension/<file>" dans le ZIP, pour que la
 * décompression côté utilisateur crée un dossier propre (et non pas une
 * collection de fichiers en vrac dans Téléchargements/).
 */
import AdmZip from 'adm-zip'
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC = 'chrome-extension'
const OUT = 'public/ortho-ia-extension.zip'
const PREFIX = 'ortho-ia-extension'

const zip = new AdmZip()
const files = readdirSync(SRC).sort()

let count = 0
for (const f of files) {
  const full = join(SRC, f)
  if (statSync(full).isFile()) {
    zip.addLocalFile(full, PREFIX)
    console.log(`  + ${PREFIX}/${f}`)
    count++
  }
}

zip.writeZip(OUT)
const size = statSync(OUT).size
console.log(`\nOK  ${count} fichiers  →  ${OUT}  (${size} octets)`)
