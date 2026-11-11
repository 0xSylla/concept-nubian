/*
 * Catalogue Belle Nubian — source unique des produits de la page « Tous les produits ».
 *
 * TODO : données de démonstration reprises de la page d'accueil. À remplacer par le vrai
 * catalogue (prix, stocks, préoccupations et carnations associées) ou par l'export Shopify.
 *
 * Champs :
 *   type       : clé de BN_FILTERS.type
 *   concerns   : clés de BN_FILTERS.concern
 *   tones      : clés de BN_FILTERS.tone (vide = non concerné, ex. carte cadeau)
 *   price      : prix en euros ; compareAt : prix barré (null si pas en promo)
 *   priceFrom  : true pour afficher « À partir de »
 *   available  : false = épuisé
 *   badge      : étiquette éditoriale optionnelle (« Nouveau »)
 *   featured   : ordre « En vedette » ; bestseller : ordre « Meilleures ventes »
 *   addedAt    : date d'ajout (tri par date)
 *   description: texte de la fiche produit (TODO : faire valider par la marque)
 *   photo      : photo d'ambiance affichée dans la galerie de la fiche
 *   rating     : note moyenne sur 5 ; reviews : nombre d'avis (absents = pas encore d'avis)
 *                TODO : notes de DÉMONSTRATION — à remplacer par les vrais avis clients
 *                (application d'avis Shopify : Judge.me, Shopify Product Reviews…) avant mise en ligne
 */
window.BN_FILTERS = {
  type: {
    label: 'Type de produit',
    options: {
      'nettoyants': 'Nettoyants & savons',
      'serums': 'Sérums',
      'cremes': 'Crèmes visage',
      'solaire': 'Protection solaire',
      'corps': 'Soins corps',
      'coffrets': 'Coffrets',
      'carte-cadeau': 'Carte cadeau'
    }
  },
  concern: {
    label: 'Préoccupation',
    options: {
      'taches': 'Taches & teint irrégulier',
      'hyperpigmentation': 'Hyperpigmentation',
      'teint-terne': 'Teint terne',
      'peau-seche': 'Peau sèche',
      'pores': 'Pores & imperfections'
    }
  },
  tone: {
    label: 'Carnation',
    options: {
      'half-cast': 'Half Cast · Métisse',
      'light-skin': 'Light Skin · Clair',
      'diamond': 'Diamond · Diamant',
      'caramel': 'Caramel',
      'dark': 'Dark · Foncé'
    }
  }
};

