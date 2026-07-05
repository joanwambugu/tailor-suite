const Datastore = require("nedb");
const path = require("path");
const fs = require("fs");

// Ensure the data directory exists
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Initialize automatic local file-based data stores
const db = {
    orders: new Datastore({ 
        filename: path.join(dataDir, "orders.db"), 
        autoload: true 
    }),
    clients: new Datastore({ 
        filename: path.join(dataDir, "clients.db"), 
        autoload: true 
    })
};

console.log("📁 Local File Database initialized safely. Data storing in /data folder.");

module.exports = db;