/**
 * Test CRBO de bout en bout — snippet à coller dans la console DevTools du
 * navigateur, sur https://ortho-ia.vercel.app/ après login.
 *
 * Lance les 2 phases (extract puis synthesize) pour le profil Lucile Andreaux,
 * affiche les 2 réponses dans la console et copie la structure finale dans
 * le presse-papier (window.__lucileCrbo). Ne déclenche PAS le téléchargement
 * Word (pour ça : refaire le test depuis le formulaire UI).
 *
 * Usage :
 *   1. Login sur https://ortho-ia.vercel.app
 *   2. Ouvrir DevTools → Console
 *   3. Coller TOUT ce fichier (ou son contenu sans le commentaire d'en-tête)
 *   4. Appeler `await testLucile('complet')` ou `await testLucile('synthetique')`
 *   5. Lire les outputs dans la console et inspecter `window.__lucileCrbo`.
 */

;(function () {
  const FORM_DATA_LUCILE = {
    ortho_nom: 'Laurie Berrio-Arberet',
    ortho_adresse: '10 Chemin de la Barque',
    ortho_cp: '81100',
    ortho_ville: 'Castres',
    ortho_tel: '07 49 31 41 08',
    ortho_email: 'Ortho.berrio@gmail.com',
    patient_prenom: 'Lucile',
    patient_nom: 'ANDREAUX',
    patient_ddn: '2011-04-19',
    patient_classe: '4ème',
    bilan_date: '2026-04-25',
    bilan_type: 'initial',
    medecin_nom: 'Dr Marie-Christine Ricard Hibert',
    medecin_tel: '07 84 53 32 10',
    motif:
      'difficultés compréhension écrit et oral, décodage lent, fautes orthographe, difficultés expression orale',
    anamnese:
      'grand frère 18 ans - vision audition RAS - bilan ortho 2019 Mme Baissac retard lecture orthographe - TDAH diagnostic pédiatre - psychomot Mme Clair 2022 terminé - ergo Mme Bilqué jan 2026 séances prévues - orthodontie bagues 2 ans - PAP en place',
    test_utilise: ['Exalang 11-15'],
    resultats_manuels: [
      'Empan auditif endroit : 3/7, É-T -3.34, P5',
      'Empan auditif envers : 4/6, É-T -0.47, Q3',
      'Boucle phonologique : 10/25, É-T -2.96, P5',
      'Fluence phonétique : 5/17, É-T -1.25, Q1',
      'Fluence sémantique : 8/18.5, É-T -1.85, P5',
      'Morphologie dérivationnelle score : 14/16, É-T -0.13, Q3',
      'Morphologie dérivationnelle temps : 225s, É-T -1.84, P10',
      'Morphologie dérivationnelle ratio : 6.22/20, É-T -1.24, P10',
      'Compréhension de consignes : 9/12, É-T -0.39, Med',
      'Complément de phrase oral : 14/18, É-T -1.62, Q1',
      'Lecture de mots score : 73/100, É-T -20.84, P5',
      'Lecture de mots temps : 180s, É-T -3.41, P5',
      'Lecture de mots ratio : 40.56/86.5, É-T -2.62, P5',
      'Leximétrie erreurs non-mots : 0/13, É-T +1.00, P95',
      'Leximétrie temps : 269s, É-T -5.90, P5',
      'Leximétrie mots lus correctement : 224/225, É-T +0.76, P90',
      'Leximétrie note pondérée : 271, É-T -4.88, P5',
      'Lecture recherche ratio : 5/30, É-T -1.35, P10',
      'Lecture recherche réponses : 10/12, É-T -0.86, Med',
      'Lecture recherche temps : 217s, É-T -3.86, P5',
      'Dictée phonologie : 20/24, É-T -4.28, P5',
      'Dictée lexique : 15/24, É-T -1.42, Q1',
      'Dictée grammatical : 10/24, É-T -1.68, P10',
    ].join('\n'),
    notes_analyse:
      "Lucile s'est montrée coopérante et impliquée. Fatigabilité perceptible sur les épreuves longues. Nombreuses autocorrections en lecture témoignant d'une bonne conscience de ses difficultés.",
  }

  // Commentaires qualitatifs ortho par domaine — utilisés en phase 2
  // (reflètent ce que l'orthophoniste saisirait sur la page résultats).
  const ORTHO_COMMENTS_LUCILE = {
    'B.1 Lecture':
      "3 erreurs sur mots irréguliers avec régularisations caractéristiques (doigté lu phonologiquement, net lu nette, martien régularisé) — fragilité de la voie d'adressage. Leximétrie : nombreuses autocorrections efficaces mais lecture hachée, une seule erreur par omission (le mot des) — décodage compensatoire intégré malgré la lenteur.",
    'B.2 Orthographe / production écrite':
      "Erreurs systématiques sur les accords pluriels, homophones grammaticaux (on/ont, ces/ses, est/et, à/a), omissions d'accent, erreurs sur la valeur du graphème s, confusions c/g. Profil de dysorthographie à dominante grammaticale et phonogrammique.",
  }

  async function callApi(payload) {
    const res = await fetch('/api/generate-crbo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.error('❌ API error', res.status, data)
      throw new Error((data && data.error) || `HTTP ${res.status}`)
    }
    return data
  }

  /**
   * @param {'complet'|'synthetique'} format
   */
  window.testLucile = async function testLucile(format = 'complet') {
    console.log(`%c[Lucile] phase 1 — extraction (${format})…`, 'color: #888')
    const t0 = performance.now()
    const extractRes = await callApi({
      phase: 'extract',
      format,
      formData: FORM_DATA_LUCILE,
    })
    console.log(`%c[Lucile] extraction OK en ${Math.round(performance.now() - t0)} ms`, 'color: #2E7D32')
    console.log('   anamnese_redigee :', extractRes.extracted?.anamnese_redigee)
    console.log('   motif_reformule  :', extractRes.extracted?.motif_reformule)
    console.log('   domains          :', extractRes.extracted?.domains)

    console.log(`%c[Lucile] phase 2 — synthèse (${format}) avec commentaires ortho…`, 'color: #888')
    const t1 = performance.now()
    const synthRes = await callApi({
      phase: 'synthesize',
      format,
      formData: FORM_DATA_LUCILE,
      extracted: extractRes.extracted,
      edits: {
        anamnese: extractRes.extracted?.anamnese_redigee || '',
        motif: extractRes.extracted?.motif_reformule || '',
        ortho_comments: ORTHO_COMMENTS_LUCILE,
      },
    })
    console.log(`%c[Lucile] synthèse OK en ${Math.round(performance.now() - t1)} ms`, 'color: #2E7D32')
    console.log('   diagnostic        :', synthRes.synthesized?.diagnostic)
    console.log('   recommandations   :', synthRes.synthesized?.recommandations)
    console.log('   pap_suggestions   :', synthRes.synthesized?.pap_suggestions)
    console.log('   comorbidites      :', synthRes.synthesized?.comorbidites_detectees)
    console.log('   severite_globale  :', synthRes.synthesized?.severite_globale)

    // Structure CRBO finale fusionnée
    const finalStructure = {
      anamnese_redigee: extractRes.extracted?.anamnese_redigee,
      motif_reformule: extractRes.extracted?.motif_reformule,
      domains: (extractRes.extracted?.domains || []).map((d) => ({
        ...d,
        commentaire: ORTHO_COMMENTS_LUCILE[d.nom] || d.commentaire || '',
      })),
      diagnostic: synthRes.synthesized?.diagnostic,
      recommandations: synthRes.synthesized?.recommandations,
      conclusion: synthRes.synthesized?.conclusion,
      severite_globale: synthRes.synthesized?.severite_globale ?? null,
      comorbidites_detectees: synthRes.synthesized?.comorbidites_detectees ?? [],
      pap_suggestions: synthRes.synthesized?.pap_suggestions ?? [],
      synthese_evolution: synthRes.synthesized?.synthese_evolution ?? null,
    }
    window.__lucileCrbo = { format, formData: FORM_DATA_LUCILE, structure: finalStructure }
    console.log('%c[Lucile] terminé — structure complète dans window.__lucileCrbo', 'color: #1565C0; font-weight: bold')
    return finalStructure
  }

  console.log(
    '%c[Lucile] snippet chargé — appeler `await testLucile("complet")` ou `await testLucile("synthetique")`',
    'color: #1565C0; font-weight: bold',
  )
})()