(function () {
  const ALL_TONES = ['half-cast', 'light-skin', 'diamond', 'caramel', 'dark'];

  window.BN_PRODUCTS = [
    {
      id: 'serum-anti-taches', name: 'Sérum Anti-Taches Belle Nubian',
      rating: 4.7, reviews: 1284,
      description: "Une formule concentrée qui cible les taches tenaces et les zones plus sombres, pour un teint visiblement plus uniforme, lumineux et hydraté.",
      photo: 'images/serum-anti-taches.webp',
      image: 'images/packshot-serum-anti-taches.webp',
      type: 'serums', concerns: ['taches', 'hyperpigmentation'], tones: ALL_TONES,
      price: 24.49, compareAt: 79, available: true, featured: 1, bestseller: 1, addedAt: '2026-09-02'
    },
    {
      id: 'creme-solaire-spf50', name: 'Crème Solaire Fluide Invisible SPF 50+',
      description: "Protection très haute SPF 50+ au fluide invisible : texture légère, fini mat et sans sensation grasse. Le geste indispensable pendant toute routine anti-taches.",
      photo: 'images/banner-creme-solaire.webp',
      image: 'images/packshot-creme-solaire.webp',
      // TODO : prix à confirmer
      type: 'solaire', concerns: ['taches'], tones: ALL_TONES,
      price: 29, compareAt: null, available: true, badge: 'Nouveau', featured: 2, bestseller: 6, addedAt: '2026-10-01'
    },
    {
      id: 'creme-miracle-500', name: 'Crème Miracle Extra White – 500 ml',
      rating: 4.6, reviews: 842,
      description: "Un soin corps généreux qui nourrit la peau et aide à unifier le teint au fil des applications. Format 500 ml pour toute la famille.",
      photo: 'images/img-14.webp',
      image: 'images/packshot-img-14.webp',
      type: 'corps', concerns: ['taches', 'teint-terne'], tones: ['half-cast', 'light-skin', 'diamond'],
      price: 399, compareAt: null, available: true, featured: 3, bestseller: 4, addedAt: '2026-03-15'
    },
    {
      id: 'creme-miracle-250', name: 'Crème Miracle Extra White – 250 ml',
      rating: 4.6, reviews: 615,
      description: "Le soin corps qui nourrit la peau et aide à unifier le teint, en format 250 ml, idéal pour découvrir la gamme.",
      photo: 'images/img-15.webp',
      image: 'images/packshot-img-15.webp',
      type: 'corps', concerns: ['taches', 'teint-terne'], tones: ['half-cast', 'light-skin', 'diamond'],
      price: 219, compareAt: null, available: true, featured: 4, bestseller: 3, addedAt: '2026-03-15'
    },
    {
      id: 'savon-noir-maxi', name: 'Savon Noir MAXI',
      rating: 4.8, reviews: 2190,
      description: "Notre savon noir en grand format : il nettoie en douceur, purifie les pores et prépare la peau à recevoir les soins.",
      photo: 'images/img-16.webp',
      image: 'images/packshot-img-16.webp',
      type: 'nettoyants', concerns: ['pores'], tones: ALL_TONES,
      price: 30, compareAt: null, available: true, badge: 'Nouveau', featured: 5, bestseller: 5, addedAt: '2026-09-20'
    },
    {
      id: 'serum-booster-5-days', name: 'Sérum Booster 5 Days Extra Éclat',
      rating: 4.5, reviews: 437,
      description: "Un sérum booster d'éclat pensé pour réveiller les teints ternes. À intégrer matin et soir avant votre crème.",
      photo: 'images/img-17.webp',
      image: 'images/packshot-img-17.webp',
      type: 'serums', concerns: ['teint-terne', 'taches'], tones: ['diamond', 'caramel', 'dark'],
      price: 85, compareAt: null, available: true, featured: 6, bestseller: 2, addedAt: '2026-06-10'
    },
    {
      id: 'creme-jour-contour-yeux', name: 'Crème Jour & Contour des Yeux Oxygénant',
      rating: 4.4, reviews: 208,
      description: "Un duo jour et contour des yeux qui hydrate, défatigue le regard et redonne de l'éclat au teint.",
      photo: 'images/img-19.webp',
      image: 'images/packshot-img-19.webp',
      type: 'cremes', concerns: ['teint-terne', 'peau-seche'], tones: ALL_TONES,
      price: 24.49, compareAt: 79, available: true, featured: 7, bestseller: 8, addedAt: '2026-08-12'
    },
    {
      id: 'serum-vitamine-c', name: 'Sérum Régénérant Botanique & Vitamine C',
      rating: 4.6, reviews: 356,
      description: "Un sérum régénérant aux extraits botaniques et à la vitamine C pour un teint plus frais et lumineux.",
      photo: 'images/img-20.webp',
      image: 'images/packshot-img-20.webp',
      type: 'serums', concerns: ['teint-terne'], tones: ['half-cast', 'light-skin', 'caramel'],
      price: 24.49, compareAt: 79, available: true, featured: 8, bestseller: 7, addedAt: '2026-08-05'
    },
    {
      id: 'coffret-oxygenant', name: 'Coffret Sérum & Crème Oxygénante',
      rating: 4.7, reviews: 129,
      description: "Le coffret sérum et crème oxygénante : une routine complète pour hydrater et raviver l'éclat de la peau.",
      photo: 'images/img-21.webp',
      image: 'images/packshot-img-21.webp',
      type: 'coffrets', concerns: ['teint-terne', 'peau-seche'], tones: ALL_TONES,
      price: 24.49, compareAt: 79, available: true, featured: 9, bestseller: 9, addedAt: '2026-07-22'
    },
    {
      id: 'emulsion-nuit', name: 'Émulsion Nuit Réparatrice Cellulaire',
      rating: 4.3, reviews: 97,
      description: "Une émulsion de nuit qui accompagne le renouvellement de la peau pendant le sommeil. Au réveil, la peau est plus douce et reposée.",
      photo: 'images/img-22.webp',
      image: 'images/packshot-img-22.webp',
      type: 'cremes', concerns: ['peau-seche'], tones: ['caramel', 'dark'],
      price: 24.49, compareAt: 79, available: true, featured: 10, bestseller: 11, addedAt: '2026-05-30'
    },
    {
      id: 'creme-jour-ultra', name: 'Crème de Jour Ultra Réparatrice',
      rating: 4.8, reviews: 5353,
      description: "Nutrition intense et hydratation quotidienne, enrichie en antioxydants pour protéger la peau des agressions extérieures.",
      photo: 'images/img-19.webp',
      image: 'images/packshot-img-19.webp',
      type: 'cremes', concerns: ['peau-seche'], tones: ALL_TONES,
      price: 29.4, compareAt: 49, available: true, featured: 11, bestseller: 10, addedAt: '2026-04-18'
    },
    {
      id: 'savon-charbon', name: 'Savon Noir au Charbon Actif Bio',
      rating: 4.7, reviews: 4820,
      description: "Un savon noir au charbon actif et aux extraits botaniques bio, pour une détoxification en profondeur des pores.",
      photo: 'images/img-16.webp',
      image: 'images/packshot-img-16.webp',
      type: 'nettoyants', concerns: ['pores'], tones: ALL_TONES,
      price: 23.4, compareAt: 39, available: true, featured: 12, bestseller: 12, addedAt: '2026-02-11'
    },
    {
      id: 'creme-barriere', name: 'Crème de Jour Barrière Protectrice',
      rating: 4.5, reviews: 183,
      description: "Une crème de jour qui renforce la barrière cutanée et protège la peau tout au long de la journée.",
      photo: 'images/img-19.webp',
      image: 'images/packshot-img-19.webp',
      type: 'cremes', concerns: ['peau-seche'], tones: ALL_TONES,
      price: 24.49, compareAt: 79, available: true, featured: 13, bestseller: 13, addedAt: '2026-01-25'
    },
    {
      id: 'serum-anti-rides', name: 'Sérum Anti-Rides Repulpant Intense',
      rating: 4.2, reviews: 76,
      description: "Un sérum repulpant qui lisse visiblement les ridules et redonne du rebond à la peau.",
      photo: 'images/img-20.webp',
      image: 'images/packshot-img-20.webp',
      type: 'serums', concerns: ['peau-seche'], tones: ALL_TONES,
      price: 24.49, compareAt: 79, available: false, featured: 14, bestseller: 14, addedAt: '2025-12-02'
    },
    {
      id: 'duo-eclat', name: 'Duo Éclat Regard & Teint Lumineux',
      rating: 4.6, reviews: 64,
      description: "Un duo regard et teint pour illuminer le visage : contour des yeux défatigant et sérum éclat.",
      photo: 'images/img-21.webp',
      image: 'images/packshot-img-21.webp',
      type: 'coffrets', concerns: ['teint-terne'], tones: ['half-cast', 'diamond'],
      price: 24.49, compareAt: 79, available: true, featured: 15, bestseller: 15, addedAt: '2025-11-14'
    },
    {
      id: 'baume-nuit', name: 'Baume Régénérant Nuit Éclat Pur',
      rating: 4.4, reviews: 112,
      description: "Un baume de nuit régénérant à la texture fondante, qui nourrit intensément les peaux sèches.",
      photo: 'images/img-22.webp',
      image: 'images/packshot-img-22.webp',
      type: 'cremes', concerns: ['peau-seche', 'teint-terne'], tones: ['caramel', 'dark'],
      price: 24.49, compareAt: 79, available: true, featured: 16, bestseller: 16, addedAt: '2025-10-30'
    },
    {
      id: 'carte-cadeau', name: 'Carte Cadeau Belle Nubian',
      description: "Offrez le secret d'une beauté éclatante : choisissez le montant (25 €, 50 €, 100 €) et laissez vos proches choisir leurs produits préférés à tout moment.",
      photo: 'images/banner-carte-cadeau.webp',
      image: 'images/packshot-carte-cadeau.webp',
      type: 'carte-cadeau', concerns: [], tones: [],
      price: 25, priceFrom: true, compareAt: null, available: true, badge: 'Nouveau', featured: 17, bestseller: 17, addedAt: '2026-09-28'
    }
  ];
})();

