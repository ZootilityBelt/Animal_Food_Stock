let API_URL = localStorage.getItem('apiUrl') || '';
let itemsCache = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (API_URL) {
        document.getElementById('apiUrl').value = API_URL;
        loadItemsForDropdown();
    }

    // Set today's date
    document.getElementById('stockDate').valueAsDate = new Date();

    // Set current year
    const currentYear = new Date().getFullYear();
    document.getElementById('reportYear').value = currentYear;
    document.getElementById('itemReportYear').value = currentYear;
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

    // Check if event exists because this might be called programmatically differently
    if (window.event && window.event.target) {
        window.event.target.classList.add('active');
    }
    document.getElementById(tabName).classList.add('active');
}

// Alert system
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
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

        stockItemSelect.innerHTML = '<option value="">-- Select Item --</option>';
        reportItemSelect.innerHTML = '<option value="">-- Select Item --</option>';

        itemsCache.forEach(item => {
            if (item.isActive !== false) {
                const option1 = new Option(`${item.itemName} (${item.itemId})`, item.itemId);
                const option2 = new Option(`${item.itemName} (${item.itemId})`, item.itemId);
                option1.dataset.item = JSON.stringify(item);
                option2.dataset.item = JSON.stringify(item);
                stockItemSelect.appendChild(option1);
                reportItemSelect.appendChild(option2);
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
document.getElementById('stockForm').addEventListener('submit', async (e) => {
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

// Reset stock form
function resetStockForm() {
    document.getElementById('stockForm').reset();
    document.getElementById('stockDate').valueAsDate = new Date();
}

// Load Dashboard
async function loadDashboard() {
    const loading = document.getElementById('dashboardLoading');
    const tbody = document.getElementById('dashboardBody');

    loading.classList.add('active');

    try {
        const result = await apiRequest({ action: 'getCurrentStock' });
        const stocks = result.data || [];

        // Update stats
        document.getElementById('totalItems').textContent = stocks.length;
        const lowStock = stocks.filter(s => s.balance < 10).length;
        document.getElementById('lowStock').textContent = lowStock;
        const totalTx = stocks.reduce((sum, s) => sum + s.totalMasuk + s.totalKeluar, 0);
        document.getElementById('totalValue').textContent = Math.round(totalTx);

        // Populate table
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
                    ${stock.balance < 10 ? '<span class="badge badge-danger">Low Stock</span>' :
                    stock.balance < 50 ? '<span class="badge badge-warning">Medium</span>' :
                        '<span class="badge badge-success">Good</span>'}
                </td>
                <td>
                    <button class="btn" onclick="viewItemDetails('${stock.itemId}')" style="padding: 8px 15px; font-size: 0.9em;">📊 View</button>
                </td>
            `;
        });

        showAlert('Dashboard loaded successfully!', 'success');
    } catch (error) {
        showAlert('Error loading dashboard: ' + error.message, 'error');
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: red;">Error loading data</td></tr>';
    } finally {
        loading.classList.remove('active');
    }
}

// Filter dashboard table
function filterDashboardTable() {
    const input = document.getElementById('dashboardSearch');
    const filter = input.value.toLowerCase();
    const tbody = document.getElementById('dashboardBody');
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

    loading.classList.add('active');

    try {
        const result = await apiRequest({ action: 'getItemList' });
        itemsCache = result.data || [];

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
                    '<span class="badge badge-success">Active</span>' :
                    '<span class="badge badge-danger">Inactive</span>'}
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn" onclick="viewItemDetails('${item.itemId}')" style="padding: 8px 15px; font-size: 0.9em;">📊 View</button>
                        ${item.isActive !== false ?
                    `<button class="btn btn-danger" onclick="removeItem('${item.itemId}')" style="padding: 8px 15px; font-size: 0.9em;">🗑️ Remove</button>` :
                    ''}
                    </div>
                </td>
            `;
        });

        loadItemsForDropdown();
        showAlert('Items loaded successfully!', 'success');
    } catch (error) {
        showAlert('Error loading items: ' + error.message, 'error');
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Error loading data</td></tr>';
    } finally {
        loading.classList.remove('active');
    }
}

// Filter items table
function filterItemsTable() {
    const input = document.getElementById('itemsSearch');
    const filter = input.value.toLowerCase();
    const tbody = document.getElementById('itemsBody');
    const rows = tbody.getElementsByTagName('tr');

    for (let row of rows) {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? '' : 'none';
    }
}

// Open add item modal
function openAddItemModal() {
    document.getElementById('addItemModal').classList.add('active');
}

// Add Item Form
document.getElementById('addItemForm').addEventListener('submit', async (e) => {
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
    const limit = document.getElementById('historyLimit').value;

    loading.classList.add('active');

    try {
        const result = await apiRequest({ action: 'getStockLog', limit: limit });
        const logs = result.data || [];

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

        showAlert('History loaded successfully!', 'success');
    } catch (error) {
        showAlert('Error loading history: ' + error.message, 'error');
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: red;">Error loading data</td></tr>';
    } finally {
        loading.classList.remove('active');
    }
}

// Filter history table
function filterHistoryTable() {
    const input = document.getElementById('historySearch');
    const filter = input.value.toLowerCase();
    const tbody = document.getElementById('historyBody');
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
    document.getElementById('itemReportModal').classList.add('active');
}

// Generate Item Report
document.getElementById('itemReportForm').addEventListener('submit', async (e) => {
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

// Close Modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Close modal on outside click
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}
