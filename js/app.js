// State
let cachedData = null;
let lastFetchTime = 0;
let currentView = 'tabs';
let selectedAccountId = null;
const CACHE_DURATION = 60000;

// DOM Elements
const elements = {
    connectionStatus: document.getElementById('connection-status'),
    lastUpdate: document.getElementById('last-update'),
    refreshBtn: document.getElementById('refresh-btn'),
    // View elements
    viewBtns: document.querySelectorAll('.view-btn'),
    tabsView: document.getElementById('tabs-view'),
    gridView: document.getElementById('grid-view'),
    dropdownView: document.getElementById('dropdown-view'),
    // Tabs
    tabsHeader: document.getElementById('tabs-header'),
    tabsContent: document.getElementById('tabs-content'),
    // Grid
    accountsGrid: document.getElementById('accounts-grid'),
    // Dropdown
    accountSelector: document.getElementById('account-selector'),
    dropdownContent: document.getElementById('dropdown-content')
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

// Get account display name from active_eas
function getAccountName(account) {
    if (account.active_eas && account.active_eas.length > 0) {
        if (account.active_eas.length === 1) {
            return account.active_eas[0];
        }
        return `${account.active_eas.length} EAs`;
    }
    return account.name || `Account ${account.login}`;
}

// Generate EA badges HTML
function createEaBadges(account) {
    if (!account.active_eas || account.active_eas.length === 0) {
        return '';
    }
    const badges = account.active_eas.map(ea =>
        `<span class="ea-badge">${ea}</span>`
    ).join('');
    return `<div class="ea-badges">${badges}</div>`;
}

// Update status
function setStatus(status) {
    elements.connectionStatus.className = `status ${status}`;
    elements.connectionStatus.textContent = status === 'online' ? 'Connected' :
        status === 'loading' ? 'Loading...' : 'Disconnected';
}

// Generate account panel HTML (full detail view)
function createAccountPanel(account) {
    const profitClass = account.profit >= 0 ? 'positive' : 'negative';
    return `
        <div class="account-panel">
            <div class="account-info">
                <div class="info-row">
                    <span class="label">Account</span>
                    <span class="value">${account.login}</span>
                </div>
                <div class="info-row">
                    <span class="label">Server</span>
                    <span class="value">${account.server}</span>
                </div>
                <div class="info-row">
                    <span class="label">Active EAs</span>
                    <span class="value">${createEaBadges(account) || 'None'}</span>
                </div>
                <div class="info-row">
                    <span class="label">Last Update</span>
                    <span class="value">${formatDate(account.last_updated)}</span>
                </div>
            </div>
            <div class="cards-grid">
                <div class="card balance">
                    <div class="card-label">Balance</div>
                    <div class="card-value">${formatCurrency(account.balance)}</div>
                </div>
                <div class="card equity">
                    <div class="card-label">Equity</div>
                    <div class="card-value">${formatCurrency(account.equity)}</div>
                </div>
                <div class="card profit">
                    <div class="card-label">Profit/Loss</div>
                    <div class="card-value ${profitClass}">${formatCurrency(account.profit)}</div>
                </div>
                <div class="card margin">
                    <div class="card-label">Free Margin</div>
                    <div class="card-value">${formatCurrency(account.free_margin)}</div>
                </div>
            </div>
            <div class="margin-info">
                <div class="info-row">
                    <span class="label">Margin Used</span>
                    <span class="value">${formatCurrency(account.margin)}</span>
                </div>
                <div class="info-row">
                    <span class="label">Margin Level</span>
                    <span class="value">${account.margin_level.toFixed(2)}%</span>
                </div>
            </div>
        </div>
    `;
}

// Generate grid card HTML (compact view)
function createGridCard(account) {
    const profitClass = account.profit >= 0 ? 'positive' : 'negative';
    return `
        <div class="account-card">
            <div class="account-card-header">
                <span class="account-card-name">${account.login}</span>
                <span class="account-card-login">${getAccountName(account)}</span>
            </div>
            ${createEaBadges(account)}
            <div class="mini-stats">
                <div class="mini-stat">
                    <div class="mini-stat-label">Balance</div>
                    <div class="mini-stat-value">${formatCurrency(account.balance)}</div>
                </div>
                <div class="mini-stat">
                    <div class="mini-stat-label">Equity</div>
                    <div class="mini-stat-value">${formatCurrency(account.equity)}</div>
                </div>
                <div class="mini-stat">
                    <div class="mini-stat-label">Profit/Loss</div>
                    <div class="mini-stat-value ${profitClass}">${formatCurrency(account.profit)}</div>
                </div>
                <div class="mini-stat">
                    <div class="mini-stat-label">Free Margin</div>
                    <div class="mini-stat-value">${formatCurrency(account.free_margin)}</div>
                </div>
            </div>
        </div>
    `;
}

// Render Tabs View
function renderTabsView(accounts) {
    // Render tabs header
    elements.tabsHeader.innerHTML = accounts.map((acc, index) => `
        <button class="tab-btn ${index === 0 ? 'active' : ''}" data-account-id="${acc.id}">
            ${acc.login}
        </button>
    `).join('');

    // Select first account by default
    if (accounts.length > 0) {
        selectedAccountId = accounts[0].id;
        elements.tabsContent.innerHTML = createAccountPanel(accounts[0]);
    }

    // Tab click handlers
    elements.tabsHeader.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active tab
            elements.tabsHeader.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Show account content
            const accountId = btn.dataset.accountId;
            const account = accounts.find(a => a.id === accountId);
            if (account) {
                selectedAccountId = accountId;
                elements.tabsContent.innerHTML = createAccountPanel(account);
            }
        });
    });
}

