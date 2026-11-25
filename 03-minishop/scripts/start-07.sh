#!/usr/bin/env bash
# Crée ../shop prêt pour l'étape 07 (tests) : le workspace terminé (solution/),
# sans aucun fichier de test, plus les squelettes de assets/07-tests/.
# Usage : depuis 03-minishop/ → ./scripts/start-07.sh [dossier-cible]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${1:-$ROOT/../shop}"

if [ -e "$TARGET" ]; then
  echo "✋ $TARGET existe déjà : supprimez-le ou passez un autre dossier." >&2
  exit 1
fi

mkdir -p "$TARGET"
TARGET="$(cd "$TARGET" && pwd)"

echo "📦 Copie de solution/ vers $TARGET"
(cd "$ROOT/solution" && tar --exclude=node_modules --exclude=.angular --exclude=dist -cf - .) | tar -xf - -C "$TARGET"

echo "🧹 Suppression des fichiers de test existants"
find "$TARGET" -name '*.spec.ts' -not -path '*/node_modules/*' -delete

echo "🧪 Ajout des squelettes de assets/07-tests/"
cp -R "$ROOT/assets/07-tests/." "$TARGET/"

echo "⬇️  npm install"
(cd "$TARGET" && npm install --no-audit --no-fund)

cat <<MSG

✅ Prêt : cd "$TARGET"
   npx ng test @shop/products --watch=false   # 7 todo
   npx ng test fo --watch=false               # 4 todo
Suivez ensuite ETAPES/07-TESTS.md à partir de la section 2.
MSG
