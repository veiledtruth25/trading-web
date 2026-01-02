// Cache management
let cachedData = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 menit cache untuk avoid duplicate fetch

// DOM Elements
const elements = {
    connectionStatus: document.getElementById('connection-status'),
    lastUpdate: document.getElementById('last-update'),
    accountLogin: document.getElementById('account-login'),
    accountServer: document.getElementById('account-server'),
    balance: document.getElementById('balance'),
    equity: document.getElementById('equity'),
    profit: document.getElementById('profit'),
    freeMargin: document.getElementById('free-margin'),
    marginUsed: document.getElementById('margin-used'),
    marginLevel: document.getElementById('margin-level'),
    refreshBtn: document.getElementById('refresh-btn')
};

// Format currency
function formatCurrency(value, symbol = CONFIG.CURRENCY_SYMBOL) {
    return `${symbol}${value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Update status
function setStatus(status) {
    elements.connectionStatus.className = `status ${status}`;
    elements.connectionStatus.textContent = status === 'online' ? 'Connected' :
        status === 'loading' ? 'Loading...' : 'Disconnected';
}

// Fetch account data
async function fetchAccountData(forceRefresh = false) {
    const now = Date.now();

    // Use cache if available and not expired
    if (!forceRefresh && cachedData && (now - lastFetchTime) < CACHE_DURATION) {
        return cachedData;
    }

    setStatus('loading');
    elements.refreshBtn.disabled = true;

    try {
        // Add timestamp to bypass GitHub CDN cache when force refresh
        const url = forceRefresh ?
            `${CONFIG.DATA_URL}?t=${now}` :
            CONFIG.DATA_URL;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        cachedData = data;
        lastFetchTime = now;

        setStatus('online');
        updateUI(data);
        return data;

    } catch (error) {
        console.error('Failed to fetch data:', error);
        setStatus('offline');

        // Show error in UI
        elements.lastUpdate.textContent = `Error: ${error.message}`;
        return null;

    } finally {
        elements.refreshBtn.disabled = false;
    }
}

// Update UI with data
function updateUI(data) {
    if (!data || !data.account) return;

    const account = data.account;

    // Account info
    elements.accountLogin.textContent = account.login;
    elements.accountServer.textContent = account.server;

    // Main cards
    elements.balance.textContent = formatCurrency(account.balance);
    elements.equity.textContent = formatCurrency(account.equity);

    // Profit with color
    const profitValue = account.profit;
    elements.profit.textContent = formatCurrency(profitValue);
    elements.profit.className = `card-value ${profitValue >= 0 ? 'positive' : 'negative'}`;

    elements.freeMargin.textContent = formatCurrency(account.free_margin);

    // Margin info
    elements.marginUsed.textContent = formatCurrency(account.margin);
    elements.marginLevel.textContent = `${account.margin_level.toFixed(2)}%`;

    // Last update
    elements.lastUpdate.textContent = `Last update: ${formatDate(data.last_updated)}`;
}

// Event listeners
elements.refreshBtn.addEventListener('click', () => {
    fetchAccountData(true); // Force refresh
});

// Initial load
fetchAccountData();

// Auto refresh
setInterval(() => {
    fetchAccountData(true);
}, CONFIG.REFRESH_INTERVAL);
