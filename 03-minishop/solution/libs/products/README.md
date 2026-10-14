# @shop/products

Le catalogue, partagé par les deux applications : le modèle `Product`, `ProductsService` (lecture,
hérite de `ResourceService`), la carte produit (qui émet un événement `add` au lieu de connaître le
panier du FO) et la liste de produits utilisée par le BO. Elle dépend de `@shop/api` et `@shop/ui`.

Fournie à l'étape 02, testée à l'étape 07 du lab. Tests : `npx ng test @shop/products --watch=false`.
