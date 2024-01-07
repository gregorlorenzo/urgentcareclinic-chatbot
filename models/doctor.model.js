const mongoose = require("mongoose");

const Doctor = mongoose.model(
    "Doctor",
    new mongoose.Schema({
        doctorName: {
            type: String,
            required: true,
        },

        doctorSpecialization: {
            type: String,
            required: true,
        },

        doctorSchedule: [{
            dayName: {
                type: String,
                required: true
            },

            isAvailable: {
                type: String,
                required: true
            },

            slots: [{
                slotTime: {
                    type: String,
                    required: true
                },

                isAvailable: {
                    type: String,
                    required: true
                }
            }]
        }],

        doctorLicense: {
            type: String,
            required: true,
        }
    })
);

module.exports = Doctor;