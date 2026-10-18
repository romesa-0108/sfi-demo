/* =====================================================
   CUSTOMER SITE
   ===================================================== */
const CUST = { cat: 'All', size: '', from: '', to: '', trackCode: 'SFI-1042', ap: { type: 'consult', date: null, time: null } };
const dayName = (s, o = { weekday: 'short' }) => fmtD(s, o);
const longDate = s => fmtD(s, { weekday: 'short', day: 'numeric', month: 'short' });

/* ---------- static sections ---------- */
function initCustomer() {
  const items = ['Custom Stitching', 'Bridal Rental', 'Party Wear', 'Stitching School', 'Tailored Fittings', 'Order Tracking'];
  $('#marquee').innerHTML = [...items, ...items, ...items, ...items].map(t => `<span>${t}</span><i>✦</i>`).join('');

  const svc = [
    ['01', 'scissors', 'Custom Stitching', 'Share your design and fabric. We quote, stitch, fit and finish, and you follow every stage online.', '#stitching', 'Start an order'],
    ['02', 'gem', 'Bridal Rental', 'Barat, nikkah and walima outfits, each a single piece with date-safe booking and a clear deposit.', '#rentals', 'Browse bridal', 'Bridal'],
    ['03', 'sparkles', 'Party Wear Rental', 'Maxis, gowns, pishwas and gharara for mehndi, dholki and dinners. Wear it once, return it.', '#rentals', 'Browse party wear', 'Party'],
    ['04', 'graduation-cap', 'Stitching School', 'Courses from first stitch to advanced pattern making and bridal embroidery.', '#academy', 'See courses']
  ];
  $('#svcGrid').innerHTML = svc.map((s, i) => `
    <a class="svc reveal d${i}" href="${s[4]}" ${s[6] ? `data-cat="${s[6]}"` : ''}>
      <span class="svc-n">${s[0]}</span><span class="svc-ic">${icon(s[1])}</span>
      <h3>${s[2]}</h3><p>${s[3]}</p><span class="svc-go">${s[5]} ${icon('arrow-right')}</span>
    </a>`).join('');
  $$('.svc[data-cat]').forEach(a => a.addEventListener('click', () => setCat(a.dataset.cat)));

  const steps = [['Share your idea', 'Garment, fabric, references and the date you need it.'], ['Consult & measure', 'Online form or an in-store appointment.'], ['Quote & approve', 'Clear price and delivery date before we begin.'], ['Stitch, fit, finish', 'Live stage updates with fittings along the way.'], ['Pickup or delivery', 'Collect from the boutique or have it delivered.']];
  $('#steps').innerHTML = steps.map((s, i) => `<li><span class="stn">${i + 1}</span><div><b>${s[0]}</b><small>${s[1]}</small></div></li>`).join('');

  $('#quotes').innerHTML = TESTIMONIALS.map((t, i) => `<figure class="quote reveal d${i}"><span class="qm">“</span><blockquote>${t.q}</blockquote><figcaption><span class="av">${initials(t.n)}</span><div><b>${t.n}</b><small>${t.r}</small></div></figcaption></figure>`).join('');

  const faq = [
    ['Is my rental confirmed as soon as I submit?', 'No. A request is only a request until our team checks the dress and your dates, approves it, and the rental fee and deposit are received. You will see each of these steps in your account.'],
    ['How do the deposit and refund work?', 'The refundable deposit is shown separately from the rental fee. It is returned after the dress is inspected, less any agreed late fee or damage deduction, which is always recorded with a reason.'],
    ['What if I return a dress late?', `There is a grace period, then a per-day late fee shown before you confirm. Each dress also gets ${CFG.bufferAfter} day for cleaning, so it is ready for the next bride.`],
    ['Are my measurements private?', 'Yes. Measurements and reference photos are only visible to the staff working on your order, are never public, and are never used in marketing without your permission.'],
    ['Pickup or delivery?', `Choose store pickup for free, or delivery for ${PKR(CFG.deliveryFee)} where available. Handover and return conditions are recorded both ways.`]
  ];
  $('#faqList').innerHTML = faq.map((f, i) => `<details ${i === 0 ? 'open' : ''}><summary>${f[0]}<span>${icon('plus')}</span></summary><p>${f[1]}</p></details>`).join('');

  $('#yr').textContent = new Date().getFullYear();
  $('#waFab').href = `https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent('Assalam o Alaikum! I would like to know more about your services.')}`;

  const g1 = garment('g1');
  $('#heroDress').innerHTML = dressSVG(g1);

  /* filters */
  $$('#catPills .pill').forEach(b => b.onclick = () => setCat(b.dataset.cat));
  $('#fSize').onchange = e => { CUST.size = e.target.value; renderDresses(); };
  const from = $('#fFrom'), to = $('#fTo');
  from.min = to.min = D(0);
  from.onchange = () => { CUST.from = from.value; if (CUST.to && CUST.to < CUST.from) { CUST.to = to.value = ''; } to.min = from.value || D(0); renderDresses(); };
  to.onchange = () => { CUST.to = to.value; renderDresses(); };
  $('#fClear').onclick = () => { CUST.from = CUST.to = from.value = to.value = ''; renderDresses(); };

  initStitchForm(); initAppointments(); initTracker();
  $('#btnAccount').onclick = openAccount;
}
function setCat(c) { CUST.cat = c; $$('#catPills .pill').forEach(p => p.classList.toggle('on', p.dataset.cat === c)); renderDresses(); }

