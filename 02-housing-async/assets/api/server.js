/**
 * L'API « v2 » : la même base json-server 0.17.4, mais chaque réponse est enveloppée dans
 * { data, meta }, comme le font beaucoup d'API réelles.
 *
 *   GET /locations                 -> { data: [...10 logements], meta: { total: 10, page: 1, limit: 10 } }
 *   GET /locations?_page=2&_limit=4 -> { data: [...4 logements],  meta: { total: 10, page: 2, limit: 4 } }
 *   GET /locations/3               -> { data: { id: 3, ... },     meta: null }
 *   POST /bookings                 -> { data: { id: 7, ... },     meta: null }
 *   une erreur (404...)            -> { data: null,               meta: null }, avec le même statut HTTP
 *
 * Lancement : npm run api:v2 (depuis la racine du projet). json-server est utilisé comme un
 * module Express : on garde son routeur, et on remplace seulement sa fonction de rendu.
 */
const path = require('path');
const jsonServer = require('json-server');

const PORT = 3000;
const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));

server.use(jsonServer.defaults());

// router.render est appelé par json-server après chaque route, avec le résultat dans res.locals.data.
router.render = (req, res) => {
  const data = res.locals.data;

  if (res.statusCode >= 400) {
    res.jsonp({ data: null, meta: null });
    return;
  }

  if (Array.isArray(data)) {
    // X-Total-Count n'est posé par json-server que si la requête pagine (_page, _limit ou _end).
    const header = res.get('X-Total-Count');
    const total = header === undefined ? data.length : Number(header);
    // json-server a déjà retiré _page et _limit de req.query : on les relit dans l'URL d'origine.
    const query = new URL(req.originalUrl, 'http://localhost').searchParams;
    const page = Number(query.get('_page')) || 1;
    const limit = Number(query.get('_limit')) || (query.has('_page') ? 10 : total);
    res.jsonp({ data, meta: { total, page, limit } });
    return;
  }

  res.jsonp({ data, meta: null });
};

server.use(router);
server.listen(PORT, () => {
  console.log(`API v2 { data, meta } sur http://localhost:${PORT}`);
});
