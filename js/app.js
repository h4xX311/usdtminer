import { CONFIG } from './config.js';
import { createAppKit } from '@reown/appkit';
import { Ethers5Adapter } from '@reown/appkit-adapter-ethers5';
import { bsc } from '@reown/appkit/networks';

// ==========================================
// 1. CONFIGURACIÓN DE REOWN APPKIT v1.6.0 + ETHERS v5
// ==========================================
const projectId = CONFIG.PROJECT_ID; // Definido en tu config.js

const metadata = {
    name: CONFIG.APP_NAME || 'USDT Protocol DApp',
    description: 'Secure Investment & Yield Platform',
    url: window.location.origin,
    icons: [window.location.origin + '/favicon.ico']
};

const ethersAdapter = new Ethers5Adapter();

const modal = createAppKit({
    adapters: [ethersAdapter],
    networks: [bsc],
    defaultNetwork: bsc,
    metadata,
    projectId,
    features: {
        analytics: true,
        swaps: false,
        onramp: false
    }
});

window.modal = modal; // Exponer globalmente para botones de apertura/cierre

// ==========================================
// 2. VARIABLES GLOBALES DE ESTADO
// ==========================================
let provider = null;
let signer = null;
let userAddress = null;

// ==========================================
// 3. SINCRONIZACIÓN Y PROVEEDOR (ETHERS v5)
// ==========================================
async function handleConnectedProvider(walletProvider) {
    try {
        // Inicialización con Web3Provider de Ethers v5
        provider = new ethers.providers.Web3Provider(walletProvider);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();

        if (walletProvider && typeof walletProvider.on === "function") {
            walletProvider.removeAllListeners?.("disconnect");
            walletProvider.removeAllListeners?.("accountsChanged");

            walletProvider.on("disconnect", async () => {
                await forceCloseReownSession();
            });

            walletProvider.on("accountsChanged", async (accounts) => {
                if (!accounts || accounts.length === 0) {
                    await forceCloseReownSession();
                } else {
                    handleConnectedProvider(walletProvider);
                }
            });
        }

        updateWalletUI(userAddress);
        await updateBalances(walletProvider);
        updateMainActionButton('INVEST');
        validateInvestmentInput(); // Actualizar límites con saldo real
    } catch (error) {
        console.error("Error al sincronizar proveedor con Ethers v5:", error);
        resetAppSession();
    }
}

// Suscripción a cambios de estado en AppKit v1.6.0
modal.subscribeProvider(async (state) => {
    const { isConnected, provider: walletProvider } = state;
    if (isConnected && walletProvider) {
        await handleConnectedProvider(walletProvider);
    } else {
        resetAppSession();
    }
});

// Limpieza centralizada de sesión y caché local
async function forceCloseReownSession() {
    try {
        if (modal && typeof modal.disconnect === "function") {
            await modal.disconnect();
        }
    } catch (e) {
        console.warn("Error al cerrar sesión en AppKit:", e);
    }

    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.includes('wc@') || key.includes('w3m') || key.includes('reown') || key.includes('appkit'))) {
            localStorage.removeItem(key);
        }
    }

    resetAppSession();
}

window.disconnectWalletSession = async function() {
    await forceCloseReownSession();
    setTimeout(() => {
        window.location.reload();
    }, 200);
};

// ==========================================
// 4. GESTIÓN DE UI Y VALIDACIÓN DE INVERSIÓN
// ==========================================
function updateWalletUI(address) {
    const connectBtn = document.getElementById("connectWalletBtn");
    if (connectBtn && address) {
        const shortAddr = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
        connectBtn.textContent = shortAddr;
        connectBtn.classList.add("connected");
    }
}

function resetAppSession() {
    provider = null;
    signer = null;
    userAddress = null;
    
    const connectBtn = document.getElementById("connectWalletBtn");
    if (connectBtn) {
        connectBtn.textContent = "CONECTAR BILLETERA";
        connectBtn.classList.remove("connected");
    }

    const balanceLabel = document.getElementById("walletBalanceLabel");
    if (balanceLabel) balanceLabel.textContent = "0.00 USDT";

    updateMainActionButton('CONNECT');
    validateInvestmentInput();
}

