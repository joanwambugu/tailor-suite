document.addEventListener("DOMContentLoaded", () => {
    setupTabSwitching();
    setupBalanceCalculator();
    setupFormSubmission();
    loadActiveOrders();
    loadClientDirectory();
});

// 1. Sidebar Tab Switching Logic
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

// 3. Form Submission to Save New Orders
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
                loadActiveOrders();
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

// Updated Load Active Orders with Print Functionality
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
            
            // Escape values safely to embed in onclick attributes
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

// Global helper function to format and print the receipt layout
window.printReceipt = function(base64Data) {
    const order = JSON.parse(atob(base64Data));
    
    // Create a temporary iframe or print window to isolate the receipt layout style
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    
    const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receipt - ${order.name}</title>
            <style>
                body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #000; font-size: 14px; line-height: 1.4; }
                .text-center { text-align: center; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                .flex-row { display: flex; justify-content: space-between; }
                .bold { font-weight: bold; }
                .header-title { font-size: 18px; font-weight: bold; margin: 5px 0; }
                .footer { font-size: 11px; margin-top: 25px; text-align: center; }
            </style>
        </head>
        <body>
            <div class="text-center">
                <div class="header-title">PRECISION TAILORS</div>
                <div>Nairobi, Kenya</div>
                <div>Tel: ${order.phone}</div>
            </div>
            
            <div class="divider"></div>
            
            <div><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</div>
            <div><strong>Client:</strong> ${order.name}</div>
            <div><strong>Garment:</strong> ${order.garmentDesc}</div>
            <div><strong>Status:</strong> ${order.status}</div>
            
            <div class="divider"></div>
            <div class="bold">FINANCIAL SUMMARY</div>
            <div class="divider"></div>
            
            <div class="flex-row"><span>Total Charges:</span><span>KSh ${Number(order.financials.total).toLocaleString()}</span></div>
            <div class="flex-row"><span>Amount Paid:</span><span>KSh ${Number(order.financials.deposit).toLocaleString()}</span></div>
            <div class="divider"></div>
            <div class="flex-row bold"><span>Balance Due:</span><span>KSh ${Number(order.financials.balance).toLocaleString()}</span></div>
            
            <div class="divider"></div>
            <div class="footer">
                Thank you for your business!<br>
                Style Tailored to Anywhere.
            </div>
            
            <script>
                window.onload = function() {
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

// 5. Load Permanent Client Measurements History Directory
async function loadClientDirectory() {
    const tbody = document.getElementById("directoryTableBody");
    if (!tbody) return;

    try {
        const response = await fetch("/api/clients");
        const clients = await response.json();
        
        tbody.innerHTML = "";

        if (clients.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#6b7280;">No clients in directory database yet.</td></tr>`;
            return;
        }

        clients.forEach(client => {
            const m = client.measurements;
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${client.name}</strong></td>
                <td>${client.phone}</td>
                <td>
                    Sh: ${m.shoulder || 0}" | 
                    Chst: ${m.chest || 0}" | 
                    Slv: ${m.sleeve || 0}" | 
                    Wst: ${m.waist || 0}" | 
                    Lng: ${m.trouserLength || 0}"
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Error loading client directory:", err);
    }
}