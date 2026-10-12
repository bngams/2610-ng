# 02 — Démo HTTP

Le support de la démo en direct du jour 2 : `HttpClient`, routing, typage des réponses, enveloppe générique
`Page<T>`, service générique `ResourceService<I, T>`, environnements et intercepteurs fonctionnels, en Angular 22.

- 📄 **La page à garder** : [index.html](index.html), imprimable.
  En ligne : **https://bngams.github.io/2610-ng/02-demo-http/**
- 💻 **Le projet de la démo** : [demo/](demo/), qui contient tout le code montré sur la page. Son
  [README](demo/README.md) donne l'ordre de présentation.

## Lancer la démo

Il faut Node.js 22.22 ou 24.15 minimum, et une connexion internet (l'API est [dummyjson.com](https://dummyjson.com/docs)).

```bash
cd demo
npm install
npm start          # puis ouvrir http://localhost:4200
```

## Et ensuite

Avant : la [synthèse du jour 1](../00-intro-syntax-recap/). Pour pratiquer :
[Housing, premiers pas](../02-housing-init/) (parcours Init) ou
[Housing sous pression asynchrone](../02-housing-async/) (parcours Avancé).
