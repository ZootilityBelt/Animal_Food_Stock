let API_URL = localStorage.getItem('apiUrl') || '';
let itemsCache = [];
let chartInstances = {};
let currentLanguage = localStorage.getItem('language') || 'en';

// Translation object
const translations = {
    en: {
        goodStock: 'Good Stock (≥50)',
        mediumStock: 'Medium Stock (10-49)',
        lowStock: 'Low Stock (<10)',
        stockIn: 'Stock In',
        stockOut: 'Stock Out',
        netChange: 'Net Change',
        transactions: 'Transactions',
        overallStockMovement: 'Overall Stock Movement',
        byCategory: 'By Category',
        specificItem: 'Specific Item',
        active: 'Active',
        inactive: 'Inactive',
        view: 'View',
        remove: 'Remove'
    },
    id: {
        goodStock: 'Stok Baik (≥50)',
        mediumStock: 'Stok Sedang (10-49)',
        lowStock: 'Stok Rendah (<10)',
        stockIn: 'Stok Masuk',
        stockOut: 'Stok Keluar',
        netChange: 'Perubahan Bersih',
        transactions: 'Transaksi',
        overallStockMovement: 'Pergerakan Stok Keseluruhan',
        byCategory: 'Per Kategori',
        specificItem: 'Item Spesifik',
        active: 'Aktif',
        inactive: 'Nonaktif',
        view: 'Lihat',
        remove: 'Hapus'
    }
};

// Switch Language Function
function switchLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);

    // Update button states
    const btnEn = document.getElementById('langBtnEn');
    const btnId = document.getElementById('langBtnId');
    if (btnEn) btnEn.classList.toggle('active', lang === 'en');
    if (btnId) btnId.classList.toggle('active', lang === 'id');

    // Update all translatable elements
    const elements = document.querySelectorAll('[data-lang-en]');
    elements.forEach(el => {
        const enText = el.getAttribute('data-lang-en');
        const idText = el.getAttribute('data-lang-id');

        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = lang === 'en' ? enText : idText;
        } else if (el.tagName === 'OPTION') {
            el.textContent = lang === 'en' ? enText : idText;
        } else {
            el.textContent = lang === 'en' ? enText : idText;
        }
    });

    // Update select options
    updateSelectOptions();
}

// Update select options text
function updateSelectOptions() {
    const comparisonType = document.getElementById('comparisonType');
    if (comparisonType) {
        comparisonType.options[0].textContent = currentLanguage === 'en' ? 'Overall Stock Movement' : 'Pergerakan Stok Keseluruhan';
        comparisonType.options[1].textContent = currentLanguage === 'en' ? 'By Category' : 'Per Kategori';
        comparisonType.options[2].textContent = currentLanguage === 'en' ? 'Specific Item' : 'Item Spesifik';
    }
}

// Get translation
function t(key) {
    return translations[currentLanguage][key] || translations.en[key] || key;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (API_URL) {
        const apiUrlElem = document.getElementById('apiUrl');
        if (apiUrlElem) apiUrlElem.value = API_URL;
        loadItemsForDropdown();
    }

    // Set today's date
    const stockDateElem = document.getElementById('stockDate');
    if (stockDateElem) stockDateElem.valueAsDate = new Date();

    // Set current year
    const currentYear = new Date().getFullYear();
    const repYear = document.getElementById('reportYear');
    const itemRepYear = document.getElementById('itemReportYear');

    if (repYear) repYear.value = currentYear;
    if (itemRepYear) itemRepYear.value = currentYear;

    // Apply saved language
    switchLanguage(currentLanguage);
});

// Save API URL
function saveApiUrl() {
    const url = document.getElementById('apiUrl').value.trim();
    if (!url) {
        showAlert('Please enter API URL', 'error');
        return;
    }
    localStorage.setItem('apiUrl', url);
    API_URL = url;
    showAlert('API URL saved successfully!', 'success');
    loadItemsForDropdown();
}

// Tab switching
function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));

    if (event && event.target) {
        const tab = event.target.closest('.tab') || event.target;
        tab.classList.add('active');
    }
    const tabContent = document.getElementById(tabName);
    if (tabContent) tabContent.classList.add('active');
}

