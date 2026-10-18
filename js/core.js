/* ---------- state ---------- */
const clone = o => JSON.parse(JSON.stringify(o));
let S;
function seedState() {
  S = {
    requests: clone(REQUESTS), maint: clone(MAINT), appts: clone(APPTS), apps: clone(APPLICATIONS),
    months: clone(MONTHS), activity: clone(ACTIVITY), unread: 0,
    orders: clone(ORDERS).map(o => ({ ...o, hist: Array.from({ length: o.stage + 1 }, (_, i) => ({ stage: STAGES[i], at: D(-(o.stage - i) * 2 - (i ? 0 : 1)) })) })),
    mine: { orders: [], requests: [], appts: [], apps: [] },
    n: { r: 2050, o: 1060, a: 309, ap: 76 }
  };
}
seedState();

/* ---------- availability engine (mirrors the booking rules in the spec) ---------- */
const addISO = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return toISO(d); };
const isBlocking = r => BLOCKING.includes(r.status);
const garment = id => GARMENTS.find(g => g.id === id);

function blockedRanges(gid, ignoreId) {
  const out = [];
  S.requests.forEach(r => { if (r.g === gid && r.id !== ignoreId && isBlocking(r)) out.push({ s: r.start, e: addISO(r.end, CFG.bufferAfter), kind: 'booked', r }); });
  S.maint.forEach(m => { if (m.g === gid) out.push({ s: m.start, e: m.end, kind: 'maint', type: m.type }); });
  return out;
}
/* Is [start, end + cleaning buffer] overlapping anything confirmed or blocked? */
function findConflict(gid, start, end, ignoreId) {
  const e2 = addISO(end, CFG.bufferAfter);
  return blockedRanges(gid, ignoreId).find(b => start <= b.e && e2 >= b.s) || null;
}
function dayState(gid, iso) {
  if (iso < D(0)) return 'past';
  for (const b of blockedRanges(gid)) {
    if (iso >= b.s && iso <= b.e) {
      if (b.kind === 'maint') return 'maint';
      return iso > b.r.end ? 'buffer' : 'booked';
    }
  }
  if (S.requests.some(r => r.g === gid && r.status === 'Pending Review' && iso >= r.start && iso <= r.end)) return 'pending';
  return 'free';
}
function nextFree(gid, days = CFG.minDays, from = D(0)) {
  for (let i = 0; i < 120; i++) {
    const s = addISO(from, i), e = addISO(s, days - 1);
    if (s >= D(0) && !findConflict(gid, s, e)) return { start: s, end: e };
  }
  return null;
}
function altGarments(g, start, end) {
  return GARMENTS.filter(x => x.id !== g.id && x.cat === g.cat && !findConflict(x.id, start, end));
}
function garmentStatusToday(gid) {
  const t = D(0);
  const m = S.maint.find(m => m.g === gid && t >= m.start && t <= m.end);
  if (m) return { label: m.type, cls: 'maint' };
  const r = S.requests.find(r => r.g === gid && isBlocking(r) && t >= r.start && t <= addISO(r.end, CFG.bufferAfter));
  if (r) {
    if (r.status === 'Overdue / Damage Review') return { label: 'Overdue', cls: 'bad' };
    if (r.status === 'Returned - Inspection Pending') return { label: 'Inspection', cls: 'warn' };
    if (r.status === 'Rented') return { label: 'Rented out', cls: 'rent' };
    return { label: 'Reserved', cls: 'info' };
  }
  return { label: 'Available', cls: 'ok' };
}
function quote(g, start, end, fulfil) {
  const days = diffDays(start, end) + 1, fee = days * g.rate, delivery = fulfil === 'Delivery' ? CFG.deliveryFee : 0;
  return { days, fee, delivery, total: fee + delivery, deposit: g.deposit };
}
const reqTotal = r => quote(garment(r.g), r.start, r.end, r.fulfil).total;

/* ---------- status chips ---------- */
const ST_CLS = {
  'Pending Review': 'warn', 'Approved - Awaiting Payment': 'info', 'Confirmed': 'ok', 'Ready for Pickup': 'ok', 'Rented': 'rent',
  'Returned - Inspection Pending': 'warn', 'Completed': 'mute', 'Declined': 'mute', 'Overdue / Damage Review': 'bad',
  'Requested': 'warn', 'Applied': 'warn', 'Accepted': 'ok', 'Waitlisted': 'info', 'Declined ': 'mute', 'Cancelled': 'mute'
};
const chip = (s, label) => `<span class="st st-${ST_CLS[s] || 'mute'}">${esc(label || s)}</span>`;

/* ---------- UI helpers ---------- */
function hydrate(root = document) {
  $$('[data-i]', root).forEach(el => { if (!el.dataset.done) { el.classList.add('ico'); el.innerHTML = icon(el.dataset.i); el.dataset.done = 1; } });
}
function toast(msg, kind = 'ok', ic = 'check') {
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  t.innerHTML = `<span class="ti">${icon(ic)}</span><div>${msg}</div>`;
  $('#toasts').appendChild(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 400); }, 4600);
}
let _modal = null;
function openModal(html, cls = '') {
  closeModal(true);
  const ov = $('#overlay');
  ov.hidden = false; ov.className = 'overlay show';
  ov.innerHTML = `<div class="modal ${cls}" role="dialog" aria-modal="true"><button class="m-x" aria-label="Close">${icon('x')}</button>${html}</div>`;
  _modal = $('.modal', ov);
  $('.m-x', ov).onclick = () => closeModal();
  document.body.classList.add('lock');
  hydrate(ov);
  return _modal;
}
function closeModal(silent) {
  const ov = $('#overlay');
  if (!_modal && !silent) return;
  ov.classList.remove('show'); ov.hidden = true; ov.innerHTML = ''; _modal = null;
  if (!$('#drawer').classList.contains('open')) document.body.classList.remove('lock');
}
function openDrawer(html) {
  const d = $('#drawer'); d.hidden = false; d.innerHTML = `<button class="m-x" aria-label="Close">${icon('x')}</button>` + html;
  requestAnimationFrame(() => d.classList.add('open'));
  $('.m-x', d).onclick = closeDrawer; document.body.classList.add('lock'); hydrate(d);
}
function closeDrawer() {
  const d = $('#drawer'); d.classList.remove('open'); setTimeout(() => { d.hidden = true; d.innerHTML = ''; }, 350);
  if (!_modal) document.body.classList.remove('lock');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeDrawer(); } });
document.addEventListener('click', e => { if (e.target.id === 'overlay') closeModal(); });

/* admin-side signal when something happens on the customer site */
function notifyAdmin(text, kind) {
  S.unread++;
  S.activity.unshift({ t: text, k: kind, ago: 'just now', fresh: true });
  syncBadges();
}
function syncBadges() {
  ['modeBadge', 'bellBadge'].forEach(id => { const b = $('#' + id); if (!b) return; b.textContent = S.unread; b.hidden = !S.unread; });
  const dot = $('#acctDot'); if (dot) dot.hidden = !(S.mine.orders.length + S.mine.requests.length + S.mine.appts.length + S.mine.apps.length);
}
function refresh() {
  if (typeof renderCustomerDynamic === 'function') renderCustomerDynamic();
  if (typeof renderAdmin === 'function' && document.body.dataset.mode === 'admin') renderAdmin();
  syncBadges();
}
const nowStamp = () => D(0);
