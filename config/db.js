const mongoose = require("mongoose");

async function configureDB() {
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log("connected to db");
    } catch (err) {
        console.log("error connecting to the db!");
    }
}

module.exports = configureDB;