// Alert system
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alertContainer.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// API Request Helper
async function apiRequest(endpoint, method = 'GET', data = null) {
    if (!API_URL) {
        showAlert('Please configure API URL first', 'error');
        throw new Error('API URL not configured');
    }

    try {
        const options = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };

        let url = API_URL;

        if (method === 'GET') {
            const params = new URLSearchParams(endpoint);
            url += '?' + params.toString();
        } else {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        const result = await response.json();

        if (result.status === 'error') {
            throw new Error(result.message);
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Load items for dropdown
async function loadItemsForDropdown() {
    try {
        const result = await apiRequest({ action: 'getItemList' });
        itemsCache = result.data || [];

        const stockItemSelect = document.getElementById('stockItem');
        const reportItemSelect = document.getElementById('reportItemSelect');
        const comparisonItemSelect = document.getElementById('comparisonItem');

        if (stockItemSelect) stockItemSelect.innerHTML = '<option value="">-- Select Item --</option>';
        if (reportItemSelect) reportItemSelect.innerHTML = '<option value="">-- Select Item --</option>';
        if (comparisonItemSelect) comparisonItemSelect.innerHTML = '<option value="">-- Select Item --</option>';

        itemsCache.forEach(item => {
            if (item.isActive !== false) {
                const opt1 = new Option(`${item.itemName} (${item.itemId})`, item.itemId);
                opt1.dataset.item = JSON.stringify(item);
                if (stockItemSelect) stockItemSelect.appendChild(opt1);

                const opt2 = new Option(`${item.itemName} (${item.itemId})`, item.itemId);
                opt2.dataset.item = JSON.stringify(item);
                if (reportItemSelect) reportItemSelect.appendChild(opt2);

                // For comparison chart dropdown
                if (comparisonItemSelect) {
                    const opt3 = new Option(`${item.itemName} (${item.itemId})`, item.itemId);
                    comparisonItemSelect.appendChild(opt3);
                }
            }
        });
    } catch (error) {
        console.error('Error loading items:', error);
    }
}

// Update item details when selected
function updateItemDetails() {
    const select = document.getElementById('stockItem');
    const selectedOption = select.options[select.selectedIndex];
    if (selectedOption.dataset.item) {
        const item = JSON.parse(selectedOption.dataset.item);
        // You can display unit or other info here if needed
    }
}

// Stock Form Submission
const stockForm = document.getElementById('stockForm');
if (stockForm) {
    stockForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const select = document.getElementById('stockItem');
        const selectedOption = select.options[select.selectedIndex];

        if (!selectedOption.dataset.item) {
            showAlert('Please select an item', 'error');
            return;
        }

        const item = JSON.parse(selectedOption.dataset.item);
        const masuk = parseFloat(document.getElementById('masuk').value) || 0;
        const keluar = parseFloat(document.getElementById('keluar').value) || 0;

        if (masuk === 0 && keluar === 0) {
            showAlert('Please enter either Stock In or Stock Out value', 'error');
            return;
        }

        const data = {
            action: 'addStock',
            date: document.getElementById('stockDate').value,
            bonNo: document.getElementById('bonNo').value,
            itemId: item.itemId,
            itemName: item.itemName,
            unit: item.unit,
            source: document.getElementById('stockSource').value,
            masuk: masuk,
            keluar: keluar
        };

        try {
            const result = await apiRequest(null, 'POST', data);
            showAlert('Stock entry added successfully!', 'success');
            resetStockForm();
        } catch (error) {
            showAlert('Error: ' + error.message, 'error');
        }
    });
}

// Reset stock form
function resetStockForm() {
    const form = document.getElementById('stockForm');
    if (form) form.reset();
    const dateElem = document.getElementById('stockDate');
    if (dateElem) dateElem.valueAsDate = new Date();
}

// Load Dashboard
async function loadDashboard() {
    const loading = document.getElementById('dashboardLoading');
    const tbody = document.getElementById('dashboardBody');

    if (loading) loading.classList.add('active');

    try {
        const result = await apiRequest({ action: 'getCurrentStock' });
        const stocks = result.data || [];

        // Update stats
        const totalItemsElem = document.getElementById('totalItems');
        if (totalItemsElem) totalItemsElem.textContent = stocks.length;

        const lowStock = stocks.filter(s => s.balance < 10).length;
        const lowStockElem = document.getElementById('lowStock');
        if (lowStockElem) lowStockElem.textContent = lowStock;

        const totalTx = stocks.reduce((sum, s) => sum + s.totalMasuk + s.totalKeluar, 0);
        const totalValueElem = document.getElementById('totalValue');
        if (totalValueElem) totalValueElem.textContent = Math.round(totalTx);

        // Populate table
        if (tbody) {
            tbody.innerHTML = '';
            stocks.forEach(stock => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${stock.itemId}</td>
                    <td>${stock.itemName}</td>
                    <td>${stock.category}</td>
                    <td>${stock.unit}</td>
                    <td><strong>${stock.balance.toFixed(2)}</strong></td>
                    <td>${stock.totalMasuk.toFixed(2)}</td>
                    <td>${stock.totalKeluar.toFixed(2)}</td>
                    <td>
                        ${stock.balance < 10 ? `<span class="badge badge-danger">${t('lowStock')}</span>` :
                        stock.balance < 50 ? '<span class="badge badge-warning">Medium</span>' :
                            `<span class="badge badge-success">${t('goodStock')}</span>`}
                    </td>
                    <td>
                        <button class="btn" onclick="viewItemDetails('${stock.itemId}')" style="padding: 8px 15px; font-size: 0.9em;">📊 ${t('view')}</button>
                    </td>
                `;
            });
        }

        showAlert('Dashboard loaded successfully!', 'success');
    } catch (error) {
        showAlert('Error loading dashboard: ' + error.message, 'error');
        if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: red;">Error loading data</td></tr>';
    } finally {
        if (loading) loading.classList.remove('active');
    }
}

// Filter dashboard table
function filterDashboardTable() {
    const input = document.getElementById('dashboardSearch');
    const tbody = document.getElementById('dashboardBody');
    if (!input || !tbody) return;

    const filter = input.value.toLowerCase();
    const rows = tbody.getElementsByTagName('tr');

    for (let row of rows) {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? '' : 'none';
    }
}

// View item details
async function viewItemDetails(itemId) {
    const modal = document.getElementById('itemDetailsModal');
    const content = document.getElementById('itemDetailsContent');

    if (!modal || !content) return;

    content.innerHTML = '<div class="loading active"><div class="spinner"></div><p>Loading...</p></div>';
    modal.classList.add('active');

    try {
        const result = await apiRequest({ action: 'getItemStock', itemId: itemId });

        content.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>${result.currentBalance.toFixed(2)}</h3>
                    <p>Current Balance</p>
                </div>
                <div class="stat-card">
                    <h3>${result.totalMasuk.toFixed(2)}</h3>
                    <p>Total In</p>
                </div>
                <div class="stat-card">
                    <h3>${result.totalKeluar.toFixed(2)}</h3>
                    <p>Total Out</p>
                </div>
            </div>
            
            <h3 style="margin: 20px 0 10px 0;">Item Information</h3>
            <table>
                <tr><td><strong>Item ID:</strong></td><td>${result.item.itemId}</td></tr>
                <tr><td><strong>Item Name:</strong></td><td>${result.item.itemName}</td></tr>
                <tr><td><strong>Category:</strong></td><td>${result.item.category}</td></tr>
                <tr><td><strong>Unit:</strong></td><td>${result.item.unit}</td></tr>
            </table>
            
            <h3 style="margin: 20px 0 10px 0;">Recent Transactions (Last 10)</h3>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>BON No</th>
                            <th>Source</th>
                            <th>In</th>
                            <th>Out</th>
                            <th>Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${result.transactions.slice(-10).reverse().map(tx => `
                            <tr>
                                <td>${new Date(tx.date).toLocaleDateString()}</td>
                                <td>${tx.bonNo}</td>
                                <td>${tx.source || '-'}</td>
                                <td>${tx.masuk > 0 ? tx.masuk.toFixed(2) : '-'}</td>
                                <td>${tx.keluar > 0 ? tx.keluar.toFixed(2) : '-'}</td>
                                <td>${tx.balance.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="alert alert-error">Error: ${error.message}</div>`;
    }
}

// Load Items
async function loadItems() {
    const loading = document.getElementById('itemsLoading');
    const tbody = document.getElementById('itemsBody');

    if (loading) loading.classList.add('active');

    try {
        const result = await apiRequest({ action: 'getItemList' });
        itemsCache = result.data || [];

        if (tbody) {
            tbody.innerHTML = '';
            itemsCache.forEach(item => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${item.itemId}</td>
                    <td>${item.itemName}</td>
                    <td>${item.category}</td>
                    <td>${item.unit}</td>
                    <td>
                        ${item.isActive !== false ?
                        `<span class="badge badge-success">${t('active')}</span>` :
                        `<span class="badge badge-danger">${t('inactive')}</span>`}
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn" onclick="viewItemDetails('${item.itemId}')" style="padding: 8px 15px; font-size: 0.9em;">📊 ${t('view')}</button>
                            ${item.isActive !== false ?
                        `<button class="btn btn-danger" onclick="removeItem('${item.itemId}')" style="padding: 8px 15px; font-size: 0.9em;">🗑️ ${t('remove')}</button>` :
                        ''}
                        </div>
                    </td>
                `;
            });
        }

        loadItemsForDropdown();
        showAlert('Items loaded successfully!', 'success');
    } catch (error) {
        showAlert('Error loading items: ' + error.message, 'error');
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Error loading data</td></tr>';
    } finally {
        if (loading) loading.classList.remove('active');
    }
}

// Filter items table
function filterItemsTable() {
    const input = document.getElementById('itemsSearch');
    const tbody = document.getElementById('itemsBody');
    if (!input || !tbody) return;

    const filter = input.value.toLowerCase();
    const rows = tbody.getElementsByTagName('tr');

    for (let row of rows) {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? '' : 'none';
    }
}

// Open add item modal
function openAddItemModal() {
    const modal = document.getElementById('addItemModal');
    if (modal) modal.classList.add('active');
}

// Add Item Form
const addItemForm = document.getElementById('addItemForm');
if (addItemForm) {
    addItemForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            action: 'addItem',
            itemId: document.getElementById('newItemId').value.trim(),
            itemName: document.getElementById('newItemName').value.trim(),
            category: document.getElementById('newItemCategory').value.trim(),
            unit: document.getElementById('newItemUnit').value.trim()
        };

        try {
            await apiRequest(null, 'POST', data);
            showAlert('Item added successfully!', 'success');
            closeModal('addItemModal');
            document.getElementById('addItemForm').reset();
            loadItems();
        } catch (error) {
            showAlert('Error: ' + error.message, 'error');
        }
    });
}

