const Datastore = require("nedb");
const path = require("path");

const db = {};

db.orders = new Datastore({ 
    filename: path.join(__dirname, "data", "orders.db"), 
    autoload: true 
});

db.clients = new Datastore({ 
    filename: path.join(__dirname, "data", "clients.db"), 
    autoload: true 
});

db.clients.ensureIndex({ fieldName: "phone", unique: true }, (err) => {
    if (err) console.error("Database tracking index error:", err);
});

module.exports = db;