/* ---------- dynamic: dresses, hero, tracker, courses ---------- */
function renderCustomerDynamic() {
  renderDresses(); renderCourses(); renderTrack(CUST.trackCode, true); renderSlots();
  const nf = nextFree('g1');
  $('#heroFree').textContent = nf ? longDate(nf.start) : '—';
}
function renderDresses() {
  const hasRange = CUST.from && CUST.to && CUST.from <= CUST.to;
  $('#fClear').hidden = !(CUST.from || CUST.to);
  let list = GARMENTS.filter(g => (CUST.cat === 'All' || g.cat === CUST.cat) && (!CUST.size || g.size === CUST.size)).map(g => {
    const busy = hasRange ? !!findConflict(g.id, CUST.from, CUST.to) : false;
    return { g, busy };
  });
  if (hasRange) list.sort((a, b) => a.busy - b.busy);
  const note = $('#filterNote');
  if (hasRange) {
    const free = list.filter(x => !x.busy).length;
    note.hidden = false;
    note.innerHTML = `<b>${free}</b> of ${list.length} pieces are free from <b>${longDate(CUST.from)}</b> to <b>${longDate(CUST.to)}</b>, including a cleaning day after return.`;
  } else note.hidden = true;

  $('#dressGrid').innerHTML = list.length ? list.map(({ g, busy }) => {
    let badge;
    if (hasRange) badge = busy ? `<span class="avail bad">Booked for these dates</span>` : `<span class="avail ok">Free on your dates</span>`;
    else {
      const nf = nextFree(g.id);
      badge = nf && nf.start <= D(2) ? `<span class="avail ok">Available now</span>` : nf ? `<span class="avail warn">Free from ${fmtD(nf.start)}</span>` : `<span class="avail bad">Unavailable</span>`;
    }
    return `<article class="dcard ${busy ? 'busy' : ''}" data-id="${g.id}" tabindex="0" style="--tint:${g.c1}">
      <div class="dart"><span class="tag-cat">${g.cat} wear</span>${badge}<div class="dart-in">${dressSVG(g)}</div></div>
      <div class="dinfo"><small>${g.code} · Size ${g.size}</small><h3>${g.name}</h3><p class="colr">${g.color}</p>
      <div class="dprice"><span><b>${PKR(g.rate)}</b> / day</span><span class="dep">Deposit ${PKR(g.deposit)}</span></div>
      <span class="dgo">${hasRange && !busy ? 'Request these dates' : 'View &amp; pick dates'} ${icon('arrow-right')}</span></div></article>`;
  }).join('') : `<p class="empty">No dresses match these filters.</p>`;
  $$('.dcard').forEach(c => { const open = () => openDress(c.dataset.id); c.onclick = open; c.onkeydown = e => { if (e.key === 'Enter') open(); }; });
}

