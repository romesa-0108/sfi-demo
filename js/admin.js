/* =====================================================
   OWNER DASHBOARD
   ===================================================== */
const ADM = { view: 'overview', tab: 'Pending', off: 0, q: '', invCat: 'All' };
ST_CLS['No-show'] = 'bad'; ST_CLS['Cancelled'] = 'mute'; ST_CLS['Declined'] = 'mute';

const VIEWS = [
  { id: 'overview', label: 'Overview', ic: 'layout-dashboard', sub: () => new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
  { id: 'rentals', label: 'Rental requests', ic: 'gem', sub: () => 'Approve requests with live availability checking' },
  { id: 'orders', label: 'Stitching orders', ic: 'scissors', sub: () => 'Move orders through the workshop, customers see every change' },
  { id: 'calendar', label: 'Availability calendar', ic: 'calendar', sub: () => 'One row per physical garment, with cleaning buffers' },
  { id: 'appointments', label: 'Appointments', ic: 'clock', sub: () => 'Consultations, measurements and fittings' },
  { id: 'inventory', label: 'Inventory', ic: 'shirt', sub: () => 'Every physical garment, its condition and next booking' },
  { id: 'school', label: 'Stitching school', ic: 'graduation-cap', sub: () => 'Courses, capacity and admissions' }
];
const pendingCount = () => S.requests.filter(r => r.status === 'Pending Review').length;
const badgeFor = id => ({ rentals: pendingCount(), orders: S.orders.filter(o => o.stage <= 2).length, appointments: S.appts.filter(a => a.status === 'Requested').length, school: S.apps.filter(a => a.status === 'Applied').length }[id] || 0);
const monthNow = () => S.months[S.months.length - 1];
const logAct = (t, k) => S.activity.unshift({ t, k, ago: 'just now', fresh: true });
const money = n => n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1000 ? Math.round(n / 1000) + 'K' : n;
const matchQ = (...xs) => !ADM.q || xs.join(' ').toLowerCase().includes(ADM.q);
const mini = g => dressSVG(g);

function renderAdmin() {
  const v = VIEWS.find(v => v.id === ADM.view);
  $('#admTitle').textContent = v.label; $('#admSub').textContent = v.sub();
  $('#sideNav').innerHTML = VIEWS.map(x => { const b = badgeFor(x.id); return `<button class="sn ${x.id === ADM.view ? 'on' : ''}" data-v="${x.id}">${icon(x.ic)}<span>${x.label}</span>${b ? `<i class="nb">${b}</i>` : ''}</button>`; }).join('');
  $$('#sideNav .sn').forEach(b => b.onclick = () => go(b.dataset.v));
  $('#admBody').innerHTML = `<div class="view v-${ADM.view}">${R[ADM.view]()}</div>`;
  hydrate($('#admBody')); bindView();
}
function go(v) { ADM.view = v; $('#side').classList.remove('open'); $('#sideScrim').classList.remove('show'); renderAdmin(); $('#admBody').scrollTop = 0; window.scrollTo(0, 0); }

/* ---------- rental request card (shared by list + calendar popups) ---------- */
const FLOW = {
  'Approved - Awaiting Payment': ['Record payment', 'pay', 'wallet'],
  'Confirmed': ['Mark ready for pickup', 'ready', 'package'],
  'Ready for Pickup': ['Hand over to customer', 'hand', 'check'],
  'Rented': ['Receive return', 'return', 'undo-2'],
  'Overdue / Damage Review': ['Receive late return', 'return', 'undo-2'],
  'Returned - Inspection Pending': ['Clear & refund deposit', 'done', 'check']
};
function reqCard(r) {
  const g = garment(r.g), q = quote(g, r.start, r.end, r.fulfil), pend = r.status === 'Pending Review';
  const c = pend ? findConflict(r.g, r.start, r.end, r.id) : null;
  const nf = c ? nextFree(r.g, q.days, r.start) : null;
  let actions = '';
  if (pend) actions = `<button class="btn btn-wine sm" data-act="approve" data-id="${r.id}" ${c ? 'disabled' : ''}>${icon('check')} Approve</button>${c && nf ? `<button class="btn btn-line sm" data-act="offer" data-id="${r.id}">Offer ${fmtD(nf.start)} – ${fmtD(nf.end)}</button>` : ''}<button class="btn btn-ghost sm" data-act="decline" data-id="${r.id}">Decline</button>`;
  else if (FLOW[r.status]) actions = `<button class="btn btn-wine sm" data-act="${FLOW[r.status][1]}" data-id="${r.id}">${icon(FLOW[r.status][2])} ${FLOW[r.status][0]}</button>`;
  const late = r.status === 'Overdue / Damage Review' ? `<span class="late">${icon('circle-alert')} ${Math.max(1, diffDays(r.end, D(0)))} days late · ${PKR(Math.max(1, diffDays(r.end, D(0))) * 1500)} fee</span>` : '';
  return `<article class="rq ${c ? 'conf' : ''}" data-id="${r.id}">
    <div class="rq-art" style="--tint:${g.c1}">${mini(g)}</div>
    <div class="rq-main">
      <div class="rq-top"><div><small>${r.id}${r.mine ? ' · <b class="nw">NEW from website</b>' : ''}</small><h4>${g.name}</h4><p>${g.code} · ${g.cat} · Size ${g.size}</p></div>${chip(r.status)}</div>
      <div class="rq-grid"><div><small>Customer</small><b>${esc(r.name)}</b><span>${esc(r.phone)}</span></div><div><small>Dates</small><b>${fmtD(r.start)} – ${fmtD(r.end)}</b><span>${q.days} days · ${r.fulfil}</span></div><div><small>Rental</small><b>${PKR(q.total)}</b><span>Deposit ${PKR(q.deposit)}</span></div></div>
      ${c ? `<div class="conflict">${icon('circle-alert')}<div><b>Booking conflict detected.</b> ${c.kind === 'booked' ? `Overlaps <b>${c.r.id}</b> (${esc(c.r.name)}, ${fmtD(c.r.start)} – ${fmtD(c.r.end)} + cleaning day).` : `Garment is in ${c.type.toLowerCase()} until ${fmtD(c.e)}.`} Approval is blocked.</div></div>` : ''}
      ${late}
      ${actions ? `<div class="rq-act">${actions}</div>` : ''}
    </div></article>`;
}
function reqAct(act, id) {
  const r = S.requests.find(r => r.id === id), g = garment(r.g), q = quote(g, r.start, r.end, r.fulfil);
  const say = (t, k = 'ok') => toast(t, k, k === 'ok' ? 'check' : 'circle-alert');
  if (act === 'approve') {
    const c = findConflict(r.g, r.start, r.end, r.id);           /* re-checked at approval time */
    if (c) return say('Conflict found at approval. Offer different dates or garment.', 'bad');
    r.status = 'Approved - Awaiting Payment'; logAct(`Approved ${r.id} · dates held for ${esc(r.name)}`, 'rent');
    say(`Approved <b>${r.id}</b>. Dates are now held for ${esc(r.name)}.`);
  } else if (act === 'decline') { r.status = 'Declined'; logAct(`Declined ${r.id}`, 'rent'); say(`<b>${r.id}</b> declined. Customer notified with the reason.`); }
  else if (act === 'offer') { const nf = nextFree(r.g, q.days, r.start); if (nf) { r.start = nf.start; r.end = nf.end; say(`Alternative dates offered: <b>${fmtD(nf.start)} – ${fmtD(nf.end)}</b>.`); } }
  else if (act === 'pay') { r.paid = q.total + q.deposit; r.status = 'Confirmed'; monthNow().re += q.total; logAct(`Payment recorded · ${PKR(q.total + q.deposit)} from ${esc(r.name)}`, 'pay'); say(`Payment recorded. <b>${r.id}</b> is now confirmed.`); }
  else if (act === 'ready') { r.status = 'Ready for Pickup'; say('Marked ready. Reminder sent to customer.'); }
  else if (act === 'hand') { r.status = 'Rented'; logAct(`${g.name} handed over to ${esc(r.name)}`, 'rent'); say('Handover recorded with condition checklist.'); }
  else if (act === 'return') { const late = r.status.startsWith('Overdue'); r.status = 'Returned - Inspection Pending'; say(late ? 'Late return received. Late fee recorded.' : 'Return received. Garment held for inspection and cleaning.'); }
  else if (act === 'done') { r.status = 'Completed'; logAct(`Deposit ${PKR(g.deposit)} refunded to ${esc(r.name)}`, 'pay'); say(`Deposit of <b>${PKR(g.deposit)}</b> refunded. Garment cleared.`); }
  closeModal(); refresh();
}

/* ---------- views ---------- */
const R = {};
R.overview = () => {
  const open = S.orders.filter(o => o.stage < 10), cur = monthNow(), prev = S.months[S.months.length - 2];
  const tot = m => m.st + m.re + m.sc, delta = Math.round((tot(cur) / tot(prev) - 1) * 100);
  const todays = S.appts.filter(a => a.date === D(0) && a.status !== 'Cancelled');
  const held = S.requests.filter(r => ['Confirmed', 'Ready for Pickup', 'Rented', 'Overdue / Damage Review', 'Returned - Inspection Pending'].includes(r.status) && r.paid > 0).reduce((s, r) => s + garment(r.g).deposit, 0);
  const overdue = S.requests.filter(r => r.status === 'Overdue / Damage Review' || (r.status === 'Rented' && r.end < D(0))).length;
  const conflicts = S.requests.filter(r => r.status === 'Pending Review' && findConflict(r.g, r.start, r.end, r.id)).length;
  const hr = new Date().getHours(), greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  const kpi = (ic, label, val, sub, tone = '', link) => `<button class="kpi ${tone}" ${link ? `data-go="${link}"` : ''}><span class="k-ic">${icon(ic)}</span><small>${label}</small><b>${val}</b><em>${sub}</em></button>`;
  const attn = [];
  if (pendingCount()) attn.push(['gem', `${pendingCount()} rental request${pendingCount() > 1 ? 's' : ''} awaiting review${conflicts ? ` · ${conflicts} with conflicts` : ''}`, 'rentals', conflicts ? 'bad' : 'warn']);
  if (overdue) attn.push(['circle-alert', `${overdue} overdue return${overdue > 1 ? 's need' : ' needs'} follow-up`, 'rentals', 'bad']);
  const dueSoon = open.filter(o => o.stage < 9 && diffDays(D(0), o.due) <= 3).length;
  if (dueSoon) attn.push(['scissors', `${dueSoon} stitching order${dueSoon > 1 ? 's' : ''} due within 3 days`, 'orders', 'warn']);
  const ap = S.appts.filter(a => a.status === 'Requested').length; if (ap) attn.push(['clock', `${ap} appointment request${ap > 1 ? 's' : ''} to confirm`, 'appointments', 'warn']);
  const aw = S.requests.filter(r => r.status === 'Approved - Awaiting Payment').length; if (aw) attn.push(['wallet', `${aw} approved rental${aw > 1 ? 's' : ''} awaiting payment`, 'rentals', 'info']);
  const sa = S.apps.filter(a => a.status === 'Applied').length; if (sa) attn.push(['graduation-cap', `${sa} new school application${sa > 1 ? 's' : ''}`, 'school', 'info']);
  return `
  <section class="hello"><div><h2>${greet}, Surayya.</h2><p>Here is what needs you today at the studio.</p></div><button class="btn btn-wine sm" data-go="rentals">${icon('gem')} Review requests</button></section>
  <div class="kpis">
    ${kpi('gem', 'Pending rental requests', pendingCount(), conflicts ? `${conflicts} with date conflict` : 'All clear', conflicts ? 'tone-bad' : '', 'rentals')}
    ${kpi('scissors', 'Active stitching orders', open.length, `${dueSoon} due within 3 days`, '', 'orders')}
    ${kpi('clock', 'Appointments today', todays.length, todays.find(a => a.status !== 'Completed') ? 'Next at ' + todays.find(a => a.status !== 'Completed').time : 'All done', '', 'appointments')}
    ${kpi('trending-up', 'Revenue this month', 'Rs ' + money(tot(cur)), `${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)}% vs last month`, delta >= 0 ? 'tone-ok' : 'tone-bad')}
    ${kpi('wallet', 'Deposits held', 'Rs ' + money(held), 'Refundable, tracked separately')}
    ${kpi('hourglass', 'Overdue returns', overdue, overdue ? 'Late fees accruing' : 'None', overdue ? 'tone-bad' : 'tone-ok', 'rentals')}
  </div>
  <div class="g2">
    <section class="panel"><header><h3>Revenue by service</h3><div class="lg-row"><span><i style="background:var(--wine)"></i>Stitching</span><span><i style="background:var(--gold)"></i>Rentals</span><span><i style="background:var(--teal)"></i>School</span></div></header>${revChart()}</section>
    <section class="panel"><header><h3>Needs your attention</h3></header><ul class="attn">${attn.length ? attn.map(a => `<li class="a-${a[3]}" data-go="${a[2]}"><span>${icon(a[0])}</span><b>${a[1]}</b>${icon('chevron-right')}</li>`).join('') : '<li class="a-ok"><span>' + icon('check') + '</span><b>You are all caught up</b></li>'}</ul></section>
  </div>
  <div class="g3">
    <section class="panel"><header><h3>Today's schedule</h3><button class="lnk" data-go="appointments">View all</button></header>${todaySched()}</section>
    <section class="panel"><header><h3>Order pipeline</h3><button class="lnk" data-go="orders">Open board</button></header>${pipeline()}</section>
    <section class="panel"><header><h3>Recent activity</h3></header>${feed(5)}</section>
  </div>`;
};
function revChart() {
  const W = 640, H = 250, pl = 44, pb = 28, pt = 16, ms = S.months, max = Math.max(...ms.map(m => m.st + m.re + m.sc)) * 1.12;
  const bw = (W - pl - 10) / ms.length, y = v => pt + (H - pt - pb) * (1 - v / max);
  const ticks = [0, .25, .5, .75, 1].map(t => t * max);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Monthly revenue by service">`;
  ticks.forEach(t => { s += `<line x1="${pl}" x2="${W - 6}" y1="${y(t)}" y2="${y(t)}" class="gl"/><text x="${pl - 8}" y="${y(t) + 4}" text-anchor="end" class="ax">${money(Math.round(t / 1000) * 1000)}</text>`; });
  ms.forEach((m, i) => {
    const x = pl + i * bw + bw * .2, w = bw * .6; let acc = 0;
    [['st', 'var(--wine)', 'Stitching'], ['re', 'var(--gold)', 'Rentals'], ['sc', 'var(--teal)', 'School']].forEach(([k, c, n], j) => {
      const h = (H - pt - pb) * m[k] / max, yy = y(acc + m[k]); acc += m[k];
      s += `<rect x="${x}" y="${yy}" width="${w}" height="${h}" fill="${c}" ${j === 2 ? 'rx="4"' : ''} class="bar"><title>${m.label} · ${n}: ${PKR(m[k])}</title></rect>`;
    });
    s += `<text x="${x + w / 2}" y="${H - 8}" text-anchor="middle" class="ax ${i === ms.length - 1 ? 'cur' : ''}">${m.label}</text><text x="${x + w / 2}" y="${y(acc) - 6}" text-anchor="middle" class="tv">${money(acc)}</text>`;
  });
  return s + '</svg>';
}
function todaySched() {
  const t = S.appts.filter(a => a.date === D(0) && a.status !== 'Cancelled').sort((a, b) => a.time.localeCompare(b.time));
  if (!t.length) return `<p class="empty-s">No appointments today.</p>`;
  return `<ul class="sched">${t.map(a => `<li class="${a.status === 'Completed' ? 'dn' : ''}"><time>${a.time}</time><div><b>${esc(a.name)}</b><small>${APPT_TYPES.find(x => x.id === a.type).label}</small></div>${chip(a.status)}</li>`).join('')}</ul>`;
}
function pipeline() {
  const G = [['New requests', [0, 1, 2]], ['Quotation', [3, 4]], ['In production', [5, 6]], ['Fitting & QC', [7, 8]], ['Ready', [9]]];
  const counts = G.map(([n, st]) => [n, S.orders.filter(o => st.includes(o.stage)).length]), mx = Math.max(1, ...counts.map(c => c[1]));
  return `<ul class="pipe">${counts.map(([n, c]) => `<li><span>${n}</span><div><i style="width:${c / mx * 100}%"></i></div><b>${c}</b></li>`).join('')}</ul>`;
}
function feed(n) {
  const ic = { pay: 'wallet', order: 'scissors', rent: 'gem', school: 'graduation-cap', appt: 'clock' };
  return `<ul class="feed">${S.activity.slice(0, n).map(a => `<li class="${a.fresh ? 'fresh' : ''}"><span>${icon(ic[a.k] || 'check')}</span><div><b>${a.t}</b><small>${a.ago}</small></div></li>`).join('')}</ul>`;
}