// Remove Item
async function removeItem(itemId) {
    if (!confirm(`Are you sure you want to remove item ${itemId}? This will mark it as inactive.`)) {
        return;
    }

    try {
        await apiRequest(null, 'POST', { action: 'removeItem', itemId: itemId });
        showAlert('Item removed successfully!', 'success');
        loadItems();
    } catch (error) {
        showAlert('Error: ' + error.message, 'error');
    }
}

// Load History
async function loadHistory() {
    const loading = document.getElementById('historyLoading');
    const tbody = document.getElementById('historyBody');
    const limitElem = document.getElementById('historyLimit');

    if (loading) loading.classList.add('active');

    try {
        const limit = limitElem ? limitElem.value : 50;
        const result = await apiRequest({ action: 'getStockLog', limit: limit });
        const logs = result.data || [];

        if (tbody) {
            tbody.innerHTML = '';
            logs.forEach(log => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${new Date(log.date).toLocaleDateString()}</td>
                    <td>${log.bonNo}</td>
                    <td>${log.itemId}</td>
                    <td>${log.itemName}</td>
                    <td>${log.unit}</td>
                    <td>${log.source || '-'}</td>
                    <td>${log.masuk > 0 ? `<span class="badge badge-success">+${log.masuk}</span>` : '-'}</td>
                    <td>${log.keluar > 0 ? `<span class="badge badge-danger">-${log.keluar}</span>` : '-'}</td>
                `;
            });
        }

        showAlert('History loaded successfully!', 'success');
    } catch (error) {
        showAlert('Error loading history: ' + error.message, 'error');
        if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: red;">Error loading data</td></tr>';
    } finally {
        if (loading) loading.classList.remove('active');
    }
}

// Filter history table
function filterHistoryTable() {
    const input = document.getElementById('historySearch');
    const tbody = document.getElementById('historyBody');
    if (!input || !tbody) return;

    const filter = input.value.toLowerCase();
    const rows = tbody.getElementsByTagName('tr');

    for (let row of rows) {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? '' : 'none';
    }
}

// Generate Monthly Report
async function generateMonthlyReport() {
    const year = document.getElementById('reportYear').value;
    const month = document.getElementById('reportMonth').value;

    if (!confirm(`Generate report for ${year}-${month}?\n\nNote: This will run directly in your Google Sheets. You won't see the result here, but check your spreadsheet for a new sheet.`)) {
        return;
    }

    showAlert('Report generation started... Please check your Google Sheets in a moment.', 'info');

    try {
        // Note: This would need to be called server-side
        showAlert('To generate reports, you need to run the function directly in Google Apps Script or create a POST endpoint for it.', 'info');
    } catch (error) {
        showAlert('Error: ' + error.message, 'error');
    }
}

// Open item report modal
function openItemReportModal() {
    const modal = document.getElementById('itemReportModal');
    if (modal) modal.classList.add('active');
}

// Generate Item Report
const itemReportForm = document.getElementById('itemReportForm');
if (itemReportForm) {
    itemReportForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const itemId = document.getElementById('reportItemSelect').value;
        const year = document.getElementById('itemReportYear').value;
        const month = document.getElementById('itemReportMonth').value;

        if (!itemId) {
            showAlert('Please select an item', 'error');
            return;
        }

        closeModal('itemReportModal');
        showAlert('Item report generation started... Please check your Google Sheets in a moment.', 'info');

        try {
            showAlert('To generate item reports, you need to run the function directly in Google Apps Script or create a POST endpoint for it.', 'info');
        } catch (error) {
            showAlert('Error: ' + error.message, 'error');
        }
    });
}

