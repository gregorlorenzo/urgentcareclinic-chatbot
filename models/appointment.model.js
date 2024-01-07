const mongoose = require("mongoose");

const Appointment = mongoose.model(
    "Appointment",
    new mongoose.Schema({
        psid: {
            type: String,
            required: true,
        },

        fullName: {
            type: String,
            required: true,
        },

        appointment: [{
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

            rescheduleCount: {
                type: Number,
                default: 0
            }
        }]
    })
);

module.exports = Appointment;