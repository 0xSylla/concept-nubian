/*
 * Mode tournage Belle Nubian : un appareil pilote, les autres suivent (même Wi-Fi), avec scripts/serve_tournage.py.
 * Actif avec ?tournage=pilote ou ?tournage=suit (retenu pour tout l'onglet ; ?tournage=off pour sortir).
 * Sans ce paramètre, ce script ne fait rien.
 *
 * Ce qui suit : la page (accueil, collection et ses filtres/tri, qui vivent dans l'adresse), le défilement
 * (par section et en proportion de la section, car téléphone et ordinateur n'ont pas la même hauteur de page)
 * et les carrousels horizontaux (éléments dont l'id se termine par « -track »).
 */
(function () {
  let role = new URLSearchParams(location.search).get('tournage');
  try {
    if (role === 'off') sessionStorage.removeItem('bn-tournage');
    else if (role) sessionStorage.setItem('bn-tournage', role);
    else role = sessionStorage.getItem('bn-tournage');
  } catch (e) { /* stockage indisponible : seul le paramètre compte */ }
  if (role !== 'pilote' && role !== 'suit') return;

  const anchors = () => [...document.querySelectorAll('main > section, body > footer')];
  const tracks = () => [...document.querySelectorAll('[id$="-track"]')];
  const top = el => el.getBoundingClientRect().top + scrollY;
  // identité de la page : fichier + paramètres (filtres, tri…) sans « tournage »
  function page() {
    const q = new URLSearchParams(location.search);
    q.delete('tournage');
    q.sort();
    return (location.pathname.split('/').pop() || 'code.html') + (q.toString() ? '?' + q : '');
  }
  const pageUrl = p => p + (p.includes('?') ? '&' : '?') + 'tournage=suit';

  function state() {
    const list = anchors();
    let i = 0;
    list.forEach((el, k) => { if (top(el) <= scrollY + 1) i = k; });
    const a = list[i];
    const f = a ? (scrollY - top(a)) / Math.max(1, a.offsetHeight) : 0;
    const t = {};
    tracks().forEach(el => { const max = el.scrollWidth - el.clientWidth; if (max > 0) t[el.id] = el.scrollLeft / max; });
    return { page: page(), i, f: Math.max(0, Math.min(1, f)), tracks: t };
  }

  if (role === 'pilote') {
    let timer = null;
    const send = () => { timer = null; fetch('/__sync', { method: 'POST', body: JSON.stringify(state()), keepalive: true }).catch(() => {}); };
    const soon = () => { if (!timer) timer = setTimeout(send, 33); };
    addEventListener('scroll', soon, { passive: true });
    document.addEventListener('scroll', soon, { passive: true, capture: true });   // carrousels
    document.addEventListener('click', () => setTimeout(send, 120));              // filtres, tri
    document.addEventListener('change', () => setTimeout(send, 120));
    send();
    return;
  }

  // suiveur : rejoint la position en douceur ; carrousels sans aimantation (elle contrarierait le suivi)
  document.documentElement.style.scrollBehavior = 'auto';      // le site défile en douceur : ici, ce lissage freinerait le suivi
  let target = null;
  const trackTargets = {};
  tracks().forEach(el => { el.style.scrollSnapType = 'none'; el.style.scrollBehavior = 'auto'; });
  const source = new EventSource('/__sync');
  source.onmessage = e => {
    const d = JSON.parse(e.data);
    if (d.page !== page()) { location.href = pageUrl(d.page); return; }
    const el = anchors()[d.i];
    if (el) target = top(el) + d.f * el.offsetHeight;
    Object.entries(d.tracks || {}).forEach(([id, f]) => { trackTargets[id] = f; });
  };
  (function follow() {
    if (target !== null) {
      const y = scrollY + (target - scrollY) * 0.35;
      scrollTo(0, Math.abs(target - y) < 1 ? target : y);
    }
    Object.entries(trackTargets).forEach(([id, f]) => {
      const el = document.getElementById(id);
      if (!el) return;
      const goal = f * (el.scrollWidth - el.clientWidth);
      const x = el.scrollLeft + (goal - el.scrollLeft) * 0.4;
      el.scrollLeft = Math.abs(goal - x) < 1 ? goal : x;
    });
    requestAnimationFrame(follow);
  })();
})();