// Close Modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

// Close modal on outside click
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}

// ==========================================
// CHARTS AND ANALYTICS
// ==========================================

// Destroy existing chart if it exists
function destroyChart(chartName) {
    if (chartInstances[chartName]) {
        chartInstances[chartName].destroy();
        delete chartInstances[chartName];
    }
}

// Load all charts
async function loadCharts() {
    const loading = document.getElementById('chartsLoading');
    if (loading) loading.classList.add('active');

    try {
        // Load current stock data
        const stockResult = await apiRequest({ action: 'getCurrentStock' });
        const stocks = stockResult.data || [];

        // Load transaction history for trends
        const historyResult = await apiRequest({ action: 'getStockLog', limit: 500 });
        const history = historyResult.data || [];

        // Generate all charts
        generateCategoryChart(stocks);
        generateTopItemsChart(stocks);
        generateInOutChart(stocks);
        generateStatusPieChart(stocks);
        generateTrendChart(history);

        // Generate monthly comparison charts
        generateMonthlyComparisonChart(history, 'overall');
        generateYearOverYearChart(history);

        // Populate item dropdown for comparison
        populateComparisonItemDropdown(stocks);

        showAlert('Charts loaded successfully!', 'success');
    } catch (error) {
        showAlert('Error loading charts: ' + error.message, 'error');
    } finally {
        if (loading) loading.classList.remove('active');
    }
}

