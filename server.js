const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./database");

const app = express();
app.use(express.json());
app.use(cors());

// Serve the frontend UI files automatically
app.use(express.static(path.join(__dirname, "public")));

// --- AFRICA'S TALKING SETUP (SECURED FOR GITHUB) ---
const credentials = {
    apiKey: process.env.AT_API_KEY || "", 
    username: process.env.AT_USERNAME || "sandbox"
};

let sms;
if (credentials.apiKey) {
    try {
        const AfricasTalking = require("africastalking")(credentials);
        sms = AfricasTalking.SMS;
        console.log("ℹ️ SMS Gateway configured successfully.");
    } catch (initErr) {
        console.error("⚠️ SMS Gateway initialization failed:", initErr.message);
    }
} else {
    console.log("ℹ️ Running in local/offline mode (No SMS API Key detected).");
}

// ==========================================================================
// API Route 1: Save New Order and Client Profile Safely
// ==========================================================================
app.post("/api/orders", (req, res) => {
    const { name, phone, measurements, garmentDesc, financials } = req.body;

    const total = parseInt(financials?.total, 10) || 0;
    const deposit = parseInt(financials?.deposit, 10) || 0;
    const balance = total - deposit;

    const newOrder = {
        name,
        phone,
        garmentDesc,
        financials: {
            total,
            deposit,
            balance: balance >= 0 ? balance : 0
        },
        status: "Stitching",
        createdAt: new Date()
    };

    // 1. Insert into local orders datastore
    db.orders.insert(newOrder, (err, savedOrder) => {
        if (err) {
            console.error("Local Order Insert Error:", err);
            return res.status(500).json({ success: false, error: err.message });
        }

        // 2. Update/Upsert local permanent client profile card
        db.clients.update(
            { phone: phone },
            { $set: { name, phone, measurements, updatedAt: new Date() } },
            { upsert: true },
            (updateErr) => {
                if (updateErr) console.error("Local Client Profile Error:", updateErr.message);
            }
        );

        // 3. Return clean JSON success response instantly
        res.status(201).json({ success: true, orderId: savedOrder._id });

        // 4. Dispatch SMS pipeline
        if (sms) {
            const smsMessage = `Hello ${name}, your order for ${garmentDesc} has been received! Total: KSh ${total.toLocaleString()}, Paid: KSh ${deposit.toLocaleString()}, Balance: KSh ${newOrder.financials.balance.toLocaleString()}. Thank you!`;
            
            sms.send({ to: [phone], message: smsMessage })
                .then(response => console.log("SMS Notification Dispatched:", response))
                .catch(smsErr => console.log("SMS Gateway Offline (Saved Locally):", smsErr.message));
        }
    });
});

// ==========================================================================
// API Route 2: Fetch all active tailoring orders
// ==========================================================================
app.get("/api/orders", (req, res) => {
    db.orders.find({}).sort({ createdAt: -1 }).exec((err, orders) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.status(200).json(orders);
    });
});

// ==========================================================================
// API Route 3: Fetch all saved client measurement logs
// ==========================================================================
app.get("/api/clients", (req, res) => {
    db.clients.find({}).sort({ name: 1 }).exec((err, clients) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.status(200).json(clients);
    });
});

// ==========================================================================
// API Route 4: Update an existing client's measurement profiles
// ==========================================================================
app.put("/api/clients/:phone", (req, res) => {
    const clientPhone = req.params.phone;
    const { name, measurements } = req.body;

    db.clients.update(
        { phone: clientPhone },
        { $set: { name: name, measurements: measurements, updatedAt: new Date() } },
        {},
        (err, numReplaced) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            if (numReplaced === 0) {
                return res.status(404).json({ success: false, error: "Client record profile not found." });
            }
            res.status(200).json({ success: true, message: "Client dimensions updated successfully." });
        }
    );
});

// ==========================================================================
// API Route 5: Live Financial & Order Metrics Summary
// ==========================================================================
app.get("/api/analytics/summary", (req, res) => {
    db.orders.find({}, (err, orders) => {
        if (err) return res.status(500).json({ success: false, error: err.message });

        let totalOrders = orders.length;
        let totalPaid = 0;
        let totalBalances = 0;

        orders.forEach(order => {
            const total = parseInt(order.financials?.total, 10) || 0;
            const deposit = parseInt(order.financials?.deposit, 10) || 0;
            const balance = total - deposit;

            totalPaid += deposit;
            totalBalances += balance >= 0 ? balance : 0;
        });

        res.status(200).json({
            success: true,
            metrics: {
                totalOrders,
                totalPaid,
                totalBalances
            }
        });
    });
});

const PORT = 5000;
app.listen(PORT, () => console.log("🚀 Offline Local-Storage Tailor Suite active on port " + PORT));