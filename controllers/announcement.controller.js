const db = require("../models");
const Announcement = db.announcement;

//* Retrieve Appointments -- Tested: GOOD
exports.getAnnouncement = async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({"createdAt": -1})
        return res.json(announcements)
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}

exports.postAnnouncement = async (req, res) => {
    const filter = req.query

    try {
        const announcements = await Announcement.create(filter)
        return res.json(announcements)
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}