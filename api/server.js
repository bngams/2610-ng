/**
 * L'API de démonstration du MiniShop : json-server 0.17.4 utilisé comme un module Express.
 *
 *   GET    /api/products, /api/products/:id   lecture publique (le catalogue)
 *   POST, PUT, PATCH, DELETE /api/products     écriture : session obligatoire (401), rôle admin (403)
 *   POST   /api/auth/login   { username, password } -> pose le cookie de session httpOnly
 *   GET    /api/auth/me      -> { username, roles } si la session existe, sinon 401
 *   POST   /api/auth/logout  -> supprime la session et efface le cookie
 *
 * COMPTES FACTICES, POUR LA DÉMO UNIQUEMENT : alice / alice (customer) et admin / admin (admin).
 * Ils vivent dans ce fichier, pas dans db.json : aucune route ne les expose.
 */
const path = require('path');
const crypto = require('crypto');
const jsonServer = require('json-server');

const PORT = Number(process.env.PORT ?? 3000);
const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));

// faux comptes, mots de passe en clair : à ne jamais faire en vrai (on stocke un hash)
const DEMO_USERS = {
  alice: { password: 'alice', roles: ['customer'] },
  admin: { password: 'admin', roles: ['admin'] },
};

// les sessions, en mémoire : sid -> { username, roles }. Redémarrer l'API les efface toutes.
const sessions = new Map();

// Express 4 ne lit pas l'en-tête Cookie tout seul : un petit parseur suffit
function readCookies(req) {
  return Object.fromEntries(
    (req.headers.cookie ?? '')
      .split(';')
      .filter(Boolean)
      .map((c) => {
        const [name, ...value] = c.trim().split('=');
        return [name, decodeURIComponent(value.join('='))];
      }),
  );
}

server.use(jsonServer.defaults({ logger: true }));
server.use(jsonServer.bodyParser);

// avant toute route : retrouver la session à partir du cookie sid
server.use((req, _res, next) => {
  req.session = sessions.get(readCookies(req).sid) ?? null;
  next();
});

server.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body ?? {};
  const user = DEMO_USERS[username];
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Identifiants invalides' });
  }
  const sid = crypto.randomBytes(24).toString('hex');
  sessions.set(sid, { username, roles: user.roles });
  // httpOnly : illisible en JavaScript ; sameSite strict : jamais envoyé depuis un autre site.
  // En production, ajoutez secure: true (cookie envoyé en HTTPS seulement).
  res.cookie('sid', sid, { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 30 * 60 * 1000 });
  // le corps ne contient AUCUN jeton : seulement qui est connecté
  res.json({ username, roles: user.roles });
});

server.get('/api/auth/me', (req, res) => {
  if (!req.session) return res.status(401).json({ error: 'Non authentifié' });
  res.json(req.session);
});

server.post('/api/auth/logout', (req, res) => {
  sessions.delete(readCookies(req).sid);
  res.clearCookie('sid', { path: '/' });
  res.status(204).end();
});

// le serveur décide : lecture publique, écriture réservée au rôle admin
server.use('/api', (req, res, next) => {
  if (req.method === 'GET') return next();
  if (!req.session) return res.status(401).json({ error: 'Non authentifié' });
  if (!req.session.roles.includes('admin')) {
    return res.status(403).json({ error: 'Réservé au rôle admin' });
  }
  next();
});
server.use('/api', router);

server.listen(PORT, () => console.log(`API MiniShop sur http://localhost:${PORT}`));
