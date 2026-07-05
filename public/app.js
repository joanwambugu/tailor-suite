document.addEventListener("DOMContentLoaded", () => {
    setupTabSwitching();
    setupBalanceCalculator();
    setupFormSubmission();
    loadActiveOrders();
    loadClientDirectory();
    updateDashboardAnalytics(); // Added to initial load
});

// 1. Sidebar Tab Switching
function setupTabSwitching() {
    const navItems = document.querySelectorAll(".nav-item");
    const tabContents = document.querySelectorAll(".tab-content");

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetTab = item.getAttribute("data-tab");
            navItems.forEach(nav => nav.classList.remove("active"));
            tabContents.forEach(content => content.classList.remove("active"));
            item.classList.add("active");
            document.getElementById(targetTab).classList.add("active");

            if (targetTab === "orders-tab") loadActiveOrders();
            if (targetTab === "directory-tab") loadClientDirectory();
        });
    });
}

// 2. Live Balance Calculator
function setupBalanceCalculator() {
    const totalInput = document.getElementById("totalPrice");
    const depositInput = document.getElementById("depositPaid");
    const balanceInput = document.getElementById("balanceDue");

    function calculate() {
        const total = parseFloat(totalInput.value) || 0;
        const deposit = parseFloat(depositInput.value) || 0;
        const balance = total - deposit;
        balanceInput.value = balance >= 0 ? balance : 0;
    }

    totalInput.addEventListener("input", calculate);
    depositInput.addEventListener("input", calculate);
}

// 3. Form Submission
function setupFormSubmission() {
    const form = document.getElementById("tailorForm");
    const alertDiv = document.getElementById("statusAlert");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        alertDiv.style.display = "none";

        const payload = {
            name: document.getElementById("clientName").value.trim(),
            phone: document.getElementById("clientPhone").value.trim(),
            measurements: {
                shoulder: document.getElementById("mShoulder").value,
                chest: document.getElementById("mChest").value,
                sleeve: document.getElementById("mSleeve").value,
                shirtLength: document.getElementById("mShirtLength").value,
                waist: document.getElementById("mWaist").value,
                hips: document.getElementById("mHips").value,
                inseam: document.getElementById("mInseam").value,
                trouserLength: document.getElementById("mTrouserLength").value
            },
            garmentDesc: document.getElementById("garmentDesc").value.trim(),
            financials: {
                total: document.getElementById("totalPrice").value,
                deposit: document.getElementById("depositPaid").value,
                balance: document.getElementById("balanceDue").value
            }
        };

        try {
            const response = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (response.ok && data.success) {
                alertDiv.className = "alert alert-success";
                alertDiv.innerText = "✨ Order logged!";
                alertDiv.style.display = "block";
                form.reset();
                loadActiveOrders();
                updateDashboardAnalytics(); // Update metrics after new order
            } else {
                throw new Error(data.error || "Failed insertion");
            }
        } catch (err) {
            alertDiv.className = "alert alert-error";
            alertDiv.innerText = "❌ Error: " + err.message;
            alertDiv.style.display = "block";
        }
    });
}

