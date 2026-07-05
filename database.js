const { MongoClient } = require("mongodb");

// Reads your connection string securely from Render's dashboard environment panel
const uri = process.env.MONGO_URI || "YOUR_LOCAL_MONGODB_FALLBACK_STRING_IF_ANY";
const client = new MongoClient(uri);

let db = {
    orders: null,
    clients: null
};

async function connectDatabase() {
    try {
        await client.connect();
        const database = client.db("tailorProduction");
        
        // Map database collections to simulate the existing app structure
        db.orders = database.collection("orders");
        db.clients = database.collection("clients");
        
        console.log("🍃 Connected successfully to MongoDB Atlas Cloud Hub.");
    } catch (error) {
        console.error("Database connection failure:", error);
    }
}

connectDatabase();

module.exports = db;
