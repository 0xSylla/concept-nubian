/*
 * Page « Tous les produits » : filtres, tri, pagination, état synchronisé avec l'URL.
 * Paramètres d'URL (combinables, valeurs multiples séparées par des virgules) :
 *   type, concern, tone, availability (in,out), promo=1, price_min, price_max, sort, page
 */
(function () {
  'use strict';

  const PRODUCTS = window.BN_PRODUCTS || [];
  const FILTERS = window.BN_FILTERS || {};
  const PAGE_SIZE = 12;
  const MULTI_KEYS = ['type', 'concern', 'tone', 'availability'];
  const AVAILABILITY = { in: 'En stock', out: 'Épuisé' };
  const SORTS = {
    'featured': ['En vedette', (a, b) => a.featured - b.featured],
    'best-selling': ['Meilleures ventes', (a, b) => a.bestseller - b.bestseller],
    'title-asc': ['Alphabétique, de A à Z', (a, b) => a.name.localeCompare(b.name, 'fr')],
    'title-desc': ['Alphabétique, de Z à A', (a, b) => b.name.localeCompare(a.name, 'fr')],
    'price-asc': ['Prix : faible à élevé', (a, b) => a.price - b.price],
    'price-desc': ['Prix : élevé à faible', (a, b) => b.price - a.price],
    'oldest': ['Date : de la plus ancienne à la plus récente', (a, b) => a.addedAt.localeCompare(b.addedAt)],
    'newest': ['Date : de la plus récente à la plus ancienne', (a, b) => b.addedAt.localeCompare(a.addedAt)]
  };

  const $ = id => document.getElementById(id);
  const els = {
    grid: $('product-grid'),
    count: $('collection-count'),
    sort: $('sort-select'),
    form: $('filters-form'),
    active: $('active-filters'),
    pagination: $('pagination'),
    empty: $('empty-state'),
    panel: $('filters-panel'),
    backdrop: $('filters-backdrop'),
    openBtn: $('filters-open'),
    closeBtn: $('filters-close'),
    applyBtn: $('filters-apply'),
    clearBtn: $('filters-clear'),
    emptyReset: $('empty-reset'),
    title: $('collection-title')
  };
  if (!els.grid || !els.form) return;

  const money = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
  const escapeHtml = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isOnSale = p => p.compareAt != null && p.compareAt > p.price;

  // ---------- État ----------
  const state = {
    type: new Set(), concern: new Set(), tone: new Set(), availability: new Set(),
    promo: false, favorites: false, min: null, max: null, sort: 'featured', page: 1
  };

  function readUrl() {
    const params = new URLSearchParams(location.search);
    MULTI_KEYS.forEach(key => {
      const valid = key === 'availability' ? AVAILABILITY : FILTERS[key].options;
      state[key] = new Set((params.get(key) || '').split(',').filter(v => v in valid));
    });
    state.promo = params.get('promo') === '1';
    state.favorites = params.get('favoris') === '1';
    const num = v => (v === null || v === '' || isNaN(+v) ? null : Math.max(0, +v));
    state.min = num(params.get('price_min'));
    state.max = num(params.get('price_max'));
    state.sort = params.get('sort') in SORTS ? params.get('sort') : 'featured';
    state.page = Math.max(1, parseInt(params.get('page'), 10) || 1);
  }

  function writeUrl() {
    const params = new URLSearchParams();
    MULTI_KEYS.forEach(key => { if (state[key].size) params.set(key, [...state[key]].join(',')); });
    if (state.promo) params.set('promo', '1');
    if (state.favorites) params.set('favoris', '1');
    if (state.min !== null) params.set('price_min', state.min);
    if (state.max !== null) params.set('price_max', state.max);
    if (state.sort !== 'featured') params.set('sort', state.sort);
    if (state.page > 1) params.set('page', state.page);
    const qs = params.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
  }

  // ---------- Filtrage ----------
  // `skip` permet de calculer les compteurs d'un groupe en ignorant sa propre sélection (comme Shopify)
  const wishlist = () => {
    try { return new Set(JSON.parse(localStorage.getItem('bn-wishlist') || '[]')); } catch (e) { return new Set(); }
  };

  function matches(p, skip) {
    if (state.favorites && !wishlist().has(p.id)) return false;
    if (skip !== 'type' && state.type.size && !state.type.has(p.type)) return false;
    if (skip !== 'concern' && state.concern.size && !p.concerns.some(c => state.concern.has(c))) return false;
    if (skip !== 'tone' && state.tone.size && !p.tones.some(t => state.tone.has(t))) return false;
    if (skip !== 'availability' && state.availability.size && !state.availability.has(p.available ? 'in' : 'out')) return false;
    if (skip !== 'promo' && state.promo && !isOnSale(p)) return false;
    if (skip !== 'price') {
      if (state.min !== null && p.price < state.min) return false;
      if (state.max !== null && p.price > state.max) return false;
    }
    return true;
  }

  const valuesOf = (p, key) => ({
    type: [p.type], concern: p.concerns, tone: p.tones, availability: [p.available ? 'in' : 'out']
  }[key]);

  function countFor(key, value) {
    return PRODUCTS.filter(p => matches(p, key) && valuesOf(p, key).includes(value)).length;
  }

  // ---------- Rendu des filtres (une seule fois, puis mise à jour des compteurs) ----------
  const groupHtml = (key, label, options, open) => `
    <details class="group border-b border-stone-200 py-4"${open ? ' open' : ''}>
      <summary class="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden text-sm font-semibold text-stone-900">
        ${label}
        <svg aria-hidden="true" class="w-4 h-4 text-stone-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round"></path></svg>
      </summary>
      <fieldset class="mt-3 space-y-1">
        <legend class="sr-only">${label}</legend>
        ${Object.entries(options).map(([value, text]) => `
        <label class="flex items-center gap-3 py-1.5 text-sm text-stone-700 cursor-pointer has-[:disabled]:opacity-40 has-[:disabled]:cursor-not-allowed" data-option="${key}:${value}">
          <input class="w-4 h-4 rounded border-stone-400 text-stone-900 focus:ring-stone-900" name="${key}" type="checkbox" value="${value}">
          <span class="flex-1">${text}</span>
          <span class="text-xs text-stone-500" data-count></span>
        </label>`).join('')}
      </fieldset>
    </details>`;

  function renderFilters() {
    const prices = PRODUCTS.map(p => p.price);
    const floor = Math.floor(Math.min(...prices));
    const ceil = Math.ceil(Math.max(...prices));
    els.form.innerHTML =
      groupHtml('availability', 'Disponibilité', AVAILABILITY, true) +
      `<details class="group border-b border-stone-200 py-4" open>
        <summary class="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden text-sm font-semibold text-stone-900">
          Prix
          <svg aria-hidden="true" class="w-4 h-4 text-stone-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round"></path></svg>
        </summary>
        <p class="mt-3 text-xs text-stone-500">Le prix le plus élevé est de ${money.format(ceil)}</p>
        <div class="mt-3 flex items-center gap-3">
          <label class="flex-1 flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 focus-within:border-stone-900">
            <span class="text-sm text-stone-500">€</span>
            <span class="sr-only">Prix minimum</span>
            <input class="w-full border-0 bg-transparent p-0 py-2 text-sm focus:ring-0" inputmode="decimal" min="0" name="price_min" placeholder="${floor}" type="number">
          </label>
          <span class="text-stone-400" aria-hidden="true">–</span>
          <label class="flex-1 flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 focus-within:border-stone-900">
            <span class="text-sm text-stone-500">€</span>
            <span class="sr-only">Prix maximum</span>
            <input class="w-full border-0 bg-transparent p-0 py-2 text-sm focus:ring-0" inputmode="decimal" min="0" name="price_max" placeholder="${ceil}" type="number">
          </label>
        </div>
        <label class="mt-4 flex items-center gap-3 py-1.5 text-sm text-stone-700 cursor-pointer has-[:disabled]:opacity-40" data-option="promo:1">
          <input class="w-4 h-4 rounded border-stone-400 text-stone-900 focus:ring-stone-900" name="promo" type="checkbox" value="1">
          <span class="flex-1">En promotion</span>
          <span class="text-xs text-stone-500" data-count></span>
        </label>
      </details>` +
      ['type', 'concern', 'tone'].map(key => groupHtml(key, FILTERS[key].label, FILTERS[key].options, true)).join('');
  }

  function syncFormFromState() {
    els.form.querySelectorAll('input[type="checkbox"]').forEach(input => {
      input.checked = input.name === 'promo' ? state.promo : state[input.name].has(input.value);
    });
    els.form.elements.price_min.value = state.min ?? '';
    els.form.elements.price_max.value = state.max ?? '';
    els.sort.value = state.sort;
  }

  function updateCounts() {
    els.form.querySelectorAll('[data-option]').forEach(label => {
      const [key, value] = label.dataset.option.split(':');
      const n = key === 'promo'
        ? PRODUCTS.filter(p => matches(p, 'promo') && isOnSale(p)).length
        : countFor(key, value);
      const input = label.querySelector('input');
      label.querySelector('[data-count]').textContent = `(${n})`;
      input.disabled = n === 0 && !input.checked;
    });
  }

  // ---------- Filtres actifs (pastilles) ----------
  function activeChips() {
    const chips = [];
    MULTI_KEYS.forEach(key => state[key].forEach(value => {
      const label = key === 'availability' ? AVAILABILITY[value] : FILTERS[key].options[value];
      chips.push({ label, remove: () => state[key].delete(value) });
    }));
    if (state.favorites) chips.push({ label: 'Mes favoris', remove: () => { state.favorites = false; } });
    if (state.promo) chips.push({ label: 'En promotion', remove: () => { state.promo = false; } });
    if (state.min !== null || state.max !== null) {
      const label = `${money.format(state.min ?? 0)} – ${state.max !== null ? money.format(state.max) : '∞'}`;
      chips.push({ label, remove: () => { state.min = null; state.max = null; } });
    }
    return chips;
  }

  function renderActive(chips) {
    els.active.innerHTML = '';
    els.active.classList.toggle('hidden', chips.length === 0);
    chips.forEach(chip => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-3.5 py-1.5 text-xs text-stone-800 hover:border-stone-900 transition';
      btn.setAttribute('aria-label', `Retirer le filtre ${chip.label}`);
      btn.innerHTML = `${escapeHtml(chip.label)}<svg aria-hidden="true" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
      btn.addEventListener('click', () => { chip.remove(); state.page = 1; update(); });
      els.active.appendChild(btn);
    });
    if (chips.length) {
      const clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'text-xs font-medium text-stone-700 underline underline-offset-4 hover:text-black';
      clear.textContent = 'Tout effacer';
      clear.addEventListener('click', clearAll);
      els.active.appendChild(clear);
    }
  }

  // ---------- Grille produits ----------
  const QUICK_BTN = 'w-9 h-9 rounded-full bg-white text-stone-800 flex items-center justify-center shadow-md hover:bg-black hover:text-white transition';
  const ICON_HEART = '<svg aria-hidden="true" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
  const ICON_EYE = '<svg aria-hidden="true" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" stroke-linecap="round" stroke-linejoin="round"></path><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
  function cardHtml(p, index) {
    const sale = isOnSale(p);
    const badges = [];
    if (!p.available) badges.push('<span class="rounded-full bg-stone-200 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-stone-700">Épuisé</span>');
    else if (sale) badges.push('<span class="rounded-full bg-black px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Promo</span>');
    if (p.badge && p.available) badges.push(`<span class="rounded-full bg-[#EAE8E1] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-stone-900">${escapeHtml(p.badge)}</span>`);

    const price = sale
      ? `<span class="font-semibold text-rose-800">${money.format(p.price)}</span><span class="text-xs text-stone-500 line-through">${money.format(p.compareAt)}</span>`
      : `<span class="font-semibold text-stone-900">${p.priceFrom ? 'À partir de ' : ''}${money.format(p.price)}</span>`;
    const name = escapeHtml(p.name);

    return `
      <li class="group flex flex-col">
        <div class="relative aspect-[4/5] bg-[#FAF9F5] rounded-2xl overflow-hidden card-hover-zoom cursor-pointer" data-quickview-area="${p.id}">
          <img alt="${name}" class="w-full h-full object-cover${p.available ? '' : ' opacity-60'}" decoding="async" height="993" ${index < 6 ? '' : 'loading="lazy" '}src="${p.image}" width="800">
          ${badges.length ? `<div class="absolute top-3 left-3 flex flex-wrap gap-1.5">${badges.join('')}</div>` : ''}
          <div class="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 transition duration-300">
            <button aria-label="Ajouter « ${name} » aux favoris" aria-pressed="false" class="${QUICK_BTN} aria-pressed:text-rose-700" data-wishlist="${p.id}" type="button">${ICON_HEART}</button>
            <button aria-label="Aperçu rapide de « ${name} »" class="${QUICK_BTN}" data-quickview="${p.id}" type="button">${ICON_EYE}</button>
          </div>
        </div>
        <div class="mt-3 flex flex-1 flex-col">
          <h2 class="text-sm font-medium leading-snug text-stone-900"><button class="text-left hover:underline underline-offset-4" data-quickview="${p.id}" type="button">${name}</button></h2>
          <p class="mt-1 flex items-baseline gap-2 text-sm">${sale ? '<span class="sr-only">Prix promotionnel</span>' : ''}${price}</p>
          <div class="mt-1.5 mb-3 min-h-[18px]">${window.BN_stars ? window.BN_stars(p) : ''}</div>
          <button class="mt-auto w-full rounded-full border border-stone-800 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-stone-900 transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:border-stone-300 disabled:text-stone-400 disabled:hover:bg-transparent" data-add-to-cart data-product="${name}" type="button"${p.available ? '' : ' disabled'}>
            ${p.available ? 'Ajouter au panier' : 'Épuisé'}
          </button>
        </div>
      </li>`;
  }

  function renderPagination(totalPages) {
    els.pagination.innerHTML = '';
    els.pagination.classList.toggle('hidden', totalPages <= 1);
    if (totalPages <= 1) return;

    const add = (label, page, { current = false, disabled = false, aria } = {}) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.innerHTML = label;
      btn.disabled = disabled;
      if (aria) btn.setAttribute('aria-label', aria);
      if (current) btn.setAttribute('aria-current', 'page');
      btn.className = 'min-w-10 h-10 px-3 rounded-full text-sm transition ' +
        (current ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-200 disabled:opacity-30 disabled:hover:bg-transparent');
      btn.addEventListener('click', () => {
        state.page = page;
        update();
        els.grid.closest('section').scrollIntoView({ behavior: 'smooth' });
      });
      els.pagination.appendChild(btn);
    };
    const chevron = d => `<svg aria-hidden="true" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="${d}" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;

    add(chevron('M15 19l-7-7 7-7'), state.page - 1, { disabled: state.page === 1, aria: 'Page précédente' });
    for (let i = 1; i <= totalPages; i++) add(String(i), i, { current: i === state.page, aria: `Page ${i}` });
    add(chevron('M9 5l7 7-7 7'), state.page + 1, { disabled: state.page === totalPages, aria: 'Page suivante' });
  }

  // ---------- Cycle de mise à jour ----------
  function update() {
    const results = PRODUCTS.filter(p => matches(p)).sort(SORTS[state.sort][1]);
    const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
    state.page = Math.min(state.page, totalPages);
    const pageItems = results.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);

    els.grid.innerHTML = pageItems.map(cardHtml).join('');
    els.empty.classList.toggle('hidden', results.length > 0);
    els.count.textContent = `${results.length} produit${results.length > 1 ? 's' : ''}`;
    if (els.applyBtn) els.applyBtn.textContent = `Voir les ${results.length} produit${results.length > 1 ? 's' : ''}`;

    // Titre contextuel quand un seul filtre de type ou de préoccupation est actif
    if (els.title) {
      const only = state.type.size === 1 && !state.concern.size ? FILTERS.type.options[[...state.type][0]]
        : state.concern.size === 1 && !state.type.size ? FILTERS.concern.options[[...state.concern][0]]
        : null;
      els.title.textContent = state.favorites ? 'Mes favoris' : (only || 'Tous les produits');
    }

    syncFormFromState();
    updateCounts();
    renderActive(activeChips());
    renderPagination(totalPages);
    writeUrl();
    document.dispatchEvent(new CustomEvent('bn:rendered'));
  }

  function clearAll() {
    MULTI_KEYS.forEach(key => state[key].clear());
    state.promo = false;
    state.favorites = false;
    state.min = null;
    state.max = null;
    state.page = 1;
    update();
  }

  // ---------- Événements ----------
  function initEvents() {
    els.sort.innerHTML = Object.entries(SORTS).map(([v, [label]]) => `<option value="${v}">${label}</option>`).join('');
    els.sort.addEventListener('change', () => { state.sort = els.sort.value; state.page = 1; update(); });

    els.form.addEventListener('change', e => {
      const input = e.target;
      if (input.type === 'checkbox') {
        if (input.name === 'promo') state.promo = input.checked;
        else state[input.name][input.checked ? 'add' : 'delete'](input.value);
      } else if (input.name === 'price_min' || input.name === 'price_max') {
        const v = input.value === '' ? null : Math.max(0, +input.value);
        state[input.name === 'price_min' ? 'min' : 'max'] = v;
      }
      state.page = 1;
      update();
    });
    // Saisie de prix : applique après une courte pause, sans attendre la perte de focus
    let priceTimer;
    els.form.addEventListener('input', e => {
      if (e.target.type !== 'number') return;
      clearTimeout(priceTimer);
      priceTimer = setTimeout(() => e.target.dispatchEvent(new Event('change', { bubbles: true })), 600);
    });
    els.form.addEventListener('submit', e => e.preventDefault());
    if (els.emptyReset) els.emptyReset.addEventListener('click', clearAll);
    if (els.clearBtn) els.clearBtn.addEventListener('click', clearAll);

    // Tiroir de filtres (mobile / tablette)
    const setDrawer = open => {
      els.panel.classList.toggle('-translate-x-full', !open);
      els.backdrop.classList.toggle('hidden', !open);
      document.body.classList.toggle('overflow-hidden', open);
      els.openBtn.setAttribute('aria-expanded', String(open));
      if (open) els.closeBtn.focus();
      else els.openBtn.focus();
    };
    els.openBtn.addEventListener('click', () => setDrawer(true));
    els.closeBtn.addEventListener('click', () => setDrawer(false));
    els.applyBtn.addEventListener('click', () => setDrawer(false));
    els.backdrop.addEventListener('click', () => setDrawer(false));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && els.openBtn.getAttribute('aria-expanded') === 'true') setDrawer(false);
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', e => {
      if (e.matches && els.openBtn.getAttribute('aria-expanded') === 'true') {
        els.backdrop.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
        els.openBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  document.addEventListener('bn:wishlist-change', () => { if (state.favorites) update(); });

  readUrl();
  renderFilters();
  initEvents();
  update();
})();