// 4. Load Active Orders (Consolidated with Print)
async function loadActiveOrders() {
    const tbody = document.getElementById("ordersTableBody");
    if (!tbody) return;

    try {
        const response = await fetch("/api/orders");
        const orders = await response.json();
        tbody.innerHTML = "";

        if (orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#6b7280;">No active orders found.</td></tr>`;
            return;
        }

        orders.forEach(order => {
            const tr = document.createElement("tr");
            const orderData = btoa(JSON.stringify(order));

            tr.innerHTML = `
                <td><strong>${order.name}</strong><br><small>${order.phone}</small></td>
                <td>${order.garmentDesc}</td>
                <td class="text-danger">KSh ${Number(order.financials.balance).toLocaleString()}</td>
                <td><span class="badge badge-progress">${order.status}</span></td>
                <td>
                    <button class="btn-action btn-sms" onclick="alert('Sending fitting alert...')">💬 Fitting</button>
                    <button class="btn-action btn-complete" onclick="alert('Marking ready...')">✅ Ready</button>
                    <button class="btn-action" style="background:#e2e8f0;" onclick="printReceipt('${orderData}')">🖨️ Print</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Error loading orders:", err);
    }
}

// 5. Load Client Directory
async function loadClientDirectory() {
    const tbody = document.getElementById("directoryTableBody");
    if (!tbody) return;

    try {
        const response = await fetch("/api/clients");
        const clients = await response.json();
        tbody.innerHTML = "";

        clients.forEach(client => {
            const m = client.measurements || {};
            const tr = document.createElement("tr");
            const clientData = btoa(JSON.stringify(client));

            tr.innerHTML = `
                <td><strong>${client.name}</strong></td>
                <td>${client.phone}</td>
                <td>Sh: ${m.shoulder || 0}" | Chst: ${m.chest || 0}" | Wst: ${m.waist || 0}" | Lng: ${m.trouserLength || 0}"</td>
                <td><button class="btn-action" onclick="openEditModal('${clientData}')">✏️ Edit</button></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Error loading directory:", err);
    }
}

// Helper: Print Receipt
window.printReceipt = function(base64Data) {
    const order = JSON.parse(atob(base64Data));
    const date = new Date().toLocaleDateString();

    const receiptHTML = `
        <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', sans-serif; color: #1e293b; padding: 40px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .brand { font-size: 28px; font-weight: bold; color: #0f172a; letter-spacing: 1px; }
                    .tagline { font-size: 14px; color: #64748b; margin-bottom: 10px; }
                    hr { border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0; }
                    .info-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 10px; margin-bottom: 30px; }
                    .label { font-weight: 600; color: #475569; }
                    .table-header { font-weight: bold; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; }
                    .row { display: flex; justify-content: space-between; padding: 8px 0; }
                    .footer { text-align: center; margin-top: 50px; font-style: italic; color: #475569; }
                    .balance-due { font-weight: bold; color: #b91c1c; font-size: 18px; border-top: 2px solid #e2e8f0; padding-top: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="brand">PRECISION TAILORS</div>
                    <div class="tagline">BESPOKE DESIGN & STYLING</div>
                    <small>Nairobi, Kenya • Tel: 0713592386</small>
                </div>
                <hr>
               <div class="info-grid">
    <div class="label">Invoice Date</div><div>${date}</div>
    <div class="label">Client Name</div><div>${order.name}</div>
    <div class="label">Garment</div><div>${order.garmentDesc}</div>
    <div class="label">Order Status</div><div style="font-weight:bold; color: #2563eb;">${order.status}</div>
</div>
                
                <div class="table-header"><span>DESCRIPTION</span><span>AMOUNT</span></div>
                <div class="row"><span>Total Charges</span><span>KSh ${Number(order.financials.total).toLocaleString()}</span></div>
                <div class="row" style="color: #059669;"><span>Amount Paid (Deposit)</span><span>- KSh ${Number(order.financials.deposit).toLocaleString()}</span></div>
                
                <div class="row balance-due"><span>Balance Due</span><span>KSh ${Number(order.financials.balance).toLocaleString()}</span></div>
                
                <div class="footer">
                    <p>Thank you for your business!</p>
                    <p><em>Style Tailored to Anywhere.</em></p>
                </div>
            </body>
        </html>
    `;

    const printWindow = window.open('', '_blank', 'width=600,height=800');
    printWindow.document.write(receiptHTML);
    printWindow.document.close(); // Essential for rendering
    
    // Brief delay to ensure fonts/CSS are loaded before print dialog
    setTimeout(() => { 
        printWindow.print(); 
    }, 500);
};
// Helper: Edit Client
window.openEditModal = async function(base64Data) {
    const client = JSON.parse(atob(base64Data));
    const newName = prompt("Update name:", client.name);
    if (newName === null) return;
    // ... (Your update logic)
    loadClientDirectory();
};

// 6. Analytics
// Updated Analytics with a minor delay for server stability
async function updateDashboardAnalytics() {
    console.log("Analytics: Starting fetch...");
    try {
        const response = await fetch("/api/analytics/summary");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        console.log("Analytics: Received data:", result);

        if (result.success) {
            const m = result.metrics;
            // Diagnostic logging to ensure elements are found
            const orderEl = document.getElementById("stat-total-orders");
            const paidEl = document.getElementById("stat-total-paid");
            const balEl = document.getElementById("stat-total-balances");

            if (!orderEl || !paidEl || !balEl) {
                console.error("Analytics Error: Could not find one of the display elements in the DOM!");
                return;
            }

            orderEl.innerText = (m.totalOrders || 0).toLocaleString();
            paidEl.innerText = `KSh ${(m.totalPaid || 0).toLocaleString()}`;
            balEl.innerText = `KSh ${(m.totalBalances || 0).toLocaleString()}`;
            console.log("Analytics: Successfully updated UI.");
        }
    } catch (err) {
        console.error("Analytics Error: Failed to fetch or update UI:", err);
    }
}
function setupBalanceCalculator() {
    const form = document.getElementById("tailorForm"); // Target the parent form
    if (!form) return;

    form.addEventListener("input", (e) => {
        // Only run logic if one of our target fields changed
        if (e.target.id === "totalPrice" || e.target.id === "depositPaid") {
            const total = parseFloat(document.getElementById("totalPrice").value) || 0;
            const deposit = parseFloat(document.getElementById("depositPaid").value) || 0;
            const balanceInput = document.getElementById("balanceDue");
            
            if (balanceInput) {
                const balance = total - deposit;
                balanceInput.value = balance >= 0 ? balance : 0;
            }
        }
    });
}