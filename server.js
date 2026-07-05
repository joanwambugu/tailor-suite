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
app.post("/api/orders", async (req, res) => {
    try {
        const { name, phone, measurements, garmentDesc, financials } = req.body;

        // Force explicit base-10 integer conversion at the API gateway entry point
        const total = parseInt(financials?.total, 10) || 0;
        const deposit = parseInt(financials?.deposit, 10) || 0;
        const balance = total - deposit; // Mathematically guaranteed true subtraction

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

        // 1. Save active order to MongoDB cloud cluster
        const savedOrder = await db.orders.insertOne(newOrder);

        // 2. Upsert permanent client measurements profile card
        const clientProfile = { 
            $set: { 
                name, 
                phone, 
                measurements, 
                updatedAt: new Date() 
            } 
        };
        await db.clients.updateOne({ phone: phone }, clientProfile, { upsert: true });

        // 3. Return clean JSON success payload
        res.status(201).json({ success: true, orderId: savedOrder.insertedId });

        // 4. Background SMS Dispatch Pipeline (Guaranteed clean numbers)
        if (sms) {
            const smsMessage = `Hello ${name}, your order for ${garmentDesc} has been received! Total: KSh ${total.toLocaleString()}, Paid: KSh ${deposit.toLocaleString()}, Balance: KSh ${newOrder.financials.balance.toLocaleString()}. Thank you!`;
            
            sms.send({ to: [phone], message: smsMessage })
                .then(response => console.log("SMS Notification Dispatched:", response))
                .catch(smsErr => console.log("SMS Gateway Offline (Order Saved Locally):", smsErr.message));
        }
    } catch (err) {
        console.error("Database Insert Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================================================
// API Route 2: Fetch all active tailoring orders
// ==========================================================================
app.get("/api/orders", async (req, res) => {
    try {
        const orders = await db.orders.find({}).sort({ createdAt: -1 }).toArray();
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================================================
// API Route 3: Fetch all saved client measurement logs
// ==========================================================================
app.get("/api/clients", async (req, res) => {
    try {
        const clients = await db.clients.find({}).sort({ name: 1 }).toArray();
        res.status(200).json(clients);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================================================
// API Route 4: Update an existing client's measurement profiles
// ==========================================================================
app.put("/api/clients/:phone", async (req, res) => {
    try {
        const clientPhone = req.params.phone;
        const { name, measurements } = req.body;

        const updatedData = { 
            $set: { 
                name: name,
                measurements: measurements, 
                updatedAt: new Date() 
            } 
        };

        const result = await db.clients.updateOne({ phone: clientPhone }, updatedData);
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, error: "Client record profile not found." });
        }
        
        res.status(200).json({ success: true, message: "Client dimensions updated successfully." });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================================================
// API Route 5: Live Financial & Order Metrics Summary
// ==========================================================================
app.get("/api/analytics/summary", async (req, res) => {
    try {
        const orders = await db.orders.find({}).toArray();
        
        let totalOrders = orders.length;
        let totalPaid = 0;
        let totalBalances = 0;
        
        orders.forEach(order => {
            // Re-enforce defensive base-10 resolution to handle legacy string entries cleanly
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
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log("🚀 Custom Tailor Suite engine active on port " + PORT));