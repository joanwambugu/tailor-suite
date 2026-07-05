// --- 1. Master Application Initialization Handler ---
document.addEventListener("DOMContentLoaded", () => {
    setupTabSwitching();
    setupBalanceCalculator();
    setupFormSubmission();
    loadActiveOrders();
    loadClientDirectory();
    updateDashboardAnalytics(); // Fire live metrics on initial platform load
});

// --- 2. Sidebar Tab Switching Logic ---
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

            // Refresh data dynamically when switching tabs
            if (targetTab === "orders-tab") loadActiveOrders();
            if (targetTab === "directory-tab") loadClientDirectory();
        });
    });
}

// --- 3. Live Dynamic Balance Calculator ---
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

// --- 4. Form Submission & Real-time Synchronization Hub ---
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
                alertDiv.innerText = "✨ Order logged! Client profile saved & confirmation text queued.";
                alertDiv.style.display = "block";
                form.reset();
                
                // Refresh data pipelines and update the side financial summary grid immediately
                loadActiveOrders();
                updateDashboardAnalytics();
            } else {
                throw new Error(data.error || "Failed layout insertion");
            }
        } catch (err) {
            alertDiv.className = "alert alert-error";
            alertDiv.innerText = "❌ Error: " + err.message;
            alertDiv.style.display = "block";
        }
    });
}

