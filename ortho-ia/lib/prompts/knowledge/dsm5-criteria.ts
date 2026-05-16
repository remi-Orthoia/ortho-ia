/**
 * Critères diagnostiques officiels DSM-5 (2015) — troubles du langage et
 * troubles spécifiques des apprentissages.
 *
 * Source : docs/Etudes de cas CRBO/diagnostic DSM 5.pdf
 * + docs/Etudes de cas CRBO/diagnostic criteres de sévérité.pdf
 *
 * À injecter dans le system prompt pour ancrer les formulations
 * diagnostiques sur les critères officiels (ne pas inventer, ne pas
 * mélanger DSM-5 et CIM-10).
 */

export const DSM5_CRITERIA = `## DSM-5 (2015) — Critères diagnostiques officiels (extraits)

### Troubles du langage oral
- **A.** Difficultés persistantes d'acquisition et d'utilisation du langage dans ses différentes modalités dues à un manque de compréhension ou de production incluant :
  1. Vocabulaire restreint (connaissance et utilisation des mots)
  2. Carence de structuration de phrases
  3. Déficience du discours
- **B.** Les capacités de langage oral sont **de façon marquée et quantifiable inférieures** au niveau escompté pour l'âge du sujet. Il en résulte des limitations fonctionnelles de la communication, de la participation sociale, des résultats scolaires ou du rendement professionnel.
- **C.** Les symptômes débutent dans la **période précoce** du développement.
- **D.** Les difficultés ne sont pas imputables à un déficit auditif, sensoriel, moteur cérébral, ou à une autre affection neurologique/médicale, et ne sont pas mieux expliquées par un handicap intellectuel ou un retard global de développement.

### Trouble spécifique des apprentissages — 4 critères
- **A.** Difficultés à apprendre et utiliser des compétences scolaires/universitaires, présence d'au moins UN symptôme persistant ≥ 6 mois MALGRÉ les mesures ciblées :
  1. Lecture des mots inexacte ou lente et réalisée péniblement (devine les mots, prononciation difficile).
  2. Difficultés à comprendre (peut lire correctement mais ne pas comprendre l'ordre, les relations, les déductions, le sens profond).
  3. Difficultés à épeler (orthographe lexicale) : ajoute, oublie ou substitue des voyelles/consonnes.
  4. Difficultés d'expression écrite (erreurs grammaticales, de ponctuation, paragraphes mal construits, manque de clarté).
  5. Difficultés à maîtriser le sens des nombres.
  6. Difficultés avec le raisonnement mathématique.
- **B.** Les compétences sont **nettement au-dessous du niveau escompté** pour l'âge chronologique, **de manière quantifiable**, et interfèrent significativement avec les performances scolaires/universitaires/professionnelles ou la vie courante.
  - 🎯 **Pour une plus grande certitude diagnostique** : notes de performances basses sur au moins UN test, seuils — **≤ −1,5 ET** OU **NS < 78** OU **Percentile < 7**.
  - Pour les individus ≥ 17 ans, des antécédents avérés de difficultés peuvent se substituer à une évaluation standardisée.
- **C.** Les difficultés débutent **au cours de la scolarité** mais peuvent ne pas se manifester entièrement tant que les demandes ne dépassent pas les capacités limitées (ex. examens chronométrés, rapports longs, charge de travail excessive).
- **D.** Les difficultés ne sont pas mieux expliquées par un handicap intellectuel, des troubles non corrigés de l'acuité visuelle ou auditive, d'autres troubles neurologiques ou mentaux, une adversité psychosociale, un manque de maîtrise de la langue d'enseignement, ou un enseignement pédagogique inadéquat.

### Critères de sévérité (à utiliser dans le diagnostic final)
Pour spécifier le degré de retentissement scolaire/universitaire/professionnel :

- **LÉGER** : difficultés d'une intensité légère, le sujet parvient à **compenser ou bien fonctionner** lorsqu'il bénéficie d'**aménagements et de dispositifs de soutien appropriés**.
- **MOYEN** : difficultés telles que le sujet risque fort de ne pas devenir opérationnel **sans certaines périodes d'enseignement intensif et spécialisé** au cours de sa scolarité. Aménagements et soutiens nécessaires pendant au moins une partie de la journée à l'école, au travail ou à la maison.
- **GRAVE** : difficultés telles que le sujet risque fort de ne pas acquérir les capacités **sans un enseignement individualisé et spécialisé intensif et continu**. Même avec aménagements complets, le sujet peut ne pas être capable d'accomplir toutes ses activités efficacement.

### Trouble non spécifique de la communication / neurodéveloppemental
Catégorie pour les tableaux où prédominent des symptômes de trouble de la communication entraînant détresse cliniquement significative ou altération du fonctionnement, **SANS que les critères complets** d'un trouble spécifique ne soient remplis. Utilisée quand le clinicien manque d'informations pour un diagnostic plus spécifique.

---

### Règle d'écriture pour ortho.ia
- Quand tu poses un diagnostic, tu peux référer au DSM-5 SANS recopier les critères verbatim.
- Forme acceptée pour le diagnostic juridique formel (cf. CRBO humains) :
  > "Conformément au décret n°2002-721 du JO du 4 mai 2002 rendant le diagnostic orthophonique obligatoire et en référence aux classifications internationales en cours (DSM-V / CIM-10), le bilan orthophonique réalisé ce jour met en évidence un [type de trouble] objectivé par un retentissement notable sur les apprentissages et par l'obtention de résultats affaiblis/déficitaires lors de la passation d'épreuves standardisées."
- Précise la sévérité (légère / moyenne / grave) **selon la classification ci-dessus** — un trouble léger justifie aménagements simples, un trouble grave justifie PPS/MDPH.
`
