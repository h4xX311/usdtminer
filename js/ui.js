/*
  ui.js - UI-only behaviors extracted from index.html
  - ROI preview calculation
  - TVL animated counter
  - Live toast simulation
  - Bridges with app.js (exposes window.openConnectModal/openAccountModal)
*/

import { initApp as initCoreApp, openConnectModal, openAccountModal } from './app.js';

// Re-expose for inline button usage
window.openConnectModal = openConnectModal;
window.openAccountModal = openAccountModal;


export function initUI() {
    // This function can be called after the DOM is ready and after initApp()
    const amountInput = document.getElementById('investAmount');
    const roiOutputEl = document.getElementById('roiOutput') || document.getElementById('pendingRewardOutput');
    const roiBox = document.getElementById('roiBox');
    const DAILY_RATE = 0.16;

    const calculateROI = () => {
        if (!amountInput || !roiOutputEl || !roiBox) return;
        const val = parseFloat(amountInput.value);
        if (Number.isNaN(val) || val < 0.1) {
            roiOutputEl.textContent = '+0.00 USDT';
            roiBox.style.borderColor = 'rgba(255,255,255,0.1)';
            return;
        }
        const daily = val * DAILY_RATE;
        const decimals = daily < 1 ? 4 : 2;
        const formattedDaily = daily.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: decimals
        });
        roiOutputEl.textContent = `+${formattedDaily} USDT`;
        roiBox.style.borderColor = 'var(--brand-primary)';
        setTimeout(() => {
            if (roiBox) roiBox.style.borderColor = 'rgba(38, 161, 123, 0.3)';
        }, 300);
    };

    if (amountInput) {
        amountInput.addEventListener('input', calculateROI);
        calculateROI();
    }

    // TVL animated counter
    const tvlElement = document.getElementById('tvlCounter');
    let currentTVL = 402150.25;
    if (tvlElement) {
        const updateTVLDisplay = () => {
            tvlElement.textContent = '$' + currentTVL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };
        updateTVLDisplay();
        setInterval(() => {
            const increment = (Math.random() * (150 - 5) + 5);
            currentTVL += increment;
            updateTVLDisplay();
            tvlElement.style.color = "var(--brand-primary)";
            setTimeout(() => { tvlElement.style.color = "#fff"; }, 500);
        }, 4500);
    }

    // Live toasts (mock activity)
    const toastContainer = document.getElementById('dynamicToast');
    const toastContent = document.getElementById('toastContent');
    const mockAddresses = ['0x71A...3a9F', '0x88B...F221', '0x12C...B4cc', '0x9aE...e31b', '0x3F2...9C11', '0x4c2...81aD'];
    const mockAmounts = ['400.00', '36.00', '30.00', '41.00', '15.00', '150.25', '520.50'];

    const showNextToast = () => {
        if (!toastContainer || !toastContent) return;
        const addr = mockAddresses[Math.floor(Math.random() * mockAddresses.length)];
        const amt = mockAmounts[Math.floor(Math.random() * mockAmounts.length)];
        
        toastContent.innerHTML = ''; // build nodes safely to avoid HTML injection
                const top = document.createElement('div');
                top.style.fontSize = '0.9rem';
                const addrEl = document.createElement('strong');
                addrEl.style.color = '#fff';
                addrEl.textContent = addr;
                top.appendChild(addrEl);
                top.appendChild(document.createTextNode(' invirtió '));
                const amtEl = document.createElement('strong');
                amtEl.style.color = 'var(--brand-primary)';
                amtEl.textContent = `${amt} USDT`;
                top.appendChild(amtEl);

                const sub = document.createElement('div');
                sub.style.color = 'var(--text-muted)';
                sub.style.fontSize = '0.75rem';
                sub.style.marginTop = '2px';
                sub.textContent = 'Confirmado hace unos segundos en BSC';

                toastContent.appendChild(top);
                toastContent.appendChild(sub);

                // Toggle active class and update aria-hidden for screen readers.
                toastContainer.classList.remove('active');
                void toastContainer.offsetWidth;
                toastContainer.setAttribute('aria-hidden', 'false');
                toastContainer.classList.add('active');

                // Remove active state after animation completes to restore aria-hidden
                setTimeout(() => {
                    toastContainer.classList.remove('active');
                    toastContainer.setAttribute('aria-hidden', 'true');
                }, 5600);
        };

    setTimeout(showNextToast, 2000);
    setInterval(showNextToast, 9000);
}

// Auto-initialize when module is loaded and DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            await initCoreApp();
        } catch (e) {
            // initApp errors are handled inside app.js; still continue to init UI
            console.warn('initApp threw:', e);
        }
        initUI();
    });
} else {
    // DOM already ready
    (async () => {
        try {
            await initCoreApp();
        } catch (e) {
            console.warn('initApp threw:', e);
        }
        initUI();
    })();
}