// --- 5. Production Tracking Board Render Pipeline ---
async function loadActiveOrders() {
    const tbody = document.getElementById("ordersTableBody");
    if (!tbody) return;

    try {
        const response = await fetch("/api/orders");
        const orders = await response.json();
        
        tbody.innerHTML = "";

        if (orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#6b7280;">No active production orders found.</td></tr>`;
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
                    <button class="btn-action btn-sms" onclick="alert('Sending fitting alert text to ${order.name}...')">💬 Fitting</button>
                    <button class="btn-action btn-complete" onclick="alert('Marking ready for collection...')">✅ Ready</button>
                    <button class="btn-action" style="background:#e2e8f0; color:#334155;" onclick="printReceipt('${orderData}')">🖨️ Print</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Error loading active orders:", err);
    }
}

// --- 6. Polished High-End Fashion Invoice Engine ---
window.printReceipt = function(base64Data) {
    const order = JSON.parse(atob(base64Data));
    const printWindow = window.open('', '_blank', 'width=500,height=700');
    
    const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Receipt - ${order.name}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
                body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 30px; color: #1e293b; background-color: #fff; font-size: 13px; line-height: 1.5; margin: 0; }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .brand-header { margin-bottom: 25px; }
                .brand-title { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 600; letter-spacing: 1px; color: #0f172a; margin: 0 0 4px 0; }
                .brand-subtitle { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; margin-bottom: 8px; }
                .brand-contact { font-size: 12px; color: #475569; }
                .divider { border-top: 1px solid #e2e8f0; margin: 20px 0; }
                .double-divider { border-top: 2px double #cbd5e1; margin: 15px 0; }
                .details-table, .financial-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                .details-table td { padding: 6px 0; vertical-align: top; }
                .details-table td.label { color: #64748b; width: 30%; font-weight: 500; }
                .details-table td.value { color: #0f172a; font-weight: 600; }
                .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #0f172a; margin: 25px 0 10px 0; }
                .financial-table th { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 8px 0; text-align: left; }
                .financial-table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
                .row-total { font-size: 13px; color: #475569; }
                .row-balance { font-size: 16px; font-weight: 700; color: #b91c1c; }
                .row-balance.cleared { color: #15803d; }
                .footer { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; margin-top: 45px; color: #64748b; text-align: center; }
                .tagline { font-family: 'Playfair Display', serif; font-style: italic; font-size: 13px; color: #475569; margin-top: 6px; }
            </style>
        </head>
        <body>
            <div class="text-center brand-header">
                <div class="brand-title">PRECISION TAILORS</div>
                <div class="brand-subtitle">Bespoke Design & Styling</div>
                <div class="brand-contact">Nairobi, Kenya &bull; Tel: 0713592386</div>
            </div>
            <div class="divider"></div>
            <table class="details-table">
                <tr><td class="label">Invoice Date</td><td class="value">${new Date(order.createdAt).toLocaleDateString('en-GB')}</td></tr>
                <tr><td class="label">Client Name</td><td class="value">${order.name}</td></tr>
                <tr><td class="label">Garment Description</td><td class="value">${order.garmentDesc}</td></tr>
                <tr><td class="label">Current Status</td><td class="value"><span style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase;">${order.status}</span></td></tr>
            </table>
            <div class="section-title">Financial Summary</div>
            <table class="financial-table">
                <thead><tr><th>Description</th><th class="text-right">Amount</th></tr></thead>
                <tbody>
                    <tr class="row-total"><td>Total Charges</td><td class="text-right">KSh ${Number(order.financials.total).toLocaleString()}</td></tr>
                    <tr class="row-total"><td>Amount Paid (Deposit)</td><td class="text-right" style="color: #16a34a;">- KSh ${Number(order.financials.deposit).toLocaleString()}</td></tr>
                    <tr class="row-balance">
                        <td style="padding-top: 15px; border-top: 1px dashed #cbd5e1;">Balance Due</td>
                        <td class="text-right ${Number(order.financials.balance) === 0 ? 'cleared' : ''}" style="padding-top: 15px; border-top: 1px dashed #cbd5e1;">KSh ${Number(order.financials.balance).toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>
            <div class="double-divider"></div>
            <div class="footer">Thank you for your business!<div class="tagline">Style Tailored to Anywhere.</div></div>
            <script>
                window.onload = function() {
                    document.title = "Receipt - ${order.name.replace(/'/g, "\\'")}";
                    window.print();
                    setTimeout(function() { window.close(); }, 500);
                };
            <\/script>
        </body>
        </html>
    `;
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
};

// --- 7. Client Profile Master Directory Loader ---
async function loadClientDirectory() {
    const tbody = document.getElementById("directoryTableBody");
    if (!tbody) return;

    try {
        const response = await fetch("/api/clients");
        const clients = await response.json();
        
        tbody.innerHTML = "";

        if (clients.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#6b7280;">No clients in directory database yet.</td></tr>`;
            return;
        }

        clients.forEach(client => {
            const m = client.measurements;
            const tr = document.createElement("tr");
            const clientData = btoa(JSON.stringify(client));

            tr.innerHTML = `
                <td><strong>${client.name}</strong></td>
                <td>${client.phone}</td>
                <td>
                    Sh: ${m.shoulder || 0}" | Chst: ${m.chest || 0}" | Slv: ${m.sleeve || 0}" | Wst: ${m.waist || 0}" | Lng: ${m.trouserLength || 0}"
                </td>
                <td>
                    <button class="btn-action" style="background:#f1f5f9; color:#0f172a;" onclick="openEditModal('${clientData}')">✏️ Edit</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Error loading client directory:", err);
    }
}

// --- 8. Administrative Prompt Modifier Tool ---
window.openEditModal = async function(base64Data) {
    const client = JSON.parse(atob(base64Data));
    
    const newName = prompt(`Update client name for ${client.name}:`, client.name);
    if (newName === null) return; 

    const newShoulder = prompt("Enter new Shoulder measurement (\"):", client.measurements.shoulder || 0);
    const newChest = prompt("Enter new Chest measurement (\"):", client.measurements.chest || 0);
    const newWaist = prompt("Enter new Waist measurement (\"):", client.measurements.waist || 0);
    const newLength = prompt("Enter new Trouser/Garment Length (\"):", client.measurements.trouserLength || 0);

    const updatedPayload = {
        name: newName.trim(),
        measurements = {
            ...client.measurements,
            shoulder: newShoulder,
            chest: newChest,
            waist: newWaist,
            trouserLength: newLength
        }
    };

    try {
        const response = await fetch(`/api/clients/${client.phone}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedPayload)
        });

        const result = await response.json();
        if (response.ok && result.success) {
            alert("✨ Client profile measurements modified successfully!");
            loadClientDirectory(); 
        } else {
            alert("❌ Update failed: " + result.error);
        }
    } catch (err) {
        console.error("Client update error:", err);
        alert("❌ Error communicating with backend server instances.");
    }
};

// --- 9. Real-time Side Metric Panel Pipeline ---
async function updateDashboardAnalytics() {
    try {
        const response = await fetch("/api/analytics/summary");
        const result = await response.json();
        
        if (response.ok && result.success) {
            const m = result.metrics;
            
            document.getElementById("stat-total-orders").innerText = m.totalOrders.toLocaleString();
            document.getElementById("stat-total-paid").innerText = `KSh ${m.totalPaid.toLocaleString()}`;
            document.getElementById("stat-total-balances").innerText = `KSh ${m.totalBalances.toLocaleString()}`;
        }
    } catch (err) {
        console.error("Error loading metrics:", err);
    }
}