/*
 * Étoiles de notation (HTML), partagées par la collection, la fiche produit et l'accueil.
 * Les étoiles partielles (ex. 4,6) sont obtenues en recouvrant 5 étoiles grises
 * par 5 étoiles dorées rognées à la largeur de la note.
 */
window.BN_stars = function (p, opts) {
  if (!p || !p.rating) return '';
  const o = opts || {};
  const pct = Math.round((p.rating / 5) * 100);
  const note = p.rating.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  // espace fine (U+202F) non dessinée par la police du site : espace insécable classique
  const count = p.reviews.toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0');
  const size = o.large ? 'text-lg' : 'text-[13px]';
  return '<div class="flex items-center gap-1.5' + (o.className ? ' ' + o.className : '') + '" role="img" aria-label="Note : ' + note + ' sur 5, ' + count + ' avis">' +
    '<span aria-hidden="true" class="relative inline-block whitespace-nowrap leading-none ' + size + ' text-stone-300">★★★★★' +
    '<span class="absolute inset-y-0 left-0 overflow-hidden whitespace-nowrap text-amber-600" style="width:' + pct + '%">★★★★★</span></span>' +
    '<span aria-hidden="true" class="' + (o.large ? 'text-sm' : 'text-xs') + ' text-stone-500">' + note + ' (' + count + (o.large ? ' avis' : '') + ')</span>' +
    '</div>';
};
