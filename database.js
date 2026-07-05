const Datastore = require("nedb");
const path = require("path");

// Initialize automatic local file-based data stores
const db = {
    orders: new Datastore({ 
        filename: path.join(__dirname, "data", "orders.db"), 
        autoload: true 
    }),
    clients: new Datastore({ 
        filename: path.join(__dirname, "data", "clients.db"), 
        autoload: true 
    })
};

console.log("📁 Local File Database initialized safely. Data storing in /data folder.");

module.exports = db;