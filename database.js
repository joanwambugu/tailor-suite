const { MongoClient } = require("mongodb");

const uri = (process.env.MONGO_URI || "").trim();

const dummyFallback = {
    orders: { find: () => ({ sort: () => ({ toArray: async () => [] }) }), insertOne: async () => ({}) },
    clients: { find: () => ({ sort: () => ({ toArray: async () => [] }) }), updateOne: async () => ({}) }
};

if (!uri || (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://"))) {
    console.error("❌ CRITICAL: MONGO_URI is missing or has an invalid scheme format.");
    module.exports = dummyFallback;
} else {
    try {
        const client = new MongoClient(uri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000
        });

        const database = client.db("tailorProduction");

        const db = {
            orders: database.collection("orders"),
            clients: database.collection("clients")
        };

        // Run an immediate diagnostics ping test to catch bad passwords on bootup
        client.db("admin").command({ ping: 1 })
            .then(() => console.log("🍃 SUCCESS: Connected perfectly to MongoDB Atlas!"))
            .catch(err => {
                console.error("==========================================================================");
                console.error("❌ MONGODB CONFIGURATION OR AUTHENTICATION FAILURE:");
                console.error(err.message);
                console.error("Double-check your username, password, and IP whitelist on MongoDB Atlas.");
                console.error("==========================================================================");
            });

        module.exports = db;
    } catch (err) {
        console.error("❌ Driver initialization crash:", err.message);
        module.exports = dummyFallback;
    }
}