R.rentals = () => {
  const tabs = { Pending: r => r.status === 'Pending Review', Active: r => isBlocking(r), History: r => ['Completed', 'Declined'].includes(r.status) };
  const list = S.requests.filter(tabs[ADM.tab]).filter(r => matchQ(r.id, r.name, garment(r.g).name, garment(r.g).code)).sort((a, b) => (b.mine ? 1 : 0) - (a.mine ? 1 : 0) || a.start.localeCompare(b.start));
  return `<div class="tabs">${Object.keys(tabs).map(t => `<button class="${t === ADM.tab ? 'on' : ''}" data-tab="${t}">${t}<i>${S.requests.filter(tabs[t]).length}</i></button>`).join('')}</div>
    <p class="tip">${icon('shield-check')}<span>Availability is re-checked at the moment of approval, so two customers can never both be confirmed for overlapping dates. <b>Demo:</b> approve SFI-R-2047, then look at SFI-R-2048.</span></p>
    <div class="rq-list">${list.length ? list.map(reqCard).join('') : `<p class="empty-s">Nothing here.</p>`}</div>`;
};

R.orders = () => {
  const G = [['New requests', [0, 1, 2], 'var(--rose)'], ['Quotation', [3, 4], 'var(--gold)'], ['In production', [5, 6], 'var(--wine)'], ['Fitting & QC', [7, 8], 'var(--teal)'], ['Ready', [9, 10], 'var(--ok)']];
  return `<div class="board">${G.map(([n, st, col]) => { const os = S.orders.filter(o => st.includes(o.stage) && matchQ(o.id, o.name, o.item)).sort((a, b) => a.due.localeCompare(b.due)); return `<section class="col"><header><i style="background:${col}"></i><b>${n}</b><span>${os.length}</span></header>${os.map(o => ordCard(o)).join('') || '<p class="empty-s">Empty</p>'}</section>`; }).join('')}</div>`;
};
function ordCard(o) {
  const dl = diffDays(D(0), o.due), pct = Math.round(o.stage / (STAGES.length - 1) * 100), bal = Math.max(0, o.quote - o.paid);
  return `<article class="oc ${o.mine ? 'new' : ''}" data-o="${o.id}"><div class="oc-top"><small>${o.id}</small>${o.mine ? '<b class="nw">NEW</b>' : ''}${o.urgent ? '<b class="urg">Urgent</b>' : ''}</div>
    <h4>${esc(o.name)}</h4><p>${esc(o.item)}</p><span class="fab">${o.fabric}</span>
    <div class="oc-bar"><i style="width:${pct}%"></i></div><div class="oc-stage">${STAGES[o.stage]}</div>
    <div class="oc-foot"><span class="${dl <= 2 && o.stage < 9 ? 'due hot' : 'due'}">${icon('calendar')} ${dl < 0 ? 'Overdue' : dl === 0 ? 'Today' : dl === 1 ? 'Tomorrow' : fmtD(o.due)}</span><span>${o.quote ? (bal ? PKR(bal) + ' due' : 'Paid') : 'No quote'}</span></div>
    ${o.stage < 10 ? `<button class="btn btn-line xs block" data-adv="${o.id}">Next: ${STAGES[o.stage + 1]}</button>` : ''}</article>`;
}
function advance(id) {
  const o = S.orders.find(o => o.id === id); if (!o || o.stage >= 10) return;
  o.stage++; o.hist.push({ stage: STAGES[o.stage], at: D(0) });
  if (o.stage === 3 && !o.quote) o.quote = /Bridal/.test(o.item) ? 160000 : /Gown|Maxi|Pishwas|Gharara/.test(o.item) ? 45000 : 24000;
  if (o.stage === 5 && o.paid < o.quote / 2) { const adv = Math.round(o.quote / 2) - o.paid; o.paid += adv; monthNow().st += adv; logAct(`Advance ${PKR(adv)} recorded · ${o.id}`, 'pay'); }
  if (o.stage === 10) { const b = o.quote - o.paid; if (b > 0) { o.paid = o.quote; monthNow().st += b; logAct(`Final balance ${PKR(b)} collected · ${o.id}`, 'pay'); } }
  logAct(`Order ${o.id} moved to ${STAGES[o.stage]}`, 'order');
  toast(`<b>${o.id}</b> → ${STAGES[o.stage]}. Customer notified (WhatsApp).`, 'ok', 'message-circle');
  refresh();
}
function orderModal(id) {
  const o = S.orders.find(o => o.id === id), bal = Math.max(0, o.quote - o.paid);
  openModal(`<div class="om"><p class="eyebrow"><span class="line"></span> ${o.id}${o.mine ? ' · from website' : ''}</p><h2>${esc(o.name)}</h2><p class="muted">${esc(o.item)} · ${o.fabric} · ${esc(o.phone)}</p>
    <div class="t-meta"><div><small>Due</small><b>${fmtD(o.due)}</b></div><div><small>Quotation</small><b>${o.quote ? PKR(o.quote) : 'Not sent'}</b></div><div><small>Paid</small><b>${PKR(o.paid)}</b></div><div><small>Balance</small><b>${PKR(bal)}</b></div></div>
    ${o.notes ? `<p class="note"><b>Customer notes:</b> ${esc(o.notes)}</p>` : ''}
    <ol class="t-steps lite">${STAGES.map((s, i) => { const h = o.hist.find(h => h.stage === s); return `<li class="${i < o.stage ? 'done' : i === o.stage ? 'now' : ''}"><span class="tdot">${i < o.stage ? icon('check') : ''}</span><b>${s}</b>${h ? `<small>${fmtD(h.at)} · ${o.staff !== '—' ? o.staff : 'Studio'}</small>` : ''}</li>`; }).join('')}</ol>
    ${o.stage < 10 ? `<button class="btn btn-wine block" id="omAdv">Advance to ${STAGES[o.stage + 1]} ${icon('arrow-right')}</button>` : ''}</div>`);
  const b = $('#omAdv'); if (b) b.onclick = () => { advance(id); orderModal(id); };
}

