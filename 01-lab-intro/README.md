# 01 — Lab Intro : le catalogue de formations

> **Scénario à réaliser en autonomie.** Vous construisez un petit catalogue de formations avec un
> panier d'inscription. C'est la mise en pratique immédiate de la [synthèse du matin](../00-intro-syntax-recap/index.html),
> avant le cas Housing de l'après-midi. Vous complétez les `// TODO` vous-même ; les dossiers
> `solution-*` sont là en dernier recours.

## ✨ Objectifs

- Écrire un composant standalone, l'utiliser dans un autre, lui passer des données (`input()`) et
  remonter des événements (`output()`).
- Sortir la donnée dans un service et l'injecter avec `inject()`.
- Rendre l'état réactif avec `signal()` et `computed()`.
- **Parcours Avancé** : parcourir toute la famille des signals (`computed`, dépendances dynamiques,
  `linkedSignal`, égalité, `effect`, `afterRenderEffect`) et `@defer`, un piège par étape.

## 🧭 Deux parcours, un seul énoncé

| | 🟢 **Init** | 🔵 **Avancé** |
|---|---|---|
| Pour qui | vous découvrez Angular, ou vous venez d'une version ancienne | vous codez Angular au quotidien et vous voulez maîtriser les signals |
| Point de départ | [`starter/`](starter/) : projet vide + données | [`starter-avance/`](starter-avance/) : la liste, la carte et le service sont déjà là |
| Format | 4 étapes guidées, codes à trous | 8 étapes : concept, lien doc, scénario à implémenter, piège à diagnostiquer |
| Durée | ≈ 1 h | ≈ 1 h 30 à 2 h |
| Solution | [`solution-init/`](solution-init/) | [`solution-avance/`](solution-avance/) |

Si vous hésitez : prenez **Init**. Les étapes 1 à 3 de l'Init sont exactement le point de départ
de l'Avancé, vous pourrez basculer ensuite.

## 📁 Point de départ

Le domaine tient en deux fichiers, déjà fournis dans chaque starter :

```
src/app/
├── models/formation.ts        l'interface Formation (id, titre, ville, niveau, prixHT, places, dateDebut)
├── data/formations.data.ts    FORMATIONS : 8 formations, et AVIS pour le parcours Avancé
└── app.ts                     le composant racine, presque vide
src/styles.css                 un peu de CSS (classes card, badge, panier, toolbar…) pour ne pas y passer de temps
```

Ce que vous allez obtenir à la fin (les deux parcours aboutissent au même écran de base, l'Avancé
y ajoute les filtres, la sélection et les avis) :

```
┌──────────────────────────────────────────────────────┐
│ Panier : 2 inscription(s)      Total : 3900 € HT     │  <- panier (signal + computed)
├──────────────────────────────────────────────────────┤
│ Formations                                           │
│ ┌─────────────────┐ ┌─────────────────┐ ┌──────────┐ │
│ │ Angular 22      │ │ Angular avancé  │ │ Tests un…│ │  <- une FormationCard par formation (@for)
│ │ Toulouse · 1800 │ │ Paris · 2100    │ │ Lyon…    │ │
│ │ [8 places]      │ │ [6 places]      │ │ [complet]│ │
│ │ (S'inscrire)    │ │ (S'inscrire)    │ │ (grisé)  │ │  <- bouton => output() => le parent met le panier à jour
│ └─────────────────┘ └─────────────────┘ └──────────┘ │
└──────────────────────────────────────────────────────┘
```

## 🚀 Mise en place

Angular 22 demande **Node.js 22.22 ou 24.15 minimum**. Vérifiez, puis installez :

```bash
node -v                    # si < 22.22 : nvm install 24 && nvm use 24
cd starter                 # ou starter-avance
npm install
npm start                  # http://localhost:4200
```

> 💡 **Tester.** Le navigateur affiche « Catalogue de formations » et une ligne grise. C'est tout,
> et c'est normal : le reste est à vous. `npm test` est vert (1 test) et doit le rester.

> ⚠️ **Piège : `nvm use` ne vaut que pour le terminal courant.** Symptôme : `ng` répond
> `Please update your Node.js version` dans un nouveau terminal. Cause : le terminal est revenu au
> Node par défaut. Correctif : refaire `nvm use 24`, ou fixer le défaut avec `nvm alias default 24`.

## 🟢 Parcours Init

| Étape | Vous apprenez | Synthèse |
|---|---|---|
| [I1 — La liste](INIT/I1-LISTE.md) | un composant, `@for`, `track` | sections 1, 2, 6 |
| [I2 — La carte](INIT/I2-CARTE.md) | composant enfant, `input()`, `output()`, `(click)` | section 5 |
| [I3 — Le service](INIT/I3-SERVICE.md) | `@Injectable`, `inject()` | section 7 |
| [I4 — Le panier](INIT/I4-PANIER.md) | `signal()`, `update()`, `computed()` | section 4 |

Le guidage est fort en I1 et I2 (chaque fichier à créer est indiqué), puis s'allège en I3 et I4 :
vous avez déjà les gestes.

## 🔵 Parcours Avancé

Tout en **signals synchrones** : pas d'HTTP ni de `resource` ce matin, c'est le sujet de
l'après-midi. Chaque étape suit le même format : *concept en deux lignes, lien doc, scénario à
implémenter, piège à diagnostiquer*. Les pièges sont des extraits de code subtilement faux ; la
réponse est repliée sous l'énoncé, et **chaque piège est prouvé par un test** dans
[`solution-avance/src/app/pieges.spec.ts`](solution-avance/src/app/pieges.spec.ts).

| Étape | Concept | Scénario |
|---|---|---|
| [A1](AVANCE/A1-SIGNAL.md) | `signal()` | la liste et le panier d'inscription |
| [A2](AVANCE/A2-COMPUTED.md) | `computed()` | liste filtrée, places restantes, total |
| [A3](AVANCE/A3-DEPENDANCES-DYNAMIQUES.md) | dependency tracking, `untracked` | affichage HT / TTC |
| [A4](AVANCE/A4-LINKED-SIGNAL.md) | `linkedSignal()` | la sélection se réinitialise quand le filtre change |
| [A5](AVANCE/A5-LINKED-SIGNAL-PREVIOUS.md) | `linkedSignal` avec état précédent | la sélection survit si elle est encore dans la liste |
| [A6](AVANCE/A6-EQUALITY.md) | `equal` | des filtres `{ ville, niveau }` ré-appliqués à l'identique |
| [A7](AVANCE/A7-EFFECT.md) | `effect()`, `afterRenderEffect()` | panier persisté, scroll vers la sélection |
| [A8](AVANCE/A8-DEFER.md) | `@defer` | les avis d'une formation |

Sur un projet **Angular 20**, tout ce qui est utilisé ici est stable (voir le
[repère de version](../00-intro-syntax-recap/repere-v20.html)).

## Récap

- Deux starters, deux solutions, un même catalogue.
- Init : 4 étapes guidées qui couvrent exactement ce dont Housing a besoin cet après-midi.
- Avancé : 8 étapes, un piège par étape, tout prouvé par des tests.

➡️ Init : commencez par [I1 — La liste](INIT/I1-LISTE.md). Avancé : [A1 — signal()](AVANCE/A1-SIGNAL.md).