/* ---------- dress detail + calendar ---------- */
const CAL = { g: null, month: null, start: null, end: null, phase: 'start', msg: null, fulfil: 'Pickup' };
function openDress(id, preset) {
  const g = garment(id);
  CAL.g = g; CAL.fulfil = 'Pickup'; CAL.msg = null;
  const first = preset ? preset.start : (CUST.from && CUST.to && !findConflict(id, CUST.from, CUST.to) ? CUST.from : null);
  CAL.start = first; CAL.end = first ? (preset ? preset.end : CUST.to) : null; CAL.phase = 'start';
  CAL.month = (first || D(0)).slice(0, 7) + '-01';
  openModal(`
    <div class="dm">
      <div class="dm-art" style="--tint:${g.c1}"><div class="dm-art-in">${dressSVG(g)}</div>
        <ul class="dm-facts"><li>${icon('ruler')} Size ${g.size}</li><li>${icon('tag')} ${g.code}</li><li>${icon('shield-check')} ${g.care}</li></ul></div>
      <div class="dm-body">
        <p class="eyebrow"><span class="line"></span> ${g.cat} wear rental</p>
        <h2>${g.name}</h2>
        <p class="muted">${g.color} · ${g.note}</p>
        <div class="price-row"><div><b>${PKR(g.rate)}</b><small>per day · min ${CFG.minDays} days</small></div><div><b>${PKR(g.deposit)}</b><small>refundable deposit</small></div></div>
        <h4 class="sub-h">Choose your dates</h4>
        <div id="calWrap"></div>
        <div id="calMsg" class="cal-msg" hidden></div>
        <div id="calSum"></div>
        <div id="rentForm"></div>
      </div>
    </div>`, 'wide');
  renderCal();
}
function renderCal() {
  const g = CAL.g, wrap = $('#calWrap');
  const m0 = parseD(CAL.month), months = [m0, new Date(m0.getFullYear(), m0.getMonth() + 1, 1, 12)];
  const canPrev = CAL.month > D(0).slice(0, 7) + '-01';
  const mHTML = months.map((m, idx) => {
    const y = m.getFullYear(), mo = m.getMonth(), days = new Date(y, mo + 1, 0).getDate(), lead = (new Date(y, mo, 1).getDay() + 6) % 7;
    let cells = '<i></i>'.repeat(lead);
    for (let d = 1; d <= days; d++) {
      const iso = `${y}-${pad(mo + 1)}-${pad(d)}`, st = dayState(g.id, iso);
      const inR = CAL.start && CAL.end && iso >= CAL.start && iso <= CAL.end;
      const edge = iso === CAL.start ? 'a' : iso === CAL.end ? 'b' : '';
      const dis = !['free', 'pending'].includes(st);
      cells += `<button type="button" class="cd ${st} ${inR ? 'in' : ''} ${edge} ${iso === D(0) ? 'today' : ''}" data-d="${iso}" ${dis ? 'disabled' : ''} title="${st === 'booked' ? 'Booked' : st === 'buffer' ? 'Cleaning day' : st === 'maint' ? 'In maintenance' : st === 'pending' ? 'Request pending' : ''}">${d}</button>`;
    }
    return `<div class="month ${idx ? 'm2' : ''}"><div class="mh">${idx === 0 ? `<button type="button" class="nav-m" data-n="-1" ${canPrev ? '' : 'disabled'} aria-label="Previous month">${icon('chevron-left')}</button>` : '<span></span>'}<b>${m.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</b>${idx === 1 || false ? `<button type="button" class="nav-m" data-n="1" aria-label="Next month">${icon('chevron-right')}</button>` : '<span></span>'}</div>
      <div class="wk"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div><div class="cells">${cells}</div></div>`;
  }).join('');
  wrap.innerHTML = `<div class="cal">${mHTML}</div>
    <div class="legend"><span><i class="lg free"></i>Available</span><span><i class="lg pending"></i>Request pending</span><span><i class="lg booked"></i>Booked</span><span><i class="lg buffer"></i>Cleaning day</span></div>`;
  $$('.cd:not([disabled])', wrap).forEach(b => b.onclick = () => pickDay(b.dataset.d));
  $$('.nav-m', wrap).forEach(b => b.onclick = () => { const d = parseD(CAL.month); d.setMonth(d.getMonth() + +b.dataset.n); CAL.month = toISO(d).slice(0, 7) + '-01'; renderCal(); });
  renderCalSummary();
}
function pickDay(iso) {
  const g = CAL.g;
  if (CAL.phase === 'start' || !CAL.start || iso <= CAL.start) {
    CAL.start = iso; CAL.end = addISO(iso, CFG.minDays - 1); CAL.phase = 'end';
  } else {
    CAL.end = iso < addISO(CAL.start, CFG.minDays - 1) ? addISO(CAL.start, CFG.minDays - 1) : iso; CAL.phase = 'start';
  }
  validateRange(); renderCal();
}
function validateRange() {
  const g = CAL.g; CAL.msg = null;
  if (!CAL.start) return;
  const c = findConflict(g.id, CAL.start, CAL.end);
  if (c) {
    const nf = nextFree(g.id, diffDays(CAL.start, CAL.end) + 1, CAL.start);
    const alts = altGarments(g, CAL.start, CAL.end).slice(0, 2);
    CAL.msg = { kind: 'bad', nf, alts, c };
  } else if (S.requests.some(r => r.g === g.id && r.status === 'Pending Review' && CAL.start <= r.end && CAL.end >= r.start)) {
    CAL.msg = { kind: 'warn' };
  }
}
function renderCalSummary() {
  const g = CAL.g, box = $('#calMsg'), sum = $('#calSum'), form = $('#rentForm');
  const m = CAL.msg;
  if (m && m.kind === 'bad') {
    box.hidden = false; box.className = 'cal-msg bad';
    box.innerHTML = `<b>${icon('circle-alert')} These dates are not available.</b> ${m.c.kind === 'maint' ? `The dress is in ${m.c.type.toLowerCase()} then.` : 'They overlap another booking or its cleaning day.'}
      <div class="sugg">${m.nf ? `<button type="button" class="chip" data-use="${m.nf.start}|${m.nf.end}">Use ${fmtD(m.nf.start)} – ${fmtD(m.nf.end)}</button>` : ''}${m.alts.map(a => `<button type="button" class="chip alt" data-alt="${a.id}">Same dates: ${a.name}</button>`).join('')}</div>`;
    $$('[data-use]', box).forEach(b => b.onclick = () => { const [s, e] = b.dataset.use.split('|'); CAL.start = s; CAL.end = e; CAL.phase = 'start'; CAL.month = s.slice(0, 7) + '-01'; validateRange(); renderCal(); });
    $$('[data-alt]', box).forEach(b => b.onclick = () => openDress(b.dataset.alt, { start: CAL.start, end: CAL.end }));
  } else if (m && m.kind === 'warn') {
    box.hidden = false; box.className = 'cal-msg warn';
    box.innerHTML = `<b>${icon('hourglass')} Another request is pending for these dates.</b> You can still submit. Requests are reviewed in order and nothing is confirmed until approved.`;
  } else box.hidden = true;

  if (!CAL.start || (m && m.kind === 'bad')) {
    sum.innerHTML = `<p class="pick-hint">${icon('calendar')} ${CAL.start ? 'Pick different dates to continue.' : 'Tap a start date, then an end date.'}</p>`;
    form.innerHTML = ''; return;
  }
  const q = quote(g, CAL.start, CAL.end, CAL.fulfil);
  sum.innerHTML = `<div class="sum"><div class="sum-top"><div><small>Your dates</small><b>${longDate(CAL.start)} → ${longDate(CAL.end)}</b></div><span class="days-pill">${q.days} days</span></div>
    <dl><div><dt>Rental · ${q.days} × ${PKR(g.rate)}</dt><dd>${PKR(q.fee)}</dd></div>${q.delivery ? `<div><dt>Delivery &amp; return pickup</dt><dd>${PKR(q.delivery)}</dd></div>` : ''}
    <div class="tot"><dt>Estimated total</dt><dd>${PKR(q.total)}</dd></div><div class="dep-l"><dt>Refundable deposit (separate)</dt><dd>${PKR(q.deposit)}</dd></div></dl></div>`;
  const keep = form.dataset.g === g.id + CAL.start + CAL.end;
  if (!keep || !form.innerHTML) {
    const prevName = ($('#rName') || {}).value || 'Ayesha Khan', prevPhone = ($('#rPhone') || {}).value || '0300 5550123';
    form.dataset.g = g.id + CAL.start + CAL.end;
    form.innerHTML = `
      <div class="seg full" id="fulSeg"><button type="button" class="${CAL.fulfil === 'Pickup' ? 'on' : ''}" data-f="Pickup">${icon('package')} Store pickup</button><button type="button" class="${CAL.fulfil === 'Delivery' ? 'on' : ''}" data-f="Delivery">${icon('truck')} Delivery</button></div>
      <div class="field-row"><label class="field"><span>Your name</span><input id="rName" value="${esc(prevName)}"></label><label class="field"><span>Phone / WhatsApp</span><input id="rPhone" value="${esc(prevPhone)}"></label></div>
      <label class="check"><input type="checkbox" id="rTerms"><span>I understand this is a <b>request</b>. It is confirmed only after approval and payment of the rental fee and deposit. Late fees and damage deductions follow the published policy.</span></label>
      <button class="btn btn-wine block" id="rGo" type="button">Send rental request ${icon('arrow-right')}</button>`;
    $$('#fulSeg button').forEach(b => b.onclick = () => { CAL.fulfil = b.dataset.f; $$('#fulSeg button').forEach(x => x.classList.toggle('on', x === b)); renderCalSummary(); });
    $('#rGo').onclick = submitRental;
  }
}
function submitRental() {
  const g = CAL.g, name = $('#rName').value.trim(), phone = $('#rPhone').value.trim();
  if (!name || !phone) return toast('Please add your name and phone number.', 'warn', 'circle-alert');
  if (!$('#rTerms').checked) { $('#rTerms').closest('.check').classList.add('shake'); setTimeout(() => $('.check.shake') && $('.check.shake').classList.remove('shake'), 600); return toast('Please tick the confirmation to continue.', 'warn', 'circle-alert'); }
  if (findConflict(g.id, CAL.start, CAL.end)) { validateRange(); renderCal(); return toast('Those dates were just taken. Please choose others.', 'bad', 'circle-alert'); }
  const id = `SFI-R-${S.n.r++}`;
  const r = { id, g: g.id, start: CAL.start, end: CAL.end, name, phone, fulfil: CAL.fulfil, status: 'Pending Review', paid: 0, created: D(0), mine: true };
  S.requests.unshift(r); S.mine.requests.push(id);
  notifyAdmin(`New rental request ${id} · ${g.name} (${fmtD(r.start)} – ${fmtD(r.end)})`, 'rent');
  const q = quote(g, r.start, r.end, r.fulfil);
  $('.modal').innerHTML = `<button class="m-x" aria-label="Close">${icon('x')}</button><div class="done">
    <span class="done-ic">${icon('check')}</span><h2>Request received</h2>
    <p class="muted">Reference <b>${id}</b>. <b>${g.name}</b> · ${longDate(r.start)} → ${longDate(r.end)}</p>
    <ol class="mini-steps"><li class="on"><i></i>Request sent</li><li><i></i>Our team checks the dress &amp; dates</li><li><i></i>Approval &amp; payment (${PKR(q.total)} + ${PKR(q.deposit)} deposit)</li><li><i></i>Booking confirmed</li></ol>
    <p class="tiny muted">We will message you on WhatsApp. Your dates are <b>not</b> confirmed yet.</p>
    <div class="row-btns"><button class="btn btn-wine" id="dnAcct">View in My Account</button><button class="btn btn-line" id="dnClose">Keep browsing</button></div></div>`;
  $('.m-x').onclick = () => closeModal(); $('#dnClose').onclick = () => closeModal(); $('#dnAcct').onclick = () => { closeModal(); openAccount(); };
  toast(`Request <b>${id}</b> sent. Switch to the <b>Owner dashboard</b> to approve it.`, 'ok', 'check');
  refresh();
}

