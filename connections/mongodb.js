const mongoose = require("mongoose");

const connectDB = async (url) => {
    try {
        await mongoose.connect(url);
        console.log("MongoDB connected");
    } catch (err) {
        console.error(err.message);
    }
};

module.exports = connectDB;