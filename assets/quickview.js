/*
 * Fiche produit en popup (« aperçu rapide »), partagée par l'accueil et la collection.
 * Ouverture : tout élément [data-quickview="<id>"] ou zone [data-quickview-area="<id>"].
 * Données : window.BN_PRODUCTS / window.BN_FILTERS (assets/products.js).
 */
(function () {
  'use strict';

  const PRODUCTS = window.BN_PRODUCTS || [];
  const FILTERS = window.BN_FILTERS || {};
  const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
  if (!PRODUCTS.length) return;

  const money = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
  const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isOnSale = p => p.compareAt != null && p.compareAt > p.price;

  const ICON_CLOSE = '<svg aria-hidden="true" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
  const ICON_HEART = '<svg aria-hidden="true" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
  const ICON_CHEVRON = '<svg aria-hidden="true" class="w-4 h-4 text-stone-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round"></path></svg>';

  let dialog = null;
  let lastTrigger = null;

  function ensureDialog() {
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'quickview';
    dialog.setAttribute('aria-labelledby', 'qv-title');
    dialog.className = 'm-0 sm:m-auto h-[100dvh] max-h-[100dvh] w-full max-w-none sm:h-auto sm:max-h-[90vh] sm:max-w-5xl sm:rounded-3xl overflow-y-auto hide-scrollbar overscroll-contain bg-[#FAF9F5] p-0 text-stone-900 shadow-2xl backdrop:bg-stone-900/40 backdrop:backdrop-blur-[2px]';
    document.body.appendChild(dialog);

    // Clic sur le fond (hors du contenu) : fermeture
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => {
      document.documentElement.classList.remove('overflow-hidden');
      if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
    });
    return dialog;
  }

  function galleryOf(p) {
    const imgs = [{ src: p.image, contain: false, label: 'Packshot' }];
    if (p.photo && p.photo !== p.image) imgs.push({ src: p.photo, contain: p.photo.includes('banner-'), label: 'Photo d\'ambiance' });
    return imgs;
  }

  function chips(key, values) {
    const opts = FILTERS[key]?.options || {};
    return values.filter(v => opts[v]).map(v =>
      `<a class="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs text-stone-700 hover:border-stone-900 transition" href="produits.html?${key}=${v}">${escapeHtml(opts[v])}</a>`
    ).join('');
  }

  function render(p) {
    const sale = isOnSale(p);
    const gallery = galleryOf(p);
    const typeLabel = FILTERS.type?.options[p.type];
    const badges = [];
    if (!p.available) badges.push('<span class="rounded-full bg-stone-200 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-stone-700">Épuisé</span>');
    else if (sale) badges.push('<span class="rounded-full bg-black px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Promo</span>');
    if (p.badge && p.available) badges.push(`<span class="rounded-full bg-[#EAE8E1] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-stone-900">${escapeHtml(p.badge)}</span>`);

    const price = sale
      ? `<span class="text-2xl font-semibold text-rose-800">${money.format(p.price)}</span>
         <span class="text-base text-stone-500 line-through"><span class="sr-only">Prix initial </span>${money.format(p.compareAt)}</span>
         <span class="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-800">Économisez ${money.format(p.compareAt - p.price)}</span>`
      : `<span class="text-2xl font-semibold text-stone-900">${p.priceFrom ? '<span class="text-base font-normal text-stone-600">À partir de </span>' : ''}${money.format(p.price)}</span>`;

    const concernChips = chips('concern', p.concerns);
    const toneChips = p.tones.length === 5
      ? '<span class="rounded-full bg-[#EAE8E1] px-3 py-1 text-xs text-stone-700">Toutes les carnations</span>'
      : chips('tone', p.tones);

    dialog.innerHTML = `
      <div class="relative grid md:grid-cols-2">
        <button aria-label="Fermer la fiche produit" class="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-stone-800 shadow-sm hover:bg-black hover:text-white transition" data-qv-close type="button">${ICON_CLOSE}</button>

        <div class="p-4 sm:p-6 md:sticky md:top-0 md:self-start">
          <div class="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#F3F1EC]">
            <img alt="${escapeHtml(p.name)}" class="h-full w-full ${gallery[0].contain ? 'object-contain' : 'object-cover'} transition-opacity duration-300" data-qv-main src="${gallery[0].src}">
            ${badges.length ? `<div class="absolute left-3 top-3 flex gap-1.5">${badges.join('')}</div>` : ''}
          </div>
          ${gallery.length > 1 ? `
          <div aria-label="Images du produit" class="mt-3 flex gap-3" role="group">
            ${gallery.map((g, i) => `
            <button aria-label="${g.label}" aria-pressed="${i === 0}" class="h-20 w-16 overflow-hidden rounded-xl border-2 border-transparent bg-[#F3F1EC] aria-pressed:border-stone-900 transition" data-qv-thumb="${i}" type="button">
              <img alt="" class="h-full w-full ${g.contain ? 'object-contain' : 'object-cover'}" src="${g.src}">
            </button>`).join('')}
          </div>` : ''}
        </div>

        <div class="flex flex-col px-5 pb-8 sm:px-8 md:py-10 md:pl-2 md:pr-10">
          ${typeLabel ? `<a class="text-[11px] font-semibold uppercase tracking-widest text-amber-700 hover:text-amber-900" href="produits.html?type=${p.type}">${escapeHtml(typeLabel)}</a>` : ''}
          <h2 class="mt-2 font-editorial text-3xl leading-tight text-stone-950 sm:text-4xl" id="qv-title">${escapeHtml(p.name)}</h2>
          ${window.BN_stars ? window.BN_stars(p, { large: true, className: 'mt-3' }) : ''}
          <p class="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-2">${price}</p>
          <p class="mt-5 text-sm font-light leading-relaxed text-stone-600">${escapeHtml(p.description || '')}</p>

          ${concernChips ? `<div class="mt-6"><p class="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">Idéal pour</p><div class="flex flex-wrap gap-2">${concernChips}</div></div>` : ''}
          ${toneChips ? `<div class="mt-5"><p class="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">Carnations</p><div class="flex flex-wrap gap-2">${toneChips}</div></div>` : ''}

          <p class="mt-6 flex items-center gap-2 text-sm ${p.available ? 'text-emerald-800' : 'text-stone-500'}">
            <span aria-hidden="true" class="h-2 w-2 rounded-full ${p.available ? 'bg-emerald-600' : 'bg-stone-400'}"></span>
            ${p.available ? 'En stock' : 'Épuisé pour le moment'}
          </p>

          <div class="mt-4 flex gap-3">
            <div class="flex items-center rounded-full border border-stone-300 bg-white">
              <button aria-label="Diminuer la quantité" class="h-12 w-11 text-lg text-stone-700 hover:text-black disabled:opacity-30" data-qv-minus type="button"${p.available ? '' : ' disabled'}>−</button>
              <input aria-label="Quantité" class="w-10 border-0 bg-transparent p-0 text-center text-sm focus:ring-0" data-qv-qty inputmode="numeric" max="10" min="1" type="number" value="1"${p.available ? '' : ' disabled'}>
              <button aria-label="Augmenter la quantité" class="h-12 w-11 text-lg text-stone-700 hover:text-black disabled:opacity-30" data-qv-plus type="button"${p.available ? '' : ' disabled'}>+</button>
            </div>
            <button class="flex-1 rounded-full bg-black px-6 text-sm font-medium text-white hover:bg-stone-800 transition disabled:cursor-not-allowed disabled:bg-stone-300" data-add-to-cart data-product="${escapeHtml(p.name)}" data-qty="1" type="button"${p.available ? '' : ' disabled'}>
              ${p.available ? 'Ajouter au panier' : 'Épuisé'}
            </button>
            <button aria-label="Ajouter « ${escapeHtml(p.name)} » aux favoris" aria-pressed="false" class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 hover:border-stone-900 aria-pressed:text-rose-700 transition" data-wishlist="${p.id}" type="button">${ICON_HEART}</button>
          </div>

          <div class="mt-8 border-t border-stone-200">
            <details class="group border-b border-stone-200 py-4">
              <summary class="flex cursor-pointer list-none items-center justify-between text-sm font-medium [&::-webkit-details-marker]:hidden">Livraison &amp; retours ${ICON_CHEVRON}</summary>
              <p class="mt-3 text-sm font-light leading-relaxed text-stone-600">Livraison offerte dès 75 € d'achat. Retours gratuits sous 14 jours. Paiement 100 % sécurisé.</p>
            </details>
            <details class="group border-b border-stone-200 py-4">
              <summary class="flex cursor-pointer list-none items-center justify-between text-sm font-medium [&::-webkit-details-marker]:hidden">Une question ? ${ICON_CHEVRON}</summary>
              <p class="mt-3 text-sm font-light leading-relaxed text-stone-600">Notre service client vous conseille 7j/7 à <a class="underline underline-offset-4 hover:text-stone-900" href="mailto:care@bellenubian.com">care@bellenubian.com</a>. Consultez aussi notre <a class="underline underline-offset-4 hover:text-stone-900" href="code.html#faq">FAQ</a>.</p>
            </details>
          </div>
        </div>
      </div>`;

    bindDialogControls(p, gallery);
    if (window.BNWishlist) window.BNWishlist.refresh();
  }

  function bindDialogControls(p, gallery) {
    dialog.querySelector('[data-qv-close]').addEventListener('click', () => dialog.close());

    const main = dialog.querySelector('[data-qv-main]');
    dialog.querySelectorAll('[data-qv-thumb]').forEach(btn => {
      btn.addEventListener('click', () => {
        const g = gallery[+btn.dataset.qvThumb];
        main.style.opacity = '0';
        setTimeout(() => {
          main.src = g.src;
          main.classList.toggle('object-contain', g.contain);
          main.classList.toggle('object-cover', !g.contain);
          main.style.opacity = '1';
        }, 150);
        dialog.querySelectorAll('[data-qv-thumb]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      });
    });

    const qty = dialog.querySelector('[data-qv-qty]');
    const add = dialog.querySelector('[data-add-to-cart]');
    const setQty = v => {
      const n = Math.min(10, Math.max(1, parseInt(v, 10) || 1));
      qty.value = n;
      add.dataset.qty = n;
    };
    dialog.querySelector('[data-qv-minus]').addEventListener('click', () => setQty(+qty.value - 1));
    dialog.querySelector('[data-qv-plus]').addEventListener('click', () => setQty(+qty.value + 1));
    qty.addEventListener('change', () => setQty(qty.value));

    // Après l'ajout, on ferme la fiche pour laisser voir la confirmation et le compteur du panier
    add.addEventListener('click', () => setTimeout(() => dialog.close(), 0));
  }

  function open(id, trigger) {
    const p = byId[id];
    if (!p) return;
    ensureDialog();
    lastTrigger = trigger || null;
    render(p);
    document.documentElement.classList.add('overflow-hidden');
    dialog.showModal();
    dialog.scrollTop = 0;
    dialog.querySelector('[data-qv-close]').focus();
  }

  // Délégation : couvre les cartes générées dynamiquement (page collection)
  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-quickview]');
    if (trigger) {
      e.preventDefault();
      open(trigger.dataset.quickview, trigger);
      return;
    }
    const area = e.target.closest('[data-quickview-area]');
    if (area && !e.target.closest('button, a')) {
      open(area.dataset.quickviewArea, area.closest('article, li')?.querySelector('[data-quickview]') || area);
    }
  });

  window.BNQuickView = { open };
})();