/* ---------- stitching form ---------- */
function initStitchForm() {
  const due = $('#stitchDue'); due.min = D(5); due.value = D(21);
  $$('#garmentChips .chip').forEach(c => c.onclick = () => { $$('#garmentChips .chip').forEach(x => x.classList.remove('on')); c.classList.add('on'); });
  ['#fabricSeg', '#measureSeg'].forEach(sel => $$(sel + ' button').forEach(b => b.onclick = () => { $$(sel + ' button').forEach(x => x.classList.remove('on')); b.classList.add('on'); }));
  const fileIn = $('#fileIn'), drop = $('#drop'), thumbs = $('#thumbs');
  const addFiles = files => [...files].slice(0, 4).forEach(f => {
    if (!f.type.startsWith('image/')) return toast('Only image files are allowed.', 'warn', 'circle-alert');
    if (f.size > 10 * 1024 * 1024) return toast('That file is over 10 MB.', 'warn', 'circle-alert');
    const url = URL.createObjectURL(f), el = document.createElement('div'); el.className = 'th'; el.innerHTML = `<img src="${url}" alt=""><button type="button" aria-label="Remove">${icon('x')}</button>`;
    el.querySelector('button').onclick = () => el.remove(); thumbs.appendChild(el);
  });
  fileIn.onchange = () => addFiles(fileIn.files);
  ['dragover', 'dragenter'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => addFiles(e.dataTransfer.files));
  $('#stitchForm').onsubmit = e => {
    e.preventDefault();
    const f = e.target, name = f.name.value.trim(), phone = f.phone.value.trim();
    [f.name, f.phone, f.due].forEach(i => i.closest('.field').classList.toggle('err', !i.value.trim()));
    if (!name || !phone || !f.due.value) return toast('Please complete the highlighted fields.', 'warn', 'circle-alert');
    const item = $('#garmentChips .chip.on').textContent;
    const inStore = $('#measureSeg .on').textContent.includes('store');
    const id = `SFI-${S.n.o++}`;
    S.orders.unshift({ id, name, phone, item, fabric: $('#fabricSeg .on').textContent.includes('supply') ? 'Boutique fabric' : 'Customer fabric', stage: 0, due: f.due.value, quote: 0, paid: 0, staff: '—', urgent: false, mine: true, notes: f.notes.value, hist: [{ stage: STAGES[0], at: D(0) }] });
    S.mine.orders.push(id); CUST.trackCode = id;
    notifyAdmin(`New stitching request ${id} · ${item} for ${name}`, 'order');
    openModal(`<div class="done"><span class="done-ic">${icon('check')}</span><h2>Order request received</h2>
      <p class="muted">Your order number is <b>${id}</b>. We will review it and call you to discuss the design and quotation.</p>
      <ol class="mini-steps"><li class="on"><i></i>Received</li><li><i></i>${inStore ? 'Book your in-store fitting' : 'Share your measurements online'}</li><li><i></i>Quotation &amp; approval</li><li><i></i>Stitching begins</li></ol>
      <div class="row-btns"><button class="btn btn-wine" id="goTrack">Track this order</button>${inStore ? '<button class="btn btn-line" id="goBook">Book fitting</button>' : ''}</div></div>`);
    $('#goTrack').onclick = () => { closeModal(); $('#trackIn').value = id; renderTrack(id); $('#track').scrollIntoView({ behavior: 'smooth' }); };
    const gb = $('#goBook'); if (gb) gb.onclick = () => { closeModal(); $('#book').scrollIntoView({ behavior: 'smooth' }); };
    toast(`Order <b>${id}</b> created. It is already visible in the <b>Owner dashboard</b>.`, 'ok', 'check');
    f.reset(); f.name.value = name; f.phone.value = phone; $('#stitchDue').value = D(21); $('#thumbs').innerHTML = '';
    refresh();
  };
}

