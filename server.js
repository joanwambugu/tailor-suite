const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./database"); // Assumes you have this file

const app = express();
app.use(express.json());
app.use(cors());

// --- API ROUTES (Must come before static) ---
app.post("/api/orders", (req, res) => {
    const { name, phone, measurements, garmentDesc, financials } = req.body;
    const newOrder = { 
        name, phone, measurements, garmentDesc, financials, 
        status: "Stitching", 
        createdAt: new Date() 
    };

    db.orders.insert(newOrder, (err, savedOrder) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        
        db.clients.update({ phone: phone }, { $set: { name, phone, measurements } }, { upsert: true });
        
        res.status(201).json({ success: true, insertedId: savedOrder._id });
    });
});

app.get("/api/orders", (req, res) => {
    db.orders.find({}).sort({ createdAt: -1 }).exec((err, orders) => {
        if (err) return res.status(500).json([]);
        res.json(orders);
    });
});

app.get("/api/analytics/summary", (req, res) => {
    db.orders.find({}, (err, orders) => {
        if (err) return res.status(500).json({ success: false });
        let totalPaid = 0, totalBalances = 0;
        orders.forEach(o => {
            totalPaid += parseInt(o.financials?.deposit || 0, 10);
            totalBalances += parseInt(o.financials?.balance || 0, 10);
        });
        res.json({ success: true, metrics: { totalOrders: orders.length, totalPaid, totalBalances } });
    });
});

// --- STATIC FILES (Last) ---
app.use(express.static(path.join(__dirname, "public")));

const PORT = 5000;
app.listen(PORT, () => console.log("🚀 Server running on http://localhost:5000"));