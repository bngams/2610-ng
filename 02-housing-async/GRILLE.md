# Grille de décision — quand RxJS, quand signals, où on fait le pont

> À remplir au fil des étapes 01 à 08 de [README.md](README.md). La colonne « Vu dans » est
> déjà renseignée (le nombre entre parenthèses est le numéro de l'étape) ; dans les trois autres, quelques mots suffisent, l'important est de pouvoir
> justifier chaque case à l'oral en trente secondes. Une case « Pont » peut rester vide si vous
> jugez qu'il n'y a pas de pont à faire : écrivez alors « sans objet » et dites pourquoi. La
> version attendue est dans `solution/GRILLE-corrigee.md`, à ouvrir **après**.

| Situation | RxJS | Signals | Pont (`toSignal` / `toObservable` / `rxResource`) | Vu dans |
|---|---|---|---|---|
| **État dérivé synchrone** (filtrer, trier, combiner des valeurs déjà en mémoire) | _quels opérateurs, et quel piège sur l'émission initiale ?_ | _combien de lignes ?_ | _en a-t-on besoin ici ?_ | Filtres (07) |
| **1 requête dépendant d'un état** (un id, une saisie, un filtre) | _quel opérateur d'aplatissement, pourquoi celui-là ?_ | _quelle API, et qu'est-ce qu'elle fait toute seule ?_ | _où passe la sortie vers le template ?_ | Recherche (02), Détail (03) |
| **Requêtes en parallèle** (plusieurs appels, une seule page) | _quel combinateur, quelle UX en découle, et que devient une erreur sur un seul appel ?_ | _comment savoir que tout est là ? comment relancer un seul appel ?_ | _sans objet ?_ | Détail (03), erreur partielle (04) |
| **Annulation, « dernier gagne »** (nouvelle saisie, nouvelle route) | _quel opérateur ?_ | _qu'est-ce qui annule, et sur quelle condition ?_ | _comment ajouter un debounce côté signals ?_ | Recherche (02), Réserver (05), piège 1 (10) |
| **File ou anti-rebond d'action** (paiement, sauvegarde automatique, double clic) | _un opérateur par cas : recherche / paiement / sauvegarde automatique_ | _quel équivalent pour chacun ? lequel n'existe pas ?_ | _sans objet ?_ | Réserver (05), dossier (01) |
| **Flux dans le temps** (polling, debounce ; par extension websocket, retry avec repli) | _les briques vues pour la disponibilité et la recherche_ | _ce que ça coûte en « signals seuls »_ | _la forme du pont qui garde le temps côté RxJS_ | Disponibilité (06), Recherche (02), reprise (08) |
| **Formulaire => état** (une saisie qui pilote le reste) | _Reactive Forms : quel observable, quelle sortie ?_ | _v22 : Signal Forms, que reste-t-il à écrire ? v20 : ?_ | _la ligne qui relie les deux, et le sens inverse pour envoyer_ | Dossier (01), Recherche (02), Filtres (07) |