R.calendar = () => {
  const N = 28, start = D(-3 + ADM.off), end = addISO(start, N - 1), todayIdx = diffDays(start, D(0));
  const days = Array.from({ length: N }, (_, i) => addISO(start, i));
  const idx = s => diffDays(start, s);
  const rows = GARMENTS.filter(g => matchQ(g.name, g.code)).map(g => {
    let bars = '';
    S.requests.filter(r => r.g === g.id && !['Declined', 'Completed'].includes(r.status) || (r.g === g.id && r.status === 'Completed')).forEach(r => {
      const a = idx(r.start), b = idx(r.end); if (b < 0 || a > N - 1) return;
      const cls = r.status === 'Pending Review' ? 'pend' : r.status === 'Completed' ? 'done' : r.status === 'Rented' ? 'rent' : r.status.startsWith('Overdue') ? 'late' : r.status === 'Returned - Inspection Pending' ? 'insp' : 'conf';
      bars += `<button class="bar-g ${cls}" data-r="${r.id}" style="grid-column:${Math.max(a, 0) + 1}/${Math.min(b, N - 1) + 2}" title="${r.id} · ${esc(r.name)} · ${r.status}"><span>${esc(r.name.split(' ')[0])}</span></button>`;
      if (isBlocking(r)) { const bi = b + CFG.bufferAfter; if (b + 1 <= N - 1 && b + 1 >= 0) bars += `<span class="bar-g buf" style="grid-column:${Math.max(b + 1, 0) + 1}/${Math.min(bi, N - 1) + 2}" title="Cleaning buffer"></span>`; }
    });
    S.maint.filter(m => m.g === g.id).forEach(m => { const a = idx(m.start), b = idx(m.end); if (b < 0 || a > N - 1) return; bars += `<span class="bar-g maint" style="grid-column:${Math.max(a, 0) + 1}/${Math.min(b, N - 1) + 2}" title="${m.type}"><span>${m.type}</span></span>`; });
    return `<div class="grow"><div class="glabel"><div class="gthumb" style="--tint:${g.c1}">${mini(g)}</div><div><b>${g.name}</b><small>${g.code} · ${g.size}</small></div></div><div class="gtrack">${bars}</div></div>`;
  }).join('');
  const head = days.map((d, i) => { const dt = parseD(d), first = dt.getDate() === 1 || i === 0; return `<div class="gh ${d === D(0) ? 'today' : ''} ${[0, 6].includes(dt.getDay()) ? 'wknd' : ''}"><small>${first ? dt.toLocaleDateString('en-GB', { month: 'short' }) : dt.toLocaleDateString('en-GB', { weekday: 'narrow' })}</small><b>${dt.getDate()}</b></div>`; }).join('');
  return `<div class="cal-tools"><div class="seg-s"><button data-off="-7">${icon('chevron-left')}</button><button data-off="0">Today</button><button data-off="7">${icon('chevron-right')}</button></div>
    <div class="legend g"><span><i class="lg c-conf"></i>Confirmed</span><span><i class="lg c-pend"></i>Pending</span><span><i class="lg c-rent"></i>Rented</span><span><i class="lg c-late"></i>Overdue</span><span><i class="lg c-insp"></i>Inspection</span><span><i class="lg c-buf"></i>Cleaning day</span><span><i class="lg c-maint"></i>Maintenance</span></div></div>
    <div class="gantt-wrap"><div class="gantt" style="--n:${N}"><div class="ghead"><div class="glabel gl-h">Garment</div><div class="gdays">${head}</div></div>${rows}<div class="today-line" style="left:calc(210px + (100% - 210px) * ${(todayIdx + .5) / N})"></div></div></div>`;
};