// 1. Stock Balance by Category (Bar Chart)
function generateCategoryChart(stocks) {
    destroyChart('categoryChart');
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;

    // Group by category
    const categoryData = {};
    stocks.forEach(stock => {
        const cat = stock.category || 'Uncategorized';
        if (!categoryData[cat]) {
            categoryData[cat] = 0;
        }
        categoryData[cat] += stock.balance;
    });

    const categories = Object.keys(categoryData);
    const balances = Object.values(categoryData);

    const ctx = canvas.getContext('2d');
    chartInstances['categoryChart'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: t('stockIn'),
                data: balances,
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Stock Balance'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Category'
                    }
                }
            }
        }
    });
}

// 2. Top 10 Items by Stock Balance (Horizontal Bar Chart)
function generateTopItemsChart(stocks) {
    destroyChart('topItemsChart');
    const canvas = document.getElementById('topItemsChart');
    if (!canvas) return;

    // Sort by balance and get top 10
    const sortedStocks = [...stocks].sort((a, b) => b.balance - a.balance).slice(0, 10);

    const labels = sortedStocks.map(s => s.itemName);
    const balances = sortedStocks.map(s => s.balance);

    // Generate colors
    const colors = balances.map((val, idx) => {
        const hue = (idx * 360 / 10);
        return `hsla(${hue}, 70%, 60%, 0.8)`;
    });

    const ctx = canvas.getContext('2d');
    chartInstances['topItemsChart'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Stock Balance',
                data: balances,
                backgroundColor: colors,
                borderColor: colors.map(c => c.replace('0.8', '1')),
                borderWidth: 2
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return 'Balance: ' + context.parsed.x.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Stock Balance'
                    }
                }
            }
        }
    });
}

