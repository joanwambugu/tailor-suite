const { MongoClient } = require("mongodb");

// Securely read connection string from Render environment configurations
const uri = (process.env.MONGO_URI || "").trim();

// Setup a safe fallback interface object to keep the server running if configurations fail
const dummyFallback = {
    orders: { find: () => ({ sort: () => ({ toArray: async () => [] }) }), insertOne: async () => ({}) },
    clients: { find: () => ({ sort: () => ({ toArray: async () => [] }) }), updateOne: async () => ({}) }
};

// 1. Structural Guard: Check if empty
if (!uri) {
    console.error("==========================================================================");
    console.error("❌ CRITICAL CONFIGURATION ERROR: 'MONGO_URI' is empty or undefined on Render.");
    console.error("==========================================================================");
    module.exports = dummyFallback;
} 
// 2. Scheme Guard: Enforce strict connection string prefixes
else if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    console.error("==========================================================================");
    console.error("❌ CRITICAL DATABASE SCHEME VALUE ERROR:");
    console.error("Your MONGO_URI variable exists on Render, but its formatting is invalid.");
    console.error("It must explicitly begin with 'mongodb://' or 'mongodb+srv://'.");
    console.error("==========================================================================");
    module.exports = dummyFallback;
} 
// 3. Resilient Initialization Pipeline
else {
    try {
        // Instantiate the client with built-in connection pool parameters
        const client = new MongoClient(uri, {
            maxPoolSize: 10,             // Maintain up to 10 active concurrent sockets
            serverSelectionTimeoutMS: 5000 // Timeout early instead of locking the thread if cluster is unreachable
        });

        const database = client.db("tailorProduction");

        // Export collections directly. The driver will lazily connect and auto-heal sockets natively!
        const db = {
            orders: database.collection("orders"),
            clients: database.collection("clients")
        };

        console.log("🍃 MongoDB driver interface pooling pipeline established.");
        module.exports = db;
        
    } catch (instantiationError) {
        console.error("❌ Failed to instantiate MongoClient driver interface:", instantiationError.message);
        module.exports = dummyFallback;
    }
}