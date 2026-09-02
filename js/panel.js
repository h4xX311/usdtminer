// panel.js — Builds a professional Operations Panel inside the .dapp-widget
(function () {
  // Configuration
  const STORAGE_KEY = 'usdtminer_investments_v1';
  const LOCK_PERIOD_MS = (function(){
    // Default 5 days; for quick demo, append ?demo=1 to URL to use 30 seconds
    const url = new URL(window.location.href);
    if (url.searchParams.get('demo') === '1') return 30 * 1000;
    return 5 * 24 * 60 * 60 * 1000; // 5 days
  })();

  function formatUSD(value){
    return Number(value).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
  }

  function now(){ return Date.now(); }

  function loadInvestments(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch(e){ console.warn('loadInvestments failed', e); return []; }
  }
  function saveInvestments(items){ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }

  function createStyles(){
    const css = `
    /* Panel styles (injected) - responsive, accessible */
    .ops-panel { display:flex; flex-direction:column; gap:14px; align-items:stretch; }
    .ops-card { background: rgba(20,22,28,0.6); border:1px solid rgba(255,255,255,0.04); padding:16px; border-radius:12px; box-shadow: 0 6px 18px rgba(2,6,23,0.6); transition:transform .18s ease, box-shadow .18s ease; }
    .ops-card:focus-within, .ops-card:hover { transform:translateY(-4px); box-shadow: 0 14px 30px rgba(2,6,23,0.7); }
    .ops-main { width:100%; }
    .ops-header { display:flex; flex-direction:row; justify-content:space-between; align-items:center; gap:8px; margin-bottom:10px; }
    .ops-title { font-weight:800; font-size:1.05rem; letter-spacing:0.2px; display:flex; align-items:center; gap:8px; }
    .ops-amount { font-weight:900; color:var(--brand-primary); font-size:1.35rem; }
    .ops-sub { color:var(--text-muted); font-size:0.88rem; }
    .ops-actions { display:flex; gap:8px; margin-top:10px; flex-wrap:wrap; }
    .ops-btn { padding:10px 14px; border-radius:10px; border:none; cursor:pointer; font-weight:700; background:var(--brand-primary); color:#fff; box-shadow: 0 6px 18px rgba(38,161,123,0.12); transition:opacity .12s ease, transform .12s ease; display:inline-flex; align-items:center; gap:8px; }
    .ops-btn:active { transform:translateY(1px); }
    .ops-btn:focus-visible { outline: 3px solid rgba(38,161,123,0.16); outline-offset: 3px; }
    .ops-btn.ghost { background:transparent; border:1px solid rgba(255,255,255,0.06); color:var(--text-muted); }
    .history-list { margin-top:12px; display:flex; flex-direction:column; gap:10px; }
    .history-list.scrollable { max-height:420px; overflow:auto; padding-right:6px; }
    /* Compact mode */
    .history-list.compact { gap:6px; }
    .history-list.compact .history-item { padding:8px; }
    .history-list.compact .history-amount { font-size:0.92rem; }
    .history-item { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:12px; background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); border-radius:10px; border:1px solid rgba(255,255,255,0.03); cursor:pointer; }
    .history-item:focus { outline:2px solid rgba(38,161,123,0.12); }
    .history-left { display:flex; flex-direction:column; min-width:0; }
    .history-amount { font-weight:800; color:#fff; font-size:1rem; display:flex; align-items:center; gap:8px; }
    .history-meta { color:var(--text-muted); font-size:0.82rem; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; max-width:220px; }
    .history-details { display:none; margin-top:8px; color:var(--text-muted); font-size:0.82rem; }
    .history-item.expanded .history-details { display:block; }
    .withdraw-btn { padding:8px 12px; border-radius:8px; border:none; cursor:pointer; font-weight:700; background:#1f6b52; color:#fff; display:inline-flex; align-items:center; gap:8px; }
    .withdraw-btn[disabled] { opacity:0.55; cursor:not-allowed; background:rgba(255,255,255,0.04); color:var(--text-muted); }
    .countdown { font-weight:700; color:var(--brand-primary); font-size:0.95rem; }
    .empty { color:var(--text-muted); font-size:0.95rem; text-align:center; padding:18px 0; }

    /* Skeleton loaders */
    .history-list.loading { opacity: 0.95; }
    .history-skeleton { display:flex; flex-direction:column; gap:8px; padding:6px 0; }
    .history-skeleton .skeleton-item { height:48px; border-radius:8px; background: linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.06), rgba(255,255,255,0.02)); background-size:200% 100%; animation: shimmer 1.4s linear infinite; }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

    /* Responsive layout: two-column on wide screens */
    @media (min-width: 880px) {
      .ops-panel { flex-direction:row; }
      .ops-main { flex:1 1 0; }
      .ops-card { min-width:0; }
      .ops-card.right { width:320px; flex:0 0 320px; }
    }
    `;
    const style = document.createElement('style');
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  function buildPanel(container){
    // Clear container
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'ops-panel';

    // Left: summary + actions
    const leftCard = document.createElement('div');
    leftCard.className = 'ops-card ops-main';

    const header = document.createElement('div'); header.className = 'ops-header';
    const title = document.createElement('div'); title.className = 'ops-title';
    const titleText = document.createElement('span'); titleText.textContent = 'Panel de Operaciones';
    try { title.prepend(createIcon('tx')); } catch(e){}
    title.appendChild(titleText);
    const totalLabel = document.createElement('div'); totalLabel.className = 'ops-sub'; totalLabel.textContent = 'Total Invertido';
    header.appendChild(title);
    header.appendChild(totalLabel);

    const totalAmount = document.createElement('div'); totalAmount.className = 'ops-amount'; totalAmount.id = 'ops-total-amount'; totalAmount.textContent = '$0.00';
    const meta = document.createElement('div'); meta.className = 'ops-sub'; meta.textContent = 'Disponible y en bloqueo';

    const actions = document.createElement('div'); actions.className = 'ops-actions';
    const investBtn = document.getElementById('approveBtn') || document.createElement('button');
    investBtn.classList.add('ops-btn');
    investBtn.id = 'ops-invest-btn';
    // If original approveBtn exists, reuse its label and keep it in DOM — otherwise use new
    if (investBtn.tagName !== 'BUTTON') { investBtn.textContent = 'INVERTIR AHORA'; }

    const withdrawAllBtn = document.createElement('button'); withdrawAllBtn.className = 'ops-btn ghost'; withdrawAllBtn.textContent = 'Retirar Disponibles'; withdrawAllBtn.id = 'ops-withdraw-all';

    const compactBtn = document.createElement('button'); compactBtn.className = 'ops-btn ghost'; compactBtn.textContent = 'Compacto'; compactBtn.id = 'ops-compact-toggle';

    // Add small SVG icons
    try { if (investBtn && typeof investBtn.insertBefore === 'function') investBtn.prepend(createIcon('rocket')); } catch(e){}
    try { withdrawAllBtn.prepend(createIcon('wallet')); } catch(e){}
    try { compactBtn.prepend(createIcon('tx')); } catch(e){}

    actions.appendChild(investBtn);
    actions.appendChild(withdrawAllBtn);
    actions.appendChild(compactBtn);

    // Balance row
    const balancesRow = document.createElement('div'); balancesRow.style.display='flex'; balancesRow.style.justifyContent='space-between'; balancesRow.style.marginTop='10px';
    const availableLabel = document.createElement('div'); availableLabel.className='ops-sub'; availableLabel.textContent='Disponible:';
    const availableAmount = document.createElement('div'); availableAmount.id='ops-available-amount'; availableAmount.className='ops-sub'; availableAmount.style.fontWeight=700; availableAmount.textContent='$0.00';
    balancesRow.appendChild(availableLabel); balancesRow.appendChild(availableAmount);

    // History
    const historyTitle = document.createElement('div'); historyTitle.className='ops-sub'; historyTitle.style.marginTop='14px'; historyTitle.textContent='Historial de Inversiones';
    const historyList = document.createElement('div'); historyList.className='history-list scrollable'; historyList.id='ops-history-list';

    leftCard.appendChild(header);
    leftCard.appendChild(totalAmount);
    leftCard.appendChild(meta);
    leftCard.appendChild(actions);
    leftCard.appendChild(balancesRow);

    // Pending rewards row
    const pendingRow = document.createElement('div'); pendingRow.style.display='flex'; pendingRow.style.justifyContent='space-between'; pendingRow.style.marginTop='8px';
    const pendingLabel = document.createElement('div'); pendingLabel.className='ops-sub'; pendingLabel.textContent='Recompensas Est.';
    const pendingAmount = document.createElement('div'); pendingAmount.id='ops-pending-amount'; pendingAmount.className='ops-sub'; pendingAmount.style.fontWeight=700; pendingAmount.textContent='$0.00';
    pendingRow.appendChild(pendingLabel); pendingRow.appendChild(pendingAmount);
    leftCard.appendChild(pendingRow);

    leftCard.appendChild(historyTitle);
    leftCard.appendChild(historyList);

    // Apply compact preference if present
    const COMPACT_KEY = 'usdtminer_ops_history_compact_v1';
    const compactPref = (function(){ try { return localStorage.getItem(COMPACT_KEY) === '1'; } catch(e){ return false; } })();
    if (compactPref) historyList.classList.add('compact');

    // Compact toggle handler
    compactBtn.addEventListener('click', () => {
      const isCompact = historyList.classList.toggle('compact');
      try { localStorage.setItem(COMPACT_KEY, isCompact ? '1' : '0'); } catch(e){}
      compactBtn.textContent = isCompact ? 'Compacto (ON)' : 'Compacto';
    });

    // Right: small stats card
    const rightCard = document.createElement('div'); rightCard.className = 'ops-card right';
    const rcTitle = document.createElement('div'); rcTitle.className='ops-title'; rcTitle.textContent='Detalles';
    const rcList = document.createElement('div'); rcList.style.marginTop='10px';
    const li1 = document.createElement('div'); li1.className='ops-sub'; li1.textContent='Retorno estimado: 16% cada 5 días';
    const li2 = document.createElement('div'); li2.className='ops-sub'; li2.textContent='Red: BNB Smart Chain';
    const li3 = document.createElement('div'); li3.className='ops-sub'; li3.textContent='Contrato: 0x8e18...';
    rcList.appendChild(li1); rcList.appendChild(li2); rcList.appendChild(li3);
    rightCard.appendChild(rcTitle); rightCard.appendChild(rcList);

    wrapper.appendChild(leftCard); wrapper.appendChild(rightCard);

    container.appendChild(wrapper);

    // Hook buttons
    investBtn.addEventListener('click', handleInvestClick);
    withdrawAllBtn.addEventListener('click', handleWithdrawAll);

    return { totalAmount, availableAmount, historyList };
  }

  // Create a single history DOM item
  function createIcon(name, size=16){
    // returns an inline SVG element for a small set of icons
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns,'svg'); svg.setAttribute('width', size); svg.setAttribute('height', size); svg.setAttribute('viewBox','0 0 24 24'); svg.setAttribute('aria-hidden','true'); svg.style.display='inline-block'; svg.style.verticalAlign='middle';
    const path = document.createElementNS(ns,'path'); path.setAttribute('fill','currentColor');
    if (name === 'rocket') path.setAttribute('d','M12 2c-.6 0-1.2.2-1.7.6L8.2 4.9 6.1 7 4.6 8.5c-.6.6-.6 1.6 0 2.2l2.1 2.1 2.3-2.3 2.3-2.3 2.1 2.1c.6.6 1.6.6 2.2 0L19 11.9l1.3-1.3c.4-.4.6-1 .6-1.7 0-2.2-1.8-4-4-4z');
    else if (name === 'wallet') path.setAttribute('d','M2 7v10c0 1.1.9 2 2 2h16v-2H4V7H2zm20-2h-4l-2-2H6c-1.1 0-2 .9-2 2v2h18V5z');
    else if (name === 'tx') path.setAttribute('d','M10 2v2H3v14h18V8h-7V6h7V2z');
    else path.setAttribute('d','M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z');
    svg.appendChild(path);
    return svg;
  }

  function makeHistoryItemDOM(item){
    const el = document.createElement('div'); el.className='history-item'; el.dataset.id = item.id; el.tabIndex = 0; el.setAttribute('role','button'); el.setAttribute('aria-expanded','false');
    const left = document.createElement('div'); left.className='history-left';
    const amount = document.createElement('div'); amount.className='history-amount'; amount.textContent = `$${formatUSD(item.amount)}`;
    const meta = document.createElement('div'); meta.className='history-meta'; meta.textContent = new Date(item.createdAt).toLocaleString();
    left.appendChild(amount); left.appendChild(meta);

      // Details collapsed by default
      const details = document.createElement('div'); details.className='history-details';
      if (item.txHash) {
        const txLink = document.createElement('a');
        txLink.href = (window.APP_CONFIG && window.APP_CONFIG.BLOCK_EXPLORER ? window.APP_CONFIG.BLOCK_EXPLORER.replace(/\/$/, '') : 'https://bscscan.com') + `/tx/${item.txHash}`;
        txLink.target = '_blank'; txLink.rel = 'noopener noreferrer';
        txLink.className = 'history-meta';
        txLink.style.display='block'; txLink.style.marginTop='6px';
        txLink.textContent = `Tx: ${item.txHash.slice(0,8)}...`;
        details.appendChild(txLink);
      } else {
        const info = document.createElement('div'); info.className='history-meta'; info.textContent = 'No hay transacción aún.'; details.appendChild(info);
      }

      left.appendChild(details);

      const right = document.createElement('div'); right.style.display='flex'; right.style.flexDirection='column'; right.style.alignItems='flex-end'; right.style.gap='6px';
      const cd = document.createElement('div'); cd.className='countdown'; cd.dataset.unlockAt = item.unlockAt; cd.textContent = timeLeftText(item.unlockAt);
      const btn = document.createElement('button'); btn.className='withdraw-btn'; btn.textContent = item.withdrawn ? 'Retirado' : 'Retirar';
      if (item.withdrawn) btn.disabled = true;
      if (now() < item.unlockAt) btn.disabled = true;
      btn.addEventListener('click', (e) => { e.stopPropagation(); handleWithdraw(item.id); });

      right.appendChild(cd); right.appendChild(btn);

      el.appendChild(left); el.appendChild(right);

      // Toggle expand on click/keyboard
      function toggleExpanded(){
        const expanded = el.classList.toggle('expanded');
        el.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      }
      el.addEventListener('click', toggleExpanded);
      el.addEventListener('keydown', (ev)=>{ if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggleExpanded(); } });

      return el;
    }

  function timeLeftText(unlockAt){
    const diff = unlockAt - now();
    if (diff <= 0) return 'Disponible ahora';
    const s = Math.floor(diff/1000);
    const d = Math.floor(s / 86400); const h = Math.floor((s % 86400) / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60;
    if (d>0) return `${d}d ${h}h`;
    if (h>0) return `${h}h ${m}m`;
    if (m>0) return `${m}m ${sec}s`;
    return `${sec}s`;
  }

  // State and render
  function renderAll() {
    const items = loadInvestments();
    const total = items.reduce((s,i)=> s + (i.withdrawn?0:Number(i.amount)), 0);
    const available = items.reduce((s,i)=> s + ((i.withdrawn || now()<i.unlockAt)?0:Number(i.amount)), 0);

      // Estimate pending rewards naively as 16% of active amounts (per lock period)
      const pendingRewards = items.reduce((s,i)=> s + (i.withdrawn ? 0 : Number(i.amount) * 0.16), 0);

      const totalEl = document.getElementById('ops-total-amount');
      const availEl = document.getElementById('ops-available-amount');
      const pendingEl = document.getElementById('ops-pending-amount');
      const listEl = document.getElementById('ops-history-list');
      if (totalEl) totalEl.textContent = '$' + formatUSD(total);
      if (availEl) availEl.textContent = '$' + formatUSD(available);
      if (pendingEl) pendingEl.textContent = '$' + formatUSD(pendingRewards);

      if (listEl){
        listEl.innerHTML = '';
        if (!items.length) {
          const empty = document.createElement('div'); empty.className='empty'; empty.textContent='No hay inversiones registradas aún.'; listEl.appendChild(empty);
        }
        items.slice().reverse().forEach(it=>{
          listEl.appendChild(makeHistoryItemDOM(it));
        });
      }
    }

  function handleInvestClick(evt){
    // Read investAmount input
    const input = document.getElementById('investAmount');
    if (!input) return showQuickToast('No se encontró el campo de monto', 'error');
    const val = parseFloat(input.value);
    if (Number.isNaN(val) || val < 0.1) return showQuickToast('Monto mínimo 0.1 USDT', 'error');
    // create entry
    const items = loadInvestments();
    const id = 'inv_' + Math.random().toString(36).slice(2,9);
    const createdAt = now();
    const unlockAt = createdAt + LOCK_PERIOD_MS;
    const entry = { id, amount: Number(val), createdAt, unlockAt, withdrawn:false };
    items.push(entry); saveInvestments(items);
    renderAll();
    showQuickToast(`Inversión de $${formatUSD(val)} registrada`, 'success');
    // Optionally reset input or leave
  }

  async function handleWithdraw(id){
    const items = loadInvestments();
    const idx = items.findIndex(i=>i.id===id); if (idx<0) return;
    const it = items[idx];
    if (it.withdrawn) return showQuickToast('Ya fue retirado', 'error');
    if (now() < it.unlockAt) return showQuickToast('Aún en periodo de bloqueo', 'error');

      showQuickToast('Iniciando retiro…', 'default', 6000);
      try {
        if (typeof window.__usdtminer_withdraw === 'function') {
          const res = await window.__usdtminer_withdraw(id, it.amount);
          const txHash = res?.hash || res?.txHash || '';
          items[idx].withdrawn = true;
          if (txHash) items[idx].txHash = txHash;
          saveInvestments(items);
          renderAll();
          showQuickToast(`Retiraste $${formatUSD(it.amount)}${txHash ? ' — transacción enviada' : ''}`, 'success', 8000);
        } else {
          // Fallback: local-only withdraw (no backend)
          items[idx].withdrawn = true; saveInvestments(items); renderAll();
          showQuickToast(`Retiraste $${formatUSD(it.amount)}`, 'success');
        }
      } catch (e) {
        console.error('Withdraw failed', e);
        showQuickToast('Error al retirar fondos', 'error');
      }
    }

  function handleWithdrawAll(){
    const items = loadInvestments();
    let changed=false; let amount=0;
    for (let it of items){ if (!it.withdrawn && now()>=it.unlockAt){ it.withdrawn=true; changed=true; amount+=Number(it.amount); } }
    if (!changed) return showQuickToast('No hay fondos disponibles para retirar', 'error');
    saveInvestments(items); renderAll(); showQuickToast(`Retiraste $${formatUSD(amount)}`, 'success');
  }

  // Update countdown timers periodically
  function startCountdownTicker(){
    setInterval(()=>{
      const cds = document.querySelectorAll('.countdown');
      cds.forEach(cd=>{ const unlock = Number(cd.dataset.unlockAt)||0; cd.textContent = timeLeftText(unlock); const btn = cd.parentElement.querySelector('button'); if(btn && !btn.disabled){ /* noop */ } if (btn && now()>=unlock && !cd.parentElement.querySelector('button').disabled && !cd.parentElement.querySelector('button').dataset._enabled){ /*enable*/ }
        if (btn && !btn.disabled && btn.textContent==='Retirar' && now()<unlock) btn.disabled=true;
        if (btn && btn.disabled && now()>=unlock && cd.parentElement.querySelector('button').textContent==='Retirar') btn.disabled=false;
      });
      // Also refresh totals
      renderAll();
    }, 1000);
  }

  // Small toast utility (reuses #toast if present)
  function showQuickToast(msg, type='default', ms=3500){
    const toast = document.getElementById('toast');
    if (!toast){ alert(msg); return; }
      // Use textContent to avoid injecting HTML
      toast.textContent = msg;
      toast.hidden=false;
      toast.dataset.type = type==='success' ? 'success' : (type==='error' ? 'error' : '');
      clearTimeout(window._ops_toast_timer);
      window._ops_toast_timer = setTimeout(()=>{ toast.hidden=true; }, ms);
    }

  // Init
  function init(){
    createStyles();
    const container = document.querySelector('.dapp-widget');
    if (!container) return console.warn('No se encontró .dapp-widget para montar el panel');
    // Build and hook
    buildPanel(container);

    // Show skeleton loader for perceived performance
    const historyList = document.getElementById('ops-history-list');
    if (historyList) {
      historyList.innerHTML = '';
      historyList.classList.add('loading');
      historyList.setAttribute('aria-busy','true');
      const sk = document.createElement('div'); sk.className = 'history-skeleton';
      for (let i=0;i<4;i++){ const si = document.createElement('div'); si.className='skeleton-item'; sk.appendChild(si); }
      historyList.appendChild(sk);
    }

    // Small delay to reduce jank and animate skeleton; then render real content
    setTimeout(()=>{
      if (historyList) { historyList.classList.remove('loading'); historyList.removeAttribute('aria-busy'); }
      renderAll();
      startCountdownTicker();
    }, 450);

    // Expose for debugging
    window.__usdtminer_ops = { renderAll, loadInvestments, saveInvestments, withdraw: handleWithdraw };
  }

  // Auto-init when DOM ready
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
