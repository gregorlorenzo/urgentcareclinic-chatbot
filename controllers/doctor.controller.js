const db = require("../models");
const Doctor = db.doctor;

exports.retrieveDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find({});
        return res.json(doctors);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.createDoctor = async (req, res) => {
  const query = req.body;

  const doctorSchedule = [
    {
      dayName: "Monday",
      isAvailable: "Not Available",
      slots: createSlots(),
    },
    {
      dayName: "Tuesday",
      isAvailable: "Not Available",
      slots: createSlots(),
    },
    {
      dayName: "Wednesday",
      isAvailable: "Not Available",
      slots: createSlots(),
    },
    {
      dayName: "Thursday",
      isAvailable: "Not Available",
      slots: createSlots(),
    },
    {
      dayName: "Friday",
      isAvailable: "Not Available",
      slots: createSlots(),
    },
  ];

  const doctorData = {
    doctorName: query.doctorName,
    doctorSpecialization: query.doctorSpecialization,
    doctorLicense: query.doctorLicense,
    doctorSchedule,
  };

  try {
    const doctors = await Doctor.create(doctorData);
    return res.json(doctors);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

function createSlots() {
  const slotTimes = [
    "9:00",
    "9:30",
    "10:00",
    "10:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
  ];

  return slotTimes.map((slotTime) => ({
    slotTime,
    isAvailable: "Available",
  }));
}

exports.updateSchedule = async (req, res) => {
    const { doctorLicense, monday, tuesday, wednesday, thursday, friday } = req.body;

    try {
        const doctors = await Doctor.findOneAndUpdate(
            { 'doctorLicense': doctorLicense },
            {
                '$set': {
                    'doctorSchedule.0.isAvailable': monday,
                    'doctorSchedule.1.isAvailable': tuesday,
                    'doctorSchedule.2.isAvailable': wednesday,
                    'doctorSchedule.3.isAvailable': thursday,
                    'doctorSchedule.4.isAvailable': friday
                }
            },
            { "new": true }
        );

        return res.json(doctors);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

exports.updateInfo = async (req, res) => {
    const { oldDoctorLicense, doctorLicense, doctorName, doctorSpecialization } = req.body;
    
    try {
        const updatedDoctor = await Doctor.findOneAndUpdate(
            { 'doctorLicense': oldDoctorLicense },
            { '$set': { 'doctorLicense': doctorLicense, 'doctorName': doctorName, 'doctorSpecialization': doctorSpecialization } },
            { "new": true }
        );
        
        return res.json(updatedDoctor);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

exports.deleteDoctor = async (req, res) => {
  const { doctorLicense } = req.query;

  try {
    const result = await Doctor.deleteMany({ doctorLicense });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