/* ---------- tracker ---------- */
function initTracker() {
  $('#trackForm').onsubmit = e => { e.preventDefault(); CUST.trackCode = $('#trackIn').value.trim().toUpperCase(); renderTrack(CUST.trackCode); };
  $$('[data-code]').forEach(b => b.onclick = () => { $('#trackIn').value = b.dataset.code; CUST.trackCode = b.dataset.code; renderTrack(b.dataset.code); });
}
function renderTrack(code, quiet) {
  const o = S.orders.find(o => o.id === (code || '').toUpperCase());
  const box = $('#trackCard');
  if (!o) { box.innerHTML = `<div class="t-empty">${icon('search')}<b>No order found for “${esc(code || '')}”</b><p>Check the number on your confirmation message, or try SFI-1042.</p></div>`; return; }
  const pct = Math.round((o.stage / (STAGES.length - 1)) * 100), bal = Math.max(0, o.quote - o.paid);
  box.innerHTML = `<div class="t-head"><div><small>${o.id}</small><h3>${esc(o.item)}</h3></div><span class="st st-${o.stage >= 9 ? 'ok' : 'info'}">${STAGES[o.stage]}</span></div>
    <div class="t-prog"><i style="width:${pct}%"></i></div>
    <p class="t-help">${icon('sparkles')} ${STAGE_HELP[STAGES[o.stage]]}</p>
    <div class="t-meta"><div><small>Needed by</small><b>${fmtD(o.due, { day: 'numeric', month: 'short' })}</b></div><div><small>Quotation</small><b>${o.quote ? PKR(o.quote) : 'Pending'}</b></div><div><small>Balance</small><b>${o.quote ? PKR(bal) : '—'}</b></div></div>
    <ol class="t-steps">${STAGES.map((s, i) => { const h = o.hist.find(h => h.stage === s); return `<li class="${i < o.stage ? 'done' : i === o.stage ? 'now' : ''}"><span class="tdot">${i < o.stage ? icon('check') : ''}</span><b>${s}</b>${h ? `<small>${fmtD(h.at)}</small>` : ''}</li>`; }).join('')}</ol>`;
}

