const mongoose = require("mongoose");

const AppointmentBackUp = mongoose.model(
    "Appointment_BackUp",
    new mongoose.Schema({
        psid: {
            type: String,
            required: true,
        },

        fullName: {
            type: String,
            required: true,
        },

        appointmentNumber: {
            type: String,
        },

        doctorName: {
            type: String,
        },

        appointmentDate: {
            type: Date,
        },

        appointmentStatus: {
            type: String,
        },

        createdAt: {
            type: Date,
            default: new Date()
        },
    })
);

module.exports = AppointmentBackUp;