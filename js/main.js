/* ---------- mode switch, bell, reset, boot ---------- */
function setMode(m, silent) {
  const prev = document.body.dataset.mode;
  document.body.dataset.mode = m;
  $('#site').hidden = m !== 'customer'; $('#admin').hidden = m !== 'admin';
  $$('#mode button').forEach(b => { const on = b.dataset.mode === m; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  moveHl();
  closeModal(); closeDrawer();
  window.scrollTo(0, 0);
  if (m === 'admin') {
    renderAdmin();
    if (S.unread && !silent) toast(`<b>${S.unread} new item${S.unread > 1 ? 's' : ''}</b> arrived from the customer site. They are highlighted.`, 'ok', 'bell');
    S.unread = 0; syncBadges();
  } else if (prev === 'admin') { renderCustomerDynamic(); }
  history.replaceState(null, '', m === 'admin' ? '#admin' : location.pathname);
}
function moveHl() {
  const on = $('#mode button.on'), hl = $('#modeHl'); if (!on) return;
  hl.style.width = on.offsetWidth + 'px'; hl.style.transform = `translateX(${on.offsetLeft - 5}px)`;
}
window.addEventListener('resize', moveHl);

document.addEventListener('DOMContentLoaded', () => {
  hydrate();
  initCustomer(); initNav();
  renderCustomerDynamic();
  hydrate();
  $$('#mode button').forEach(b => b.onclick = () => setMode(b.dataset.mode));
  $('#bell').onclick = () => { S.unread = 0; syncBadges(); openDrawer(`<div class="ac"><div class="ac-head"><span class="av lg">${icon('bell')}</span><div><b>Notifications</b><small>Latest activity across the studio</small></div></div>${feed(12)}</div>`); };
  $('#resetDemo').onclick = () => { seedState(); ADM.tab = 'Pending'; CUST.trackCode = 'SFI-1042'; $('#trackIn').value = 'SFI-1042'; refresh(); renderAdmin(); toast('Demo data reset to its starting state.', 'ok', 'refresh-cw'); };
  $('#admBurger').onclick = () => { $('#side').classList.add('open'); $('#sideScrim').classList.add('show'); };
  $('#sideScrim').onclick = () => { $('#side').classList.remove('open'); $('#sideScrim').classList.remove('show'); };
  $('#admSearch').oninput = e => { ADM.q = e.target.value.trim().toLowerCase(); if (ADM.q && ADM.view === 'overview') go('rentals'); else renderAdmin(); };
  document.fonts && document.fonts.ready.then(moveHl);
  setTimeout(moveHl, 50);
  if (location.hash === '#admin') setMode('admin', true);
});
