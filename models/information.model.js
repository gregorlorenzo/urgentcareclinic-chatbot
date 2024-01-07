const mongoose = require("mongoose");

const Information = mongoose.model(
    "Information",
    new mongoose.Schema({
        informationName: {
            type: String
        },
        description: {
            type: String,
        },
    })
);

module.exports = Information;