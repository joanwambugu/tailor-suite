const { MongoClient } = require("mongodb");

// Reads your connection string securely from Render's dashboard environment panel
const uri = process.env.MONGO_URI;

if (!uri) {
    console.error("❌ CRITICAL ERROR: MONGO_URI environment variable is missing on Render!");
}

const client = new MongoClient(uri);

// Connect directly to your specific database namespace
const database = client.db("tailorProduction");

// Export the collection pointers immediately so server.js can hook into them on bootup
const db = {
    orders: database.collection("orders"),
    clients: database.collection("clients")
};

// Fire the connection in the background without blocking the initialization export
client.connect()
    .then(() => console.log("🍃 Connected successfully to MongoDB Atlas Cloud Hub."))
    .catch(err => console.error("❌ MongoDB connection failure:", err.message));

module.exports = db;