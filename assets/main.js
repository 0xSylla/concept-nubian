(function () {
  'use strict';

  const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SCROLL_BEHAVIOR = REDUCE_MOTION ? 'auto' : 'smooth';

  // ---------- Menu mobile ----------
  function initMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const menu = document.getElementById('mobile-menu');
    if (!toggle || !menu) return;

    function setOpen(open) {
      menu.classList.toggle('hidden', !open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      toggle.querySelector('[data-icon="open"]').classList.toggle('hidden', open);
      toggle.querySelector('[data-icon="close"]').classList.toggle('hidden', !open);
    }

    toggle.addEventListener('click', () => setOpen(menu.classList.contains('hidden')));
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !menu.classList.contains('hidden')) {
        setOpen(false);
        toggle.focus();
      }
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', e => {
      if (e.matches) setOpen(false);
    });
  }

  // ---------- Stockage local (protégé : navigation privée, stockage bloqué) ----------
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* stockage indisponible */ }
    }
  };

  // ---------- Message de confirmation (toast) ----------
  let toast = null;
  let toastTimer = null;
  function notify(message) {
    if (!toast) {
      toast = document.createElement('div');
      toast.setAttribute('role', 'status');
      toast.className = 'fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 translate-y-2 opacity-0 rounded-full bg-stone-900 px-5 py-3 text-sm text-white shadow-lg transition duration-300 pointer-events-none max-w-[calc(100%-2rem)] text-center';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    requestAnimationFrame(() => toast.classList.remove('opacity-0', 'translate-y-2'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add('opacity-0', 'translate-y-2'), 2600);
  }

  // ---------- Étoiles de notation des cartes statiques (accueil) ----------
  function initStars() {
    if (!window.BN_stars || !window.BN_PRODUCTS) return;
    const byId = Object.fromEntries(window.BN_PRODUCTS.map(p => [p.id, p]));
    document.querySelectorAll('[data-stars]').forEach(el => {
      el.innerHTML = window.BN_stars(byId[el.dataset.stars]);
    });
  }

  // ---------- Panier (compteur local, en attendant un vrai panier Shopify) ----------
  const CART_KEY = 'bn-cart-count';

  function initCart() {
    let count = Number(store.get(CART_KEY, 0)) || 0;

    function render() {
      document.querySelectorAll('[data-cart-count]').forEach(el => {
        el.textContent = count;
        el.classList.toggle('hidden', count === 0);
      });
      document.querySelectorAll('[data-cart-button]').forEach(btn => {
        btn.setAttribute('aria-label', count ? `Panier, ${count} article${count > 1 ? 's' : ''}` : 'Panier vide');
      });
    }

    // Délégation : couvre aussi les cartes générées dynamiquement et la fiche produit
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-add-to-cart]');
      if (!btn || btn.disabled) return;
      e.preventDefault();
      const qty = Math.max(1, parseInt(btn.dataset.qty, 10) || 1);
      count += qty;
      store.set(CART_KEY, count);
      render();
      const name = btn.dataset.product;
      const what = name ? `« ${name} »` : 'Produit';
      notify(qty > 1 ? `${qty} × ${what} ajoutés au panier` : `${what} ajouté au panier`);
    });

    render();
  }

  // ---------- Favoris (liste locale d'identifiants produits) ----------
  const WISHLIST_KEY = 'bn-wishlist';

  function initWishlist() {
    let ids = new Set(store.get(WISHLIST_KEY, []));

    function refresh() {
      document.querySelectorAll('[data-wishlist]').forEach(btn => {
        const on = ids.has(btn.dataset.wishlist);
        btn.setAttribute('aria-pressed', String(on));
        const svg = btn.querySelector('svg');
        if (svg) svg.setAttribute('fill', on ? 'currentColor' : 'none');
      });
      document.querySelectorAll('[data-wishlist-dot]').forEach(dot => dot.classList.toggle('hidden', ids.size === 0));
      document.querySelectorAll('[data-wishlist-link]').forEach(link => {
        link.setAttribute('aria-label', ids.size ? `Favoris, ${ids.size} produit${ids.size > 1 ? 's' : ''}` : 'Favoris');
      });
    }

    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-wishlist]');
      if (!btn) return;
      e.preventDefault();
      const id = btn.dataset.wishlist;
      const name = (window.BN_PRODUCTS || []).find(p => p.id === id)?.name;
      if (ids.has(id)) {
        ids.delete(id);
        notify(name ? `« ${name} » retiré des favoris` : 'Retiré des favoris');
      } else {
        ids.add(id);
        notify(name ? `« ${name} » ajouté aux favoris` : 'Ajouté aux favoris');
      }
      store.set(WISHLIST_KEY, [...ids]);
      refresh();
      document.dispatchEvent(new CustomEvent('bn:wishlist-change'));
    });

    // La page collection régénère ses cartes : on réapplique l'état des cœurs
    document.addEventListener('bn:rendered', refresh);

    window.BNWishlist = { refresh, has: id => ids.has(id), list: () => [...ids] };
    refresh();
  }

  // ---------- Méga-menu « Nos Produits » (desktop) ----------
  const MEGA_CLOSE_DELAY = 150; // laisse le temps de glisser du bouton au panneau

  function initMegaMenu() {
    const trigger = document.getElementById('mega-menu-trigger');
    const panel = document.getElementById('mega-menu');
    const backdrop = document.getElementById('mega-menu-backdrop');
    if (!trigger || !panel || !backdrop) return;

    let closeTimer = null;
    let openedAt = 0;
    const isOpen = () => trigger.getAttribute('aria-expanded') === 'true';

    function setOpen(open) {
      clearTimeout(closeTimer);
      if (open && !isOpen()) openedAt = Date.now();
      trigger.setAttribute('aria-expanded', String(open));
      [panel, backdrop].forEach(el => el.classList.toggle('invisible', !open));
      [panel, backdrop].forEach(el => el.classList.toggle('opacity-0', !open));
      panel.classList.toggle('-translate-y-1', !open);
    }
    const scheduleClose = () => {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => setOpen(false), MEGA_CLOSE_DELAY);
    };

    [trigger, panel].forEach(el => {
      el.addEventListener('mouseenter', () => setOpen(true));
      el.addEventListener('mouseleave', scheduleClose);
    });
    // Clic (tactile, clavier) : bascule. Un clic qui suit de près l'ouverture au survol la conserve.
    trigger.addEventListener('click', () => {
      if (isOpen() && Date.now() - openedAt < 500) return;
      setOpen(!isOpen());
    });
    backdrop.addEventListener('click', () => setOpen(false));
    panel.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen()) {
        setOpen(false);
        trigger.focus();
      }
    });
    // Ordre de tabulation : le panneau est en fin de header dans le DOM,
    // on l'insère donc juste après le bouton, puis on revient au lien suivant du menu.
    const panelLinks = [...panel.querySelectorAll('a')];
    const nextNavItem = trigger.nextElementSibling;
    trigger.addEventListener('keydown', e => {
      if (e.key === 'Tab' && !e.shiftKey && isOpen()) {
        e.preventDefault();
        panelLinks[0].focus();
      }
    });
    panelLinks[0].addEventListener('keydown', e => {
      if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        trigger.focus();
      }
    });
    panelLinks[panelLinks.length - 1].addEventListener('keydown', e => {
      if (e.key === 'Tab' && !e.shiftKey && nextNavItem) {
        e.preventDefault();
        setOpen(false);
        nextNavItem.focus();
      }
    });

    // Fermeture quand le focus clavier quitte le bouton et le panneau
    [trigger, panel].forEach(el => el.addEventListener('focusout', e => {
      if (!trigger.contains(e.relatedTarget) && !panel.contains(e.relatedTarget)) setOpen(false);
    }));
  }

  // ---------- Bannières doubles (hero + cartes) ----------
  const BANNER_PAIRS = [
    [
      { img: 'images/banner-creme-solaire.webp', alt: 'Nouvelle Crème Solaire Fluide Invisible SPF 50+' },
      { img: 'images/banner-carte-cadeau.webp', alt: 'Belle Nubian Carte-Cadeau Nouveauté' }
    ],
    [
      { img: 'images/banner-revelez-eclat.webp', alt: "Révélez l'éclat naturel de votre peau - Nouveaux Produits" },
      { img: 'images/banner-nouveau-look.webp', alt: 'Nouveau Look, Même Formule de Confiance - Belle Nubian' }
    ]
  ];
  const BANNER_INTERVAL = 5000;

  function initDualBanners() {
    const cards = [document.getElementById('dual-card-1'), document.getElementById('dual-card-2')];
    const imgs = [document.getElementById('dual-c1-img'), document.getElementById('dual-c2-img')];
    if (cards.includes(null) || imgs.includes(null)) return;

    // Précharge les visuels suivants pour éviter un flash au changement
    BANNER_PAIRS.flat().forEach(slide => { new Image().src = slide.img; });

    let index = 0;
    let animating = false;
    let timer = null;

    function show(nextIndex) {
      if (animating) return;
      animating = true;
      index = (nextIndex + BANNER_PAIRS.length) % BANNER_PAIRS.length;

      cards.forEach(card => {
        card.style.opacity = '0.35';
        card.style.transform = 'translateY(6px) scale(0.99)';
      });

      setTimeout(() => {
        BANNER_PAIRS[index].forEach((slide, i) => {
          imgs[i].src = slide.img;
          imgs[i].alt = slide.alt;
        });
        cards.forEach(card => {
          card.style.opacity = '1';
          card.style.transform = '';
        });
        setTimeout(() => { animating = false; }, 300);
      }, 220);
    }

    // Défilement automatique permanent ; seul un onglet masqué le suspend.
    // Un clic sur une flèche relance le minuteur pour laisser le temps de lire.
    function schedule() {
      clearInterval(timer);
      timer = null;
      if (document.hidden) return;
      timer = setInterval(() => show(index + 1), BANNER_INTERVAL);
    }

    document.querySelectorAll('[data-dual-nav]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        show(index + (btn.dataset.dualNav === 'next' ? 1 : -1));
        schedule();
      });
    });

    document.addEventListener('visibilitychange', schedule);

    schedule();
  }

  // ---------- Avis clients (fondu enchaîné) ----------
  const REVIEW_INTERVAL = 6000;

  function initReviewsCarousel() {
    const slides = [...document.querySelectorAll('#reviews-carousel [data-review]')];
    if (slides.length < 2) return;

    let index = 0;
    let timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const active = i === index;
        slide.classList.toggle('opacity-0', !active);
        slide.classList.toggle('delay-300', active); // apparaît après la disparition de l'ancien
        slide.classList.toggle('pointer-events-none', !active);
        slide.setAttribute('aria-hidden', String(!active));
        slide.inert = !active;
      });
    }

    function schedule() {
      clearInterval(timer);
      timer = null;
      if (document.hidden) return;
      timer = setInterval(() => show(index + 1), REVIEW_INTERVAL);
    }

    document.querySelectorAll('[data-review-nav]').forEach(btn => {
      btn.addEventListener('click', () => {
        show(index + (btn.dataset.reviewNav === 'next' ? 1 : -1));
        schedule();
      });
    });
    document.addEventListener('visibilitychange', schedule);

    show(0);
    schedule();
  }

  // ---------- Soins par carnation ----------
  const SKIN_TONES_DATA = {
    'half-cast': {
      title: 'Half Cast • Métisse',
      subtitle: 'Clarifiant Ultime',
      image: 'images/img-09.webp',
      description: 'Formule clarifiante extra white enrichie en glutathion et arbutine pour un teint métisse éclatant, sans tâches.'
    },
    'light-skin': {
      title: 'Light Skin • Clair',
      subtitle: 'Teint de Porcelaine',
      image: 'images/img-10.webp',
      description: 'Dédiée aux carnations claires pour unifier, lisser le grain de peau et prévenir toute hyperpigmentation diffuse.'
    },
    'diamond': {
      title: 'Diamond • Diamant',
      subtitle: 'Pure Luminosité',
      image: 'images/img-11.webp',
      description: 'Illumination diamant pour les teints dorés et chauds, favorisant un éclat soyeux et une texture veloutée.'
    },
    'caramel': {
      title: 'Caramel • Caramel',
      subtitle: 'Teint Ambré & Doré',
      image: 'images/img-12.webp',
      description: 'Harmonise les sous-tons ambrés et nourrit en profondeur pour un fini satiné, radieux et ultra-lumineux.'
    },
    'dark': {
      title: 'Dark • Foncé',
      subtitle: 'Ébène Intense',
      image: 'images/img-32.webp',
      description: 'Sublime les peaux foncées et ébènes, élimine les zones d’ombres et ravive l’éclat naturel du teint.'
    }
  };

  let isAnimatingTransition = false;
  let lastToneCard = null;

  function scrollToToneSection() {
    const section = document.getElementById('skin-tones-section');
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: SCROLL_BEHAVIOR });
  }

  function switchTone(toneKey) {
    const tone = SKIN_TONES_DATA[toneKey] || SKIN_TONES_DATA['half-cast'];

    const modelImg = document.getElementById('detail-model-img');
    if (modelImg) {
      modelImg.style.opacity = '0.35';
      modelImg.style.transform = 'scale(0.98)';
      setTimeout(() => {
        modelImg.src = tone.image;
        modelImg.style.opacity = '1';
        modelImg.style.transform = 'scale(1)';
      }, 160);
    }

    const titleEl = document.getElementById('detail-tone-title');
    const subtitleEl = document.getElementById('detail-tone-subtitle');
    const descEl = document.getElementById('detail-tone-desc');
    if (titleEl) titleEl.textContent = tone.title;
    if (subtitleEl) subtitleEl.textContent = tone.subtitle;
    if (descEl) descEl.textContent = tone.description;

    const track = document.getElementById('tone-products-track');
    if (track) track.scrollTo({ left: 0, behavior: SCROLL_BEHAVIOR });
  }

  function openToneDetail(toneKey) {
    if (isAnimatingTransition) return;
    const gridView = document.getElementById('tone-grid-view');
    const detailStage = document.getElementById('tone-detail-stage');
    if (!gridView || !detailStage) return;
    isAnimatingTransition = true;

    const targetCard = document.querySelector(`.tone-card-motion[data-tone-id="${toneKey}"]`);
    lastToneCard = targetCard;
    switchTone(toneKey);

    // Sortie chorégraphiée de la grille
    document.querySelectorAll('.tone-card-motion').forEach(card => {
      card.classList.add(card === targetCard ? 'card-hero-expand' : 'card-dismissed');
    });

    setTimeout(() => {
      gridView.classList.add('hidden');
      detailStage.classList.remove('hidden', 'stage-visible');
      detailStage.classList.add('stage-hidden');
      void detailStage.offsetWidth; // reflow pour déclencher la transition

      requestAnimationFrame(() => {
        detailStage.classList.remove('stage-hidden');
        detailStage.classList.add('stage-visible');
      });

      scrollToToneSection();
      const title = document.getElementById('detail-tone-title');
      if (title) title.focus({ preventScroll: true });

      setTimeout(() => { isAnimatingTransition = false; }, 650);
    }, 380);
  }

  function closeToneDetail() {
    if (isAnimatingTransition) return;
    const gridView = document.getElementById('tone-grid-view');
    const detailStage = document.getElementById('tone-detail-stage');
    if (!gridView || !detailStage) return;
    isAnimatingTransition = true;

    detailStage.classList.remove('stage-visible');
    detailStage.classList.add('stage-hidden');

    setTimeout(() => {
      detailStage.classList.add('hidden');
      gridView.classList.remove('hidden');
      void gridView.offsetWidth;

      document.querySelectorAll('.tone-card-motion').forEach((card, i) => {
        setTimeout(() => card.classList.remove('card-dismissed', 'card-hero-expand'), i * 35);
      });

      scrollToToneSection();
      if (lastToneCard) lastToneCard.focus({ preventScroll: true });

      setTimeout(() => { isAnimatingTransition = false; }, 550);
    }, 400);
  }

  function initSkinTones() {
    document.querySelectorAll('.tone-card-trigger').forEach(card => {
      const toneId = card.getAttribute('data-tone-id');
      card.addEventListener('click', e => {
        e.preventDefault();
        openToneDetail(toneId);
      });
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openToneDetail(toneId);
        }
      });
    });

    const backBtn = document.getElementById('back-to-tones-btn');
    if (backBtn) backBtn.addEventListener('click', closeToneDetail);  }

  // ---------- Carrousel des soldes (mobile uniquement, grille dès md) ----------
  function initSaleCarousel() {
    const track = document.getElementById('sale-carousel-track');
    const prev = document.getElementById('sale-carousel-prev');
    const next = document.getElementById('sale-carousel-next');
    if (!track || !prev || !next) return;
    const step = () => Math.max(track.clientWidth * 0.8, 240);
    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: SCROLL_BEHAVIOR }));
    next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: SCROLL_BEHAVIOR }));
  }

  initMobileMenu();
  initStars();
  initCart();
  initWishlist();
  initMegaMenu();
  initDualBanners();
  initReviewsCarousel();
  initSkinTones();
  initSaleCarousel();
})();
