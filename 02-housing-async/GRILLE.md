# Grille de décision — quand RxJS, quand signals, où on fait le pont

> À remplir au fil des scénarios S1 à S6 de [README.md](README.md). La colonne « Vu dans » est
> déjà renseignée ; dans les trois autres, quelques mots suffisent, l'important est de pouvoir
> justifier chaque case à l'oral en trente secondes. Une case « Pont » peut rester vide si vous
> jugez qu'il n'y a pas de pont à faire : écrivez alors « sans objet » et dites pourquoi. La
> version attendue est dans `solution/GRILLE-corrigee.md`, à ouvrir **après**.

| Situation | RxJS | Signals | Pont (`toSignal` / `toObservable` / `rxResource`) | Vu dans |
|---|---|---|---|---|
| **État dérivé synchrone** (filtrer, trier, combiner des valeurs déjà en mémoire) | _quels opérateurs, et quel piège sur l'émission initiale ?_ | _combien de lignes ?_ | _en a-t-on besoin ici ?_ | S6 |
| **1 requête dépendant d'un état** (un id, une saisie, un filtre) | _quel opérateur d'aplatissement, pourquoi celui-là ?_ | _quelle API, et qu'est-ce qu'elle fait toute seule ?_ | _où passe la sortie vers le template ?_ | S1, S2 |
| **Requêtes en parallèle** (plusieurs appels, une seule page) | _quel combinateur, et quelle UX en découle ?_ | _comment savoir que tout est là ?_ | _sans objet ?_ | S2 |
| **Annulation, « dernier gagne »** (nouvelle saisie, nouvelle route) | _quel opérateur ?_ | _qu'est-ce qui annule, et sur quelle condition ?_ | _comment ajouter un debounce côté signals ?_ | S1, S4 (et piège 1) |
| **File ou anti-rebond d'action** (paiement, sauvegarde automatique, double clic) | _un opérateur par cas : recherche / paiement / sauvegarde automatique_ | _quel équivalent pour chacun ? lequel n'existe pas ?_ | _sans objet ?_ | S4 |
| **Flux dans le temps** (polling, debounce ; par extension websocket, retry avec repli) | _les briques vues en S5 et S1_ | _ce que ça coûte en « signals seuls »_ | _la forme du pont qui garde le temps côté RxJS_ | S5, S1 |
| **Formulaire => état** (une saisie qui pilote le reste) | _Reactive Forms : quel observable, quelle sortie ?_ | _v22 : Signal Forms (demain, J2) ; v20 : ?_ | _la ligne qui relie les deux_ | S1, S6 (RxJS), J2 (signals) |

