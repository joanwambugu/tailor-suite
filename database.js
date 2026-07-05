const { MongoClient } = require("mongodb");

// Securely read connection string from Render environment configurations
const uri = process.env.MONGO_URI;

// Defensive check: If the variable is missing, intercept early with a clear warning
if (!uri || uri.trim() === "") {
    console.error("==========================================================================");
    console.error("❌ CRITICAL DATABASE APPLICATION CONFIGURATION ERROR:");
    console.error("The 'MONGO_URI' environment variable is empty or completely undefined.");
    console.error("Please add it under your Web Service 'Environment' configuration tab on Render.");
    console.error("==========================================================================");
    
    // Fallback to a dummy object interface to prevent crash on require() instantiation loops
    module.exports = {
        orders: { find: () => ({ sort: () => ({ toArray: async () => [] }) }), insertOne: async () => ({}) },
        clients: { find: () => ({ sort: () => ({ toArray: async () => [] }) }), updateOne: async () => ({}) }
    };
} else {
    const client = new MongoClient(uri);
    const database = client.db("tailorProduction");

    const db = {
        orders: database.collection("orders"),
        clients: database.collection("clients")
    };

    client.connect()
        .then(() => console.log("🍃 Connected successfully to MongoDB Atlas Cloud Hub."))
        .catch(err => console.error("❌ MongoDB connection failure:", err.message));

    module.exports = db;
}