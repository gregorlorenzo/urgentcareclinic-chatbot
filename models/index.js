const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

db.user = require("./user.model");
db.appointment = require("./appointment.model");
db.appointmentbackup = require("./appointmentbackup.model");
db.doctor = require("./doctor.model");
db.announcement = require("./announcement.model");
db.information = require("./information.model");

module.exports = db;