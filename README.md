# Belle Nubian — site vitrine

## Pages
- `code.html` : page d'accueil (source du head, du header, du méga-menu et du footer)
- `produits.html` : collection « Tous les produits » — **générée**, ne pas éditer à la main

## Fichiers
- `src/produits-main.html` : contenu propre à la page collection
- `scripts/build-pages.cjs` : assemble `produits.html` (header/footer repris de `code.html`)
- `assets/products.js` : catalogue produits (prix, stocks, type, préoccupations, carnations) — données de démo à remplacer
- `assets/collection.js` : filtres, tri, pagination, URL de la page collection
- `assets/quickview.js` : fiche produit en popup (accueil + collection), ouverte par `data-quickview="<id>"`
- `assets/main.js` : interactions communes (menus, panier, favoris, carrousels, carnations)
- `scripts/generate-packshots.cjs` : génération des packshots produits via AIML API (`AIMLAPI_KEY`)
- `assets/styles.css` : CSS Tailwind compilé (ne pas éditer à la main)
- `src/input.css` + `tailwind.config.js` : sources du CSS
- `code.original.html` : export Stitch d'origine, pour référence

## Build

```bash
npm install
npm run build       # régénère produits.html puis le CSS
npm run watch:css   # recompile le CSS à chaque modification
```

Relancer `npm run build` après toute modification du header/footer dans `code.html`,
de `src/produits-main.html` ou de classes Tailwind.

## Liens vers la collection
La page collection lit ses filtres dans l'URL, ce qui permet des liens pré-filtrés :
`produits.html?type=serums`, `?concern=taches,hyperpigmentation`, `?tone=caramel`,
`?promo=1`, `?favoris=1` (favoris du visiteur), `?availability=in`, `?price_min=10&price_max=50`, `?sort=price-asc`, `?page=2`.
Les clés valides sont définies dans `assets/products.js` (`BN_FILTERS`).
