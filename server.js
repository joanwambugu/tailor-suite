const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./database");

const app = express();
app.use(express.json());
app.use(cors());

// Serve the frontend UI files automatically
app.use(express.static(path.join(__dirname, "public")));

// --- AFRICA'S TALKING SETUP ---
const credentials = {
    apiKey: "atsk_91d3fd9bb85c335e4fed6a82111f9f33e16c354803dc1395c88a6f0f770f26e5afeb9de2",
    username: "sandbox"
};

let sms;
try {
    const AfricasTalking = require("africastalking")(credentials);
    sms = AfricasTalking.SMS;
} catch (initErr) {
    console.error("SMS Gateway configuration initialization failed:", initErr.message);
}

// API Route 1: Save New Order and Client Profile Safely
app.post("/api/orders", (req, res) => {
    const { name, phone, measurements, garmentDesc, financials } = req.body;

    const newOrder = {
        name,
        phone,
        garmentDesc,
        financials,
        status: "Stitching",
        createdAt: new Date()
    };

    // 1. Save the active order details to local database
    db.orders.insert(newOrder, (err, savedOrder) => {
        if (err) {
            console.error("Database Insert Error:", err);
            return res.status(500).json({ success: false, error: err.message });
        }

        // 2. Upsert the permanent client profile card
        const clientProfile = { name, phone, measurements, updatedAt: new Date() };
        db.clients.update({ phone: phone }, clientProfile, { upsert: true }, (clientErr) => {
            if (clientErr) console.error("Failed to compile client history card:", clientErr);
        });

        // 3. Send immediate JSON success response to frontend so the UI doesn't hang
        res.status(201).json({ success: true, order: savedOrder });

        // 4. Fire-and-forget the SMS in the background
        if (sms) {
            const smsMessage = `Hello ${name}, your order for ${garmentDesc} has been received! Total: KSh ${financials.total}, Paid: KSh ${financials.deposit}, Balance: KSh ${financials.balance}. Thank you!`;
            
            sms.send({ to: [phone], message: smsMessage })
                .then(response => console.log("SMS Notification Dispatched:", response))
                .catch(smsErr => console.log("SMS Gateway Offline (Order Saved Locally):", smsErr.message));
        } else {
            console.log("SMS Service not initialized. Order saved locally.");
        }
    });
});

// API Route 2: Fetch all active tailoring orders
app.get("/api/orders", (req, res) => {
    db.orders.find({}).sort({ createdAt: -1 }).exec((err, docs) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.status(200).json(docs);
    });
});

// API Route 3: Fetch all saved client measurement logs
app.get("/api/clients", (req, res) => {
    db.clients.find({}).sort({ name: 1 }).exec((err, docs) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.status(200).json(docs);
    });
});

const PORT = 5000;
app.listen(PORT, () => console.log("🚀 Custom Tailor Suite engine active on http://localhost:" + PORT));