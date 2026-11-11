/*
 * Génère produits.html à partir de code.html (head, header, méga-menu, footer)
 * et de src/produits-main.html (contenu propre à la collection).
 * À relancer après toute modification du header ou du footer : npm run build:pages
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const home = fs.readFileSync(path.join(root, 'code.html'), 'utf8');
const main = fs.readFileSync(path.join(root, 'src', 'produits-main.html'), 'utf8');

function between(startMarker, endMarker) {
  const start = home.indexOf(startMarker);
  const end = home.indexOf(endMarker, start);
  if (start === -1 || end === -1) throw new Error(`Repère introuvable : ${startMarker} / ${endMarker}`);
  return home.slice(start, end + endMarker.length);
}

// Les ancres internes de l'accueil (#sale, #faq…) doivent pointer vers code.html depuis une autre page
const toHome = html => html
  .replace(/href="#"/g, 'href="code.html"')
  .replace(/href="#(?!main")([^"]+)"/g, 'href="code.html#$1"');

let head = between('<head>', '</head>');
head = head
  .replace(/<title>[^<]*<\/title>/, '<title>Tous les produits | Belle Nubian Paris</title>')
  .replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="Toute la collection Belle Nubian Paris : sérums, crèmes, nettoyants, protection solaire et coffrets. Filtrez par carnation, préoccupation et type de produit.">')
  .replace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="Tous les produits | Belle Nubian Paris">')
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/, '');

const bodyOpen = home.match(/<body[^>]*>\n<a [^>]*href="#main">[^<]*<\/a>/)[0];
const header = toHome(between('<!-- BEGIN: MainHeader -->', '<!-- END: MainHeader -->'));
const footer = toHome(between('<!-- BEGIN: MainFooter -->', '<!-- END: MainFooter -->'));

const page = `<!DOCTYPE html><html class="scroll-smooth" lang="fr">${head}
${bodyOpen}
${header}
<!-- Généré par scripts/build-pages.cjs : modifier src/produits-main.html, pas ce fichier -->
${main}
${footer}
<script src="assets/products.js"></script>
<script src="assets/collection.js"></script>
<script src="assets/quickview.js"></script>
<script src="assets/main.js"></script>
<script src="assets/tournage.js"></script>
</body></html>
`;

fs.writeFileSync(path.join(root, 'produits.html'), page);
console.log('produits.html généré');
