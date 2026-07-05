// --- NODE ENGINE DEPRECATION PATCH FOR NEDB ---
const util = require('util');
if (typeof util.isDate !== 'function') {
    util.isDate = function (obj) { return Object.prototype.toString.call(obj) === '[object Date]'; };
}
if (typeof util.RegExp !== 'function') {
    util.isRegExp = function (obj) { return Object.prototype.toString.call(obj) === '[object RegExp]'; };
}

const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./database");

const app = express();
app.use(express.json());
app.use(cors());
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

// Unified API Route: Save New Order and Client Profile
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

    // 1. Save the active order details
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

        // 3. Send success response
        res.status(201).json({ 
            success: true, 
            message: "Order saved",
            insertedId: savedOrder._id,
            order: savedOrder 
        });

        // 4. Fire-and-forget SMS
        if (sms) {
            const smsMessage = `Hello ${name}, your order for ${garmentDesc} has been received! Total: KSh ${financials.total}, Paid: KSh ${financials.deposit}, Balance: KSh ${financials.balance}. Thank you!`;
            sms.send({ to: [phone], message: smsMessage })
                .then(response => console.log("SMS Notification Dispatched:", response))
                .catch(smsErr => console.log("SMS Gateway Offline (Order Saved Locally):", smsErr.message));
        }
    });
});

// Other API Routes (GET, PUT) remain as they were
app.get("/api/orders", (req, res) => {
    db.orders.find({}).sort({ createdAt: -1 }).exec((err, docs) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.status(200).json(docs);
    });
});

app.get("/api/clients", (req, res) => {
    db.clients.find({}).sort({ name: 1 }).exec((err, docs) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.status(200).json(docs);
    });
});

app.put("/api/clients/:phone", (req, res) => {
    const { name, measurements } = req.body;
    db.clients.update({ phone: req.params.phone }, { $set: { name, measurements, updatedAt: new Date() } }, {}, (err, num) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (num === 0) return res.status(404).json({ success: false, error: "Not found" });
        res.status(200).json({ success: true });
    });
});

// Clean, single Analytics route
app.get("/api/analytics/summary", (req, res) => {
    try {
        db.orders.find({}, (err, orders) => {
            if (err) {
                console.error("Database read error:", err);
                return res.status(500).json({ success: false, metrics: { totalOrders: 0, totalPaid: 0, totalBalances: 0 } });
            }

            const metrics = orders.reduce((acc, order) => {
                const paid = Number(order.financials?.deposit) || 0;
                const balance = Number(order.financials?.balance) || 0;
                acc.totalOrders += 1;
                acc.totalPaid += paid;
                acc.totalBalances += balance;
                return acc;
            }, { totalOrders: 0, totalPaid: 0, totalBalances: 0 });

            res.json({ success: true, metrics });
        });
    } catch (error) {
        console.error("Route execution error:", error);
        res.status(500).json({ success: false, metrics: { totalOrders: 0, totalPaid: 0, totalBalances: 0 } });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("🚀 Custom Tailor Suite engine active on port " + PORT));