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
    /* Panel styles (injected) */
    .ops-panel { display:flex; gap:20px; align-items:flex-start; }
    .ops-card { background: rgba(20,22,28,0.6); border:1px solid rgba(255,255,255,0.04); padding:18px; border-radius:12px; min-width:260px; box-shadow: 0 8px 24px rgba(0,0,0,0.6); }
    .ops-main { flex:1; }
    .ops-header { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:12px; }
    .ops-title { font-weight:800; font-size:1.15rem; }
    .ops-amount { font-weight:800; color:var(--brand-primary); font-size:1.25rem; }
    .ops-sub { color:var(--text-muted); font-size:0.9rem; }
    .ops-actions { display:flex; gap:8px; margin-top:12px; }
    .ops-btn { padding:10px 14px; border-radius:10px; border:none; cursor:pointer; font-weight:700; background:var(--brand-primary); color:#fff; }
    .ops-btn.ghost { background:transparent; border:1px solid rgba(255,255,255,0.06); color:var(--text-muted); }
    .history-list { margin-top:14px; display:flex; flex-direction:column; gap:10px; }
    .history-item { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:10px; background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); border-radius:10px; border:1px solid rgba(255,255,255,0.03); }
    .history-left { display:flex; flex-direction:column; }
    .history-amount { font-weight:800; color:#fff; }
    .history-meta { color:var(--text-muted); font-size:0.85rem; }
    .withdraw-btn { padding:8px 12px; border-radius:8px; border:none; cursor:pointer; font-weight:700; background:#1f6b52; color:#fff; }
    .withdraw-btn[disabled] { opacity:0.5; cursor:not-allowed; background:rgba(255,255,255,0.04); color:var(--text-muted); }
    .countdown { font-weight:700; color:var(--brand-primary); }
    .empty { color:var(--text-muted); font-size:0.95rem; text-align:center; padding:18px 0; }
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
    const title = document.createElement('div'); title.className = 'ops-title'; title.textContent = 'Panel de Operaciones';
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

    actions.appendChild(investBtn);
    actions.appendChild(withdrawAllBtn);

    // Balance row
    const balancesRow = document.createElement('div'); balancesRow.style.display='flex'; balancesRow.style.justifyContent='space-between'; balancesRow.style.marginTop='10px';
    const availableLabel = document.createElement('div'); availableLabel.className='ops-sub'; availableLabel.textContent='Disponible:';
    const availableAmount = document.createElement('div'); availableAmount.id='ops-available-amount'; availableAmount.className='ops-sub'; availableAmount.style.fontWeight=700; availableAmount.textContent='$0.00';
    balancesRow.appendChild(availableLabel); balancesRow.appendChild(availableAmount);

    // History
    const historyTitle = document.createElement('div'); historyTitle.className='ops-sub'; historyTitle.style.marginTop='14px'; historyTitle.textContent='Historial de Inversiones';
    const historyList = document.createElement('div'); historyList.className='history-list'; historyList.id='ops-history-list';

    leftCard.appendChild(header);
    leftCard.appendChild(totalAmount);
    leftCard.appendChild(meta);
    leftCard.appendChild(actions);
    leftCard.appendChild(balancesRow);
    leftCard.appendChild(historyTitle);
    leftCard.appendChild(historyList);

    // Right: small stats card
    const rightCard = document.createElement('div'); rightCard.className = 'ops-card';
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
  function makeHistoryItemDOM(item){
    const el = document.createElement('div'); el.className='history-item'; el.dataset.id = item.id;
    const left = document.createElement('div'); left.className='history-left';
    const amount = document.createElement('div'); amount.className='history-amount'; amount.textContent = `$${formatUSD(item.amount)}`;
    const meta = document.createElement('div'); meta.className='history-meta'; meta.textContent = new Date(item.createdAt).toLocaleString();
    left.appendChild(amount); left.appendChild(meta);

    const right = document.createElement('div'); right.style.display='flex'; right.style.flexDirection='column'; right.style.alignItems='flex-end'; right.style.gap='6px';
    const cd = document.createElement('div'); cd.className='countdown'; cd.dataset.unlockAt = item.unlockAt; cd.textContent = timeLeftText(item.unlockAt);
    const btn = document.createElement('button'); btn.className='withdraw-btn'; btn.textContent = item.withdrawn ? 'Retirado' : 'Retirar';
    if (item.withdrawn) btn.disabled = true;
    if (now() < item.unlockAt) btn.disabled = true;
    btn.addEventListener('click', () => handleWithdraw(item.id));

    right.appendChild(cd); right.appendChild(btn);

    el.appendChild(left); el.appendChild(right);

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
    const totalEl = document.getElementById('ops-total-amount');
    const availEl = document.getElementById('ops-available-amount');
    const listEl = document.getElementById('ops-history-list');
    if (totalEl) totalEl.textContent = '$' + formatUSD(total);
    if (availEl) availEl.textContent = '$' + formatUSD(available);
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

  function handleWithdraw(id){
    const items = loadInvestments();
    const idx = items.findIndex(i=>i.id===id); if (idx<0) return;
    const it = items[idx];
    if (it.withdrawn) return showQuickToast('Ya fue retirado', 'error');
    if (now() < it.unlockAt) return showQuickToast('Aún en periodo de bloqueo', 'error');
    // Mark withdrawn
    items[idx].withdrawn = true; saveInvestments(items); renderAll();
    showQuickToast(`Retiraste $${formatUSD(it.amount)}`, 'success');
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
    renderAll();
    startCountdownTicker();
    // Expose for debugging
    window.__usdtminer_ops = { renderAll, loadInvestments, saveInvestments };
  }

  // Auto-init when DOM ready
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
