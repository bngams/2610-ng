# Mini e-shop — solution du lab (état final, après l'étape 09)

Le workspace complet : les applications `fo` (boutique), `bo` (administration) et `marketing`
(la bannière promo en micro-frontend), et les bibliothèques `@shop/api`, `@shop/auth`, `@shop/ui`,
`@shop/products` et `@shop/util`. À ne regarder qu'en cas de blocage ; le guide est dans
[`../ETAPES/`](../ETAPES/) et la carte du workspace dans le [README du lab](../README.md).

Il faut **Node.js 22.22 ou 24.15 minimum**, et un terminal par serveur :

```bash
npm install
npm run api          # terminal 1 : l'API de démonstration sur http://localhost:3000
npm run fo           # terminal 2 : la boutique sur http://localhost:4200
npm run bo           # terminal 3 : l'administration sur http://localhost:4201
npm run marketing    # terminal 5 : la bannière promo sur http://localhost:4202 (facultatif : sans elle, les accueils affichent un repli)
```

Les comptes de démonstration sont fictifs : `alice` / `alice` (cliente) et `admin` / `admin`
(administrateur). Les tests se lancent par projet :

```bash
npx ng test fo --watch=false
npx ng test @shop/products --watch=false
npx ng test @shop/auth --watch=false
npx ng test @shop/util --watch=false
```