function updateMainActionButton(state) {
    const btn = document.getElementById("approveBtn") || document.getElementById("actionBtn");
    if (!btn) return;
    
    const textSpan = btn.querySelector("#btnText") || btn;
    if (state === 'CONNECT') {
        textSpan.textContent = "CONECTAR BILLETERA";
        btn.onclick = () => modal.open();
    } else if (state === 'INVEST') {
        textSpan.textContent = "EJECUTAR INVERSIÓN";
        btn.onclick = () => runInvestmentFlow();
    }
}

// Validación de límites: Min 0.1 | Max 1000 (sin conectar) o Saldo Wallet (conectado)
function validateInvestmentInput() {
    const input = document.getElementById("investAmount");
    const balanceLabel = document.getElementById("walletBalanceLabel");
    const wrapper = input ? input.closest('.input-wrapper') : null;
    if (!input || !wrapper) return;

    const val = parseFloat(input.value) || 0;
    const match = balanceLabel ? balanceLabel.textContent.match(/[\d.]+/) : null;
    const walletBalance = match ? parseFloat(match[0]) : 0;

    const maxVal = (walletBalance > 0 && userAddress) ? walletBalance : 1000;

    if (val > maxVal || val < 0.1) {
        wrapper.classList.add('shake-error');
        setTimeout(() => wrapper.classList.remove('shake-error'), 500);
    } else {
        wrapper.classList.remove('shake-error');
    }
}

// Actualización de saldos con Ethers v5 (6 decimales para USDT)
async function updateBalances(walletProvider) {
    try {
        const tempProvider = new ethers.providers.Web3Provider(walletProvider);
        const tempSigner = tempProvider.getSigner();
        const account = await tempSigner.getAddress();

        const usdtContract = new ethers.Contract(
            CONFIG.USDT_CONTRACT,
            ["function balanceOf(address account) external view returns (uint256)"],
            tempSigner
        );

        const balanceWei = await usdtContract.balanceOf(account);
        const formattedBalance = ethers.utils.formatUnits(balanceWei, 6);

        const balanceLabel = document.getElementById("walletBalanceLabel");
        if (balanceLabel) {
            balanceLabel.textContent = `${parseFloat(formattedBalance).toFixed(2)} USDT`;
        }

        validateInvestmentInput();
    } catch (error) {
        console.error("Error al consultar saldo de USDT:", error);
    }
}

// ==========================================
// 5. FLUJO DE TRANSACCIÓN PRINCIPAL (EJEMPLO)
// ==========================================
async function runInvestmentFlow() {
    if (!signer) {
        modal.open();
        return;
    }

    const input = document.getElementById("investAmount");
    const amount = input ? input.value : "1.00";

    try {
        console.log(`Iniciando proceso para ${amount} USDT...`);
        // Conversión segura con Ethers v5 utils
        const amountInWei = ethers.utils.parseUnits(amount, 6);
        
        // Aquí ejecutas tu lógica de llamadas al contrato inteligente con Ethers v5
        alert(`Transacción simulada lista para procesar ${amount} USDT mediante Ethers v5.`);
    } catch (error) {
        console.error("Error en el flujo de inversión:", error);
    }
}

// ==========================================
// 6. INICIALIZACIÓN DE EVENTOS DEL DOM
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("investAmount");
    if (input) {
        input.addEventListener("input", validateInvestmentInput);
    }

    const maxBtn = document.getElementById("maxBtn");
    if (maxBtn) {
        maxBtn.addEventListener("click", () => {
            const balanceLabel = document.getElementById("walletBalanceLabel");
            const match = balanceLabel ? balanceLabel.textContent.match(/[\d.]+/) : null;
            const walletBalance = match ? match[0] : "1000";
            
            if (input && userAddress) {
                input.value = walletBalance;
                validateInvestmentInput();
            }
        });
    }

    const connectBtn = document.getElementById("connectWalletBtn");
    if (connectBtn) {
        connectBtn.addEventListener("click", () => {
            if (!userAddress) {
                modal.open();
            } else {
                modal.open({ view: 'Account' });
            }
        });
    }

    resetAppSession();
});
