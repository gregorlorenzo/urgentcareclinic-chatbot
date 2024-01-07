const mongoose = require("mongoose");

const Announcement = mongoose.model(
    "Announcement",
    new mongoose.Schema({
        message: {
            type: String
        },
        createdAt: {
            type: Date,
            default: new Date()
        },
    })
);

module.exports = Announcement;