// Render Grid View
function renderGridView(accounts) {
    elements.accountsGrid.innerHTML = accounts.map(acc => createGridCard(acc)).join('');
}

// Render Dropdown View
function renderDropdownView(accounts) {
    // Populate dropdown
    elements.accountSelector.innerHTML = accounts.map(acc => `
        <option value="${acc.id}">${acc.login}</option>
    `).join('');

    // Select first account by default
    if (accounts.length > 0) {
        selectedAccountId = accounts[0].id;
        elements.dropdownContent.innerHTML = createAccountPanel(accounts[0]);
    }

    // Dropdown change handler
    elements.accountSelector.addEventListener('change', (e) => {
        const account = accounts.find(a => a.id === e.target.value);
        if (account) {
            selectedAccountId = account.id;
            elements.dropdownContent.innerHTML = createAccountPanel(account);
        }
    });
}

// Switch view mode
function switchView(viewName) {
    currentView = viewName;

    // Update view buttons
    elements.viewBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Show/hide view containers
    elements.tabsView.classList.toggle('active', viewName === 'tabs');
    elements.gridView.classList.toggle('active', viewName === 'grid');
    elements.dropdownView.classList.toggle('active', viewName === 'dropdown');

    // Save preference
    localStorage.setItem('tradingViewMode', viewName);
}

// Fetch combined data (single request for all accounts)
async function fetchAccountData(forceRefresh = false) {
    const now = Date.now();

    // Use cache if available
    if (!forceRefresh && cachedData && (now - lastFetchTime) < CACHE_DURATION) {
        return cachedData;
    }

    setStatus('loading');
    elements.refreshBtn.disabled = true;

    try {
        const url = forceRefresh
            ? `${CONFIG.DATA_URL}?t=${now}`
            : CONFIG.DATA_URL;

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
        elements.lastUpdate.textContent = `Error: ${error.message}`;
        return null;

    } finally {
        elements.refreshBtn.disabled = false;
    }
}

// Update UI with data
function updateUI(data) {
    if (!data || !data.accounts || data.accounts.length === 0) return;

    const accounts = data.accounts;

    // Render all views
    renderTabsView(accounts);
    renderGridView(accounts);
    renderDropdownView(accounts);

    // Show last updated from combined file
    elements.lastUpdate.textContent = `Last update: ${formatDate(data.last_updated)}`;
}

// Initialize view mode switcher
function initViewSwitcher() {
    elements.viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchView(btn.dataset.view);
        });
    });

    // Restore saved preference
    const savedView = localStorage.getItem('tradingViewMode');
    if (savedView && ['tabs', 'grid', 'dropdown'].includes(savedView)) {
        switchView(savedView);
    }
}

// Event listeners
elements.refreshBtn.addEventListener('click', () => {
    fetchAccountData(true);
});

// Initialize
initViewSwitcher();
fetchAccountData();

// Auto refresh
setInterval(() => {
    fetchAccountData(true);
}, CONFIG.REFRESH_INTERVAL);
