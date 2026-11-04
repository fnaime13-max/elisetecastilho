#!/usr/bin/env bash
# Publica o site no GitHub Pages com o domínio https://elisetecastilho.felixdias.com/
set -e
cd "$(dirname "$0")"
TOKEN=$(printf 'protocol=https\nhost=github.com\n\n' | git credential fill | sed -n 's/^password=//p')
API=https://api.github.com
H=(-H "Authorization: token $TOKEN" -H "Accept: application/vnd.github+json")
curl -s "${H[@]}" $API/user/repos -d '{"name":"elisetecastilho","description":"Site Elisete Castilho - Nutricionista e Esteticista"}' > /dev/null
git remote add origin https://github.com/fnaime13-max/elisetecastilho.git 2>/dev/null || true
git push -u origin main
curl -s "${H[@]}" $API/repos/fnaime13-max/elisetecastilho/pages -d '{"source":{"branch":"main","path":"/"}}' > /dev/null
curl -s -X PUT "${H[@]}" $API/repos/fnaime13-max/elisetecastilho/pages -d '{"cname":"elisetecastilho.felixdias.com"}' > /dev/null
echo "Publicado: https://elisetecastilho.felixdias.com/ (leva 1-2 min para aparecer)"