/* ---------- academy ---------- */
function renderCourses() {
  $('#courseGrid').innerHTML = COURSES.map((c, i) => {
    const enrolled = c.enrolled + S.apps.filter(a => a.course === c.id && a.seated).length;
    const left = c.cap - enrolled, full = left <= 0, pct = Math.min(100, Math.round(enrolled / c.cap * 100));
    return `<article class="course reveal in d${i}"><div class="c-top"><span class="lvl">${c.level}</span><span class="wk-n">${c.weeks} weeks</span></div>
      <h3>${c.title}</h3><p>${c.blurb}</p>
      <div class="skills">${c.skills.map(s => `<span>${s}</span>`).join('')}</div>
      <ul class="c-meta"><li>${icon('calendar')} Starts ${fmtD(c.starts)}</li><li>${icon('clock')} ${c.sched}</li></ul>
      <div class="seats"><div class="seat-bar"><i class="${full ? 'full' : left <= 3 ? 'low' : ''}" style="width:${pct}%"></i></div><small>${full ? 'Class full · join the waitlist' : `${left} of ${c.cap} seats left`}</small></div>
      <div class="c-foot"><div><small>Course fee</small><b>${PKR(c.fee)}</b></div><button class="btn ${full ? 'btn-line' : 'btn-wine'} sm" data-apply="${c.id}">${full ? 'Join waitlist' : 'Apply now'}</button></div></article>`;
  }).join('');
  $$('[data-apply]').forEach(b => b.onclick = () => openApply(b.dataset.apply));
}
function openApply(cid) {
  const c = COURSES.find(c => c.id === cid);
  openModal(`<div class="apply"><p class="eyebrow"><span class="line"></span> Admission inquiry</p><h2>${c.title}</h2>
    <p class="muted">${c.weeks} weeks · ${c.sched} · ${PKR(c.fee)}</p>
    <div class="field-row"><label class="field"><span>Full name</span><input id="apN" value="Ayesha Khan"></label><label class="field"><span>Phone / WhatsApp</span><input id="apP" value="0300 5550123"></label></div>
    <label class="field"><span>Stitching experience</span><select id="apE"><option>Complete beginner</option><option>Some experience</option><option>Professional / home tailor</option></select></label>
    <button class="btn btn-wine block" id="apGo">Submit application ${icon('arrow-right')}</button><p class="tiny muted center">Our coordinator reviews every application and will confirm by WhatsApp.</p></div>`);
  $('#apGo').onclick = () => {
    const name = $('#apN').value.trim(), phone = $('#apP').value.trim(); if (!name || !phone) return toast('Please add your name and phone.', 'warn', 'circle-alert');
    const id = `AP-${S.n.ap++}`;
    S.apps.unshift({ id, name, phone, course: cid, date: D(0), status: 'Applied', mine: true }); S.mine.apps.push(id);
    notifyAdmin(`New school application ${id} · ${name} for ${c.title}`, 'school');
    closeModal(); toast(`Application <b>${id}</b> submitted. The coordinator will be in touch.`, 'ok', 'check'); refresh();
  };
}