R.appointments = () => {
  const today = S.appts.filter(a => a.date === D(0) && a.status !== 'Cancelled'), req = S.appts.filter(a => a.status === 'Requested' && matchQ(a.name, a.id)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const up = S.appts.filter(a => a.status === 'Confirmed' && a.date > D(0) && matchQ(a.name, a.id)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const row = a => { const t = APPT_TYPES.find(t => t.id === a.type); return `<li class="ap-row ${a.mine ? 'new' : ''}"><div class="ap-t"><b>${a.time}</b><small>${fmtD(a.date, { weekday: 'short', day: 'numeric', month: 'short' })}</small></div><div class="ap-i"><b>${esc(a.name)} ${a.mine ? '<b class="nw">NEW</b>' : ''}</b><small>${icon(t.icon)} ${t.label} · ${esc(a.phone)}</small></div>${chip(a.status)}<div class="ap-a">${a.status === 'Requested' ? `<button class="btn btn-wine xs" data-ap="confirm" data-id="${a.id}">Confirm</button>` : ''}${a.status === 'Confirmed' ? `<button class="btn btn-wine xs" data-ap="complete" data-id="${a.id}">Complete</button><button class="btn btn-ghost xs" data-ap="noshow" data-id="${a.id}">No-show</button>` : ''}${['Requested', 'Confirmed'].includes(a.status) ? `<button class="btn btn-ghost xs" data-ap="cancel" data-id="${a.id}">Cancel</button>` : ''}</div></li>`; };
  const tl = SLOTS.map(t => { const a = today.find(x => x.time === t); const ty = a && APPT_TYPES.find(x => x.id === a.type); return `<li class="${a ? 'busy ' + (a.status === 'Completed' ? 'dn' : '') : ''}"><time>${t}</time>${a ? `<div><b>${esc(a.name)}</b><small>${ty.label}</small></div>${chip(a.status)}` : '<span class="free">Open slot</span>'}</li>`; }).join('');
  return `<div class="g-ap"><section class="panel"><header><h3>Today · ${fmtD(D(0), { weekday: 'long', day: 'numeric', month: 'short' })}</h3></header><ul class="tline">${tl}</ul></section>
  <div><section class="panel"><header><h3>Awaiting confirmation</h3><span class="count">${req.length}</span></header><ul class="ap-list">${req.map(row).join('') || '<p class="empty-s">No pending requests.</p>'}</ul></section>
  <section class="panel" style="margin-top:18px"><header><h3>Upcoming confirmed</h3></header><ul class="ap-list">${up.map(row).join('') || '<p class="empty-s">None.</p>'}</ul></section></div></div>`;
};
function apptAct(act, id) {
  const a = S.appts.find(a => a.id === id); const map = { confirm: 'Confirmed', complete: 'Completed', noshow: 'No-show', cancel: 'Cancelled' };
  a.status = map[act]; toast(act === 'confirm' ? `<b>${id}</b> confirmed. Reminder scheduled.` : `<b>${id}</b> marked ${map[act].toLowerCase()}.`, 'ok', 'check'); if (act === 'confirm') logAct(`Appointment ${id} confirmed for ${esc(a.name)}`, 'appt'); refresh();
}

R.inventory = () => {
  const cats = ['All', 'Bridal', 'Party'];
  const gs = GARMENTS.filter(g => (ADM.invCat === 'All' || g.cat === ADM.invCat) && matchQ(g.name, g.code, g.color));
  const rows = gs.map(g => {
    const st = garmentStatusToday(g.id), nx = S.requests.filter(r => r.g === g.id && isBlocking(r) && r.end >= D(0)).sort((a, b) => a.start.localeCompare(b.start))[0];
    const inM = S.maint.find(m => m.g === g.id && D(0) >= m.start && D(0) <= m.end);
    return `<tr><td><div class="it"><div class="gthumb" style="--tint:${g.c1}">${mini(g)}</div><div><b>${g.name}</b><small>${g.code}</small></div></div></td><td>${g.cat}</td><td>${g.size}</td><td>${PKR(g.rate)}</td><td>${PKR(g.deposit)}</td><td><span class="st st-${st.cls}">${st.label}</span></td><td>${nx ? `${fmtD(nx.start)} – ${fmtD(nx.end)}<small>${esc(nx.name)}</small>` : '<small>No upcoming booking</small>'}</td><td>${inM ? `<button class="btn btn-line xs" data-inv="clear" data-id="${g.id}">Clear</button>` : `<button class="btn btn-ghost xs" data-inv="clean" data-id="${g.id}">Send to cleaning</button>`}</td></tr>`;
  }).join('');
  const cnt = { ok: 0, rent: 0, maint: 0, other: 0 }; GARMENTS.forEach(g => { const s = garmentStatusToday(g.id).cls; cnt[s === 'ok' ? 'ok' : s === 'rent' ? 'rent' : s === 'maint' ? 'maint' : 'other']++; });
  return `<div class="inv-top"><div class="pills">${cats.map(c => `<button class="pill ${c === ADM.invCat ? 'on' : ''}" data-ic="${c}">${c}</button>`).join('')}</div><div class="inv-sum"><span><i class="d ok"></i>${cnt.ok} available</span><span><i class="d rent"></i>${cnt.rent} rented</span><span><i class="d maint"></i>${cnt.maint} cleaning / repair</span><span><i class="d info"></i>${cnt.other} reserved / returning</span></div></div>
  <div class="table-wrap"><table class="tbl"><thead><tr><th>Garment</th><th>Category</th><th>Size</th><th>Rate / day</th><th>Deposit</th><th>Today</th><th>Next booking</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
};

R.school = () => {
  const cap = COURSES.map(c => { const seated = c.enrolled + S.apps.filter(a => a.course === c.id && a.seated).length, pct = Math.min(100, seated / c.cap * 100); return `<div class="cc"><small>${c.level} · starts ${fmtD(c.starts)}</small><b>${c.title}</b><div class="seat-bar"><i class="${seated >= c.cap ? 'full' : ''}" style="width:${pct}%"></i></div><span>${seated}/${c.cap} seats · ${PKR(c.fee)}</span></div>`; }).join('');
  const apps = S.apps.filter(a => matchQ(a.name, a.id)).map(a => { const c = COURSES.find(c => c.id === a.course); return `<tr class="${a.mine ? 'new' : ''}"><td><b>${esc(a.name)}</b> ${a.mine ? '<b class="nw">NEW</b>' : ''}<small>${esc(a.phone)}</small></td><td>${c.title}</td><td>${fmtD(a.date)}</td><td>${chip(a.status)}</td><td class="ta">${a.status === 'Applied' || a.status === 'Waitlisted' ? `<button class="btn btn-wine xs" data-sc="accept" data-id="${a.id}">Accept</button>` : ''}${a.status === 'Applied' ? `<button class="btn btn-line xs" data-sc="wait" data-id="${a.id}">Waitlist</button>` : ''}${['Applied', 'Waitlisted'].includes(a.status) ? `<button class="btn btn-ghost xs" data-sc="decline" data-id="${a.id}">Decline</button>` : ''}</td></tr>`; }).join('');
  return `<div class="cc-grid">${cap}</div><section class="panel" style="margin-top:20px"><header><h3>Applications</h3></header><div class="table-wrap"><table class="tbl"><thead><tr><th>Applicant</th><th>Course</th><th>Applied</th><th>Status</th><th></th></tr></thead><tbody>${apps}</tbody></table></div></section>`;
};
function schoolAct(act, id) {
  const a = S.apps.find(a => a.id === id), c = COURSES.find(c => c.id === a.course);
  const seated = c.enrolled + S.apps.filter(x => x.course === c.id && x.seated).length;
  if (act === 'accept') {
    if (seated >= c.cap) {
      openModal(`<div class="done"><span class="done-ic warn">${icon('circle-alert')}</span><h2>Course is full</h2><p class="muted"><b>${c.title}</b> has ${seated}/${c.cap} seats. Admission beyond capacity needs an explicit coordinator override.</p><div class="row-btns"><button class="btn btn-wine" id="ov">Override &amp; accept</button><button class="btn btn-line" id="wl">Waitlist instead</button></div></div>`);
      $('#ov').onclick = () => { a.status = 'Accepted'; a.seated = true; closeModal(); toast(`${esc(a.name)} admitted by override. Logged in the audit trail.`, 'ok', 'check'); refresh(); };
      $('#wl').onclick = () => { a.status = 'Waitlisted'; closeModal(); refresh(); }; return;
    }
    a.status = 'Accepted'; a.seated = true; toast(`${esc(a.name)} accepted. Fee invoice of ${PKR(c.fee)} created.`, 'ok', 'check'); logAct(`${esc(a.name)} accepted into ${c.title}`, 'school');
  } else if (act === 'wait') { a.status = 'Waitlisted'; toast(`${esc(a.name)} added to the waitlist.`, 'ok', 'check'); }
  else { a.status = 'Declined'; toast(`Application ${id} declined.`, 'ok', 'check'); }
  refresh();
}

/* ---------- bindings ---------- */
function bindView() {
  const body = $('#admBody');
  $$('[data-go]', body).forEach(el => el.onclick = () => go(el.dataset.go));
  $$('[data-tab]', body).forEach(b => b.onclick = () => { ADM.tab = b.dataset.tab; renderAdmin(); });
  $$('[data-act]', body).forEach(b => b.onclick = () => reqAct(b.dataset.act, b.dataset.id));
  $$('[data-adv]', body).forEach(b => b.onclick = e => { e.stopPropagation(); advance(b.dataset.adv); });
  $$('.oc', body).forEach(c => c.onclick = () => orderModal(c.dataset.o));
  $$('[data-off]', body).forEach(b => b.onclick = () => { ADM.off = +b.dataset.off === 0 ? 0 : ADM.off + +b.dataset.off; renderAdmin(); });
  $$('.bar-g[data-r]', body).forEach(b => b.onclick = () => { const r = S.requests.find(r => r.id === b.dataset.r); openModal(`<div class="rq-modal">${reqCard(r)}</div>`); $$('[data-act]', $('.modal')).forEach(x => x.onclick = () => reqAct(x.dataset.act, x.dataset.id)); });
  $$('[data-ap]', body).forEach(b => b.onclick = () => apptAct(b.dataset.ap, b.dataset.id));
  $$('[data-ic]', body).forEach(b => b.onclick = () => { ADM.invCat = b.dataset.ic; renderAdmin(); });
  $$('[data-inv]', body).forEach(b => b.onclick = () => {
    const id = b.dataset.id, g = garment(id);
    if (b.dataset.inv === 'clean') { S.maint.push({ g: id, type: 'Cleaning', start: D(0), end: D(2) }); toast(`${g.name} sent to cleaning for 2 days. It is blocked for booking.`, 'ok', 'check'); }
    else { S.maint = S.maint.filter(m => !(m.g === id && D(0) >= m.start && D(0) <= m.end)); toast(`${g.name} cleared and available again.`, 'ok', 'check'); }
    refresh();
  });
  $$('[data-sc]', body).forEach(b => b.onclick = () => schoolAct(b.dataset.sc, b.dataset.id));
}
