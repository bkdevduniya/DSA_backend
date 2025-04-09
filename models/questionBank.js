const mongoose = require("mongoose");

const questionBankSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true,
        unique: true
    },
    platform: {
        type: String,
        required: true,
    },
    problemUrl: {
        type: String,
        required: true,
        unique: true
    },
    tags: {
        type: String,
        required: true,
    },
    difficulty: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        required: true,
    },
    companies:{
        type: [String]
    }
},{timestamps:true});



module.exports = mongoose.model("questionbank", questionBankSchema);