/* ---------- appointments ---------- */
function initAppointments() {
  const open = [];
  for (let i = 0; i < 14 && open.length < 8; i++) { const d = D(i); if (parseD(d).getDay() !== 0) open.push(d); }
  CUST.ap.date = open[0]; CUST.ap.days = open;
  $('#apptTypes').innerHTML = APPT_TYPES.map(t => `<button type="button" class="chip ${t.id === CUST.ap.type ? 'on' : ''}" data-t="${t.id}">${icon(t.icon)} ${t.label}</button>`).join('');
  $$('#apptTypes .chip').forEach(b => b.onclick = () => { CUST.ap.type = b.dataset.t; $$('#apptTypes .chip').forEach(x => x.classList.toggle('on', x === b)); });
  $('#apptDays').innerHTML = open.map(d => `<button type="button" class="day ${d === CUST.ap.date ? 'on' : ''}" data-d="${d}"><small>${dayName(d)}</small><b>${parseD(d).getDate()}</b><small>${fmtD(d, { month: 'short' })}</small></button>`).join('');
  $$('#apptDays .day').forEach(b => b.onclick = () => { CUST.ap.date = b.dataset.d; CUST.ap.time = null; $$('#apptDays .day').forEach(x => x.classList.toggle('on', x === b)); renderSlots(); });
  $('#apptGo').onclick = () => {
    const a = CUST.ap, name = $('#apName').value.trim(), phone = $('#apPhone').value.trim();
    if (!a.time) return toast('Please choose a time slot.', 'warn', 'circle-alert');
    if (!name || !phone) return toast('Please add your name and phone.', 'warn', 'circle-alert');
    if (S.appts.some(x => x.date === a.date && x.time === a.time && !['Cancelled', 'Completed'].includes(x.status))) { renderSlots(); return toast('That slot was just taken.', 'bad', 'circle-alert'); }
    const id = `A-${S.n.a++}`, t = APPT_TYPES.find(t => t.id === a.type);
    S.appts.push({ id, type: a.type, name, phone, date: a.date, time: a.time, status: 'Requested', mine: true }); S.mine.appts.push(id);
    notifyAdmin(`New appointment request ${id} · ${t.label}, ${fmtD(a.date)} ${a.time}`, 'appt');
    toast(`Slot requested: <b>${longDate(a.date)} at ${a.time}</b> (ref ${id}). We'll confirm shortly.`, 'ok', 'check');
    a.time = null; refresh();
  };
  renderSlots();
}
function renderSlots() {
  const a = CUST.ap, box = $('#apptSlots'); if (!box) return;
  const now = new Date(), isToday = a.date === D(0);
  box.innerHTML = SLOTS.map(t => {
    const taken = S.appts.some(x => x.date === a.date && x.time === t && !['Cancelled', 'Completed'].includes(x.status)) || (isToday && +t.slice(0, 2) <= now.getHours());
    return `<button type="button" class="slot ${a.time === t ? 'on' : ''}" data-t="${t}" ${taken ? 'disabled' : ''}>${t}${taken ? '<small>Taken</small>' : ''}</button>`;
  }).join('');
  $$('.slot:not([disabled])', box).forEach(b => b.onclick = () => { a.time = b.dataset.t; renderSlots(); });
}

