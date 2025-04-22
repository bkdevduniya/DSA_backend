const mongoose = require("mongoose");

const sheetSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        default:"for competitive programming"
    },
    questions: {
        type: Array,
        required: true,
        default: [],
        unique: true
    },
    followers:{
        type:Number,
        default:0
    }
    },{timestamps:true});

module.exports = mongoose.model("sheets", sheetSchema);