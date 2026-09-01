/*
  ui.js - UI-only behaviors extracted from index.html
  - ROI preview calculation
  - TVL animated counter
  - Live toast simulation (safe DOM updates)
  - Non-invasive: does not import app.js to avoid module resolution issues in current setup
*/

// Note: app.js is not exported as an ES module in this repository. To avoid breaking
// the current non-module load setup we do NOT import from './app.js'. If you later
// convert app.js to ESM and export init/open functions, you can re-add the import.

export function initUI() {
    // This function can be called after the DOM is ready and after app.js has run
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

    // Live toasts (mock activity) - build DOM safely to avoid innerHTML/XSS
    const toastContainer = document.getElementById('dynamicToast');
    const toastContent = document.getElementById('toastContent');
    const mockAddresses = ['0x71A...3a9F', '0x88B...F221', '0x12C...B4cc', '0x9aE...e31b', '0x3F2...9C11', '0x4c2...81aD'];
    const mockAmounts = ['400.00', '36.00', '30.00', '41.00', '15.00', '150.25', '520.50'];

    const showNextToast = () => {
        if (!toastContainer || !toastContent) return;
        const addr = mockAddresses[Math.floor(Math.random() * mockAddresses.length)];
        const amt = mockAmounts[Math.floor(Math.random() * mockAmounts.length)];

        // Clear previous content
        while (toastContent.firstChild) toastContent.removeChild(toastContent.firstChild);

        const topDiv = document.createElement('div');
        topDiv.style.fontSize = '0.9rem';

        const strongAddr = document.createElement('strong');
        strongAddr.style.color = '#fff';
        strongAddr.textContent = addr;

        const textNode = document.createTextNode(' invirtió ');

        const strongAmt = document.createElement('strong');
        strongAmt.style.color = 'var(--brand-primary)';
        strongAmt.textContent = `${amt} USDT`;

        topDiv.appendChild(strongAddr);
        topDiv.appendChild(textNode);
        topDiv.appendChild(strongAmt);

        const bottomDiv = document.createElement('div');
        bottomDiv.style.color = 'var(--text-muted)';
        bottomDiv.style.fontSize = '0.75rem';
        bottomDiv.style.marginTop = '2px';
        bottomDiv.textContent = 'Confirmado hace unos segundos en BSC';

        toastContent.appendChild(topDiv);
        toastContent.appendChild(bottomDiv);

        toastContainer.classList.remove('active');
        void toastContainer.offsetWidth;
        toastContainer.classList.add('active');
    };

    setTimeout(showNextToast, 2000);
    setInterval(showNextToast, 9000);
}

// Auto-initialize when module is loaded and DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        try { initUI(); } catch (e) { console.warn('initUI threw:', e); }
    });
} else {
    try { initUI(); } catch (e) { console.warn('initUI threw:', e); }
}