/* ---------- my account drawer ---------- */
function openAccount() {
  const m = S.mine, reqs = S.requests.filter(r => m.requests.includes(r.id)), ords = S.orders.filter(o => m.orders.includes(o.id)), aps = S.appts.filter(a => m.appts.includes(a.id)), apps = S.apps.filter(a => m.apps.includes(a.id));
  const total = reqs.length + ords.length + aps.length + apps.length;
  const sec = (title, ic, rows) => rows.length ? `<section class="ac-sec"><h4>${icon(ic)} ${title}</h4>${rows.join('')}</section>` : '';
  openDrawer(`<div class="ac"><div class="ac-head"><span class="av lg">AK</span><div><b>Ayesha Khan</b><small>Customer · only you can see these records</small></div></div>
    ${total ? '' : `<div class="ac-empty">${icon('sparkles')}<b>Nothing here yet</b><p>Request a dress, a custom order, a fitting or a course and it will appear here with live status.</p></div>`}
    ${sec('Rental requests', 'gem', reqs.map(r => { const g = garment(r.g); return `<div class="ac-row"><div><b>${g.name}</b><small>${r.id} · ${fmtD(r.start)} – ${fmtD(r.end)}</small></div>${chip(r.status)}</div>`; }))}
    ${sec('Stitching orders', 'scissors', ords.map(o => `<div class="ac-row"><div><b>${esc(o.item)}</b><small>${o.id} · needed by ${fmtD(o.due)}</small></div>${chip(o.stage > 8 ? 'Confirmed' : 'Requested', STAGES[o.stage])}</div>`))}
    ${sec('Appointments', 'calendar', aps.map(a => `<div class="ac-row"><div><b>${APPT_TYPES.find(t => t.id === a.type).label}</b><small>${a.id} · ${longDate(a.date)}, ${a.time}</small></div>${chip(a.status)}</div>`))}
    ${sec('Course applications', 'graduation-cap', apps.map(a => `<div class="ac-row"><div><b>${COURSES.find(c => c.id === a.course).title}</b><small>${a.id} · ${fmtD(a.date)}</small></div>${chip(a.status)}</div>`))}
  </div>`);
}

/* ---------- nav & reveal ---------- */
function initNav() {
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('stuck', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  $('#burger').onclick = () => nav.classList.toggle('open');
  $$('#navLinks a, .nav-cta a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
  window._revealIO = io;
  $$('.reveal').forEach(el => io.observe(el));
}
