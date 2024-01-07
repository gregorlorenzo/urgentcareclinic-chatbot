const db = require("../models");
var mongoose = require('mongoose');
const Appointment = db.appointment;
const AppointmentBackUp = db.appointmentbackup;
const axios = require('axios');
const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' };

require('dotenv').config();

exports.retrieveAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.aggregate([
            { "$unwind": "$appointment" },
            {
                "$project": {
                    "_id": 0,
                    "psid": "$psid",
                    "title": "$fullName",
                    "start": "$appointment.appointmentDate",
                    "createdAt": "$appointment.createdAt",
                    "appointmentNumber": "$appointment.appointmentNumber",
                    "doctorName": "$appointment.doctorName",
                    "appointmentStatus": "$appointment.appointmentStatus"
                }
            }
        ]);
        return res.json(appointments);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.retrievePendingAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.aggregate([
            { $unwind: "$appointment" },
            { $match: { "appointment.appointmentStatus": "Pending" } },
            {
                $project: {
                    _id: 0,
                    psid: "$psid",
                    title: "$fullName",
                    start: "$appointment.appointmentDate",
                    createdAt: "$appointment.createdAt",
                    appointmentNumber: "$appointment.appointmentNumber",
                    doctorName: "$appointment.doctorName",
                    appointmentStatus: "$appointment.appointmentStatus"
                }
            },
            { $sort: { createdAt: 1 } }
        ]);
        return res.json(appointments);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

exports.retrieveActiveAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.aggregate([
            { "$unwind": "$appointment" },
            { "$match": { "appointment.appointmentStatus": "Active" } },
            {
                "$project": {
                    "_id": 0,
                    "psid": "$psid",
                    "title": "$fullName",
                    "start": "$appointment.appointmentDate",
                    "createdAt": "$appointment.createdAt",
                    "appointmentNumber": "$appointment.appointmentNumber",
                    "doctorName": "$appointment.doctorName",
                    "appointmentStatus": "$appointment.appointmentStatus"
                }
            },
            { "$sort": { "start": 1 } }
        ]);
        return res.json(appointments);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

//* Retrieve Appointments Completed Appointments -- Tested: GOOD
exports.retrieveCompletedAppointments = async (req, res) => {
    try {
        const appointments = await AppointmentBackUp.find({ "appointmentStatus": "Completed" })
        return res.json(appointments)
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}

//* Retrieve Appointments Cancelled Appointments -- Tested: GOOD
exports.retrieveCancelledAppointments = async (req, res) => {
    try {
        const appointments = await AppointmentBackUp.find({ "appointmentStatus": "Cancelled" })
        return res.json(appointments)
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}

exports.retrieveAppointmentsRange = async (req, res) => {
    try {
        const filter = req.query;
        const startDate = filter.startDate;
        const endDate = filter.endDate;
        const appointmentNumbers = [];

        const appointments = await Appointment.aggregate([
            { "$unwind": "$appointment" },
            { "$match": { "appointment.appointmentDate": { "$gte": new Date(parseInt(startDate)), "$lt": new Date(parseInt(endDate)) } } }
        ]);

        for (let i = 0; i < appointments.length; i++) {
            appointments[i].appointment.appointmentStatus = "Cancelled";
            appointmentNumbers.push(appointments[i].appointment.appointmentNumber);
            
            const appointment = appointments[i].appointment;
            const date = new Date(appointment.appointmentDate);
            const oldAppointment = {
                psid: appointments[i].psid,
                fullName: appointments[i].fullName,
                appointmentNumber: appointment.appointmentNumber,
                doctorName: appointment.doctorName,
                appointmentDate: appointment.appointmentDate,
                appointmentStatus: appointment.appointmentStatus,
                createdAt: new Date(),
                _id: mongoose.Types.ObjectId()
            };
            
            await AppointmentBackUp.create(oldAppointment);
        }

        await Appointment.updateMany({}, { "$pull": { "appointment": { "appointmentNumber": appointmentNumbers } } });

        return res.json(appointments);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

//* Find user by name -- Tested: GOOD
// Find appointment by name
exports.findAppointmentByName = async (req, res) => {
    try {
        // Extract the fullName from query
        const { fullName } = req.query;

        // Return error if fullName is undefined
        if (!fullName) {
            return res.status(404).send({ message: 'Please enter a full name' });
        }

        // Find the appointment using case-insensitive regex
        const appointment = await Appointment.findOne({ fullName: { $regex: fullName, $options: 'i' } });

        // Return error if appointment is not found
        return appointment ? res.json(appointment) : res.status(404).json({ message: 'User not found' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.updateAppointmentStatus = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).send({ message: "Data to update cannot be empty!" });
        }

        const filter = req.query;
        const newStatus = req.body.appointmentStatus;

        const appointment = await Appointment.findOneAndUpdate(
            { 
                fullName: { $regex: filter.fullName, $options: "i" },
                "appointment.appointmentNumber": filter.appointmentNumber
            },
            { $set: { "appointment.$.appointmentStatus": newStatus } },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({ message: "Failed to update appointment" });
        }
        
        return res.json(appointment);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

exports.actionAppointment = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).send({ message: "Data to update cannot be empty!" });
        }

        const filter = req.query;
        const appointmentStatus = req.body.appointmentStatus;

        const result = await Appointment.findOne({
            fullName: { $regex: filter.fullName, $options: "i" },
            appointment: { $elemMatch: { appointmentNumber: filter.appointmentNumber } }
        });

        const oldAppointment = {
            psid: result.psid,
            fullName: result.fullName,
            appointmentNumber: result.appointment[0].appointmentNumber,
            doctorName: result.appointment[0].doctorName,
            appointmentDate: result.appointment[0].appointmentDate,
            appointmentStatus,
            createdAt: new Date(),
            _id: mongoose.Types.ObjectId()
        };

        await AppointmentBackUp.create(oldAppointment);

        await Appointment.updateOne(
            { psid: result.psid },
            { $pull: { appointment: { appointmentNumber: filter.appointmentNumber } } }
        );

        return res.status(200).json({ message: "Appointment status updated" });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};