// 3. Stock In vs Stock Out (Grouped Bar Chart)
function generateInOutChart(stocks) {
    destroyChart('inOutChart');
    const canvas = document.getElementById('inOutChart');
    if (!canvas) return;

    // Sort by total activity and get top 10
    const sortedStocks = [...stocks]
        .sort((a, b) => (b.totalMasuk + b.totalKeluar) - (a.totalMasuk + a.totalKeluar))
        .slice(0, 10);

    const labels = sortedStocks.map(s => s.itemName);
    const masukData = sortedStocks.map(s => s.totalMasuk);
    const keluarData = sortedStocks.map(s => s.totalKeluar);

    const ctx = canvas.getContext('2d');
    chartInstances['inOutChart'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: t('stockIn'),
                    data: masukData,
                    backgroundColor: 'rgba(39, 174, 96, 0.8)',
                    borderColor: 'rgba(39, 174, 96, 1)',
                    borderWidth: 2
                },
                {
                    label: t('stockOut'),
                    data: keluarData,
                    backgroundColor: 'rgba(231, 76, 60, 0.8)',
                    borderColor: 'rgba(231, 76, 60, 1)',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Quantity'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Items'
                    }
                }
            }
        }
    });
}

// 4. Stock Status Distribution (Pie Chart)
function generateStatusPieChart(stocks) {
    destroyChart('statusPieChart');
    const canvas = document.getElementById('statusPieChart');
    if (!canvas) return;

    // Categorize by status
    let goodStock = 0;
    let mediumStock = 0;
    let lowStock = 0;

    stocks.forEach(stock => {
        if (stock.balance < 10) {
            lowStock++;
        } else if (stock.balance < 50) {
            mediumStock++;
        } else {
            goodStock++;
        }
    });

    const ctx = canvas.getContext('2d');
    chartInstances['statusPieChart'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [t('goodStock'), t('mediumStock'), t('lowStock')],
            datasets: [{
                data: [goodStock, mediumStock, lowStock],
                backgroundColor: [
                    'rgba(39, 174, 96, 0.8)',
                    'rgba(241, 196, 15, 0.8)',
                    'rgba(231, 76, 60, 0.8)'
                ],
                borderColor: [
                    'rgba(39, 174, 96, 1)',
                    'rgba(241, 196, 15, 1)',
                    'rgba(231, 76, 60, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return label + ': ' + value + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

// 5. Transaction Trends (Line Chart - Last 30 Days)
function generateTrendChart(history) {
    destroyChart('trendChart');
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;

    // Get last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter and group by date
    const dailyData = {};

    history.forEach(log => {
        const logDate = new Date(log.date);
        if (logDate >= thirtyDaysAgo) {
            const dateKey = logDate.toISOString().split('T')[0];

            if (!dailyData[dateKey]) {
                dailyData[dateKey] = {
                    masuk: 0,
                    keluar: 0,
                    transactions: 0
                };
            }

            dailyData[dateKey].masuk += log.masuk || 0;
            dailyData[dateKey].keluar += log.keluar || 0;
            dailyData[dateKey].transactions += 1;
        }
    });

    // Sort dates and prepare data
    const dates = Object.keys(dailyData).sort();
    const masukData = dates.map(date => dailyData[date].masuk);
    const keluarData = dates.map(date => dailyData[date].keluar);
    const transactionCounts = dates.map(date => dailyData[date].transactions);

    // Format dates for display
    const labels = dates.map(date => {
        const d = new Date(date);
        return (d.getMonth() + 1) + '/' + d.getDate();
    });

    const ctx = canvas.getContext('2d');
    chartInstances['trendChart'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: t('stockIn'),
                    data: masukData,
                    borderColor: 'rgba(39, 174, 96, 1)',
                    backgroundColor: 'rgba(39, 174, 96, 0.2)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: t('stockOut'),
                    data: keluarData,
                    borderColor: 'rgba(231, 76, 60, 1)',
                    backgroundColor: 'rgba(231, 76, 60, 0.2)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: t('transactions'),
                    data: transactionCounts,
                    borderColor: 'rgba(102, 126, 234, 1)',
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y1',
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(2);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Stock Quantity'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false
                    },
                    title: {
                        display: true,
                        text: 'Transaction Count'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            }
        }
    });
}

// 6. Monthly Comparison Chart (Last 6 Months)
async function generateMonthlyComparisonChart(history, type = 'overall', selectedItem = null) {
    destroyChart('monthlyComparisonChart');
    const canvas = document.getElementById('monthlyComparisonChart');
    if (!canvas) return;

    // Get last 6 months
    const today = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push({
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            label: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
            key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        });
    }

    let datasets = [];

    if (type === 'overall') {
        // Overall stock movement
        const monthlyData = months.map(m => {
            return {
                masuk: 0,
                keluar: 0,
                net: 0
            };
        });

        history.forEach(log => {
            const logDate = new Date(log.date);
            const logKey = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}`;
            const monthIndex = months.findIndex(m => m.key === logKey);

            if (monthIndex !== -1) {
                monthlyData[monthIndex].masuk += log.masuk || 0;
                monthlyData[monthIndex].keluar += log.keluar || 0;
                monthlyData[monthIndex].net += (log.masuk || 0) - (log.keluar || 0);
            }
        });

        datasets = [
            {
                label: t('stockIn'),
                data: monthlyData.map(m => m.masuk),
                backgroundColor: 'rgba(39, 174, 96, 0.8)',
                borderColor: 'rgba(39, 174, 96, 1)',
                borderWidth: 2
            },
            {
                label: t('stockOut'),
                data: monthlyData.map(m => m.keluar),
                backgroundColor: 'rgba(231, 76, 60, 0.8)',
                borderColor: 'rgba(231, 76, 60, 1)',
                borderWidth: 2
            },
            {
                label: t('netChange'),
                data: monthlyData.map(m => m.net),
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2,
                type: 'line',
                yAxisID: 'y1'
            }
        ];
    } else if (type === 'category') {
        // Group by category
        const categories = {};

        history.forEach(log => {
            const logDate = new Date(log.date);
            const logKey = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}`;
            const monthIndex = months.findIndex(m => m.key === logKey);

            if (monthIndex !== -1) {
                // Try to find category from itemsCache
                const item = itemsCache.find(i => i.itemId === log.itemId);
                const category = item ? item.category : 'Uncategorized';

                if (!categories[category]) {
                    categories[category] = months.map(() => 0);
                }

                categories[category][monthIndex] += (log.masuk || 0) - (log.keluar || 0);
            }
        });

        // Create dataset for each category
        const categoryColors = [
            { bg: 'rgba(102, 126, 234, 0.8)', border: 'rgba(102, 126, 234, 1)' },
            { bg: 'rgba(231, 76, 60, 0.8)', border: 'rgba(231, 76, 60, 1)' },
            { bg: 'rgba(39, 174, 96, 0.8)', border: 'rgba(39, 174, 96, 1)' },
            { bg: 'rgba(241, 196, 15, 0.8)', border: 'rgba(241, 196, 15, 1)' },
            { bg: 'rgba(155, 89, 182, 0.8)', border: 'rgba(155, 89, 182, 1)' },
            { bg: 'rgba(52, 152, 219, 0.8)', border: 'rgba(52, 152, 219, 1)' }
        ];

        datasets = Object.keys(categories).map((cat, idx) => ({
            label: cat,
            data: categories[cat],
            backgroundColor: categoryColors[idx % categoryColors.length].bg,
            borderColor: categoryColors[idx % categoryColors.length].border,
            borderWidth: 2
        }));
    } else if (type === 'item' && selectedItem) {
        // Specific item
        const monthlyData = months.map(m => {
            return {
                masuk: 0,
                keluar: 0,
                net: 0
            };
        });

        history.forEach(log => {
            if (log.itemId === selectedItem) {
                const logDate = new Date(log.date);
                const logKey = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}`;
                const monthIndex = months.findIndex(m => m.key === logKey);

                if (monthIndex !== -1) {
                    monthlyData[monthIndex].masuk += log.masuk || 0;
                    monthlyData[monthIndex].keluar += log.keluar || 0;
                    monthlyData[monthIndex].net += (log.masuk || 0) - (log.keluar || 0);
                }
            }
        });

        datasets = [
            {
                label: 'Stock In',
                data: monthlyData.map(m => m.masuk),
                backgroundColor: 'rgba(39, 174, 96, 0.8)',
                borderColor: 'rgba(39, 174, 96, 1)',
                borderWidth: 2
            },
            {
                label: 'Stock Out',
                data: monthlyData.map(m => m.keluar),
                backgroundColor: 'rgba(231, 76, 60, 0.8)',
                borderColor: 'rgba(231, 76, 60, 1)',
                borderWidth: 2
            },
            {
                label: 'Net Change',
                data: monthlyData.map(m => m.net),
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2,
                type: 'line',
                yAxisID: 'y1'
            }
        ];
    }

    const ctx = canvas.getContext('2d');
    chartInstances['monthlyComparisonChart'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months.map(m => m.label),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: type === 'category' ? 'Net Stock Change' : 'Quantity'
                    }
                },
                y1: type === 'overall' || type === 'item' ? {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    title: {
                        display: true,
                        text: 'Net Change'
                    }
                } : undefined,
                x: {
                    title: {
                        display: true,
                        text: 'Month'
                    }
                }
            }
        }
    });
}

// Populate item dropdown for comparison
function populateComparisonItemDropdown(stocks) {
    const select = document.getElementById('comparisonItem');
    if (!select) return;

    select.innerHTML = '<option value="">-- Select Item --</option>';

    stocks.forEach(stock => {
        const option = new Option(`${stock.itemName} (${stock.itemId})`, stock.itemId);
        select.appendChild(option);
    });
}

// Update monthly comparison based on selection
async function updateMonthlyComparison() {
    const type = document.getElementById('comparisonType').value;
    const itemSelectGroup = document.getElementById('itemSelectGroup');

    if (type === 'item') {
        if (itemSelectGroup) itemSelectGroup.style.display = 'block';
        const selectedItem = document.getElementById('comparisonItem').value;
        if (!selectedItem) return;

        try {
            const historyResult = await apiRequest({ action: 'getStockLog', limit: 1000 });
            const history = historyResult.data || [];
            generateMonthlyComparisonChart(history, type, selectedItem);
        } catch (error) {
            showAlert('Error updating chart: ' + error.message, 'error');
        }
    } else {
        if (itemSelectGroup) itemSelectGroup.style.display = 'none';

        try {
            const historyResult = await apiRequest({ action: 'getStockLog', limit: 1000 });
            const history = historyResult.data || [];
            generateMonthlyComparisonChart(history, type);
        } catch (error) {
            showAlert('Error updating chart: ' + error.message, 'error');
        }
    }
}

// 7. Year-over-Year Comparison
async function generateYearOverYearChart(history) {
    const year1Elem = document.getElementById('yoyYear1');
    const year2Elem = document.getElementById('yoyYear2');
    if (!year1Elem || !year2Elem) return;

    const year1 = parseInt(year1Elem.value);
    const year2 = parseInt(year2Elem.value);

    destroyChart('yoyChart');
    const canvas = document.getElementById('yoyChart');
    if (!canvas) return;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize data for both years
    const year1Data = Array(12).fill(0);
    const year2Data = Array(12).fill(0);

    history.forEach(log => {
        const logDate = new Date(log.date);
        const logYear = logDate.getFullYear();
        const logMonth = logDate.getMonth();
        const netChange = (log.masuk || 0) - (log.keluar || 0);

        if (logYear === year1) {
            year1Data[logMonth] += netChange;
        } else if (logYear === year2) {
            year2Data[logMonth] += netChange;
        }
    });

    const ctx = canvas.getContext('2d');
    chartInstances['yoyChart'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: year1.toString(),
                    data: year1Data,
                    borderColor: 'rgba(102, 126, 234, 1)',
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: year2.toString(),
                    data: year2Data,
                    borderColor: 'rgba(231, 76, 60, 1)',
                    backgroundColor: 'rgba(231, 76, 60, 0.2)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Net Stock Change'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Month'
                    }
                }
            }
        }
    });
}

// Update year-over-year chart when user changes years
async function updateYearOverYearChart() {
    try {
        const historyResult = await apiRequest({ action: 'getStockLog', limit: 2000 });
        const history = historyResult.data || [];
        generateYearOverYearChart(history);
        showAlert('Year-over-year comparison updated!', 'success');
    } catch (error) {
        showAlert('Error updating chart: ' + error.message, 'error');
    }
}
