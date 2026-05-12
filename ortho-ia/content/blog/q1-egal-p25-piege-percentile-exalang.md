---
title: "Q1 = P25 : le piège des percentiles Exalang qu'on retrouve dans la moitié des CRBO"
description: "Pourquoi Q1 dans un protocole Exalang correspond au percentile 25 et NON à une zone de difficulté sévère — et comment éviter l'erreur d'interprétation qui circule dans la moitié des bilans."
date: 2026-05-08
author: "L'équipe Ortho.ia"
tags: ["exalang", "percentile", "CRBO"]
---

C'est l'une des erreurs les plus fréquentes qu'on retrouve dans les CRBO : un enfant a un score en Q1 sur une épreuve Exalang, et l'ortho conclut "zone de difficulté sévère". Or **Q1 = percentile 25**, ce qui place l'enfant en zone de **fragilité**, pas en difficulté sévère. La différence change le diagnostic, change les recommandations, et parfois change la décision d'engager une prise en charge.

## D'où vient le piège

Les logiciels Exalang affichent dans une même colonne "Percentiles" deux types d'informations qui peuvent prêter à confusion :

- Des **valeurs exactes** : P5, P10, P90, P95 — à prendre telles quelles.
- Des **quartiles** : Q1, Med (ou Q2), Q3 — qui correspondent respectivement aux percentiles 25, 50 et 75.

Quand on voit "Q1" sans réflexe de conversion, on a parfois envie de lire "ça ne va pas bien". Et si on regarde l'écart-type en parallèle (souvent -1,3 à -1,7 É-T pour un Q1), on confirme intuitivement l'impression défavorable. Sauf que la distribution Exalang n'est pas gaussienne — les normes locales ne se convertissent pas en zones cliniques via les seuils gaussiens classiques. **C'est le percentile qui fait foi, pas l'écart-type.**

## La grille à six zones, validée par les usages français

| Percentile | Interprétation clinique | Couleur de tableau |
|---|---|---|
| P > 75 | Excellent | Vert foncé |
| P51 à P75 | Moyenne haute | Vert clair |
| P26 à P50 | Moyenne basse | Jaune-vert |
| **P10 à P25 (Q1 inclus)** | **Fragilité** | **Orange** |
| P6 à P9 | Difficulté | Orange foncé |
| P ≤ 5 | Difficulté sévère | Marron |

Cette grille suit l'étalonnage Happy Scribe et est largement utilisée par les orthos françaises en exercice. Elle a l'avantage d'être **plus fine** que la grille classique en quatre zones, et d'éviter le décrochage trop brutal entre "norme" et "difficulté".

## L'exemple type

PDF Exalang qui indique : "Boucle phonologique : É-T -1.53, Percentiles : Q1"

L'interprétation correcte :

- Percentile = Q1, c'est-à-dire P25
- Interprétation = **Fragilité**
- Pas "Difficulté sévère" (qui correspondrait à P ≤ 5)

L'erreur fréquente est de recalculer le percentile depuis l'écart-type : -1,53 É-T sur une loi normale correspond à environ P6-P7, ce qui placerait l'enfant en "Difficulté". **Mais cette conversion n'est pas valide pour Exalang** — l'étalonnage du test fournit déjà le percentile correct, qui prend en compte la distribution réelle observée chez les enfants de l'âge testé.

## Pourquoi cette erreur change tout

Confondre Q1 (P25) avec P5 a trois conséquences directes :

1. **Le diagnostic est trop sévère.** Une fragilité sur un domaine isolé ne suffit pas à poser un trouble spécifique des apprentissages — il faut un faisceau d'arguments convergents. Une difficulté sévère sur ce même domaine, oui.
2. **Les recommandations sont disproportionnées.** Si une fragilité justifie souvent une vigilance et un travail ciblé, une difficulté sévère justifie une prise en charge intensive et des aménagements lourds.
3. **La famille panique.** Un CRBO qui annonce "difficultés sévères sur 5 épreuves" alors que ces 5 épreuves sont en réalité en fragilité installe une angoisse disproportionnée.

## La bonne réflex

À chaque fois que vous voyez "Q1", "Med" ou "Q3" dans un PDF Exalang ou un export logiciel : **convertir mentalement** en P25, P50, P75 avant de qualifier la zone. Pour P5, P10, P90 et P95 : les valeurs sont déjà des percentiles exacts, prendre telles quelles.

Et toujours **se fier au percentile fourni par le test**, jamais à un percentile recalculé depuis un écart-type — sauf si vous travaillez sur une batterie qui ne fournit pas les percentiles directement (ce qui est rare en Exalang).
